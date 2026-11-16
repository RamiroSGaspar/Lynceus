import { useEffect, useRef } from 'react';
import { formatRoute, type Route } from './app/routes';
import { useAppState } from './app/StoreContext';
import { useRoute } from './app/useRoute';
import { DevOctPage } from './features/oct';
import { DevVisionPage } from './features/vision';
import { useMessages } from './i18n';
import { appMessages } from './i18n/app';
import { BrainScreen } from './screens/BrainScreen';
import { ChartsGallery } from './screens/dev/ChartsGallery';
import { HistoryScreen } from './screens/HistoryScreen';
import { HomeScreen } from './screens/HomeScreen';
import { HowScreen } from './screens/HowScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { ReportScreen } from './screens/ReportScreen';
import { ResultScreen } from './screens/ResultScreen';
import { SessionScreen } from './screens/SessionScreen';
import { AppFooter } from './shell/AppFooter';
import { AppHeader } from './shell/AppHeader';
import { ErrorBoundary } from './shell/ErrorBoundary';

function Screen({ route }: { route: Route }) {
  const t = useMessages(appMessages);
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'session':
      return <SessionScreen crewId={route.crewId} />;
    case 'result':
      return <ResultScreen crewId={route.crewId} flightDay={route.flightDay} />;
    case 'history':
      return <HistoryScreen crewId={route.crewId} />;
    case 'brain':
      return <BrainScreen />;
    case 'how':
      return <HowScreen />;
    case 'dev':
      if (route.page === 'charts') return <ChartsGallery />;
      return <NotFoundScreen message={t('notFound.text', { path: `/dev/${route.page}` })} />;
    case 'report':
      return <ReportScreen crewId={route.crewId} flightDay={route.flightDay} />;
    case 'not-found':
      return <NotFoundScreen message={t('notFound.text', { path: route.path })} />;
  }
}

/** Screens of one crew member carry the fixed navigation at the bottom, and the frame leaves room for it. */
const WITH_NAVIGATION: ReadonlySet<Route['name']> = new Set(['session', 'result', 'history', 'report']);

/** The frame around every screen: the top strip, the screen the address points at, and the foot. */
function Shell({ route }: { route: Route }) {
  const t = useMessages(appMessages);
  const { missionDay } = useAppState();
  const routeKey = formatRoute(route);
  const mainRef = useRef<HTMLElement>(null);

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

  // The strip says when: the day of the control on screen, or the chosen mission day.
  const flightDay = route.name === 'result' || route.name === 'report' ? route.flightDay : missionDay;

  return (
    <div className={`co-pantalla${WITH_NAVIGATION.has(route.name) ? '' : ' co-pantalla--sin-nav'}`}>
      <a
        className="co-salto"
        href={routeKey}
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        {t('skip')}
      </a>
      <AppHeader flightDay={flightDay} />
      <main id="main" ref={mainRef} className="co-principal" tabIndex={-1}>
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
  // The development pages of the vision tests and of the tomography bring their own frame.
  if (route.name === 'dev' && route.page === 'vision') return <DevVisionPage />;
  if (route.name === 'dev' && route.page === 'oct') return <DevOctPage />;
  return <Shell route={route} />;
}
