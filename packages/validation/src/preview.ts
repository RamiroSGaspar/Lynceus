/**
 * `pnpm --filter @app/validation preview`: writes inspection images to `.tmp/preview/`
 * (spec 01, section 9). Looking at them is part of the work: they have to look like
 * optic nerve OCT scans. Every image carries the simulated-data mark.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toDisplayGray, type CaptureConditions, type CaptureRequest, type ExamSource, type ScanAnalysis } from '@app/core';
import { acquire } from '@app/core/instrument/acquire';
import { CREW_IDS } from '@app/core/eye/crew';
import { ellipseFrame } from '@app/core/math/ellipse';
import { RINGS_UM, SCALE_X_MM, SCAN_COLUMNS, SCAN_ROWS, SLO_SIZE_PX, SLO_SCALE_MM } from '@app/core/constants';
import { Canvas, COLORS } from './draw';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const OUT = join(ROOT, '.tmp', 'preview');

function write(name: string, canvas: Canvas): void {
  writeFileSync(join(OUT, name), canvas.png());
}

function scanCanvas(exam: ExamSource, k: number): Canvas {
  return Canvas.fromGray(toDisplayGray(exam.bscan(k).pixels), SCAN_COLUMNS, SCAN_ROWS);
}

/** Overlay of what the engine marked: ILM, BM, opening points and ring limits. */
function overlay(canvas: Canvas, exam: ExamSource, scan: ScanAnalysis, ellipse: { cx: number; cy: number; a: number; b: number; angle: number } | null): void {
  canvas.curve(scan.ilmPx, COLORS.ilm);
  canvas.curve(scan.bmPx, COLORS.bm);
  for (const p of scan.bmo) if (p) canvas.dot(p.columnPx, p.rowPx, 3, COLORS.bmo);
  if (!ellipse) return;
  // Ring limits: columns whose distance to the ellipse crosses 250, 500, 1000 and 1500 µm.
  const h = exam.bscan(scan.index).header;
  let prev = NaN;
  for (let j = 0; j < SCAN_COLUMNS; j++) {
    const t = j / (SCAN_COLUMNS - 1);
    const x = h.startXMm + t * (h.endXMm - h.startXMm);
    const y = h.startYMm + t * (h.endYMm - h.startYMm);
    const d = distanceToEllipseUm(ellipse, x, y);
    for (const [, outer] of RINGS_UM) {
      if (!Number.isNaN(prev) && (prev - outer) * (d - outer) <= 0) canvas.line(j, 0, j, SCAN_ROWS - 1, COLORS.ring, 0.35);
    }
    prev = d;
  }
}

function distanceToEllipseUm(e: { cx: number; cy: number; a: number; b: number; angle: number }, x: number, y: number): number {
  // Radial approximation, enough to draw ring limits.
  const dx = x - e.cx;
  const dy = y - e.cy;
  const r = Math.hypot(dx, dy);
  const t = Math.atan2(dy, dx) - e.angle;
  const c = Math.cos(t) / e.a;
  const s = Math.sin(t) / e.b;
  return (r - 1 / Math.sqrt(c * c + s * s)) * 1000;
}

function fundusCanvas(exam: ExamSource, withScans: boolean, ellipse: { cx: number; cy: number; a: number; b: number; angle: number } | null): Canvas {
  const c = Canvas.fromGray(exam.slo, SLO_SIZE_PX, SLO_SIZE_PX);
  if (withScans) {
    for (let k = 0; k < exam.header.numBScans; k++) {
      const h = exam.bscan(k).header;
      c.line(h.startXMm / SLO_SCALE_MM - 0.5, h.startYMm / SLO_SCALE_MM - 0.5, h.endXMm / SLO_SCALE_MM - 0.5, h.endYMm / SLO_SCALE_MM - 0.5, COLORS.scan, 0.5);
    }
  }
  if (ellipse) {
    for (let i = 0; i < 720; i++) {
      const p = ellipseFrame(ellipse, (2 * Math.PI * i) / 720);
      c.dot(p.x / SLO_SCALE_MM - 0.5, p.y / SLO_SCALE_MM - 0.5, 1, COLORS.ellipse);
    }
  }
  return c;
}

