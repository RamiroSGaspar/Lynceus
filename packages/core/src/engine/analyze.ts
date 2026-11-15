/**
 * Measurement engine (spec 01, section 6). It receives an exam (headers, fundus
 * image and pixels) and nothing else: no eye model, no seed, no true value.
 * B-scans are read one at a time, so the whole exam is never in memory.
 */
import type {
  AnalysisProgress,
  AnalyzeOptions,
  BScanHeader,
  BmoEllipse,
  ChangeFromBaseline,
  ExamAnalysis,
  ExamRejection,
  ExamSource,
  ExamSummary,
  Quantity,
  RingMeasure,
  ScanAnalysis,
  Sector,
} from '../contract';
import { DECENTRATION_LIMIT_MM } from '../constants';
import { ACTIVE_ERROR_MODEL } from '../rules/activeErrorModel';
import { ellipseArea, type Ellipse } from '../math/ellipse';
import { SECTORS } from '../sectors';
import { bmRoughness, fitOpening, minimumRimWidth, ringThickness, type Geometry } from './measure';
import { segmentScan, type ScanDiagnostics } from './segment';

export const ENGINE_VERSION = '0.1.0';

// Exam-level limits (spec 6.4 and 6.6). Sources where the specification gives one.
/** Fewer usable B-scans than this: cannot measure (our assumption). */
export const MIN_USABLE_SCANS = 40;
/** The ellipse fit needs this many points (our assumption)… */
export const MIN_BMO_POINTS = 60;
/** …and a residual no larger than this, µm (our assumption). */
export const MAX_BMO_RMS_UM = 60;
/** Every quadrant needs this fraction of its radii in the 0–250 µm ring (our assumption). */
export const MIN_QUADRANT_COVERAGE = 0.7;
/** Opening area change against the reference exam: below this the reference shape is used… */
export const REFERENCE_SHAPE_LIMIT = 0.08;
/** …and above this the exam is not measured (our assumptions; P3: 2.02 → 2.06 mm² in flight). */
export const REFERENCE_MISMATCH_LIMIT = 0.15;

const SOURCES_TRT = ['P1', 'P2', 'P3'] as const;
const SOURCES_MRW = ['P1', 'P3', 'P6'] as const;
const SOURCES_ROUGHNESS = ['P4'] as const;

function measured(value: number, unit: Quantity['unit'], sources: readonly string[]): Quantity {
  return { value, unit, origin: 'measured', sources };
}

function toBmoEllipse(e: Ellipse, rmsUm: number, used: number, rejected: number): BmoEllipse {
  return {
    centerXMm: e.cx,
    centerYMm: e.cy,
    semiMajorMm: e.a,
    semiMinorMm: e.b,
    angleDeg: (e.angle * 180) / Math.PI,
    areaMm2: ellipseArea(e),
    fitRmsUm: rmsUm,
    pointsUsed: used,
    pointsRejected: rejected,
  };
}

