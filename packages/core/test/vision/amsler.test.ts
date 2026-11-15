import { describe, expect, it } from 'vitest';
import {
  amslerCellDeg,
  amslerCellMm,
  amslerCentralCells,
  amslerFieldDeg,
  amslerGridSizeThatFits,
  isCentralAmslerCell,
  setAmslerMark,
  summarizeAmsler,
} from '../../src/vision/amsler';

describe('Amsler geometry (section 1.B)', () => {
  it('keeps 1° per square at 40 cm with 6.98 mm squares, 20 of them about 14 cm', () => {
    expect(amslerCellMm(40)).toBeCloseTo(6.98, 2);
    expect(20 * amslerCellMm(40)).toBeCloseTo(139.6, 1);
    expect(amslerFieldDeg(20, amslerCellMm(40), 40)).toBeCloseTo(19.8, 1);
  });

  it('matches the original chart read at 40 cm: 14.25° and 0.72° per square', () => {
    expect(amslerFieldDeg(20, 5, 40)).toBeCloseTo(14.25, 2);
    expect(amslerCellDeg(5, 40)).toBeCloseTo(0.72, 2);
  });

  it('gives 1° per 5 mm square near the original 28 to 30 cm', () => {
    expect(amslerCellDeg(5, 28.65)).toBeCloseTo(1, 2);
  });

  it('chooses the largest even grid that fits, up to 20', () => {
    const cell = amslerCellMm(40);
    expect(amslerGridSizeThatFits(200, cell)).toBe(20);
    expect(amslerGridSizeThatFits(20 * cell, cell)).toBe(20);
    expect(amslerGridSizeThatFits(19.5 * cell, cell)).toBe(18);
    expect(amslerGridSizeThatFits(64, cell)).toBe(8);
    expect(amslerGridSizeThatFits(10, cell)).toBe(0);
  });

  it('finds the four squares of the central 2° around the dot', () => {
    expect(amslerCentralCells(20)).toEqual([
      { col: 9, row: 9 },
      { col: 10, row: 9 },
      { col: 9, row: 10 },
      { col: 10, row: 10 },
    ]);
    expect(amslerCentralCells(8)).toHaveLength(4);
    expect(isCentralAmslerCell(10, 10, 20)).toBe(true);
    expect(isCentralAmslerCell(11, 10, 20)).toBe(false);
    expect(isCentralAmslerCell(3, 4, 8)).toBe(true);
    // Half-degree squares: the central 2° take four per side.
    expect(amslerCentralCells(20, 0.5)).toHaveLength(16);
  });
});

describe('Amsler summary', () => {
  const base = { eye: 'OD' as const, gridSize: 20, cellDeg: 1, cornersSeen: true };

  it('is clean when nothing is marked', () => {
    expect(summarizeAmsler({ ...base, marks: [] })).toEqual({ ...base, marks: [], markedFraction: 0, centralMarked: false });
  });

  it('counts the fraction marked and flags the centre', () => {
    const result = summarizeAmsler({
      ...base,
      marks: [
        { col: 0, row: 0, kind: 'wavy' },
        { col: 1, row: 0, kind: 'wavy' },
        { col: 9, row: 10, kind: 'missing' },
        { col: 15, row: 3, kind: 'blurred' },
      ],
    });
    expect(result.markedFraction).toBe(4 / 400);
    expect(result.centralMarked).toBe(true);
    expect(result.marks.map((m) => `${m.col},${m.row}`)).toEqual(['0,0', '1,0', '15,3', '9,10']);
  });

  it('does not flag the centre for marks around it', () => {
    const marks = [8, 11].flatMap((col) => [8, 9, 10, 11].map((row) => ({ col, row, kind: 'blurred' as const })));
    const result = summarizeAmsler({ ...base, marks });
    expect(result.centralMarked).toBe(false);
    expect(result.markedFraction).toBe(8 / 400);
  });

  it('keeps one mark per square, the last, and drops marks outside the grid', () => {
    const result = summarizeAmsler({
      ...base,
      gridSize: 8,
      marks: [
        { col: 2, row: 2, kind: 'wavy' },
        { col: 2, row: 2, kind: 'missing' },
        { col: 8, row: 0, kind: 'wavy' },
        { col: -1, row: 3, kind: 'wavy' },
      ],
    });
    expect(result.marks).toEqual([{ col: 2, row: 2, kind: 'missing' }]);
    expect(result.markedFraction).toBe(1 / 64);
  });

  it('marks, replaces and erases squares', () => {
    let marks = setAmslerMark([], 3, 1, 'wavy');
    marks = setAmslerMark(marks, 0, 0, 'blurred');
    marks = setAmslerMark(marks, 3, 1, 'missing');
    expect(marks).toEqual([
      { col: 0, row: 0, kind: 'blurred' },
      { col: 3, row: 1, kind: 'missing' },
    ]);
    expect(setAmslerMark(marks, 0, 0, null)).toEqual([{ col: 3, row: 1, kind: 'missing' }]);
  });
});
