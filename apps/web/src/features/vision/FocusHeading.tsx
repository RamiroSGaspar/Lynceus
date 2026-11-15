import { useEffect, useRef, type ReactNode } from 'react';

/** A heading that takes the focus when it appears, so keyboard and screen-reader users follow each step. */
export function FocusHeading({
  children,
  level = 2,
  preventScroll = false,
}: {
  children: ReactNode;
  level?: 2 | 3;
  /** Keep the page where it is, e.g. when a test surface above must stay in view. */
  preventScroll?: boolean;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll });
  }, [preventScroll]);
  const Tag = level === 2 ? 'h2' : 'h3';
  return (
    <Tag ref={ref} tabIndex={-1} className="vt-heading">
      {children}
    </Tag>
  );
}
