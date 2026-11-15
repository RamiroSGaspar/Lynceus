/**
 * Numbers as they are written in the texts. Done by hand, not with `Intl`, so
 * the same value gives the same characters on every machine.
 */
import type { LikelihoodWord } from '../contract';
import type { Locale } from '../product';
import { likelihoodWord } from '../rules/probability';

/** No-break space: keeps a number and its unit on the same line. */
export const NBSP = '\u00a0';
/** A true minus sign, not a hyphen. */
export const MINUS = '\u2212';

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return rounded === 0 ? 0 : rounded;
}

/** A number without its sign, with a fixed count of decimals and the decimal mark of the language. */
export function formatMagnitude(value: number, decimals: number, locale: Locale): string {
  const text = Math.abs(roundTo(value, decimals)).toFixed(decimals);
  return locale === 'es' ? text.replace('.', ',') : text;
}

/** A number with a minus sign when it is negative and no sign otherwise. */
export function formatNumber(value: number, decimals: number, locale: Locale): string {
  return (roundTo(value, decimals) < 0 ? MINUS : '') + formatMagnitude(value, decimals, locale);
}

/** A rounded number split into its sign and its absolute value, as the texts need them. */
export interface SignedText {
  sign: -1 | 0 | 1;
  /** Absolute value. */
  abs: string;
  /** With a minus sign when negative. */
  signed: string;
}

export function signedText(value: number, decimals: number, locale: Locale): SignedText {
  const rounded = roundTo(value, decimals);
  return {
    sign: rounded > 0 ? 1 : rounded < 0 ? -1 : 0,
    abs: formatMagnitude(value, decimals, locale),
    signed: formatNumber(value, decimals, locale),
  };
}

/**
 * Fewest decimals, from `minimum` up to 3, with which the rounded value stays on
 * the same side of every limit as the exact value. A text must never show
 * "19 µm" next to "above the threshold of 19.4 µm".
 */
export function decimalsFor(value: number, limits: readonly number[], minimum: number): number {
  for (let decimals = minimum; decimals < 3; decimals++) {
    const rounded = roundTo(value, decimals);
    if (limits.every((limit) => Math.sign(rounded - limit) === Math.sign(value - limit))) return decimals;
  }
  return 3;
}

export type PercentText =
  | { kind: 'value'; text: string }
  /** Less than 1 % or more than 99 %: said in words, never as 0 % or 100 %. */
  | { kind: 'below' | 'above'; text: string };

/**
 * A probability as a percentage that agrees with its word: whole numbers, one
 * decimal when rounding would move it into the next word's range (89.6 % stays
 * "likely (89.6 %)"), and never 0 % or 100 %, which would claim a certainty the
 * measurement does not have.
 */
export function percentText(probability: number, word: LikelihoodWord, locale: Locale): PercentText {
  const percent = probability * 100;
  const whole = Math.round(percent);
  if (whole <= 0) return { kind: 'below', text: `1${NBSP}%` };
  if (whole >= 100) return { kind: 'above', text: `99${NBSP}%` };
  if (likelihoodWord(whole / 100) === word) return { kind: 'value', text: `${whole}${NBSP}%` };
  // Rounding crossed the lower edge of the next word: cut to one decimal instead.
  const cut = Math.floor(percent * 10) / 10;
  return { kind: 'value', text: `${formatMagnitude(cut, 1, locale)}${NBSP}%` };
}

/** First letter in upper case. */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
