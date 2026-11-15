/**
 * Renders one B-scan of the virtual instrument (spec 01, 5.2 to 5.5): for each
 * column, the tissues the eye model puts along it become a reflectivity profile
 * (partial pixels integrated exactly), attenuated with depth, blurred by the
 * system, multiplied by correlated speckle and added to the detector's noise floor.
 */
import type { CaptureConditions } from '../contract';
import { SCALE_X_UM, SCALE_Z_UM, SCAN_COLUMNS, SCAN_ROWS } from '../constants';
import { emptyProfile, LAMINA_THICKNESS_UM, LAMINA_TOP_UM, LAYER_FRACTIONS, swellAngular, swellRadial, type EyeState } from '../eye/model';
import type { VesselHit } from '../eye/vessels';
import { binomial3Columns, binomial5Rows, convolveColumns, convolveRows, gaussianKernel } from '../math/filter';
import { smoothstep } from '../math/interp';
import { createRng, normalTable16 } from '../rng';
import type { ScanSetup } from './capture';
import { fundusToAnatomical, type ExamGeometry } from './geometry';
import {
  ATTENUATION_PER_ROW,
  BACKSCATTER,
  BLUR_SIGMA_X_PX,
  BLUR_SIGMA_Z_PX,
  CHOROID_LUMEN_BACKSCATTER,
  NOISE_FLOOR,
  PHOTORECEPTOR_SPLIT,
  SPECKLE_SIGMA,
  Tissue,
  falloff,
} from './optics';
import { worley3 } from './texture';

const W = SCAN_COLUMNS;
const H = SCAN_ROWS;
const MAX_LAYERS = 24;
/** Nominal row of the highest point of the inner surface (our choice; spec 5.2 asks for room above and below). */
const NOMINAL_TOP_ROW = 60;
/** Shadow under a retinal vessel: ~25 % transmitted under large vessels, ~55 % under small ones (spec 3.8). */
const SHADOW_LARGE = 0.25;
const SHADOW_SMALL = 0.55;

const FALLOFF_BY_ROW = Float64Array.from({ length: H }, (_, i) => falloff(i));

export interface ScanRenderInput {
  state: EyeState;
  geometry: ExamGeometry;
  startXMm: number;
  startYMm: number;
  endXMm: number;
  endYMm: number;
  setup: ScanSetup;
  conditions: CaptureConditions;
  /** Signal gain relative to the calibrated nominal, dB (quality target minus nominal, minus signal loss). */
  gainDb: number;
  /** Seed key of this scan's noise. */
  noiseKey: string;
  speckle: boolean;
  /** Integer seed of the choroid texture of this eye. */
  choroidSeed: number;
}

function vesselTransmission(radiusUm: number): number {
  const t = smoothstep(20, 45, radiusUm);
  return SHADOW_SMALL + (SHADOW_LARGE - SHADOW_SMALL) * t;
}

/** Tissue intervals along every column: start depth, tissue, backscatter and attenuation per row. */
class ColumnLayers {
  readonly depth = new Float64Array(W * MAX_LAYERS);
  readonly tissue = new Uint8Array(W * MAX_LAYERS);
  readonly bs = new Float64Array(W * MAX_LAYERS);
  readonly mu = new Float64Array(W * MAX_LAYERS);
  readonly count = new Int32Array(W);
  private j = 0;

  begin(j: number): void {
    this.j = j;
    this.count[j] = 0;
  }

  /** Starts `tissue` at depth `z` (µm); boundaries never go back up. */
  push(z: number, tissue: number, backscatter = BACKSCATTER[tissue]!, attenuation = ATTENUATION_PER_ROW[tissue]!): void {
    const n = this.count[this.j]!;
    if (n >= MAX_LAYERS) return;
    const o = this.j * MAX_LAYERS + n;
    this.depth[o] = n > 0 && z < this.depth[o - 1]! ? this.depth[o - 1]! : z;
    this.tissue[o] = tissue;
    this.bs[o] = backscatter;
    this.mu[o] = attenuation;
    this.count[this.j] = n + 1;
  }

  /** Starts `tissue` at z, with a vessel inside it if the vessel starts before `zEnd`. */
  pushWithVessel(z: number, tissue: number, zEnd: number, vesselTop: number, vesselBottom: number, vesselMu: number): void {
    this.push(z, tissue);
    if (!Number.isNaN(vesselTop) && vesselTop >= z && vesselTop < zEnd) {
      this.push(vesselTop, Tissue.Vessel, BACKSCATTER[Tissue.Vessel]!, vesselMu);
      this.push(vesselBottom, tissue);
    }
  }
}

