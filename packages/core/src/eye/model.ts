/**
 * Virtual eye: a parametric optic nerve head and the retina around it, with its
 * evolution by flight day (specification 01, section 3).
 *
 * Anatomical frame: origin at the centre of the opening (BMO), x toward temporal,
 * y toward superior, micrometres. Polar angle θ = 0° temporal, 90° superior,
 * 180° nasal, 270° inferior. ρ = r − r_BMO(θ): distance outward from the edge of
 * the opening along the radius (our reading of "distance from the edge"; it is
 * cheap and smooth). z is depth, positive into the eye.
 *
 * Fixed anatomy comes from the seed `eye/<crew>/<eye>`; the shapes below are the
 * starting proposal of the specification, calibrated so the targets of
 * section 3.9 hold exactly on the noise-free model.
 */
import type { CrewId, Eye } from '../contract';
import { ellipseFrame, ellipseSignedDistance, fitEllipseAlgebraic, fitEllipseGeometric, type Ellipse } from '../math/ellipse';
import { bisect, monotoneCubic, smoothstep } from '../math/interp';
import { quadraticResiduals } from '../math/linalg';
import { createRng } from '../rng';
import { SCAN_COLUMNS, SCALE_X_UM, RINGS_UM, CUP_REFERENCE_UM } from '../constants';
import { ANATOMY, CHOROID_INCREASE_UM, EVOLUTION_DAYS, ROUGHNESS_INCREASE_UM, SWELLING_UM, type EyeAnatomy } from './crew';
import { buildVesselTree, type VesselTree } from './vessels';

const DEG = Math.PI / 180;
const TWO_PI = 2 * Math.PI;

// ------------------------------------------------------------ Shape constants

/** Mean total thickness far from the nerve, µm. Spec 3.3 (with 392 µm in the ring it gives ~319 µm at ρ = 1 mm [P3]). */
export const TRT_FAR_UM = 290;
/** Decay length of the mean total thickness, µm. Spec 3.3. */
export const TRT_DECAY_UM = 700;
/** All layers but the nerve fibres: 215 µm from ρ = 600 µm, down to 150 µm at the edge. Spec 3.3. */
export const OUTER_FAR_UM = 215;
export const OUTER_EDGE_UM = 150;
export const OUTER_RAMP_UM = 600;
/** Bruch's membrane rises toward the vitreous away from the opening: 20 µm per mm. Spec 3.2. */
export const BM_RISE_PER_UM = 0.02;
/** Swelling radial profile g(ρ) = 1.481·exp(−ρ/296 µm). Spec 3.4, fitted to P1 (our assumption). */
export const SWELL_G0 = 1.481;
export const SWELL_DECAY_UM = 296;
/** Fold spacing, µm. Spec 3.6: our assumption (P5 gives 260–400 µm in the macula). */
export const FOLD_WAVELENGTH_UM = 420;
/** Lamina cribrosa: a ~250 µm band from ~350 µm behind the opening plane. Spec 3.5. */
export const LAMINA_TOP_UM = 350;
export const LAMINA_THICKNESS_UM = 250;
/** Distance over which the choroid thins to zero at the edge of the opening, µm (our assumption). */
export const CHOROID_TAPER_UM = 400;

/** Split of the non-fibre thickness, top to bottom. Spec 3.7. */
export const LAYER_FRACTIONS = {
  gclIpl: 0.27,
  inl: 0.14,
  opl: 0.1,
  onl: 0.24,
  photoreceptors: 0.16,
  rpeBm: 0.09,
} as const;

/** All layers but the nerve fibre layer, O(ρ). */
export function outerThicknessUm(rho: number): number {
  return OUTER_EDGE_UM + (OUTER_FAR_UM - OUTER_EDGE_UM) * smoothstep(0, OUTER_RAMP_UM, rho);
}

/** Angular shape of the nerve fibre layer, mean 1: thicker above and below, thinner temporally. Spec 3.3. */
export function rnflAngular(theta: number): number {
  return 1 + 0.22 * Math.cos(2 * (theta - Math.PI / 2)) - 0.08 * Math.cos(theta);
}

