import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useAppStore } from '../app/StoreContext';
import { useMessages } from '../i18n';
import { appMessages } from '../i18n/app';
import { BrandStill, Button } from '../ui';
import { ScreenTitle } from './ScreenTitle';

/** Says what is wrong, what can be done and what caused it, instead of leaving a blank page. */
function ErrorFallback({ error }: { error: Error }) {
  const t = useMessages(appMessages);
  const store = useAppStore();
  return (
    <div className="co-hoja-simple co-velo" role="alert">
      <BrandStill />
      <ScreenTitle>{t('error.title')}</ScreenTitle>
      <p className="co-texto">{t('error.what', { message: error.message })}</p>
      <p className="co-nota">{t('error.cause')}</p>
      <p className="co-nota">{t('error.do')}</p>
      <div className="co-fila">
        <Button variant="primary" icon="rotate-ccw" onClick={() => window.location.reload()}>
          {t('error.reload')}
        </Button>
        <Button
          icon="trash-2"
          onClick={() => {
            store.clear();
            window.location.reload();
          }}
        >
          {t('error.clear')}
        </Button>
      </div>
    </div>
  );
}

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Catches a screen that fails to render. Give it a `key` per route so moving on clears the error. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  override render(): ReactNode {
    return this.state.error ? <ErrorFallback error={this.state.error} /> : this.props.children;
  }
}
