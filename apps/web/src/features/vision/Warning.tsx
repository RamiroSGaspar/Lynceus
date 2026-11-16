import type { ReactNode } from 'react';
import { Notice, NoticeText } from '../../ui';

/** NASA warning class: red, octagon and words together. Used only when the notice IS a warning: an acute visual symptom. */
export function Warning({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Notice kind="warning" role="alert" title={title}>
      <NoticeText>{children}</NoticeText>
    </Notice>
  );
}
