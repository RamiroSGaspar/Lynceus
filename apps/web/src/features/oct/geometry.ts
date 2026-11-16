/**
 * Coordinates of the OCT views, without any drawing API (spec 06, section 6).
 *
 * - Fundus frame: millimetres, x right, y down, origin at the top-left corner of the
 *   fundus image (`contract.ts`). Fundus pixel i covers [i, i + 1) × scale.
 * - B-scan: column j sits at `start + j / (sizeX − 1) · (end − start)`: the header's
 *   start and end are the centres of the first and last columns (core NOTES, decision 1).
 *   Rows run from the vitreous; integer rows are pixel centres.
 * - Canvas: CSS pixels of the element the image is drawn into.
 */
import { RINGS_UM, type BScanHeader, type BmoEllipse, type ExamSummary, type ScanAnalysis } from '@app/core';
import { ellipseFrame, ellipseSignedDistance, type Ellipse } from '@app/core/math/ellipse';

export type ScanLine = Pick<BScanHeader, 'startXMm' | 'startYMm' | 'endXMm' | 'endYMm'>;

export interface Point {
  x: number;
  y: number;
}

/** Fundus position (mm) of column `column` of a scan. */
export function columnToFundusMm(line: ScanLine, sizeX: number, column: number): Point {
  const t = column / (sizeX - 1);
  return { x: line.startXMm + t * (line.endXMm - line.startXMm), y: line.startYMm + t * (line.endYMm - line.startYMm) };
}

/** Fundus mm → fundus image pixels (continuous). */
export function fundusMmToPx(point: Point, scaleXMm: number, scaleYMm: number): Point {
  return { x: point.x / scaleXMm, y: point.y / scaleYMm };
}

/** Fundus image pixels (continuous) → fundus mm. */
export function fundusPxToMm(point: Point, scaleXMm: number, scaleYMm: number): Point {
  return { x: point.x * scaleXMm, y: point.y * scaleYMm };
}

/** B-scan pixel (column, row; integers at pixel centres) → canvas position. */
export function scanToCanvas(column: number, row: number, sizeX: number, sizeZ: number, width: number, height: number): Point {
  return { x: ((column + 0.5) * width) / sizeX, y: ((row + 0.5) * height) / sizeZ };
}

/** Canvas position → B-scan pixel (column, row). */
export function canvasToScan(x: number, y: number, sizeX: number, sizeZ: number, width: number, height: number): { column: number; row: number } {
  return { column: (x * sizeX) / width - 0.5, row: (y * sizeZ) / height - 0.5 };
}

function distanceToSegment(p: Point, line: ScanLine): number {
  const dx = line.endXMm - line.startXMm;
  const dy = line.endYMm - line.startYMm;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((p.x - line.startXMm) * dx + (p.y - line.startYMm) * dy) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(line.startXMm + t * dx - p.x, line.startYMm + t * dy - p.y);
}

/**
 * The scan whose line passes closest to a fundus point (mm), or null if none is within
 * `maxDistanceMm`. Uses the scan headers, not an assumed pattern.
 */
export function nearestScan(lines: readonly (ScanLine | undefined)[], point: Point, maxDistanceMm: number): number | null {
  let best: number | null = null;
  let bestDistance = maxDistanceMm;
  lines.forEach((line, index) => {
    if (!line) return;
    const d = distanceToSegment(point, line);
    if (d <= bestDistance) {
      bestDistance = d;
      best = index;
    }
  });
  return best;
}

/** Angle of a scan on the fundus, degrees counter-clockwise from the x axis as seen on screen, in [0, 180). */
export function scanAngleDeg(line: ScanLine): number {
  const deg = (Math.atan2(-(line.endYMm - line.startYMm), line.endXMm - line.startXMm) * 180) / Math.PI;
  const wrapped = ((deg % 180) + 180) % 180;
  return Math.abs(wrapped - 180) < 1e-9 ? 0 : wrapped;
}

/** Next scan index for a navigation key, or null when the key does not navigate. */
export function navigate(key: string, index: number, total: number): number | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return (index + 1) % total;
    case 'ArrowLeft':
    case 'ArrowDown':
      return (index - 1 + total) % total;
    case 'Home':
      return 0;
    case 'End':
      return total - 1;
    default:
      return null;
  }
}

/** Where the radial scans cross: mean of their midpoints, as the engine computes it. */
export function patternCentre(lines: readonly (ScanLine | undefined)[]): Point | null {
  let x = 0;
  let y = 0;
  let n = 0;
  for (const line of lines) {
    if (!line) continue;
    x += (line.startXMm + line.endXMm) / 2;
    y += (line.startYMm + line.endYMm) / 2;
    n++;
  }
  return n > 0 ? { x: x / n, y: y / n } : null;
}

