/**
 * RGB canvas for inspection images: grey backgrounds, coloured overlays and the
 * simulated-data mark on every image (AGENTS.md rule 8).
 */
import { SIMULATED_MARK, textMask } from '@app/core/instrument/font';
import { encodePng } from './png';

export type Rgb = readonly [number, number, number];

export const COLORS = {
  ilm: [255, 210, 0] as Rgb,
  bm: [0, 220, 255] as Rgb,
  bmo: [255, 40, 40] as Rgb,
  ring: [80, 255, 80] as Rgb,
  ellipse: [255, 80, 200] as Rgb,
  scan: [90, 160, 255] as Rgb,
  truth: [255, 255, 255] as Rgb,
};

export class Canvas {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height * 3);
  }

  static fromGray(gray: Uint8Array | Uint8ClampedArray, width: number, height: number): Canvas {
    const c = new Canvas(width, height);
    for (let i = 0; i < width * height; i++) {
      c.data[3 * i] = gray[i]!;
      c.data[3 * i + 1] = gray[i]!;
      c.data[3 * i + 2] = gray[i]!;
    }
    return c;
  }

  set(x: number, y: number, color: Rgb, alpha = 1): void {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= this.width || yi >= this.height) return;
    const o = 3 * (yi * this.width + xi);
    for (let k = 0; k < 3; k++) this.data[o + k] = Math.round(this.data[o + k]! * (1 - alpha) + color[k]! * alpha);
  }

  dot(x: number, y: number, radius: number, color: Rgb): void {
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) if (dx * dx + dy * dy <= radius * radius) this.set(x + dx, y + dy, color);
  }

  line(x0: number, y0: number, x1: number, y1: number, color: Rgb, alpha = 1): void {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) + 1;
    for (let i = 0; i <= n; i++) this.set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, color, alpha);
  }

  /** Polyline through (i, ys[i]); NaN breaks it. */
  curve(ys: ArrayLike<number>, color: Rgb): void {
    for (let i = 1; i < ys.length; i++) {
      const a = ys[i - 1]!;
      const b = ys[i]!;
      if (Number.isNaN(a) || Number.isNaN(b)) continue;
      this.line(i - 1, a, i, b, color);
    }
  }

  text(text: string, x: number, y: number, scale: number): void {
    const m = textMask(text, scale);
    for (let yy = 0; yy < m.height; yy++) for (let xx = 0; xx < m.width; xx++) this.set(x + xx, y + yy, m.mask[yy * m.width + xx] ? [240, 240, 240] : [16, 16, 16]);
  }

  /** Places another canvas at (x, y). */
  blit(src: Canvas, x: number, y: number): void {
    for (let yy = 0; yy < src.height; yy++) {
      for (let xx = 0; xx < src.width; xx++) {
        const o = 3 * (yy * src.width + xx);
        this.set(x + xx, y + yy, [src.data[o]!, src.data[o + 1]!, src.data[o + 2]!]);
      }
    }
  }

  /** PNG bytes, with the simulated-data mark in the lower-left corner. */
  png(): Uint8Array {
    const m = textMask(SIMULATED_MARK, 2);
    this.text(SIMULATED_MARK, 4, this.height - m.height - 4, 2);
    return encodePng(this.width, this.height, this.data, 3);
  }
}
