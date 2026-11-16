import { useLayoutEffect, useRef, type MouseEvent } from 'react';
import type { Ellipse } from '@app/core/math/ellipse';
import { RINGS_UM } from '@app/core';
import type { FundusFrame } from './examStore';
import { ellipseOffset, nearestScan, ocularWindow, patternCentre, type FundusWindow, type Point, type ScanLine } from './geometry';
import { drawSimulatedMark, grayCanvas, overlayInk, prepareCanvas, strokeMark, useDevicePixelRatio, useElementWidth } from './canvasKit';

/** A tap selects a scan when it falls this close to its line, mm. */
const PICK_DISTANCE_MM = 0.25;

/** The square of fundus a view shows: the window around the pattern, or the whole image. */
export function fundusWindow(fundus: FundusFrame, scaleXMm: number, scaleYMm: number, centre: Point | null, whole = false): FundusWindow {
  const fieldXMm = fundus.width * scaleXMm;
  const fieldYMm = fundus.height * scaleYMm;
  if (whole) return { x0: 0, y0: 0, side: Math.max(fieldXMm, fieldYMm) };
  return ocularWindow(fieldXMm, fieldYMm, centre ?? { x: fieldXMm / 2, y: fieldYMm / 2 });
}

/** Draws the window of the fundus image, untouched: no filter, no added contrast, no colour. */
function drawFundus(ctx: CanvasRenderingContext2D, fundus: FundusFrame, scaleXMm: number, scaleYMm: number, window: FundusWindow, size: number): void {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    grayCanvas(fundus.gray, fundus.width, fundus.height),
    window.x0 / scaleXMm,
    window.y0 / scaleYMm,
    window.side / scaleXMm,
    window.side / scaleYMm,
    0,
    0,
    size,
    size,
  );
}

/** The fundus image alone, for the ocular: what is drawn over it there is vector, laid on top. */
export function FundusImage({ fundus, scaleXMm, scaleYMm, window }: { fundus: FundusFrame; scaleXMm: number; scaleYMm: number; window: FundusWindow }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const size = useElementWidth(wrap);
  const dpr = useDevicePixelRatio();
  useLayoutEffect(() => {
    const element = canvas.current;
    if (!element || size <= 0) return;
    const ctx = prepareCanvas(element, size, size, dpr);
    if (ctx) drawFundus(ctx, fundus, scaleXMm, scaleYMm, window, size);
  }, [fundus, scaleXMm, scaleYMm, window.x0, window.y0, window.side, size, dpr]);
  return (
    <div ref={wrap} className="co-ocular__imagen">
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  );
}

interface Props {
  fundus: FundusFrame;
  scaleXMm: number;
  scaleYMm: number;
  lines: readonly (ScanLine | undefined)[];
  /** Whether each scan taken so far is usable; undefined while not taken. */
  usable: readonly (boolean | undefined)[];
  highlight: number | null;
  ellipse?: Ellipse | null;
  showRings?: boolean;
  points?: readonly Point[];
  columnDots?: readonly { x: number; y: number; used: boolean }[];
  whole?: boolean;
  onSelect?: (index: number) => void;
  label: string;
  mark: string;
}

/**
 * The fundus image of the viewer, square and whole, with the star pattern, the opening and
 * the rings. What the engine marked is white over a dark casing and is told apart by its
 * stroke: solid (the opening), dashed (the 250 µm limit), dotted (the outer limits).
 */
