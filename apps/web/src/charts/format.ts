import { bandOf, type ChangeThresholds } from './scale';

/**
 * Decimal places a change needs so that the number on screen falls on the same
 * side of NASA's thresholds as the measured value. Whole micrometres are enough
 * almost always; a value just past a threshold gets the decimals that show it.
 */
export function changeDigits(valueUm: number, thresholds: ChangeThresholds): number {
  const band = bandOf(valueUm, thresholds);
  for (const digits of [0, 1, 2]) {
    if (bandOf(Number(valueUm.toFixed(digits)), thresholds) === band) return digits;
  }
  return 2;
}

/** Number format of a change: explicit sign, and the decimals `changeDigits` asks for. */
export function changeFormat(valueUm: number, thresholds: ChangeThresholds): Intl.NumberFormatOptions {
  const digits = changeDigits(valueUm, thresholds);
  return { minimumFractionDigits: digits, maximumFractionDigits: digits, signDisplay: 'exceptZero' };
}
