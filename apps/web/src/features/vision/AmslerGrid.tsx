import type { AmslerMarkKind } from '@app/core';
import { setAmslerMark, type AmslerMark } from '@app/core/vision/index';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react';
import { useMessages } from '../../i18n';
import { amslerMessages } from './messages';
import { AMSLER_BACKGROUND, AMSLER_LINES } from './testSurface';

export type AmslerTool = AmslerMarkKind | 'erase';

interface Props {
  gridSize: number;
  /** Side of one square in CSS pixels, from the calibration. */
  cellCss: number;
  marks: readonly AmslerMark[];
  /** Absent: the grid is only shown (corners question). */
  tool?: AmslerTool;
  onChange?(marks: readonly AmslerMark[]): void;
  onToolChange?(tool: AmslerTool): void;
}

/** Brings the whole grid into view when it appears, and focuses it when it can be marked. */
function useShowGrid(ref: RefObject<HTMLDivElement | null>, focus: boolean) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.scrollIntoView({ block: 'start' });
    if (focus) element.focus({ preventScroll: true });
  }, [ref, focus]);
}

const KIND_KEYS: Readonly<Record<string, AmslerTool>> = { '1': 'wavy', '2': 'blurred', '3': 'missing', '0': 'erase' };

/** Each kind has its own colour and its own pattern, so it reads without colour too. */
function MarkShape({ mark, cell }: { mark: AmslerMark; cell: number }) {
  const x = mark.col * cell;
  const y = mark.row * cell;
  const className = `vt-mark vt-mark--${mark.kind}`;
  if (mark.kind === 'wavy') {
    const q = cell / 4;
    const mid = y + cell / 2;
    return (
      <g className={className}>
        <rect x={x} y={y} width={cell} height={cell} />
        <path
          d={`M${x + 2} ${mid} q${q - 1} ${-q} ${2 * q - 2} 0 t${2 * q - 2} 0`}
          fill="none"
          strokeWidth={Math.max(1.5, cell / 12)}
        />
      </g>
    );
  }
  if (mark.kind === 'blurred') {
    return (
      <g className={className}>
        <rect x={x} y={y} width={cell} height={cell} />
        <path
          d={`M${x} ${y + cell / 2} L${x + cell / 2} ${y} M${x} ${y + cell} L${x + cell} ${y} M${x + cell / 2} ${y + cell} L${x + cell} ${y + cell / 2}`}
          strokeWidth={Math.max(1, cell / 16)}
        />
      </g>
    );
  }
  return (
    <g className={className}>
      <rect x={x} y={y} width={cell} height={cell} />
      <path d={`M${x + 3} ${y + 3} L${x + cell - 3} ${y + cell - 3} M${x + cell - 3} ${y + 3} L${x + 3} ${y + cell - 3}`} strokeWidth={Math.max(1.5, cell / 10)} />
    </g>
  );
}

/** The Amsler grid at true size: white lines on black, fixation dot in the centre. */
export function AmslerGrid({ gridSize, cellCss, marks, tool, onChange, onToolChange }: Props) {
  const t = useMessages(amslerMessages);
  const side = gridSize * cellCss;
  const centre = gridSize / 2;
  const [cursor, setCursor] = useState({ col: Math.max(0, centre - 1), row: Math.max(0, centre - 1) });
  const [focused, setFocused] = useState(false);
  const painting = useRef<AmslerTool | null>(null);
  // Pointer moves can arrive faster than renders: always build on the latest marks.
  const latest = useRef<readonly AmslerMark[]>(marks);
  latest.current = marks;
  const interactive = tool !== undefined && onChange !== undefined;
  const wrapper = useRef<HTMLDivElement>(null);
  useShowGrid(wrapper, interactive);

  const kindAt = (col: number, row: number) => latest.current.find((mark) => mark.col === col && mark.row === row)?.kind ?? null;
  const apply = (col: number, row: number, with_: AmslerTool) => {
    if (!onChange) return;
    const kind = with_ === 'erase' ? null : with_;
    if (kindAt(col, row) === kind) return;
    latest.current = setAmslerMark(latest.current, col, row, kind);
    onChange(latest.current);
  };

  const cellFromEvent = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const col = Math.floor(((event.clientX - box.left) / box.width) * gridSize);
    const row = Math.floor(((event.clientY - box.top) / box.height) * gridSize);
    return col >= 0 && row >= 0 && col < gridSize && row < gridSize ? { col, row } : null;
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const cell = cellFromEvent(event);
    if (!cell) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    painting.current = tool;
    setCursor(cell);
    apply(cell.col, cell.row, tool);
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!painting.current) return;
    const cell = cellFromEvent(event);
    if (cell) apply(cell.col, cell.row, painting.current);
  };
  const stopPainting = () => {
    painting.current = null;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const move: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const step = move[event.key];
    if (step) {
      event.preventDefault();
      setCursor(({ col, row }) => ({
        col: Math.min(gridSize - 1, Math.max(0, col + step[0])),
        row: Math.min(gridSize - 1, Math.max(0, row + step[1])),
      }));
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      const current = kindAt(cursor.col, cursor.row);
      apply(cursor.col, cursor.row, tool !== 'erase' && current === tool ? 'erase' : tool);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      apply(cursor.col, cursor.row, 'erase');
    } else if (KIND_KEYS[event.key] && onToolChange) {
      event.preventDefault();
      onToolChange(KIND_KEYS[event.key]!);
    }
  };

  const cursorKind = kindAt(cursor.col, cursor.row);
  const lines = [];
  for (let i = 0; i <= gridSize; i++) {
    const p = Math.min(Math.max(i * cellCss, 0.5), side - 0.5);
    lines.push(<line key={`h${i}`} x1={0} y1={p} x2={side} y2={p} />, <line key={`v${i}`} x1={p} y1={0} x2={p} y2={side} />);
  }

  const svg = (
    <svg
      className="vt-amsler"
      width={side}
      height={side}
      viewBox={`0 0 ${side} ${side}`}
      style={{ background: AMSLER_BACKGROUND, touchAction: interactive ? 'none' : 'auto' }}
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopPainting}
      onPointerCancel={stopPainting}
    >
      {marks.map((mark) => (
        <MarkShape key={`${mark.col},${mark.row}`} mark={mark} cell={cellCss} />
      ))}
      <g stroke={AMSLER_LINES} strokeWidth={1}>
        {lines}
      </g>
      <circle cx={side / 2} cy={side / 2} r={Math.max(3, cellCss / 8)} fill={AMSLER_LINES} />
      {interactive && focused && (
        <rect
          className="vt-amsler__cursor"
          x={cursor.col * cellCss + 1.5}
          y={cursor.row * cellCss + 1.5}
          width={cellCss - 3}
          height={cellCss - 3}
        />
      )}
    </svg>
  );

  if (!interactive) {
    return (
      <div ref={wrapper} className="vt-amsler-wrap" role="img" aria-label={t('grid.label', { n: gridSize })}>
        {svg}
      </div>
    );
  }

  return (
    <div
      ref={wrapper}
      className="vt-amsler-wrap"
      role="application"
      tabIndex={0}
      aria-label={t('grid.label', { n: gridSize })}
      aria-describedby="vt-amsler-instructions"
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {svg}
      <span className="vt-visually-hidden" aria-live="polite">
        {focused &&
          t('grid.cursor', {
            row: cursor.row + 1,
            col: cursor.col + 1,
            state: cursorKind ? t(`kind.${cursorKind}`) : t('grid.unmarked'),
          })}
      </span>
    </div>
  );
}
