import { useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import type { ScanFrame } from './examStore';
import { ringLimitColumns, ringOf, scanToCanvas, type ColumnMask } from './geometry';
import { cssColor, drawSimulatedMark, grayCanvas, prepareCanvas, useDevicePixelRatio, useElementWidth } from './canvasKit';

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
  ctx.stroke();
}

/** One B-scan with what the engine marked on it, as layers that can be switched on and off. */
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
    const w = cssWidth;
    const h = cssHeight;
    const colW = w / sizeX;
    ctx.imageSmoothingEnabled = size !== 'actual';
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(grayCanvas(frame.gray, sizeX, sizeZ), 0, 0, w, h);

    if (layers.zone && distancesUm) {
      ctx.fillStyle = cssColor(element, '--oct-zone');
      ctx.globalAlpha = 0.18;
      for (let j = 0; j < sizeX; j++) if (ringOf(distancesUm[j]!) === 0) ctx.fillRect(j * colW, 0, colW + 0.5, h);
      ctx.globalAlpha = 1;
    }
    if (mask) {
      const color = cssColor(element, '--oct-measure');
      ctx.fillStyle = color;
      for (let j = 0; j < sizeX; j++) {
        const m = mask[j]!;
        if (m === 0) continue;
        ctx.globalAlpha = m === 2 ? 0.9 : 0.3;
        ctx.fillRect(j * colW, 0, colW + 0.5, 8);
        if (m === 2) {
          const top = scanToCanvas(j, analysis.ilmPx[j]!, sizeX, sizeZ, w, h).y;
          const bottom = scanToCanvas(j, analysis.bmPx[j]!, sizeX, sizeZ, w, h).y;
          ctx.globalAlpha = 0.22;
          ctx.fillRect(j * colW, top, colW + 0.5, bottom - top);
        }
      }
      ctx.globalAlpha = 1;
    }
    if (layers.rings && distancesUm) {
      ctx.strokeStyle = cssColor(element, '--oct-ring');
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 4]);
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (const { column, limitUm } of ringLimitColumns(distancesUm)) {
        const x = (column + 0.5) * colW;
        ctx.beginPath();
        ctx.moveTo(x, 12);
        ctx.lineTo(x, h);
        ctx.stroke();
        ctx.fillText(String(limitUm), x, 22);
      }
      ctx.setLineDash([]);
      ctx.textAlign = 'start';
    }
    if (layers.ilm) {
      ctx.strokeStyle = cssColor(element, '--oct-ilm');
      ctx.lineWidth = 2;
      polyline(ctx, analysis.ilmPx, sizeX, sizeZ, w, h);
    }
    if (layers.bm) {
      ctx.strokeStyle = cssColor(element, '--oct-bm');
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 4]);
      polyline(ctx, analysis.bmPx, sizeX, sizeZ, w, h);
      ctx.setLineDash([]);
    }
    if (layers.bmo) {
      ctx.strokeStyle = cssColor(element, '--oct-bmo');
      ctx.lineWidth = 2;
      for (const point of analysis.bmo) {
        if (!point) continue;
        const p = scanToCanvas(point.columnPx, point.rowPx, sizeX, sizeZ, w, h);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
        ctx.moveTo(p.x - 9, p.y);
        ctx.lineTo(p.x + 9, p.y);
        ctx.moveTo(p.x, p.y - 9);
        ctx.lineTo(p.x, p.y + 9);
        ctx.stroke();
      }
    }
    if (scaleUm) {
      // 200 µm in both directions, bottom left.
      const bx = (200 / scaleUm.x) * colW;
      const bz = (200 / scaleUm.z) * (h / sizeZ);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, h - 10 - bz);
      ctx.lineTo(10, h - 10);
      ctx.lineTo(10 + bx, h - 10);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.fillText(scaleText, 14, h - 16);
    }
    drawSimulatedMark(ctx, mark, w, h);
  }, [frame, analysis, layers, distancesUm, mask, cssWidth, cssHeight, dpr, size, sizeX, sizeZ, scaleUm, mark, scaleText]);

  return (
    <div ref={wrap} className={`oct-canvas-wrap${size === 'actual' ? ' oct-canvas-wrap--actual' : ''}`}>
      <canvas
        ref={canvas}
        className="oct-canvas"
        role="img"
        aria-label={label}
        tabIndex={onKeyDown ? 0 : undefined}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
