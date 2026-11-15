import type { Locale } from '@app/core';
import { commonMessages } from '../i18n/common';
import { useI18n, useMessages } from '../i18n';

const LOCALES: readonly { id: Locale; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
];

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  const t = useMessages(commonMessages);
  return (
    <div className="language-toggle" role="group" aria-label={t('language')}>
      {LOCALES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          lang={id}
          className="language-toggle__option"
          aria-pressed={locale === id}
          onClick={() => setLocale(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
