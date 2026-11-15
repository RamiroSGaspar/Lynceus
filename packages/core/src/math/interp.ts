/**
 * Monotone cubic interpolation (Fritsch & Carlson, 1980): a smooth curve through
 * the points that never overshoots between them. Outside the range it holds the
 * end values.
 */
export function monotoneCubic(xs: readonly number[], ys: readonly number[]): (x: number) => number {
  const n = xs.length;
  if (n !== ys.length || n < 2) throw new Error('monotoneCubic needs at least two points of equal length');
  for (let i = 1; i < n; i++) if (!(xs[i]! > xs[i - 1]!)) throw new Error('monotoneCubic needs increasing x');
  const h: number[] = [];
  const delta: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(xs[i + 1]! - xs[i]!);
    delta.push((ys[i + 1]! - ys[i]!) / h[i]!);
  }
  const m: number[] = new Array<number>(n).fill(0);
  m[0] = delta[0]!;
  m[n - 1] = delta[n - 2]!;
  for (let i = 1; i < n - 1; i++) {
    const d0 = delta[i - 1]!;
    const d1 = delta[i]!;
    if (d0 * d1 <= 0) {
      m[i] = 0;
    } else {
      // Weighted harmonic mean (Fritsch–Butland), which keeps the curve monotone.
      const w1 = 2 * h[i]! + h[i - 1]!;
      const w2 = h[i]! + 2 * h[i - 1]!;
      m[i] = (w1 + w2) / (w1 / d0 + w2 / d1);
    }
  }
  return (x: number): number => {
    if (x <= xs[0]!) return ys[0]!;
    if (x >= xs[n - 1]!) return ys[n - 1]!;
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid]! <= x) lo = mid;
      else hi = mid;
    }
    const t = (x - xs[lo]!) / h[lo]!;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[lo]! +
      (t3 - 2 * t2 + t) * h[lo]! * m[lo]! +
      (-2 * t3 + 3 * t2) * ys[lo + 1]! +
      (t3 - t2) * h[lo]! * m[lo + 1]!
    );
  };
}

/** Linear interpolation in a table with increasing x, holding the end values outside. */
export function linearInterp(xs: readonly number[], ys: readonly number[], x: number): number {
  const n = xs.length;
  if (x <= xs[0]!) return ys[0]!;
  if (x >= xs[n - 1]!) return ys[n - 1]!;
  let i = 1;
  while (xs[i]! < x) i++;
  const t = (x - xs[i - 1]!) / (xs[i]! - xs[i - 1]!);
  return ys[i - 1]! + t * (ys[i]! - ys[i - 1]!);
}

/** 0 below `a`, 1 above `b`, smooth (C1) in between. */
export function smoothstep(a: number, b: number, x: number): number {
  if (x <= a) return 0;
  if (x >= b) return 1;
  const t = (x - a) / (b - a);
  return t * t * (3 - 2 * t);
}

export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

/** Finds x in [lo, hi] with f(x) = target for a monotone f, by bisection. */
export function bisect(f: (x: number) => number, target: number, lo: number, hi: number, iterations = 60): number {
  let flo = f(lo) - target;
  const increasing = f(hi) - target > flo;
  for (let i = 0; i < iterations; i++) {
    const mid = 0.5 * (lo + hi);
    const fm = f(mid) - target;
    if (fm === 0) return mid;
    if ((fm < 0) === increasing) {
      lo = mid;
      flo = fm;
    } else {
      hi = mid;
    }
  }
  return 0.5 * (lo + hi);
}