/** Same as `analyzeExam`, delivering a progress report for every step of every scan. */
export function* analyzeExamSteps(exam: ExamSource, options: AnalyzeOptions = {}): Generator<AnalysisProgress, ExamAnalysis> {
  const errorModel = options.errorModel ?? ACTIVE_ERROR_MODEL;
  const h = exam.header;
  const n = h.numBScans;
  yield { step: 'read', scansTotal: n };
  const g = { sizeX: h.sizeX, sizeZ: h.sizeZ, scaleXUm: h.scaleXMm * 1000, scaleZUm: h.scaleZMm * 1000 };
  const geometry: Geometry = { sizeX: h.sizeX, scaleXUm: g.scaleXUm, scaleZUm: g.scaleZUm, eye: h.scanPosition };
  const scans: ScanAnalysis[] = [];
  const diags: ScanDiagnostics[] = [];
  const headers: BScanHeader[] = [];
  for (let k = 0; k < n; k++) {
    yield { step: 'quality', scanIndex: k, scansTotal: n };
    const b = exam.bscan(k);
    const seg = segmentScan(b, g);
    headers.push(b.header);
    yield { step: 'segment', scanIndex: k, scansTotal: n };
    scans.push(seg.analysis);
    diags.push(seg.diagnostics);
    yield { step: 'bmo', scanIndex: k, scansTotal: n };
    options.onScan?.(seg.analysis);
  }

  // ---- Pattern centre: where the scans cross (mean of their midpoints, from the headers).
  let cx = 0;
  let cy = 0;
  for (const hd of headers) {
    cx += (hd.startXMm + hd.endXMm) / 2;
    cy += (hd.startYMm + hd.endYMm) / 2;
  }
  const centre: [number, number] = [cx / n, cy / n];

  // ---- Ellipse of the opening (spec 6.4).
  yield { step: 'fit', scansTotal: n };
  const rejections: ExamRejection[] = [];
  const usable = scans.filter((s) => s.usable).length;
  if (usable < MIN_USABLE_SCANS) rejections.push('too-few-usable-scans');
  const pts: { x: number; y: number }[] = [];
  for (const s of scans) {
    if (!s.usable) continue;
    for (const p of s.bmo) if (p) pts.push({ x: p.xMm, y: p.yMm });
  }
  const fit = fitOpening(pts);
  const used = fit ? fit.used.filter(Boolean).length : 0;
  if (!fit || used < MIN_BMO_POINTS || fit.rmsUm > MAX_BMO_RMS_UM) rejections.push('bmo-fit-failed');
  const features: Record<string, number> = {};
  let ringEllipse: Ellipse | null = fit ? fit.ellipse : null;
  let bmoSource: ExamAnalysis['bmoSource'] = 'this-exam';
  const baseline = options.baseline;
  if (fit && baseline?.bmo) {
    const area = ellipseArea(fit.ellipse);
    const diff = Math.abs(area - baseline.bmo.areaMm2) / baseline.bmo.areaMm2;
    features.bmoAreaDiffPct = 100 * diff;
    if (diff < REFERENCE_SHAPE_LIMIT) {
      // As NASA checks the marking against the pre-flight one [P3]: place the reference
      // shape at the centre found today.
      ringEllipse = {
        cx: fit.ellipse.cx,
        cy: fit.ellipse.cy,
        a: baseline.bmo.semiMajorMm,
        b: baseline.bmo.semiMinorMm,
        angle: (baseline.bmo.angleDeg * Math.PI) / 180,
      };
      bmoSource = 'reference-shape';
      features.referenceShapeUsed = 1;
    } else if (diff <= REFERENCE_MISMATCH_LIMIT) {
      features.referenceShapeSkipped = 1;
    } else {
      rejections.push('bmo-mismatch-with-baseline');
    }
  }
  const decentrationUm = fit ? Math.hypot(fit.ellipse.cx - centre[0], fit.ellipse.cy - centre[1]) * 1000 : NaN;
  if (decentrationUm > DECENTRATION_LIMIT_MM * 1000) rejections.push('decentered');

  // ---- Measures (spec 6.5).
  yield { step: 'measure', scansTotal: n };
  let rings: RingMeasure[] = [];
  let mrw: ReturnType<typeof minimumRimWidth> | null = null;
  let roughness = NaN;
  if (ringEllipse) {
    const r = ringThickness(scans, headers, ringEllipse, centre, geometry);
    const minCoverage = Math.min(...r.quadrantCoverage);
    features.ringCoverageMin = minCoverage;
    if (minCoverage < MIN_QUADRANT_COVERAGE) rejections.push('insufficient-ring-coverage');
    rings = r.rings.map((ring) => ({ innerUm: ring.innerUm, outerUm: ring.outerUm, thickness: measured(ring.thicknessUm, 'µm', SOURCES_TRT), radiiUsed: ring.radiiUsed }));
    mrw = minimumRimWidth(scans, headers, fit!.ellipse, geometry);
    roughness = bmRoughness(scans, headers, ringEllipse, centre, geometry);
  }

  // ---- Quality summary and features for the quality model of the next stage.
  const q = scans.map((s) => s.qualityDb);
  const meanQ = q.reduce((a, b) => a + b, 0) / n;
  const count = (r: string): number => scans.filter((s) => s.rejections.includes(r as never)).length;
  Object.assign(features, {
    usableFraction: usable / n,
    meanQualityDb: meanQ,
    qualitySdDb: Math.sqrt(q.reduce((a, b) => a + (b - meanQ) ** 2, 0) / n),
    lowSignalScans: count('low-signal'),
    dropoutScans: count('signal-dropout'),
    truncatedScans: count('truncated'),
    surfaceNotFoundScans: count('surface-not-found'),
    bmoNotFoundScans: count('bmo-not-found'),
    motionScans: count('motion'),
    meanValidColumnFraction: scans.reduce((a, s) => a + s.validColumnFraction, 0) / n,
    meanSignalFraction: diags.reduce((a, d) => a + d.signalFraction, 0) / n,
    meanMotionSteps: diags.reduce((a, d) => a + d.motionSteps, 0) / n,
    bmoPoints: pts.length,
    bmoPointsRejected: fit ? pts.length - used : pts.length,
    bmoFitRmsUm: fit ? fit.rmsUm : NaN,
    decentrationUm,
  });

  const quality: ExamAnalysis['quality'] = {
    usableScans: usable,
    totalScans: n,
    meanQualityDb: meanQ,
    minQualityDb: Math.min(...q),
    decentrationUm,
    features,
  };
  // The error model's domain (specification 08): a capture the engine could measure but whose
  // error was not validated is not measured either. It never turns a refusal into a measure.
  if (rejections.length === 0 && errorModel.supports && !errorModel.supports(quality).supported) rejections.push('outside-error-model');

  const ok = rejections.length === 0;
  const sectorValues = mrw ? SECTORS.filter((s) => mrw!.bySector.has(s)).map((sector: Sector) => ({ sector, value: measured(mrw!.bySector.get(sector)!, 'µm', ['P6']) })) : [];
  const analysis: ExamAnalysis = {
    examId: h.id,
    referenceId: h.referenceId,
    patientId: h.patientId,
    visitId: h.visitId,
    eye: h.scanPosition,
    examTimeMs: h.examTimeMs,
    status: ok ? 'measured' : 'cannot-measure',
    rejections,
    quality,
    bmo: ok && fit ? toBmoEllipse(fit.ellipse, fit.rmsUm, used, pts.length - used) : null,
    bmoSource,
    rings: ok ? rings : [],
    trtRingUm: ok && rings[0] ? rings[0].thickness : null,
    mrwUm: ok && mrw && Number.isFinite(mrw.meanUm) ? measured(mrw.meanUm, 'µm', SOURCES_MRW) : null,
    mrwSectors: ok ? sectorValues : [],
    bmRoughnessUm: ok && Number.isFinite(roughness) ? measured(roughness, 'µm', SOURCES_ROUGHNESS) : null,
    scans,
    engineVersion: ENGINE_VERSION,
  };
  yield { step: 'done', scansTotal: n };
  return analysis;
}

