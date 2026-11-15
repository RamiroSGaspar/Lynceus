import type { Locale, Mission } from '@app/core';

const DAY_MS = 86_400_000;
const INTL_LOCALE: Record<Locale, string> = { en: 'en-US', es: 'es-AR' };

/** Calendar date of a flight day, as Unix milliseconds. Flight day 1 is the launch date. */
export function flightDayTimeMs(mission: Mission, flightDay: number): number {
  return Date.parse(`${mission.launchDateIso}T00:00:00Z`) + (flightDay - 1) * DAY_MS;
}

/** The date of a flight day of the fictional mission, written for the current language. */
export function formatFlightDate(mission: Mission, flightDay: number, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(flightDayTimeMs(mission, flightDay)));
}
