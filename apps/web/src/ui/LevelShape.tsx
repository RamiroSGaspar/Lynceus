import type { AlertClass } from '@app/core';

/** `unmeasured`: the eye, or the control, has no result. It is not an alert class. */
export type LevelKind = AlertClass | 'unmeasured';

interface Props {
  kind: LevelKind;
  className?: string;
  /** Inside a chart: where the shape goes, in the units of the drawing it is part of. */
  x?: number;
  y?: number;
  size?: number;
}

/**
 * One shape per alert class, so the class can be told apart without colour: ring (none),
 * circle with "i" (advisory), triangle (caution), octagon (warning), dashed ring (not measured).
 * A shape is part of the datum, not an icon: it takes the colour of its level from `currentColor`,
 * and the cut-out inside it takes the colour of the background.
 */
export function LevelShape({ kind, className, x, y, size }: Props) {
  const common = { className, x, y, width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false } as const;
  switch (kind) {
    case 'advisory':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <rect x="11" y="10.5" width="2" height="7" fill="var(--color-bg)" />
          <circle cx="12" cy="7.5" r="1.3" fill="var(--color-bg)" />
        </svg>
      );
    case 'caution':
      return (
        <svg {...common}>
          <path d="M12 2.5 22.5 21h-21z" fill="currentColor" />
          <rect x="11" y="9" width="2" height="6.5" fill="var(--color-bg)" />
          <circle cx="12" cy="18" r="1.3" fill="var(--color-bg)" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...common}>
          <path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z" fill="currentColor" />
          <rect x="11" y="6.5" width="2" height="7.5" fill="var(--color-bg)" />
          <circle cx="12" cy="17" r="1.3" fill="var(--color-bg)" />
        </svg>
      );
    case 'unmeasured':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3.2 3.87" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      );
  }
}
