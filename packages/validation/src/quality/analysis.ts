/**
 * Selection, fit, calibration and final evaluation of the error model, exactly as the
 * protocol fixes them (`protocol.md`, sections 3 to 7). Pure: the same rows give the
 * same result, bit for bit. Simulated data.
 *
 * The true values in the rows are used for errors and labels only. The model itself
 * reads the engine's features of each exam (`errorFeatureValues`), as in the application.
 */
import {
  BM_ROUGHNESS_FOLDS_UM,
  TRT_CLINICALLY_CONCERNING_UM,
  TRT_FIRST_SIGN_UM,
  probabilityBeyond,
  type CrewId,
  type ExamQuality,
} from '@app/core';
import {
  ERROR_FEATURE_IDS,
  errorFeatureValues,
  simulatedErrorModel,
  supportOf,
  type ErrorFeature,
  type ExamErrorTerm,
  type SimulatedErrorModelSpec,
} from '@app/core/rules/simulatedErrorModel';
import type { CriterionResult, MeasureResult, PartitionSummary, ValidationMeasure, ValidationPartition, ValidationSummary } from '@app/core/dataset/validationSummary';
import { DEV_FAMILIES, HELD_OUT_FAMILIES, LEVELS, type Family } from './protocol';
import type { QualityRow, QualityRowsFile } from './rows';
import { mean, nelderMead, pearson, quantile, rmse, sd, wilson } from './stats';

export const MODEL_VERSION = 'sim-1';
const Z95 = 1.96;
const PARTITIONS: readonly ValidationPartition[] = ['development', 'test-anatomy', 'test-family'];
const TEST_PARTITIONS: readonly ValidationPartition[] = ['test-anatomy', 'test-family'];
const MEASURES: readonly ValidationMeasure[] = ['trt', 'roughness'];
const DEV_CREW: readonly CrewId[] = ['A', 'B', 'D'];

/** Protocol, section 4. */
const SELECTION_MIN_GAIN = 2;
const SELECTION_MAX_FEATURES = 3;

/** Protocol, section 6: engineering tolerances of this project, not NASA thresholds. */
export const TOLERANCES = {
  /** Spec 01, test 6. */
  trtChangeUm: 6,
  /** Spec 01, test 6. */
  roughnessChangeUm: 1.5,
  minCoverage: 0.9,
  minCoverageLow: 0.85,
  maxBeyond3Se: 0.02,
  minPairs: 50,
  maxCleanModelRefused: 0.1,
} as const;

/** Quality bands of today's exam, protocol section 5. */
const QUALITY_BANDS: readonly { label: string; low: number; high: number }[] = [
  { label: '< 18 dB', low: -Infinity, high: 18 },
  { label: '18–21 dB', low: 18, high: 21 },
  { label: '21–24 dB', low: 21, high: 24 },
  { label: '≥ 24 dB', low: 24, high: Infinity },
];

// ------------------------------------------------------------------- Pairs

export interface Exam {
  row: QualityRow;
  quality: ExamQuality;
  trtUm: number;
  roughnessUm: number;
}

export interface Pair {
  partition: ValidationPartition;
  family: Family;
  level: string;
  crewId: CrewId;
  eyeKey: string;
  flightDay: number;
  current: Exam;
  reference: Exam;
  /** Measured and true change, and error = measured − true, per measure. µm. */
  measured: Record<ValidationMeasure, number>;
  truth: Record<ValidationMeasure, number>;
  error: Record<ValidationMeasure, number>;
  /** Error of each exam against its own true value. µm. */
  examError: { current: Record<ValidationMeasure, number>; reference: Record<ValidationMeasure, number> };
}

function qualityOf(row: QualityRow): ExamQuality {
  const m = row.measurement!;
  const features: Record<string, number> = {};
  for (const [key, value] of Object.entries(m.features)) features[key] = value ?? NaN;
  return { usableScans: Math.round((features.usableFraction ?? 0) * 48), totalScans: 48, meanQualityDb: m.meanQualityDb, minQualityDb: NaN, decentrationUm: features.decentrationUm ?? NaN, features };
}

function examOf(row: QualityRow): Exam | null {
  const m = row.measurement;
  if (!m || m.status !== 'measured' || m.trtUm === null || m.roughnessUm === null) return null;
  return { row, quality: qualityOf(row), trtUm: m.trtUm, roughnessUm: m.roughnessUm };
}

