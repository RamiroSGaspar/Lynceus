import { useDocumentTitle } from '../app/hooks';
import { useMessages } from '../i18n';
import { appMessages } from '../i18n/app';
import { LinkButton } from '../shell/LinkButton';
import { ScreenTitle } from '../shell/ScreenTitle';

/** Stands in for a screen that is not built yet. Removed when the last screen lands. */
export function PendingScreen() {
  const t = useMessages(appMessages);
  useDocumentTitle(t('pending.title'));
  return (
    <div className="screen">
      <ScreenTitle>{t('pending.title')}</ScreenTitle>
      <p>{t('pending.text')}</p>
      <div className="actions">
        <LinkButton to={{ name: 'home' }} variant="primary">
          {t('notFound.home')}
        </LinkButton>
      </div>
    </div>
  );
}
