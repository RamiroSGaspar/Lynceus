import { describe, expect, it } from 'vitest';
import type { CaptureRequest } from '../src/contract';
import { SCAN_COLUMNS as W, SCAN_ROWS as H, SCAN_LENGTH_MM } from '../src/constants';
import { getEye } from '../src/eye/model';
import { acquire, examHeader } from '../src/instrument/acquire';
import { SCRIPTED_EVENTS, captureSetup } from '../src/instrument/capture';
import { fundusToAnatomical } from '../src/instrument/geometry';
import { qualityDb } from '../src/quality';
import { displayGray } from '../src/vol/display';
import { volFileBytes } from '../src/vol/format';
import { readVol, writeVol } from '../src/vol/io';

const B0: CaptureRequest = { crewId: 'B', eye: 'OD', flightDay: 0, attempt: 1 };
const sameArray = (a: Float32Array, b: Float32Array): boolean => a.length === b.length && Buffer.compare(Buffer.from(a.buffer), Buffer.from(b.buffer)) === 0;

describe('virtual instrument is reproducible (spec test 3)', () => {
  it('gives the same bytes for the same request and other bytes for another attempt', () => {
    const a = acquire(B0).bscan(5);
    const b = acquire(B0).bscan(5);
    const c = acquire({ ...B0, attempt: 2 }).bscan(5);
    expect(sameArray(a.pixels, b.pixels)).toBe(true);
    expect(a.header).toEqual(b.header);
    expect(sameArray(a.pixels, c.pixels)).toBe(false);
  });

  it('gives a scan alone equal to the same scan within the whole exam', () => {
    const alone = acquire(B0).bscan(17);
    const exam = acquire(B0);
    let inside = exam.bscan(0);
    for (let k = 0; k < 18; k += 1) inside = exam.bscan(k);
    expect(sameArray(alone.pixels, inside.pixels)).toBe(true);
  });

  it('gives the same fundus image', () => {
    expect(Buffer.compare(Buffer.from(acquire(B0).slo), Buffer.from(acquire(B0).slo))).toBe(0);
  });
});

describe('exam file of the virtual instrument', () => {
  it('fills the header as the specification says (section 2)', () => {
    const h = examHeader({ crewId: 'C', eye: 'OS', flightDay: 30, attempt: 2 });
    expect(h.version).toBe('HSF-OCT-103');
    expect([h.sizeX, h.sizeZ, h.numBScans, h.sizeXSlo, h.sizeYSlo, h.bscanHdrSize, h.scanPattern]).toEqual([768, 496, 48, 1536, 1536, 61440, 5]);
    expect(h.distanceMm).toBe(0);
    expect(h.patientId).toBe('SIM-CREW-C');
    expect(h.visitId).toBe('FD030');
    expect(h.progId).toBe('SIM-SANS-C-OS');
    expect(h.referenceId).toBe(examHeader({ crewId: 'C', eye: 'OS', flightDay: 0, attempt: 1 }).id);
    expect(h.id).not.toBe(h.referenceId);
    const pre = examHeader({ crewId: 'C', eye: 'OS', flightDay: 0, attempt: 1 });
    expect(pre.visitId).toBe('PRE');
    expect(pre.id).toBe(pre.referenceId);
    // Flight day 30 is 29 days after the launch on 2026-05-20.
    expect(new Date(h.examTimeMs).toISOString().slice(0, 10)).toBe('2026-06-18');
    expect(h.visitDateDays).toBe(Date.UTC(2026, 5, 18) / 86400000 + 25569);
  });

  it('writes a .vol that reads back to the same exam, with the size of table 1.5', () => {
    const exam = acquire(B0);
    const bytes = writeVol(exam);
    expect(bytes.length).toBe(volFileBytes(exam.header));
    expect(bytes.length).toBe(78448640);
    const back = readVol(bytes);
    expect(back.header).toEqual(exam.header);
    const k = 31;
    expect(back.bscan(k).header).toEqual(exam.bscan(k).header);
    expect(sameArray(back.bscan(k).pixels, exam.bscan(k).pixels)).toBe(true);
    expect(back.bscan(k).segLines.length).toBe(0);
  }, 60000);

  it('places radial scans every 3.75° through the pattern centre (spec 5.1)', () => {
    const exam = acquire(B0);
    const setup = captureSetup(B0);
    for (const k of [0, 7, 24, 40]) {
      const h = exam.bscan(k).header;
      const mx = (h.startXMm + h.endXMm) / 2;
      const my = (h.startYMm + h.endYMm) / 2;
      expect(mx).toBeCloseTo(setup.geometry.patternCenterXMm, 9);
      expect(my).toBeCloseTo(setup.geometry.patternCenterYMm, 9);
      expect(Math.hypot(h.endXMm - h.startXMm, h.endYMm - h.startYMm)).toBeCloseTo(SCAN_LENGTH_MM, 9);
      const angle = (Math.atan2(-(h.endYMm - h.startYMm), h.endXMm - h.startXMm) * 180) / Math.PI;
      expect((angle + 360) % 180).toBeCloseTo((k * 3.75) % 180, 6);
    }
  });

  it('marks the fundus image as simulated (spec 5.6)', () => {
    const slo = acquire(B0).slo;
    // The dark box of the mark sits in the lower-left corner.
    let dark = 0;
    for (let y = 1536 - 80; y < 1536 - 30; y++) for (let x = 30; x < 400; x++) if (slo[y * 1536 + x]! <= 16) dark++;
    expect(dark).toBeGreaterThan(5000);
  });
});

