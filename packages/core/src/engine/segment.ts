/**
 * Analysis of one B-scan (spec 01, 6.1 to 6.3): quality checks, the inner limiting
 * membrane (ILM) and Bruch's membrane (BM) as minimum-cost paths over the vertical
 * gradient of the smoothed log image (Chiu et al. 2010 [P7]), sub-pixel refinement,
 * the two ends of Bruch's membrane (BMO) and the checks that decide whether the
 * scan can be used. It sees only the exam: pixels and header.
 */
import type { BScan, BmoPoint, ScanAnalysis, ScanRejection } from '../contract';
import { QUALITY_POOR_DB } from '../constants';
import { binomial5Columns, binomial5Rows } from '../math/filter';
import { estimateQuality } from '../quality';
import { INVALID_VALUE } from '../vol/format';
import { minimumPath } from './path';

/** Offset of the display transform [C3]: the log image is ln(value + 0.000244). */
const LOG_OFFSET = 0.000244;
const W_MIN = 1e-5;

// Limits of the per-scan checks (spec 6.1). Except the 15 dB of P13, our assumption.
/** More than this fraction of columns without a boundary: signal dropout. */
export const DROPOUT_LIMIT = 0.15;
/** The ILM closer than this to the top of the frame: truncated. */
export const TRUNCATION_ROWS = 8;
/** A column needs this much more (natural log) than the noise floor to count as signal (~6.5 dB). */
const SIGNAL_MARGIN = 1.5;
/** Columns compared to find motion steps (wider than the blur that movement adds). */
const MOTION_GAP = 12;
/** Vertical shift over MOTION_GAP columns, in rows, that counts as a motion step… */
const MOTION_STEP_ROWS = 8;
/** …if it exceeds the mean shift of the neighbouring stretches by this much (a fold does not). */
const MOTION_SCORE_ROWS = 6;
const MOTION_SEARCH = 16;
/** Motion steps in one scan that reject it. */
const MOTION_STEPS_LIMIT = 2;
/** The epithelium band must keep at least this contrast (natural log) outside the opening. */
const MIN_BAND_CONTRAST = 0.8;
/** Columns past the end of the band that must stay without it (≈ 140 µm), so a narrow shadow cannot pass for the opening. */
const BMO_CONFIRM_COLUMNS = 25;

export interface ScanGeometry {
  sizeX: number;
  sizeZ: number;
  scaleXUm: number;
  scaleZUm: number;
}

/** What the exam-level steps need beyond `ScanAnalysis`. */
export interface ScanDiagnostics {
  signalFraction: number;
  motionSteps: number;
  truncatedColumns: number;
  /** Contrast of the epithelium band on each side, natural log units. */
  bandContrast: [number, number];
  /** Band contrast along the BM path, column by column (smoothed). */
  bandProfile: Float64Array;
  /** Row of the BM path before refinement. */
  bmPath: Int32Array;
  noiseFloor: number;
}

export interface SegmentedScan {
  analysis: ScanAnalysis;
  diagnostics: ScanDiagnostics;
}

function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : 0.5 * (s[m - 1]! + s[m]!);
}

const LOG_TABLE_BITS = 12;
let logTable: Float64Array | null = null;

/**
 * ln(value + 0.000244) for every pixel, through the bits of the float32 sum: exponent
 * times ln 2 plus a 4096-entry table of the mantissa, interpolated (error below 1e-8).
 * Invalid values give ln(0.000244), like a black pixel.
 */