const eyeKey = (row: QualityRow) => `${row.crewId} ${row.eye}`;

export function buildPairs(rows: readonly QualityRow[]): Pair[] {
  const references = new Map<string, Exam>();
  for (const row of rows) {
    if (row.role !== 'reference') continue;
    const exam = examOf(row);
    if (exam) references.set(`${eyeKey(row)} ${row.level.replace('reference ', '')}`, exam);
  }
  const pairs: Pair[] = [];
  for (const row of rows) {
    if (row.role !== 'follow-up' || !row.reference) continue;
    const current = examOf(row);
    const reference = references.get(`${eyeKey(row)} ${row.reference}`);
    if (!current || !reference) continue;
    const measured = { trt: current.trtUm - reference.trtUm, roughness: current.roughnessUm - reference.roughnessUm };
    const truth = { trt: row.truth.trtUm - reference.row.truth.trtUm, roughness: row.truth.roughnessUm - reference.row.truth.roughnessUm };
    pairs.push({
      partition: row.partition,
      family: row.family,
      level: row.level,
      crewId: row.crewId,
      eyeKey: eyeKey(row),
      flightDay: row.flightDay,
      current,
      reference,
      measured,
      truth,
      error: { trt: measured.trt - truth.trt, roughness: measured.roughness - truth.roughness },
      examError: {
        current: { trt: current.trtUm - row.truth.trtUm, roughness: current.roughnessUm - row.truth.roughnessUm },
        reference: { trt: reference.trtUm - reference.row.truth.trtUm, roughness: reference.roughnessUm - reference.row.truth.roughnessUm },
      },
    });
  }
  return pairs;
}

// ------------------------------------------------------------------- Model

type Domain = SimulatedErrorModelSpec['domain'];

/** Range of every candidate variable over the accepted development exams (references and follow-ups). */
export function developmentDomain(rows: readonly QualityRow[]): Domain {
  const domain = {} as Domain;
  for (const id of ERROR_FEATURE_IDS) domain[id] = { min: Infinity, max: -Infinity };
  for (const row of rows) {
    if (row.partition !== 'development') continue;
    const exam = examOf(row);
    if (!exam) continue;
    const values = errorFeatureValues(exam.quality);
    for (const id of ERROR_FEATURE_IDS) {
      const value = values[id];
      if (!Number.isFinite(value)) continue;
      domain[id].min = Math.min(domain[id].min, value);
      domain[id].max = Math.max(domain[id].max, value);
    }
  }
  return domain;
}

interface PreparedPair {
  error: number;
  current: number[];
  reference: number[];
}

/** Clipped values of the chosen variables of both exams. */
function prepare(pairs: readonly Pair[], measure: ValidationMeasure, features: readonly ErrorFeature[], domain: Domain): PreparedPair[] {
  const values = (exam: Exam) => {
    const all = errorFeatureValues(exam.quality);
    return features.map((id) => Math.max(all[id], domain[id].min));
  };
  return pairs.map((p) => ({ error: p.error[measure], current: values(p.current), reference: values(p.reference) }));
}

function sigma2(params: readonly number[], pair: PreparedPair): number {
  let a = params[0]!;
  let b = params[0]!;
  for (let j = 0; j < pair.current.length; j++) {
    a += params[j + 1]! * pair.current[j]!;
    b += params[j + 1]! * pair.reference[j]!;
  }
  return Math.exp(2 * a) + Math.exp(2 * b);
}

/** Negative log-likelihood of normal errors with σ² = s(today)² + s(reference)². */
function nll(params: readonly number[], pairs: readonly PreparedPair[], k = 1): number {
  let total = 0;
  for (const p of pairs) {
    const s2 = k * k * sigma2(params, p);
    total += 0.5 * Math.log(2 * Math.PI * s2) + (p.error * p.error) / (2 * s2);
  }
  return total;
}

function fitParams(pairs: readonly PreparedPair[], dims: number): number[] {
  const scale = rmse(pairs.map((p) => p.error)) / Math.SQRT2;
  const start = [Math.log(Math.max(scale, 1e-3)), ...new Array<number>(dims).fill(0)];
  let result = nelderMead((x) => nll(x, pairs), start);
  // A restart from the best point, the usual guard against an early stop of Nelder–Mead.
  result = nelderMead((x) => nll(x, pairs), result.x, 0.1);
  return result.x;
}

