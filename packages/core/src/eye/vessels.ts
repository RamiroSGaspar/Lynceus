/**
 * Retinal vessel tree of one eye, in the anatomical frame (µm; x temporal,
 * y superior, origin at the centre of the opening). The same tree feeds the
 * B-scans (vessel in the nerve fibre layer with a shadow below) and the fundus
 * image (dark lines), so a shadow falls where the scan crosses the vessel.
 * Specification 01, section 3.8.
 */
import type { Rng } from '../rng';

export interface VesselSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Radius at each end, µm. */
  r0: number;
  r1: number;
  artery: boolean;
}

export interface VesselHit {
  /** Distance from the column to the vessel centre line, µm. */
  distanceUm: number;
  radiusUm: number;
  artery: boolean;
}

const CELL_UM = 100;
const GRID_HALF_UM = 7000;
const GRID_N = Math.ceil((2 * GRID_HALF_UM) / CELL_UM);
const DEG = Math.PI / 180;

export class VesselTree {
  readonly segments: VesselSegment[];
  private readonly cellStart: Int32Array;
  private readonly cellItems: Int32Array;

  constructor(segments: VesselSegment[]) {
    this.segments = segments;
    const lists: number[][] = Array.from({ length: GRID_N * GRID_N }, () => []);
    segments.forEach((s, i) => {
      const r = Math.max(s.r0, s.r1);
      const cx0 = this.cell(Math.min(s.x0, s.x1) - r);
      const cx1 = this.cell(Math.max(s.x0, s.x1) + r);
      const cy0 = this.cell(Math.min(s.y0, s.y1) - r);
      const cy1 = this.cell(Math.max(s.y0, s.y1) + r);
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) lists[cy * GRID_N + cx]!.push(i);
    });
    this.cellStart = new Int32Array(GRID_N * GRID_N + 1);
    let total = 0;
    lists.forEach((l, i) => {
      this.cellStart[i] = total;
      total += l.length;
    });
    this.cellStart[GRID_N * GRID_N] = total;
    this.cellItems = new Int32Array(total);
    let k = 0;
    for (const l of lists) for (const i of l) this.cellItems[k++] = i;
  }

  private cell(v: number): number {
    const c = Math.floor((v + GRID_HALF_UM) / CELL_UM);
    return c < 0 ? 0 : c >= GRID_N ? GRID_N - 1 : c;
  }

  /** The vessel covering (x, y) with the largest cross-section there, or null. */
  query(x: number, y: number, out: VesselHit): VesselHit | null {
    if (x < -GRID_HALF_UM || x >= GRID_HALF_UM || y < -GRID_HALF_UM || y >= GRID_HALF_UM) return null;
    const c = this.cell(y) * GRID_N + this.cell(x);
    let best = -1;
    let bestChord = 0;
    for (let k = this.cellStart[c]!; k < this.cellStart[c + 1]!; k++) {
      const s = this.segments[this.cellItems[k]!]!;
      const dx = s.x1 - s.x0;
      const dy = s.y1 - s.y0;
      const len2 = dx * dx + dy * dy;
      let t = len2 > 0 ? ((x - s.x0) * dx + (y - s.y0) * dy) / len2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = s.x0 + t * dx - x;
      const py = s.y0 + t * dy - y;
      const d = Math.sqrt(px * px + py * py);
      const r = s.r0 + t * (s.r1 - s.r0);
      if (d >= r) continue;
      const chord = r * Math.sqrt(1 - (d / r) * (d / r));
      if (chord > bestChord) {
        bestChord = chord;
        best = this.cellItems[k]!;
        out.distanceUm = d;
        out.radiusUm = r;
        out.artery = s.artery;
      }
    }
    return best >= 0 ? out : null;
  }
}

interface GrowOptions {
  x: number;
  y: number;
  /** Heading, radians in the anatomical frame. */
  heading: number;
  diameter: number;
  length: number;
  /** Turn per µm of length, radians. */
  curvature: number;
  artery: boolean;
  branchesLeft: number;
}

const STEP_UM = 60;

