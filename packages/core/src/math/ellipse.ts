/**
 * Ellipses: fitting, area and point-to-ellipse distance. Units are whatever the
 * caller uses, as long as both axes share them.
 */
import { leastSquares, solveLinear } from './linalg';
import { robustSd } from './stats';

export interface Ellipse {
  cx: number;
  cy: number;
  /** Semi-axis along `angle`. */
  a: number;
  /** Semi-axis perpendicular to `angle`. */
  b: number;
  /** Orientation of the `a` axis, radians from the x axis. */
  angle: number;
}

export function ellipseArea(e: Ellipse): number {
  return Math.PI * e.a * e.b;
}

/** The same ellipse written with a ≥ b and the angle in [0, π). */
export function normalizeEllipse(e: Ellipse): Ellipse {
  let { a, b, angle } = e;
  a = Math.abs(a);
  b = Math.abs(b);
  if (b > a) {
    const t = a;
    a = b;
    b = t;
    angle += Math.PI / 2;
  }
  angle %= Math.PI;
  if (angle < 0) angle += Math.PI;
  return { cx: e.cx, cy: e.cy, a, b, angle };
}

/** Point on the ellipse at parameter t, and its outward unit normal, speed |dP/dt| and curvature. */
export function ellipseFrame(e: Ellipse, t: number): { x: number; y: number; nx: number; ny: number; speed: number; curvature: number } {
  const ca = Math.cos(e.angle);
  const sa = Math.sin(e.angle);
  const ct = Math.cos(t);
  const st = Math.sin(t);
  const lx = e.a * ct;
  const ly = e.b * st;
  const x = e.cx + ca * lx - sa * ly;
  const y = e.cy + sa * lx + ca * ly;
  // Outward normal in local axes: (b cos t, a sin t).
  const nlx = e.b * ct;
  const nly = e.a * st;
  const nl = Math.hypot(nlx, nly);
  const nx = (ca * nlx - sa * nly) / nl;
  const ny = (sa * nlx + ca * nly) / nl;
  const speed = Math.sqrt(e.a * e.a * st * st + e.b * e.b * ct * ct);
  const curvature = (e.a * e.b) / (speed * speed * speed);
  return { x, y, nx, ny, speed, curvature };
}

function robustLength(v0: number, v1: number): number {
  const m = Math.max(Math.abs(v0), Math.abs(v1));
  if (m === 0) return 0;
  return m * Math.hypot(v0 / m, v1 / m);
}

/**
 * Distance from (y0, y1) ≥ 0 to the axis-aligned ellipse with semi-axes e0 ≥ e1
 * (Eberly, "Distance from a point to an ellipse", robust bisection).
 */
function distanceFirstQuadrant(e0: number, e1: number, y0: number, y1: number): number {
  if (y1 > 0) {
    if (y0 > 0) {
      const z0 = y0 / e0;
      const z1 = y1 / e1;
      const g = z0 * z0 + z1 * z1 - 1;
      if (g === 0) return 0;
      const r0 = (e0 / e1) * (e0 / e1);
      const n0 = r0 * z0;
      let s0 = z1 - 1;
      let s1 = g < 0 ? 0 : robustLength(n0, z1) - 1;
      let s = 0;
      for (let i = 0; i < 160; i++) {
        s = 0.5 * (s0 + s1);
        if (s === s0 || s === s1) break;
        const ratio0 = n0 / (s + r0);
        const ratio1 = z1 / (s + 1);
        const gg = ratio0 * ratio0 + ratio1 * ratio1 - 1;
        if (gg > 0) s0 = s;
        else if (gg < 0) s1 = s;
        else break;
      }
      const x0 = (r0 * y0) / (s + r0);
      const x1 = y1 / (s + 1);
      return Math.hypot(x0 - y0, x1 - y1);
    }
    return Math.abs(y1 - e1);
  }
  const numer0 = e0 * y0;
  const denom0 = e0 * e0 - e1 * e1;
  if (numer0 < denom0) {
    const xde0 = numer0 / denom0;
    const x0 = e0 * xde0;
    const x1 = e1 * Math.sqrt(1 - xde0 * xde0);
    return Math.hypot(x0 - y0, x1);
  }
  return Math.abs(y0 - e0);
}

