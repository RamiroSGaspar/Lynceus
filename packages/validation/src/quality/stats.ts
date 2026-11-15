/** Small, deterministic statistics for the validation: no library, no randomness. */

export function mean(values: readonly number[]): number {
  return values.length === 0 ? NaN : values.reduce((a, b) => a + b, 0) / values.length;
}

export function sd(values: readonly number[]): number {
  if (values.length < 2) return NaN;
  const m = mean(values);
  return Math.sqrt(values.reduce((a, b) => a + (b - m) ** 2, 0) / (values.length - 1));
}

export function rmse(values: readonly number[]): number {
  return values.length === 0 ? NaN : Math.sqrt(values.reduce((a, b) => a + b * b, 0) / values.length);
}

/** Quantile with linear interpolation between order statistics (type 7). */
export function quantile(values: readonly number[], p: number): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const h = (sorted.length - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return sorted[lo]! + (h - lo) * (sorted[hi]! - sorted[lo]!);
}

export function pearson(x: readonly number[], y: readonly number[]): number {
  const mx = mean(x);
  const my = mean(y);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i]! - mx) * (y[i]! - my);
    sxx += (x[i]! - mx) ** 2;
    syy += (y[i]! - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}

/** Wilson score interval for a proportion, 95 %. */
export function wilson(successes: number, n: number): [number, number] {
  if (n === 0) return [NaN, NaN];
  const z = 1.959963984540054;
  const p = successes / n;
  const denominator = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denominator;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denominator;
  return [centre - half, centre + half];
}

/** Nelder–Mead minimisation with the standard coefficients. Deterministic. */
export function nelderMead(f: (x: number[]) => number, start: readonly number[], step = 0.5, maxIterations = 4000, tolerance = 1e-10): { x: number[]; value: number } {
  const n = start.length;
  let simplex: { x: number[]; v: number }[] = [{ x: [...start], v: f([...start]) }];
  for (let i = 0; i < n; i++) {
    const x = [...start];
    x[i] = x[i]! + step;
    simplex.push({ x, v: f(x) });
  }
  const combine = (a: number[], b: number[], t: number) => a.map((ai, i) => ai + t * (b[i]! - ai));
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    simplex.sort((a, b) => a.v - b.v);
    const best = simplex[0]!;
    const worst = simplex[n]!;
    if (Math.abs(worst.v - best.v) <= tolerance * (Math.abs(best.v) + tolerance)) break;
    const centroid = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) centroid[j]! += simplex[i]!.x[j]! / n;
    const reflected = combine(centroid, worst.x, -1);
    const vr = f(reflected);
    if (vr < best.v) {
      const expanded = combine(centroid, worst.x, -2);
      const ve = f(expanded);
      simplex[n] = ve < vr ? { x: expanded, v: ve } : { x: reflected, v: vr };
    } else if (vr < simplex[n - 1]!.v) {
      simplex[n] = { x: reflected, v: vr };
    } else {
      const contracted = vr < worst.v ? combine(centroid, worst.x, -0.5) : combine(centroid, worst.x, 0.5);
      const vc = f(contracted);
      if (vc < Math.min(vr, worst.v)) {
        simplex[n] = { x: contracted, v: vc };
      } else {
        simplex = simplex.map((p, i) => (i === 0 ? p : { x: combine(best.x, p.x, 0.5), v: f(combine(best.x, p.x, 0.5)) }));
      }
    }
  }
  simplex.sort((a, b) => a.v - b.v);
  return { x: simplex[0]!.x, value: simplex[0]!.v };
}