interface FeatureSet {
  features: ErrorFeature[];
  /** Out-of-sample negative log-likelihood, summed over the folds that leave one crew member out. */
  cvNll: number;
  params: number[];
}

function crossValidate(pairs: readonly Pair[], measure: ValidationMeasure, features: ErrorFeature[], domain: Domain): { cvNll: number; z: number[] } {
  let cvNll = 0;
  const z: number[] = [];
  for (const crew of DEV_CREW) {
    const train = prepare(pairs.filter((p) => p.crewId !== crew), measure, features, domain);
    const test = prepare(pairs.filter((p) => p.crewId === crew), measure, features, domain);
    const params = fitParams(train, features.length);
    cvNll += nll(params, test);
    for (const p of test) z.push(p.error / Math.sqrt(sigma2(params, p)));
  }
  return { cvNll, z };
}

export interface SelectionStep {
  features: ErrorFeature[];
  cvNll: number;
  betas: number[];
  accepted: boolean;
  note: string;
}

export interface MeasureFit {
  measure: ValidationMeasure;
  steps: SelectionStep[];
  chosen: FeatureSet;
  /** Out-of-fold |z| quantile 0.95 and the calibration factor k it gives. */
  q95AbsZ: number;
  k: number;
  term: ExamErrorTerm;
}

function fitMeasure(devPairs: readonly Pair[], measure: ValidationMeasure, domain: Domain): MeasureFit {
  const steps: SelectionStep[] = [];
  const full = (features: ErrorFeature[]) => fitParams(prepare(devPairs, measure, features, domain), features.length);
  let current: FeatureSet = { features: [], cvNll: crossValidate(devPairs, measure, [], domain).cvNll, params: full([]) };
  steps.push({ features: [], cvNll: current.cvNll, betas: [], accepted: true, note: 'constant only' });
  while (current.features.length < SELECTION_MAX_FEATURES) {
    let best: FeatureSet | null = null;
    for (const id of ERROR_FEATURE_IDS) {
      if (current.features.includes(id)) continue;
      const features = [...current.features, id];
      const params = full(features);
      const cv = crossValidate(devPairs, measure, features, domain).cvNll;
      const negative = params.slice(1).some((beta) => beta < 0);
      steps.push({ features, cvNll: cv, betas: params.slice(1), accepted: false, note: negative ? 'a coefficient is negative: discarded' : `gain ${(current.cvNll - cv).toFixed(2)}` });
      if (negative) continue;
      if (!best || cv < best.cvNll) best = { features, cvNll: cv, params };
    }
    if (!best || current.cvNll - best.cvNll < SELECTION_MIN_GAIN) break;
    steps.find((s) => s.features.join() === best!.features.join())!.accepted = true;
    current = best;
  }
  const { z } = crossValidate(devPairs, measure, current.features, domain);
  const q95AbsZ = quantile(z.map(Math.abs), 0.95);
  const k = Math.max(1, q95AbsZ / Z95);
  return {
    measure,
    steps,
    chosen: current,
    q95AbsZ,
    k,
    term: { intercept: current.params[0]!, terms: current.features.map((feature, j) => ({ feature, beta: current.params[j + 1]! })) },
  };
}

// -------------------------------------------------------------- Evaluation

/** The standard error the application would show: the core's own inference, not a copy of it. */
function seOf(spec: SimulatedErrorModelSpec, measure: ValidationMeasure, current: ExamQuality, reference: ExamQuality): number {
  const model = simulatedErrorModel(spec);
  return measure === 'trt' ? model.trtChangeSeUm(current, reference) : model.roughnessChangeSeUm(current, reference);
}

export interface ScoredPair extends Pair {
  supported: boolean;
  se: Record<ValidationMeasure, number>;
}

function score(pairs: readonly Pair[], spec: SimulatedErrorModelSpec): ScoredPair[] {
  return pairs.map((p) => {
    const supported = supportOf(spec, p.current.quality).supported && supportOf(spec, p.reference.quality).supported;
    return {
      ...p,
      supported,
      se: {
        trt: supported ? seOf(spec, 'trt', p.current.quality, p.reference.quality) : NaN,
        roughness: supported ? seOf(spec, 'roughness', p.current.quality, p.reference.quality) : NaN,
      },
    };
  });
}

