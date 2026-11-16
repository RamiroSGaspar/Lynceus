import { PRODUCT } from '@app/core';
import type { CSSProperties } from 'react';

interface MarkGeometry {
  viewBox: string;
  strokeWidth: number;
  /** One entry per scan line, top to bottom; a line split by the opening has two stretches. */
  rows: readonly (readonly (readonly [x1: number, x2: number])[])[];
  rowHeight: number;
  firstY: number;
  pupil: { cx: number; cy: number; r: number };
}

/** The mark from 80 px wide: 13 scan lines. Redrawn from the reference image: geometric, not a tracing. */
const FULL: MarkGeometry = {
  viewBox: '0 0 240 160',
  strokeWidth: 5,
  rowHeight: 12,
  firstY: 8,
  rows: [
    [[69.4, 170.6]],
    [[43.3, 196.7]],
    [[27.2, 212.8]],
    [[16.4, 223.6]],
    [[9.3, 230.7]],
    [[5.3, 95], [145, 234.7]],
    [[4, 82], [158, 236]],
    [[5.3, 95], [145, 234.7]],
    [[9.3, 230.7]],
    [[16.4, 223.6]],
    [[27.2, 212.8]],
    [[43.3, 196.7]],
    [[69.4, 170.6]],
  ],
  pupil: { cx: 120, cy: 80, r: 17 },
};

/** The mark up to 48 px: 7 scan lines. The one of the top strip. */
const MINI: MarkGeometry = {
  viewBox: '0 0 64 64',
  strokeWidth: 4,
  rowHeight: 8,
  firstY: 8,
  rows: [
    [[13.6, 50.4]],
    [[7.2, 56.8]],
    [[4, 22.5], [41.5, 60]],
    [[3, 18], [46, 61]],
    [[4, 22.5], [41.5, 60]],
    [[7.2, 56.8]],
    [[13.6, 50.4]],
  ],
  pupil: { cx: 32, cy: 32, r: 6.5 },
};

/**
 * The isotype: scan lines that draw an eye, the same lines the tomograph sweeps the retina with.
 * It takes `currentColor`: white over the field, black on the printed report. Never a level colour.
 */
export function BrandMark({ size = 'mini' }: { size?: 'mini' | 'full' }) {
  const mark = size === 'full' ? FULL : MINI;
  return (
    <span className="co-marca__iso">
      <svg
        className="co-marca__svg"
        viewBox={mark.viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={mark.strokeWidth}
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        {mark.rows.flatMap((row, index) =>
          row.map(([x1, x2]) => (
            <line
              key={`${index}-${x1}`}
              className="co-marca__linea"
              style={{ '--i': index } as CSSProperties}
              x1={x1}
              x2={x2}
              y1={mark.firstY + index * mark.rowHeight}
              y2={mark.firstY + index * mark.rowHeight}
            />
          )),
        )}
        <circle className="co-marca__pupila" cx={mark.pupil.cx} cy={mark.pupil.cy} r={mark.pupil.r} fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

/** The name, set in type next to the isotype. It comes from the core and from nowhere else. */
function BrandName({ className = '' }: { className?: string }) {
  return <span className={`co-marca__nombre${className ? ` ${className}` : ''}`}>{PRODUCT.name}</span>;
}

/** The brand of the top strip: it leads to the start screen. */
export function BrandLink({ href, label }: { href: string; label: string }) {
  return (
    <a className="co-marca" href={href} aria-label={label}>
      <BrandMark />
      <BrandName />
    </a>
  );
}

/** The brand of the start screen: its lines are traced once, on opening, and the pupil appears. */
export function BrandCover() {
  return (
    <span className="co-marca co-marca--portada is-trazando">
      <BrandMark size="full" />
      <BrandName className="co-halo" />
    </span>
  );
}

/**
 * The only sign of "I am working": a band of light runs down the lines for as long as the
 * real work lasts. With reduced motion the mark stays still and the progress is read in the text.
 */
export function BrandWorking({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  return (
    <span className={`co-marca co-marca--trabajo${size === 'sm' ? ' co-marca--trabajo-sm' : ''} is-barriendo`}>
      <BrandMark size={size === 'lg' ? 'full' : 'mini'} />
    </span>
  );
}

/** The brand at rest, small: on the screens that only say something went wrong, and on the report. */
export function BrandStill() {
  return (
    <span className="co-marca">
      <BrandMark />
      <BrandName />
    </span>
  );
}
