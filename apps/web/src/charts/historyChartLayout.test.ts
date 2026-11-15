import { describe, expect, it } from 'vitest';
import {
  layoutHistoryChart,
  type HistoryChartInput,
  type HistoryChartLayout,
  type HistoryPointInput,
  type PlacedText,
} from './historyChartLayout';
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
    thresholdLabels: { firstSign: '19.4 µm · NASA', clinicallyConcerning: '55 µm · NASA' },
    zeroLabel: 'before the flight',
    yTitle: 'Change (µm)',
    xTitle: 'Flight day',
    currentLabel: 'today',
  },
  es: {
    bandNames: {
      'normal-variation': 'Variación normal',
      'first-sign': 'Primer indicio',
      'clinically-concerning': 'Clínicamente preocupante',
    },
    thresholdLabels: { firstSign: '19,4 µm · NASA', clinicallyConcerning: '55 µm · NASA' },
    zeroLabel: 'antes del vuelo',
    yTitle: 'Cambio (µm)',
    xTitle: 'Día de vuelo',
    currentLabel: 'hoy',
  },
} as const;

type Series = readonly [day: number, valueUm: number | null][];

function points(series: Series, liveDay: number | null = null): HistoryPointInput[] {
  return series.map(([flightDay, valueUm]) => ({
    flightDay,
    valueUm,
    lowUm: valueUm === null ? null : valueUm - 8,
    highUm: valueUm === null ? null : valueUm + 8,
    live: flightDay === liveDay,
  }));
}

function input(
  width: number,
  od: Series,
  os: Series,
  options: { locale?: keyof typeof TEXTS; currentDay?: number | null } = {},
): HistoryChartInput {
  const currentDay = options.currentDay === undefined ? 150 : options.currentDay;
  const values = [...od, ...os].flatMap(([, value]) => (value === null ? [] : [value - 8, value + 8]));
  return {
    width,
    fontPx: 15.75,
    measure: estimateTextWidth,
    durationDays: 180,
    routineDays: [30, 90, 150],
    domain: changeDomain(values),
    thresholds: NASA,
    ...TEXTS[options.locale ?? 'en'],
    tickLabel: (value) => String(value),
    series: [
      { eye: 'OD', points: points(od, currentDay) },
      { eye: 'OS', points: points(os, currentDay) },
    ],
    currentDay,
  };
}

const B_OD: Series = [[30, 15], [90, 24], [118, 27], [150, 31]];
const B_OS: Series = [[30, 10], [90, 17], [118, 20], [150, 23]];
const D_OD: Series = [[30, 118], [51, 160], [72, 190], [90, 203], [111, 195], [132, 182], [150, 168]];
const D_OS: Series = [[30, 110], [51, 150], [72, 196], [90, 214], [111, 220], [132, 210], [150, 200]];

function textSpan(label: PlacedText, bold = true): [number, number] {
  const labelWidth = estimateTextWidth(label.text, 15.75, bold);
  const start = label.anchor === 'start' ? label.x : label.anchor === 'end' ? label.x - labelWidth : label.x - labelWidth / 2;
  return [start, start + labelWidth];
}

/** Every label is inside the drawing, and the labels written inside the plot stay inside the plot. */
function expectReadable(layout: HistoryChartLayout): void {
  const { plot, width } = layout;
  const inPlot: PlacedText[] = [
    ...layout.bands.flatMap((band) => (band.label ? [band.label] : [])),
    ...layout.thresholdLines.map((line) => line.label),
    layout.zero.label,
  ];
  for (const label of inPlot) {
    const [start, end] = textSpan(label);
    expect(start).toBeGreaterThanOrEqual(plot.left);
    expect(end).toBeLessThanOrEqual(plot.right);
    expect(label.baseline).toBeGreaterThan(plot.top);
    expect(label.baseline).toBeLessThan(plot.bottom);
  }
  const outside: [label: PlacedText, bold: boolean][] = [
    ...layout.yTicks.map((tick): [PlacedText, boolean] => [tick.label, tick.value === 0]),
    ...layout.xTicks.flatMap((tick): [PlacedText, boolean][] => (tick.label ? [[tick.label, tick.routine]] : [])),
    [layout.xTitle, false],
    [layout.yTitle, false],
    ...(layout.current ? [[layout.current.label, true] as [PlacedText, boolean]] : []),
  ];
  for (const [label, bold] of outside) {
    const [start, end] = textSpan(label, bold);
    expect(start).toBeGreaterThanOrEqual(-0.01);
    expect(end).toBeLessThanOrEqual(width + 0.01);
    expect(label.baseline).toBeLessThan(layout.height);
  }
  // Day labels do not overlap each other.
  const dayLabels = layout.xTicks
    .flatMap((tick) => (tick.label ? [textSpan(tick.label, tick.routine)] : []))
    .sort((a, b) => a[0] - b[0]);
  for (let index = 1; index < dayLabels.length; index += 1) {
    expect((dayLabels[index] as [number, number])[0]).toBeGreaterThan((dayLabels[index - 1] as [number, number])[1]);
  }
  // Every band keeps its name: the plot is tall enough for it.
  expect(layout.bands.every((band) => band.label !== null)).toBe(true);
  // The text inside a band stays inside that band.
  for (const band of layout.bands) {
    expect(band.label && band.label.baseline).toBeLessThan(band.y + band.height);
  }
}

