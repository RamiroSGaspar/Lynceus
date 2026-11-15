/**
 * Error model of the engine: how far a measured change can be from the true one.
 * The probability of having passed a threshold comes from it.
 *
 * The real model is the error measured in the validation stage, as a function of
 * the capture quality. Until it exists, `PROVISIONAL_ERROR_MODEL` stands in for it.
 */
import type { ExamQuality } from '../contract';

/** Whether an error model has a measured error for an exam: when not, which variable is outside and why. */
export type ErrorModelSupport =
  | { supported: true }
  | { supported: false; feature: string; reason: 'not-a-number' | 'beyond-validated-range' };

export interface ErrorModel {
  version: string;
  /** Standard error of the change of the 0–250 µm ring between two exams. */
  trtChangeSeUm(current: ExamQuality, baseline: ExamQuality): number;
  /** Standard error of the change of the roughness of Bruch's membrane between two exams. */
  roughnessChangeSeUm(current: ExamQuality, baseline: ExamQuality): number;
  /**
   * Whether the model was validated for an exam like this one. Absent: every exam is
   * supported (the provisional model makes no claim of its own to restrict). An exam
   * that is not supported is not measured: no number is shown for it.
   */
  supports?(quality: ExamQuality): ErrorModelSupport;
}

// PROVISIONAL values, an assumption of this project until the validation stage
// measures the engine (especificaciones/04-reglas-y-textos.md, section 3).
/** Mean quality from which one exam has the smallest error. */
const GOOD_QUALITY_DB = 27;
/** Quality below which the instrument's manual calls the signal poor (sans-oct-base-tecnica.md, 1.A). */
const POOR_QUALITY_DB = 15;
/** Error of the ring of one exam at `GOOD_QUALITY_DB` or better, µm. */
const RING_SE_GOOD_UM = 3;
/** Error of the ring of one exam at `POOR_QUALITY_DB`, µm. */
const RING_SE_POOR_UM = 6;
/** Error of the roughness of one exam, µm. */
const ROUGHNESS_SE_UM = 0.8;

/**
 * Provisional error of the ring of one exam: 3 µm with a mean quality of 27 dB or
 * more, rising in a straight line to 6 µm at 15 dB. Below 15 dB the same line
 * continues, so the error keeps growing as the signal gets worse; a quality that
 * is not a number counts as 0 dB.
 */
export function provisionalRingSeUm(meanQualityDb: number): number {
  const quality = Number.isFinite(meanQualityDb) ? meanQualityDb : 0;
  if (quality >= GOOD_QUALITY_DB) return RING_SE_GOOD_UM;
  const slope = (RING_SE_POOR_UM - RING_SE_GOOD_UM) / (GOOD_QUALITY_DB - POOR_QUALITY_DB);
  return RING_SE_GOOD_UM + (GOOD_QUALITY_DB - quality) * slope;
}

/** The error of a difference of two independent measurements: root of the sum of squares. */
function combine(a: number, b: number): number {
  return Math.sqrt(a * a + b * b);
}

/** PROVISIONAL: replaced by the validated model without touching the rules. */
export const PROVISIONAL_ERROR_MODEL: ErrorModel = {
  version: 'provisional-1',
  trtChangeSeUm: (current, baseline) =>
    combine(provisionalRingSeUm(current.meanQualityDb), provisionalRingSeUm(baseline.meanQualityDb)),
  roughnessChangeSeUm: () => combine(ROUGHNESS_SE_UM, ROUGHNESS_SE_UM),
};

/** Whether an error model version is the provisional stand-in. */
export function isProvisionalErrorModel(version: string | undefined): boolean {
  return version === undefined || version.startsWith('provisional');
}
