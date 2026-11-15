/**
 * Exam-level measures (spec 01, 6.4 and 6.5): the ellipse of the opening, total
 * retinal thickness in the four rings, minimum rim width and roughness of Bruch's
 * membrane. Fundus positions in mm; thicknesses and distances in µm.
 */
import type { BScanHeader, Eye, ScanAnalysis, Sector } from '../contract';
import { RINGS_UM } from '../constants';
import { ellipseSignedDistance, fitEllipseRobust, type Ellipse } from '../math/ellipse';
import { smoothNaN } from '../math/filter';
import { quadraticResiduals } from '../math/linalg';
import { SECTORS, sectorOf } from '../sectors';

export interface Geometry {
  sizeX: number;
  scaleXUm: number;
  scaleZUm: number;
  eye: Eye;
}

/** Anatomical angle (degrees; 0 temporal, 90 superior) of a fundus direction (y down). */
export function anatomicalAngleDeg(eye: Eye, dxMm: number, dyMm: number): number {
  const deg = (Math.atan2(-dyMm, eye === 'OD' ? -dxMm : dxMm) * 180) / Math.PI;
  return deg < 0 ? deg + 360 : deg;
}

function columnPosition(h: BScanHeader, sizeX: number, j: number): [number, number] {
  const t = j / (sizeX - 1);
  return [h.startXMm + t * (h.endXMm - h.startXMm), h.startYMm + t * (h.endYMm - h.startYMm)];
}

/** Rejection distance of the robust ellipse fit, mm (our assumption). */
const ELLIPSE_REJECT_MM = 0.02;

export function fitOpening(points: { x: number; y: number }[]): { ellipse: Ellipse; used: boolean[]; rmsUm: number } | null {
  if (points.length < 5) return null;
  const fit = fitEllipseRobust(
    points.map((p) => p.x),
    points.map((p) => p.y),
    ELLIPSE_REJECT_MM,
  );
  if (!fit) return null;
  return { ellipse: fit.ellipse, used: fit.used, rmsUm: fit.rms * 1000 };
}

export interface RingResult {
  innerUm: number;
  outerUm: number;
  thicknessUm: number;
  radiiUsed: number;
}

/**
 * Area-weighted mean total thickness in each ring. Every column is a sample at its
 * fundus position; its distance to the ellipse picks the ring, and it weighs as its
 * distance to the point where the radial scans cross (the Jacobian of radial
 * sampling: our approximation of NASA's interpolated map, spec 6.5).
 */
