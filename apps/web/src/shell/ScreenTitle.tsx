import type { ReactNode } from 'react';

/** The heading of a screen. Focus moves here after navigating, so a screen reader announces the new screen. */
export function ScreenTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="screen-title" tabIndex={-1}>
      {children}
    </h1>
  );
}