export interface ErrorStats {
  n: number;
  eyes: number;
  bias: number;
  sd: number;
  rmse: number;
  mae: number;
  maxAbs: number;
}

export function errorStats(errors: readonly number[], eyes: readonly string[]): ErrorStats {
  return {
    n: errors.length,
    eyes: new Set(eyes).size,
    bias: mean(errors),
    sd: sd(errors),
    rmse: rmse(errors),
    mae: mean(errors.map(Math.abs)),
    maxAbs: errors.length ? Math.max(...errors.map(Math.abs)) : NaN,
  };
}

function measureResult(pairs: readonly ScoredPair[], measure: ValidationMeasure): MeasureResult {
  const errors = pairs.map((p) => p.error[measure]);
  const z = pairs.map((p) => p.error[measure] / p.se[measure]);
  const inside = z.filter((v) => Math.abs(v) <= Z95).length;
  const [low, high] = wilson(inside, z.length);
  const stats = errorStats(errors, pairs.map((p) => p.eyeKey));
  return {
    pairs: stats.n,
    eyes: stats.eyes,
    biasUm: stats.bias,
    rmseUm: stats.rmse,
    maeUm: stats.mae,
    maxAbsUm: stats.maxAbs,
    medianSeUm: quantile(pairs.map((p) => p.se[measure]), 0.5),
    coverage: z.length ? inside / z.length : NaN,
    coverageLow: low,
    coverageHigh: high,
    beyond3Se: z.length ? z.filter((v) => Math.abs(v) > 3).length / z.length : NaN,
  };
}

export interface TailRow {
  limit: number;
  observed: number;
  expected: number;
}

function tails(pairs: readonly ScoredPair[], measure: ValidationMeasure): TailRow[] {
  const z = pairs.map((p) => Math.abs(p.error[measure] / p.se[measure]));
  return [1, 1.96, 2.576, 3].map((limit) => ({ limit, observed: z.filter((v) => v > limit).length / z.length, expected: 2 * (1 - normalCdfLocal(limit)) }));
}

function normalCdfLocal(x: number): number {
  return probabilityBeyond(x, 0, 1);
}

export interface ThresholdRow {
  id: string;
  measure: ValidationMeasure;
  thresholdUm: number;
  comparison: '>' | '>=';
  pairs: number;
  misclassified: number;
  brier: number;
  uncertain: number;
  uncertainExceeded: number;
  uncertainMeanProbability: number;
}

function thresholdRows(pairs: readonly ScoredPair[]): ThresholdRow[] {
  const defs = [
    { id: 'trt-first-sign', measure: 'trt' as const, thresholdUm: TRT_FIRST_SIGN_UM, comparison: '>' as const },
    { id: 'trt-clinically-concerning', measure: 'trt' as const, thresholdUm: TRT_CLINICALLY_CONCERNING_UM, comparison: '>=' as const },
    { id: 'folds-new', measure: 'roughness' as const, thresholdUm: BM_ROUGHNESS_FOLDS_UM, comparison: '>' as const },
  ];
  return defs.map((d) => {
    const beyond = (v: number) => (d.comparison === '>=' ? v >= d.thresholdUm : v > d.thresholdUm);
    let misclassified = 0;
    let brier = 0;
    const uncertain: { p: number; exceeded: boolean }[] = [];
    for (const p of pairs) {
      const exceeded = beyond(p.truth[d.measure]);
      if (beyond(p.measured[d.measure]) !== exceeded) misclassified++;
      const probability = probabilityBeyond(p.measured[d.measure], d.thresholdUm, p.se[d.measure]);
      brier += (probability - (exceeded ? 1 : 0)) ** 2;
      if (probability >= 0.1 && probability < 0.9) uncertain.push({ p: probability, exceeded });
    }
    return {
      ...d,
      pairs: pairs.length,
      misclassified,
      brier: brier / pairs.length,
      uncertain: uncertain.length,
      uncertainExceeded: uncertain.filter((u) => u.exceeded).length,
      uncertainMeanProbability: mean(uncertain.map((u) => u.p)),
    };
  });
}

