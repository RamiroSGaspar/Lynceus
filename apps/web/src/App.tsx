import { useEffect, useRef, useState } from 'react';
import type { CrewId } from '@app/core';
import { formatRoute, routeCrewId, type Route } from './app/routes';
import { useRoute } from './app/useRoute';
import { DevVisionPage } from './features/vision';
import { useMessages } from './i18n';
import { appMessages } from './i18n/app';
import { ChartsGallery } from './screens/dev/ChartsGallery';
import { HomeScreen } from './screens/HomeScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { PendingScreen } from './screens/PendingScreen';
import { AppFooter } from './shell/AppFooter';
import { AppHeader } from './shell/AppHeader';
import { ErrorBoundary } from './shell/ErrorBoundary';

function Screen({ route }: { route: Route }) {
  const t = useMessages(appMessages);
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'dev':
      if (route.page === 'charts') return <ChartsGallery />;
      return <NotFoundScreen message={t('notFound.text', { path: `/dev/${route.page}` })} />;
    case 'not-found':
      return <NotFoundScreen message={t('notFound.text', { path: route.path })} />;
    default:
      return <PendingScreen />;
  }
}

/** The frame around every screen: header, the screen the address points at, and footer. */
function Shell({ route }: { route: Route }) {
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
      <AppHeader crewId={routeCrew ?? lastCrewId} />
      <main id="main" ref={mainRef} className="app-main" tabIndex={-1}>
        <ErrorBoundary key={routeKey}>
          <Screen route={route} />
        </ErrorBoundary>
      </main>
      <AppFooter />
    </div>
  );
}

export function App() {
  const route = useRoute();
  // The development page of the vision tests brings its own frame.
  if (route.name === 'dev' && route.page === 'vision') return <DevVisionPage />;
  return <Shell route={route} />;
}
