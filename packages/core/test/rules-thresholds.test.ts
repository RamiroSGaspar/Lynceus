import { describe, expect, it } from 'vitest';
import {
  assessSession,
  BM_ROUGHNESS_FOLDS_UM,
  cleanDifference,
  likelihoodWord,
  normalCdf,
  PROVISIONAL_ERROR_MODEL,
  probabilityBeyond,
  provisionalRingSeUm,
  RULE_SOURCES,
  THRESHOLDS,
  TRT_CLINICALLY_CONCERNING_UM,
  TRT_FIRST_SIGN_UM,
  type ErrorModel,
  type ExamQuality,
  type SessionAssessment,
} from '../src/index';
import { BASE, eyesWithChange, measured, preflight } from './helpers/fixtures';

const history = [preflight()];

/** Right eye with the given change of the ring and of the roughness; left eye unchanged. */
function assess(odChange: number, odRoughnessChange = 0, errorModel?: ErrorModel): SessionAssessment {
  return assessSession(
    { crewId: 'B', flightDay: 30, eyes: eyesWithChange({ OD: odChange, OS: 0 }, { OD: odRoughnessChange }), vision: null, history },
    errorModel,
  );
}

const threshold = (assessment: SessionAssessment, id: string) =>
  assessment.eyes.OD.thresholds.find((t) => t.thresholdId === id)!;

