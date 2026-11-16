import type { Origin } from '@app/core';
import { commonMessages } from '../i18n/common';
import { useMessages } from '../i18n';
import { OriginSign } from './OriginSign';

const ORIGINS: readonly Origin[] = ['measured', 'derived', 'estimated', 'self-reported', 'reference', 'not-measurable'];

/** The six origin signs with their words: always in view at the foot of the screens that use them. */
export function OriginLegend() {
  const t = useMessages(commonMessages);
  return (
    <ul className="co-leyenda">
      {ORIGINS.map((origin) => (
        <li key={origin} title={t(`origin.${origin}.help`)}>
          <OriginSign origin={origin} />
          {t(`origin.${origin}`)}
        </li>
      ))}
    </ul>
  );
}
