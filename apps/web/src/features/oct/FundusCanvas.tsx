import { useLayoutEffect, useRef, type MouseEvent } from 'react';
import type { Ellipse } from '@app/core/math/ellipse';
import { RINGS_UM } from '@app/core';
import type { FundusFrame } from './examStore';
import { ellipseOffset, nearestScan, patternCentre, type Point, type ScanLine } from './geometry';
import { cssColor, drawSimulatedMark, grayCanvas, prepareCanvas, useDevicePixelRatio, useElementWidth } from './canvasKit';

/** Side of the square shown around the pattern when not showing the whole image, mm. */
const WINDOW_MM = 6;
/** A tap selects a scan when it falls this close to its line, mm. */
const PICK_DISTANCE_MM = 0.25;

interface Props {
  fundus: FundusFrame;
  scaleXMm: number;
  scaleYMm: number;
  lines: readonly (ScanLine | undefined)[];
  /** Whether each scan taken so far is usable; undefined while not taken. */
  usable: readonly (boolean | undefined)[];
  highlight: number | null;
  highlightKind: 'current' | 'selected';
  ellipse?: Ellipse | null;
  showRings?: boolean;
  points?: readonly Point[];
  columnDots?: readonly { x: number; y: number; used: boolean }[];
  whole?: boolean;
  onSelect?: (index: number) => void;
  label: string;
  mark: string;
}

/** The fundus image with the star pattern, the opening ellipse and the rings. */
export function FundusCanvas(props: Props) {
  const { fundus, scaleXMm, scaleYMm, lines, usable, highlight, highlightKind, ellipse, showRings, points, columnDots, whole, onSelect, label, mark } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const size = useElementWidth(wrap);
  const dpr = useDevicePixelRatio();
  const fieldXMm = fundus.width * scaleXMm;
  const fieldYMm = fundus.height * scaleYMm;
  const centre = patternCentre(lines) ?? { x: fieldXMm / 2, y: fieldYMm / 2 };
  const side = whole ? Math.max(fieldXMm, fieldYMm) : Math.min(WINDOW_MM, fieldXMm, fieldYMm);
  const x0 = whole ? 0 : Math.min(Math.max(centre.x - side / 2, 0), fieldXMm - side);
  const y0 = whole ? 0 : Math.min(Math.max(centre.y - side / 2, 0), fieldYMm - side);

  useLayoutEffect(() => {
    const element = canvas.current;
    if (!element || size <= 0) return;
    const ctx = prepareCanvas(element, size, size, dpr);
    if (!ctx) return;
    const k = size / side;
    const at = (p: Point): Point => ({ x: (p.x - x0) * k, y: (p.y - y0) * k });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(grayCanvas(fundus.gray, fundus.width, fundus.height), x0 / scaleXMm, y0 / scaleYMm, side / scaleXMm, side / scaleYMm, 0, 0, size, size);

    const usableColor = cssColor(element, '--oct-usable');
    const unusableColor = cssColor(element, '--oct-unusable');
    lines.forEach((line, index) => {
      if (!line || index === highlight) return;
      const a = at({ x: line.startXMm, y: line.startYMm });
      const b = at({ x: line.endXMm, y: line.endYMm });
      const ok = usable[index] !== false;
      ctx.strokeStyle = ok ? usableColor : unusableColor;
      ctx.lineWidth = ok ? 1 : 1.5;
      ctx.setLineDash(ok ? [] : [5, 4]);
      ctx.globalAlpha = ok ? 0.5 : 0.9;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    if (ellipse) {
      ctx.strokeStyle = cssColor(element, '--oct-ellipse');
      ctx.lineWidth = 2;
      const contour = (pts: Point[]) => {
        ctx.beginPath();
        pts.forEach((p, i) => {
          const q = at(p);
          if (i === 0) ctx.moveTo(q.x, q.y);
          else ctx.lineTo(q.x, q.y);
        });
        ctx.closePath();
        ctx.stroke();
      };
      contour(ellipseOffset(ellipse, 0));
      if (showRings) {
        ctx.strokeStyle = cssColor(element, '--oct-ring');
        ctx.lineWidth = 1.25;
        ctx.setLineDash([2, 3]);
        for (const [, outer] of RINGS_UM) contour(ellipseOffset(ellipse, outer));
        ctx.setLineDash([]);
      }
    }
    if (columnDots) {
      ctx.fillStyle = cssColor(element, '--oct-measure');
      for (const dot of columnDots) {
        const q = at(dot);
        ctx.globalAlpha = dot.used ? 0.9 : 0.3;
        ctx.fillRect(q.x - 1, q.y - 1, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    if (points) {
      ctx.strokeStyle = cssColor(element, '--oct-bmo');
      ctx.lineWidth = 1.5;
      for (const p of points) {
        const q = at(p);
        ctx.beginPath();
        ctx.moveTo(q.x - 3, q.y - 3);
        ctx.lineTo(q.x + 3, q.y + 3);
        ctx.moveTo(q.x - 3, q.y + 3);
        ctx.lineTo(q.x + 3, q.y - 3);
        ctx.stroke();
      }
    }
    const line = highlight !== null ? lines[highlight] : undefined;
    if (line) {
      const a = at({ x: line.startXMm, y: line.startYMm });
      const b = at({ x: line.endXMm, y: line.endYMm });
      ctx.strokeStyle = cssColor(element, highlightKind === 'current' ? '--oct-current' : '--oct-selected');
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
    drawSimulatedMark(ctx, mark, size, size);
  }, [fundus, scaleXMm, scaleYMm, lines, usable, highlight, highlightKind, ellipse, showRings, points, columnDots, size, dpr, side, x0, y0, mark]);

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
    <div ref={wrap} className="oct-canvas-wrap oct-canvas-wrap--square">
      <canvas ref={canvas} className={`oct-canvas${onSelect ? ' oct-canvas--pick' : ''}`} role="img" aria-label={label} onClick={onClick} />
    </div>
  );
}
