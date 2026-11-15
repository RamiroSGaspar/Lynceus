/**
 * Error model measured on simulated exams (specification 08; protocol
 * `packages/validation/protocol.md`). The coefficients are fitted by
 * `pnpm --filter @app/validation quality:fit` and read from the validation summary.
 *
 * It describes how far the engine's change is from the true change of a VIRTUAL eye
 * drawn by the virtual instrument, which shares the layer model the engine expects.
 * The error on real exams is larger and unknown. Its probabilities refer to the
 * measurement of the simulator, not to the syndrome.
 *
 * Inference reads only `ExamQuality.features`, which the engine computes from the
 * image. It never sees a true value.
 */
import type { ExamQuality } from '../contract';
import type { ErrorModel, ErrorModelSupport } from './errorModel';

/**
 * Candidate variables of the protocol (section 4), each oriented so that more is a
 * worse capture, with its transformation from the engine's features.
 */
export const ERROR_FEATURES = {
  /** Mean quality below 25 dB, per 5 dB. */
  quality: { source: 'meanQualityDb', transform: '(25 − meanQualityDb) / 5', of: (f: Readonly<Record<string, number>>) => (25 - f.meanQualityDb!) / 5 },
  /** Fraction of the 48 B-scans that could not be used. */
  unusedScans: { source: 'usableFraction', transform: '1 − usableFraction', of: (f: Readonly<Record<string, number>>) => 1 - f.usableFraction! },
  /** Residual of the ellipse fit of the opening, per 10 µm. */
  bmoFit: { source: 'bmoFitRmsUm', transform: 'bmoFitRmsUm / 10 µm', of: (f: Readonly<Record<string, number>>) => f.bmoFitRmsUm! / 10 },
  /** Distance between the pattern centre and the opening centre, per 100 µm. */
  decentration: { source: 'decentrationUm', transform: 'decentrationUm / 100 µm', of: (f: Readonly<Record<string, number>>) => f.decentrationUm! / 100 },
  /** Fraction of radii missing in the worst quadrant of the 0–250 µm ring. */
  ringCoverage: { source: 'ringCoverageMin', transform: '1 − ringCoverageMin', of: (f: Readonly<Record<string, number>>) => 1 - f.ringCoverageMin! },
  /** Mean number of motion steps per B-scan. */
  motion: { source: 'meanMotionSteps', transform: 'meanMotionSteps', of: (f: Readonly<Record<string, number>>) => f.meanMotionSteps! },
  /** Fraction of columns where a boundary was not found. */
  missingColumns: { source: 'meanValidColumnFraction', transform: '1 − meanValidColumnFraction', of: (f: Readonly<Record<string, number>>) => 1 - f.meanValidColumnFraction! },
} as const;

export type ErrorFeature = keyof typeof ERROR_FEATURES;
export const ERROR_FEATURE_IDS = Object.keys(ERROR_FEATURES) as ErrorFeature[];

/** The value of every candidate variable for one exam; NaN where the engine gave no number. */
export function errorFeatureValues(quality: ExamQuality): Record<ErrorFeature, number> {
  const out = {} as Record<ErrorFeature, number>;
  for (const id of ERROR_FEATURE_IDS) {
    const value = ERROR_FEATURES[id].of(quality.features);
    out[id] = typeof value === 'number' && Number.isFinite(value) ? value : NaN;
  }
  return out;
}

/** s(x) = exp(intercept + Σ β·z), µm: the error term of one exam. */
export interface ExamErrorTerm {
  intercept: number;
  terms: { feature: ErrorFeature; beta: number }[];
}

export interface SimulatedErrorModelSpec {
  version: string;
  /** Calibration factor k ≥ 1 (protocol, section 4). */
  calibration: { trt: number; roughness: number };
  trt: ExamErrorTerm;
  roughness: ExamErrorTerm;
  /** Range of each variable in the accepted development exams. Above `max`: not supported; below `min`: clipped. */
  domain: Record<ErrorFeature, { min: number; max: number }>;
}

/** Whether the model has a measured error for an exam like this one. */
export function supportOf(spec: SimulatedErrorModelSpec, quality: ExamQuality): ErrorModelSupport {
  const values = errorFeatureValues(quality);
  for (const id of ERROR_FEATURE_IDS) {
    const value = values[id];
    if (!Number.isFinite(value)) return { supported: false, feature: id, reason: 'not-a-number' };
    // A tiny tolerance: the edges of the domain are themselves development exams.
    if (value > spec.domain[id].max + 1e-9) return { supported: false, feature: id, reason: 'beyond-validated-range' };
  }
  return { supported: true };
}

function examTerm(spec: SimulatedErrorModelSpec, term: ExamErrorTerm, quality: ExamQuality): number {
  const values = errorFeatureValues(quality);
  let exponent = term.intercept;
  for (const { feature, beta } of term.terms) exponent += beta * Math.max(values[feature], spec.domain[feature].min);
  return Math.exp(exponent);
}

/**
 * σ = k·√(s(today)² + s(reference)²). An exam the model does not support gives NaN:
 * the rules never show a range for it (see `assessSession`).
 */
function changeSe(spec: SimulatedErrorModelSpec, term: ExamErrorTerm, k: number, current: ExamQuality, baseline: ExamQuality): number {
  if (!supportOf(spec, current).supported || !supportOf(spec, baseline).supported) return NaN;
  const a = examTerm(spec, term, current);
  const b = examTerm(spec, term, baseline);
  return k * Math.sqrt(a * a + b * b);
}

export function simulatedErrorModel(spec: SimulatedErrorModelSpec): ErrorModel {
  return {
    version: spec.version,
    trtChangeSeUm: (current, baseline) => changeSe(spec, spec.trt, spec.calibration.trt, current, baseline),
    roughnessChangeSeUm: (current, baseline) => changeSe(spec, spec.roughness, spec.calibration.roughness, current, baseline),
    supports: (quality) => supportOf(spec, quality),
  };
}