export function analyzeExam(exam: ExamSource, options: AnalyzeOptions = {}): ExamAnalysis {
  const it = analyzeExamSteps(exam, options);
  for (;;) {
    const r = it.next();
    if (r.done) return r.value;
  }
}

/** Everything but the per-scan arrays: what is kept of an exam. */
export function summarize(analysis: ExamAnalysis): ExamSummary {
  const { scans: _scans, ...summary } = analysis;
  return summary;
}

function derived(current: Quantity, baseline: Quantity): Quantity {
  return { value: current.value - baseline.value, unit: current.unit, origin: 'derived', sources: current.sources };
}

/**
 * Change of every measure from the reference exam (spec 6.7). Both exams must be of
 * the same eye and the same follow-up series, and both must have been measured.
 */
export function compareWithBaseline(current: ExamSummary, baseline: ExamSummary): ChangeFromBaseline {
  if (current.eye !== baseline.eye || current.patientId !== baseline.patientId) throw new Error('Exams of different eyes cannot be compared');
  if (current.referenceId !== baseline.examId) throw new Error(`Exam ${current.examId} belongs to series ${current.referenceId}, not to reference exam ${baseline.examId}`);
  if (current.status !== 'measured' || baseline.status !== 'measured') throw new Error('Both exams must have been measured');
  if (!current.trtRingUm || !baseline.trtRingUm || !current.mrwUm || !baseline.mrwUm || !current.bmRoughnessUm || !baseline.bmRoughnessUm || !current.bmo || !baseline.bmo) {
    throw new Error('A measure is missing');
  }
  return {
    eye: current.eye,
    baselineExamId: baseline.examId,
    examId: current.examId,
    trtRingUm: derived(current.trtRingUm, baseline.trtRingUm),
    rings: current.rings.map((r, i) => derived(r.thickness, baseline.rings[i]!.thickness)),
    mrwUm: derived(current.mrwUm, baseline.mrwUm),
    bmRoughnessUm: derived(current.bmRoughnessUm, baseline.bmRoughnessUm),
    bmoAreaChangePct: (100 * (current.bmo.areaMm2 - baseline.bmo.areaMm2)) / baseline.bmo.areaMm2,
  };
}
