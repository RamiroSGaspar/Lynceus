/**
 * Quality index of a B-scan, in dB. The manufacturer's formula is not public, so
 * this definition is ours (spec 01, 5.4): Q = 10·log10(S / N), clipped to the
 * instrument's 0–40 dB scale [P13], where N is the noise floor estimated on the
 * darkest rows of the scan and S is the 99th percentile of the image minus N.
 * The instrument uses it to write `Quality`; the engine recomputes it.
 */
import { INVALID_VALUE } from './vol/format';
import { QUALITY_MAX_DB } from './constants';

/** Rows averaged to estimate the noise floor. */
const DARK_ROWS = 20;
/**
 * The percentile comes from a histogram indexed by the high bits of each float32:
 * exponent plus 8 mantissa bits, i.e. 256 logarithmic bins per octave (0.27 % wide).
 */
const SHIFT = 15;
const BINS = 1 << (31 - SHIFT);
const binWords = new Int32Array(1);
const binFloat = new Float32Array(binWords.buffer);

export interface QualityEstimate {
  qualityDb: number;
  /** Noise floor N (linear reflectivity). */
  noiseFloor: number;
  /** 99th percentile of the image. */
  p99: number;
}

export function estimateQuality(pixels: Float32Array, width: number, height: number): QualityEstimate {
  const rowMeans = new Float64Array(height);
  const hist = new Uint32Array(BINS);
  const bits = new Int32Array(pixels.buffer, pixels.byteOffset, pixels.length);
  let valid = 0;
  for (let y = 0; y < height; y++) {
    let s = 0;
    let n = 0;
    const off = y * width;
    for (let x = 0; x < width; x++) {
      const v = pixels[off + x]!;
      // Negative, NaN and the "invalid" marker are skipped; zero counts in the lowest bin.
      if (!(v >= 0) || v >= INVALID_VALUE) continue;
      s += v;
      n++;
      const b = bits[off + x]! >>> SHIFT;
      hist[b] = hist[b]! + 1;
      valid++;
    }
    rowMeans[y] = n > 0 ? s / n : Infinity;
  }
  const sortedRows = Array.from(rowMeans).sort((a, b) => a - b);
  const k = Math.min(DARK_ROWS, height);
  let noise = 0;
  let used = 0;
  for (let i = 0; i < k; i++) {
    if (!Number.isFinite(sortedRows[i]!)) continue;
    noise += sortedRows[i]!;
    used++;
  }
  noise = used > 0 ? noise / used : 0;
  // 99th percentile from the histogram, interpolated linearly inside the bin.
  const target = 0.99 * valid;
  let cum = 0;
  let p99 = 0;
  for (let b = 0; b < BINS; b++) {
    const c = hist[b]!;
    if (c > 0 && cum + c >= target) {
      binWords[0] = b << SHIFT;
      const lo = binFloat[0]!;
      binWords[0] = (b + 1) << SHIFT;
      const hi = binFloat[0]!;
      p99 = lo + ((target - cum) / c) * (hi - lo);
      break;
    }
    cum += c;
  }
  const signal = p99 - noise;
  let q = signal > 0 && noise > 0 ? 10 * Math.log10(signal / noise) : 0;
  if (!(q > 0)) q = 0;
  if (q > QUALITY_MAX_DB) q = QUALITY_MAX_DB;
  return { qualityDb: q, noiseFloor: noise, p99 };
}

export function qualityDb(pixels: Float32Array, width: number, height: number): number {
  return estimateQuality(pixels, width, height).qualityDb;
}