/** Angular shape of the swelling h(θ): temporal 0.55, nasal 1.11, superior and inferior 1.17; mean 1. Spec 3.4 [N1]. */
export function swellAngular(theta: number): number {
  return 1 - 0.28 * Math.cos(theta) - 0.17 * Math.cos(2 * theta);
}

/** Radial shape of the swelling g(ρ). Spec 3.4 [P1]. */
export function swellRadial(rho: number): number {
  return SWELL_G0 * Math.exp(-rho / SWELL_DECAY_UM);
}

/** Fold strength by angle: 1 above, below and nasally; 0.25 temporally, with a smooth transition. Spec 3.6 [P4]. */
export function foldAngular(theta: number): number {
  const c = Math.cos(theta);
  return c > 0 ? 1 - 0.75 * c * c : 1;
}

/** Fold envelope: 0 up to 100 µm, 1 from 300 µm, back to 0 between 1600 and 2000 µm. Spec 3.6 (our assumption). */
export function foldEnvelope(rho: number): number {
  return smoothstep(100, 300, rho) * (1 - smoothstep(1600, 2000, rho));
}

/**
 * Choroid thickness by angle, mean 1: superior 225, inferior 183, nasal 220, temporal 233 µm
 * in healthy people (spec 3.7, sans-oct-base-tecnica.md 1.C [P10]), as a ratio to their mean.
 */
export function choroidAngular(theta: number): number {
  return 1 + 0.03 * Math.cos(theta) + 0.0976 * Math.sin(theta) + 0.052 * Math.cos(2 * theta);
}

// ------------------------------------------------------------------ Types

/** What lies along one A-scan at an en-face position of the anatomical frame. */
export interface ColumnProfile {
  inside: boolean;
  /** Polar position about the centre of the opening. */
  r: number;
  theta: number;
  /** Distance outward from the edge (negative inside). */
  rho: number;
  /** r / r_BMO(θ): 0 at the centre, 1 at the edge. */
  u: number;
  /** Depth of the opening plane at this position. */
  zPlane: number;
  zIlm: number;
  /** Bruch's membrane (outside the opening only; NaN inside). */
  zBm: number;
  /** Nerve fibre layer thickness, including swelling (outside only). */
  rnflUm: number;
  /** All other retinal layers, O(ρ) (outside only). */
  outerUm: number;
  /** Choroid thickness (outside only). */
  choroidUm: number;
}

export function emptyProfile(): ColumnProfile {
  return { inside: false, r: 0, theta: 0, rho: 0, u: 0, zPlane: 0, zIlm: 0, zBm: NaN, rnflUm: 0, outerUm: 0, choroidUm: 0 };
}

interface Wave {
  kx: number;
  ky: number;
  phase: number;
}

interface RingSamples {
  inner: number;
  outer: number;
  rho: Float64Array;
  theta: Float64Array;
  weight: Float64Array;
}

/** Half-lines of a perfectly centred radial exam, for the roughness definition (spec 6.5). */
interface RoughnessSamples {
  /** Detrended residual of the natural irregularity (unit scale) and of a unit fold, pooled. */
  irr: Float64Array;
  fold: Float64Array;
}

export interface CupParameters {
  w0: number;
  p: number;
  hb0Um: number;
  /** Mean MRW of the reference exam with these parameters (it is a target only up to geometry). */
  mrwUm: number;
}

// ------------------------------------------------------------------- Model

export class EyeModel {
  readonly crewId: CrewId;
  readonly eye: Eye;
  readonly targets: EyeAnatomy;

  /** Opening: rotated ellipse (horizontal and vertical semi-axes, µm) times a smooth perturbation. */
  readonly ellipseAxisH: number;
  readonly ellipseAxisV: number;
  readonly ellipseRotation: number;
  private readonly perturbation: { n: number; amp: number; phase: number }[];
  /** Ellipse fitted to the true (perturbed) edge: the opening "as measured". */
  readonly fittedEllipse: Ellipse;
  readonly trueAreaUm2: number;

