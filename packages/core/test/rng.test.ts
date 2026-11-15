import { describe, expect, it } from 'vitest';
import { createRng, inverseNormalCdf, normalTable16 } from '../src/rng';

describe('seeded random numbers', () => {
  it('gives the same sequence for the same key and another for another key', () => {
    const a = createRng('scan/B/OD/90/1/17');
    const b = createRng('scan/B/OD/90/1/17');
    const c = createRng('scan/B/OD/90/1/18');
    const sa = Array.from({ length: 8 }, () => a.uint32());
    const sb = Array.from({ length: 8 }, () => b.uint32());
    const sc = Array.from({ length: 8 }, () => c.uint32());
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
  });

  it('draws uniforms, normals and gammas with the right moments', () => {
    const r = createRng('moments');
    const n = 200000;
    let su = 0, sn = 0, sn2 = 0, sg = 0, sg2 = 0;
    // Checked once after the loop: 200 000 assertions made the test slow enough to time out on a busy machine.
    let inRange = true;
    for (let i = 0; i < n; i++) {
      const u = r.next();
      if (!(u >= 0 && u < 1)) inRange = false;
      su += u;
      const z = r.normal();
      sn += z;
      sn2 += z * z;
      const g = r.gamma(12.5) / 12.5;
      sg += g;
      sg2 += g * g;
    }
    expect(inRange).toBe(true);
    expect(su / n).toBeCloseTo(0.5, 2);
    expect(sn / n).toBeCloseTo(0, 2);
    expect(sn2 / n).toBeCloseTo(1, 1);
    expect(sg / n).toBeCloseTo(1, 2);
    // Variance of Gamma(k)/k is 1/k = 0.08.
    expect(sg2 / n - (sg / n) ** 2).toBeCloseTo(0.08, 2);
  });

  it('inverts the normal distribution', () => {
    expect(inverseNormalCdf(0.5)).toBeCloseTo(0, 9);
    expect(inverseNormalCdf(0.975)).toBeCloseTo(1.959964, 5);
    expect(inverseNormalCdf(0.001)).toBeCloseTo(-3.090232, 5);
    const t = normalTable16();
    let s = 0, s2 = 0;
    for (const v of t) {
      s += v;
      s2 += v * v;
    }
    expect(s / t.length).toBeCloseTo(0, 6);
    expect(s2 / t.length).toBeCloseTo(1, 2);
  });
});
