import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ACTIVE_ERROR_MODEL,
  PROVISIONAL_ERROR_MODEL,
  acquire,
  analyzeExam,
  ERROR_FEATURE_IDS,
  SIMULATED_ERROR_MODEL,
  VALIDATION_SUMMARY,
  assessSession,
  isProvisionalErrorModel,
  probabilityBeyond,
  simulatedErrorModel,
  supportOf,
  type ErrorModel,
  type ExamQuality,
  type SimulatedErrorModelSpec,
} from '../src/index';
import { eyesWithChange, preflight } from './helpers/fixtures';

/** A hand-made model: numbers chosen for the test, not the fitted ones. */
const SPEC: SimulatedErrorModelSpec = {
  version: 'sim-test',
  calibration: { trt: 1.2, roughness: 1 },
  trt: { intercept: Math.log(0.5), terms: [{ feature: 'quality', beta: 0.4 }] },
  roughness: { intercept: Math.log(0.2), terms: [] },
  domain: Object.fromEntries(ERROR_FEATURE_IDS.map((id) => [id, { min: 0, max: 1 }])) as SimulatedErrorModelSpec['domain'],
};
SPEC.domain.quality = { min: -0.8, max: 2 };

/** Features of a clean capture of the simulator (values as the engine writes them). */
export function cleanFeatures(meanQualityDb = 25): Record<string, number> {
  return {
    meanQualityDb,
    usableFraction: 1,
    bmoFitRmsUm: 8,
    decentrationUm: 60,
    ringCoverageMin: 1,
    meanMotionSteps: 0,
    meanValidColumnFraction: 1,
  };
}

function quality(features: Record<string, number>): ExamQuality {
  return { usableScans: 48, totalScans: 48, meanQualityDb: features.meanQualityDb ?? NaN, minQualityDb: 20, decentrationUm: 60, features };
}

describe('error model measured on simulated exams', () => {
  const model = simulatedErrorModel(SPEC);

  it('computes σ = k·√(s(today)² + s(reference)²) from the features alone, the same every time', () => {
    const today = quality(cleanFeatures(20));
    const reference = quality(cleanFeatures(25));
    const s = (q: number) => 0.5 * Math.exp(0.4 * ((25 - q) / 5));
    const expected = 1.2 * Math.hypot(s(20), s(25));
    expect(model.trtChangeSeUm(today, reference)).toBeCloseTo(expected, 12);
    expect(model.trtChangeSeUm(today, reference)).toBe(model.trtChangeSeUm(today, reference));
    expect(model.roughnessChangeSeUm(today, reference)).toBeCloseTo(0.2 * Math.SQRT2, 12);
  });

  it('never extrapolates a smaller error than the one measured: better than the domain is clipped', () => {
    const best = quality(cleanFeatures(25 + 5 * 0.8));
    const better = quality(cleanFeatures(40));
    expect(model.supports!(better)).toEqual({ supported: true });
    expect(model.trtChangeSeUm(better, best)).toBe(model.trtChangeSeUm(best, best));
  });

  it('does not support a capture beyond the validated range or with a variable that is not a number', () => {
    expect(supportOf(SPEC, quality(cleanFeatures(14)))).toEqual({ supported: false, feature: 'quality', reason: 'beyond-validated-range' });
    const missing = cleanFeatures();
    delete missing.bmoFitRmsUm;
    expect(supportOf(SPEC, quality(missing))).toEqual({ supported: false, feature: 'bmoFit', reason: 'not-a-number' });
    expect(supportOf(SPEC, quality({ ...cleanFeatures(), decentrationUm: Infinity })).supported).toBe(false);
    expect(Number.isNaN(model.trtChangeSeUm(quality(cleanFeatures(14)), quality(cleanFeatures())))).toBe(true);
  });

  it('gives no number for an eye the model does not support, with the reason', () => {
    const eyes = eyesWithChange({ OD: 25, OS: 0 });
    eyes.OD.accepted!.quality = quality(cleanFeatures(14));
    eyes.OS.accepted!.quality = quality(cleanFeatures());
    const history = [preflight()];
    for (const record of history) for (const eye of ['OD', 'OS'] as const) record.eyes[eye].accepted!.quality = quality(cleanFeatures());
    const assessment = assessSession({ crewId: 'B', flightDay: 30, eyes, vision: null, history }, model);
    expect(assessment.eyes.OD.measured).toBe(false);
    expect(assessment.eyes.OD.change).toBeNull();
    expect(assessment.eyes.OD.thresholds).toEqual([]);
    expect(assessment.eyes.OD.notMeasuredReasons).toEqual(['outside-error-model']);
    expect(assessment.eyes.OS.measured).toBe(true);
    expect(assessment.errorModelVersion).toBe('sim-test');
  });

  it('keeps the 95 % interval and the probability on the same error', () => {
    const eyes = eyesWithChange({ OD: 20, OS: 0 });
    const history = [preflight()];
    for (const capture of [eyes.OD, eyes.OS, history[0]!.eyes.OD, history[0]!.eyes.OS]) capture.accepted!.quality = quality(cleanFeatures(22));
    const assessment = assessSession({ crewId: 'B', flightDay: 30, eyes, vision: null, history }, model);
    const change = assessment.eyes.OD.change!.trtRingUm;
    const se = change.standardError!;
    expect(se).toBeCloseTo(model.trtChangeSeUm(eyes.OD.accepted!.quality, history[0]!.eyes.OD.accepted!.quality), 12);
    expect(change.interval95![0]).toBeCloseTo(change.value - 1.96 * se, 12);
    expect(change.interval95![1]).toBeCloseTo(change.value + 1.96 * se, 12);
    // A threshold at the lower edge of the interval is passed with 97.5 % probability.
    expect(probabilityBeyond(change.value, change.interval95![0], se)).toBeCloseTo(0.975, 3);
    const firstSign = assessment.eyes.OD.thresholds.find((t) => t.thresholdId === 'trt-first-sign')!;
    expect(firstSign.probabilityExceeded).toBeCloseTo(probabilityBeyond(change.value, 19.4, se), 12);
  });
});