export function ringThickness(
  scans: ScanAnalysis[],
  headers: BScanHeader[],
  ellipse: Ellipse,
  centre: [number, number],
  g: Geometry,
): { rings: RingResult[]; quadrantCoverage: number[] } {
  const n = RINGS_UM.length;
  const sumW = new Float64Array(n);
  const sumT = new Float64Array(n);
  const radii = new Int32Array(n);
  const quadrantHits = [0, 0, 0, 0];
  const quadrantTotal = [0, 0, 0, 0];
  const mid = (g.sizeX - 1) / 2;
  for (let k = 0; k < scans.length; k++) {
    const s = scans[k]!;
    const h = headers[k]!;
    for (let side = 0; side < 2; side++) {
      const expected = new Int32Array(n);
      const got = new Int32Array(n);
      const j0 = side === 0 ? 0 : Math.ceil(mid);
      const j1 = side === 0 ? Math.floor(mid) : g.sizeX - 1;
      for (let j = j0; j <= j1; j++) {
        const [x, y] = columnPosition(h, g.sizeX, j);
        const d = ellipseSignedDistance(ellipse, x, y) * 1000;
        let ring = -1;
        for (let r = 0; r < n; r++) if (d >= RINGS_UM[r]![0] && d < RINGS_UM[r]![1]) ring = r;
        if (ring < 0) continue;
        expected[ring] = expected[ring]! + 1;
        if (!s.usable) continue;
        const ilm = s.ilmPx[j]!;
        const bm = s.bmPx[j]!;
        if (Number.isNaN(ilm) || Number.isNaN(bm)) continue;
        got[ring] = got[ring]! + 1;
        const w = Math.hypot(x - centre[0], y - centre[1]) * 1000;
        sumW[ring] = sumW[ring]! + w;
        sumT[ring] = sumT[ring]! + w * (bm - ilm) * g.scaleZUm;
      }
      for (let r = 0; r < n; r++) if (expected[r]! > 0 && got[r]! >= 0.5 * expected[r]!) radii[r] = radii[r]! + 1;
      // Quadrant of this half-scan, by its anatomical direction from the centre.
      const [ex, ey] = columnPosition(h, g.sizeX, side === 0 ? 0 : g.sizeX - 1);
      const theta = anatomicalAngleDeg(g.eye, ex - centre[0], ey - centre[1]);
      const q = theta >= 315 || theta < 45 ? 0 : theta < 135 ? 1 : theta < 225 ? 2 : 3;
      quadrantTotal[q] = quadrantTotal[q]! + 1;
      if (expected[0]! > 0 && got[0]! >= 0.5 * expected[0]!) quadrantHits[q] = quadrantHits[q]! + 1;
    }
  }
  return {
    rings: RINGS_UM.map(([innerUm, outerUm], r) => ({ innerUm, outerUm, thicknessUm: sumW[r]! > 0 ? sumT[r]! / sumW[r]! : NaN, radiiUsed: radii[r]! })),
    quadrantCoverage: quadrantHits.map((hit, q) => (quadrantTotal[q]! > 0 ? hit / quadrantTotal[q]! : 0)),
  };
}

/**
 * Minimum rim width at each opening point: shortest distance, in the plane of the scan
 * and with the scale of each axis, from the point to the inner surface (spec 6.5 [P1, P3, P6]).
 *
 * A scan that does not pass through the centre of the opening crosses its edge at an
 * angle β to the radius, and sees the rim stretched across by 1/cos β. The across
 * distances are multiplied by cos β (β between the scan and the normal of the ellipse
 * at the point), so the result is the width along the radius, as with a centred
 * pattern (our correction; with the 70 µm centring error it removed a bias of +5 to
 * +10 µm).
 */
