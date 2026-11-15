/**
 * Text geometry for the charts: how wide a label is, how it wraps, and how a row
 * of labels is spread so that none overlaps another. Pure functions.
 */

/** Width in pixels of a text at a font size. In the browser it is measured; elsewhere it is estimated. */
export type Measure = (text: string, fontPx: number, bold?: boolean) => number;

const NARROW = new Set("iljtfrI1.,:;'|!()[] ".split(''));
const WIDE = new Set('mwMW%@—'.split(''));

/**
 * Estimate for a sans-serif face, on the generous side so a label that fits the
 * estimate also fits on screen. Used where there is no canvas (tests, first paint).
 */
export const estimateTextWidth: Measure = (text, fontPx, bold = false) => {
  let em = 0;
  for (const char of text) {
    if (NARROW.has(char)) em += 0.36;
    else if (WIDE.has(char)) em += 0.92;
    else if (char >= '0' && char <= '9') em += 0.6;
    else if (char !== char.toLowerCase()) em += 0.7;
    else em += 0.58;
  }
  return em * fontPx * (bold ? 1.06 : 1);
};

/**
 * Breaks a text into lines no wider than `maxWidth`, at spaces. Returns null when
 * a single word is wider than the line: the caller then needs another layout.
 */
export function wrapLines(
  text: string,
  maxWidth: number,
  fontPx: number,
  measure: Measure,
  bold = false,
): string[] | null {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (measure(word, fontPx, bold) > maxWidth) return null;
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(candidate, fontPx, bold) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function widestLine(lines: readonly string[], fontPx: number, measure: Measure, bold = false): number {
  return lines.reduce((widest, line) => Math.max(widest, measure(line, fontPx, bold)), 0);
}

export interface RowItem {
  /** Where the label wants its centre. */
  anchor: number;
  width: number;
}

export function rowFits(items: readonly RowItem[], min: number, max: number, gap: number): boolean {
  const total = items.reduce((sum, item) => sum + item.width, 0) + gap * Math.max(0, items.length - 1);
  return total <= max - min + 1e-6;
}

/**
 * Centres for a row of labels, as close to their anchors as possible without
 * overlapping each other or leaving `[min, max]`. Two labels that collide move
 * apart by the same amount. Items must come sorted by anchor. When the row does
 * not fit at all, the overflow goes to the left: check `rowFits` first.
 */
export function spreadRow(items: readonly RowItem[], min: number, max: number, gap: number): number[] {
  const count = items.length;
  const width = (index: number): number => (items[index] as RowItem).width;
  const clamp = (centre: number, index: number): number =>
    Math.min(Math.max(centre, min + width(index) / 2), Math.max(min + width(index) / 2, max - width(index) / 2));
  const centres = items.map((item, index) => clamp(item.anchor, index));
  const at = (index: number): number => centres[index] as number;

  // Relax: every colliding pair shares the push, so neither label strays more than it has to.
  for (let round = 0; round < 60; round += 1) {
    let moved = false;
    for (let index = 1; index < count; index += 1) {
      const overlap = at(index - 1) + width(index - 1) / 2 + gap - (at(index) - width(index) / 2);
      if (overlap > 1e-6) {
        centres[index - 1] = at(index - 1) - overlap / 2;
        centres[index] = at(index) + overlap / 2;
        moved = true;
      }
    }
    for (let index = 0; index < count; index += 1) centres[index] = clamp(at(index), index);
    if (!moved) break;
  }

  // Guarantee: one pass to the right, then one back from the end.
  for (let index = 1; index < count; index += 1) {
    const least = at(index - 1) + width(index - 1) / 2 + gap + width(index) / 2;
    if (at(index) < least) centres[index] = least;
  }
  for (let index = count - 1; index >= 0; index -= 1) {
    const most =
      index === count - 1 ? max - width(index) / 2 : at(index + 1) - width(index + 1) / 2 - gap - width(index) / 2;
    if (at(index) > most) centres[index] = most;
  }
  return centres;
}

/**
 * Splits labels (sorted by anchor) over as few rows as needed for each row to
 * fit, dealing them out in turn so neighbours land on different rows. Returns,
 * for each row, the indices of its items.
 */
export function splitIntoRows(
  items: readonly RowItem[],
  min: number,
  max: number,
  gap: number,
  maxRows: number,
): number[][] {
  for (let rowCount = 1; rowCount <= maxRows; rowCount += 1) {
    const rows: number[][] = Array.from({ length: rowCount }, () => []);
    items.forEach((_, index) => (rows[index % rowCount] as number[]).push(index));
    const fits = rows.every((row) => rowFits(row.map((index) => items[index] as RowItem), min, max, gap));
    if (fits || rowCount === maxRows) return rows.filter((row) => row.length > 0);
  }
  return [items.map((_, index) => index)];
}

/** Whether two horizontal spans, given by centre and width, are closer than `gap`. */
export function spansCollide(
  centreA: number,
  widthA: number,
  centreB: number,
  widthB: number,
  gap: number,
): boolean {
  return Math.abs(centreA - centreB) < (widthA + widthB) / 2 + gap;
}