describe('thresholds: values and sources', () => {
  it('holds the published values', () => {
    expect(TRT_FIRST_SIGN_UM).toBe(19.4);
    expect(TRT_CLINICALLY_CONCERNING_UM).toBe(55);
    expect(BM_ROUGHNESS_FOLDS_UM).toBe(2.8);
    expect(THRESHOLDS.ACUITY_REAL_CHANGE_LOGMAR.value).toBe(0.2);
    expect(THRESHOLDS.AMSLER_EXTENSIVE_FRACTION.value).toBe(0.05);
  });

  it('says which thresholds are NASA’s and which are assumptions, and every source id resolves', () => {
    expect(THRESHOLDS.TRT_FIRST_SIGN_UM.basis).toBe('nasa');
    expect(THRESHOLDS.TRT_CLINICALLY_CONCERNING_UM.basis).toBe('nasa');
    expect(THRESHOLDS.BM_ROUGHNESS_FOLDS_UM.basis).toBe('nasa');
    expect(THRESHOLDS.ACUITY_REAL_CHANGE_LOGMAR.basis).toBe('assumption');
    expect(THRESHOLDS.AMSLER_EXTENSIVE_FRACTION.basis).toBe('assumption');
    for (const definition of Object.values(THRESHOLDS)) {
      for (const id of definition.sources) expect(RULE_SOURCES[id].url).toMatch(/^https:\/\//);
    }
    expect(THRESHOLDS.TRT_FIRST_SIGN_UM.sources).toContain('laurie2020');
    expect(THRESHOLDS.TRT_CLINICALLY_CONCERNING_UM.sources).toContain('nasa-mtb-2024');
    expect(THRESHOLDS.BM_ROUGHNESS_FOLDS_UM.sources).toContain('ferguson2023');
  });
});

describe('threshold edges, decided on the measured value', () => {
  it('19.4 µm does not pass the first-sign threshold and 19.5 µm does', () => {
    const at = assess(19.4);
    expect(at.eyes.OD.change?.trtRingUm.value).toBe(19.4);
    expect(threshold(at, 'trt-first-sign').exceeded).toBe(false);
    expect(at.eyes.OD.level).toBe('no-detectable-change');
    expect(at.eyes.OD.findings).toEqual([]);

    const above = assess(19.5);
    expect(threshold(above, 'trt-first-sign').exceeded).toBe(true);
    expect(above.eyes.OD.level).toBe('first-sign');
    expect(above.eyes.OD.findings).toEqual(['swelling-first-sign']);
    expect(above.level).toBe('first-sign');
    expect(above.alert).toBe('advisory');
  });

  it('54.9 µm is a first sign and 55.0 µm is clinically concerning', () => {
    const below = assess(54.9);
    expect(threshold(below, 'trt-clinically-concerning').exceeded).toBe(false);
    expect(below.eyes.OD.level).toBe('first-sign');

    const at = assess(55);
    expect(threshold(at, 'trt-clinically-concerning').exceeded).toBe(true);
    expect(at.eyes.OD.level).toBe('clinically-concerning');
    expect(at.eyes.OD.findings).toEqual(['swelling-clinically-concerning']);
    expect(at.level).toBe('clinically-concerning');
    expect(at.alert).toBe('caution');
    expect(at.contact).toBe('without-delay');
  });

  it('a roughness increase of 2.8 µm is not a fold and 2.9 µm is', () => {
    const at = assess(0, 2.8);
    expect(at.eyes.OD.change?.bmRoughnessUm.value).toBe(2.8);
    expect(threshold(at, 'folds-new').exceeded).toBe(false);
    expect(at.eyes.OD.level).toBe('no-detectable-change');

    const above = assess(0, 2.9);
    expect(threshold(above, 'folds-new').exceeded).toBe(true);
    expect(above.eyes.OD.level).toBe('first-sign');
    expect(above.eyes.OD.findings).toEqual(['folds-new']);
  });

  it('new folds do not lower a clinically concerning eye, and add their finding', () => {
    const both = assess(60, 4);
    expect(both.eyes.OD.level).toBe('clinically-concerning');
    expect(both.eyes.OD.findings).toEqual(['swelling-clinically-concerning', 'folds-new']);
  });

  it('removes the last-bit noise of binary arithmetic before comparing', () => {
    expect(415.4 - 396).not.toBe(19.4);
    expect(cleanDifference(415.4, 396)).toBe(19.4);
    expect(cleanDifference(450.9, 396)).toBe(54.9);
  });

  it('the session takes the higher level of the two eyes', () => {
    const assessment = assessSession({
      crewId: 'B',
      flightDay: 30,
      eyes: eyesWithChange({ OD: 25, OS: 70 }),
      vision: null,
      history,
    });
    expect(assessment.eyes.OD.level).toBe('first-sign');
    expect(assessment.eyes.OS.level).toBe('clinically-concerning');
    expect(assessment.level).toBe('clinically-concerning');
    expect(assessment.findings).toEqual(['swelling-clinically-concerning', 'swelling-first-sign']);
  });
});

describe('change against the pre-flight exam', () => {
  it('is a derived quantity with the error of the model and its 95 % interval', () => {
    const { change } = assess(24).eyes.OD;
    const se = Math.sqrt(18);
    expect(change?.trtRingUm).toMatchObject({ value: 24, unit: 'µm', origin: 'derived' });
    expect(change?.trtRingUm.standardError).toBeCloseTo(se, 12);
    expect(change?.trtRingUm.interval95?.[0]).toBeCloseTo(24 - 1.96 * se, 12);
    expect(change?.trtRingUm.interval95?.[1]).toBeCloseTo(24 + 1.96 * se, 12);
    expect(change?.bmRoughnessUm.standardError).toBeCloseTo(Math.sqrt(2 * 0.8 * 0.8), 12);
    expect(change?.baselineExamId).toBe('OD-0');
    expect(change?.examId).toBe('OD-30');
    expect(change?.bmoAreaChangePct).toBe(0);
  });

  it('gives the other rings and the rim width without a range the model cannot support', () => {
    const { change } = assess(24).eyes.OD;
    expect(change?.rings).toHaveLength(4);
    expect(change?.rings[0]).toEqual(change?.trtRingUm);
    for (const ring of change!.rings.slice(1)) {
      expect(ring).toEqual({ value: 0, unit: 'µm', origin: 'derived' });
    }
    expect(change?.mrwUm).toEqual({ value: 0, unit: 'µm', origin: 'derived' });
  });

  it('reports each threshold as the published reference value, with its sources', () => {
    const first = threshold(assess(24), 'trt-first-sign');
    expect(first.threshold).toEqual({ value: 19.4, unit: 'µm', origin: 'reference', sources: ['laurie2020', 'nasa-mtb-2024'] });
  });
});

describe('probability of having passed a threshold', () => {
  it('computes known values of Φ', () => {
    expect(normalCdf(0)).toBe(0.5);
    expect(normalCdf(1)).toBeCloseTo(0.8413447460685429, 14);
    expect(normalCdf(-1)).toBeCloseTo(0.15865525393145707, 14);
    expect(normalCdf(1.96)).toBeCloseTo(0.9750021048517795, 14);
    expect(normalCdf(-1.96)).toBeCloseTo(0.024997895148220435, 14);
    expect(normalCdf(2)).toBeCloseTo(0.9772498680518208, 14);
    expect(normalCdf(-3)).toBeCloseTo(0.0013498980316300946, 14);
    expect(normalCdf(1.2815515655446004)).toBeCloseTo(0.9, 14);
    expect(normalCdf(-1.2815515655446004)).toBeCloseTo(0.1, 14);
    expect(normalCdf(8)).toBeCloseTo(1, 14);
    expect(normalCdf(8)).toBeLessThan(1);
    expect(normalCdf(-40)).toBe(0);
    expect(normalCdf(40)).toBe(1);
  });

  it('is Φ((change − threshold) / error)', () => {
    expect(probabilityBeyond(24, 19.4, Math.sqrt(18))).toBeCloseTo(normalCdf(4.6 / Math.sqrt(18)), 14);
    const assessment = assess(24);
    expect(threshold(assessment, 'trt-first-sign').probabilityExceeded).toBeCloseTo(0.8609, 3);
    expect(threshold(assessment, 'trt-first-sign').word).toBe('likely');
    expect(threshold(assessment, 'trt-clinically-concerning').probabilityExceeded).toBeLessThan(1e-9);
    expect(threshold(assessment, 'trt-clinically-concerning').word).toBe('unlikely');
  });

  it('has four words, with the edges in the upper one', () => {
    expect(likelihoodWord(0)).toBe('unlikely');
    expect(likelihoodWord(0.0999)).toBe('unlikely');
    expect(likelihoodWord(0.1)).toBe('possible');
    expect(likelihoodWord(0.4999)).toBe('possible');
    expect(likelihoodWord(0.5)).toBe('likely');
    expect(likelihoodWord(0.8999)).toBe('likely');
    expect(likelihoodWord(0.9)).toBe('very-likely');
    expect(likelihoodWord(1)).toBe('very-likely');
  });

  it('gives each word on a real assessment', () => {
    // Error of the change with the provisional model and good quality: √18 = 4.24 µm.
    expect(threshold(assess(10), 'trt-first-sign').word).toBe('unlikely');
    expect(threshold(assess(17), 'trt-first-sign').word).toBe('possible');
    expect(threshold(assess(19.4), 'trt-first-sign').probabilityExceeded).toBe(0.5);
    expect(threshold(assess(19.4), 'trt-first-sign').word).toBe('likely');
    expect(threshold(assess(22), 'trt-first-sign').word).toBe('likely');
    expect(threshold(assess(26), 'trt-first-sign').word).toBe('very-likely');
  });

  it('marks as borderline an eye with a threshold between 10 % and 90 %', () => {
    expect(assess(10).eyes.OD.borderline).toBe(false);
    expect(assess(17).eyes.OD.borderline).toBe(true); // below the threshold, but it may have been passed
    expect(assess(22).eyes.OD.borderline).toBe(true); // above the threshold, but not surely
    expect(assess(30).eyes.OD.borderline).toBe(false);
    expect(assess(54).eyes.OD.borderline).toBe(true); // close to the clinically concerning threshold
    expect(assess(0, 2).eyes.OD.borderline).toBe(true); // close to the folds threshold
  });
});

describe('error model', () => {
  const quality = (meanQualityDb: number): ExamQuality => ({
    usableScans: 48,
    totalScans: 48,
    meanQualityDb,
    minQualityDb: meanQualityDb,
    decentrationUm: 0,
    features: {},
  });

  it('provisional: 3 µm from 27 dB up, rising in a straight line to 6 µm at 15 dB', () => {
    expect(provisionalRingSeUm(33)).toBe(3);
    expect(provisionalRingSeUm(27)).toBe(3);
    expect(provisionalRingSeUm(21)).toBeCloseTo(4.5, 12);
    expect(provisionalRingSeUm(15)).toBeCloseTo(6, 12);
    expect(provisionalRingSeUm(11)).toBeGreaterThan(6);
    expect(provisionalRingSeUm(NaN)).toBeGreaterThan(6);
  });

  it('provisional: the error of a change is the root of the sum of the squares of the two exams', () => {
    expect(PROVISIONAL_ERROR_MODEL.trtChangeSeUm(quality(30), quality(30))).toBeCloseTo(Math.sqrt(18), 12);
    expect(PROVISIONAL_ERROR_MODEL.trtChangeSeUm(quality(15), quality(30))).toBeCloseTo(Math.sqrt(45), 12);
    expect(PROVISIONAL_ERROR_MODEL.roughnessChangeSeUm(quality(30), quality(30))).toBeCloseTo(Math.sqrt(1.28), 12);
    expect(PROVISIONAL_ERROR_MODEL.version).toMatch(/^provisional/);
  });

  it('a worse capture widens the range and lowers the certainty, without changing the level', () => {
    const good = assess(24);
    const eyes = eyesWithChange({ OD: 24, OS: 0 });
    eyes.OD = measured('OD', { trt: BASE.OD.trt + 24, roughness: BASE.OD.roughness, qualityDb: 15 });
    const poor = assessSession({ crewId: 'B', flightDay: 30, eyes, vision: null, history });
    const width = (assessment: SessionAssessment) => {
      const [low, high] = assessment.eyes.OD.change!.trtRingUm.interval95!;
      return high - low;
    };
    expect(poor.eyes.OD.change?.trtRingUm.value).toBe(24);
    expect(poor.eyes.OD.change?.trtRingUm.standardError).toBeCloseTo(Math.sqrt(45), 12);
    expect(width(poor)).toBeGreaterThan(width(good));
    expect(threshold(poor, 'trt-first-sign').probabilityExceeded).toBeLessThan(
      threshold(good, 'trt-first-sign').probabilityExceeded,
    );
    expect(poor.eyes.OD.level).toBe(good.eyes.OD.level);
  });

  it('can be replaced without touching the rules', () => {
    const tight: ErrorModel = { version: 'test-tight', trtChangeSeUm: () => 1, roughnessChangeSeUm: () => 0.2 };
    const assessment = assess(22, 0, tight);
    expect(assessment.errorModelVersion).toBe('test-tight');
    expect(assessment.eyes.OD.change?.trtRingUm.standardError).toBe(1);
    expect(threshold(assessment, 'trt-first-sign').word).toBe('very-likely');
    expect(assessment.eyes.OD.level).toBe(assess(22).eyes.OD.level);
    expect(assess(22).errorModelVersion).toBe(PROVISIONAL_ERROR_MODEL.version);
  });
});
