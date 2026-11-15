/**
 * Thresholds of the rules. Each constant says where it comes from; `THRESHOLDS`
 * holds the same values with their unit, the comparison that applies, whether
 * they are NASA's or an assumption of this project, and their source ids
 * (`rules/sources.ts`).
 */
import type { Quantity, ThresholdAssessment, Unit } from '../contract';
import type { RuleSourceId } from './sources';

/**
 * An increase of the retinal thickness in the 0–250 µm ring LARGER than this is the
 * first sign of optic disc swelling. It is two standard deviations of the normal
 * variation between two sessions (one deviation: 9.7 µm), measured in 7 astronauts
 * who had not flown. Laurie 2020 [laurie2020]; NASA's table rounds it to "≥ 20 µm"
 * [nasa-mtb-2024]. Research: sans-evolucion-y-logica-clinica.md, A7 and B1;
 * sans-oct-base-tecnica.md, 5.1.
 */
export const TRT_FIRST_SIGN_UM = 19.4;

/**
 * An increase of the same ring EQUAL TO OR LARGER than this is clinically concerning.
 * NASA medical technical brief 2024 [nasa-mtb-2024], Brunstetter 2024 [brunstetter2024],
 * Nguyen 2025 [nguyen2025]. Research: sans-evolucion-y-logica-clinica.md, B1.
 */
export const TRT_CLINICALLY_CONCERNING_UM = 55;

/**
 * An increase of the roughness of Bruch's membrane LARGER than this indicates new
 * folds. It is two standard deviations of the repeatability next to the optic nerve.
 * Ferguson 2023 [ferguson2023]. Research: sans-oct-base-tecnica.md, 5.2.
 */
export const BM_ROUGHNESS_FOLDS_UM = 2.8;

/**
 * A near acuity EQUAL TO OR WORSE than the pre-flight value by this much is taken as
 * a real change. ASSUMPTION OF THIS PROJECT: NASA publishes no such threshold. It sits
 * just above the test–retest variation of the test (`ACUITY_RETEST_LIMIT_LOGMAR`).
 * Research: pruebas-de-vision-en-pantalla.md, 1.C and 2.
 */
export const ACUITY_REAL_CHANGE_LOGMAR = 0.2;

/**
 * Limits of agreement (95 %) between a test and its repetition for an adaptive
 * Landolt C test of 18 trials: ±0.17 logMAR. Measured on Earth, at 4 m, in 26 people;
 * applying it to this near test is an approximation. Bach 2025 [bach2025].
 * Research: pruebas-de-vision-en-pantalla.md, 1.C and 2.
 */
export const ACUITY_RETEST_LIMIT_LOGMAR = 0.17;
/** Trials of the test the limit above was measured with. Same source. */
export const ACUITY_RETEST_MIN_TRIALS = 18;

/**
 * Marked fraction of the Amsler grid from which the marks are treated as an acute
 * symptom, wherever they are. ASSUMPTION OF THIS PROJECT.
 */
export const AMSLER_EXTENSIVE_FRACTION = 0.05;

export interface ThresholdDefinition {
  value: number;
  unit: Unit;
  /** `>`: only a larger value passes. `>=`: the value itself passes too. */
  comparison: '>' | '>=';
  /** Whether the threshold is NASA's published criterion or an assumption of this project. */
  basis: 'nasa' | 'assumption';
  sources: readonly RuleSourceId[];
}

export const THRESHOLDS = {
  TRT_FIRST_SIGN_UM: {
    value: TRT_FIRST_SIGN_UM,
    unit: 'µm',
    comparison: '>',
    basis: 'nasa',
    sources: ['laurie2020', 'nasa-mtb-2024'],
  },
  TRT_CLINICALLY_CONCERNING_UM: {
    value: TRT_CLINICALLY_CONCERNING_UM,
    unit: 'µm',
    comparison: '>=',
    basis: 'nasa',
    sources: ['nasa-mtb-2024', 'brunstetter2024', 'nguyen2025'],
  },
  BM_ROUGHNESS_FOLDS_UM: {
    value: BM_ROUGHNESS_FOLDS_UM,
    unit: 'µm',
    comparison: '>',
    basis: 'nasa',
    sources: ['ferguson2023'],
  },
  ACUITY_REAL_CHANGE_LOGMAR: {
    value: ACUITY_REAL_CHANGE_LOGMAR,
    unit: 'logMAR',
    comparison: '>=',
    basis: 'assumption',
    sources: ['bach2025'],
  },
  AMSLER_EXTENSIVE_FRACTION: {
    value: AMSLER_EXTENSIVE_FRACTION,
    unit: '',
    comparison: '>=',
    basis: 'assumption',
    sources: [],
  },
} as const satisfies Readonly<Record<string, ThresholdDefinition>>;

type ThresholdId = ThresholdAssessment['thresholdId'];

/** The definition behind each threshold the imaging rules assess. */
export const IMAGING_THRESHOLDS: Readonly<Record<ThresholdId, ThresholdDefinition>> = {
  'trt-first-sign': THRESHOLDS.TRT_FIRST_SIGN_UM,
  'trt-clinically-concerning': THRESHOLDS.TRT_CLINICALLY_CONCERNING_UM,
  'folds-new': THRESHOLDS.BM_ROUGHNESS_FOLDS_UM,
};

/** A threshold as the published reference value it is, ready to be shown. */
export function thresholdQuantity(id: ThresholdId): Quantity {
  const definition = IMAGING_THRESHOLDS[id];
  return { value: definition.value, unit: definition.unit, origin: 'reference', sources: definition.sources };
}
