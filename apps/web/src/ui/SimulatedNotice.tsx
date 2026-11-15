import { PRODUCT } from '@app/core';
import { useI18n } from '../i18n';

/** Must be visible wherever results or images are shown. */
export function SimulatedNotice() {
  const { locale } = useI18n();
  return (
    <p className="simulated-notice" role="note">
      {PRODUCT.simulatedDataNotice[locale]}
    </p>
  );
}
