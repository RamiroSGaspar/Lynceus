import type { Origin } from '@app/core';
import { commonMessages } from '../i18n/common';
import { useMessages } from '../i18n';
import { OriginSign } from './OriginSign';

/**
 * Says how a value was obtained. Goes with every number shown to the astronaut: the sign
 * is what is seen, and the word stays next to it as hidden text, for a screen reader.
 * The full explanation shows under the pointer.
 */
export function OriginTag({ origin }: { origin: Origin }) {
  const t = useMessages(commonMessages);
  return (
    <>
      <OriginSign origin={origin} title={t(`origin.${origin}.help`)} />
      <span className="co-oculto">{t(`origin.${origin}`)}</span>
    </>
  );
}
