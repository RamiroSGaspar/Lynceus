import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '@app/core';

/**
 * Texts live outside the components, in both languages. `defineMessages` makes
 * the compiler reject a Spanish set that does not have exactly the English keys.
 */
export interface MessageSet<K extends string> {
  en: Record<K, string>;
  es: Record<K, string>;
}

export function defineMessages<K extends string>(en: Record<K, string>, es: Record<K, string>): MessageSet<K> {
  return { en, es };
}

export type MessageParams = Readonly<Record<string, string | number>>;

/** Replaces `{name}` placeholders. Unknown placeholders are left visible on purpose. */
export function formatMessage(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

const STORAGE_KEY = 'ui.locale';
const INTL_LOCALE: Record<Locale, string> = { en: 'en-US', es: 'es-AR' };

function initialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    // Storage can be unavailable (private mode); fall through to the browser language.
  }
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Formats a number for the current language. */
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not being able to remember the choice is not an error worth showing.
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      formatNumber: (number, options) => new Intl.NumberFormat(INTL_LOCALE[locale], options).format(number),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}

/** Returns the translator of one message set for the current language. */
export function useMessages<K extends string>(set: MessageSet<K>): (key: K, params?: MessageParams) => string {
  const { locale } = useI18n();
  return useCallback((key: K, params?: MessageParams) => formatMessage(set[locale][key], params), [locale, set]);
}
