/**
 * Geometry of the change number line (`ChangeScale`). A pure function from the
 * values, the texts and the available width to the position of every mark and
 * label, so it can be tested without a browser: nothing overlaps, nothing is cut.
 *
 * All lengths are CSS pixels. Vertical metrics are multiples of the label font
 * size, so the drawing follows the type scale of the design tokens.
 */
import { bands, linearScale, tickStep, ticks, type BandId, type ChangeThresholds, type Domain } from './scale';
import { spansCollide, splitIntoRows, spreadRow, widestLine, wrapLines, type Measure, type RowItem } from './text';

/** A number under the axis with a word under it, such as "19.4 µm" over "NASA". */
export interface AxisNote {
  value: string;
  note: string;
}

export interface ChangeScaleInput {
  width: number;
  /** Size of the labels (design token `--text-xs`, resolved to pixels). */
  fontPx: number;
  /** Size of today's value (design token `--text-lg`). */
  valueFontPx: number;
  measure: Measure;
  domain: Domain;
  thresholds: ChangeThresholds;
  bandNames: Readonly<Record<BandId, string>>;
  zero: AxisNote;
  firstSign: AxisNote;
  clinicallyConcerning: AxisNote;
  tickLabel: (valueUm: number) => string;
  today: {
    valueUm: number;
    lowUm: number | null;
    highUm: number | null;
    valueLabel: string;
    rangeLabel: string | null;
  } | null;
  previous: readonly { valueUm: number; label: string }[];
}

export interface BandBox {
  id: BandId;
  x: number;
  width: number;
}

export interface BandLabel {
  id: BandId;
  lines: string[];
  x: number;
  anchor: 'start' | 'middle' | 'end';
  /** Baseline of the first line. */
  baseline: number;
  /** In the stacked layout, the bar under the name that spans the band. */
  extent: { x1: number; x2: number; y: number } | null;
}

export type AxisLabelKind = 'tick' | 'zero' | 'first-sign' | 'clinically-concerning';

export interface AxisLabel {
  kind: AxisLabelKind;
  valueUm: number;
  /** Where the value is on the axis. */
  anchorX: number;
  /** Centre of the label; differs from `anchorX` when it had to move aside. */
  x: number;
  width: number;
  lines: string[];
  /** Baseline of the first line. */
  baseline: number;
}

export interface TodayMark {
  x: number;
  y: number;
  /** Half the size of the diamond. */
  half: number;
  range: { x1: number; x2: number; cap: number } | null;
  chip: {
    x: number;
    y: number;
    width: number;
    height: number;
    valueBaseline: number;
    rangeBaseline: number | null;
  };
  pointer: { x: number; y1: number; y2: number };
}

export interface PreviousMark {
  x: number;
  y: number;
  r: number;
  label: string;
  labelX: number;
  labelWidth: number;
  labelBaseline: number;
}

export interface ChangeScaleLayout {
  width: number;
  height: number;
  lineHeight: number;
  plot: { left: number; right: number; top: number; bottom: number };
  /** Top of the part of the bands that holds the marks, under the band names. */
  contentTop: number;
  /** `inline`: band names inside their bands. `stacked`: one row per name above the bands, when they do not fit. */
  bandMode: 'inline' | 'stacked';
  bands: BandBox[];
  bandLabels: BandLabel[];
  zeroX: number;
  thresholdLines: { kind: 'first-sign' | 'clinically-concerning'; x: number }[];
  tickLength: number;
  /** Position of every tick mark on the axis, labelled or not. */
  tickMarks: number[];
  axisLabels: AxisLabel[];
  today: TodayMark | null;
  previous: PreviousMark[];
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), Math.max(min, max));