/** Signed Euclidean distance from (x, y) to the ellipse: positive outside, negative inside. */
export function ellipseSignedDistance(e: Ellipse, x: number, y: number): number {
  const ca = Math.cos(e.angle);
  const sa = Math.sin(e.angle);
  const dx = x - e.cx;
  const dy = y - e.cy;
  let u = ca * dx + sa * dy;
  let v = -sa * dx + ca * dy;
  let e0 = Math.abs(e.a);
  let e1 = Math.abs(e.b);
  if (e1 > e0) {
    const t = e0;
    e0 = e1;
    e1 = t;
    const tu = u;
    u = v;
    v = tu;
  }
  const inside = (u / e0) * (u / e0) + (v / e1) * (v / e1) < 1;
  const d = distanceFirstQuadrant(e0, e1, Math.abs(u), Math.abs(v));
  return inside ? -d : d;
}

/**
 * Algebraic conic fit with the rotation-invariant constraint A + C = 1, then
 * conversion to centre, axes and angle. Returns null if the points do not
 * describe an ellipse.
 */
export function fitEllipseAlgebraic(xs: ArrayLike<number>, ys: ArrayLike<number>): Ellipse | null {
  const n = xs.length;
  if (n < 5) return null;
  let mx = 0;
  let my = 0;
  for (let i = 0; i < n; i++) {
    mx += xs[i]!;
    my += ys[i]!;
  }
  mx /= n;
  my /= n;
  let scale = 0;
  for (let i = 0; i < n; i++) scale = Math.max(scale, Math.hypot(xs[i]! - mx, ys[i]! - my));
  if (scale === 0) return null;
  const rows: number[][] = [];
  const rhs: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = (xs[i]! - mx) / scale;
    const y = (ys[i]! - my) / scale;
    rows.push([x * x - y * y, x * y, x, y, 1]);
    rhs.push(-y * y);
  }
  const p = leastSquares(rows, rhs);
  if (!p) return null;
  const A = p[0]!;
  const B = p[1]!;
  const C = 1 - A;
  const D = p[2]!;
  const E = p[3]!;
  const F = p[4]!;
  const centre = solveLinear(
    [
      [2 * A, B],
      [B, 2 * C],
    ],
    [-D, -E],
  );
  if (!centre) return null;
  const ucx = centre[0]!;
  const ucy = centre[1]!;
  const f0 = F + 0.5 * (D * ucx + E * ucy);
  const tr = A + C;
  const det = A * C - (B * B) / 4;
  if (!(det > 0)) return null;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 - disc; // smaller eigenvalue: major axis
  const l2 = tr / 2 + disc;
  if (!(-f0 / l1 > 0) || !(-f0 / l2 > 0)) return null;
  const a = Math.sqrt(-f0 / l1);
  const b = Math.sqrt(-f0 / l2);
  // Eigenvector of [[A, B/2], [B/2, C]] for l1.
  let angle: number;
  if (Math.abs(B) > 1e-15) angle = Math.atan2(l1 - A, B / 2);
  else angle = A <= C ? 0 : Math.PI / 2;
  return normalizeEllipse({ cx: mx + ucx * scale, cy: my + ucy * scale, a: a * scale, b: b * scale, angle });
}

function sumSquaredDistances(e: Ellipse, xs: ArrayLike<number>, ys: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < xs.length; i++) {
    const d = ellipseSignedDistance(e, xs[i]!, ys[i]!);
    s += d * d;
  }
  return s;
}

/**
 * Geometric least-squares fit: minimises the sum of squared Euclidean
 * distances to the ellipse (Levenberg–Marquardt, numerical Jacobian).
 */