function logImage(px: Float32Array): Float32Array {
  if (!logTable) {
    logTable = new Float64Array((1 << LOG_TABLE_BITS) + 1);
    for (let k = 0; k <= 1 << LOG_TABLE_BITS; k++) logTable[k] = Math.log(1 + k / (1 << LOG_TABLE_BITS));
  }
  const table = logTable;
  const n = px.length;
  const sum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = px[i]!;
    sum[i] = v >= 0 && v < INVALID_VALUE ? v + LOG_OFFSET : LOG_OFFSET;
  }
  const bits = new Int32Array(sum.buffer);
  const out = new Float32Array(n);
  const shift = 23 - LOG_TABLE_BITS;
  const fracScale = 1 / (1 << shift);
  const mask = (1 << LOG_TABLE_BITS) - 1;
  for (let i = 0; i < n; i++) {
    const b = bits[i]!;
    const e = (b >>> 23) - 127;
    const k = (b >>> shift) & mask;
    const f = (b & ((1 << shift) - 1)) * fracScale;
    out[i] = e * Math.LN2 + table[k]! + f * (table[k + 1]! - table[k]!);
  }
  return out;
}

/** Median of the first n values (reorders them), by quickselect. */
function quickMedian(a: Float64Array, n: number): number {
  if (n === 0) return NaN;
  const k = n >> 1;
  let l = 0;
  let r = n - 1;
  while (l < r) {
    const pivot = a[(l + r) >> 1]!;
    let i = l;
    let j = r;
    while (i <= j) {
      while (a[i]! < pivot) i++;
      while (a[j]! > pivot) j--;
      if (i <= j) {
        const t = a[i]!;
        a[i] = a[j]!;
        a[j] = t;
        i++;
        j--;
      }
    }
    if (k <= j) r = j;
    else if (k >= i) l = i;
    else break;
  }
  return a[k]!;
}

/** Running median of width 2·half + 1 over a signal with NaN gaps (NaN stays NaN). */
function runningMedian(values: Float64Array, half: number): Float64Array {
  const out = new Float64Array(values.length);
  for (let j = 0; j < values.length; j++) {
    if (Number.isNaN(values[j]!)) {
      out[j] = NaN;
      continue;
    }
    const w: number[] = [];
    for (let k = Math.max(0, j - half); k <= Math.min(values.length - 1, j + half); k++) if (!Number.isNaN(values[k]!)) w.push(values[k]!);
    out[j] = median(w);
  }
  return out;
}

/** Fills NaN gaps by linear interpolation (constant beyond the ends). */
function fillGaps(values: Float64Array): Float64Array {
  const out = Float64Array.from(values);
  const n = out.length;
  let last = -1;
  for (let j = 0; j < n; j++) {
    if (Number.isNaN(out[j]!)) continue;
    if (last < 0) for (let k = 0; k < j; k++) out[k] = out[j]!;
    else for (let k = last + 1; k < j; k++) out[k] = out[last]! + ((out[j]! - out[last]!) * (k - last)) / (j - last);
    last = j;
  }
  if (last < 0) out.fill(0);
  else for (let k = last + 1; k < n; k++) out[k] = out[last]!;
  return out;
}

/**
 * Mean linear intensity across columns j−half..j+half for rows r0..r1 (inclusive), lightly
 * smoothed in depth with [1 2 1]. Returns values for rows r0..r1.
 */
function localProfile(px: Float32Array, width: number, height: number, j: number, half: number, r0: number, r1: number): Float64Array {
  const n = r1 - r0 + 1;
  const raw = new Float64Array(n + 2);
  for (let i = -1; i <= n; i++) {
    const r = Math.min(height - 1, Math.max(0, r0 + i));
    let s = 0;
    let c = 0;
    for (let k = Math.max(0, j - half); k <= Math.min(width - 1, j + half); k++) {
      const v = px[r * width + k]!;
      if (v >= 0 && v < INVALID_VALUE) {
        s += v;
        c++;
      }
    }
    raw[i + 1] = c > 0 ? s / c : 0;
  }
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = 0.25 * raw[i]! + 0.5 * raw[i + 1]! + 0.25 * raw[i + 2]!;
  return out;
}

/**
 * Sub-pixel position of a dark-to-bright edge (`rising`) or bright-to-dark edge near row p:
 * where the linear intensity crosses halfway between the levels on each side. With a
 * symmetric blur this half-height crossing sits on the true edge whatever the two levels
 * are; the maximum of the log gradient does not (it leans toward the dark side).
 */
