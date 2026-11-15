import type { CrewId } from '@app/core';

/** Hash navigation (`#/…`), without a library. Parsing and formatting are pure so they can be tested. */
export type Route =
  | { name: 'home' }
  | { name: 'session'; crewId: CrewId }
  | { name: 'result'; crewId: CrewId; flightDay: number }
  | { name: 'history'; crewId: CrewId }
  | { name: 'report'; crewId: CrewId; flightDay: number }
  | { name: 'brain' }
  | { name: 'how' }
  /** Development pages (`#/dev/…`): not linked from the application. */
  | { name: 'dev'; page: string }
  | { name: 'not-found'; path: string };

const CREW_IDS: readonly CrewId[] = ['A', 'B', 'C', 'D'];

export function isCrewId(value: unknown): value is CrewId {
  return typeof value === 'string' && (CREW_IDS as readonly string[]).includes(value);
}

function parseCrew(segment: string | undefined): CrewId | null {
  const upper = segment?.toUpperCase();
  return isCrewId(upper) ? upper : null;
}

/** A flight day is a whole number of up to three digits; 0 is the pre-flight exam. */
function parseDay(segment: string | undefined): number | null {
  return segment !== undefined && /^\d{1,3}$/.test(segment) ? Number(segment) : null;
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function parseRoute(hash: string): Route {
  const path = (hash.replace(/^#/, '').split('?')[0] ?? '').trim();
  const segments = path
    .split('/')
    .filter((segment) => segment.length > 0)
    .map(safeDecode);
  const notFound: Route = { name: 'not-found', path: `/${segments.join('/')}` };
  const [head, second, third] = segments;
  if (head === undefined) return { name: 'home' };
  const crewId = parseCrew(second);
  const flightDay = parseDay(third);
  switch (head) {
    case 'session':
    case 'history':
      return crewId && segments.length === 2 ? { name: head, crewId } : notFound;
    case 'result':
    case 'report':
      return crewId && flightDay !== null && segments.length === 3 ? { name: head, crewId, flightDay } : notFound;
    case 'brain':
    case 'how':
      return segments.length === 1 ? { name: head } : notFound;
    case 'dev':
      return second !== undefined && segments.length === 2 ? { name: 'dev', page: second } : notFound;
    default:
      return notFound;
  }
}

export function formatRoute(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'session':
    case 'history':
      return `#/${route.name}/${route.crewId}`;
    case 'result':
    case 'report':
      return `#/${route.name}/${route.crewId}/${route.flightDay}`;
    case 'brain':
    case 'how':
      return `#/${route.name}`;
    case 'dev':
      return `#/dev/${route.page}`;
    case 'not-found':
      return `#${route.path}`;
  }
}

/** The crew member a route is about, when it is about one. */
export function routeCrewId(route: Route): CrewId | null {
  return 'crewId' in route ? route.crewId : null;
}
