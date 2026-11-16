import type { ReactNode } from 'react';

/**
 * The heading of a screen: one per screen. Focus moves here after navigating, so a screen
 * reader announces the new screen. `className` chooses its voice; a title by default.
 */
export function ScreenTitle({ children, className = 'co-titulo', id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h1 className={className} id={id} tabIndex={-1}>
      {children}
    </h1>
  );
}
