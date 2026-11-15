/**
 * True values of the virtual eye (spec 01, section 3.9), computed on the noise-free
 * model with dense numerical integration. Only tests, validation and the
 * transparency view of the interface use them.
 */
import type { CrewId, Eye, EyeGroundTruth, Sector } from '../contract';
import { CUP_REFERENCE_UM } from '../constants';
import { ellipseArea } from '../math/ellipse';
import { SECTORS, sectorOf } from '../sectors';
import { emptyProfile, getEye, type EyeModel, type EyeState } from './model';

const TWO_PI = 2 * Math.PI;
const DEG = Math.PI / 180;

/** Area-weighted mean total thickness of one ring (weights exclude points inside the true opening). */
export function ringThicknessUm(model: EyeModel, state: EyeState, ringIndex: number): number {
  const s = model.ringSamples[ringIndex]!;
  let sw = 0;
  let st = 0;
  for (let i = 0; i < s.rho.length; i++) {
    const w = s.weight[i]!;
    if (w === 0) continue;
    st += w * state.trtUm(s.rho[i]!, s.theta[i]!);
    sw += w;
  }
  return st / sw;
}

/**
 * Minimum rim width at the edge point in direction θ: shortest distance, in the
 * radial plane, from the edge point to the inner surface (both sides of the edge).
 */
export function mrwAtUm(model: EyeModel, state: EyeState, theta: number): number {
  const rb = model.bmoRadius(theta);
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const zp = model.tiltX * rb * c + model.tiltY * rb * s;
  let best = Infinity;
  const NU = 400;
  for (let j = 0; j <= NU; j++) {
    const u = j / NU;
    const z = zp * u - state.cupHeightUm(u, theta);
    const d = Math.hypot((u - 1) * rb, z - zp);
    if (d < best) best = d;
  }
  for (let rho = 2; rho <= 600; rho += 2) {
    const x = (rb + rho) * c;
    const y = (rb + rho) * s;
    const z = state.bmDepthUm(x, y, rho, theta) - state.trtUm(rho, theta);
    const d = Math.hypot(rho, z - zp);
    if (d < best) best = d;
  }
  return best;
}

/** Cup volume, NASA definition [P3]: between the inner surface and the plane 200 µm above the opening plane. */
export function cupVolumeMm3(model: EyeModel, state: EyeState): number {
  const NT = 360;
  const NU = 400;
  let v = 0;
  for (let i = 0; i < NT; i++) {
    const th = (TWO_PI * (i + 0.5)) / NT;
    const rb = model.bmoRadius(th);
    let acc = 0;
    for (let j = 0; j < NU; j++) {
      const u = (j + 0.5) / NU;
      const depth = CUP_REFERENCE_UM - state.cupHeightUm(u, th);
      if (depth > 0) acc += depth * u;
    }
    v += acc * rb * rb;
  }
  return (v * (1 / NU) * (TWO_PI / NT)) / 1e9;
}

/** Means of the choroid and of the nerve fibre layer on the 3.5 mm circle (where NASA measures them [P1, P3]). */
export function circleMeansUm(state: EyeState): { choroid: number; rnfl: number } {
  const p = emptyProfile();
  let ch = 0;
  let rn = 0;
  const n = 720;
  for (let i = 0; i < n; i++) {
    const th = (TWO_PI * (i + 0.5)) / n;
    state.profile(1750 * Math.cos(th), 1750 * Math.sin(th), p);
    ch += p.choroidUm;
    rn += p.rnflUm;
  }
  return { choroid: ch / n, rnfl: rn / n };
}

const cache = new Map<string, EyeGroundTruth>();

export function groundTruth(crewId: CrewId, eye: Eye, flightDay: number): EyeGroundTruth {
  const key = `${crewId}/${eye}/${flightDay}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const model = getEye(crewId, eye);
  const state = model.state(flightDay);
  const reference = model.state(0);
  const e = model.fittedEllipse;

  const rings = model.ringSamples.map((s, i) => ({ innerUm: s.inner, outerUm: s.outer, thicknessUm: ringThicknessUm(model, state, i) }));
  const ring0Reference = ringThicknessUm(model, reference, 0);

  const mrwByPoint: { thetaDeg: number; mrwUm: number }[] = [];
  for (let k = 0; k < 96; k++) {
    const thetaDeg = k * 3.75;
    mrwByPoint.push({ thetaDeg, mrwUm: mrwAtUm(model, state, thetaDeg * DEG) });
  }
  const bySector = new Map<Sector, number[]>(SECTORS.map((s) => [s, []]));
  for (const p of mrwByPoint) bySector.get(sectorOf(p.thetaDeg))!.push(p.mrwUm);
  const mrwSectorsUm = Object.fromEntries(
    SECTORS.map((s) => {
      const v = bySector.get(s)!;
      return [s, v.reduce((a, b) => a + b, 0) / v.length];
    }),
  ) as Record<Sector, number>;
  const circle = circleMeansUm(state);

  const truth: EyeGroundTruth = {
    crewId,
    eye,
    flightDay,
    bmo: {
      centerXMm: e.cx / 1000,
      centerYMm: e.cy / 1000,
      semiMajorMm: e.a / 1000,
      semiMinorMm: e.b / 1000,
      angleDeg: (e.angle * 180) / Math.PI,
      areaMm2: ellipseArea(e) / 1e6,
    },
    bmoTrueAreaMm2: model.trueAreaUm2 / 1e6,
    rings,
    trtRingUm: rings[0]!.thicknessUm,
    trtRingChangeUm: rings[0]!.thicknessUm - ring0Reference,
    mrwUm: mrwByPoint.reduce((a, p) => a + p.mrwUm, 0) / mrwByPoint.length,
    mrwByPoint,
    mrwSectorsUm,
    bmRoughnessUm: model.roughnessUm(flightDay),
    bmRoughnessChangeUm: model.roughnessUm(flightDay) - model.roughnessUm(0),
    cupVolumeMm3: cupVolumeMm3(model, state),
    choroidThicknessUm: circle.choroid,
    rnflCircleUm: circle.rnfl,
  };
  cache.set(key, truth);
  return truth;
}