  /** Tilt of the opening plane: z = tiltX·x + tiltY·y. */
  readonly tiltX: number;
  readonly tiltY: number;

  private readonly waves: Wave[];
  /** Scale of the natural irregularity of Bruch's membrane, µm per unit wave sum. */
  readonly irregularityScale: number;
  /** Detrended roughness of the reference exam (natural irregularity only), µm. */
  readonly baselineRoughnessUm: number;
  private readonly foldPhase: { p0: number; a1: number; b1: number; a2: number; b2: number };

  /** Calibrated mean total thickness at the edge (spec 3.3). */
  readonly trtEdgeUm: number;
  /** Swelling normalisation: ring 0–250 change equals E(d) exactly (spec 3.4). */
  readonly swellScale: number;
  readonly cup: CupParameters;

  readonly vessels: VesselTree;

  private readonly swellingCurve: (d: number) => number;
  private readonly roughnessCurve: (d: number) => number;
  private readonly choroidCurve: (d: number) => number;
  private readonly foldCurve: (d: number) => number;
  /** Fold amplitude at each day of EVOLUTION_DAYS. */
  readonly foldAmplitudesUm: readonly number[];

  readonly ringSamples: readonly RingSamples[];
  private readonly roughness: RoughnessSamples;

  constructor(crewId: CrewId, eye: Eye) {
    this.crewId = crewId;
    this.eye = eye;
    this.targets = ANATOMY[crewId][eye];
    const rng = createRng(`eye/${crewId}/${eye}`);

    // --- Opening (spec 3.1): taller than wide, axis ratio 1.05–1.18, rotated up to ±12°,
    // edge perturbed by harmonics 3 to 5 up to ±3 % of the radius, exact target area.
    const ratio = rng.uniform(1.05, 1.18);
    this.ellipseRotation = rng.uniform(-12, 12) * DEG;
    const pert = [3, 4, 5].map((n) => ({ n, amp: rng.uniform(0.4, 1), phase: rng.uniform(0, TWO_PI) }));
    let maxPert = 0;
    for (let i = 0; i < 1440; i++) {
      const t = (TWO_PI * i) / 1440;
      let s = 0;
      for (const h of pert) s += h.amp * Math.cos(h.n * t + h.phase);
      maxPert = Math.max(maxPert, Math.abs(s));
    }
    const pertScale = rng.uniform(0.015, 0.03) / maxPert;
    this.perturbation = pert.map((h) => ({ ...h, amp: h.amp * pertScale }));
    this.ellipseAxisH = 1;
    this.ellipseAxisV = ratio;
    const unitArea = this.computeTrueArea();
    const scale = Math.sqrt((this.targets.bmoAreaMm2 * 1e6) / unitArea);
    this.ellipseAxisH = scale;
    this.ellipseAxisV = ratio * scale;
    this.trueAreaUm2 = this.computeTrueArea();

    // Plane of the opening: tilt up to ±2° in a random direction (spec 3.1).
    const tiltDir = rng.uniform(0, TWO_PI);
    const tilt = Math.tan(rng.uniform(0, 2) * DEG);
    this.tiltX = tilt * Math.cos(tiltDir);
    this.tiltY = tilt * Math.sin(tiltDir);

    // Natural irregularity of Bruch's membrane: sum of plane waves with ~300 µm detail (spec 3.2).
    this.waves = [];
    for (let i = 0; i < 24; i++) {
      const lambda = rng.uniform(220, 520);
      const dir = rng.uniform(0, TWO_PI);
      this.waves.push({ kx: (TWO_PI / lambda) * Math.cos(dir), ky: (TWO_PI / lambda) * Math.sin(dir), phase: rng.uniform(0, TWO_PI) });
    }
    const targetBaselineRoughness = rng.uniform(2, 3);
    this.foldPhase = { p0: rng.uniform(0, TWO_PI), a1: rng.uniform(0.6, 1.4), b1: rng.uniform(0, TWO_PI), a2: rng.uniform(0.3, 0.9), b2: rng.uniform(0, TWO_PI) };

    this.vessels = buildVesselTree(createRng(`eye/${crewId}/${eye}/vessels`), (t) => this.bmoRadius(t));

    // Ellipse fitted to the true edge.
    const bx: number[] = [];
    const by: number[] = [];
    for (let i = 0; i < 720; i++) {
      const t = (TWO_PI * i) / 720;
      const r = this.bmoRadius(t);
      bx.push(r * Math.cos(t));
      by.push(r * Math.sin(t));
    }
    const init = fitEllipseAlgebraic(bx, by);
    if (!init) throw new Error('Opening edge does not fit an ellipse');
    this.fittedEllipse = fitEllipseGeometric(bx, by, init);

    // Evolution curves (spec 4): monotone cubic interpolation between the table days.
    const days = EVOLUTION_DAYS as number[];
    this.swellingCurve = monotoneCubic(days, SWELLING_UM[crewId][eye] as number[]);
    this.roughnessCurve = monotoneCubic(days, ROUGHNESS_INCREASE_UM[crewId][eye] as number[]);
    this.choroidCurve = monotoneCubic(days, CHOROID_INCREASE_UM[crewId] as number[]);

    // --- Calibration of the thickness (spec 3.3 and 3.4) on the area-weighted rings.
    this.ringSamples = RINGS_UM.map(([inner, outer]) => this.buildRingSamples(inner, outer));
    const ring0 = this.ringSamples[0]!;
    let sw = 0, sA = 0, sB = 0, sG = 0;
    for (let i = 0; i < ring0.rho.length; i++) {
      const w = ring0.weight[i]!;
      if (w === 0) continue;
      const rho = ring0.rho[i]!;
      const th = ring0.theta[i]!;
      const m = rnflAngular(th);
      const e = Math.exp(-rho / TRT_DECAY_UM);
      // TRT = O(1 − m) + m·[TRT_far(1 − e) + TRT_edge·e]: linear in TRT_edge.
      sA += w * (outerThicknessUm(rho) * (1 - m) + m * TRT_FAR_UM * (1 - e));
      sB += w * m * e;
      sG += w * swellRadial(rho) * swellAngular(th);
      sw += w;
    }
    this.trtEdgeUm = (this.targets.ringUm - sA / sw) / (sB / sw);
    this.swellScale = 1 / (sG / sw);

    // --- Roughness (spec 3.2 and 3.6): natural irregularity scaled to its target, fold
    // amplitude solved exactly at every table day (residuals are linear in the amplitude).
    this.roughness = this.buildRoughnessSamples();
    const ss = (a: Float64Array, b: Float64Array): number => {
      let s = 0;
      for (let i = 0; i < a.length; i++) s += a[i]! * b[i]!;
      return s / a.length;
    };
    const irrRms = Math.sqrt(ss(this.roughness.irr, this.roughness.irr));
    this.irregularityScale = targetBaselineRoughness / irrRms;
    this.baselineRoughnessUm = targetBaselineRoughness;
    const a = targetBaselineRoughness * targetBaselineRoughness;
    const b = this.irregularityScale * ss(this.roughness.irr, this.roughness.fold);
    const c = ss(this.roughness.fold, this.roughness.fold);
    this.foldAmplitudesUm = days.map((d) => {
      const target = targetBaselineRoughness + this.roughnessCurve(d);
      if (target <= targetBaselineRoughness) return 0;
      return (-b + Math.sqrt(b * b - c * (a - target * target))) / c;
    });
    this.foldCurve = monotoneCubic(days, this.foldAmplitudesUm as number[]);

    // --- Cup (spec 3.5).
    this.cup = this.calibrateCup();
  }

