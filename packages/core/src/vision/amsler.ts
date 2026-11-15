/**
 * Geometry and summary of the Amsler grid. Research doc `pruebas-de-vision-en-pantalla.md`,
 * sections 1.B and 4. The test draws no conclusion: the product rules decide what to do.
 */
import type { AmslerMarkKind, AmslerResult, Eye } from '../contract';

const DEG_PER_RAD = 180 / Math.PI;

/** Each square covers 1° of visual field in Amsler's chart. Section 1.B (A1 p. 525–526). */
export const AMSLER_CELL_DEG = 1;
/** Amsler's chart is 20 × 20 squares (20° × 20°). Section 1.B (A1). */
export const AMSLER_MAX_GRID = 20;
/** Marks within this central field around the fixation dot are reported apart. Spec 03, section 3. */
export const AMSLER_CENTRAL_FIELD_DEG = 2;

export const AMSLER_MARK_KINDS: readonly AmslerMarkKind[] = ['wavy', 'blurred', 'missing'];

export type AmslerMark = AmslerResult['marks'][number];

/** Side of a square that covers `cellDeg` at this distance: 2 × d × tan(cellDeg / 2). 6.98 mm for 1° at 40 cm. */
export function amslerCellMm(distanceCm: number, cellDeg: number = AMSLER_CELL_DEG): number {
  return 2 * distanceCm * 10 * Math.tan(cellDeg / DEG_PER_RAD / 2);
}

/** Visual angle of a square of `cellMm`, centred on the line of sight. */
export function amslerCellDeg(cellMm: number, distanceCm: number): number {
  return 2 * Math.atan(cellMm / (2 * distanceCm * 10)) * DEG_PER_RAD;
}

/** Field covered by a centred grid of `gridSize` squares of `cellMm` each, degrees per side. */
export function amslerFieldDeg(gridSize: number, cellMm: number, distanceCm: number): number {
  return amslerCellDeg(gridSize * cellMm, distanceCm);
}

/**
 * Largest even number of squares, up to 20, whose grid fits in `availableMm` (the shorter
 * side of the space on screen). Even, so the fixation dot falls on a line crossing.
 * Zero when not even 2 × 2 fit.
 */
export function amslerGridSizeThatFits(availableMm: number, cellMm: number): number {
  const fit = Math.floor(availableMm / cellMm + 1e-9);
  return Math.max(0, Math.min(AMSLER_MAX_GRID, fit - (fit % 2)));
}

/** Indices along one axis whose squares reach into the central field. */
function centralIndices(gridSize: number, cellDeg: number): number[] {
  const half = AMSLER_CENTRAL_FIELD_DEG / 2;
  const indices: number[] = [];
  for (let i = 0; i < gridSize; i++) {
    const startDeg = (i - gridSize / 2) * cellDeg;
    if (startDeg < half && startDeg + cellDeg > -half) indices.push(i);
  }
  return indices;
}

/** Whether a square lies (even partly) within the central 2° around the fixation dot. */
export function isCentralAmslerCell(col: number, row: number, gridSize: number, cellDeg: number = AMSLER_CELL_DEG): boolean {
  const indices = centralIndices(gridSize, cellDeg);
  return indices.includes(col) && indices.includes(row);
}

/** All squares within the central 2°, row by row. With 1° squares: the four around the dot. */
export function amslerCentralCells(gridSize: number, cellDeg: number = AMSLER_CELL_DEG): { col: number; row: number }[] {
  const indices = centralIndices(gridSize, cellDeg);
  return indices.flatMap((row) => indices.map((col) => ({ col, row })));
}

/** Marks or erases one square (`kind` null erases). Returns a new list in row-major order. */
export function setAmslerMark(
  marks: readonly AmslerMark[],
  col: number,
  row: number,
  kind: AmslerMarkKind | null,
): AmslerMark[] {
  const rest = marks.filter((mark) => mark.col !== col || mark.row !== row);
  return sortMarks(kind === null ? rest : [...rest, { col, row, kind }]);
}

function sortMarks(marks: AmslerMark[]): AmslerMark[] {
  return marks.sort((a, b) => a.row - b.row || a.col - b.col);
}

export interface AmslerAnswers {
  eye: Eye;
  gridSize: number;
  cellDeg: number;
  marks: readonly AmslerMark[];
  cornersSeen: boolean;
}

/**
 * The result of one eye: marks inside the grid, one per square (the last one wins),
 * the fraction of the grid marked and whether any mark is in the central 2°.
 */
export function summarizeAmsler(answers: AmslerAnswers): AmslerResult {
  const { eye, gridSize, cellDeg, cornersSeen } = answers;
  const byCell = new Map<string, AmslerMark>();
  for (const mark of answers.marks) {
    if (!Number.isInteger(mark.col) || !Number.isInteger(mark.row)) continue;
    if (mark.col < 0 || mark.row < 0 || mark.col >= gridSize || mark.row >= gridSize) continue;
    byCell.set(`${mark.col},${mark.row}`, { col: mark.col, row: mark.row, kind: mark.kind });
  }
  const marks = sortMarks([...byCell.values()]);
  return {
    eye,
    gridSize,
    cellDeg,
    marks,
    markedFraction: gridSize > 0 ? marks.length / (gridSize * gridSize) : 0,
    centralMarked: marks.some((mark) => isCentralAmslerCell(mark.col, mark.row, gridSize, cellDeg)),
    cornersSeen,
  };
}
