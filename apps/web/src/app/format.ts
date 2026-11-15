/**
 * Numbers as the screens write them. They go through the same functions as the
 * texts of the core, so a value reads the same in a sentence, on a chart and in
 * a table: same decimals, same decimal mark, a true minus sign.
 */
import type { LikelihoodWord, Locale } from '@app/core';
import { decimalsFor, formatNumber, percentText, signedText } from '@app/core/texts/format';

/** A number with a fixed count of decimals and the decimal mark of the language. */
export function formatPlain(value: number, decimals: number, locale: Locale): string {
  return formatNumber(value, decimals, locale);
}

/** A number with an explicit sign: `+24`, `−5`, `0`. For changes, never for absolute values. */
export function formatSigned(value: number, decimals: number, locale: Locale): string {
  const text = signedText(value, decimals, locale);
  return text.sign > 0 ? `+${text.abs}` : text.signed;
}

/**
 * Decimals a value needs so that, once rounded, it stays on the same side of
 * every limit as the exact value: whole numbers almost always, more just past a limit.
 */
export function decimalsBeside(value: number, limits: readonly number[], minimum = 0): number {
  return decimalsFor(value, limits, minimum);
}

/** A published value with the decimals it is written with: 19.4, 55, 2.8. */
export function formatExact(value: number, locale: Locale): string {
  const decimals = (String(value).split('.')[1] ?? '').length;
  return formatNumber(value, decimals, locale);
}

export type PercentLabel = { kind: 'value' | 'below' | 'above'; text: string };

/**
 * A probability as a percentage that agrees with its word, and never 0 % or
 * 100 %: beyond the ends it is "less than 1 %" or "more than 99 %".
 */
export function percentLabel(probability: number, word: LikelihoodWord, locale: Locale): PercentLabel {
  return percentText(probability, word, locale);
}