function grow(o: GrowOptions, rng: Rng, out: VesselSegment[]): void {
  let { x, y, heading, diameter } = o;
  const branchAt = o.branchesLeft > 0 ? rng.uniform(0.25, 0.55) * o.length : Infinity;
  let branched = false;
  for (let s = 0; s < o.length; s += STEP_UM) {
    heading += o.curvature * STEP_UM + rng.normal(0, 0.035);
    const nd = Math.max(18, diameter * Math.exp(-STEP_UM / 9000));
    const nx = x + STEP_UM * Math.cos(heading);
    const ny = y + STEP_UM * Math.sin(heading);
    out.push({ x0: x, y0: y, x1: nx, y1: ny, r0: diameter / 2, r1: nd / 2, artery: o.artery });
    x = nx;
    y = ny;
    diameter = nd;
    if (!branched && s >= branchAt) {
      branched = true;
      const side = rng.next() < 0.5 ? -1 : 1;
      grow(
        {
          x,
          y,
          heading: heading + side * rng.uniform(25, 45) * DEG,
          diameter: diameter * 0.72,
          length: (o.length - s) * rng.uniform(0.5, 0.8),
          curvature: -side * rng.uniform(0, 4e-5),
          artery: o.artery,
          branchesLeft: o.branchesLeft - 1,
        },
        rng,
        out,
      );
      diameter *= 0.85;
    }
  }
}

/**
 * Builds the tree: four arcades (superotemporal, inferotemporal, superonasal,
 * inferonasal; ±12°), each with an artery (90–110 µm at the opening edge) and a
 * vein (120–140 µm) that taper and branch once or twice, plus two or three small
 * vessels. Inside the opening they converge on a central trunk shifted nasally.
 * `bmoRadius(θ)` gives the opening edge in µm.
 */
export function buildVesselTree(rng: Rng, bmoRadius: (theta: number) => number): VesselTree {
  const segments: VesselSegment[] = [];
  // Trunk: a quarter of the radius toward the nasal side (θ = 180°).
  const trunkX = -0.25 * bmoRadius(Math.PI);
  const trunkY = rng.normal(0, 30);
  const arcades = [
    { base: 45, temporal: true },
    { base: -45, temporal: true },
    { base: 135, temporal: false },
    { base: 225, temporal: false },
  ];
  for (const arc of arcades) {
    const dir = (arc.base + rng.uniform(-12, 12)) * DEG;
    for (const artery of [true, false]) {
      const exit = dir + (artery ? -1 : 1) * rng.uniform(3, 7) * DEG;
      const r = bmoRadius(exit);
      const ex = r * Math.cos(exit);
      const ey = r * Math.sin(exit);
      const diameter = artery ? rng.uniform(90, 110) : rng.uniform(120, 140);
      // Inside the opening: straight to the trunk, slightly thicker.
      segments.push({ x0: trunkX, y0: trunkY, x1: ex, y1: ey, r0: (diameter * 1.08) / 2, r1: diameter / 2, artery });
      // Temporal arcades bend toward the horizontal temporal axis, around the macula.
      const sign = Math.sin(exit) >= 0 ? -1 : 1;
      const curvature = arc.temporal ? sign * rng.uniform(5e-5, 9e-5) : -sign * rng.uniform(0, 3e-5);
      grow({ x: ex, y: ey, heading: exit, diameter, length: rng.uniform(6500, 7500), curvature, artery, branchesLeft: 1 + rng.int(2) }, rng, segments);
    }
  }
  const small = 2 + rng.int(2);
  for (let i = 0; i < small; i++) {
    // Mostly toward the temporal side (the papillomacular region), where the arcades leave a gap.
    const dir = (rng.next() < 0.7 ? rng.uniform(-30, 30) : rng.uniform(150, 210)) * DEG;
    const r = bmoRadius(dir);
    const ex = r * Math.cos(dir);
    const ey = r * Math.sin(dir);
    const diameter = rng.uniform(35, 55);
    segments.push({ x0: 0.6 * ex, y0: 0.6 * ey, x1: ex, y1: ey, r0: diameter / 2, r1: diameter / 2, artery: rng.next() < 0.5 });
    grow({ x: ex, y: ey, heading: dir, diameter, length: rng.uniform(1500, 3000), curvature: rng.normal(0, 5e-5), artery: false, branchesLeft: 0 }, rng, segments);
  }
  return new VesselTree(segments);
}