export interface BreakdownRow {
  key: string;
  trt: ErrorStats;
  roughness: ErrorStats;
}

function breakdown(pairs: readonly Pair[], keyOf: (p: Pair) => string, keys: readonly string[]): BreakdownRow[] {
  return keys
    .map((key) => {
      const group = pairs.filter((p) => keyOf(p) === key);
      return { key, trt: errorStats(group.map((p) => p.error.trt), group.map((p) => p.eyeKey)), roughness: errorStats(group.map((p) => p.error.roughness), group.map((p) => p.eyeKey)) };
    })
    .filter((row) => row.trt.n > 0);
}

export interface RejectionRow {
  partition: ValidationPartition;
  family: Family;
  level: string;
  planned: number;
  engineRefused: number;
  reasons: string[];
  modelRefused: number;
}

function rejectionRows(rows: readonly QualityRow[], spec: SimulatedErrorModelSpec): RejectionRow[] {
  const out = new Map<string, RejectionRow>();
  for (const row of rows) {
    if (row.role !== 'follow-up') continue;
    const key = `${row.partition}|${row.family}|${row.level}`;
    const entry = out.get(key) ?? { partition: row.partition, family: row.family, level: row.level, planned: 0, engineRefused: 0, reasons: [], modelRefused: 0 };
    entry.planned++;
    const m = row.measurement;
    if (m && m.status === 'cannot-measure') {
      entry.engineRefused++;
      const reason = [...m.rejections, ...m.scanRejections.slice(0, 1)].join(' + ');
      if (!entry.reasons.includes(reason)) entry.reasons.push(reason);
    } else if (m) {
      const support = supportOf(spec, qualityOf(row));
      if (!support.supported) {
        entry.modelRefused++;
        const reason = `model: ${support.feature} ${support.reason}`;
        if (!entry.reasons.includes(reason)) entry.reasons.push(reason);
      }
    }
    out.set(key, entry);
  }
  const families: readonly Family[] = [...DEV_FAMILIES, ...HELD_OUT_FAMILIES];
  const levelIndex = (r: RejectionRow) => (r.family === 'clean' ? 0 : LEVELS[r.family].findIndex((l) => l.label === r.level));
  return [...out.values()].sort(
    (a, b) => PARTITIONS.indexOf(a.partition) - PARTITIONS.indexOf(b.partition) || families.indexOf(a.family) - families.indexOf(b.family) || levelIndex(a) - levelIndex(b),
  );
}

export interface SincePreviousResult {
  partition: ValidationPartition;
  pairs: number;
  eyes: number;
  stats: ErrorStats;
  coverage: number;
  coverageLow: number;
  coverageHigh: number;
}

/** Two clean follow-ups of the same eye against the same reference, on consecutive sampled days. */
function sincePrevious(rows: readonly QualityRow[], spec: SimulatedErrorModelSpec): SincePreviousResult[] {
  const groups = new Map<string, Exam[]>();
  for (const row of rows) {
    if (row.role !== 'follow-up' || row.family !== 'clean' || !row.reference) continue;
    const exam = examOf(row);
    if (!exam || !supportOf(spec, exam.quality).supported) continue;
    const key = `${eyeKey(row)} ${row.reference}`;
    groups.set(key, [...(groups.get(key) ?? []), exam]);
  }
  const found: { partition: ValidationPartition; eye: string; error: number; se: number }[] = [];
  for (const exams of groups.values()) {
    exams.sort((a, b) => a.row.flightDay - b.row.flightDay || a.row.request.attempt - b.row.request.attempt);
    for (let i = 0; i < exams.length; i++) {
      const a = exams[i]!;
      const b = exams.slice(i + 1).find((e) => e.row.flightDay > a.row.flightDay);
      if (!b) continue;
      const error = b.trtUm - a.trtUm - (b.row.truth.trtUm - a.row.truth.trtUm);
      found.push({ partition: b.row.partition, eye: eyeKey(b.row), error, se: seOf(spec, 'trt', b.quality, a.quality) });
    }
  }
  return PARTITIONS.map((partition) => {
    const group = found.filter((f) => f.partition === partition);
    const inside = group.filter((g) => Math.abs(g.error) <= Z95 * g.se).length;
    const [low, high] = wilson(inside, group.length);
    return { partition, pairs: group.length, eyes: new Set(group.map((g) => g.eye)).size, stats: errorStats(group.map((g) => g.error), group.map((g) => g.eye)), coverage: inside / group.length, coverageLow: low, coverageHigh: high };
  });
}