// The engine arrives in step 4 of the specification; until then nothing is marked.
function engineEllipse(_exam: ExamSource): { ellipse: { cx: number; cy: number; a: number; b: number; angle: number } | null; scans: (ScanAnalysis | undefined)[] } {
  return { ellipse: null, scans: [] };
}

function main(): void {
  mkdirSync(OUT, { recursive: true });
  const t0 = performance.now();
  // 1. Each crew member, right eye, days 0 and 150: scans 0, 12 and 24, clean and marked.
  for (const crewId of CREW_IDS) {
    for (const flightDay of [0, 150]) {
      const request: CaptureRequest = { crewId, eye: 'OD', flightDay, attempt: 1 };
      const exam = acquire(request);
      const { ellipse, scans } = engineEllipse(exam);
      for (const k of [0, 12, 24]) {
        write(`scan_${crewId}_OD_d${flightDay}_k${k}.png`, scanCanvas(exam, k));
        const scan = scans[k];
        if (!scan) continue;
        const marked = scanCanvas(exam, k);
        overlay(marked, exam, scan, ellipse);
        write(`scan_${crewId}_OD_d${flightDay}_k${k}_marked.png`, marked);
      }
      if (flightDay === 0) {
        // 2. Fundus of each eye, alone and with the 48 scans and the ellipse.
        for (const eye of ['OD', 'OS'] as const) {
          const e = eye === 'OD' ? exam : acquire({ crewId, eye, flightDay: 0, attempt: 1 });
          const el = eye === 'OD' ? ellipse : engineEllipse(e).ellipse;
          write(`fundus_${crewId}_${eye}.png`, fundusCanvas(e, false, null));
          write(`fundus_${crewId}_${eye}_scans.png`, fundusCanvas(e, true, el));
        }
      }
      console.log(`${crewId} OD day ${flightDay} done (${((performance.now() - t0) / 1000).toFixed(1)} s)`);
    }
  }
  // 3. One image per capture failure (strong), on B OD day 30, scan 12.
  const failures: [string, CaptureConditions][] = [
    ['signal-loss', { signalLossDb: 18 }],
    ['blink', { blink: { startFraction: 0.4, widthFraction: 0.35 } }],
    ['truncation', { truncationPx: 60 }],
    ['decentration', { decentrationMm: { x: 0.6, y: 0.2 } }],
    ['motion', { motion: 0.9 }],
    ['edge-fade', { edgeFade: { side: 'end', widthFraction: 0.45 } }],
  ];
  for (const [name, conditions] of failures) {
    const exam = acquire({ crewId: 'B', eye: 'OD', flightDay: 30, attempt: 1, conditions });
    write(`failure_${name}.png`, scanCanvas(exam, 12));
    if (name === 'decentration') write(`failure_${name}_fundus.png`, fundusCanvas(exam, true, null));
  }
  // 4. Crew member D on day 120 next to the reference exam.
  const pre = acquire({ crewId: 'D', eye: 'OD', flightDay: 0, attempt: 1 });
  const d120 = acquire({ crewId: 'D', eye: 'OD', flightDay: 120, attempt: 1 });
  const pair = new Canvas(2 * SCAN_COLUMNS + 8, SCAN_ROWS);
  pair.blit(scanCanvas(pre, 0), 0, 0);
  pair.blit(scanCanvas(d120, 0), SCAN_COLUMNS + 8, 0);
  pair.text('PRE', 8, 8, 2);
  pair.text('FD120', SCAN_COLUMNS + 16, 8, 2);
  write('compare_D_OD_pre_vs_d120.png', pair);
  console.log(`Wrote ${OUT} in ${((performance.now() - t0) / 1000).toFixed(1)} s (scale ${SCALE_X_MM} mm/px).`);
}

main();
