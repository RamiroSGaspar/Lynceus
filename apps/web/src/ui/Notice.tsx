import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';
import { LevelShape } from './LevelShape';

/**
 * `neutral`: a note or a limit, with the information icon. The alert colours are used only
 * when the notice IS of that class. `unmeasured`: "I cannot measure", a dashed grey line.
 */
export type NoticeKind = 'neutral' | 'advisory' | 'caution' | 'warning' | 'unmeasured';

interface Props {
  kind?: NoticeKind;
  /** One line. */
  title: ReactNode;
  /** Makes the title a heading of that level: use it when the notice opens a state of the screen. */
  titleLevel?: 2 | 3 | 4;
  /** The title takes the focus when the notice appears, so keyboard and screen-reader users follow the new state. */
  focusTitle?: boolean;
  /** One sentence per child, when more is needed. */
  children?: ReactNode;
  role?: 'status' | 'alert' | 'group' | 'note';
  'aria-label'?: string;
  className?: string;
}

const KIND_CLASS: Record<NoticeKind, string> = {
  neutral: '',
  advisory: ' co-aviso--advisory',
  caution: ' co-aviso--caution',
  warning: ' co-aviso--warning',
  unmeasured: ' co-aviso--sin-medida',
};

/**
 * Something to know before reading on: a condition of the result, a limit, or that today
 * it could not be measured. A line on the left, a shape and a sentence. No box, no background.
 */
export function Notice({ kind = 'neutral', title, titleLevel, focusTitle = false, children, role, className = '', ...rest }: Props) {
  const Title = titleLevel ? (`h${titleLevel}` as 'h2' | 'h3' | 'h4') : 'p';
  const titleRef = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);
  useEffect(() => {
    if (focusTitle) titleRef.current?.focus();
  }, [focusTitle]);
  return (
    <div className={`co-aviso${KIND_CLASS[kind]}${className ? ` ${className}` : ''}`} role={role} aria-label={rest['aria-label']}>
      {kind === 'neutral' ? (
        <span className="co-aviso__forma">
          <Icon name="info" size="lg" />
        </span>
      ) : (
        <LevelShape kind={kind} className="co-aviso__forma" />
      )}
      <Title ref={titleRef} className="co-aviso__titulo" tabIndex={focusTitle ? -1 : undefined}>
        {title}
      </Title>
      {children}
    </div>
  );
}

/** A sentence of a notice, under its title. */
export function NoticeText({ children }: { children: ReactNode }) {
  return <p className="co-aviso__texto">{children}</p>;
}