  // ------------------------------------------------------------ Geometry

  /** Radius of the true opening edge in direction θ, µm. */
  bmoRadius(theta: number): number {
    const t = theta - this.ellipseRotation;
    const c = Math.cos(t) / this.ellipseAxisH;
    const s = Math.sin(t) / this.ellipseAxisV;
    let p = 1;
    for (const h of this.perturbation) p += h.amp * Math.cos(h.n * theta + h.phase);
    return p / Math.sqrt(c * c + s * s);
  }

  private computeTrueArea(): number {
    const n = 3600;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const r = this.bmoRadius((TWO_PI * (i + 0.5)) / n);
      s += r * r;
    }
    return 0.5 * s * (TWO_PI / n);
  }

  /** Natural irregularity of Bruch's membrane at (x, y), µm. */
  irregularity(x: number, y: number): number {
    return this.irregularityScale * this.irregularityUnit(x, y);
  }

  private irregularityUnit(x: number, y: number): number {
    let s = 0;
    for (const w of this.waves) s += Math.cos(w.kx * x + w.ky * y + w.phase);
    return s;
  }

  /** Fold pattern of unit amplitude (spec 3.6). */
  foldUnit(rho: number, theta: number): number {
    const env = foldEnvelope(rho);
    if (env === 0) return 0;
    const f = this.foldPhase;
    const phi = f.p0 + f.a1 * Math.sin(theta + f.b1) + f.a2 * Math.sin(2 * theta + f.b2);
    return foldAngular(theta) * env * Math.sin((TWO_PI * rho) / FOLD_WAVELENGTH_UM + phi);
  }

  /** Mean (over angle) total thickness of the reference exam at distance ρ. */
  meanTrtUm(rho: number): number {
    return TRT_FAR_UM + (this.trtEdgeUm - TRT_FAR_UM) * Math.exp(-rho / TRT_DECAY_UM);
  }

  /** Nerve fibre layer without swelling, RNFL(ρ, θ) = RNFL_m(ρ)·m(θ). */
  rnflBaseUm(rho: number, theta: number): number {
    return (this.meanTrtUm(rho) - outerThicknessUm(rho)) * rnflAngular(theta);
  }

  // -------------------------------------------------------- Evolution

  /** Swelling E(d), µm. */
  swellingUm(flightDay: number): number {
    return flightDay <= 0 ? 0 : this.swellingCurve(flightDay);
  }

  roughnessIncreaseUm(flightDay: number): number {
    return flightDay <= 0 ? 0 : this.roughnessCurve(flightDay);
  }

  choroidIncreaseUm(flightDay: number): number {
    return flightDay <= 0 ? 0 : this.choroidCurve(flightDay);
  }

  foldAmplitudeUm(flightDay: number): number {
    return flightDay <= 0 ? 0 : Math.max(0, this.foldCurve(flightDay));
  }

  state(flightDay: number): EyeState {
    return new EyeState(this, flightDay);
  }

  // --------------------------------------------------------- Calibration

  /**
   * Area-weighted samples of the zone between the fitted ellipse and the curve at
   * `outer` µm from it: points P(t, d) = E(t) + d·n(t), with area element
   * |E'(t)|·(1 + κ(t)·d)·dt·dd. Points inside the true opening get weight 0.
   */
  private buildRingSamples(inner: number, outer: number): RingSamples {
    const nt = 720;
    const nd = Math.round((outer - inner) / 5);
    const n = nt * nd;
    const rho = new Float64Array(n);
    const theta = new Float64Array(n);
    const weight = new Float64Array(n);
    let k = 0;
    for (let i = 0; i < nt; i++) {
      const f = ellipseFrame(this.fittedEllipse, (TWO_PI * (i + 0.5)) / nt);
      for (let j = 0; j < nd; j++) {
        const d = inner + ((outer - inner) * (j + 0.5)) / nd;
        const x = f.x + d * f.nx;
        const y = f.y + d * f.ny;
        const th = Math.atan2(y, x);
        const rh = Math.hypot(x, y) - this.bmoRadius(th);
        rho[k] = rh;
        theta[k] = th;
        weight[k] = rh < 0 ? 0 : f.speed * (1 + f.curvature * d);
        k++;
      }
    }
    return { inner, outer, rho, theta, weight };
  }

  /** 96 half-lines from the centre with the column spacing of a scan, ρ_ellipse in [300, 1700] µm (spec 6.5). */
  private buildRoughnessSamples(): RoughnessSamples {
    const irr: number[] = [];
    const fold: number[] = [];
    const half = ((SCAN_COLUMNS - 1) / 2) * SCALE_X_UM;
    const xs = new Float64Array(SCAN_COLUMNS);
    const yi = new Float64Array(SCAN_COLUMNS);
    const yf = new Float64Array(SCAN_COLUMNS);
    const ri = new Float64Array(SCAN_COLUMNS);
    const rf = new Float64Array(SCAN_COLUMNS);
    for (let k = 0; k < 96; k++) {
      const th = (k * 3.75 * DEG) % TWO_PI;
      const c = Math.cos(th);
      const s = Math.sin(th);
      let n = 0;
      for (let r = SCALE_X_UM / 2; r <= half; r += SCALE_X_UM) {
        const x = r * c;
        const y = r * s;
        const de = ellipseSignedDistance(this.fittedEllipse, x, y);
        if (de < 300 || de > 1700) continue;
        const rho = r - this.bmoRadius(th);
        xs[n] = r;
        yi[n] = this.irregularityUnit(x, y);
        yf[n] = this.foldUnit(rho, th);
        n++;
      }
      if (n < 3) continue;
      quadraticResiduals(xs, yi, n, ri);
      quadraticResiduals(xs, yf, n, rf);
      for (let i = 0; i < n; i++) {
        irr.push(ri[i]!);
        fold.push(rf[i]!);
      }
    }
    return { irr: Float64Array.from(irr), fold: Float64Array.from(fold) };
  }

  /** Detrended roughness of Bruch's membrane on day d, on the noise-free model, µm. */
  roughnessUm(flightDay: number): number {
    const A = this.foldAmplitudeUm(flightDay);
    const { irr, fold } = this.roughness;
    let s = 0;
    for (let i = 0; i < irr.length; i++) {
      const v = this.irregularityScale * irr[i]! + A * fold[i]!;
      s += v * v;
    }
    return Math.sqrt(s / irr.length);
  }

  /** Total thickness at (ρ, θ) on day d (outside the opening). */
  trtUm(rho: number, theta: number, swellingUm: number): number {
    return outerThicknessUm(rho) + this.rnflBaseUm(rho, theta) + swellingUm * this.swellScale * swellRadial(rho) * swellAngular(theta);
  }

  /**
   * Chooses the cup width w, wall steepness p and floor height so that the cup volume
   * (NASA definition [P3]) and the mean MRW hit their targets. The volume is solved
   * exactly; if no width gives the MRW target, the closest is kept (spec 3.9: the
   * ring, the area and the cup take precedence).
   */
  private calibrateCup(): CupParameters {
    const targetVolume = this.targets.cupVolumeMm3 * 1e9;
    const targetMrw = this.targets.mrwUm;
    const NT = 72;
    const NU = 120;
    const thetaV: number[] = [];
    const rb2: number[] = [];
    const heV: number[] = [];
    for (let i = 0; i < NT; i++) {
      const th = (TWO_PI * (i + 0.5)) / NT;
      const rb = this.bmoRadius(th);
      thetaV.push(th);
      rb2.push(rb * rb);
      heV.push(this.trtUm(0, th, 0));
    }
    const uV = Array.from({ length: NU }, (_, j) => (j + 0.5) / NU);
    // MRW: 24 directions, inner profile on a fine u grid, outer profile precomputed.
    const NM = 24;
    const NUM = 300;
    const mrwDirs = Array.from({ length: NM }, (_, i) => {
      const th = (TWO_PI * (i + 0.5)) / NM;
      const rb = this.bmoRadius(th);
      const c = Math.cos(th);
      const s = Math.sin(th);
      const zp = this.tiltX * rb * c + this.tiltY * rb * s;
      let outerMin = Infinity;
      for (let rho = 0; rho <= 600; rho += 3) {
        const x = (rb + rho) * c;
        const y = (rb + rho) * s;
        const zBm = this.tiltX * x + this.tiltY * y - BM_RISE_PER_UM * rho + this.irregularity(x, y) * smoothstep(0, 200, rho);
        const z = zBm - this.trtUm(rho, th, 0);
        outerMin = Math.min(outerMin, Math.hypot(rho, z - zp));
      }
      return { th, rb, c, s, zp, he: this.trtUm(0, th, 0), outerMin };
    });

    const sCurve = (w: number, p: number, n: number): Float64Array => {
      const q1 = 1 / (1 + Math.pow(1 / w, p));
      const out = new Float64Array(n);
      for (let j = 0; j < n; j++) {
        const u = (j + 0.5) / n;
        const q = 1 / (1 + Math.pow(u / w, p));
        out[j] = (q - q1) / (1 - q1);
      }
      return out;
    };
    const volume = (s: Float64Array, hb: number): number => {
      let v = 0;
      for (let i = 0; i < NT; i++) {
        const he = heV[i]!;
        let acc = 0;
        for (let j = 0; j < NU; j++) {
          const sj = s[j]!;
          const depth = CUP_REFERENCE_UM - (he * (1 - sj) + hb * sj);
          if (depth > 0) acc += depth * uV[j]!;
        }
        v += acc * rb2[i]!;
      }
      return v * (1 / NU) * (TWO_PI / NT);
    };
    const solveFloor = (s: Float64Array): number => {
      const lo = -450;
      const hi = CUP_REFERENCE_UM;
      if (volume(s, lo) < targetVolume) return NaN;
      return bisect((hb) => volume(s, hb), targetVolume, lo, hi, 50);
    };
    const meanMrw = (sM: Float64Array, hb: number): number => {
      let total = 0;
      for (const d of mrwDirs) {
        let best = d.outerMin;
        for (let j = 0; j < NUM; j++) {
          const u = (j + 0.5) / NUM;
          const r = u * d.rb;
          const sj = sM[j]!;
          const z = d.zp * u - (d.he * (1 - sj) + hb * sj);
          const dist = Math.hypot(r - d.rb, z - d.zp);
          if (dist < best) best = dist;
        }
        total += best;
      }
      return total / NM;
    };
    const evaluate = (w: number, p: number): { hb: number; mrw: number } => {
      const hb = solveFloor(sCurve(w, p, NU));
      if (Number.isNaN(hb)) return { hb, mrw: NaN };
      return { hb, mrw: meanMrw(sCurve(w, p, NUM), hb) };
    };

    let best: CupParameters | null = null;
    // Gentle walls first: p = 4 is the softest the specification allows.
    for (const p of [4, 5, 6, 7, 8]) {
      const ws: number[] = [];
      for (let w = 0.2; w <= 0.951; w += 0.025) ws.push(w);
      const evals = ws.map((w) => ({ w, ...evaluate(w, p) }));
      for (let i = 0; i + 1 < evals.length; i++) {
        const a = evals[i]!;
        const b = evals[i + 1]!;
        if (Number.isNaN(a.mrw) || Number.isNaN(b.mrw)) continue;
        if ((a.mrw - targetMrw) * (b.mrw - targetMrw) <= 0) {
          let lo = a.w;
          let hi = b.w;
          const increasing = b.mrw > a.mrw;
          for (let it = 0; it < 30; it++) {
            const mid = 0.5 * (lo + hi);
            const m = evaluate(mid, p).mrw;
            if (Number.isNaN(m)) break;
            if ((m < targetMrw) === increasing) lo = mid;
            else hi = mid;
          }
          const w = 0.5 * (lo + hi);
          const e = evaluate(w, p);
          return { w0: w, p, hb0Um: e.hb, mrwUm: e.mrw };
        }
      }
      for (const e of evals) {
        if (Number.isNaN(e.mrw)) continue;
        if (!best || Math.abs(e.mrw - targetMrw) < Math.abs(best.mrwUm - targetMrw)) best = { w0: e.w, p, hb0Um: e.hb, mrwUm: e.mrw };
      }
    }
    if (!best) throw new Error(`No cup reaches ${this.targets.cupVolumeMm3} mm³ for ${this.crewId} ${this.eye}`);
    return best;
  }
}

