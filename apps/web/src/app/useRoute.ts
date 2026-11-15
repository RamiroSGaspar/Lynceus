import { useMemo, useSyncExternalStore } from 'react';
import { formatRoute, parseRoute, type Route } from './routes';

function subscribe(listener: () => void): () => void {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

const readHash = (): string => window.location.hash;
const readServerHash = (): string => '';

/** The screen the address bar points at. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, readHash, readServerHash);
  return useMemo(() => parseRoute(hash), [hash]);
}

/** Goes to another screen. `replace` keeps the current entry out of the browser history. */
export function navigate(route: Route, options: { replace?: boolean } = {}): void {
  const target = formatRoute(route);
  if (options.replace) window.location.replace(target);
  else window.location.hash = target;
}
