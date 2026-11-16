import type { ReactNode } from 'react';

interface Props {
  /** Also the target of a jump from the first view: `jumpToSection(id)`. */
  id: string;
  title: ReactNode;
  /** One sentence under the title. */
  note?: ReactNode;
  /** Title above the content instead of beside it: for content that needs the whole width. */
  stacked?: boolean;
  /** `1` makes the title the heading of the screen. */
  level?: 1 | 2;
  className?: string;
  children: ReactNode;
}

/** A detail section, under the first view: its title on the left, its content on the right, a line that fades at the ends above it. */
export function Section({ id, title, note, stacked = false, level = 2, className = '', children }: Props) {
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <section className={`co-seccion${stacked ? ' co-seccion--apilada' : ''}${className ? ` ${className}` : ''}`} id={id} aria-labelledby={`${id}-titulo`}>
      <div className="co-seccion__cabeza">
        <Heading className="co-titulo" id={`${id}-titulo`} tabIndex={-1}>
          {title}
        </Heading>
        {note !== undefined && note !== null && note !== false && <p className="co-nota">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * Goes to a section further down the same screen and leaves the focus on its title. Not a
 * link: the address of this application is the screen, so a fragment would be read as a route.
 */
export function jumpToSection(id: string): void {
  const section = document.getElementById(id);
  if (!section) return;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  section.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  document.getElementById(`${id}-titulo`)?.focus({ preventScroll: true });
}
