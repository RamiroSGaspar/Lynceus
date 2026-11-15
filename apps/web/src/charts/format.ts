import type { Locale } from '@app/core';
import { decimalsBeside, formatSigned } from '../app/format';
import type { ChangeThresholds } from './scale';

/**
 * Decimal places a change needs so that the number on screen falls on the same
 * side of NASA's thresholds as the measured value. Whole micrometres are enough
 * almost always; a value just past a threshold gets the decimals that show it.
 */
export function changeDigits(valueUm: number, thresholds: ChangeThresholds): number {
  return decimalsBeside(valueUm, [thresholds.firstSignUm, thresholds.clinicallyConcerningUm]);
}

/**
 * A change in micrometres with its sign. `like` is the value whose decimals to
 * use, so the ends of a range are written like the value they belong to.
 */
export function formatChange(
  valueUm: number,
  thresholds: ChangeThresholds,
  locale: Locale,
  like: number = valueUm,
): string {
  return formatSigned(valueUm, changeDigits(like, thresholds), locale);
}