// ------------------------------------------------------------------ State

/** The eye on one flight day: evaluates what lies along any A-scan. */
export class EyeState {
  readonly model: EyeModel;
  readonly flightDay: number;
  readonly swellingUm: number;
  readonly foldAmplitudeUm: number;
  readonly choroidIncreaseUm: number;
  /** Cup width and floor on this day: the cup shrinks with swelling (spec 3.5, our assumption fitted to P3). */
  readonly cupWidth: number;
  readonly cupFloorUm: number;
  private readonly q1: number;

  constructor(model: EyeModel, flightDay: number) {
    this.model = model;
    this.flightDay = flightDay;
    this.swellingUm = model.swellingUm(flightDay);
    this.foldAmplitudeUm = model.foldAmplitudeUm(flightDay);
    this.choroidIncreaseUm = model.choroidIncreaseUm(flightDay);
    this.cupWidth = model.cup.w0 * Math.max(0.4, 1 - 0.004 * this.swellingUm);
    this.cupFloorUm = model.cup.hb0Um + 0.6 * this.swellingUm;
    this.q1 = 1 / (1 + Math.pow(1 / this.cupWidth, model.cup.p));
  }

  /** Total retinal thickness outside the opening. */
  trtUm(rho: number, theta: number): number {
    return this.model.trtUm(rho, theta, this.swellingUm);
  }

