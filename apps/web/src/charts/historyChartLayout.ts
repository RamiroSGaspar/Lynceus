/**
 * Geometry of the evolution chart (`HistoryChart`): change in micrometres
 * against flight day, one series per eye. A pure function, like the layout of
 * the number line, so that it can be tested without a browser.
 */
import type { Eye } from '@app/core';
import { bands, linearScale, tickStep, ticks, type BandId, type ChangeThresholds, type Domain } from './scale';
import type { Measure } from './text';

export interface HistoryPointInput {
  flightDay: number;
  /** Null when the eye could not be measured at that control. */
  valueUm: number | null;
  lowUm: number | null;
  highUm: number | null;
  /** Done in this browser, as opposed to coming with the application. */
  live: boolean;
}

export interface HistoryChartInput {
  width: number;
  fontPx: number;
  measure: Measure;
  /** Length of the mission: the day axis goes from 0 to this. */
  durationDays: number;
  routineDays: readonly number[];
  domain: Domain;
  thresholds: ChangeThresholds;
  bandNames: Readonly<Record<BandId, string>>;
  thresholdLabels: { firstSign: string; clinicallyConcerning: string };
  zeroLabel: string;
  tickLabel: (value: number) => string;
  yTitle: string;
  xTitle: string;
  series: readonly { eye: Eye; points: readonly HistoryPointInput[] }[];
  /** The control of "today": marked on the day axis. */
  currentDay: number | null;
  currentLabel: string;
}

export interface PlacedText {
  text: string;
  x: number;
  baseline: number;
  anchor: 'start' | 'middle' | 'end';
}

export interface HistoryPoint {
  flightDay: number;
  x: number;
  y: number;
  /** Ends of the range bar, when the value has a range. */
  yLow: number | null;
  yHigh: number | null;
  live: boolean;
}

export interface HistorySeries {
  eye: Eye;
  /** Where the line passes: the pre-flight exam, then every measured control. */
  line: { x: number; y: number }[];
  points: HistoryPoint[];
  /** Controls where this eye could not be measured: drawn apart, at the foot of the chart. */
  unmeasured: { flightDay: number; x: number; y: number }[];
}

export interface HistoryChartLayout {
  width: number;
  height: number;
  plot: { left: number; right: number; top: number; bottom: number };
  bands: { id: BandId; y: number; height: number; label: PlacedText | null }[];
  thresholdLines: { kind: 'first-sign' | 'clinically-concerning'; y: number; label: PlacedText }[];
  zero: { y: number; label: PlacedText };
  yTicks: { value: number; y: number; label: PlacedText }[];
  xTicks: { day: number; x: number; routine: boolean; label: PlacedText | null }[];
  routineLines: number[];
  current: { x: number; label: PlacedText } | null;
  /** The pre-flight exam: flight day 0, change 0 by definition. */
  origin: { x: number; y: number };
  series: HistorySeries[];
  /** One per control: the area that shows its details when pointed at or focused. */
  columns: { flightDay: number; x: number; left: number; width: number }[];
  yTitle: PlacedText;
  xTitle: PlacedText;
  tickLength: number;
  /** Sizes of the marks, so the legend can draw the same ones. */
  mark: { radius: number; cap: number };
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), Math.max(min, max));

