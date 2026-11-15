import { useDocumentTitle } from '../app/hooks';
import { useMessages } from '../i18n';
import { appMessages } from '../i18n/app';
import { LinkButton } from '../shell/LinkButton';
import { ScreenTitle } from '../shell/ScreenTitle';

/** An address that matches no screen, or a control that does not exist. */
export function NotFoundScreen({ message }: { message: string }) {
  const t = useMessages(appMessages);
  useDocumentTitle(t('notFound.title'));
  return (
    <div className="screen">
      <ScreenTitle>{t('notFound.title')}</ScreenTitle>
      <p>{message}</p>
      <div className="actions">
        <LinkButton to={{ name: 'home' }} variant="primary">
          {t('notFound.home')}
        </LinkButton>
      </div>
    </div>
  );
}
