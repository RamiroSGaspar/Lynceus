import { describe, expect, it } from 'vitest';
import type { BScan, BScanHeader, ExamSource, VolHeader } from '../src/contract';
import { INVALID_VALUE, VolFormatError, encodeVolHeader, volFileBytes } from '../src/vol/format';
import { readVol, writeVol, writeVolBlocks } from '../src/vol/io';
import { displayGray, toDisplayGray } from '../src/vol/display';

const EXAM_TIME_MS = Date.UTC(2026, 4, 20, 9, 30, 15, 250);

function header(over: Partial<VolHeader> = {}): VolHeader {
  return {
    version: 'HSF-OCT-103',
    sizeX: 16,
    numBScans: 3,
    sizeZ: 8,
    scaleXMm: 0.0057,
    distanceMm: 0,
    scaleZMm: 0.00387,
    sizeXSlo: 6,
    sizeYSlo: 5,
    scaleXSloMm: 0.0057,
    scaleYSloMm: 0.0057,
    fieldSizeSloDeg: 30,
    scanFocusD: -0.41,
    scanPosition: 'OS',
    examTimeMs: EXAM_TIME_MS,
    scanPattern: 5,
    bscanHdrSize: 1024,
    id: '210901',
    referenceId: '210001',
    pid: 1002,
    patientId: 'SIM-CREW-B',
    dobDays: 28883,
    vid: 5090,
    visitId: 'FD090',
    visitDateDays: 46161,
    gridType: 0,
    gridOffset: 0,
    gridType1: 0,
    gridOffset1: 0,
    progId: 'SIM-SANS-B-OS',
    ...over,
  };
}

function bscanHeader(k: number, numSeg: number): BScanHeader {
  return {
    version: 'HSF-BS-103',
    bscanHdrSize: 1024,
    startXMm: 2.2 + k,
    startYMm: 4.4,
    endXMm: 6.6,
    endYMm: 4.4 - k,
    numSeg,
    offSeg: 256,
    qualityDb: Math.fround(28.5 + k),
    shift: 0,
    ivTrafo: [0, 0, 0, 0, 0, 0],
  };
}

function syntheticExam(h: VolHeader, numSeg = 0): ExamSource {
  const slo = new Uint8Array(h.sizeXSlo * h.sizeYSlo).map((_, i) => (i * 37) % 256);
  return {
    header: h,
    slo,
    bscan(k: number): BScan {
      const pixels = new Float32Array(h.sizeX * h.sizeZ).map((_, i) => ((i * 7 + k) % 101) / 1000);
      const segLines = Array.from({ length: numSeg }, (_, s) =>
        new Float32Array(h.sizeX).map((_, x) => (x % 5 === 0 ? INVALID_VALUE : 2.5 + s + x / 8)),
      );
      return { index: k, header: bscanHeader(k, numSeg), segLines, pixels };
    },
  };
}