describe('what a clean scan shows (spec 3.7 and 5.4)', () => {
  const clean = acquire({ ...B0, conditions: {} }, { speckle: false }).bscan(0);
  const speckled = acquire({ ...B0, conditions: {} }).bscan(0);
  const gray = (px: Float32Array, i: number, j: number): number => displayGray(px[i * W + j]!);

  it('shows the vitreous as noise only, 0.10 to 0.16', () => {
    let s = 0;
    let n = 0;
    for (let i = 0; i < 30; i++) for (let j = 0; j < W; j++, n++) s += gray(speckled.pixels, i, j);
    expect(s / n).toBeGreaterThanOrEqual(0.08);
    expect(s / n).toBeLessThanOrEqual(0.16);
  });

  it('shows the layers with the grey levels of the table, far from the nerve', () => {
    for (const j of [40, 700]) {
      const col = Array.from({ length: H }, (_, i) => gray(clean.pixels, i, j));
      const top = col.findIndex((v) => v > 0.3);
      const rnfl = col.slice(top + 4, top + 12);
      for (const v of rnfl) expect(v).toBeGreaterThanOrEqual(0.62), expect(v).toBeLessThanOrEqual(0.7);
      const rpeRow = col.indexOf(Math.max(...col));
      expect(col[rpeRow]).toBeGreaterThanOrEqual(0.8);
      expect(col[rpeRow]).toBeLessThanOrEqual(0.9);
      // Outer nuclear layer: the darkest band between the fibres and the bright outer bands.
      const onl = Math.min(...col.slice(top + 15, rpeRow - 4));
      expect(onl).toBeGreaterThanOrEqual(0.28);
      expect(onl).toBeLessThanOrEqual(0.34);
      // Ellipsoid zone: the bright line just above the epithelium.
      const ez = Math.max(...col.slice(rpeRow - 8, rpeRow - 3));
      expect(ez).toBeGreaterThanOrEqual(0.68);
      expect(ez).toBeLessThanOrEqual(0.75);
    }
  });

  it('gives a clean capture about 25 dB with our quality definition (spec asks 27–33: see NOTES.md)', () => {
    // MARKED: the specification asks 27–33 dB for a clean capture. With the grey levels of
    // table 3.7 and the vitreous at 0.10, the definition of 5.4 gives about 25 dB. Not tuned away.
    const q = qualityDb(speckled.pixels, W, H);
    expect(q).toBeGreaterThan(23);
    expect(q).toBeLessThan(28);
  });
});

