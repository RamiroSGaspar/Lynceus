import { describe, expect, it } from 'vitest';
import { formatRoute, isCrewId, parseRoute, routeCrewId, type Route } from './routes';

describe('parseRoute', () => {
  it('reads every screen of the application', () => {
    expect(parseRoute('#/')).toEqual({ name: 'home' });
    expect(parseRoute('#/session/B')).toEqual({ name: 'session', crewId: 'B' });
    expect(parseRoute('#/result/C/150')).toEqual({ name: 'result', crewId: 'C', flightDay: 150 });
    expect(parseRoute('#/history/A')).toEqual({ name: 'history', crewId: 'A' });
    expect(parseRoute('#/report/D/90')).toEqual({ name: 'report', crewId: 'D', flightDay: 90 });
    expect(parseRoute('#/brain')).toEqual({ name: 'brain' });
    expect(parseRoute('#/how')).toEqual({ name: 'how' });
  });

  it('reads development pages, which the application does not link to', () => {
    expect(parseRoute('#/dev/charts')).toEqual({ name: 'dev', page: 'charts' });
    expect(parseRoute('#/dev').name).toBe('not-found');
    expect(parseRoute('#/dev/charts/x').name).toBe('not-found');
  });

  it('treats an empty or bare hash as the start screen', () => {
    for (const hash of ['', '#', '#/', '#//']) expect(parseRoute(hash)).toEqual({ name: 'home' });
  });

  it('tolerates a trailing slash, a lower-case crew id and a query string', () => {
    expect(parseRoute('#/history/b/')).toEqual({ name: 'history', crewId: 'B' });
    expect(parseRoute('#/result/a/30?x=1')).toEqual({ name: 'result', crewId: 'A', flightDay: 30 });
  });

  it('accepts flight day 0, the pre-flight exam', () => {
    expect(parseRoute('#/result/A/0')).toEqual({ name: 'result', crewId: 'A', flightDay: 0 });
  });

  it('answers not-found instead of guessing', () => {
    const cases = [
      '#/nothing',
      '#/session',
      '#/session/E',
      '#/session/A/extra',
      '#/result/A',
      '#/result/A/abc',
      '#/result/A/-3',
      '#/result/A/1e2',
      '#/result/A/1234',
      '#/report/A/30/x',
      '#/brain/x',
      '#/how/x',
    ];
    for (const hash of cases) expect(parseRoute(hash).name, hash).toBe('not-found');
    expect(parseRoute('#/nothing/here')).toEqual({ name: 'not-found', path: '/nothing/here' });
  });

  it('does not throw on a malformed escape sequence', () => {
    expect(parseRoute('#/%E0%A4%A').name).toBe('not-found');
  });
});

describe('formatRoute', () => {
  const routes: Route[] = [
    { name: 'home' },
    { name: 'session', crewId: 'A' },
    { name: 'result', crewId: 'B', flightDay: 90 },
    { name: 'history', crewId: 'C' },
    { name: 'report', crewId: 'D', flightDay: 150 },
    { name: 'brain' },
    { name: 'how' },
    { name: 'dev', page: 'charts' },
  ];

  it('round-trips with parseRoute', () => {
    for (const route of routes) expect(parseRoute(formatRoute(route))).toEqual(route);
  });

  it('writes hash paths', () => {
    expect(formatRoute({ name: 'home' })).toBe('#/');
    expect(formatRoute({ name: 'result', crewId: 'B', flightDay: 90 })).toBe('#/result/B/90');
  });
});

describe('route helpers', () => {
  it('recognises the four crew ids only', () => {
    expect(['A', 'B', 'C', 'D'].every(isCrewId)).toBe(true);
    expect(isCrewId('E')).toBe(false);
    expect(isCrewId('a')).toBe(false);
    expect(isCrewId(undefined)).toBe(false);
  });

  it('tells which crew member a route is about', () => {
    expect(routeCrewId({ name: 'history', crewId: 'C' })).toBe('C');
    expect(routeCrewId({ name: 'brain' })).toBeNull();
  });
});