export function toEllipse(bmo: BmoEllipse): Ellipse {
  return { cx: bmo.centerXMm, cy: bmo.centerYMm, a: bmo.semiMajorMm, b: bmo.semiMinorMm, angle: (bmo.angleDeg * Math.PI) / 180 };
}

export interface RingPlacement {
  ellipse: Ellipse;
  /**
   * `reference-shape`: the reference exam's shape at the centre found today, as the engine
   * placed the rings (spec 01, 6.4). `this-exam-only`: the engine used the reference shape
   * but the reference exam is not at hand, so today's ellipse is drawn instead.
   */
  source: 'this-exam' | 'reference-shape' | 'this-exam-only';
}

/** The ellipse the rings were measured with, or null when the exam was not measured. */
export function ringPlacement(exam: Pick<ExamSummary, 'bmo' | 'bmoSource'>, baseline?: Pick<ExamSummary, 'bmo'> | null): RingPlacement | null {
  if (!exam.bmo) return null;
  const today = toEllipse(exam.bmo);
  if (exam.bmoSource !== 'reference-shape') return { ellipse: today, source: 'this-exam' };
  if (!baseline?.bmo) return { ellipse: today, source: 'this-exam-only' };
  const shape = toEllipse(baseline.bmo);
  return { ellipse: { ...shape, cx: today.cx, cy: today.cy }, source: 'reference-shape' };
}

/** Distance of every column of a scan to the ellipse, µm (negative inside). */
export function columnDistancesUm(line: ScanLine, sizeX: number, ellipse: Ellipse): Float64Array {
  const out = new Float64Array(sizeX);
  for (let j = 0; j < sizeX; j++) {
    const p = columnToFundusMm(line, sizeX, j);
    out[j] = ellipseSignedDistance(ellipse, p.x, p.y) * 1000;
  }
  return out;
}

/** Ring (0 to 3) of a distance to the opening, or −1 inside the opening or beyond the last ring. */
export function ringOf(distanceUm: number): number {
  for (let r = 0; r < RINGS_UM.length; r++) if (distanceUm >= RINGS_UM[r]![0] && distanceUm < RINGS_UM[r]![1]) return r;
  return -1;
}

/** Columns where the distance to the opening crosses a ring limit (250, 500, 1000, 1500 µm). */
export function ringLimitColumns(distancesUm: Float64Array): { column: number; limitUm: number }[] {
  const out: { column: number; limitUm: number }[] = [];
  for (let j = 1; j < distancesUm.length; j++) {
    const a = distancesUm[j - 1]!;
    const b = distancesUm[j]!;
    for (const [, outer] of RINGS_UM) {
      if ((a - outer) * (b - outer) <= 0 && a !== b) out.push({ column: Math.abs(a - outer) < Math.abs(b - outer) ? j - 1 : j, limitUm: outer });
    }
  }
  return out;
}

/** Per-column state of a measure's selection: 0 outside, 1 in the zone but not used, 2 used. */
export type ColumnMask = Uint8Array;

export interface Contribution {
  /** One mask per scan (same order as the scans). */
  masks: ColumnMask[];
  /** Columns that entered the average. */
  columns: number;
  /** Columns in the zone that could not be used (no boundary, or unusable scan). */
  missing: number;
  /** Scans with at least one column in the average. */
  scans: number;
  /** Mean recomputed from those columns with the engine's definition; NaN if none. */
  valueUm: number;
}

export interface MeasureInputs {
  scans: readonly ScanAnalysis[];
  lines: readonly ScanLine[];
  sizeX: number;
  scaleZUm: number;
  ellipse: Ellipse;
  centre: Point;
}

/**
 * Columns behind the thickness of one ring, and the area-weighted mean they give: every
 * column of a usable scan with both boundaries whose distance to the ellipse falls in the
 * ring, weighted by its distance to the pattern centre (spec 01, 6.5; core NOTES, change 2).
 */
