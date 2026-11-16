import type { Locale } from '@app/core';
import { commonMessages } from '../i18n/common';
import { useI18n, useMessages } from '../i18n';
import { Segment, type SegmentOption } from './Segment';

const LOCALES: readonly SegmentOption<Locale>[] = [
  { value: 'en', label: 'EN', name: 'English', lang: 'en' },
  { value: 'es', label: 'ES', name: 'Español', lang: 'es' },
];

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  const t = useMessages(commonMessages);
  return <Segment label={t('language')} options={LOCALES} value={locale} onChange={setLocale} />;
}