/**
 * Choroid: tissue with dark vessel lumens, small (Sattler, ~45 µm) in its inner
 * part and large (Haller, ~110 µm) in its outer part; the choriocapillaris right
 * under Bruch's membrane has none (our choice of texture).
 */
function choroidBackscatter(tissueBs: number, x: number, y: number, rowsBelowTop: number, choroidRows: number, seed: number): number {
  const f = choroidRows > 0 ? rowsBelowTop / choroidRows : 0;
  if (f < 0.07 || f > 1) return tissueBs;
  const depthUm = rowsBelowTop * SCALE_Z_UM;
  let lumen: number;
  if (f < 0.4) {
    lumen = 1 - smoothstep(0.34, 0.46, worley3(x / 50, y / 50, depthUm / 50, seed));
  } else {
    // Large vessels: wider cells, a little flatter in depth than across.
    lumen = 1 - smoothstep(0.4, 0.52, worley3(x / 120, y / 120, depthUm / 100, seed + 1));
  }
  return tissueBs + (CHOROID_LUMEN_BACKSCATTER - tissueBs) * lumen;
}

export function renderBScan(input: ScanRenderInput): Float32Array {
  const { state, geometry, setup, conditions } = input;
  const model = state.model;
  const affected = setup.affected;
  const motion = affected ? Math.max(0, Math.min(1, conditions.motion ?? 0)) : 0;

  // Eye movement during averaging: vertical steps between blocks of columns (spec 5.5).
  const blockShiftUm = new Float64Array(W);
  if (motion > 0) {
    const mr = createRng(`${input.noiseKey}/motion`);
    let j = 0;
    while (j < W) {
      const width = 30 + mr.int(70);
      // Shift of each block: standard deviation 14 rows (54 µm) at the most severe motion.
      const shift = mr.normal(0, 14 * motion) * SCALE_Z_UM;
      for (let k = j; k < Math.min(W, j + width); k++) blockShiftUm[k] = shift;
      j += width;
    }
  }

  // ---- Tissues along each column, depths in µm (frame offsets included).
  const cols = new ColumnLayers();
  const colX = new Float64Array(W);
  const colY = new Float64Array(W);
  const choroidTop = new Float64Array(W).fill(NaN);
  const choroidThick = new Float64Array(W);
  let zMin = Infinity;
  let zMaxDeep = -Infinity;
  const prof = emptyProfile();
  const hit: VesselHit = { distanceUm: 0, radiusUm: 0, artery: false };
  const halfUm = ((W - 1) / 2) * SCALE_X_UM;
  for (let j = 0; j < W; j++) {
    const t = j / (W - 1);
    const fx = input.startXMm + t * (input.endXMm - input.startXMm);
    const fy = input.startYMm + t * (input.endYMm - input.startYMm);
    const [x, y] = fundusToAnatomical(geometry, fx, fy);
    colX[j] = x;
    colY[j] = y;
    state.profile(x, y, prof);
    const s = (j - (W - 1) / 2) * SCALE_X_UM;
    const off = setup.slope * s + setup.curvatureUm * (s / halfUm) * (s / halfUm) + blockShiftUm[j]!;
    cols.begin(j);
    const zIlm = prof.zIlm + off;
    // Retinal vessel crossing this column: a bright wall in the fibre layer and a shadow below (spec 3.8).
    let vesselTop = NaN;
    let vesselBottom = NaN;
    let vesselMu = 0;
    if (model.vessels.query(x, y, hit)) {
      const halfChord = hit.radiusUm * Math.sqrt(1 - (hit.distanceUm / hit.radiusUm) ** 2);
      const centre = prof.inside ? zIlm + hit.radiusUm + 6 : zIlm + Math.min(hit.radiusUm + 12, Math.max(hit.radiusUm, 0.45 * prof.rnflUm));
      vesselTop = Math.max(zIlm + 3, centre - halfChord);
      vesselBottom = centre + halfChord;
      if (!prof.inside) vesselBottom = Math.min(vesselBottom, zIlm + prof.rnflUm);
      const heightRows = (vesselBottom - vesselTop) / SCALE_Z_UM;
      const tv = 1 - (1 - vesselTransmission(hit.radiusUm)) * (halfChord / hit.radiusUm);
      vesselMu = heightRows > 0.05 ? -Math.log(tv) / (2 * heightRows) : 0;
      if (!(vesselBottom > vesselTop)) vesselTop = NaN;
    }
    if (prof.inside) {
      // Nerve head: prelaminar tissue, then the lamina cribrosa, bowed backward in the middle
      // and fading where it meets the scleral canal wall, which slants inward with depth.
      const plane = prof.zPlane + off;
      const u = prof.u;
      const laminaTop = Math.max(plane + LAMINA_TOP_UM + 70 * (1 - u * u), zIlm + 40);
      const laminaBs = BACKSCATTER[Tissue.Lamina]! * (1 - 0.65 * smoothstep(0.6, 0.95, u));
      const wall = u > 0.8 ? plane + 60 + (LAMINA_TOP_UM + 40) * ((1 - u) / 0.2) : Infinity;
      const prelamEnd = Math.min(laminaTop, wall);
      // The nerve fibres of the rim continue those outside the edge, thinning toward the cup.
      const fibres =
        (model.rnflBaseUm(0, prof.theta) + state.swellingUm * model.swellScale * swellRadial(0) * swellAngular(prof.theta)) * smoothstep(state.cupWidth * 0.7, 1, u);
      const fibreEnd = Math.min(prelamEnd, zIlm + fibres);
      if (fibreEnd > zIlm + 1) {
        cols.pushWithVessel(zIlm, Tissue.Rnfl, fibreEnd, vesselTop, vesselBottom, vesselMu);
        cols.pushWithVessel(fibreEnd, Tissue.Prelaminar, prelamEnd, vesselTop, vesselBottom, vesselMu);
      } else {
        cols.pushWithVessel(zIlm, Tissue.Prelaminar, prelamEnd, vesselTop, vesselBottom, vesselMu);
      }
      if (wall <= laminaTop) {
        cols.push(wall, Tissue.Sclera);
      } else {
        cols.push(laminaTop, Tissue.Lamina, laminaBs);
        const laminaEnd = laminaTop + LAMINA_THICKNESS_UM;
        if (wall <= laminaEnd) {
          cols.push(wall, Tissue.Sclera);
        } else {
          cols.push(laminaEnd, Tissue.Retrolaminar);
          if (wall < Infinity) cols.push(wall, Tissue.Sclera);
        }
      }
      zMaxDeep = Math.max(zMaxDeep, laminaTop + LAMINA_THICKNESS_UM + 40);
    } else {
      const o = prof.outerUm;
      // Near the edge the inner layers merge into the rim: their contrast fades over 150 µm (our choice).
      const merge = smoothstep(0, 150, prof.rho);
      const rimBs = BACKSCATTER[Tissue.Prelaminar]!;
      const mix = (tissue: number): number => rimBs + (BACKSCATTER[tissue]! - rimBs) * merge;
      let z = zIlm;
      cols.pushWithVessel(z, Tissue.Rnfl, z + prof.rnflUm, vesselTop, vesselBottom, vesselMu);
      z += prof.rnflUm;
      cols.push(z, Tissue.GclIpl, mix(Tissue.GclIpl));
      z += LAYER_FRACTIONS.gclIpl * o;
      cols.push(z, Tissue.Inl, mix(Tissue.Inl));
      z += LAYER_FRACTIONS.inl * o;
      cols.push(z, Tissue.Opl, mix(Tissue.Opl));
      z += LAYER_FRACTIONS.opl * o;
      cols.push(z, Tissue.Onl, mix(Tissue.Onl));
      z += LAYER_FRACTIONS.onl * o;
      for (const [tissue, f] of PHOTORECEPTOR_SPLIT) {
        cols.push(z, tissue, mix(tissue));
        z += f * LAYER_FRACTIONS.photoreceptors * o;
      }
      cols.push(z, Tissue.RpeBm);
      z = prof.zBm + off;
      if (prof.choroidUm > 0.5) {
        cols.push(z, Tissue.Choroid);
        choroidTop[j] = z;
        choroidThick[j] = prof.choroidUm;
      }
      cols.push(z + prof.choroidUm, Tissue.Sclera);
      zMaxDeep = Math.max(zMaxDeep, z + prof.choroidUm + 150);
    }
    zMin = Math.min(zMin, zIlm);
  }

  // ---- Place the retina in the frame (spec 5.2): highest point of the inner surface near row 60,
  // ±12 rows; truncation pushes it out of the top (spec 5.5).
  let topRow: number;
  if (affected && conditions.truncationPx && conditions.truncationPx > 0) {
    topRow = -conditions.truncationPx;
  } else {
    topRow = NOMINAL_TOP_ROW + setup.verticalOffsetRows;
    const needed = (zMaxDeep - zMin) / SCALE_Z_UM;
    if (topRow + needed > H - 6) topRow = Math.max(8, H - 6 - needed);
  }
  const toRow = (z: number): number => topRow + (z - zMin) / SCALE_Z_UM;

  // ---- Clean signal, column by column.
  const clean = new Float32Array(W * H);
  const rowB = new Float64Array(MAX_LAYERS + 1);
  const tauStart = new Float64Array(MAX_LAYERS + 1);
  const mu = new Float64Array(MAX_LAYERS + 1);
  const bs = new Float64Array(MAX_LAYERS + 1);
  const isChoroid = new Uint8Array(MAX_LAYERS + 1);
  for (let j = 0; j < W; j++) {
    const n = cols.count[j]!;
    const base = j * MAX_LAYERS;
    for (let m = 0; m < n; m++) {
      rowB[m] = toRow(cols.depth[base + m]!);
      mu[m] = cols.mu[base + m]!;
      bs[m] = cols.bs[base + m]!;
      isChoroid[m] = cols.tissue[base + m] === Tissue.Choroid ? 1 : 0;
    }
    let tau = 0;
    for (let m = 0; m < n; m++) {
      tauStart[m] = tau;
      if (m + 1 < n) tau += mu[m]! * (rowB[m + 1]! - rowB[m]!);
    }
    const cTop = toRow(choroidTop[j]!);
    const cRows = choroidThick[j]! / SCALE_Z_UM;
    const first = n > 0 ? Math.max(0, Math.floor(rowB[0]! - 0.5)) : H;
    let k = -1;
    // Layer holding the pixel centre, and the two-way transmission there, updated row by row.
    let kc = -1;
    let trans = 1;
    let step = 1;
    for (let i = first; i < H; i++) {
      const lo = i - 0.5;
      const hi = i + 0.5;
      while (k + 1 < n && rowB[k + 1]! <= lo) k++;
      let changed = false;
      while (kc + 1 < n && rowB[kc + 1]! <= i) {
        kc++;
        changed = true;
      }
      if (changed) {
        trans = Math.exp(-2 * (tauStart[kc]! + mu[kc]! * (i - rowB[kc]!)));
        step = Math.exp(-2 * mu[kc]!);
      } else if (kc >= 0) {
        trans *= step;
      }
      // Integrate the piecewise-constant backscatter over the pixel.
      let acc = 0;
      let kk = k;
      let segStart = lo;
      for (;;) {
        const segEnd = kk + 1 < n ? Math.min(hi, rowB[kk + 1]!) : hi;
        if (segEnd > segStart && kk >= 0) {
          let b = bs[kk]!;
          if (isChoroid[kk] === 1) b = choroidBackscatter(b, colX[j]!, colY[j]!, i - cTop, cRows, input.choroidSeed);
          acc += b * (segEnd - segStart);
        }
        if (segEnd >= hi || kk + 1 >= n) break;
        kk++;
        segStart = segEnd;
      }
      if (acc !== 0) clean[i * W + j] = acc * trans * FALLOFF_BY_ROW[i]!;
    }
  }

  // ---- System blur, more with marked motion (blurred edges, spec 5.5). Otherwise binomial
  // kernels: [1 4 6 4 1] across (σ = 1.0 px ≈ 13 µm FWHM) and [1 2 1] in depth, which with
  // the integration over each pixel gives σ = 0.77 px (7 µm FWHM). Slight motion (< 0.2)
  // still shifts blocks of columns but adds no blur.
  const blurred =
    motion >= 0.2
      ? convolveColumns(convolveRows(clean, W, H, gaussianKernel(BLUR_SIGMA_X_PX + 3 * motion, 2.6)), W, H, gaussianKernel(BLUR_SIGMA_Z_PX + 1.2 * motion, 2.6))
      : binomial3Columns(binomial5Rows(clean, W, H), W, H);

  // ---- Column factors: gain, blink and edge fade.
  const gain = Math.pow(10, input.gainDb / 10);
  const colFactor = new Float64Array(W).fill(gain);
  if (affected && conditions.blink) {
    const a = conditions.blink.startFraction * W;
    const b = a + conditions.blink.widthFraction * W;
    for (let j = 0; j < W; j++) colFactor[j] = colFactor[j]! * (1 - smoothstep(a - 4, a + 4, j) * (1 - smoothstep(b - 4, b + 4, j)));
  }
  if (affected && conditions.edgeFade) {
    // Loss growing linearly in dB toward the end, 40 dB at the last column (signal gone).
    const width = Math.max(1, conditions.edgeFade.widthFraction * W);
    for (let j = 0; j < W; j++) {
      const d = conditions.edgeFade.side === 'start' ? j : W - 1 - j;
      if (d < width) colFactor[j] = colFactor[j]! * Math.pow(10, (-40 * (1 - d / width)) / 10);
    }
  }

  // ---- Speckle (multiplicative, correlated ~2 px in depth and 2–3 px across) and noise floor.
  const out = new Float32Array(W * H);
  if (!input.speckle) {
    for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) out[i * W + j] = blurred[i * W + j]! * colFactor[j]! + NOISE_FLOOR;
    return out;
  }
  const field = speckleField(input.noiseKey);
  for (let i = 0; i < H; i++) {
    const ni = ((i + 7) % H) * W;
    for (let j = 0; j < W; j++) {
      const idx = i * W + j;
      out[idx] = blurred[idx]! * colFactor[j]! * field[idx]! + NOISE_FLOOR * field[ni + ((j + 13) % W)]!;
    }
  }
  return out;
}

