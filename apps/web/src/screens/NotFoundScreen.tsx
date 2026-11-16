import { useDocumentTitle } from '../app/hooks';
import { useMessages } from '../i18n';
import { appMessages } from '../i18n/app';
import { LinkButton } from '../shell/LinkButton';
import { ScreenTitle } from '../shell/ScreenTitle';
import { BrandStill } from '../ui';

/** An address that matches no screen, or a control that does not exist: the brand at rest, a sentence and the way back. */
export function NotFoundScreen({ message }: { message: string }) {
  const t = useMessages(appMessages);
  useDocumentTitle(t('notFound.title'));
  return (
    <div className="co-hoja-simple co-velo">
      <BrandStill />
      <ScreenTitle>{t('notFound.title')}</ScreenTitle>
      <p className="co-texto">{message}</p>
      <div className="co-fila">
        <LinkButton to={{ name: 'home' }} variant="primary" icon="house">
          {t('notFound.home')}
        </LinkButton>
      </div>
    </div>
  );
}
