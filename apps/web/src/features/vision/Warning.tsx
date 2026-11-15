import type { ReactNode } from 'react';
import { AlertIcon } from '../../ui';

/** NASA warning class: red, octagon and words together. */
export function Warning({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="vt-warning" role="alert">
      <AlertIcon alert="warning" size={28} />
      <div>
        <p className="vt-warning__title">{title}</p>
        <p>{children}</p>
      </div>
    </div>
  );
}
