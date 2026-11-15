import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { CrewId, SessionRecord } from '@app/core';
import { getHistory } from './app/core';
import { findRecord, mergeHistory } from './app/history';
import { formatRoute, routeCrewId, type Route } from './app/routes';
import type { AppState } from './app/store';
import { useAppState } from './app/StoreContext';
import { useRoute } from './app/useRoute';
import { useMessages } from './i18n';
import { appMessages } from './i18n/app';
import { HomeScreen } from './screens/HomeScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { PendingScreen } from './screens/PendingScreen';
import { AppFooter } from './shell/AppFooter';
import { AppHeader } from './shell/AppHeader';
import { ErrorBoundary } from './shell/ErrorBoundary';
import { AssistantPanel } from './slots';
import { Button } from './ui';

function Screen({ route }: { route: Route }) {
  const t = useMessages(appMessages);
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'not-found':
      return <NotFoundScreen message={t('notFound.text', { path: route.path })} />;
    default:
      return <PendingScreen />;
  }
}

/** The control a result or report screen is showing: what the assistant is given. */
function recordOnScreen(route: Route, state: AppState): SessionRecord | null {
  if (route.name !== 'result' && route.name !== 'report') return null;
  const history = mergeHistory(
    getHistory(route.crewId, state.missionDay),
    state.records,
    route.crewId,
    state.missionDay,
  );
  return findRecord(history, route.flightDay);
}

export function App() {
  const route = useRoute();
  const state = useAppState();
  const t = useMessages(appMessages);
  const routeKey = formatRoute(route);
  const mainRef = useRef<HTMLElement>(null);

  // The header keeps showing the last crew member chosen on screens that are not about one.
  const [lastCrewId, setLastCrewId] = useState<CrewId | null>(null);
  const routeCrew = routeCrewId(route);
  useEffect(() => {
    if (routeCrew) setLastCrewId(routeCrew);
  }, [routeCrew]);

  // After navigating: back to the top, with the focus on the new screen's heading.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, [routeKey]);

  const [assistantOpen, setAssistantOpen] = useState(false);
  const closeAssistant = useCallback(() => {
    setAssistantOpen(false);
    document.getElementById('assistant-toggle')?.focus();
  }, []);
  const onAssistantKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape') closeAssistant();
  };
  const record = useMemo(() => recordOnScreen(route, state), [route, state]);

  return (
    <div className="app">
      <a
        className="skip-link"
        href={routeKey}
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        {t('skip')}
      </a>
      <AppHeader
        crewId={routeCrew ?? lastCrewId}
        assistantOpen={assistantOpen}
        onToggleAssistant={() => setAssistantOpen((open) => !open)}
      />
      <div className={`app-body${assistantOpen ? ' app-body--with-panel' : ''}`}>
        <main id="main" ref={mainRef} className="app-main" tabIndex={-1}>
          <ErrorBoundary key={routeKey}>
            <Screen route={route} />
          </ErrorBoundary>
        </main>
        <aside
          id="assistant-panel"
          className="assistant-panel"
          aria-label={t('assistant.title')}
          hidden={!assistantOpen}
          onKeyDown={onAssistantKeyDown}
        >
          {assistantOpen && (
            <>
              <div className="assistant-panel__head">
                <h2 className="assistant-panel__title">{t('assistant.title')}</h2>
                <Button variant="ghost" onClick={closeAssistant}>
                  {t('assistant.close')}
                </Button>
              </div>
              <AssistantPanel record={record} />
            </>
          )}
        </aside>
      </div>
      <AppFooter />
    </div>
  );
}