function refineEdge(px: Float32Array, width: number, height: number, j: number, p: number, half: number, rising: boolean): number {
  const r0 = Math.max(0, p - 10);
  const r1 = Math.min(height - 1, p + 10);
  const prof = localProfile(px, width, height, j, half, r0, r1);
  const at = (r: number): number => prof[Math.min(r1, Math.max(r0, r)) - r0]!;
  let low: number;
  let high: number;
  if (rising) {
    low = (at(p - 9) + at(p - 8) + at(p - 7) + at(p - 6)) / 4;
    high = (at(p + 3) + at(p + 4) + at(p + 5) + at(p + 6)) / 4;
  } else {
    let pk = p - 4;
    for (let r = p - 5; r <= p; r++) if (at(r) > at(pk)) pk = r;
    high = (at(pk - 1) + at(pk) + at(pk + 1)) / 3;
    low = (at(p + 3) + at(p + 4) + at(p + 5) + at(p + 6)) / 4;
  }
  if (!(high > low * 1.3)) return p;
  const level = 0.5 * (low + high);
  if (rising) {
    for (let r = Math.max(r0 + 1, p - 5); r <= Math.min(r1, p + 5); r++) {
      if (at(r) >= level && at(r - 1) < level) return r - 1 + (level - at(r - 1)) / (at(r) - at(r - 1));
    }
  } else {
    for (let r = Math.min(r1 - 1, p + 5); r >= Math.max(r0, p - 5); r--) {
      if (at(r) >= level && at(r + 1) < level) return r + (at(r) - level) / (at(r) - at(r + 1));
    }
  }
  return p;
}

