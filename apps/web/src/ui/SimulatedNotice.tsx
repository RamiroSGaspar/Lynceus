import { PRODUCT } from '@app/core';
import { useI18n, useMessages } from '../i18n';
import { commonMessages } from '../i18n/common';
import { Icon } from './Icon';

/**
 * That the data are simulated is said in three places, always the three: in the top strip
 * (fixed), inside every image and at the foot of every screen and report, with the full text.
 * None of them can be closed or hidden.
 */

/** The full text, at the foot of a screen, of a report or of a panel. */
export function SimulatedNotice() {
  const { locale } = useI18n();
  return (
    <p className="co-nota co-simulado" role="note">
      {PRODUCT.simulatedDataNotice[locale]}
    </p>
  );
}

/** The tag of the top strip: dashed edge and grey. It informs, it does not alarm. */
export function SimulatedTag() {
  const t = useMessages(commonMessages);
  return (
    <span className="co-ficha co-ficha--simulado">
      <Icon name="flask-conical" />
      <span className="co-ficha__larga">{t('simulated.tag')}</span>
      <span className="co-ficha__corta">{t('simulated.stamp')}</span>
    </span>
  );
}

/** The same notice inside an image: it has to come out in any screenshot. */
export function SimulatedStamp() {
  const t = useMessages(commonMessages);
  return <span className="co-sello">{t('simulated.stamp')}</span>;
}
