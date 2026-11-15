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
    zero: { value: '0', note: 'before the flight' },
    nasa: 'NASA',
    range: (low: string, high: string) => `range ${low} to ${high} µm`,
    day: (day: number) => `FD${day}`,
  },
  es: {
    bandNames: {
      'normal-variation': 'Variación normal',
      'first-sign': 'Primer indicio',
      'clinically-concerning': 'Clínicamente preocupante',
    },
    zero: { value: '0', note: 'antes del vuelo' },
    nasa: 'NASA',
    range: (low: string, high: string) => `rango ${low} a ${high} µm`,
    day: (day: number) => `DV${day}`,
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
    fontPx: 15.75,
    valueFontPx: 24.75,
    measure: estimateTextWidth,
    domain: changeDomain([valueUm, low, high, ...previous.map(([, value]) => value)]),
    thresholds: NASA,
    bandNames: text.bandNames,
    zero: text.zero,
    firstSign: { value: '19.4 µm', note: text.nasa },
    clinicallyConcerning: { value: '55 µm', note: text.nasa },
    tickLabel: (value) => signed(value).replace('+', ''),
    today:
      valueUm === null || low === null || high === null
        ? null
        : {
            valueUm,
            lowUm: low,
            highUm: high,
            valueLabel: `${signed(valueUm)} µm`,
            rangeLabel: text.range(signed(low), signed(high)),
          },
    previous: previous.map(([day, value]) => ({ valueUm: value, label: text.day(day) })),
  };
}

const EPS = 0.01;

/** Everything a person must be able to read: no label outside the drawing, none on top of another. */
function expectReadable(layout: ChangeScaleLayout, given: ChangeScaleInput): void {
  const { width } = layout;

  // Axis labels: inside the drawing and clear of each other.
  const axis = [...layout.axisLabels].sort((a, b) => a.x - b.x);
  for (const label of axis) {
    expect(label.x - label.width / 2).toBeGreaterThanOrEqual(-EPS);
    expect(label.x + label.width / 2).toBeLessThanOrEqual(width + EPS);
  }
  for (let index = 1; index < axis.length; index += 1) {
    const before = axis[index - 1] as AxisLabel;
    const after = axis[index] as AxisLabel;
    expect(after.x - after.width / 2 - (before.x + before.width / 2)).toBeGreaterThan(0);
  }

  // Band names: inside the drawing; inside their own band when the layout is inline.
  for (const label of layout.bandLabels) {
    const band = layout.bands.find((candidate) => candidate.id === label.id);
    expect(band).toBeDefined();
    if (!band) continue;
    for (const line of label.lines) {
      const lineWidth = given.measure(line, given.fontPx, true);
      const start = label.anchor === 'start' ? label.x : label.anchor === 'end' ? label.x - lineWidth : label.x - lineWidth / 2;
      expect(start).toBeGreaterThanOrEqual(-EPS);
      expect(start + lineWidth).toBeLessThanOrEqual(width + EPS);
      if (layout.bandMode === 'inline') {
        expect(start).toBeGreaterThanOrEqual(band.x - EPS);
        expect(start + lineWidth).toBeLessThanOrEqual(band.x + band.width + EPS);
      }
    }
  }
  expect(layout.bandLabels).toHaveLength(3);

  // Today's chip: inside the bands, above its mark.
  if (layout.today) {
    const { chip, y, half } = layout.today;
    expect(chip.x - chip.width / 2).toBeGreaterThanOrEqual(layout.plot.left - EPS);
    expect(chip.x + chip.width / 2).toBeLessThanOrEqual(layout.plot.right + EPS);
    expect(chip.y).toBeGreaterThanOrEqual(layout.plot.top);
    expect(chip.y + chip.height).toBeLessThan(y - half);
    expect(y + half).toBeLessThan(layout.plot.bottom);
  }

  // Earlier controls: labels inside the drawing, clear of each other on the same row, under today's mark.
  const rows = new Map<number, typeof layout.previous>();
  for (const mark of layout.previous) {
    rows.set(mark.labelBaseline, [...(rows.get(mark.labelBaseline) ?? []), mark]);
    expect(mark.labelX - mark.labelWidth / 2).toBeGreaterThanOrEqual(-EPS);
    expect(mark.labelX + mark.labelWidth / 2).toBeLessThanOrEqual(width + EPS);
    expect(mark.labelBaseline).toBeLessThan(layout.plot.bottom);
    if (layout.today) expect(mark.y - mark.r).toBeGreaterThan(layout.today.y + layout.today.half);
  }
  for (const row of rows.values()) {
    const sorted = [...row].sort((a, b) => a.labelX - b.labelX);
    for (let index = 1; index < sorted.length; index += 1) {
      const before = sorted[index - 1] as (typeof sorted)[number];
      const after = sorted[index] as (typeof sorted)[number];
      expect(after.labelX - after.labelWidth / 2 - (before.labelX + before.labelWidth / 2)).toBeGreaterThan(0);
    }
  }

  // The drawing contains everything.
  const lastBaseline = Math.max(...layout.axisLabels.map((label) => label.baseline + (label.lines.length - 1) * layout.lineHeight));
  expect(layout.height).toBeGreaterThan(lastBaseline);
  expect(layout.plot.bottom).toBeGreaterThan(layout.plot.top);
}

