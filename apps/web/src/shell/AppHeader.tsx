import { PRODUCT } from '@app/core';
import { MISSION } from '../app/core';
import { formatFlightDate } from '../app/dates';
import { formatRoute } from '../app/routes';
import { useI18n, useMessages } from '../i18n';
import { appMessages } from '../i18n/app';
import { commonMessages } from '../i18n/common';
import { BrandLink, Icon, LanguageToggle, SimulatedTag } from '../ui';

interface Props {
  /** The flight day the screen is about: the control on screen, or the chosen mission day. 0 is the pre-flight exam. */
  flightDay: number;
}

/**
 * The top strip, the same on every screen. It is not a bar: three loose groups fixed at the
 * top over a black fade. The brand, which leads to the start screen; when and with which data;
 * and the language. The simulated-data tag lives here and never leaves. Whose screen it is
 * goes on the left veil of each screen, and the navigation at the bottom.
 */
export function AppHeader({ flightDay }: Props) {
  const { locale } = useI18n();
  const t = useMessages(appMessages);
  const tc = useMessages(commonMessages);
  return (
    <header className="co-hud">
      <BrandLink href={formatRoute({ name: 'home' })} label={t('header.home', { product: PRODUCT.name })} />
      <div className="co-hud__centro">
        <span className="co-hud__fecha">
          <Icon name="calendar-days" />
          {formatFlightDate(MISSION, flightDay, locale)}
        </span>
        <span className="co-ficha" title={flightDay > 0 ? tc('flightDay', { day: flightDay }) : undefined}>
          {flightDay > 0 ? tc('flightDay.short', { day: flightDay }) : tc('preflight')}
        </span>
        <SimulatedTag />
      </div>
      <div className="co-hud__lado">
        <LanguageToggle />
      </div>
    </header>
  );
}
