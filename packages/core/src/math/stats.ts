/** Descriptive statistics on plain arrays. NaN values are ignored where stated. */

export function mean(values: ArrayLike<number>): number {
  let s = 0;
  let n = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (Number.isNaN(v)) continue;
    s += v;
    n++;
  }
  return n > 0 ? s / n : NaN;
}

/** Percentile (0–100) with linear interpolation between order statistics; ignores NaN. */
export function percentile(values: ArrayLike<number>, p: number): number {
  const sorted: number[] = [];
  for (let i = 0; i < values.length; i++) if (!Number.isNaN(values[i]!)) sorted.push(values[i]!);
  if (sorted.length === 0) return NaN;
  sorted.sort((a, b) => a - b);
  const pos = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(sorted.length - 1, lo + 1);
  return sorted[lo]! + (pos - lo) * (sorted[hi]! - sorted[lo]!);
}

export function median(values: ArrayLike<number>): number {
  return percentile(values, 50);
}

/** Median absolute deviation, scaled to estimate a normal standard deviation. */
export function robustSd(values: ArrayLike<number>): number {
  const m = median(values);
  const dev: number[] = [];
  for (let i = 0; i < values.length; i++) if (!Number.isNaN(values[i]!)) dev.push(Math.abs(values[i]! - m));
  return 1.4826 * median(dev);
}

export function rms(values: ArrayLike<number>): number {
  let s = 0;
  let n = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (Number.isNaN(v)) continue;
    s += v * v;
    n++;
  }
  return n > 0 ? Math.sqrt(s / n) : NaN;
}

/** Angle wrapped to [0, 360). */
export function wrapDeg(deg: number): number {
  const w = deg % 360;
  return w < 0 ? w + 360 : w;
}
