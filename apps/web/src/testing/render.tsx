import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import type { Locale } from '@app/core';
import { MISSION } from '../app/core';
import { createAppStore, memoryStorage, type AppState, type AppStore } from '../app/store';
import { AppStoreProvider } from '../app/StoreContext';
import { I18nProvider } from '../i18n';

const STORE_OPTIONS = {
  missionDays: MISSION.routineControlDays,
  defaultMissionDay: MISSION.routineControlDays.at(-1) ?? MISSION.durationDays,
};

/** A store that lives in memory, optionally prepared with a transformation of the empty state. */
export function testStore(prepare?: (state: AppState) => AppState): AppStore {
  const store = createAppStore(memoryStorage(), STORE_OPTIONS);
  if (prepare) store.update(prepare);
  return store;
}

/**
 * Renders a screen to HTML in one language, as the browser would on first paint.
 * The language is chosen the way the application does: through the stored preference.
 */
export function renderHtml(element: ReactElement, locale: Locale, store: AppStore = testStore()): string {
  vi.stubGlobal('localStorage', memoryStorage({ 'ui.locale': locale }));
  try {
    return renderToStaticMarkup(
      <I18nProvider>
        <AppStoreProvider store={store}>{element}</AppStoreProvider>
      </I18nProvider>,
    );
  } finally {
    vi.unstubAllGlobals();
  }
}

/** The text a person would read, without tags. */
export function textOf(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Message placeholders that were never filled in, such as `{day}`. There must be none on screen. */
export function unfilledPlaceholders(html: string): string[] {
  return textOf(html).match(/\{[A-Za-z]\w*\}/g) ?? [];
}

export const LOCALES: readonly Locale[] = ['en', 'es'];
