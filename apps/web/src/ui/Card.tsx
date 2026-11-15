import type { ReactNode } from 'react';

interface Props {
  title?: ReactNode;
  /** Small text above the title. */
  eyebrow?: ReactNode;
  children: ReactNode;
  className?: string;
  as?: 'section' | 'article' | 'div';
}

export function Card({ title, eyebrow, children, className = '', as: Tag = 'section' }: Props) {
  return (
    <Tag className={`card ${className}`.trim()}>
      {eyebrow && <p className="card__eyebrow">{eyebrow}</p>}
      {title && <h2 className="card__title">{title}</h2>}
      {children}
    </Tag>
  );
}
