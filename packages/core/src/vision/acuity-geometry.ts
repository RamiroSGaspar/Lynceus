/**
 * Size of a Landolt C on screen, what a screen can draw, and acuity notations.
 * Formulas: research doc `pruebas-de-vision-en-pantalla.md`, section 1.A.
 */
import type { ScreenCalibration } from '../contract';

const DEG_PER_RAD = 180 / Math.PI;

/** Millimetres in one inch. */
export const MM_PER_INCH = 25.4;

/** Width of an ISO/IEC 7810 ID-1 card (bank card), used to calibrate the screen. Section 1.A (L1, F1). */
export const CARD_WIDTH_MM = 85.6;
/** Height of the same card; only used to draw it with the right proportions. */
export const CARD_HEIGHT_MM = 53.98;

/** Near test distance on the station: 16 inches, about 40 cm. Section 1.A (N2 p. 26). */
export const NEAR_TEST_DISTANCE_CM = 40;

/** Height of an optotype in strokes: a 5 × 5 grid; the gap of the C is one stroke. Section 1.A (P1, F1). */
export const OPTOTYPE_STROKES = 5;

/**
 * Thinnest stroke FrACT accepts when edges are anti-aliased: half a device pixel.
 * Section 1.A, "Regla de FrACT sobre píxeles" (F1).
 */
export const MIN_STROKE_PX_ANTIALIASED = 0.5;

/**
 * Best acuity a screen must be able to draw to measure normal vision well: 1.2 decimal
 * (−0.08 logMAR). Section 1.A, "Regla de FrACT sobre píxeles" (F1).
 */
export const NORMAL_VISION_FLOOR_LOGMAR = -Math.log10(1.2);

/** Minimum angle of resolution, arc minutes, for a logMAR value. */
export function logMarToMarArcmin(logMar: number): number {
  return 10 ** logMar;
}

export function logMarToDecimal(logMar: number): number {
  return 10 ** -logMar;
}

export function decimalToLogMar(decimal: number): number {
  return -Math.log10(decimal);
}

/** Denominator X of the Snellen fraction 20/X. */
export function logMarToSnellenDenominator(logMar: number): number {
  return 20 * 10 ** logMar;
}

export function snellenToLogMar(numerator: number, denominator: number): number {
  return Math.log10(denominator / numerator);
}

export interface OptotypeSize {
  heightMm: number;
  strokeMm: number;
}

/** alto_mm = 2 × d_mm × tan((5 × 10^logMAR / 60)° / 2); trazo = alto / 5. Section 1.A. */
export function optotypeSizeMm(logMar: number, distanceCm: number): OptotypeSize {
  const distanceMm = distanceCm * 10;
  const heightDeg = (OPTOTYPE_STROKES * logMarToMarArcmin(logMar)) / 60;
  const heightMm = 2 * distanceMm * Math.tan(heightDeg / DEG_PER_RAD / 2);
  return { heightMm, strokeMm: heightMm / OPTOTYPE_STROKES };
}

export interface OptotypeSizePx {
  heightPx: number;
  strokePx: number;
}

/** Same size in device pixels, with decimals (the figure is drawn with sub-pixel precision). */
export function optotypeSizePx(logMar: number, distanceCm: number, pxPerMm: number): OptotypeSizePx {
  const { heightMm, strokeMm } = optotypeSizeMm(logMar, distanceCm);
  return { heightPx: heightMm * pxPerMm, strokePx: strokeMm * pxPerMm };
}

/** Inverse of `optotypeSizeMm`: the logMAR of a figure whose stroke measures `strokeMm`. */
export function strokeMmToLogMar(strokeMm: number, distanceCm: number): number {
  const heightDeg = 2 * Math.atan((OPTOTYPE_STROKES * strokeMm) / (2 * distanceCm * 10)) * DEG_PER_RAD;
  return Math.log10((heightDeg * 60) / OPTOTYPE_STROKES);
}

/**
 * Finest logMAR this screen can draw at this distance with a stroke of `minStrokePx`
 * device pixels. 141 pixels per inch with one-pixel strokes gives +0.19 (section 1.A).
 */
export function screenFloorLogMar(
  pxPerMm: number,
  distanceCm: number,
  minStrokePx: number = MIN_STROKE_PX_ANTIALIASED,
): number {
  return strokeMmToLogMar(minStrokePx / pxPerMm, distanceCm);
}

/** Whether the screen can draw small enough figures to measure normal vision (F1). */
export function canMeasureNormalVision(floorLogMar: number): boolean {
  return floorLogMar <= NORMAL_VISION_FLOOR_LOGMAR;
}

/** Device pixels per millimetre from the width, in device pixels, of a rectangle matched to the card. */
export function pxPerMmFromCard(cardWidthPx: number): number {
  return cardWidthPx / CARD_WIDTH_MM;
}

/** The calibration stored after the card step. */
export function makeScreenCalibration(pxPerMm: number, viewingDistanceCm: number = NEAR_TEST_DISTANCE_CM): ScreenCalibration {
  return { pxPerMm, viewingDistanceCm, floorLogMar: screenFloorLogMar(pxPerMm, viewingDistanceCm) };
}
