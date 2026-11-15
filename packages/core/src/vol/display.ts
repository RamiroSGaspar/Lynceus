/**
 * Display transform of eyepy [C3] (sans-spectralis-datos.md 1.4):
 * grey = (ln(value + 0.000244) + 8.3) / 8.285, clipped to [0, 1]; invalid → 0.
 */
import { INVALID_VALUE } from './format';

const OFFSET = 0.000244;
const SHIFT = 8.3;
const SPAN = 8.285;

/** Grey level in [0, 1] of one linear reflectivity value. */
export function displayGray(value: number): number {
  if (!(value < INVALID_VALUE)) return 0;
  const g = (Math.log(value + OFFSET) + SHIFT) / SPAN;
  if (!(g > 0)) return 0;
  return g > 1 ? 1 : g;
}

/** Linear reflectivity that displays as grey `g` (inverse of `displayGray`). */
export function reflectivityForGray(g: number): number {
  return Math.exp(g * SPAN - SHIFT) - OFFSET;
}

/** Converts a B-scan to 8-bit grey levels for display, as the instrument shows it. */
export function toDisplayGray(pixels: Float32Array): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels.length);
  for (let i = 0; i < pixels.length; i++) out[i] = displayGray(pixels[i]!) * 255;
  return out;
}