export function segmentScan(scan: BScan, g: ScanGeometry): SegmentedScan {
  const W = g.sizeX;
  const H = g.sizeZ;
  const px = scan.pixels;
  const quality = estimateQuality(px, W, H);

  // ---- Log image, smoothed (Chiu step 1): binomial [1 4 6 4 1] in both directions (σ = 1 px).
  const log = logImage(px);
  const S = binomial5Columns(binomial5Rows(log, W, H), W, H);
  // Column-major copy: every step below walks down columns.
  const ST = new Float32Array(W * H);
  for (let i = 0; i < H; i++) {
    const o = i * W;
    for (let j = 0; j < W; j++) ST[j * H + i] = S[o + j]!;
  }
  const noiseLog = Math.log(quality.noiseFloor + LOG_OFFSET);

  // ---- Columns with signal, and a first guess of the top of the tissue.
  const hasSignal = new Uint8Array(W);
  const top = new Float64Array(W).fill(NaN);
  let signalCount = 0;
  let truncatedColumns = 0;
  for (let j = 0; j < W; j++) {
    const c = j * H;
    let m = -Infinity;
    for (let i = 0; i < H; i++) if (ST[c + i]! > m) m = ST[c + i]!;
    if (m - noiseLog < SIGNAL_MARGIN) continue;
    hasSignal[j] = 1;
    signalCount++;
    const thr = noiseLog + 0.5 * (m - noiseLog);
    for (let i = 0; i < H; i++) {
      if (ST[c + i]! >= thr) {
        top[j] = i;
        break;
      }
    }
    if (top[j]! < TRUNCATION_ROWS) truncatedColumns++;
  }
  const topGuess = fillGaps(runningMedian(top, 6));

  // ---- ILM: dark-to-bright gradient, path free to climb the cup walls (Chiu steps 2–5, 7, 8).
  const ilmCost = new Float32Array(W * H).fill(1);
  const lo = new Int32Array(W);
  const hi = new Int32Array(W);
  let gMax = 0;
  for (let j = 0; j < W; j++) {
    lo[j] = Math.max(1, Math.round(topGuess[j]!) - 12);
    hi[j] = Math.min(H - 2, Math.round(topGuess[j]!) + 12);
    const c = j * H;
    for (let i = lo[j]!; i <= hi[j]!; i++) gMax = Math.max(gMax, ST[c + i + 1]! - ST[c + i - 1]!);
  }
  for (let j = 0; j < W; j++) {
    const c = j * H;
    for (let i = lo[j]!; i <= hi[j]!; i++) {
      // Columns without signal are crossed at the minimum weight, without deviating (Chiu step 8).
      if (!hasSignal[j]) {
        ilmCost[c + i] = W_MIN;
        continue;
      }
      const gr = Math.max(0, ST[c + i + 1]! - ST[c + i - 1]!) / (gMax || 1);
      ilmCost[c + i] = 1 - gr + W_MIN;
    }
  }
  const ilmPath = minimumPath(ilmCost, W, H, { lo, hi, maxStep: 1, vertical: true });
  const ilmPx = new Float32Array(W).fill(NaN);
  for (let j = 0; j < W; j++) {
    if (!hasSignal[j]) continue;
    const steep = Math.abs((ilmPath[Math.min(W - 1, j + 1)]! - ilmPath[Math.max(0, j - 1)]!) / 2) > 0.7;
    ilmPx[j] = refineEdge(px, W, H, j, ilmPath[j]!, steep ? 0 : 3, true);
  }

  // ---- BM: bottom of the brightest band (epithelium + Bruch's membrane), bright-to-dark.
  const bmCost = new Float32Array(W * H).fill(1);
  let dMax = 0;
  for (let j = 0; j < W; j++) {
    lo[j] = Math.min(H - 8, Math.max(3, ilmPath[j]! + 12));
    hi[j] = Math.min(H - 5, ilmPath[j]! + 240);
    if (hi[j]! < lo[j]!) hi[j] = lo[j]!;
    const c = j * H;
    for (let i = lo[j]!; i <= hi[j]!; i++) dMax = Math.max(dMax, ST[c + i - 2]! - ST[c + i + 3]!);
  }
  const sample = new Float64Array(H);
  for (let j = 0; j < W; j++) {
    const c = j * H;
    if (!hasSignal[j]) {
      for (let i = lo[j]!; i <= hi[j]!; i++) bmCost[c + i] = W_MIN;
      continue;
    }
    // Brightness relative to the column: the epithelium is the brightest band.
    let n = 0;
    let bandMax = -Infinity;
    for (let i = lo[j]!; i <= hi[j]!; i++) {
      sample[n++] = ST[c + i]!;
      if (ST[c + i]! > bandMax) bandMax = ST[c + i]!;
    }
    const med = quickMedian(sample, n);
    const span = bandMax - med || 1;
    for (let i = lo[j]!; i <= hi[j]!; i++) {
      const drop = Math.max(0, ST[c + i - 2]! - ST[c + i + 3]!) / (dMax || 1);
      const bright = Math.min(1, Math.max(0, (ST[c + i - 2]! - med) / span));
      bmCost[c + i] = 1 - drop * bright + W_MIN;
    }
  }
  const bmPath = minimumPath(bmCost, W, H, { lo, hi, maxStep: 1, vertical: false });

  // ---- Toward the opening the band is followed column by column (±1 row), from where the
  // global path is reliable: the global path can leave the band early to reach deeper
  // structures inside the nerve head, the local tracking cannot. Each side is tracked
  // from its end of the scan to the far end.
  const tracked: [Int32Array, Int32Array] = [new Int32Array(W), new Int32Array(W)];
  for (let side = 0; side < 2; side++) {
    const dir = side === 0 ? 1 : -1;
    const start = side === 0 ? 0 : W - 1;
    const rows = tracked[side]!;
    let p = bmPath[start + dir * 10]!;
    for (let k = 0; k < W; k++) {
      const j = start + dir * k;
      if (k <= 10) {
        rows[j] = bmPath[j]!;
        continue;
      }
      const c = j * H;
      let best = -Infinity;
      let arg = p;
      for (let q = Math.max(3, p - 1); q <= Math.min(H - 5, p + 1); q++) {
        const score = ST[c + q - 2]! - ST[c + q + 3]!;
        if (score > best) {
          best = score;
          arg = q;
        }
      }
      p = arg;
      rows[j] = p;
    }
  }

  // ---- Band contrast: epithelium above the membrane against what lies below. A vessel
  // shadow darkens the whole column, so the difference of logs survives it. In each column
  // the better of the two estimates of the membrane is kept: the global path (reliable far
  // from the nerve, where strong folds can throw the local tracking off) or the tracking
  // (reliable near the edge).
  const bandAt = (j: number, p: number): number => {
    const c = j * H;
    let above = 0;
    for (let r = p - 3; r <= p - 1; r++) above += ST[c + Math.max(0, r)]!;
    let below = 0;
    for (let r = p + 3; r <= p + 6; r++) below += ST[c + Math.min(H - 1, r)]!;
    return above / 3 - below / 4;
  };
  const contrastSide: [Float64Array, Float64Array] = [new Float64Array(W), new Float64Array(W)];
  for (let side = 0; side < 2; side++) {
    const contrast = new Float64Array(W).fill(NaN);
    const rows = tracked[side]!;
    for (let j = 0; j < W; j++) {
      if (!hasSignal[j]) continue;
      const viaTrack = bandAt(j, rows[j]!);
      const viaPath = bandAt(j, bmPath[j]!);
      if (viaPath > viaTrack) rows[j] = bmPath[j]!;
      contrast[j] = Math.max(viaTrack, viaPath);
    }
    const smooth = contrastSide[side]!;
    for (let j = 0; j < W; j++) {
      let s = 0;
      let c = 0;
      for (let k = Math.max(0, j - 3); k <= Math.min(W - 1, j + 3); k++) {
        if (Number.isNaN(contrast[k]!)) continue;
        s += contrast[k]!;
        c++;
      }
      smooth[j] = c > 0 ? s / c : NaN;
    }
  }

  // ---- The two ends of the band, walking in from each end of the scan (spec 6.3).
  const bandContrast: [number, number] = [NaN, NaN];
  const ends: [number, number] = [NaN, NaN];
  const confidence: [number, number] = [0, 0];
  for (let side = 0; side < 2; side++) {
    const smoothContrast = contrastSide[side]!;
    const dir = side === 0 ? 1 : -1;
    const start = side === 0 ? 0 : W - 1;
    const outer: number[] = [];
    for (let k = 0; k < 120; k++) {
      const v = smoothContrast[start + dir * k]!;
      if (!Number.isNaN(v)) outer.push(v);
    }
    const cOut = median(outer);
    bandContrast[side] = cOut;
    if (!(cOut > MIN_BAND_CONTRAST)) continue;
    const half = 0.5 * cOut;
    for (let k = 10; k < W - BMO_CONFIRM_COLUMNS - 1; k++) {
      const j = start + dir * k;
      const v = smoothContrast[j]!;
      if (Number.isNaN(v) || v >= half) continue;
      // Confirm: the band stays absent over the next columns (not a narrow artefact).
      let s = 0;
      let c = 0;
      for (let m = 1; m <= BMO_CONFIRM_COLUMNS; m++) {
        const w = smoothContrast[j + dir * m]!;
        if (Number.isNaN(w)) continue;
        s += w;
        c++;
      }
      if (c < BMO_CONFIRM_COLUMNS / 2 || s / c >= half) continue;
      const prevJ = j - dir;
      const pv = smoothContrast[prevJ]!;
      const frac = Number.isNaN(pv) || pv === v ? 0 : (pv - half) / (pv - v);
      ends[side] = prevJ + dir * Math.min(1, Math.max(0, frac));
      const inside = s / c;
      confidence[side] = Math.max(0, Math.min(1, (cOut - inside) / cOut));
      break;
    }
  }

  // ---- BM rows, refined, outside the opening only.
  const bmPx = new Float32Array(W).fill(NaN);
  const leftEnd = ends[0];
  const rightEnd = ends[1];
  // Membrane rows outside the opening: each side from its own tracking.
  const memRow = new Int32Array(W);
  const bandProfile = new Float64Array(W);
  for (let j = 0; j < W; j++) {
    const side = Number.isNaN(leftEnd) ? (j < W / 2 ? 0 : 1) : j <= leftEnd ? 0 : Number.isNaN(rightEnd) || j < rightEnd ? (j < W / 2 ? 0 : 1) : 1;
    memRow[j] = tracked[side]![j]!;
    bandProfile[j] = contrastSide[side]![j]!;
  }
  for (let j = 0; j < W; j++) {
    if (!hasSignal[j]) continue;
    if (!Number.isNaN(leftEnd) && !Number.isNaN(rightEnd) && j > leftEnd && j < rightEnd) continue;
    if (Number.isNaN(leftEnd) || Number.isNaN(rightEnd)) continue;
    bmPx[j] = refineEdge(px, W, H, j, memRow[j]!, 3, false);
  }

  // ---- Opening points: column of the band end, row of the membrane there (from the last
  // columns outside, extrapolated), position on the fundus from the scan header.
  const h = scan.header;
  const bmo: [BmoPoint | null, BmoPoint | null] = [null, null];
  for (let side = 0; side < 2; side++) {
    const c = ends[side]!;
    if (Number.isNaN(c) || Number.isNaN(leftEnd) || Number.isNaN(rightEnd) || rightEnd - leftEnd < 20) continue;
    const dir = side === 0 ? -1 : 1;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let k = 1; k <= 12; k++) {
      const j = Math.round(c) + dir * k;
      if (j < 0 || j >= W || Number.isNaN(bmPx[j]!)) continue;
      xs.push(j);
      ys.push(bmPx[j]!);
    }
    if (xs.length < 4) continue;
    // Least-squares line through the last columns of membrane, evaluated at the end.
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const my = ys.reduce((a, b) => a + b, 0) / ys.length;
    let sxy = 0;
    let sxx = 0;
    for (let i = 0; i < xs.length; i++) {
      sxy += (xs[i]! - mx) * (ys[i]! - my);
      sxx += (xs[i]! - mx) ** 2;
    }
    const row = my + (sxx > 0 ? (sxy / sxx) * (c - mx) : 0);
    const t = c / (W - 1);
    bmo[side] = {
      columnPx: c,
      rowPx: row,
      xMm: h.startXMm + t * (h.endXMm - h.startXMm),
      yMm: h.startYMm + t * (h.endYMm - h.startYMm),
      confidence: confidence[side]!,
    };
  }

  // ---- Motion: vertical steps between neighbouring columns (eye movement during averaging,
  // spec 5.5). The outer retina and the epithelium band are nearly horizontal outside the
  // opening, so the shift that best aligns two neighbouring columns there is 0 or ±1 row;
  // a step of 3 rows or more is movement. (The inner surface is not used: it legitimately
  // drops several rows per column on the walls of the cup.)
  // Columns well outside the opening (or the outer quarter of each side if it was not found);
  // the band is not required at the column itself, since a step breaks its tracking.
  // Columns MOTION_GAP apart are compared: movement also blurs the image across, which
  // spreads a step over several columns. A shift of MOTION_STEP_ROWS or more over the gap
  // is a step; consecutive flagged columns are one step.
  // Only well away from the opening (≥ 60 columns, ~340 µm), where swelling does not
  // reshape the layers quickly.
  let motionSteps = 0;
  const outerLeft = Number.isNaN(leftEnd) ? W / 4 : leftEnd - 60;
  const outerRight = Number.isNaN(rightEnd) ? (3 * W) / 4 : rightEnd + 60;
  const shiftAt = new Float64Array(W).fill(NaN);
  for (let j = 0; j + MOTION_GAP < W; j++) {
    const k = j + MOTION_GAP;
    if (!(hasSignal[j] && hasSignal[k] && (k < outerLeft || j > outerRight))) continue;
    const p = memRow[j]!;
    const r0 = Math.max(MOTION_SEARCH + 1, p - 28);
    const r1 = Math.min(H - MOTION_SEARCH - 2, p + 10);
    const a = j * H;
    const b = k * H;
    let best = Infinity;
    let arg = 0;
    for (let s = -MOTION_SEARCH; s <= MOTION_SEARCH; s++) {
      let acc = 0;
      for (let i = r0; i <= r1; i++) {
        const d = ST[a + i]! - ST[b + i + s]!;
        acc += d * d;
      }
      if (acc < best) {
        best = acc;
        arg = s;
      }
    }
    shiftAt[j] = arg;
  }
  // A step is a large shift with flat stretches on both sides; a fold keeps rising or
  // falling over the neighbouring stretches (for a sinusoid the score below is about half
  // the shift; for a step, about all of it).
  let inStep = false;
  for (let j = MOTION_GAP; j + 2 * MOTION_GAP < W; j++) {
    const o = shiftAt[j]!;
    const before = shiftAt[j - MOTION_GAP]!;
    const after = shiftAt[j + MOTION_GAP]!;
    if (Number.isNaN(o) || Number.isNaN(before) || Number.isNaN(after)) {
      inStep = false;
      continue;
    }
    const score = Math.abs(o) - 0.5 * (Math.abs(before) + Math.abs(after));
    const flagged = Math.abs(o) >= MOTION_STEP_ROWS && score >= MOTION_SCORE_ROWS;
    if (flagged && !inStep) motionSteps++;
    inStep = flagged;
  }

  // ---- Checks (spec 6.1).
  let found = 0;
  let outsideCols = 0;
  let outsideBoth = 0;
  for (let j = 0; j < W; j++) {
    if (!Number.isNaN(ilmPx[j]!)) found++;
    const inside = !Number.isNaN(leftEnd) && !Number.isNaN(rightEnd) && j > leftEnd && j < rightEnd;
    if (inside) continue;
    outsideCols++;
    if (!Number.isNaN(ilmPx[j]!) && !Number.isNaN(bmPx[j]!)) outsideBoth++;
  }
  const validColumnFraction = outsideCols > 0 ? outsideBoth / outsideCols : 0;
  const rejections: ScanRejection[] = [];
  if (quality.qualityDb < QUALITY_POOR_DB) rejections.push('low-signal');
  if (1 - found / W > DROPOUT_LIMIT || 1 - validColumnFraction > DROPOUT_LIMIT) rejections.push('signal-dropout');
  let nearTop = truncatedColumns;
  for (let j = 0; j < W; j++) if (!Number.isNaN(ilmPx[j]!) && ilmPx[j]! < TRUNCATION_ROWS) nearTop++;
  if (nearTop > 0) rejections.push('truncated');
  if (!(bandContrast[0] > MIN_BAND_CONTRAST) || !(bandContrast[1] > MIN_BAND_CONTRAST) || found < W / 2) rejections.push('surface-not-found');
  if (!bmo[0] || !bmo[1]) rejections.push('bmo-not-found');
  if (motionSteps >= MOTION_STEPS_LIMIT) rejections.push('motion');

  return {
    analysis: {
      index: scan.index,
      qualityDb: quality.qualityDb,
      headerQualityDb: scan.header.qualityDb,
      validColumnFraction,
      usable: rejections.length === 0,
      rejections,
      ilmPx,
      bmPx,
      bmo,
    },
    diagnostics: {
      signalFraction: signalCount / W,
      motionSteps,
      truncatedColumns: nearTop,
      bandContrast,
      bandProfile,
      bmPath: memRow,
      noiseFloor: quality.noiseFloor,
    },
  };
}
