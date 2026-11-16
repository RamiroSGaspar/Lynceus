import type { ReactNode } from 'react';

interface Props {
  name: string;
  role: string;
  /** One line under the role: where what is shown comes from, or where the person is in the control. */
  state?: ReactNode;
  /** Renders the name as a heading of that level: use it where the person is one of several. */
  level?: 3;
}

/** Whose data is shown: at the top of the left veil, or of a crew member's column. */
export function Subject({ name, role, state, level }: Props) {
  const Name = level ? 'h3' : 'p';
  return (
    <div className="co-sujeto">
      <Name className="co-sujeto__nombre">{name}</Name>
      <p className="co-sujeto__rol">{role}</p>
      {state !== undefined && state !== null && state !== false && <p className="co-sujeto__estado">{state}</p>}
    </div>
  );
}
