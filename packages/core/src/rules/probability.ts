/**
 * From a measured change and its error to the probability that the true change
 * is beyond a threshold, and to the word that goes with that probability.
 */
import type { LikelihoodWord } from '../contract';

/**
 * Standard normal cumulative distribution Φ(x).
 * Hart's rational approximation (1968) in the double-precision form given by West
 * (2005, "Better approximations to cumulative normal functions"): absolute error
 * below 1e-15, and exactly 0.5 at x = 0.
 */
export function normalCdf(x: number): number {
  if (Number.isNaN(x)) return NaN;
  const z = Math.abs(x);
  let tail: number;
  if (z > 37) {
    tail = 0;
  } else {
    const exponential = Math.exp(-(z * z) / 2);
    if (z < 7.07106781186547) {
      let numerator = 3.52624965998911e-2 * z + 0.700383064443688;
      numerator = numerator * z + 6.37396220353165;
      numerator = numerator * z + 33.912866078383;
      numerator = numerator * z + 112.079291497871;
      numerator = numerator * z + 221.213596169931;
      numerator = numerator * z + 220.206867912376;
      let denominator = 8.83883476483184e-2 * z + 1.75566716318264;
      denominator = denominator * z + 16.064177579207;
      denominator = denominator * z + 86.7807322029461;
      denominator = denominator * z + 296.564248779674;
      denominator = denominator * z + 637.333633378831;
      denominator = denominator * z + 793.826512519948;
      denominator = denominator * z + 440.413735824752;
      tail = (exponential * numerator) / denominator;
    } else {
      let fraction = z + 0.65;
      fraction = z + 4 / fraction;
      fraction = z + 3 / fraction;
      fraction = z + 2 / fraction;
      fraction = z + 1 / fraction;
      tail = exponential / (fraction * 2.506628274631);
    }
  }
  return x > 0 ? 1 - tail : tail;
}

/**
 * Lower edge of each word, as a probability. The scale is an assumption of this
 * project (arquitectura.md, section 12, item 3): below 10 % `unlikely`, from 10 to
 * 50 % `possible`, from 50 to 90 % `likely`, 90 % or more `very-likely`.
 */
export const LIKELIHOOD_EDGES = { possible: 0.1, likely: 0.5, veryLikely: 0.9 } as const;

export function likelihoodWord(probability: number): LikelihoodWord {
  if (probability >= LIKELIHOOD_EDGES.veryLikely) return 'very-likely';
  if (probability >= LIKELIHOOD_EDGES.likely) return 'likely';
  if (probability >= LIKELIHOOD_EDGES.possible) return 'possible';
  return 'unlikely';
}

/** Probability that the true value is beyond the threshold, given the measured value and its standard error. */
export function probabilityBeyond(value: number, threshold: number, standardError: number): number {
  if (!(standardError > 0)) return value > threshold ? 1 : value < threshold ? 0 : 0.5;
  return normalCdf((value - threshold) / standardError);
}

/**
 * Difference of two values without the last-bit noise of binary arithmetic
 * (415.4 − 396 gives 19.399999999999977). Rounded to a millionth of the unit, far
 * below anything measurable, so that a threshold written in decimals behaves as
 * it is written.
 */
export function cleanDifference(current: number, reference: number): number {
  return Math.round((current - reference) * 1e6) / 1e6;
}
