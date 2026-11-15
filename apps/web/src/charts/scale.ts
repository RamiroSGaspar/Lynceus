/**
 * Scales of the two charts. Pure functions: no DOM, no React.
 *
 * The change axis is deliberately one of a few fixed ranges. People do not adapt
 * well to a scale that changes with every value (research doc
 * `comunicar-resultados-de-salud.md`, table row 3), so the range only steps up
 * when a value would not fit.
 */

export interface Domain {
  min: number;
  max: number;
}

/** Thresholds of the change axis, in micrometres. They are passed in from the core, never written here. */
export interface ChangeThresholds {
  firstSignUm: number;
  clinicallyConcerningUm: number;
}

export type BandId = 'normal-variation' | 'first-sign' | 'clinically-concerning';

/** Default start of the change axis, in micrometres (specification 02, section 3.1). */
export const CHANGE_AXIS_MIN_UM = -20;
/** Default end of the change axis and its two extensions, in micrometres (specification 02, section 3.1). */
export const CHANGE_AXIS_MAXIMA_UM: readonly number[] = [80, 140, 260];

/**
 * Range of a change axis that fits every value given: −20 to +80 µm by default,
 * extended to +140 or +260 when needed. It always starts on a round value and
 * always contains 0, the pre-flight exam.
 */
export function changeDomain(valuesUm: readonly (number | null | undefined)[]): Domain {
  let lowest = 0;
  let highest = 0;
  for (const value of valuesUm) {
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    lowest = Math.min(lowest, value);
    highest = Math.max(highest, value);
  }
  const max = CHANGE_AXIS_MAXIMA_UM.find((limit) => highest <= limit) ?? Math.ceil(highest / 100) * 100;
  const min = lowest >= CHANGE_AXIS_MIN_UM ? CHANGE_AXIS_MIN_UM : Math.floor(lowest / 20) * 20;
  return { min, max };
}

/** The smallest range that contains all the ranges given. Lets two charts share one scale. */
export function unionDomain(domains: readonly Domain[]): Domain {
  return domains.reduce(
    (union, domain) => ({ min: Math.min(union.min, domain.min), max: Math.max(union.max, domain.max) }),
    { min: CHANGE_AXIS_MIN_UM, max: CHANGE_AXIS_MAXIMA_UM[0] ?? 80 },
  );
}

/** Maps a value of the domain to a position between `start` and `end` (which may be reversed). */
export function linearScale(domain: Domain, start: number, end: number): (value: number) => number {
  const span = domain.max - domain.min;
  return (value) => (span === 0 ? start : start + ((value - domain.min) / span) * (end - start));
}

const TICK_STEPS: readonly number[] = [20, 50, 100, 200, 500, 1000];

/** The smallest round step whose ticks are at least `minSpacingPx` apart on an axis `lengthPx` long. */
export function tickStep(domain: Domain, lengthPx: number, minSpacingPx: number): number {
  const pxPerUnit = lengthPx / (domain.max - domain.min);
  return TICK_STEPS.find((step) => step * pxPerUnit >= minSpacingPx) ?? (TICK_STEPS.at(-1) as number);
}

/** Multiples of `step` inside the domain, limits included. */
export function ticks(domain: Domain, step: number): number[] {
  const values: number[] = [];
  for (let value = Math.ceil(domain.min / step) * step; value <= domain.max + 1e-9; value += step) {
    values.push(value === 0 ? 0 : value);
  }
  return values;
}

/**
 * The band a change falls in. The limits are NASA's criteria as written: first
 * sign is an increase ABOVE the first threshold, clinically concerning is an
 * increase EQUAL TO OR ABOVE the second.
 */
export function bandOf(changeUm: number, thresholds: ChangeThresholds): BandId {
  if (changeUm >= thresholds.clinicallyConcerningUm) return 'clinically-concerning';
  if (changeUm > thresholds.firstSignUm) return 'first-sign';
  return 'normal-variation';
}

/** The three bands of a change axis, from the lowest, with their limits clipped to the domain. */
export function bands(domain: Domain, thresholds: ChangeThresholds): { id: BandId; from: number; to: number }[] {
  const clip = (value: number): number => Math.min(Math.max(value, domain.min), domain.max);
  return [
    { id: 'normal-variation', from: domain.min, to: clip(thresholds.firstSignUm) },
    { id: 'first-sign', from: clip(thresholds.firstSignUm), to: clip(thresholds.clinicallyConcerningUm) },
    { id: 'clinically-concerning', from: clip(thresholds.clinicallyConcerningUm), to: domain.max },
  ];
}