describe('layoutChangeScale', () => {
  it('puts today’s mark and its range where the scale says', () => {
    const given = input({ width: 900, valueUm: 24, halfRangeUm: 8 });
    const layout = layoutChangeScale(given);
    const x = linearScale(given.domain, layout.plot.left, layout.plot.right);
    expect(layout.today?.x).toBeCloseTo(x(24));
    expect(layout.today?.range?.x1).toBeCloseTo(x(16));
    expect(layout.today?.range?.x2).toBeCloseTo(x(32));
    expect(layout.zeroX).toBeCloseTo(x(0));
    expect(layout.thresholdLines).toEqual([
      { kind: 'first-sign', x: x(19.4) },
      { kind: 'clinically-concerning', x: x(55) },
    ]);
  });

  it('draws three bands that cover the axis and meet at NASA’s thresholds', () => {
    const given = input({ width: 900, valueUm: 24 });
    const layout = layoutChangeScale(given);
    const [normal, first, concerning] = layout.bands;
    expect(layout.bands.map((band) => band.id)).toEqual(['normal-variation', 'first-sign', 'clinically-concerning']);
    expect(normal?.x).toBeCloseTo(layout.plot.left);
    expect((normal?.x ?? 0) + (normal?.width ?? 0)).toBeCloseTo(first?.x ?? -1);
    expect((first?.x ?? 0) + (first?.width ?? 0)).toBeCloseTo(concerning?.x ?? -1);
    expect((concerning?.x ?? 0) + (concerning?.width ?? 0)).toBeCloseTo(layout.plot.right);
  });

  it('always labels 0 as the pre-flight exam and the two thresholds with their value and "NASA"', () => {
    for (const width of [300, 520, 1000]) {
      const layout = layoutChangeScale(input({ width, valueUm: 24 }));
      const kinds = layout.axisLabels.map((label) => label.kind);
      expect(kinds).toContain('zero');
      expect(kinds).toContain('first-sign');
      expect(kinds).toContain('clinically-concerning');
      const zero = layout.axisLabels.find((label) => label.kind === 'zero');
      expect(zero?.lines[0]).toBe('0');
      expect(zero?.lines.slice(1).join(' ')).toBe('before the flight');
      expect(layout.axisLabels.find((label) => label.kind === 'first-sign')?.lines).toEqual(['19.4 µm', 'NASA']);
      expect(layout.axisLabels.find((label) => label.kind === 'clinically-concerning')?.lines).toEqual(['55 µm', 'NASA']);
    }
  });

  it('drops a round tick that would sit on a threshold label, and keeps the rest', () => {
    const layout = layoutChangeScale(input({ width: 1000, valueUm: 24 }));
    const tickValues = layout.axisLabels.filter((label) => label.kind === 'tick').map((label) => label.valueUm);
    expect(tickValues).not.toContain(20);
    expect(tickValues).toContain(-20);
    expect(tickValues).toContain(40);
    expect(tickValues).toContain(80);
    expect(layout.tickMarks.length).toBeGreaterThanOrEqual(tickValues.length + 3);
  });

  it('writes the band names inside the bands on a wide screen', () => {
    const layout = layoutChangeScale(input({ width: 1000, valueUm: 24 }));
    expect(layout.bandMode).toBe('inline');
    expect(layout.bandLabels.every((label) => label.lines.length === 1 && label.extent === null)).toBe(true);
  });

  it('breaks the band names in two lines before giving up on writing them inside', () => {
    const layout = layoutChangeScale(input({ width: 560, valueUm: 24 }));
    expect(layout.bandMode).toBe('inline');
    expect(layout.bandLabels.find((label) => label.id === 'clinically-concerning')?.lines).toEqual([
      'Clinically',
      'concerning',
    ]);
  });

  it('stacks the band names above the bands on a phone, each over a bar that spans its band', () => {
    const layout = layoutChangeScale(input({ width: 318, valueUm: 24, locale: 'es' }));
    expect(layout.bandMode).toBe('stacked');
    for (const label of layout.bandLabels) {
      const band = layout.bands.find((candidate) => candidate.id === label.id);
      expect(label.lines).toHaveLength(1);
      expect(label.extent?.x1).toBeCloseTo(band?.x ?? -1);
      expect(label.extent?.x2).toBeCloseTo((band?.x ?? 0) + (band?.width ?? 0));
      expect(label.baseline).toBeLessThan(layout.plot.top);
    }
  });

  it('keeps today’s chip inside the drawing when the value is at either end', () => {
    for (const valueUm of [-12, 0, 72, 232]) {
      const given = input({ width: 318, valueUm });
      expectReadable(layoutChangeScale(given), given);
    }
  });

  it('draws only the earlier controls when the eye has no value today', () => {
    const given = input({ width: 600, valueUm: null, previous: [[30, 15], [90, 24]] });
    const layout = layoutChangeScale(given);
    expect(layout.today).toBeNull();
    expect(layout.previous.map((mark) => mark.label)).toEqual(['FD30', 'FD90']);
    expectReadable(layout, given);
  });

  it('spreads the days of earlier controls that are close together, without overlap', () => {
    const given = input({ width: 318, valueUm: 9, previous: [[30, 6], [90, 8]] });
    const layout = layoutChangeScale(given);
    const [first, second] = layout.previous;
    expect(first && second && Math.abs(first.x - second.x)).toBeLessThan(first?.labelWidth ?? 0);
    expectReadable(layout, given);
  });

  it('has room for an empty chart', () => {
    const given = input({ width: 600, valueUm: null });
    const layout = layoutChangeScale(given);
    expect(layout.plot.bottom - layout.plot.top).toBeGreaterThan(given.fontPx * 2);
    expectReadable(layout, given);
  });

  const WIDTHS = [280, 300, 318, 340, 390, 460, 520, 600, 720, 860, 1000, 1200];
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
