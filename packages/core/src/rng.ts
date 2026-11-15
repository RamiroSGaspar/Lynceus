/**
 * Seeded random numbers. Every random stream in the core comes from a text key
 * (for example `scan/B/OD/90/1/17`), so any part of any exam can be regenerated
 * alone, in any order, with the same result. `Math.random` is never used.
 *
 * Generator: sfc32 (Chris Doty-Humphrey's Small Fast Counting generator, public
 * domain), seeded with the cyrb128 hash of the key. Uniforms use integer
 * arithmetic only; normals and gammas also use `Math.log`, `Math.sqrt`,
 * `Math.sin` and `Math.cos`, which are bit-identical within one JavaScript
 * engine (V8 in Node and in Chrome).
 */

export interface Rng {
  /** Uniform in [0, 1), 32 bits of resolution. */
  next(): number;
  /** Uniform integer in [0, 2^32). */
  uint32(): number;
  /** Uniform in [a, b). */
  uniform(a: number, b: number): number;
  /** Uniform integer in [0, n). */
  int(n: number): number;
  /** Normal with the given mean and standard deviation (Box–Muller). */
  normal(mean?: number, sd?: number): number;
  /** Gamma with the given shape and unit scale (Marsaglia–Tsang). */
  gamma(shape: number): number;
}

/** cyrb128: 128-bit string hash (public domain). Returns four 32-bit words. */
export function hashKey(key: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < key.length; i++) {
    const k = key.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

const TWO_POW_32 = 4294967296;

class Sfc32 implements Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;
  private spare = NaN;

  constructor(seed: [number, number, number, number]) {
    this.a = seed[0];
    this.b = seed[1];
    this.c = seed[2];
    this.d = seed[3];
    for (let i = 0; i < 15; i++) this.uint32();
  }

  uint32(): number {
    const t = (((this.a + this.b) | 0) + this.d) | 0;
    this.d = (this.d + 1) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + t) | 0;
    return t >>> 0;
  }

  next(): number {
    return this.uint32() / TWO_POW_32;
  }

  uniform(a: number, b: number): number {
    return a + (b - a) * this.next();
  }

  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  normal(mean = 0, sd = 1): number {
    if (!Number.isNaN(this.spare)) {
      const z = this.spare;
      this.spare = NaN;
      return mean + sd * z;
    }
    // (u + 0.5) / 2^32 is never 0, so the logarithm is finite.
    const u1 = (this.uint32() + 0.5) / TWO_POW_32;
    const u2 = this.next();
    const radius = Math.sqrt(-2 * Math.log(u1));
    const angle = 2 * Math.PI * u2;
    this.spare = radius * Math.sin(angle);
    return mean + sd * radius * Math.cos(angle);
  }

  gamma(shape: number): number {
    if (shape < 1) {
      const u = (this.uint32() + 0.5) / TWO_POW_32;
      return this.gamma(shape + 1) * Math.pow(u, 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x: number;
      let v: number;
      do {
        x = this.normal();
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = (this.uint32() + 0.5) / TWO_POW_32;
      if (u < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }
}

/** A random stream for a text key. Same key, same sequence. */
export function createRng(key: string): Rng {
  return new Sfc32(hashKey(key));
}

/**
 * Inverse of the standard normal distribution function (Acklam's rational
 * approximation, relative error below 1.2e-9). Used to build the lookup table
 * of fast normal deviates for the speckle field.
 */
export function inverseNormalCdf(p: number): number {
  const a0 = -3.969683028665376e1, a1 = 2.209460984245205e2, a2 = -2.759285104469687e2;
  const a3 = 1.38357751867269e2, a4 = -3.066479806614716e1, a5 = 2.506628277459239;
  const b0 = -5.447609879822406e1, b1 = 1.615858368580409e2, b2 = -1.556989798598866e2;
  const b3 = 6.680131188771972e1, b4 = -1.328068155288572e1;
  const c0 = -7.784894002430293e-3, c1 = -3.223964580411365e-1, c2 = -2.400758277161838;
  const c3 = -2.549732539343734, c4 = 4.374664141464968, c5 = 2.938163982698783;
  const d0 = 7.784695709041462e-3, d1 = 3.224671290700398e-1, d2 = 2.445134137142996, d3 = 3.754408661907416;
  const pLow = 0.02425;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c0 * q + c1) * q + c2) * q + c3) * q + c4) * q + c5) / ((((d0 * q + d1) * q + d2) * q + d3) * q + 1);
  }
  if (p > 1 - pLow) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c0 * q + c1) * q + c2) * q + c3) * q + c4) * q + c5) / ((((d0 * q + d1) * q + d2) * q + d3) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return ((((((a0 * r + a1) * r + a2) * r + a3) * r + a4) * r + a5) * q) / (((((b0 * r + b1) * r + b2) * r + b3) * r + b4) * r + 1);
}

let normalTable: Float32Array | null = null;

/**
 * 65 536 standard normal quantiles at the centres of equal-probability bins.
 * Indexing it with 16 random bits gives a normal deviate for the cost of one
 * table read; the speckle field smooths these, so the discreteness vanishes.
 */
export function normalTable16(): Float32Array {
  if (normalTable) return normalTable;
  const table = new Float32Array(65536);
  for (let k = 0; k < 65536; k++) table[k] = inverseNormalCdf((k + 0.5) / 65536);
  normalTable = table;
  return table;
}
