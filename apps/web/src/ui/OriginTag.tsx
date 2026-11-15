import type { Origin } from '@app/core';
import { commonMessages } from '../i18n/common';
import { useMessages } from '../i18n';

/** Says how a value was obtained. Goes next to every number shown to the astronaut. */
export function OriginTag({ origin }: { origin: Origin }) {
  const t = useMessages(commonMessages);
  return (
    <span className={`origin-tag origin-tag--${origin}`} title={t(`origin.${origin}.help`)}>
      {t(`origin.${origin}`)}
    </span>
  );
}