describe('layoutHistoryChart', () => {
  it('places every control where the two scales say, each eye a little to one side of the day', () => {
    const given = input(900, B_OD, B_OS);
    const layout = layoutHistoryChart(given);
    const x = linearScale({ min: 0, max: 180 }, layout.plot.left, layout.plot.right);
    const y = linearScale(given.domain, layout.plot.bottom, layout.plot.top);
    const [od, os] = layout.series;
    expect(od?.eye).toBe('OD');
    expect(os?.eye).toBe('OS');
    expect(od?.points.map((point) => point.flightDay)).toEqual([30, 90, 118, 150]);
    const first = od?.points[0];
    const mirrored = os?.points[0];
    expect(first?.y).toBeCloseTo(y(15));
    expect(first?.yLow).toBeCloseTo(y(7));
    expect(first?.yHigh).toBeCloseTo(y(23));
    expect(mirrored?.y).toBeCloseTo(y(10));
    expect(((first?.x ?? 0) + (mirrored?.x ?? 0)) / 2).toBeCloseTo(x(30));
    expect(first?.x).toBeLessThan(mirrored?.x ?? 0);
    expect(layout.origin).toEqual({ x: x(0), y: y(0) });
    expect(od?.line[0]).toEqual(layout.origin);
    expect(od?.line).toHaveLength(5);
  });

  it('runs the day axis from 0 to the end of the mission and marks the routine days', () => {
    const layout = layoutHistoryChart(input(900, B_OD, B_OS));
    expect(layout.xTicks.map((tick) => tick.day)).toEqual([0, 30, 60, 90, 120, 150, 180]);
    expect(layout.xTicks.filter((tick) => tick.routine).map((tick) => tick.day)).toEqual([30, 90, 150]);
    expect(layout.routineLines).toHaveLength(3);
    expect(layout.xTicks[0]?.x).toBeCloseTo(layout.plot.left);
    expect(layout.xTicks.at(-1)?.x).toBeCloseTo(layout.plot.right);
  });

  it('keeps the labels of the routine days when a narrow screen has no room for all of them', () => {
    const layout = layoutHistoryChart(input(280, B_OD, B_OS));
    const labelled = layout.xTicks.filter((tick) => tick.label !== null).map((tick) => tick.day);
    for (const day of [30, 90, 150]) expect(labelled).toContain(day);
  });

  it('draws the same three bands as the number line, as horizontal strips', () => {
    const given = input(900, B_OD, B_OS);
    const layout = layoutHistoryChart(given);
    const y = linearScale(given.domain, layout.plot.bottom, layout.plot.top);
    expect(layout.bands.map((band) => band.id)).toEqual(['normal-variation', 'first-sign', 'clinically-concerning']);
    const [normal, first, concerning] = layout.bands;
    expect((normal?.y ?? 0) + (normal?.height ?? 0)).toBeCloseTo(layout.plot.bottom);
    expect(normal?.y).toBeCloseTo(y(19.4));
    expect(first?.y).toBeCloseTo(y(55));
    expect(concerning?.y).toBeCloseTo(layout.plot.top);
    expect(layout.thresholdLines.map((line) => [line.kind, line.label.text])).toEqual([
      ['first-sign', '19.4 µm · NASA'],
      ['clinically-concerning', '55 µm · NASA'],
    ]);
    expect(layout.zero.y).toBeCloseTo(y(0));
  });

  it('writes the name of the normal band under the 0 line, clear of a change that stays just above 0', () => {
    const layout = layoutHistoryChart(input(900, B_OD, B_OS));
    const normal = layout.bands.find((band) => band.id === 'normal-variation');
    expect(normal?.label?.baseline).toBeGreaterThan(layout.zero.y);
    expect(normal?.label?.baseline).toBeLessThan(layout.plot.bottom);
    const first = layout.bands.find((band) => band.id === 'first-sign');
    expect(first?.label?.baseline).toBeLessThan((first?.y ?? 0) + 30);
  });

  it('marks a control without measurement apart, at the foot of the chart, and keeps the line through the rest', () => {
    const layout = layoutHistoryChart(input(900, [[30, 15], [90, null], [150, 31]], B_OS));
    const od = layout.series[0];
    expect(od?.points.map((point) => point.flightDay)).toEqual([30, 150]);
    expect(od?.unmeasured.map((mark) => mark.flightDay)).toEqual([90]);
    expect(od?.unmeasured[0]?.y).toBeGreaterThan(layout.zero.y);
    expect(od?.unmeasured[0]?.y).toBeLessThan(layout.plot.bottom);
    expect(od?.line).toHaveLength(3);
  });

  it('tells the controls done in this browser from the ones that come with the application', () => {
    const layout = layoutHistoryChart(input(900, B_OD, B_OS, { currentDay: 150 }));
    expect(layout.series[0]?.points.map((point) => point.live)).toEqual([false, false, false, true]);
  });

  it('has one focus area per control, wide enough to touch and not overlapping the next', () => {
    const layout = layoutHistoryChart(input(318, D_OD, D_OS));
    expect(layout.columns.map((column) => column.flightDay)).toEqual([30, 51, 72, 90, 111, 132, 150]);
    for (let index = 1; index < layout.columns.length; index += 1) {
      const before = layout.columns[index - 1];
      const after = layout.columns[index];
      expect(after?.left).toBeGreaterThanOrEqual((before?.left ?? 0) + (before?.width ?? 0) - 0.01);
    }
    const wide = layoutHistoryChart(input(900, B_OD, B_OS));
    expect(wide.columns.every((column) => column.width === 44)).toBe(true);
  });

  it('marks today on the day axis, and leaves it out when there is no current control', () => {
    const withToday = layoutHistoryChart(input(900, B_OD, B_OS, { currentDay: 150 }));
    expect(withToday.current?.label.text).toBe('today');
    expect(withToday.current?.x).toBeCloseTo(withToday.xTicks.find((tick) => tick.day === 150)?.x ?? -1);
    const without = layoutHistoryChart(input(900, B_OD, B_OS, { currentDay: null }));
    expect(without.current).toBeNull();
    expect(without.plot.top).toBeLessThan(withToday.plot.top);
  });

  it('grows taller for a long change axis, so every band still has room for its name', () => {
    const normal = layoutHistoryChart(input(318, B_OD, B_OS));
    const extreme = layoutHistoryChart(input(318, D_OD, D_OS));
    expect(extreme.plot.bottom - extreme.plot.top).toBeGreaterThan(normal.plot.bottom - normal.plot.top);
    expectReadable(extreme);
  });

  it('draws an empty chart for a crew member with no in-flight control yet', () => {
    const layout = layoutHistoryChart(input(600, [], [], { currentDay: 30 }));
    expect(layout.columns).toEqual([]);
    expect(layout.series.every((series) => series.points.length === 0 && series.line.length === 1)).toBe(true);
    expectReadable(layout);
  });

  it.each([280, 318, 390, 520, 720, 1000, 1240])('is readable at %i px, in both languages', (width) => {
    for (const locale of ['en', 'es'] as const) {
      expectReadable(layoutHistoryChart(input(width, B_OD, B_OS, { locale })));
      expectReadable(layoutHistoryChart(input(width, D_OD, D_OS, { locale })));
      expectReadable(layoutHistoryChart(input(width, [[30, 6], [90, 8], [150, 9]], [[30, 4], [90, 5], [150, 6]], { locale })));
      expectReadable(layoutHistoryChart(input(width, [[30, 27], [90, 48], [150, 66]], [[30, 15], [90, 27], [150, 38]], { locale })));
    }
  });

  it('gives the same drawing for the same input', () => {
    const given = input(390, D_OD, D_OS);
    expect(layoutHistoryChart(given)).toEqual(layoutHistoryChart(given));
  });
});
