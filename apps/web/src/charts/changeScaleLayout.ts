/**
 * Geometry of the change number line (`ChangeScale`). A pure function from the
 * values, the texts and the available width to the position of every mark and
 * label, so it can be tested without a browser: nothing overlaps, nothing is cut.
 *
 * The drawing is the "change scale" of the design system: the axis is the line, and it
 * changes colour at every threshold; the thresholds are dashed lines with their value
 * above; today is a disc with its range as a bar, and earlier controls are small hollow
 * discs; under every stretch of the line, the shape and the name of its band.
 *
 * All lengths are CSS pixels. Vertical metrics are multiples of the label font
 * size, so the drawing follows the type scale of the design tokens.
 */
import { bands, linearScale, tickStep, ticks, type BandId, type ChangeThresholds, type Domain } from './scale';
import { spansCollide, wrapLines, type Measure } from './text';

export interface ChangeScaleInput {
  width: number;
  /** Size of the labels (design token `--text-xs`, resolved to pixels). */
  fontPx: number;
  measure: Measure;
  domain: Domain;
  thresholds: ChangeThresholds;
  bandNames: Readonly<Record<BandId, string>>;
  /** The label of 0, the pre-flight exam. */
  zeroLabel: string;
  /** The value of each threshold as it is written above its line, such as "19.4 µm". */
  firstSignLabel: string;
  clinicallyConcerningLabel: string;
  tickLabel: (valueUm: number) => string;
  today: { valueUm: number; lowUm: number | null; highUm: number | null } | null;
  /** Earlier controls, with what is said about each under the pointer. */
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
  /** Left edge of the label: its shape, then its name. */
  x: number;
  /** Width of the whole label, shape included. */
  width: number;
  /** Left edge of the name. */
  textX: number;
  /** Baseline of the first line. */
  baseline: number;
  /** The shape of the band's alert class, a square of this side at this corner. */
  shape: { x: number; y: number; size: number };
}

export type AxisLabelKind = 'tick' | 'zero' | 'first-sign' | 'clinically-concerning';

export interface AxisLabel {
  kind: AxisLabelKind;
  valueUm: number;
  /** Where the value is on the axis. */
  anchorX: number;
  /** Centre of the label. A threshold value sits beside its line, so it differs from `anchorX`. */
  x: number;
  width: number;
  text: string;
  baseline: number;
}

export interface ChangeScaleLayout {
  width: number;
  height: number;
  lineHeight: number;
  /** The stretch of the drawing the axis runs along. */
  plot: { left: number; right: number };
  /** Height of the axis line. */
  lineY: number;
  /** `inline`: band names under their own stretch. `stacked`: one row per name, when they do not fit side by side. */
  bandMode: 'inline' | 'stacked';
  bands: BandBox[];
  bandLabels: BandLabel[];
  /** The mark of 0, the pre-flight exam: a short solid line across the axis. */
  zero: { x: number; y1: number; y2: number } | null;
  thresholdLines: { kind: 'first-sign' | 'clinically-concerning'; x: number; y1: number; y2: number }[];
  /** Small marks on the axis for the round values that are labelled. */
  tickMarks: { x: number; y1: number; y2: number }[];
  axisLabels: AxisLabel[];
  today: { x: number; y: number; r: number; range: { x1: number; x2: number; height: number } | null } | null;
  previous: { x: number; y: number; r: number; label: string }[];
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), Math.max(min, max));