describe('.vol exam header: every field at its byte (table 1.2)', () => {
  const h = header();
  const bytes = encodeVolHeader(h);
  const dv = new DataView(bytes.buffer);
  const ascii = (o: number, n: number): string => String.fromCharCode(...bytes.subarray(o, o + n)).replace(/\0+$/, '');

  it('is 2048 bytes', () => expect(bytes.length).toBe(2048));
  it('places text fields', () => {
    expect(ascii(0, 12)).toBe('HSF-OCT-103');
    expect(ascii(84, 4)).toBe('OS');
    expect(ascii(104, 16)).toBe('210901');
    expect(ascii(120, 16)).toBe('210001');
    expect(ascii(140, 24)).toBe('SIM-CREW-B');
    expect(ascii(176, 24)).toBe('FD090');
    expect(ascii(224, 34)).toBe('SIM-SANS-B-OS');
    // Text is padded with zeros up to the field length.
    expect(bytes[104 + 6]).toBe(0);
    expect(bytes[257]).toBe(0);
  });
  it('places numeric fields, little-endian', () => {
    expect(dv.getInt32(12, true)).toBe(16);
    expect(dv.getInt32(16, true)).toBe(3);
    expect(dv.getInt32(20, true)).toBe(8);
    expect(dv.getFloat64(24, true)).toBe(0.0057);
    expect(dv.getFloat64(32, true)).toBe(0);
    expect(dv.getFloat64(40, true)).toBe(0.00387);
    expect(dv.getInt32(48, true)).toBe(6);
    expect(dv.getInt32(52, true)).toBe(5);
    expect(dv.getFloat64(56, true)).toBe(0.0057);
    expect(dv.getFloat64(64, true)).toBe(0.0057);
    expect(dv.getInt32(72, true)).toBe(30);
    expect(dv.getFloat64(76, true)).toBe(-0.41);
    expect(dv.getInt32(96, true)).toBe(5);
    expect(dv.getInt32(100, true)).toBe(1024);
    expect(dv.getInt32(136, true)).toBe(1002);
    expect(dv.getFloat64(164, true)).toBe(28883);
    expect(dv.getInt32(172, true)).toBe(5090);
    expect(dv.getFloat64(200, true)).toBe(46161);
    expect(dv.getInt32(208, true)).toBe(0);
    expect(dv.getInt32(212, true)).toBe(0);
    expect(dv.getInt32(216, true)).toBe(0);
    expect(dv.getInt32(220, true)).toBe(0);
  });
  it('writes ExamTime as 100-ns ticks since 1601-01-01', () => {
    const ticks = dv.getBigUint64(88, true);
    expect(ticks).toBe((BigInt(EXAM_TIME_MS) + 11644473600000n) * 10000n);
    // 1970-01-01 is 134774 days after 1601-01-01.
    expect(ticks / 10000n / 1000n / 86400n).toBe(134774n + BigInt(Math.floor(EXAM_TIME_MS / 86400000)));
  });
  it('writes dates as days since 1899-12-30 (25569 = 1970-01-01)', () => {
    // 2026-05-20 is day 46162 of the OLE calendar.
    expect(Date.UTC(2026, 4, 20) / 86400000 + 25569).toBe(46162);
  });
  it('leaves the reserved zone at zero', () => {
    expect(bytes.subarray(258).every((b) => b === 0)).toBe(true);
  });
});

describe('.vol B-scan block (table 1.3)', () => {
  const h = header();
  const file = writeVol(syntheticExam(h, 2));
  const dv = new DataView(file.buffer);
  const first = 2048 + 6 * 5;
  const ascii = (o: number, n: number): string => String.fromCharCode(...file.subarray(o, o + n)).replace(/\0+$/, '');

  it('places every header field at its byte', () => {
    const o = first + (1024 + 16 * 8 * 4) * 1; // second B-scan
    expect(ascii(o, 12)).toBe('HSF-BS-103');
    expect(dv.getInt32(o + 12, true)).toBe(1024);
    expect(dv.getFloat64(o + 16, true)).toBe(3.2);
    expect(dv.getFloat64(o + 24, true)).toBe(4.4);
    expect(dv.getFloat64(o + 32, true)).toBe(6.6);
    expect(dv.getFloat64(o + 40, true)).toBe(3.4000000000000004);
    expect(dv.getInt32(o + 48, true)).toBe(2);
    expect(dv.getInt32(o + 52, true)).toBe(256);
    expect(dv.getFloat32(o + 56, true)).toBe(29.5);
    expect(dv.getInt32(o + 60, true)).toBe(0);
    for (let i = 0; i < 6; i++) expect(dv.getFloat32(o + 64 + 4 * i, true)).toBe(0);
    expect(file.subarray(o + 88, o + 256).every((b) => b === 0)).toBe(true);
    // Layer lines start at OffSeg = 256, one float per column; "invalid" is FF FF 7F 7F.
    expect([...file.subarray(o + 256, o + 260)]).toEqual([0xff, 0xff, 0x7f, 0x7f]);
    expect(dv.getFloat32(o + 256 + 4, true)).toBe(2.625);
    // The image starts at BScanHdrSize, row by row.
    expect(dv.getFloat32(o + 1024, true)).toBe(Math.fround(1 / 1000));
  });

  it('writes, reads and writes again to the same bytes', () => {
    const again = writeVol(readVol(file));
    expect(again.length).toBe(file.length);
    expect(Buffer.compare(Buffer.from(again), Buffer.from(file))).toBe(0);
  });

  it('streams the same bytes block by block', () => {
    const blocks = [...writeVolBlocks(syntheticExam(h, 2))];
    expect(blocks.length).toBe(2 + h.numBScans);
    expect(blocks.reduce((s, b) => s + b.length, 0)).toBe(file.length);
  });

  it('reads back headers, layer lines and pixels', () => {
    const exam = readVol(file);
    expect(exam.header).toEqual(h);
    const b = exam.bscan(2);
    expect(b.header).toEqual(bscanHeader(2, 2));
    expect(b.segLines.length).toBe(2);
    expect(b.segLines[0]![0]).toBe(INVALID_VALUE);
    expect(b.segLines[1]![1]).toBe(3.625);
    expect(b.pixels[3]).toBe(Math.fround(((3 * 7 + 2) % 101) / 1000));
    expect([...exam.slo]).toEqual([...syntheticExam(h).slo]);
  });
});