export function layoutChangeScale(input: ChangeScaleInput): ChangeScaleLayout {
  const { width, fontPx: f, valueFontPx, measure, domain, thresholds } = input;
  const lineHeight = Math.round(f * 1.3);
  const side = Math.round(f * 0.8);
  const left = side;
  const right = Math.max(left + 1, width - side);
  const x = linearScale(domain, left, right);
  const inPlot = (valueUm: number): number => clamp(x(valueUm), left, right);

  const bandBoxes: BandBox[] = bands(domain, thresholds).map((band) => ({
    id: band.id,
    x: x(band.from),
    width: Math.max(0, x(band.to) - x(band.from)),
  }));

  // ---- Band names: inside the bands when they fit (on one line, else on two), stacked above otherwise.
  const pad = f * 0.4;
  const names = bandBoxes.map((band) => input.bandNames[band.id]);
  let inline: string[][] | null = null;
  if (bandBoxes.every((band, index) => measure(names[index] as string, f, true) + 2 * pad <= band.width)) {
    inline = names.map((name) => [name]);
  } else {
    const wrapped = bandBoxes.map((band, index) =>
      band.width > 2 * pad ? wrapLines(names[index] as string, band.width - 2 * pad, f, measure, true) : null,
    );
    if (wrapped.every((lines) => lines !== null && lines.length <= 2)) inline = wrapped as string[][];
  }

  const bandLabels: BandLabel[] = [];
  let plotTop: number;
  let cursor: number;
  if (inline) {
    plotTop = 1;
    const lineCount = Math.max(...inline.map((lines) => lines.length));
    bandBoxes.forEach((band, index) => {
      bandLabels.push({
        id: band.id,
        lines: inline[index] as string[],
        x: band.x + band.width / 2,
        anchor: 'middle',
        baseline: plotTop + f * 1.25,
        extent: null,
      });
    });
    cursor = plotTop + f * 0.3 + lineCount * lineHeight + f * 0.2;
  } else {
    let rowTop = 0;
    bandBoxes.forEach((band, index) => {
      const name = names[index] as string;
      const textWidth = measure(name, f, true);
      let anchor: BandLabel['anchor'];
      let textX: number;
      if (band.x + textWidth <= width) {
        anchor = 'start';
        textX = band.x;
      } else if (band.x + band.width - textWidth >= 0) {
        anchor = 'end';
        textX = band.x + band.width;
      } else {
        anchor = 'middle';
        textX = clamp(band.x + band.width / 2, textWidth / 2, width - textWidth / 2);
      }
      bandLabels.push({
        id: band.id,
        lines: [name],
        x: textX,
        anchor,
        baseline: rowTop + f * 0.95,
        extent: { x1: band.x, x2: band.x + band.width, y: rowTop + lineHeight + f * 0.1 },
      });
      rowTop += lineHeight + f * 0.6;
    });
    plotTop = rowTop + f * 0.1;
    cursor = plotTop + f * 0.4;
  }

  const contentTop = cursor;

  // ---- Today's value: a chip with the number and its range, over a diamond with the range as a bar.
  let today: TodayMark | null = null;
  if (input.today) {
    const { valueUm, lowUm, highUm, valueLabel, rangeLabel } = input.today;
    const chipPadX = f * 0.55;
    const chipPadY = f * 0.3;
    const textWidth = Math.max(measure(valueLabel, valueFontPx, true), rangeLabel ? measure(rangeLabel, f) : 0);
    const chipWidth = Math.min(right - left, textWidth + 2 * chipPadX);
    const chipHeight = 2 * chipPadY + valueFontPx * 1.1 + (rangeLabel ? lineHeight : 0);
    const markX = inPlot(valueUm);
    const half = f * 0.62;
    const markY = cursor + chipHeight + f * 0.55 + half;
    today = {
      x: markX,
      y: markY,
      half,
      range: lowUm !== null && highUm !== null ? { x1: inPlot(lowUm), x2: inPlot(highUm), cap: f * 0.45 } : null,
      chip: {
        x: clamp(markX, left + chipWidth / 2, right - chipWidth / 2),
        y: cursor,
        width: chipWidth,
        height: chipHeight,
        valueBaseline: cursor + chipPadY + valueFontPx * 0.85,
        rangeBaseline: rangeLabel ? cursor + chipPadY + valueFontPx * 1.1 + f * 0.95 : null,
      },
      pointer: { x: markX, y1: cursor + chipHeight, y2: markY - half },
    };
    cursor = markY + half + f * 0.5;
  }

  // ---- Earlier controls: small marks with their day, spread so the days do not overlap.
  const previous: PreviousMark[] = [];
  if (input.previous.length > 0) {
    const r = f * 0.3;
    const markY = cursor + r + f * 0.1;
    const labelGap = f * 0.3;
    const sorted = input.previous
      .map((mark, index) => ({ ...mark, index, markX: inPlot(mark.valueUm) }))
      .sort((a, b) => a.markX - b.markX || a.index - b.index);
    const items: RowItem[] = sorted.map((mark) => ({ anchor: mark.markX, width: measure(mark.label, f) + f * 0.3 }));
    const rows = splitIntoRows(items, 0, width, labelGap, 3);
    rows.forEach((row, rowIndex) => {
      const centres = spreadRow(
        row.map((index) => items[index] as RowItem),
        0,
        width,
        labelGap,
      );
      row.forEach((itemIndex, position) => {
        const mark = sorted[itemIndex] as (typeof sorted)[number];
        previous.push({
          x: mark.markX,
          y: markY,
          r,
          label: mark.label,
          labelX: centres[position] as number,
          labelWidth: (items[itemIndex] as RowItem).width,
          labelBaseline: markY + r + f * 0.5 + rowIndex * lineHeight + f * 0.95,
        });
      });
    });
    cursor = markY + r + f * 0.5 + rows.length * lineHeight + f * 0.35;
  }

  if (!input.today && input.previous.length === 0) cursor += f * 2;
  const plotBottom = cursor;

  // ---- Axis: 0 ("before the flight") and the two thresholds always; round ticks where there is room left.
  const tickLength = f * 0.35;
  const labelTop = plotBottom + tickLength + f * 0.3;
  const labelGap = f * 0.5;
  interface Special {
    kind: AxisLabelKind;
    valueUm: number;
    lines: string[];
  }
  const buildSpecials = (wrapZeroNote: boolean): (Special & RowItem)[] => {
    const zeroNote = wrapZeroNote
      ? (wrapLines(input.zero.note, f * 4.6, f, measure) ?? [input.zero.note])
      : [input.zero.note];
    const specials: Special[] = [
      { kind: 'zero', valueUm: 0, lines: [input.zero.value, ...zeroNote] },
      {
        kind: 'first-sign',
        valueUm: thresholds.firstSignUm,
        lines: [input.firstSign.value, input.firstSign.note],
      },
      {
        kind: 'clinically-concerning',
        valueUm: thresholds.clinicallyConcerningUm,
        lines: [input.clinicallyConcerning.value, input.clinicallyConcerning.note],
      },
    ];
    return specials
      .filter((special) => special.valueUm >= domain.min && special.valueUm <= domain.max)
      .sort((a, b) => a.valueUm - b.valueUm)
      .map((special) => ({
        ...special,
        anchor: x(special.valueUm),
        width: Math.max(
          measure(special.lines[0] as string, f, true),
          widestLine(special.lines.slice(1), f, measure),
        ),
      }));
  };
  const ideal = (item: RowItem): number => clamp(item.anchor, item.width / 2, width - item.width / 2);
  let specials = buildSpecials(false);
  let centres = spreadRow(specials, 0, width, labelGap);
  if (specials.some((special, index) => Math.abs((centres[index] as number) - ideal(special)) > 0.5)) {
    // The labels had to move aside: give them room by breaking the note under 0 in two.
    specials = buildSpecials(true);
    centres = spreadRow(specials, 0, width, labelGap);
  }
  const axisLabels: AxisLabel[] = specials.map((special, index) => ({
    kind: special.kind,
    valueUm: special.valueUm,
    anchorX: special.anchor,
    x: centres[index] as number,
    width: special.width,
    lines: special.lines,
    baseline: labelTop + f * 0.95,
  }));

  const step = tickStep(domain, right - left, f * 3.2);
  const tickValues = ticks(domain, step);
  for (const valueUm of tickValues) {
    if (specials.some((special) => Math.abs(special.valueUm - valueUm) < 1e-9)) continue;
    const text = input.tickLabel(valueUm);
    const labelWidth = measure(text, f);
    const centre = clamp(x(valueUm), labelWidth / 2, width - labelWidth / 2);
    if (axisLabels.some((other) => spansCollide(centre, labelWidth, other.x, other.width, labelGap))) continue;
    axisLabels.push({
      kind: 'tick',
      valueUm,
      anchorX: x(valueUm),
      x: centre,
      width: labelWidth,
      lines: [text],
      baseline: labelTop + f * 0.95,
    });
  }
  axisLabels.sort((a, b) => a.valueUm - b.valueUm);
  const axisLines = Math.max(...axisLabels.map((label) => label.lines.length));

  return {
    width,
    height: Math.ceil(labelTop + axisLines * lineHeight + f * 0.2),
    lineHeight,
    plot: { left, right, top: plotTop, bottom: plotBottom },
    contentTop,
    bandMode: inline ? 'inline' : 'stacked',
    bands: bandBoxes,
    bandLabels,
    zeroX: x(0),
    thresholdLines: [
      { kind: 'first-sign' as const, x: x(thresholds.firstSignUm), valueUm: thresholds.firstSignUm },
      {
        kind: 'clinically-concerning' as const,
        x: x(thresholds.clinicallyConcerningUm),
        valueUm: thresholds.clinicallyConcerningUm,
      },
    ]
      .filter((line) => line.valueUm > domain.min && line.valueUm < domain.max)
      .map(({ kind, x: lineX }) => ({ kind, x: lineX })),
    tickLength,
    tickMarks: [...new Set([...tickValues, ...specials.map((special) => special.valueUm)])]
      .sort((a, b) => a - b)
      .map((valueUm) => x(valueUm)),
    axisLabels,
    today,
    previous,
  };
}