// ------------------------------------------------------------------ Result

export interface ValidationResult {
  file: QualityRowsFile;
  pairs: ScoredPair[];
  fits: Record<ValidationMeasure, MeasureFit>;
  spec: SimulatedErrorModelSpec;
  summary: ValidationSummary;
  tails: Record<ValidationPartition, Record<ValidationMeasure, TailRow[]>>;
  thresholds: Record<ValidationPartition, ThresholdRow[]>;
  byQuality: Record<ValidationPartition, BreakdownRow[]>;
  byFamily: Record<ValidationPartition, BreakdownRow[]>;
  byEye: Record<ValidationPartition, BreakdownRow[]>;
  examErrors: { measure: ValidationMeasure; stats: ErrorStats; perEyeMeanSd: number }[];
  rejections: RejectionRow[];
  sincePrevious: SincePreviousResult[];
}

function criterion(id: string, partition: ValidationPartition, measure: CriterionResult['measure'], value: number, limit: number, comparison: '<=' | '>='): CriterionResult {
  const passed = Number.isFinite(value) && (comparison === '<=' ? value <= limit : value >= limit);
  return { id, partition, measure, value, limit, comparison, passed };
}

export function analyzeValidation(file: QualityRowsFile): ValidationResult {
  const rows = file.rows;
  const domain = developmentDomain(rows);
  const allPairs = buildPairs(rows);
  const devPairs = allPairs.filter((p) => p.partition === 'development');
  const fits = { trt: fitMeasure(devPairs, 'trt', domain), roughness: fitMeasure(devPairs, 'roughness', domain) };
  const spec: SimulatedErrorModelSpec = {
    version: MODEL_VERSION,
    calibration: { trt: fits.trt.k, roughness: fits.roughness.k },
    trt: fits.trt.term,
    roughness: fits.roughness.term,
    domain,
  };
  // From here on nothing is chosen: the test partitions are only measured.
  const pairs = score(allPairs, spec);
  const supported = (partition: ValidationPartition) => pairs.filter((p) => p.partition === partition && p.supported);

  const followUps = (partition: ValidationPartition) => rows.filter((r) => r.role === 'follow-up' && r.partition === partition);
  const partitions = {} as Record<ValidationPartition, PartitionSummary>;
  for (const partition of PARTITIONS) {
    const captures = rows.filter((r) => r.partition === partition);
    const accepted = captures.filter((r) => r.measurement?.status === 'measured');
    partitions[partition] = {
      crew: [...new Set(captures.map((r) => r.crewId))].sort(),
      eyes: new Set(captures.map(eyeKey)).size,
      captures: captures.length,
      engineRefused: captures.filter((r) => r.measurement?.status === 'cannot-measure').length,
      modelRefused: accepted.filter((r) => !supportOf(spec, qualityOf(r)).supported).length,
      pairs: supported(partition).length,
      results: { trt: measureResult(supported(partition), 'trt'), roughness: measureResult(supported(partition), 'roughness') },
    };
  }

  const criteria: CriterionResult[] = [];
  for (const partition of TEST_PARTITIONS) {
    const result = partitions[partition].results;
    criteria.push(criterion('min-pairs', partition, 'both', partitions[partition].pairs, TOLERANCES.minPairs, '>='));
    for (const measure of MEASURES) {
      const r = result[measure];
      criteria.push(criterion('max-abs-error', partition, measure, r.maxAbsUm, measure === 'trt' ? TOLERANCES.trtChangeUm : TOLERANCES.roughnessChangeUm, '<='));
      criteria.push(criterion('coverage', partition, measure, r.coverage, TOLERANCES.minCoverage, '>='));
      criteria.push(criterion('coverage-low', partition, measure, r.coverageLow, TOLERANCES.minCoverageLow, '>='));
      criteria.push(criterion('beyond-3-se', partition, measure, r.beyond3Se, TOLERANCES.maxBeyond3Se, '<='));
    }
  }
  const cleanAccepted = followUps('test-anatomy').filter((r) => r.family === 'clean' && r.measurement?.status === 'measured');
  const cleanRefused = cleanAccepted.filter((r) => !supportOf(spec, qualityOf(r)).supported).length;
  criteria.push(criterion('clean-model-refused', 'test-anatomy', 'both', cleanAccepted.length ? cleanRefused / cleanAccepted.length : NaN, TOLERANCES.maxCleanModelRefused, '<='));
  const finiteCoefficients = [spec.trt, spec.roughness].every((t) => Number.isFinite(t.intercept) && t.terms.every((x) => Number.isFinite(x.beta))) && Number.isFinite(spec.calibration.trt) && Number.isFinite(spec.calibration.roughness);
  criteria.push(criterion('finite-coefficients', 'development', 'both', finiteCoefficients ? 1 : 0, 1, '>='));

  const acceptedPairs = pairs;
  const gross = (measure: ValidationMeasure, tolerance: number) => acceptedPairs.filter((p) => Math.abs(p.error[measure]) > tolerance).length;
  const references = new Set(acceptedPairs.map((p) => p.reference.row.id));
  const summary: ValidationSummary = {
    format: 'validation-summary-1',
    simulated: true,
    notice: file.notice,
    protocol: file.protocol,
    versions: { ...file.versions, model: MODEL_VERSION },
    sample: {
      crewMembers: new Set(rows.map((r) => r.crewId)).size,
      eyes: new Set(rows.map(eyeKey)).size,
      references: rows.filter((r) => r.role === 'reference').length,
      captures: rows.length,
    },
    partitions,
    examErrorCorrelation: {
      trt: pearson(acceptedPairs.map((p) => p.examError.current.trt), acceptedPairs.map((p) => p.examError.reference.trt)),
      roughness: pearson(acceptedPairs.map((p) => p.examError.current.roughness), acceptedPairs.map((p) => p.examError.reference.roughness)),
      pairs: acceptedPairs.length,
      references: references.size,
    },
    grossErrors: { trt: gross('trt', TOLERANCES.trtChangeUm), roughness: gross('roughness', TOLERANCES.roughnessChangeUm), toleranceTrtUm: TOLERANCES.trtChangeUm, toleranceRoughnessUm: TOLERANCES.roughnessChangeUm },
    model: spec,
    decision: { activate: criteria.every((c) => c.passed), criteria },
  };

  const byPartition = <T>(f: (partition: ValidationPartition) => T) => Object.fromEntries(PARTITIONS.map((p) => [p, f(p)])) as Record<ValidationPartition, T>;
  const families = [...DEV_FAMILIES, ...HELD_OUT_FAMILIES];
  const examRows = rows.map(examOf).filter((e): e is Exam => e !== null);
  return {
    file,
    pairs,
    fits,
    spec,
    summary,
    tails: byPartition((p) => ({ trt: tails(supported(p), 'trt'), roughness: tails(supported(p), 'roughness') })),
    thresholds: byPartition((p) => thresholdRows(supported(p))),
    byQuality: byPartition((p) =>
      breakdown(
        supported(p),
        (pair) => QUALITY_BANDS.find((b) => pair.current.quality.meanQualityDb >= b.low && pair.current.quality.meanQualityDb < b.high)!.label,
        QUALITY_BANDS.map((b) => b.label),
      ),
    ),
    byFamily: byPartition((p) => breakdown(supported(p), (pair) => pair.family, families)),
    byEye: byPartition((p) => breakdown(supported(p), (pair) => pair.eyeKey, [...new Set(rows.map(eyeKey))])),
    examErrors: MEASURES.map((measure) => {
      const errors = examRows.map((e) => (measure === 'trt' ? e.trtUm - e.row.truth.trtUm : e.roughnessUm - e.row.truth.roughnessUm));
      const eyes = examRows.map((e) => eyeKey(e.row));
      const perEye = [...new Set(eyes)].map((eye) => mean(errors.filter((_, i) => eyes[i] === eye)));
      return { measure, stats: errorStats(errors, eyes), perEyeMeanSd: sd(perEye) };
    }),
    rejections: rejectionRows(rows, spec),
    sincePrevious: sincePrevious(rows, spec),
  };
}