/** Log-normal multiplicative field with mean 1 and variance 1/N_eff, correlated over a few pixels. */
function speckleField(key: string): Float32Array {
  const table = normalTable16();
  const rng = createRng(key);
  const n = W * H;
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i += 2) {
    const u = rng.uint32();
    raw[i] = table[u & 0xffff]!;
    raw[i + 1] = table[u >>> 16]!;
  }
  // Separable kernels [1 3 3 1] (across, wrapping at the ends) and [1 2 1] (depth),
  // scaled to keep unit variance.
  const across = new Float32Array(n);
  for (let i = 0; i < H; i++) {
    const o = i * W;
    for (let j = 0; j < W; j++) {
      const a = raw[o + (j === 0 ? W - 1 : j - 1)]!;
      const b = raw[o + j]!;
      const c = raw[o + (j + 1 < W ? j + 1 : j + 1 - W)]!;
      const d = raw[o + (j + 2 < W ? j + 2 : j + 2 - W)]!;
      across[o + j] = a + 3 * b + 3 * c + d;
    }
  }
  const s = SPECKLE_SIGMA / Math.sqrt((1 + 4 + 1) * (1 + 9 + 9 + 1));
  const g = raw;
  const expT = speckleExpTable();
  const scale = EXP_STEPS / (2 * EXP_RANGE);
  for (let i = 0; i < H; i++) {
    const up = (i === 0 ? H - 1 : i - 1) * W;
    const mid = i * W;
    const down = (i + 1 < H ? i + 1 : 0) * W;
    for (let j = 0; j < W; j++) {
      // exp(σ·z − σ²/2) by table, z a unit normal: linear interpolation, clamped at ±6σ.
      let u = (s * (across[up + j]! + 2 * across[mid + j]! + across[down + j]!) + EXP_RANGE) * scale;
      if (u < 0) u = 0;
      else if (u > EXP_STEPS - 1) u = EXP_STEPS - 1;
      const k = u | 0;
      g[mid + j] = expT[k]! + (u - k) * (expT[k + 1]! - expT[k]!);
    }
  }
  return g;
}

const EXP_STEPS = 4096;
const EXP_RANGE = 6 * SPECKLE_SIGMA;
let expTable: Float64Array | null = null;

/** exp(x − σ²/2) for x in [−6σ, 6σ], sampled finely enough for linear interpolation (error < 1e-5). */
function speckleExpTable(): Float64Array {
  if (expTable) return expTable;
  const t = new Float64Array(EXP_STEPS + 1);
  const mean = -(SPECKLE_SIGMA * SPECKLE_SIGMA) / 2;
  for (let k = 0; k <= EXP_STEPS; k++) t[k] = Math.exp(-EXP_RANGE + (2 * EXP_RANGE * k) / EXP_STEPS + mean);
  expTable = t;
  return t;
}