export function layoutHistoryChart(input: HistoryChartInput): HistoryChartLayout {
  const { width, fontPx: f, measure, domain, thresholds } = input;
  const lineHeight = Math.round(f * 1.3);
  const tickLength = f * 0.35;
  const radius = f * 0.38;

  // The plot is tall enough for every strip between two reference lines to hold a line of text.
  const span = domain.max - domain.min;
  const narrowestStripUm = Math.min(
    thresholds.firstSignUm,
    0 - domain.min,
    thresholds.clinicallyConcerningUm - thresholds.firstSignUm,
    domain.max - thresholds.clinicallyConcerningUm,
  );
  const neededHeight = narrowestStripUm > 0 ? ((lineHeight + 4) / narrowestStripUm) * span : 0;
  const plotHeight = Math.round(clamp(Math.max(clamp(width * 0.52, 230, 340), neededHeight), 230, 620));

  const yStep = tickStep(domain, plotHeight, f * 2.4);
  const yValues = ticks(domain, yStep);
  const yLabelWidth = Math.max(...yValues.map((value) => measure(input.tickLabel(value), f, value === 0)));
  const left = Math.ceil(yLabelWidth + tickLength + f * 0.45);
  const right = Math.max(left + 1, width - Math.round(f * 0.8));
  const top = lineHeight + f * 0.4 + (input.currentDay === null ? 0 : lineHeight);
  const bottom = top + plotHeight;

  const x = linearScale({ min: 0, max: input.durationDays }, left, right);
  const y = linearScale(domain, bottom, top);
  const inset = f * 0.5;

  const bandBoxes = bands(domain, thresholds).map((band) => {
    const bandTop = y(band.to);
    const height = y(band.from) - bandTop;
    const name = input.bandNames[band.id];
    const nameWidth = measure(name, f, true);
    const room = right - left - nameWidth;
    const fits = height >= lineHeight + 2 && room >= 0;
    // A change that stays in the normal band runs just above 0 all the way across, so the name of
    // that band goes under the 0 line, beside "before the flight", when both fit there.
    const underZero =
      band.id === 'normal-variation' &&
      band.from < 0 &&
      y(band.from) - y(0) >= lineHeight + 2 &&
      nameWidth + measure(input.zeroLabel, f) + 2 * inset + f <= right - left;
    return {
      id: band.id,
      y: bandTop,
      height,
      label: fits
        ? ({
            text: name,
            x: left + Math.min(inset, room / 2),
            baseline: (underZero ? y(0) : bandTop) + f * 1.1,
            anchor: 'start',
          } as PlacedText)
        : null,
    };
  });

  const thresholdLine = (
    kind: 'first-sign' | 'clinically-concerning',
    valueUm: number,
    text: string,
  ): HistoryChartLayout['thresholdLines'][number] => ({
    kind,
    y: y(valueUm),
    label: { text, x: right - inset, baseline: y(valueUm) - f * 0.4, anchor: 'end' },
  });

  // Day axis: a tick every 30 days when there is room, every 60 otherwise; routine days always.
  const dayStep = [30, 60, 90].find((step) => (x(step) - x(0)) >= f * 2.8) ?? 90;
  const dayValues = [...new Set([...ticks({ min: 0, max: input.durationDays }, dayStep), ...input.routineDays])]
    .filter((day) => day >= 0 && day <= input.durationDays)
    .sort((a, b) => a - b);
  const labelBaseline = bottom + tickLength + f * 1.15;
  // Routine days get their label first; the rest only where there is room left.
  const routine = new Set(input.routineDays);
  const placed = new Map<number, PlacedText>();
  const tryPlace = (day: number): void => {
    const text = input.tickLabel(day);
    const labelWidth = measure(text, f, routine.has(day));
    const centre = clamp(x(day), labelWidth / 2, width - labelWidth / 2);
    const collides = [...placed.values()].some(
      (other) => Math.abs(other.x - centre) < (measure(other.text, f, true) + labelWidth) / 2 + f * 0.4,
    );
    if (!collides) placed.set(day, { text, x: centre, baseline: labelBaseline, anchor: 'middle' });
  };
  for (const day of dayValues) if (routine.has(day)) tryPlace(day);
  for (const day of dayValues) if (!routine.has(day)) tryPlace(day);
  const xTicks: HistoryChartLayout['xTicks'] = dayValues.map((day) => ({
    day,
    x: x(day),
    routine: routine.has(day),
    label: placed.get(day) ?? null,
  }));

  // Series: the two eyes stand a little to each side of the day, so their range bars do not hide each other.
  const offsets = input.series.map((_, index) => (index - (input.series.length - 1) / 2) * f * 0.8);
  const series: HistorySeries[] = input.series.map(({ eye, points }, index) => {
    const dx = offsets[index] as number;
    const measured: HistoryPoint[] = [];
    const unmeasured: HistorySeries['unmeasured'] = [];
    for (const point of [...points].sort((a, b) => a.flightDay - b.flightDay)) {
      const px = x(point.flightDay) + dx;
      if (point.valueUm === null) {
        unmeasured.push({ flightDay: point.flightDay, x: px, y: bottom - f * 0.75 });
      } else {
        measured.push({
          flightDay: point.flightDay,
          x: px,
          y: y(point.valueUm),
          yLow: point.lowUm === null ? null : y(point.lowUm),
          yHigh: point.highUm === null ? null : y(point.highUm),
          live: point.live,
        });
      }
    }
    return {
      eye,
      line: [{ x: x(0), y: y(0) }, ...measured.map((point) => ({ x: point.x, y: point.y }))],
      points: measured,
      unmeasured,
    };
  });

  const controlDays = [...new Set(input.series.flatMap(({ points }) => points.map((point) => point.flightDay)))].sort(
    (a, b) => a - b,
  );
  const columns = controlDays.map((flightDay, index) => {
    const centre = x(flightDay);
    const previous = controlDays[index - 1];
    const next = controlDays[index + 1];
    const reach = Math.min(
      22,
      previous === undefined ? 22 : (centre - x(previous)) / 2,
      next === undefined ? 22 : (x(next) - centre) / 2,
    );
    return { flightDay, x: centre, left: centre - reach, width: reach * 2 };
  });

  const current =
    input.currentDay === null
      ? null
      : (() => {
          const labelWidth = measure(input.currentLabel, f, true);
          const centre = clamp(x(input.currentDay), labelWidth / 2, width - labelWidth / 2);
          return {
            x: x(input.currentDay),
            label: { text: input.currentLabel, x: centre, baseline: top - f * 0.45, anchor: 'middle' } as PlacedText,
          };
        })();

  return {
    width,
    height: Math.ceil(labelBaseline + lineHeight + f * 0.4),
    plot: { left, right, top, bottom },
    bands: bandBoxes,
    thresholdLines: [
      thresholdLine('first-sign', thresholds.firstSignUm, input.thresholdLabels.firstSign),
      thresholdLine('clinically-concerning', thresholds.clinicallyConcerningUm, input.thresholdLabels.clinicallyConcerning),
    ],
    zero: {
      y: y(0),
      label: { text: input.zeroLabel, x: right - inset, baseline: y(0) + f * 1.1, anchor: 'end' },
    },
    yTicks: yValues.map((value) => ({
      value,
      y: y(value),
      label: { text: input.tickLabel(value), x: left - tickLength - f * 0.25, baseline: y(value) + f * 0.35, anchor: 'end' },
    })),
    xTicks,
    routineLines: input.routineDays.filter((day) => day > 0 && day <= input.durationDays).map((day) => x(day)),
    current,
    origin: { x: x(0), y: y(0) },
    series,
    columns,
    yTitle: { text: input.yTitle, x: 0, baseline: f * 0.95, anchor: 'start' },
    xTitle: { text: input.xTitle, x: (left + right) / 2, baseline: labelBaseline + lineHeight, anchor: 'middle' },
    tickLength,
    mark: { radius, cap: f * 0.28 },
  };
}