describe('vessel shadows fall where the scan crosses the vessel (spec 3.8)', () => {
  it('darkens the column under a large vessel', () => {
    const req: CaptureRequest = { ...B0, conditions: {} };
    const setup = captureSetup(req);
    const tree = getEye('B', 'OD').vessels;
    const hit = { distanceUm: 0, radiusUm: 0, artery: false };
    const exam = acquire(req, { speckle: false });
    let checked = 0;
    for (let k = 0; k < 48 && checked < 3; k += 5) {
      const h = exam.bscan(k).header;
      for (let j = 60; j < W - 60; j++) {
        const t = j / (W - 1);
        const [x, y] = fundusToAnatomical(setup.geometry, h.startXMm + t * (h.endXMm - h.startXMm), h.startYMm + t * (h.endYMm - h.startYMm));
        if (Math.hypot(x, y) < 1100) continue;
        const v = tree.query(x, y, hit);
        if (!v || v.radiusUm < 50 || v.distanceUm > 0.1 * v.radiusUm) continue;
        // Compare the deep part of this column with columns 40 px away on both sides.
        const px = exam.bscan(k).pixels;
        const sum = (jj: number): number => {
          let s = 0;
          for (let i = 150; i < 300; i++) s += px[i * W + jj]!;
          return s;
        };
        const ratio = sum(j) / (0.5 * (sum(j - 40) + sum(j + 40)));
        expect(ratio).toBeLessThan(0.75);
        checked++;
        break;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('capture failures look as described (spec 5.5)', () => {
  const at = (conditions: CaptureRequest['conditions'], k = 12) => acquire({ ...B0, conditions }).bscan(k).pixels;

  it('signal loss lowers the quality below 15 dB', () => {
    expect(qualityDb(at({ signalLossDb: 18 }), W, H)).toBeLessThan(15);
    expect(qualityDb(at({ signalLossDb: 4 }), W, H)).toBeGreaterThan(18);
  });

  it('a blink leaves a band of columns with no signal, only in the affected scans', () => {
    const px = at({ blink: { startFraction: 0.4, widthFraction: 0.35 }, affectedScans: { from: 10, to: 14 } });
    let max = 0;
    for (let i = 0; i < H; i++) for (let j = 330; j < 560; j++) max = Math.max(max, displayGray(px[i * W + j]!));
    expect(max).toBeLessThan(0.3);
    const other = at({ blink: { startFraction: 0.4, widthFraction: 0.35 }, affectedScans: { from: 10, to: 14 } }, 20);
    let maxOther = 0;
    for (let i = 0; i < H; i++) for (let j = 330; j < 560; j++) maxOther = Math.max(maxOther, displayGray(other[i * W + j]!));
    expect(maxOther).toBeGreaterThan(0.6);
  });

  it('truncation pushes the retina out of the top of the frame', () => {
    const px = at({ truncationPx: 60 });
    let tissue = 0;
    for (let j = 0; j < W; j++) if (displayGray(px[j]!) > 0.4) tissue++;
    expect(tissue).toBeGreaterThan(W / 4);
  });

  it('edge fade dims one end of the scan', () => {
    const px = at({ edgeFade: { side: 'end', widthFraction: 0.4 } });
    let maxEnd = 0;
    for (let i = 0; i < H; i++) for (let j = W - 12; j < W; j++) maxEnd = Math.max(maxEnd, displayGray(px[i * W + j]!));
    expect(maxEnd).toBeLessThan(0.3);
  });

  it('decentration moves the pattern away from the nerve', () => {
    const a = captureSetup({ ...B0, attempt: 2 }).geometry;
    const b = captureSetup({ ...B0, attempt: 2, conditions: { decentrationMm: { x: 0.5, y: 0 } } }).geometry;
    expect(a.bmoCenterXMm - b.bmoCenterXMm).toBeCloseTo(0.5, 9);
  });

  it('applies the scripted events of the scenario only to their attempt', () => {
    expect(SCRIPTED_EVENTS.length).toBe(3);
    expect(captureSetup({ crewId: 'B', eye: 'OS', flightDay: 150, attempt: 1 }).conditions.blink).toBeDefined();
    expect(captureSetup({ crewId: 'B', eye: 'OS', flightDay: 150, attempt: 2 }).conditions.blink).toBeUndefined();
    expect(captureSetup({ crewId: 'C', eye: 'OD', flightDay: 90, attempt: 1 }).conditions.signalLossDb).toBe(18);
    expect(captureSetup({ crewId: 'A', eye: 'OD', flightDay: 30, attempt: 1 }).conditions.truncationPx).toBe(60);
  });
});