  /** Height of the inner surface above the opening plane, inside the opening (spec 3.5). */
  cupHeightUm(u: number, theta: number): number {
    const q = 1 / (1 + Math.pow(u / this.cupWidth, this.model.cup.p));
    const s = (q - this.q1) / (1 - this.q1);
    return this.trtUm(0, theta) * (1 - s) + this.cupFloorUm * s;
  }

  /** Depth of Bruch's membrane outside the opening (spec 3.2 and 3.6). */
  bmDepthUm(x: number, y: number, rho: number, theta: number): number {
    const m = this.model;
    return (
      m.tiltX * x +
      m.tiltY * y -
      BM_RISE_PER_UM * rho +
      m.irregularity(x, y) * smoothstep(0, 200, rho) +
      this.foldAmplitudeUm * m.foldUnit(rho, theta)
    );
  }

  /** Fills `out` with what lies along the A-scan at anatomical (x, y), µm. */
  profile(x: number, y: number, out: ColumnProfile): ColumnProfile {
    const m = this.model;
    const r = Math.hypot(x, y);
    const theta = Math.atan2(y, x);
    const rb = m.bmoRadius(theta);
    const rho = r - rb;
    const zPlane = m.tiltX * x + m.tiltY * y;
    out.r = r;
    out.theta = theta;
    out.rho = rho;
    out.u = r / rb;
    out.zPlane = zPlane;
    if (rho < 0) {
      out.inside = true;
      out.zIlm = zPlane - this.cupHeightUm(out.u, theta);
      out.zBm = NaN;
      out.rnflUm = 0;
      out.outerUm = 0;
      out.choroidUm = 0;
      return out;
    }
    out.inside = false;
    const zBm = this.bmDepthUm(x, y, rho, theta);
    const outer = outerThicknessUm(rho);
    const rnfl = m.rnflBaseUm(rho, theta) + this.swellingUm * m.swellScale * swellRadial(rho) * swellAngular(theta);
    out.zBm = zBm;
    out.outerUm = outer;
    out.rnflUm = rnfl;
    out.zIlm = zBm - outer - rnfl;
    out.choroidUm = (m.targets.choroidUm * choroidAngular(theta) + this.choroidIncreaseUm) * smoothstep(0, CHOROID_TAPER_UM, rho);
    return out;
  }
}

const cache = new Map<string, EyeModel>();

/** The virtual eye of a crew member (built and calibrated once, then cached). */
export function getEye(crewId: CrewId, eye: Eye): EyeModel {
  const key = `${crewId}/${eye}`;
  let m = cache.get(key);
  if (!m) {
    m = new EyeModel(crewId, eye);
    cache.set(key, m);
  }
  return m;
}