describe('.vol file size (table 1.5)', () => {
  it('is 2048 + SLO + 48 × (61440 + 768 × 496 × 4) bytes for the NASA radial exam', () => {
    const h = header({ sizeX: 768, sizeZ: 496, numBScans: 48, sizeXSlo: 1536, sizeYSlo: 1536, bscanHdrSize: 61440 });
    expect(volFileBytes(h)).toBe(2048 + 1536 * 1536 + 48 * (61440 + 768 * 496 * 4));
    expect(volFileBytes(h)).toBe(78448640);
  });
});

describe('.vol reader rejects broken files', () => {
  const h = header();
  const file = writeVol(syntheticExam(h, 1));
  const expectError = (bytes: Uint8Array, code: string): void => {
    try {
      const exam = readVol(bytes);
      for (let k = 0; k < h.numBScans; k++) exam.bscan(k);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(VolFormatError);
      expect((e as VolFormatError).code).toBe(code);
    }
  };

  it('rejects a cut file', () => {
    expectError(file.slice(0, file.length - 1), 'truncated');
    expectError(file.slice(0, 1000), 'truncated');
  });
  it('rejects an unknown version', () => {
    const bad = file.slice();
    bad.set([...'HSF-XYZ-999'].map((c) => c.charCodeAt(0)), 0);
    expectError(bad, 'unknown-version');
    const badScan = file.slice();
    badScan[2048 + 30 + 4] = 'Q'.charCodeAt(0);
    expectError(badScan, 'unknown-version');
  });
  it('rejects sizes that do not add up', () => {
    const zero = file.slice();
    new DataView(zero.buffer).setInt32(12, 0, true);
    expectError(zero, 'inconsistent-size');
    const smallHdr = file.slice();
    new DataView(smallHdr.buffer).setInt32(100, 100, true);
    expectError(smallHdr, 'inconsistent-size');
    const tooManySeg = file.slice();
    new DataView(tooManySeg.buffer).setInt32(2048 + 30 + (1024 + 512) * 2 + 48, 400, true);
    expectError(tooManySeg, 'inconsistent-size');
  });
  it('reads exams that carry layer lines (NumSeg > 0)', () => {
    const exam = readVol(file);
    expect(exam.bscan(0).segLines.length).toBe(1);
  });
});

describe('display transform (table 1.4)', () => {
  it('follows eyepy and maps invalid values to black', () => {
    expect(displayGray(INVALID_VALUE)).toBe(0);
    expect(displayGray(Math.exp(-8.3) - 0.000244)).toBeCloseTo(0, 9);
    expect(displayGray(1)).toBeCloseTo(1, 2);
    const g = toDisplayGray(Float32Array.of(INVALID_VALUE, 0, 0.05, 2));
    // ln(0.000244) + 8.3 is just below 0, so a zero reflectivity is black too.
    expect([...g]).toEqual([0, 0, Math.round(((Math.log(0.050244) + 8.3) / 8.285) * 255), 255]);
  });
});