export function fitEllipseGeometric(xs: ArrayLike<number>, ys: ArrayLike<number>, initial: Ellipse, iterations = 30): Ellipse {
  let p = [initial.cx, initial.cy, initial.a, initial.b, initial.angle];
  const toEllipse = (q: number[]): Ellipse => ({ cx: q[0]!, cy: q[1]!, a: q[2]!, b: q[3]!, angle: q[4]! });
  const n = xs.length;
  let lambda = 1e-3;
  let cost = sumSquaredDistances(toEllipse(p), xs, ys);
  const size = Math.max(initial.a, initial.b);
  const steps = [size * 1e-6, size * 1e-6, size * 1e-6, size * 1e-6, 1e-6];
  for (let it = 0; it < iterations; it++) {
    const e = toEllipse(p);
    const r = new Float64Array(n);
    for (let i = 0; i < n; i++) r[i] = ellipseSignedDistance(e, xs[i]!, ys[i]!);
    const jac: Float64Array[] = [];
    for (let k = 0; k < 5; k++) {
      const q = p.slice();
      q[k] = q[k]! + steps[k]!;
      const eq = toEllipse(q);
      const col = new Float64Array(n);
      for (let i = 0; i < n; i++) col[i] = (ellipseSignedDistance(eq, xs[i]!, ys[i]!) - r[i]!) / steps[k]!;
      jac.push(col);
    }
    const jtj: number[][] = Array.from({ length: 5 }, () => new Array<number>(5).fill(0));
    const jtr = new Array<number>(5).fill(0);
    for (let a = 0; a < 5; a++) {
      for (let i = 0; i < n; i++) jtr[a] = jtr[a]! - jac[a]![i]! * r[i]!;
      for (let b = 0; b < 5; b++) {
        let s = 0;
        for (let i = 0; i < n; i++) s += jac[a]![i]! * jac[b]![i]!;
        jtj[a]![b] = s;
      }
    }
    let improved = false;
    for (let tries = 0; tries < 8; tries++) {
      const m = jtj.map((row, i) => row.map((v, j) => (i === j ? v * (1 + lambda) + 1e-30 : v)));
      const delta = solveLinear(m, jtr);
      if (!delta) {
        lambda *= 10;
        continue;
      }
      const q = p.map((v, k) => v + delta[k]!);
      if (!(q[2]! > 0) || !(q[3]! > 0)) {
        lambda *= 10;
        continue;
      }
      const c = sumSquaredDistances(toEllipse(q), xs, ys);
      if (c < cost) {
        const gain = cost - c;
        p = q;
        cost = c;
        lambda = Math.max(lambda / 10, 1e-12);
        improved = true;
        if (gain < 1e-14 * (1 + cost)) it = iterations;
        break;
      }
      lambda *= 10;
    }
    if (!improved) break;
  }
  return normalizeEllipse(toEllipse(p));
}

export interface RobustEllipseFit {
  ellipse: Ellipse;
  /** True for the points kept in the final fit. */
  used: boolean[];
  /** Root mean square distance of the kept points to the ellipse. */
  rms: number;
}

/**
 * Robust fit: geometric fit, then points farther than max(3 robust SD, `minRejectDistance`)
 * from the ellipse are dropped and the fit is repeated until the set is stable.
 */
export function fitEllipseRobust(xs: ArrayLike<number>, ys: ArrayLike<number>, minRejectDistance: number): RobustEllipseFit | null {
  const n = xs.length;
  let used = new Array<boolean>(n).fill(true);
  let ellipse: Ellipse | null = null;
  for (let round = 0; round < 8; round++) {
    const sx: number[] = [];
    const sy: number[] = [];
    for (let i = 0; i < n; i++) {
      if (!used[i]) continue;
      sx.push(xs[i]!);
      sy.push(ys[i]!);
    }
    const init = fitEllipseAlgebraic(sx, sy);
    if (!init) return null;
    ellipse = fitEllipseGeometric(sx, sy, ellipse ?? init);
    const dist: number[] = [];
    for (let i = 0; i < n; i++) dist.push(ellipseSignedDistance(ellipse, xs[i]!, ys[i]!));
    const keptDist = dist.filter((_, i) => used[i]);
    const limit = Math.max(3 * robustSd(keptDist), minRejectDistance);
    const next = dist.map((d) => Math.abs(d) <= limit);
    if (next.filter(Boolean).length < 5) break;
    const same = next.every((v, i) => v === used[i]);
    used = next;
    if (same) break;
  }
  if (!ellipse) return null;
  let s = 0;
  let k = 0;
  for (let i = 0; i < n; i++) {
    if (!used[i]) continue;
    const d = ellipseSignedDistance(ellipse, xs[i]!, ys[i]!);
    s += d * d;
    k++;
  }
  return { ellipse, used, rms: k > 0 ? Math.sqrt(s / k) : NaN };
}
