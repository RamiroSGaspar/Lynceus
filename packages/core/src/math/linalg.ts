/**
 * Small dense linear algebra: enough for least-squares fits of a few parameters.
 */

/** Solves A x = b for a small square system by Gaussian elimination with partial pivoting. Returns null if singular. */
export function solveLinear(a: number[][], b: number[]): number[] | null {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]!]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r;
    if (Math.abs(m[pivot]![col]!) < 1e-300) return null;
    if (pivot !== col) {
      const tmp = m[col]!;
      m[col] = m[pivot]!;
      m[pivot] = tmp;
    }
    const prow = m[col]!;
    for (let r = col + 1; r < n; r++) {
      const row = m[r]!;
      const f = row[col]! / prow[col]!;
      if (f === 0) continue;
      for (let c = col; c <= n; c++) row[c] = row[c]! - f * prow[c]!;
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    const row = m[r]!;
    let s = row[n]!;
    for (let c = r + 1; c < n; c++) s -= row[c]! * x[c]!;
    x[r] = s / row[r]!;
  }
  return x;
}

/** Least squares: minimises |J p − y|² through the normal equations. */
export function leastSquares(rows: readonly (readonly number[])[], y: readonly number[]): number[] | null {
  const k = rows[0]?.length ?? 0;
  const ata: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  const aty = new Array<number>(k).fill(0);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    for (let p = 0; p < k; p++) {
      aty[p] = aty[p]! + r[p]! * y[i]!;
      const ap = ata[p]!;
      for (let q = 0; q < k; q++) ap[q] = ap[q]! + r[p]! * r[q]!;
    }
  }
  return solveLinear(ata, aty);
}

/**
 * Residuals of a least-squares polynomial of degree 2 in x, written into `out`.
 * x is centred and scaled first for numerical stability. Returns false when the
 * fit is impossible (fewer than 3 distinct points).
 */
export function quadraticResiduals(x: ArrayLike<number>, y: ArrayLike<number>, n: number, out: Float64Array): boolean {
  if (n < 3) return false;
  let mx = 0;
  for (let i = 0; i < n; i++) mx += x[i]!;
  mx /= n;
  let sx = 0;
  for (let i = 0; i < n; i++) sx = Math.max(sx, Math.abs(x[i]! - mx));
  if (sx === 0) return false;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, t0 = 0, t1 = 0, t2 = 0;
  for (let i = 0; i < n; i++) {
    const u = (x[i]! - mx) / sx;
    const u2 = u * u;
    const v = y[i]!;
    s0 += 1;
    s1 += u;
    s2 += u2;
    s3 += u2 * u;
    s4 += u2 * u2;
    t0 += v;
    t1 += v * u;
    t2 += v * u2;
  }
  const c = solveLinear(
    [
      [s0, s1, s2],
      [s1, s2, s3],
      [s2, s3, s4],
    ],
    [t0, t1, t2],
  );
  if (!c) return false;
  for (let i = 0; i < n; i++) {
    const u = (x[i]! - mx) / sx;
    out[i] = y[i]! - (c[0]! + c[1]! * u + c[2]! * u * u);
  }
  return true;
}
