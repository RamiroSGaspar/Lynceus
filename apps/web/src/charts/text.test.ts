import { describe, expect, it } from 'vitest';
import {
  estimateTextWidth,
  rowFits,
  spansCollide,
  splitIntoRows,
  spreadRow,
  widestLine,
  wrapLines,
  type RowItem,
} from './text';

/** A fixed-width face makes the expected numbers easy to read: 10 px per character. */
const mono = (text: string): number => text.length * 10;

function overlaps(items: readonly RowItem[], centres: readonly number[], gap: number): boolean {
  for (let index = 1; index < items.length; index += 1) {
    const left = (centres[index - 1] as number) + (items[index - 1] as RowItem).width / 2;
    const right = (centres[index] as number) - (items[index] as RowItem).width / 2;
    if (right - left < gap - 1e-6) return true;
  }
  return false;
}

describe('estimateTextWidth', () => {
  it('grows with the text and with the font size, and bold is wider', () => {
    expect(estimateTextWidth('First sign', 16)).toBeGreaterThan(estimateTextWidth('First', 16));
    expect(estimateTextWidth('First sign', 20)).toBeCloseTo(estimateTextWidth('First sign', 10) * 2);
    expect(estimateTextWidth('First sign', 16, true)).toBeGreaterThan(estimateTextWidth('First sign', 16));
    expect(estimateTextWidth('', 16)).toBe(0);
  });

  it('counts narrow letters as narrower than wide ones', () => {
    expect(estimateTextWidth('ill', 16)).toBeLessThan(estimateTextWidth('mmm', 16));
  });
});

describe('wrapLines', () => {
  it('keeps a text that fits on one line', () => {
    expect(wrapLines('First sign', 100, 1, mono)).toEqual(['First sign']);
  });

  it('breaks at spaces when the line is too long', () => {
    expect(wrapLines('Clinically concerning', 110, 1, mono)).toEqual(['Clinically', 'concerning']);
    expect(wrapLines('before the flight', 100, 1, mono)).toEqual(['before the', 'flight']);
  });

  it('says it cannot when a single word is wider than the line', () => {
    expect(wrapLines('Clínicamente preocupante', 100, 1, mono)).toBeNull();
  });

  it('reports the widest line', () => {
    expect(widestLine(['Clinically', 'concerning'], 1, mono)).toBe(100);
    expect(widestLine([], 1, mono)).toBe(0);
  });
});

describe('spreadRow', () => {
  it('leaves labels on their anchors when there is room', () => {
    const items = [
      { anchor: 100, width: 40 },
      { anchor: 200, width: 40 },
    ];
    expect(spreadRow(items, 0, 300, 6)).toEqual([100, 200]);
  });

  it('pushes neighbours apart until they no longer overlap, sharing the push', () => {
    const items = [
      { anchor: 100, width: 60 },
      { anchor: 110, width: 60 },
      { anchor: 120, width: 60 },
    ];
    const centres = spreadRow(items, 0, 400, 6);
    expect(overlaps(items, centres, 6)).toBe(false);
    expect(centres[1]).toBeCloseTo(110, 3);
    expect(110 - (centres[0] as number)).toBeCloseTo((centres[2] as number) - 110, 3);
  });

  it('moves two colliding labels by the same amount', () => {
    const items = [
      { anchor: 100, width: 40 },
      { anchor: 120, width: 40 },
    ];
    expect(spreadRow(items, 0, 400, 0)).toEqual([90, 130]);
  });

  it('keeps every label inside the limits, pulling back what went past the end', () => {
    const items = [
      { anchor: 280, width: 60 },
      { anchor: 290, width: 60 },
      { anchor: 300, width: 60 },
    ];
    const centres = spreadRow(items, 0, 300, 6);
    expect(overlaps(items, centres, 6)).toBe(false);
    expect((centres[2] as number) + 30).toBeLessThanOrEqual(300);
    expect((centres[0] as number) - 30).toBeGreaterThanOrEqual(0);
  });

  it('moves a label in from the edge instead of cutting it', () => {
    expect(spreadRow([{ anchor: 0, width: 50 }], 0, 300, 6)).toEqual([25]);
    expect(spreadRow([{ anchor: 300, width: 50 }], 0, 300, 6)).toEqual([275]);
  });

  it('handles an empty row', () => {
    expect(spreadRow([], 0, 300, 6)).toEqual([]);
  });
});

describe('rows of labels', () => {
  const six: RowItem[] = [30, 51, 72, 90, 111, 132].map((day) => ({ anchor: day * 1.5, width: 44 }));

  it('knows whether a row fits', () => {
    expect(rowFits(six, 0, 300, 6)).toBe(true);
    expect(rowFits(six, 0, 250, 6)).toBe(false);
    expect(rowFits([], 0, 10, 6)).toBe(true);
  });

  it('uses one row when it fits and deals the labels over more rows when it does not', () => {
    expect(splitIntoRows(six, 0, 300, 6, 3)).toEqual([[0, 1, 2, 3, 4, 5]]);
    expect(splitIntoRows(six, 0, 250, 6, 3)).toEqual([
      [0, 2, 4],
      [1, 3, 5],
    ]);
    expect(splitIntoRows(six, 0, 100, 6, 3)).toEqual([
      [0, 3],
      [1, 4],
      [2, 5],
    ]);
    expect(splitIntoRows([], 0, 100, 6, 3)).toEqual([]);
  });
});

describe('spansCollide', () => {
  it('compares two spans given by centre and width', () => {
    expect(spansCollide(100, 40, 130, 40, 0)).toBe(true);
    expect(spansCollide(100, 40, 140, 40, 0)).toBe(false);
    expect(spansCollide(100, 40, 144, 40, 6)).toBe(true);
    expect(spansCollide(100, 40, 146, 40, 6)).toBe(false);
  });
});
