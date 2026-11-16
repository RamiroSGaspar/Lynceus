import { describe, expect, it } from 'vitest';
import { layoutChangeScale, type AxisLabel, type ChangeScaleInput, type ChangeScaleLayout } from './changeScaleLayout';
import { changeDomain, linearScale } from './scale';
import { estimateTextWidth } from './text';

const NASA = { firstSignUm: 19.4, clinicallyConcerningUm: 55 };

const TEXTS = {
  en: {
    bandNames: {
      'normal-variation': 'Normal variation',
      'first-sign': 'First sign',
      'clinically-concerning': 'Clinically concerning',
    },
    day: (day: number, value: number) => `Flight day ${day}: ${value} µm`,
  },
  es: {
    bandNames: {
      'normal-variation': 'Variación normal',
      'first-sign': 'Primer indicio',
      'clinically-concerning': 'Clínicamente preocupante',
    },
    day: (day: number, value: number) => `Día de vuelo ${day}: ${value} µm`,
  },
} as const;

type Locale = keyof typeof TEXTS;

interface Case {
  locale?: Locale;
  width: number;
  valueUm: number | null;
  halfRangeUm?: number;
  previous?: readonly [day: number, valueUm: number][];
}

const signed = (value: number): string => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(Math.round(value))}`;

function input({ locale = 'en', width, valueUm, halfRangeUm = 8, previous = [] }: Case): ChangeScaleInput {
  const text = TEXTS[locale];
  const low = valueUm === null ? null : valueUm - halfRangeUm;
  const high = valueUm === null ? null : valueUm + halfRangeUm;
  return {
    width,
    fontPx: 14,
    measure: estimateTextWidth,
    domain: changeDomain([valueUm, low, high, ...previous.map(([, value]) => value)]),
    thresholds: NASA,
    bandNames: text.bandNames,
    zeroLabel: '0',
    firstSignLabel: '19.4 µm',
    clinicallyConcerningLabel: '55 µm',
    tickLabel: (value) => signed(value).replace('+', ''),
    today: valueUm === null ? null : { valueUm, lowUm: low, highUm: high },
    previous: previous.map(([day, value]) => ({ valueUm: value, label: text.day(day, value) })),
  };
}

const EPS = 0.01;

/** Everything a person must be able to read: no label outside the drawing, none on top of another, no mark cut. */
function expectReadable(layout: ChangeScaleLayout, given: ChangeScaleInput): void {
  const { width } = layout;

  // Numbers above the line: inside the drawing, and clear of each other on their own row.
  const rows = new Map<number, AxisLabel[]>();
  for (const label of layout.axisLabels) {
    expect(label.x - label.width / 2).toBeGreaterThanOrEqual(-EPS);
    expect(label.x + label.width / 2).toBeLessThanOrEqual(width + EPS);
    expect(label.baseline).toBeLessThan(layout.lineY);
    rows.set(label.baseline, [...(rows.get(label.baseline) ?? []), label]);
  }
  for (const row of rows.values()) {
    const sorted = [...row].sort((a, b) => a.x - b.x);
    for (let index = 1; index < sorted.length; index += 1) {
      const before = sorted[index - 1] as AxisLabel;
      const after = sorted[index] as AxisLabel;
      expect(after.x - after.width / 2 - (before.x + before.width / 2)).toBeGreaterThan(0);
    }
  }
  // A threshold value is never struck through by a threshold line, and neither is a round number.
  for (const label of layout.axisLabels) {
    for (const line of layout.thresholdLines) {
      if (label.kind === line.kind) continue;
      const inside = line.x > label.x - label.width / 2 + EPS && line.x < label.x + label.width / 2 - EPS;
      if (label.kind === 'tick' || label.kind === 'zero') expect(inside).toBe(false);
    }
  }

  // Band names: one per band, inside the drawing, under the line, clear of each other.
  expect(layout.bandLabels).toHaveLength(3);
  for (const label of layout.bandLabels) {
    expect(label.x).toBeGreaterThanOrEqual(-EPS);
    expect(label.x + label.width).toBeLessThanOrEqual(width + EPS);
    expect(label.shape.y).toBeGreaterThan(layout.lineY);
    for (const line of label.lines) {
      expect(label.textX + given.measure(line, given.fontPx)).toBeLessThanOrEqual(width + EPS);
    }
  }
  if (layout.bandMode === 'inline') {
    const sorted = [...layout.bandLabels].sort((a, b) => a.x - b.x);
    for (let index = 1; index < sorted.length; index += 1) {
      const before = sorted[index - 1] as (typeof sorted)[number];
      const after = sorted[index] as (typeof sorted)[number];
      expect(after.x - (before.x + before.width)).toBeGreaterThan(0);
    }
  } else {
    const tops = layout.bandLabels.map((label) => label.baseline);
    expect([...tops].sort((a, b) => a - b)).toEqual(tops);
    expect(new Set(tops).size).toBe(tops.length);
  }

  // Today's disc and its range, and the earlier controls: on the line, never cut by the edge of the drawing.
  if (layout.today) {
    const { x, y, r, range } = layout.today;
    expect(y).toBe(layout.lineY);
    expect(x - r).toBeGreaterThanOrEqual(-EPS);
    expect(x + r).toBeLessThanOrEqual(width + EPS);
    if (range) {
      expect(range.x1).toBeGreaterThanOrEqual(layout.plot.left - EPS);
      expect(range.x2).toBeLessThanOrEqual(layout.plot.right + EPS);
      expect(range.x1).toBeLessThanOrEqual(x + EPS);
      expect(range.x2).toBeGreaterThanOrEqual(x - EPS);
    }
  }
  for (const mark of layout.previous) {
    expect(mark.y).toBe(layout.lineY);
    expect(mark.x - mark.r).toBeGreaterThanOrEqual(-EPS);
    expect(mark.x + mark.r).toBeLessThanOrEqual(width + EPS);
    if (layout.today) expect(mark.r).toBeLessThan(layout.today.r);
  }

  // The drawing contains everything.
  const lastBaseline = Math.max(...layout.bandLabels.map((label) => label.baseline + (label.lines.length - 1) * layout.lineHeight));
  expect(layout.height).toBeGreaterThan(lastBaseline);
  expect(layout.plot.right).toBeGreaterThan(layout.plot.left);
}

describe('layoutChangeScale', () => {
  it('puts today’s mark and its range where the scale says', () => {
    const given = input({ width: 900, valueUm: 24, halfRangeUm: 8 });
    const layout = layoutChangeScale(given);
    const x = linearScale(given.domain, layout.plot.left, layout.plot.right);
    expect(layout.today?.x).toBeCloseTo(x(24));
    expect(layout.today?.range?.x1).toBeCloseTo(x(16));
    expect(layout.today?.range?.x2).toBeCloseTo(x(32));
    expect(layout.zero?.x).toBeCloseTo(x(0));
    expect(layout.thresholdLines.map(({ kind, x: lineX }) => ({ kind, x: lineX }))).toEqual([
      { kind: 'first-sign', x: x(19.4) },
      { kind: 'clinically-concerning', x: x(55) },
    ]);
  });

  it('draws three stretches that cover the axis and meet at NASA’s thresholds', () => {
    const given = input({ width: 900, valueUm: 24 });
    const layout = layoutChangeScale(given);
    const [normal, first, concerning] = layout.bands;
    expect(layout.bands.map((band) => band.id)).toEqual(['normal-variation', 'first-sign', 'clinically-concerning']);
    expect(normal?.x).toBeCloseTo(layout.plot.left);
    expect((normal?.x ?? 0) + (normal?.width ?? 0)).toBeCloseTo(first?.x ?? -1);
    expect((first?.x ?? 0) + (first?.width ?? 0)).toBeCloseTo(concerning?.x ?? -1);
    expect((concerning?.x ?? 0) + (concerning?.width ?? 0)).toBeCloseTo(layout.plot.right);
  });

  it('always marks 0 as the pre-flight exam and writes the value of the two thresholds beside their lines', () => {
    for (const width of [300, 520, 1000]) {
      const layout = layoutChangeScale(input({ width, valueUm: 24 }));
      const kinds = layout.axisLabels.map((label) => label.kind);
      expect(kinds).toContain('zero');
      expect(kinds).toContain('first-sign');
      expect(kinds).toContain('clinically-concerning');
      expect(layout.axisLabels.find((label) => label.kind === 'zero')?.text).toBe('0');
      expect(layout.zero).not.toBeNull();
      const first = layout.axisLabels.find((label) => label.kind === 'first-sign');
      const second = layout.axisLabels.find((label) => label.kind === 'clinically-concerning');
      expect(first?.text).toBe('19.4 µm');
      expect(second?.text).toBe('55 µm');
      // Beside its own line: the value does not sit on it.
      for (const label of [first, second]) {
        expect(Math.abs((label?.x ?? 0) - (label?.anchorX ?? 0))).toBeGreaterThanOrEqual((label?.width ?? 0) / 2);
      }
    }
  });

  it('labels round values only where the scale has no other reference, each with its mark on the axis', () => {
    const wide = layoutChangeScale(input({ width: 1000, valueUm: 120 }));
    const tickValues = wide.axisLabels.filter((label) => label.kind === 'tick').map((label) => label.valueUm);
    expect(tickValues).toContain(100);
    expect(tickValues).not.toContain(20);
    expect(tickValues).not.toContain(40);
    expect(tickValues.every((value) => value < 0 || value > 55)).toBe(true);
    expect(wide.tickMarks).toHaveLength(tickValues.length);
    // Both eyes are drawn on the same scale: the same domain gives the same round values.
    const other = layoutChangeScale({ ...input({ width: 1000, valueUm: 12 }), domain: input({ width: 1000, valueUm: 120 }).domain });
    expect(other.axisLabels.filter((label) => label.kind === 'tick').map((label) => label.valueUm)).toEqual(tickValues);
  });

  it('writes the band names under their own stretch on a wide drawing, on one line', () => {
    const layout = layoutChangeScale(input({ width: 1000, valueUm: 24 }));
    expect(layout.bandMode).toBe('inline');
    expect(layout.bandLabels.every((label) => label.lines.length === 1)).toBe(true);
    const [normal, first] = layout.bandLabels;
    expect(normal?.x).toBeCloseTo(layout.bands[0]?.x ?? -1);
    expect(first?.x).toBeCloseTo(layout.bands[1]?.x ?? -1);
    const last = layout.bandLabels[2];
    expect((last?.x ?? 0) + (last?.width ?? 0)).toBeCloseTo(layout.plot.right);
  });

  it('breaks a band name in two lines before giving up on writing the names side by side', () => {
    const layout = layoutChangeScale(input({ width: 300, valueUm: 58, halfRangeUm: 10 }));
    expect(layout.bandMode).toBe('inline');
    expect(layout.bandLabels.find((label) => label.id === 'clinically-concerning')?.lines).toEqual(['Clinically', 'concerning']);
  });

  it('stacks the band names, one row each, when they do not fit side by side', () => {
    const layout = layoutChangeScale(input({ width: 200, valueUm: 24, locale: 'es' }));
    expect(layout.bandMode).toBe('stacked');
    const baselines = layout.bandLabels.map((label) => label.baseline);
    expect(new Set(baselines).size).toBe(3);
    for (const label of layout.bandLabels) expect(label.x + label.width).toBeLessThanOrEqual(layout.width + EPS);
  });

  it('keeps today’s disc whole when the value is at either end of the scale', () => {
    for (const valueUm of [-12, 0, 72, 232]) {
      const given = input({ width: 272, valueUm });
      expectReadable(layoutChangeScale(given), given);
    }
  });

  it('draws only the earlier controls when the eye has no value today', () => {
    const given = input({ width: 600, valueUm: null, previous: [[30, 15], [90, 24]] });
    const layout = layoutChangeScale(given);
    expect(layout.today).toBeNull();
    expect(layout.previous.map((mark) => mark.label)).toEqual(['Flight day 30: 15 µm', 'Flight day 90: 24 µm']);
    expectReadable(layout, given);
  });

  it('puts every earlier control where the scale says, smaller than today’s disc', () => {
    const given = input({ width: 318, valueUm: 9, previous: [[30, 6], [90, 8]] });
    const layout = layoutChangeScale(given);
    const x = linearScale(given.domain, layout.plot.left, layout.plot.right);
    expect(layout.previous.map((mark) => mark.x)).toEqual([x(6), x(8)]);
    expectReadable(layout, given);
  });

  it('has room for an empty scale', () => {
    const given = input({ width: 600, valueUm: null });
    const layout = layoutChangeScale(given);
    expect(layout.height).toBeGreaterThan(given.fontPx * 4);
    expectReadable(layout, given);
  });

  const WIDTHS = [200, 240, 272, 300, 318, 340, 390, 460, 520, 600, 720, 860, 1000, 1200];
  const CASES: { name: string; valueUm: number | null; halfRangeUm?: number; previous?: readonly [number, number][] }[] = [
    { name: 'no change (crew member A)', valueUm: 9, previous: [[30, 6], [90, 8]] },
    { name: 'first sign (crew member B)', valueUm: 31, previous: [[30, 15], [90, 24], [118, 27]] },
    { name: 'near the first threshold', valueUm: 19, halfRangeUm: 8.3 },
    { name: 'clinically concerning (crew member C)', valueUm: 66, previous: [[30, 27], [58, 37], [90, 48], [118, 57], [139, 63]] },
    {
      name: 'extreme case (crew member D)',
      valueUm: 168,
      previous: [[30, 118], [51, 160], [72, 190], [90, 203], [111, 195], [132, 182]],
    },
    { name: 'largest published change', valueUm: 232, halfRangeUm: 12 },
    { name: 'a decrease', valueUm: -28, previous: [[30, -5]] },
    { name: 'not measured today', valueUm: null, previous: [[30, 15], [90, 24]] },
    { name: 'first control, nothing before', valueUm: 15 },
  ];

  it.each(CASES)('is readable at every width, in both languages: $name', ({ valueUm, halfRangeUm, previous }) => {
    for (const locale of ['en', 'es'] as const) {
      for (const width of WIDTHS) {
        const given = input({ locale, width, valueUm, halfRangeUm, previous });
        expectReadable(layoutChangeScale(given), given);
      }
    }
  });

  it('gives the same drawing for the same input', () => {
    const given = input({ width: 390, valueUm: 66, previous: [[30, 27], [90, 48]] });
    expect(layoutChangeScale(given)).toEqual(layoutChangeScale(given));
  });
});
