import { formatRoute } from '../app/routes';
import { useMessages } from '../i18n';
import { appMessages } from '../i18n/app';
import { OriginLegend, SimulatedNotice } from '../ui';

/**
 * The foot of every screen: how each value was obtained, the full simulated-data notice,
 * the limits of the tool and the way to the two explanatory screens.
 */
export function AppFooter() {
  const t = useMessages(appMessages);
  return (
    <footer className="co-velo co-pie-marco">
      <div className="co-pie">
        <OriginLegend />
        <SimulatedNotice />
        <p className="co-nota">{t('footer.limits')}</p>
        <nav aria-label={t('footer.nav')}>
          <ul className="co-pie__enlaces">
            <li>
              <a href={formatRoute({ name: 'home' })}>{t('nav.home')}</a>
            </li>
            <li>
              <a href={formatRoute({ name: 'brain' })}>{t('nav.brain')}</a>
            </li>
            <li>
              <a href={formatRoute({ name: 'how' })}>{t('nav.how')}</a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
