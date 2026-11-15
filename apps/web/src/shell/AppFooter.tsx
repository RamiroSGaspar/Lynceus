import { formatRoute } from '../app/routes';
import { useMessages } from '../i18n';
import { appMessages } from '../i18n/app';

/** The limits of the tool stay in view on every screen, with the way to the two explanatory screens. */
export function AppFooter() {
  const t = useMessages(appMessages);
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <p className="app-footer__limits">{t('footer.limits')}</p>
        <nav aria-label={t('footer.nav')}>
          <ul className="app-footer__links">
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