export function FundusCanvas(props: Props) {
  const { fundus, scaleXMm, scaleYMm, lines, usable, highlight, ellipse, showRings, points, columnDots, whole, onSelect, label, mark } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const size = useElementWidth(wrap);
  const dpr = useDevicePixelRatio();
  const window = fundusWindow(fundus, scaleXMm, scaleYMm, patternCentre(lines), whole);
  const { x0, y0, side } = window;

  useLayoutEffect(() => {
    const element = canvas.current;
    if (!element || size <= 0) return;
    const ctx = prepareCanvas(element, size, size, dpr);
    if (!ctx) return;
    const ink = overlayInk(element);
    const k = size / side;
    const at = (p: Point): Point => ({ x: (p.x - x0) * k, y: (p.y - y0) * k });
    drawFundus(ctx, fundus, scaleXMm, scaleYMm, { x0, y0, side }, size);

    // The scans: a thin line each; dashed and fainter when not usable.
    ctx.lineCap = 'round';
    ctx.strokeStyle = ink.line;
    lines.forEach((line, index) => {
      if (!line || index === highlight) return;
      const a = at({ x: line.startXMm, y: line.startYMm });
      const b = at({ x: line.endXMm, y: line.endYMm });
      const ok = usable[index] !== false;
      ctx.lineWidth = 1;
      ctx.setLineDash(ok ? [] : [2, 5]);
      ctx.globalAlpha = ok ? 0.5 : 0.75;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    if (ellipse) {
      const contour = (pts: Point[]) => {
        ctx.beginPath();
        pts.forEach((p, i) => {
          const q = at(p);
          if (i === 0) ctx.moveTo(q.x, q.y);
          else ctx.lineTo(q.x, q.y);
        });
        ctx.closePath();
      };
      contour(ellipseOffset(ellipse, 0));
      strokeMark(ctx, ink, 1.5);
      if (showRings) {
        RINGS_UM.forEach(([, outer], ring) => {
          contour(ellipseOffset(ellipse, outer));
          // The first limit closes the measured band: dashed. The outer ones: dotted.
          if (ring === 0) strokeMark(ctx, ink, 1.5, [7, 5]);
          else {
            ctx.save();
            ctx.globalAlpha = 0.75;
            ctx.lineCap = 'round';
            ctx.strokeStyle = ink.line;
            ctx.lineWidth = 2;
            ctx.setLineDash([0.1, 6]);
            ctx.stroke();
            ctx.restore();
          }
        });
      }
    }
    if (columnDots) {
      ctx.fillStyle = ink.line;
      for (const dot of columnDots) {
        const q = at(dot);
        ctx.globalAlpha = dot.used ? 0.9 : 0.3;
        ctx.fillRect(q.x - 1, q.y - 1, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    if (points) {
      for (const p of points) {
        const q = at(p);
        ctx.beginPath();
        ctx.moveTo(q.x - 3, q.y - 3);
        ctx.lineTo(q.x + 3, q.y + 3);
        ctx.moveTo(q.x - 3, q.y + 3);
        ctx.lineTo(q.x + 3, q.y - 3);
        strokeMark(ctx, ink, 1.25);
      }
    }
    const line = highlight !== null ? lines[highlight] : undefined;
    if (line) {
      const a = at({ x: line.startXMm, y: line.startYMm });
      const b = at({ x: line.endXMm, y: line.endYMm });
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      strokeMark(ctx, ink, 3);
      // A dot at its start: the left edge of the scan.
      ctx.beginPath();
      ctx.arc(a.x, a.y, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = ink.line;
      ctx.fill();
      ctx.strokeStyle = ink.casing;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    drawSimulatedMark(ctx, mark, ink, size);
  }, [fundus, scaleXMm, scaleYMm, lines, usable, highlight, ellipse, showRings, points, columnDots, size, dpr, side, x0, y0, mark]);

  const onClick = onSelect
    ? (event: MouseEvent<HTMLCanvasElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const k = side / rect.width;
        const p = { x: x0 + (event.clientX - rect.left) * k, y: y0 + (event.clientY - rect.top) * k };
        const index = nearestScan(lines, p, PICK_DISTANCE_MM);
        if (index !== null) onSelect(index);
      }
    : undefined;

  return (
    <div ref={wrap} className="oct-lienzo oct-lienzo--cuadrado">
      <canvas ref={canvas} className={onSelect ? 'is-elegible' : undefined} role="img" aria-label={label} onClick={onClick} />
    </div>
  );
}
