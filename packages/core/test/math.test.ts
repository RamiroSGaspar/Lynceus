import { describe, expect, it } from 'vitest';
import { ellipseArea, ellipseFrame, ellipseSignedDistance, fitEllipseAlgebraic, fitEllipseGeometric, fitEllipseRobust } from '../src/math/ellipse';
import { bisect, monotoneCubic } from '../src/math/interp';
import { quadraticResiduals } from '../src/math/linalg';
import { createRng } from '../src/rng';

describe('monotone cubic interpolation', () => {
  it('passes through the points and never overshoots', () => {
    const xs = [0, 10, 30, 60, 90, 120, 150, 180];
    const ys = [0, 46, 118, 176, 203, 190, 168, 138];
    const f = monotoneCubic(xs, ys);
    xs.forEach((x, i) => expect(f(x)).toBeCloseTo(ys[i]!, 10));
    for (let i = 0; i < xs.length - 1; i++) {
      const lo = Math.min(ys[i]!, ys[i + 1]!);
      const hi = Math.max(ys[i]!, ys[i + 1]!);
      for (let t = 0; t <= 1; t += 0.05) {
        const v = f(xs[i]! + t * (xs[i + 1]! - xs[i]!));
        expect(v).toBeGreaterThanOrEqual(lo - 1e-9);
        expect(v).toBeLessThanOrEqual(hi + 1e-9);
      }
    }
    expect(f(-5)).toBe(0);
    expect(f(400)).toBe(138);
  });

  it('bisects a monotone function', () => {
    expect(bisect((x) => x * x, 2, 0, 3)).toBeCloseTo(Math.SQRT2, 12);
    expect(bisect((x) => -x, -0.25, 0, 1)).toBeCloseTo(0.25, 12);
  });
});

describe('quadratic detrending', () => {
  it('leaves zero residual for a parabola', () => {
    const x = Array.from({ length: 50 }, (_, i) => 300 + 20 * i);
    const y = x.map((v) => 3 + 0.01 * v - 2e-5 * v * v);
    const out = new Float64Array(50);
    expect(quadraticResiduals(x, y, 50, out)).toBe(true);
    for (const r of out) expect(Math.abs(r)).toBeLessThan(1e-9);
  });
});

describe('ellipses', () => {
  const truth = { cx: 4.3, cy: 4.1, a: 0.92, b: 0.8, angle: 1.4 };

  it('measures signed distance', () => {
    const e = { cx: 0, cy: 0, a: 2, b: 1, angle: 0 };
    expect(ellipseSignedDistance(e, 3, 0)).toBeCloseTo(1, 12);
    expect(ellipseSignedDistance(e, 0, 0.5)).toBeCloseTo(-0.5, 12);
    expect(ellipseSignedDistance(e, 0, 3)).toBeCloseTo(2, 12);
    const f = ellipseFrame(truth, 0.7);
    expect(ellipseSignedDistance(truth, f.x + 0.25 * f.nx, f.y + 0.25 * f.ny)).toBeCloseTo(0.25, 9);
    expect(ellipseArea(e)).toBeCloseTo(2 * Math.PI, 12);
  });

  it('fits points on an ellipse exactly and resists outliers', () => {
    const rng = createRng('ellipse-test');
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < 96; i++) {
      const p = ellipseFrame(truth, (2 * Math.PI * i) / 96);
      xs.push(p.x + rng.normal(0, 0.005));
      ys.push(p.y + rng.normal(0, 0.005));
    }
    const alg = fitEllipseAlgebraic(xs, ys)!;
    const geo = fitEllipseGeometric(xs, ys, alg);
    expect(geo.cx).toBeCloseTo(truth.cx, 2);
    expect(geo.cy).toBeCloseTo(truth.cy, 2);
    expect(ellipseArea(geo) / ellipseArea(truth)).toBeCloseTo(1, 2);
    // Ten wild points must be rejected.
    for (let i = 0; i < 10; i++) {
      xs[i * 9] = xs[i * 9]! + 0.3;
    }
    const robust = fitEllipseRobust(xs, ys, 0.02)!;
    expect(robust.used.filter((u) => !u).length).toBeGreaterThanOrEqual(10);
    expect(Math.abs(ellipseArea(robust.ellipse) / ellipseArea(truth) - 1)).toBeLessThan(0.01);
    expect(robust.rms).toBeLessThan(0.01);
  });
});
