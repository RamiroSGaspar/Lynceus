import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface Props {
  /** The question the group answers, or its subject in two or three words. */
  title: ReactNode;
  icon: IconName;
  /** Heading level of the title: 2 inside a veil, 3 inside a detail section. */
  level?: 2 | 3 | 4;
  /** Closes the group: where a threshold comes from, what is provisional. */
  source?: ReactNode;
  children?: ReactNode;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

/** An icon, a title and its readouts. A group answers one question. No box: between groups, air. */
export function Group({ title, icon, level = 2, source, children, className = '', id, ...rest }: Props) {
  const Heading = `h${level}` as 'h2' | 'h3' | 'h4';
  return (
    <div className={`co-grupo${className ? ` ${className}` : ''}`} aria-label={rest['aria-label']} role={rest['aria-label'] ? 'group' : undefined}>
      <Heading className="co-grupo__cabeza" id={id}>
        <Icon name={icon} />
        {title}
      </Heading>
      {children}
      {source !== undefined && source !== null && source !== false && <p className="co-grupo__fuente">{source}</p>}
    </div>
  );
}
