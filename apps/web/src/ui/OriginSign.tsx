import type { Origin } from '@app/core';

/** The six signs: the more filled, the more direct. Full is measured, half is calculated, dotted is estimated, hollow is what the person said. */
function Sign({ origin }: { origin: Origin }) {
  switch (origin) {
    case 'measured':
      return <circle cx="6" cy="6" r="4.5" fill="currentColor" />;
    case 'derived':
      return (
        <>
          <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 1.75a4.25 4.25 0 0 1 0 8.5z" fill="currentColor" />
        </>
      );
    case 'estimated':
      return <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.6 1.74" />;
    case 'self-reported':
      return <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.5" />;
    case 'reference':
      return <path d="M6 1.2 10.8 6 6 10.8 1.2 6z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />;
    case 'not-measurable':
      return <path d="M2 6h8" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />;
  }
}

/**
 * How a value was obtained, said with a shape. The shape alone: where it is used the word is
 * next to it, either visible (the legend) or hidden (`OriginTag`). `title` is what shows under
 * the pointer; it is an attribute, not text, so it is not read twice.
 */
export function OriginSign({ origin, title }: { origin: Origin; title?: string }) {
  return (
    <span className="co-origen" title={title}>
      <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <Sign origin={origin} />
      </svg>
    </span>
  );
}