export function ringContribution(input: MeasureInputs, ring: number): Contribution {
  const [inner, outer] = RINGS_UM[ring]!;
  let sumW = 0;
  let sumT = 0;
  let columns = 0;
  let missing = 0;
  let scans = 0;
  const masks = input.scans.map((scan, k) => {
    const line = input.lines[k]!;
    const d = columnDistancesUm(line, input.sizeX, input.ellipse);
    const mask = new Uint8Array(input.sizeX);
    let used = 0;
    for (let j = 0; j < input.sizeX; j++) {
      if (!(d[j]! >= inner && d[j]! < outer)) continue;
      const ilm = scan.ilmPx[j]!;
      const bm = scan.bmPx[j]!;
      if (!scan.usable || Number.isNaN(ilm) || Number.isNaN(bm)) {
        mask[j] = 1;
        missing++;
        continue;
      }
      mask[j] = 2;
      used++;
      const p = columnToFundusMm(line, input.sizeX, j);
      const w = Math.hypot(p.x - input.centre.x, p.y - input.centre.y) * 1000;
      sumW += w;
      sumT += w * (bm - ilm) * input.scaleZUm;
    }
    columns += used;
    if (used > 0) scans++;
    return mask;
  });
  return { masks, columns, missing, scans, valueUm: sumW > 0 ? sumT / sumW : Number.NaN };
}

/** Zone of the roughness measure: 300 to 1700 µm from the opening (spec 01, 6.5; core engine). */
export const ROUGHNESS_ZONE_UM: readonly [number, number] = [300, 1700];

/** Columns of usable scans where Bruch's membrane entered the roughness measure. */
export function roughnessContribution(input: MeasureInputs): Omit<Contribution, 'valueUm'> {
  const [from, to] = ROUGHNESS_ZONE_UM;
  let columns = 0;
  let missing = 0;
  let scans = 0;
  const masks = input.scans.map((scan, k) => {
    const d = columnDistancesUm(input.lines[k]!, input.sizeX, input.ellipse);
    const mask = new Uint8Array(input.sizeX);
    let used = 0;
    for (let j = 0; j < input.sizeX; j++) {
      if (d[j]! < from || d[j]! > to) continue;
      if (!scan.usable || Number.isNaN(scan.bmPx[j]!)) {
        mask[j] = 1;
        missing++;
      } else {
        mask[j] = 2;
        used++;
      }
    }
    columns += used;
    if (used > 0) scans++;
    return mask;
  });
  return { masks, columns, missing, scans };
}

/** Points of the curve at `distanceUm` outside the ellipse (a ring limit on the fundus), fundus mm. */
export function ellipseOffset(ellipse: Ellipse, distanceUm: number, count = 180): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < count; i++) {
    const f = ellipseFrame(ellipse, (2 * Math.PI * i) / count);
    out.push({ x: f.x + (f.nx * distanceUm) / 1000, y: f.y + (f.ny * distanceUm) / 1000 });
  }
  return out;
}

/** Total retinal thickness along a scan, µm per column (NaN where a boundary is missing). */
export function thicknessProfileUm(scan: Pick<ScanAnalysis, 'ilmPx' | 'bmPx'>, scaleZUm: number): Float64Array {
  const out = new Float64Array(scan.ilmPx.length);
  for (let j = 0; j < out.length; j++) out[j] = (scan.bmPx[j]! - scan.ilmPx[j]!) * scaleZUm;
  return out;
}

/** Side of the square of fundus the ocular shows, mm: it holds the whole scan pattern and the 1500 µm ring. */
export const OCULAR_WINDOW_MM = 5.4;

/** A square window of the fundus image, fundus mm. */
export interface FundusWindow {
  x0: number;
  y0: number;
  side: number;
}

/** The window of the ocular: centred on the scan pattern, kept inside the image. */
export function ocularWindow(fieldXMm: number, fieldYMm: number, centre: Point, sideMm: number = OCULAR_WINDOW_MM): FundusWindow {
  const side = Math.min(sideMm, fieldXMm, fieldYMm);
  return {
    x0: Math.min(Math.max(centre.x - side / 2, 0), fieldXMm - side),
    y0: Math.min(Math.max(centre.y - side / 2, 0), fieldYMm - side),
    side,
  };
}

/** Fundus mm → the 0 to 100 units of a drawing laid over a window. */
export function toWindowUnits(window: FundusWindow, point: Point): Point {
  return { x: ((point.x - window.x0) / window.side) * 100, y: ((point.y - window.y0) / window.side) * 100 };
}

/** A closed curve of fundus points as the `d` of an SVG path, in window units. */
export function windowPath(window: FundusWindow, points: readonly Point[]): string {
  const round = (value: number): number => Math.round(value * 100) / 100;
  return `${points
    .map((point, index) => {
      const p = toWindowUnits(window, point);
      return `${index === 0 ? 'M' : 'L'}${round(p.x)} ${round(p.y)}`;
    })
    .join('')}Z`;
}

/** The lowest point on screen of a curve of fundus points (largest y): where the guide to the figure starts. */
export function lowestPoint(points: readonly Point[]): Point | null {
  let lowest: Point | null = null;
  for (const point of points) if (!lowest || point.y > lowest.y) lowest = point;
  return lowest;
}