export function layoutChangeScale(input: ChangeScaleInput): ChangeScaleLayout {
  const { width, fontPx: f, measure, domain, thresholds } = input;
  const lineHeight = Math.round(f * 1.2 * 10) / 10;
  // Room at both ends for today's disc and its halo, so a value at the edge of the scale is not cut.
  const side = Math.round(f * 0.9);
  const left = side;
  const right = Math.max(left + 1, width - side);
  const x = linearScale(domain, left, right);
  const inPlot = (valueUm: number): number => clamp(x(valueUm), left, right);

  // ---- Vertical metrics: two rows of numbers, the line, and the band names under it.
  const topBaseline = Math.round(f * 0.85);
  const lineY = Math.round(f * 2.85);
  const zeroHalf = Math.round(f * 0.85);
  const secondBaseline = lineY - zeroHalf - Math.round(f * 0.3);

  const bandBoxes: BandBox[] = bands(domain, thresholds).map((band) => ({
    id: band.id,
    x: x(band.from),
    width: Math.max(0, x(band.to) - x(band.from)),
  }));

  // ---- Threshold values: beside their dashed line, on the top row. To its right, or to its left at the end of the scale.
  const gap = f * 0.5;
  const beside = f * 0.3;
  const axisLabels: AxisLabel[] = [];
  const specials = [
    { kind: 'first-sign' as const, valueUm: thresholds.firstSignUm, text: input.firstSignLabel },
    { kind: 'clinically-concerning' as const, valueUm: thresholds.clinicallyConcerningUm, text: input.clinicallyConcerningLabel },
  ].filter((special) => special.valueUm > domain.min && special.valueUm < domain.max);
  const thresholdXs = specials.map((special) => x(special.valueUm));
  // Placed from the last one back, so each knows where the next one starts.
  let nextStart = width;
  const placed: AxisLabel[] = [];
  for (let index = specials.length - 1; index >= 0; index -= 1) {
    const special = specials[index] as (typeof specials)[number];
    const anchorX = x(special.valueUm);
    const labelWidth = measure(special.text, f, true);
    let start = anchorX + beside;
    if (start + labelWidth > nextStart - gap) start = Math.min(start, nextStart - gap - labelWidth);
    // No room on the right without covering its own line: it goes on the left of it.
    if (start < anchorX + beside - 0.5) start = Math.min(anchorX - beside - labelWidth, nextStart - gap - labelWidth);
    start = clamp(start, 0, width - labelWidth);
    placed.unshift({ kind: special.kind, valueUm: special.valueUm, anchorX, x: start + labelWidth / 2, width: labelWidth, text: special.text, baseline: topBaseline });
    nextStart = start;
  }
  // A last pass from the left guarantees that no two overlap, whatever the width.
  let previousEnd = -Infinity;
  for (const label of placed) {
    const start = Math.max(label.x - label.width / 2, previousEnd + gap);
    label.x = Math.min(start, Math.max(0, width - label.width)) + label.width / 2;
    previousEnd = label.x + label.width / 2;
  }
  axisLabels.push(...placed);

  // ---- 0, the pre-flight exam: a short solid mark with its number above it, on the second row.
  const hasZero = domain.min <= 0 && domain.max >= 0;
  const secondRow: AxisLabel[] = [];
  if (hasZero) {
    const zeroWidth = measure(input.zeroLabel, f);
    secondRow.push({
      kind: 'zero',
      valueUm: 0,
      anchorX: x(0),
      x: clamp(x(0), zeroWidth / 2, width - zeroWidth / 2),
      width: zeroWidth,
      text: input.zeroLabel,
      baseline: secondBaseline,
    });
  }

  // ---- Round values, only where the scale has no other reference: beyond the thresholds and below zero.
  const tickMarks: { x: number; y1: number; y2: number }[] = [];
  const step = tickStep(domain, right - left, f * 3.2);
  const referenceXs = [...(hasZero ? [x(0)] : []), ...thresholdXs];
  for (const valueUm of ticks(domain, step)) {
    if (valueUm <= domain.min || valueUm >= domain.max) continue;
    if (valueUm >= 0 && valueUm <= thresholds.clinicallyConcerningUm) continue;
    const anchorX = x(valueUm);
    if (referenceXs.some((referenceX) => Math.abs(referenceX - anchorX) < f * 2.6)) continue;
    const text = input.tickLabel(valueUm);
    const labelWidth = measure(text, f);
    const centre = clamp(anchorX, labelWidth / 2, width - labelWidth / 2);
    if (secondRow.some((other) => spansCollide(centre, labelWidth, other.x, other.width, gap))) continue;
    // A dashed threshold line runs through this row: a number is never struck through by one.
    if (thresholdXs.some((lineX) => Math.abs(lineX - centre) < labelWidth / 2 + 2)) continue;
    secondRow.push({ kind: 'tick', valueUm, anchorX, x: centre, width: labelWidth, text, baseline: secondBaseline });
    tickMarks.push({ x: anchorX, y1: lineY - f * 0.35, y2: lineY });
  }
  axisLabels.push(...secondRow);
  axisLabels.sort((a, b) => a.valueUm - b.valueUm);

  // ---- Today: a disc on the line, with its range as a bar. Earlier controls: small hollow discs.
  const today = input.today
    ? {
        x: inPlot(input.today.valueUm),
        y: lineY,
        r: f * 0.64,
        range:
          input.today.lowUm !== null && input.today.highUm !== null
            ? { x1: inPlot(input.today.lowUm), x2: inPlot(input.today.highUm), height: Math.max(4, Math.round(f * 0.43)) }
            : null,
      }
    : null;
  const previous = input.previous.map((mark) => ({ x: inPlot(mark.valueUm), y: lineY, r: f * 0.36, label: mark.label }));

  // ---- Band names: the shape of the class and the name, under the stretch they name.
  const shapeSize = f;
  const shapeGap = f * 0.3;
  const labelsTop = lineY + f;
  const blockWidth = (lines: readonly string[]): number =>
    shapeSize + shapeGap + lines.reduce((widest, line) => Math.max(widest, measure(line, f)), 0);
  const names = bandBoxes.map((band) => input.bandNames[band.id]);
  /** One line, and two lines when the name can be broken: the choices for each name, shortest first. */
  const choices: string[][][] = names.map((name) => {
    const one = [name];
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length < 2) return [one];
    const widestWord = words.reduce((widest, word) => Math.max(widest, measure(word, f)), 0);
    const two = wrapLines(name, Math.max(widestWord, measure(name, f) * 0.62), f, measure);
    return two && two.length === 2 ? [one, two] : [one];
  });
  const lastIndex = bandBoxes.length - 1;
  const place = (lines: readonly (readonly string[])[]): number[] | null => {
    const lefts: number[] = [];
    for (let index = 0; index < bandBoxes.length; index += 1) {
      const band = bandBoxes[index] as BandBox;
      const blockW = blockWidth(lines[index] as string[]);
      // The last name ends where the scale ends; the others start where their stretch starts.
      lefts.push(index === lastIndex ? right - blockW : band.x);
    }
    for (let index = 0; index < lefts.length; index += 1) {
      const start = lefts[index] as number;
      const end = start + blockWidth(lines[index] as string[]);
      if (start < -0.01 || end > width + 0.01) return null;
      if (index > 0) {
        const before = (lefts[index - 1] as number) + blockWidth(lines[index - 1] as string[]);
        if (start - before < gap) return null;
      }
    }
    return lefts;
  };
  // Every combination of one and two lines, the ones with fewer lines first.
  const combos: string[][][] = [[]];
  for (const options of choices) {
    const next: string[][][] = [];
    for (const combo of combos) for (const option of options) next.push([...combo, option]);
    combos.splice(0, combos.length, ...next);
  }
  combos.sort((a, b) => a.reduce((sum, lines) => sum + lines.length, 0) - b.reduce((sum, lines) => sum + lines.length, 0));
  let inline: { lines: string[][]; lefts: number[] } | null = null;
  for (const combo of combos) {
    const lefts = place(combo);
    if (lefts) {
      inline = { lines: combo, lefts };
      break;
    }
  }

  const bandLabels: BandLabel[] = [];
  let bottom: number;
  const label = (id: BandId, lines: string[], start: number, top: number): BandLabel => ({
    id,
    lines,
    x: start,
    width: blockWidth(lines),
    textX: start + shapeSize + shapeGap,
    baseline: top + f * 0.82,
    shape: { x: start, y: top + (lineHeight - shapeSize) / 2, size: shapeSize },
  });
  if (inline) {
    const { lines, lefts } = inline;
    bandBoxes.forEach((band, index) => bandLabels.push(label(band.id, lines[index] as string[], lefts[index] as number, labelsTop)));
    bottom = labelsTop + Math.max(...lines.map((entry) => entry.length)) * lineHeight;
  } else {
    // One row per name, each starting under its own stretch as far as the drawing allows.
    let top = labelsTop;
    bandBoxes.forEach((band, index) => {
      const name = names[index] as string;
      const room = width - shapeSize - shapeGap;
      const lines = measure(name, f) <= room ? [name] : (wrapLines(name, room, f, measure) ?? [name]);
      bandLabels.push(label(band.id, lines, clamp(band.x, 0, width - blockWidth(lines)), top));
      top += lines.length * lineHeight + f * 0.25;
    });
    bottom = top - f * 0.25;
  }

  return {
    width,
    height: Math.ceil(bottom + f * 0.2),
    lineHeight,
    plot: { left, right },
    lineY,
    bandMode: inline ? 'inline' : 'stacked',
    bands: bandBoxes,
    bandLabels,
    zero: hasZero ? { x: x(0), y1: lineY - zeroHalf, y2: lineY + zeroHalf } : null,
    thresholdLines: specials.map((special) => ({ kind: special.kind, x: x(special.valueUm), y1: 0, y2: lineY + zeroHalf })),
    tickMarks,
    axisLabels,
    today,
    previous,
  };
}
