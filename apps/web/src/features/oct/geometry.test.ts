import { describe, expect, it } from 'vitest';
import { RADIAL_SCANS, SCALE_Z_UM, SCAN_COLUMNS, SCAN_ROWS, SLO_SCALE_MM, type ScanAnalysis } from '@app/core';
import { radialScanEndpoints } from '@app/core/instrument/geometry';
import { ellipseSignedDistance, type Ellipse } from '@app/core/math/ellipse';
import {
  canvasToScan,
  columnDistancesUm,
  columnToFundusMm,
  ellipseOffset,
  fundusMmToPx,
  fundusPxToMm,
  lowestPoint,
  navigate,
  nearestScan,
  ocularWindow,
  patternCentre,
  ringContribution,
  ringLimitColumns,
  ringOf,
  ringPlacement,
  scanAngleDeg,
  scanToCanvas,
  thicknessProfileUm,
  toWindowUnits,
  windowPath,
} from './geometry';

const CENTRE = { x: 4.4, y: 4.3 };
const LINES = Array.from({ length: RADIAL_SCANS }, (_, k) => radialScanEndpoints(CENTRE.x, CENTRE.y, k));

describe('coordinates between the scan, the screen and the fundus image', () => {
  it('puts the first and last columns on the header start and end points', () => {
    const line = LINES[7]!;
    expect(columnToFundusMm(line, SCAN_COLUMNS, 0)).toEqual({ x: line.startXMm, y: line.startYMm });
    const last = columnToFundusMm(line, SCAN_COLUMNS, SCAN_COLUMNS - 1);
    expect(last.x).toBeCloseTo(line.endXMm, 12);
    expect(last.y).toBeCloseTo(line.endYMm, 12);
    const mid = columnToFundusMm(line, SCAN_COLUMNS, (SCAN_COLUMNS - 1) / 2);
    expect(mid.x).toBeCloseTo(CENTRE.x, 12);
    expect(mid.y).toBeCloseTo(CENTRE.y, 12);
  });

  it('goes from a scan pixel to the canvas and back', () => {
    for (const [w, h] of [
      [768, 496],
      [512.5, 330.8],
      [300, 194],
    ] as const) {
      const p = scanToCanvas(100.25, 61.5, SCAN_COLUMNS, SCAN_ROWS, w, h);
      const back = canvasToScan(p.x, p.y, SCAN_COLUMNS, SCAN_ROWS, w, h);
      expect(back.column).toBeCloseTo(100.25, 9);
      expect(back.row).toBeCloseTo(61.5, 9);
    }
    // At its own size, pixel centres fall on half-pixels.
    expect(scanToCanvas(0, 0, SCAN_COLUMNS, SCAN_ROWS, SCAN_COLUMNS, SCAN_ROWS)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('goes from fundus millimetres to fundus pixels and back', () => {
    const px = fundusMmToPx({ x: 4.4, y: 4.3 }, SLO_SCALE_MM, SLO_SCALE_MM);
    expect(px.x).toBeCloseTo(4.4 / 0.0057, 9);
    const mm = fundusPxToMm(px, SLO_SCALE_MM, SLO_SCALE_MM);
    expect(mm.x).toBeCloseTo(4.4, 12);
    expect(mm.y).toBeCloseTo(4.3, 12);
  });

  it('finds the radius under a tap on the fundus image', () => {
    // A point 1.5 mm from the centre along scan k is closest to scan k.
    for (const k of [0, 5, 12, 24, 40, 47]) {
      const line = LINES[k]!;
      const p = columnToFundusMm(line, SCAN_COLUMNS, 650);
      expect(nearestScan(LINES, { x: p.x + 0.001, y: p.y - 0.001 }, 0.25)).toBe(k);
    }
    expect(nearestScan(LINES, { x: 0, y: 0 }, 0.25)).toBeNull();
    // Scans not taken yet cannot be picked.
    const partial = LINES.map((line, k) => (k === 12 ? undefined : line));
    expect(nearestScan(partial, columnToFundusMm(LINES[12]!, SCAN_COLUMNS, 700), 0.05)).toBeNull();
  });

  it('finds the pattern centre from the scan headers', () => {
    const c = patternCentre(LINES)!;
    expect(c.x).toBeCloseTo(CENTRE.x, 12);
    expect(c.y).toBeCloseTo(CENTRE.y, 12);
    expect(patternCentre([undefined])).toBeNull();
  });

  it('gives each scan its angle and steps through scans with the keys', () => {
    expect(scanAngleDeg(LINES[0]!)).toBeCloseTo(0, 9);
    expect(scanAngleDeg(LINES[12]!)).toBeCloseTo(45, 9);
    expect(scanAngleDeg(LINES[24]!)).toBeCloseTo(90, 9);
    expect(scanAngleDeg(LINES[47]!)).toBeCloseTo(176.25, 9);
    expect(navigate('ArrowRight', 0, 48)).toBe(1);
    expect(navigate('ArrowRight', 47, 48)).toBe(0);
    expect(navigate('ArrowLeft', 0, 48)).toBe(47);
    expect(navigate('Home', 30, 48)).toBe(0);
    expect(navigate('End', 3, 48)).toBe(47);
    expect(navigate('a', 3, 48)).toBeNull();
  });
});

describe('rings and where a number comes from', () => {
  const ellipse: Ellipse = { cx: CENTRE.x, cy: CENTRE.y, a: 0.9, b: 0.8, angle: 0.3 };

  it('places the rings with the reference shape at today’s centre when the engine did', () => {
    const today = { centerXMm: 4.5, centerYMm: 4.2, semiMajorMm: 0.85, semiMinorMm: 0.75, angleDeg: 10, areaMm2: 2, fitRmsUm: 5, pointsUsed: 96, pointsRejected: 0 };
    const ref = { ...today, centerXMm: 4.1, centerYMm: 4.0, semiMajorMm: 0.9, semiMinorMm: 0.8, angleDeg: 20 };
    expect(ringPlacement({ bmo: today, bmoSource: 'this-exam' })).toEqual({ ellipse: { cx: 4.5, cy: 4.2, a: 0.85, b: 0.75, angle: (10 * Math.PI) / 180 }, source: 'this-exam' });
    expect(ringPlacement({ bmo: today, bmoSource: 'reference-shape' }, { bmo: ref })).toEqual({ ellipse: { cx: 4.5, cy: 4.2, a: 0.9, b: 0.8, angle: (20 * Math.PI) / 180 }, source: 'reference-shape' });
    expect(ringPlacement({ bmo: today, bmoSource: 'reference-shape' })?.source).toBe('this-exam-only');
    expect(ringPlacement({ bmo: null, bmoSource: 'this-exam' })).toBeNull();
  });

  it('assigns distances to rings and finds the ring limits along a scan', () => {
    expect([-1, 0, 249.9, 250, 499, 500, 999, 1000, 1499, 1500].map(ringOf)).toEqual([-1, 0, 0, 1, 1, 2, 2, 3, 3, -1]);
    // A small opening, so that the 1500 µm limit still falls inside the 4.37 mm scan.
    const d = columnDistancesUm(LINES[3]!, SCAN_COLUMNS, { ...ellipse, a: 0.62, b: 0.55 });
    const limits = ringLimitColumns(d);
    // Each limit is crossed once on each side of the opening.
    expect(limits.map((l) => l.limitUm).sort((a, b) => a - b)).toEqual([250, 250, 500, 500, 1000, 1000, 1500, 1500]);
    for (const { column, limitUm } of limits) expect(Math.abs(d[column]! - limitUm)).toBeLessThan(6);
  });

  it('draws ring limits at the right distance from the ellipse on the fundus', () => {
    for (const p of ellipseOffset(ellipse, 500, 36)) expect(ellipseSignedDistance(ellipse, p.x, p.y) * 1000).toBeCloseTo(500, 6);
  });

  function scans(thickness: (k: number, j: number) => number, usable: (k: number) => boolean = () => true): ScanAnalysis[] {
    return LINES.map((line, k) => {
      const d = columnDistancesUm(line, SCAN_COLUMNS, ellipse);
      const ilm = new Float32Array(SCAN_COLUMNS).fill(60);
      const bm = new Float32Array(SCAN_COLUMNS);
      for (let j = 0; j < SCAN_COLUMNS; j++) bm[j] = d[j]! < 0 ? Number.NaN : 60 + thickness(k, j) / SCALE_Z_UM;
      return { index: k, qualityDb: 25, headerQualityDb: 25, validColumnFraction: 1, usable: usable(k), rejections: [], ilmPx: ilm, bmPx: bm, bmo: [null, null] };
    });
  }

  it('recomputes a ring mean from its columns, weighting by distance to the pattern centre', () => {
    const inputs = { lines: LINES, sizeX: SCAN_COLUMNS, scaleZUm: SCALE_Z_UM, ellipse, centre: CENTRE };
    const flat = ringContribution({ ...inputs, scans: scans(() => 400) }, 0);
    expect(flat.valueUm).toBeCloseTo(400, 3);
    expect(flat.scans).toBe(RADIAL_SCANS);
    expect(flat.missing).toBe(0);
    // Half of each scan at 300 µm and the other half at 500 µm: radial symmetry gives 400.
    const halves = ringContribution({ ...inputs, scans: scans((_, j) => (j < SCAN_COLUMNS / 2 ? 300 : 500)) }, 0);
    expect(halves.valueUm).toBeCloseTo(400, 0);
    // An unusable scan leaves its ring columns out, counted as missing.
    const oneOut = ringContribution({ ...inputs, scans: scans(() => 400, (k) => k !== 5) }, 0);
    expect(oneOut.scans).toBe(RADIAL_SCANS - 1);
    expect(oneOut.columns + oneOut.missing).toBe(flat.columns);
    expect(oneOut.masks[5]!.every((m) => m !== 2)).toBe(true);
    expect(oneOut.masks[6]!.filter((m) => m === 2).length).toBeGreaterThan(0);
  });

  it('gives the thickness profile of a scan in micrometres', () => {
    const p = thicknessProfileUm({ ilmPx: new Float32Array([10, 10, Number.NaN]), bmPx: new Float32Array([110, Number.NaN, 120]) }, SCALE_Z_UM);
    expect(p[0]).toBeCloseTo(387, 6);
    expect(Number.isNaN(p[1]!)).toBe(true);
    expect(Number.isNaN(p[2]!)).toBe(true);
  });
});

describe('ocular window', () => {
  it('centres on the scan pattern and stays inside the image', () => {
    expect(ocularWindow(8.755, 8.755, { x: 4.4, y: 4.3 })).toEqual({ x0: 4.4 - 2.7, y0: 4.3 - 2.7, side: 5.4 });
    const corner = ocularWindow(8.755, 8.755, { x: 0.5, y: 8.5 });
    expect(corner.x0).toBe(0);
    expect(corner.y0).toBeCloseTo(8.755 - 5.4);
    expect(ocularWindow(4, 6, { x: 2, y: 3 }).side).toBe(4);
  });

  it('maps fundus millimetres to the 0–100 units of the drawing over the window', () => {
    const window = { x0: 1, y0: 2, side: 5 };
    expect(toWindowUnits(window, { x: 1, y: 2 })).toEqual({ x: 0, y: 0 });
    expect(toWindowUnits(window, { x: 6, y: 7 })).toEqual({ x: 100, y: 100 });
    expect(toWindowUnits(window, { x: 3.5, y: 4.5 })).toEqual({ x: 50, y: 50 });
    expect(windowPath(window, [{ x: 1, y: 2 }, { x: 6, y: 2 }, { x: 3.5, y: 7 }])).toBe('M0 0L100 0L50 100Z');
  });

  it('finds the lowest point on screen of a ring, where the guide to the figure starts', () => {
    const ring = ellipseOffset({ cx: 4, cy: 4, a: 0.8, b: 0.7, angle: Math.PI / 2 }, 125);
    const lowest = lowestPoint(ring);
    expect(lowest?.x).toBeCloseTo(4, 1);
    expect(lowest?.y).toBeCloseTo(4 + 0.8 + 0.125, 2);
    expect(lowestPoint([])).toBeNull();
  });
});