describe('the validation summary and the active model', () => {
  it('is simulated data, of a known format, and the active model follows its decision', () => {
    expect(VALIDATION_SUMMARY.simulated).toBe(true);
    expect(VALIDATION_SUMMARY.notice).toMatch(/Simulated data/);
    expect(VALIDATION_SUMMARY.format).toBe('validation-summary-1');
    expect(SIMULATED_ERROR_MODEL.version).toBe(VALIDATION_SUMMARY.versions.model);
    if (VALIDATION_SUMMARY.decision.activate) expect(ACTIVE_ERROR_MODEL).toBe(SIMULATED_ERROR_MODEL);
    else expect(isProvisionalErrorModel(ACTIVE_ERROR_MODEL.version)).toBe(true);
  });

  it('the decision is every criterion passing', () => {
    expect(VALIDATION_SUMMARY.decision.activate).toBe(VALIDATION_SUMMARY.decision.criteria.every((c) => c.passed));
    expect(VALIDATION_SUMMARY.decision.criteria.length).toBeGreaterThan(0);
  });

  it('the model reads no true value: its modules import nothing from the virtual eye', () => {
    for (const file of ['../src/rules/simulatedErrorModel.ts', '../src/rules/activeErrorModel.ts', '../src/rules/errorModel.ts', '../src/dataset/validationSummary.ts', '../src/engine/analyze.ts']) {
      const code = readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8');
      expect(code, file).not.toMatch(/from ['"][./]*\/eye\//);
      expect(code, file).not.toMatch(/groundTruth/);
    }
  });
});

describe('the engine and the error model’s domain', () => {
  const T = 120_000;
  const refuseAll: ErrorModel = { ...PROVISIONAL_ERROR_MODEL, version: 'refuse-all', supports: () => ({ supported: false, feature: 'quality', reason: 'beyond-validated-range' }) };
  const acceptAll: ErrorModel = { ...PROVISIONAL_ERROR_MODEL, version: 'accept-all', supports: () => ({ supported: true }) };

  it('does not measure a capture the model does not support, and says why', () => {
    const a = analyzeExam(acquire({ crewId: 'B', eye: 'OD', flightDay: 30, attempt: 3 }), { errorModel: refuseAll });
    expect(a.status).toBe('cannot-measure');
    expect(a.rejections).toEqual(['outside-error-model']);
    expect(a.trtRingUm).toBeNull();
    expect(a.bmRoughnessUm).toBeNull();
    expect(a.rings).toEqual([]);
  }, T);

  it('never turns a refusal of the engine into a measure', () => {
    const a = analyzeExam(acquire({ crewId: 'B', eye: 'OD', flightDay: 30, attempt: 3, conditions: { decentrationMm: { x: 0.6, y: 0.2 } } }), { errorModel: acceptAll });
    expect(a.status).toBe('cannot-measure');
    expect(a.rejections).toContain('decentered');
    expect(a.rejections).not.toContain('outside-error-model');
    expect(a.trtRingUm).toBeNull();
  }, T);
});
