import { useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import type { ScanFrame } from './examStore';
import { ringLimitColumns, ringOf, scanToCanvas, type ColumnMask } from './geometry';
import { drawSimulatedMark, grayCanvas, overlayInk, prepareCanvas, strokeMark, useDevicePixelRatio, useElementWidth } from './canvasKit';

export interface LayerSet {
  ilm: boolean;
  bm: boolean;
  bmo: boolean;
  rings: boolean;
  zone: boolean;
}

export const LAYER_KEYS: readonly (keyof LayerSet)[] = ['ilm', 'bm', 'bmo', 'rings', 'zone'];
export const ALL_LAYERS: LayerSet = { ilm: true, bm: true, bmo: true, rings: true, zone: true };
/** While a capture runs, only what the engine has just marked on the scan. */
export const CAPTURE_LAYERS: LayerSet = { ilm: true, bm: true, bmo: true, rings: false, zone: false };

interface Props {
  frame: ScanFrame;
  layers: LayerSet;
  /** Distance of every column to the ring ellipse, µm; needed for rings and zone. */
  distancesUm?: Float64Array | null;
  /** Columns of the selected measure. */
  mask?: ColumnMask | null;
  size?: 'fit' | 'actual';
  /** Pixel size, to draw a 200 µm scale bar. */
  scaleUm?: { x: number; z: number } | null;
  label: string;
  mark: string;
  scaleText?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLCanvasElement>) => void;
}

function polyline(ctx: CanvasRenderingContext2D, rows: Float32Array, sizeX: number, sizeZ: number, w: number, h: number): void {
  ctx.beginPath();
  let open = false;
  for (let j = 0; j < rows.length; j++) {
    const r = rows[j]!;
    if (Number.isNaN(r)) {
      open = false;
      continue;
    }
    const p = scanToCanvas(j, r, sizeX, sizeZ, w, h);
    if (open) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
    open = true;
  }
}

/**
 * One B-scan with what the engine marked on it, as layers that can be switched on and off.
 * The image is not touched. The marks are white over a dark casing and are told apart by
 * their stroke, not by colour: solid (retina surface), dashed (base membrane), a ring (the
 * opening points), dotted (the ring limits).
 */
export function BScanCanvas({ frame, layers, distancesUm, mask, size = 'fit', scaleUm, label, mark, scaleText = '200 µm', onKeyDown }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const available = useElementWidth(wrap);
  const dpr = useDevicePixelRatio();
  const { width: sizeX, height: sizeZ, analysis } = frame;
  const cssWidth = size === 'actual' ? sizeX / dpr : available;
  const cssHeight = (cssWidth * sizeZ) / sizeX;

  useLayoutEffect(() => {
    const element = canvas.current;
    if (!element || cssWidth <= 0) return;
    const ctx = prepareCanvas(element, cssWidth, cssHeight, dpr);
    if (!ctx) return;
    const ink = overlayInk(element);
    const w = cssWidth;
    const h = cssHeight;
    const colW = w / sizeX;
    ctx.imageSmoothingEnabled = size !== 'actual';
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(grayCanvas(frame.gray, sizeX, sizeZ), 0, 0, w, h);

    if (layers.zone && distancesUm) {
      ctx.fillStyle = ink.line;
      ctx.globalAlpha = 0.14;
      for (let j = 0; j < sizeX; j++) if (ringOf(distancesUm[j]!) === 0) ctx.fillRect(j * colW, 0, colW + 0.5, h);
      ctx.globalAlpha = 1;
    }
    if (mask) {
      ctx.fillStyle = ink.line;
      for (let j = 0; j < sizeX; j++) {
        const m = mask[j]!;
        if (m === 0) continue;
        ctx.globalAlpha = m === 2 ? 0.9 : 0.3;
        ctx.fillRect(j * colW, 0, colW + 0.5, 6);
        if (m === 2) {
          const top = scanToCanvas(j, analysis.ilmPx[j]!, sizeX, sizeZ, w, h).y;
          const bottom = scanToCanvas(j, analysis.bmPx[j]!, sizeX, sizeZ, w, h).y;
          ctx.globalAlpha = 0.2;
          ctx.fillRect(j * colW, top, colW + 0.5, bottom - top);
        }
      }
      ctx.globalAlpha = 1;
    }
    if (layers.rings && distancesUm) {
      ctx.font = `500 11px ${ink.font}`;
      ctx.textAlign = 'center';
      let lastLabelX = -Infinity;
      for (const { column, limitUm } of ringLimitColumns(distancesUm).sort((a, b) => a.column - b.column)) {
        const x = (column + 0.5) * colW;
        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.lineCap = 'round';
        ctx.strokeStyle = ink.line;
        ctx.lineWidth = 2;
        ctx.setLineDash([0.1, 6]);
        ctx.beginPath();
        ctx.moveTo(x, 26);
        ctx.lineTo(x, h);
        ctx.stroke();
        ctx.restore();
        // On a narrow screen neighbouring limits get close: skip a label rather than overlap it.
        if (x - lastLabelX < 30) continue;
        const text = String(limitUm);
        const tw = ctx.measureText(text).width + 8;
        ctx.fillStyle = ink.casing;
        ctx.fillRect(x - tw / 2, 8, tw, 16);
        ctx.fillStyle = ink.line;
        ctx.fillText(text, x, 20);
        lastLabelX = x;
      }
      ctx.textAlign = 'start';
    }
    if (layers.ilm) {
      polyline(ctx, analysis.ilmPx, sizeX, sizeZ, w, h);
      strokeMark(ctx, ink, 1.5);
    }
    if (layers.bm) {
      polyline(ctx, analysis.bmPx, sizeX, sizeZ, w, h);
      strokeMark(ctx, ink, 1.5, [7, 5]);
    }
    if (layers.bmo) {
      const radius = Math.min(Math.max(w * 0.0117, 3.5), 7);
      for (const point of analysis.bmo) {
        if (!point) continue;
        const p = scanToCanvas(point.columnPx, point.rowPx, sizeX, sizeZ, w, h);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = ink.casing;
        ctx.fill();
        ctx.strokeStyle = ink.line;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    if (scaleUm) {
      // 200 µm in both directions, bottom right: the simulated-data mark has the bottom left.
      const bx = (200 / scaleUm.x) * colW;
      const bz = (200 / scaleUm.z) * (h / sizeZ);
      ctx.beginPath();
      ctx.moveTo(w - 12 - bx, h - 12 - bz);
      ctx.lineTo(w - 12 - bx, h - 12);
      ctx.lineTo(w - 12, h - 12);
      strokeMark(ctx, ink, 1.5);
      ctx.font = `500 11px ${ink.font}`;
      const tw = ctx.measureText(scaleText).width;
      ctx.fillStyle = ink.casing;
      ctx.fillRect(w - 12 - bx + 5, h - 34, tw + 8, 16);
      ctx.fillStyle = ink.line;
      ctx.fillText(scaleText, w - 12 - bx + 9, h - 22);
    }
    drawSimulatedMark(ctx, mark, ink, h);
  }, [frame, analysis, layers, distancesUm, mask, cssWidth, cssHeight, dpr, size, sizeX, sizeZ, scaleUm, mark, scaleText]);

  return (
    <div ref={wrap} className={`oct-lienzo${size === 'actual' ? ' oct-lienzo--real' : ''}`}>
      <canvas ref={canvas} role="img" aria-label={label} tabIndex={onKeyDown ? 0 : undefined} onKeyDown={onKeyDown} />
    </div>
  );
}