export function minimumRimWidth(
  scans: ScanAnalysis[],
  headers: BScanHeader[],
  ellipse: Ellipse,
  g: Geometry,
): { meanUm: number; bySector: Map<Sector, number>; points: { thetaDeg: number; mrwUm: number }[] } {
  const points: { thetaDeg: number; mrwUm: number }[] = [];
  const reach = Math.ceil(700 / g.scaleXUm);
  const ca = Math.cos(ellipse.angle);
  const sa = Math.sin(ellipse.angle);
  for (let k = 0; k < scans.length; k++) {
    const s = scans[k]!;
    if (!s.usable) continue;
    const h = headers[k]!;
    const len = Math.hypot(h.endXMm - h.startXMm, h.endYMm - h.startYMm);
    const ux = (h.endXMm - h.startXMm) / len;
    const uy = (h.endYMm - h.startYMm) / len;
    for (const p of s.bmo) {
      if (!p) continue;
      // Normal of the ellipse at the point: gradient of (x'/a)² + (y'/b)².
      const dx = p.xMm - ellipse.cx;
      const dy = p.yMm - ellipse.cy;
      const lx = ca * dx + sa * dy;
      const ly = -sa * dx + ca * dy;
      const gx = lx / (ellipse.a * ellipse.a);
      const gy = ly / (ellipse.b * ellipse.b);
      const nx = ca * gx - sa * gy;
      const ny = sa * gx + ca * gy;
      const cosBeta = Math.max(0.5, Math.abs(nx * ux + ny * uy) / Math.hypot(nx, ny));
      const sx = g.scaleXUm * cosBeta;
      const px = p.columnPx * sx;
      const pz = p.rowPx * g.scaleZUm;
      let best = Infinity;
      const c = Math.round(p.columnPx);
      for (let j = Math.max(0, c - reach); j < Math.min(g.sizeX - 1, c + reach); j++) {
        const a = s.ilmPx[j]!;
        const b = s.ilmPx[j + 1]!;
        if (Number.isNaN(a) || Number.isNaN(b)) continue;
        // Distance to the segment between columns j and j + 1.
        const ax = j * sx;
        const az = a * g.scaleZUm;
        const bx = (j + 1) * sx;
        const bz = b * g.scaleZUm;
        const dx = bx - ax;
        const dz = bz - az;
        const len2 = dx * dx + dz * dz;
        let t = len2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / len2 : 0;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const d = Math.hypot(ax + t * dx - px, az + t * dz - pz);
        if (d < best) best = d;
      }
      if (!Number.isFinite(best)) continue;
      const thetaDeg = anatomicalAngleDeg(g.eye, p.xMm - ellipse.cx, p.yMm - ellipse.cy);
      points.push({ thetaDeg, mrwUm: best });
    }
  }
  const bySector = new Map<Sector, number>();
  for (const sector of SECTORS) {
    const v = points.filter((p) => sectorOf(p.thetaDeg) === sector);
    if (v.length > 0) bySector.set(sector, v.reduce((a, p) => a + p.mrwUm, 0) / v.length);
  }
  const meanUm = points.length > 0 ? points.reduce((a, p) => a + p.mrwUm, 0) / points.length : NaN;
  return { meanUm, bySector, points };
}

/** Zone of the roughness measure, µm from the opening (spec 6.5, our assumption). */
const ROUGHNESS_FROM_UM = 300;
const ROUGHNESS_TO_UM = 1700;

/**
 * Roughness of Bruch's membrane: on every usable half-scan, its height between 300 and
 * 1700 µm from the opening, minus a degree-2 polynomial (tilt and curvature); RMS of
 * all the residuals together (spec 6.5 [P4]). The membrane is smoothed over ±2 columns
 * first, to take out pixel noise without touching folds (420 µm, 74 columns).
 */
export function bmRoughness(scans: ScanAnalysis[], headers: BScanHeader[], ellipse: Ellipse, centre: [number, number], g: Geometry): number {
  let sum = 0;
  let count = 0;
  const xs = new Float64Array(g.sizeX);
  const zs = new Float64Array(g.sizeX);
  const res = new Float64Array(g.sizeX);
  const mid = (g.sizeX - 1) / 2;
  for (let k = 0; k < scans.length; k++) {
    const s = scans[k]!;
    if (!s.usable) continue;
    const h = headers[k]!;
    const bm = smoothNaN(s.bmPx, 2);
    for (let side = 0; side < 2; side++) {
      let n = 0;
      const j0 = side === 0 ? 0 : Math.ceil(mid);
      const j1 = side === 0 ? Math.floor(mid) : g.sizeX - 1;
      for (let j = j0; j <= j1; j++) {
        if (Number.isNaN(bm[j]!)) continue;
        const [x, y] = columnPosition(h, g.sizeX, j);
        const d = ellipseSignedDistance(ellipse, x, y) * 1000;
        if (d < ROUGHNESS_FROM_UM || d > ROUGHNESS_TO_UM) continue;
        xs[n] = Math.hypot(x - centre[0], y - centre[1]) * 1000;
        zs[n] = bm[j]! * g.scaleZUm;
        n++;
      }
      if (n < 10 || !quadraticResiduals(xs, zs, n, res)) continue;
      for (let i = 0; i < n; i++) sum += res[i]! * res[i]!;
      count += n;
    }
  }
  return count > 0 ? Math.sqrt(sum / count) : NaN;
}
