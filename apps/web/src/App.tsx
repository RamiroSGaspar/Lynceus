import { PRODUCT, type Level } from '@app/core';
import { useEffect, useState } from 'react';
import { DevOctPage } from './features/oct';
import { DevVisionPage } from './features/vision';
import { useI18n } from './i18n';
import { Card, LanguageToggle, LevelBadge, QuantityValue, SimulatedNotice } from './ui';

const LEVELS: readonly (Level | null)[] = [
  'no-detectable-change',
  'first-sign',
  'clinically-concerning',
  'acute-visual-symptom',
  null,
];

/** Placeholder screen: shows the shared interface pieces until the real screens replace it. */
export function App() {
  const { locale } = useI18n();
  // Temporary mount of the vision tests' development page until the real navigation exists.
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  if (hash.startsWith('#/dev/vision')) return <DevVisionPage />;
  if (hash.startsWith('#/dev/oct')) return <DevOctPage />;
  return (
    <main className="shell">
      <LanguageToggle />
      <h1>{PRODUCT.name}</h1>
      <p>{PRODUCT.tagline[locale]}</p>
      <Card title="Interface pieces" eyebrow="Scaffold">
        <p style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {LEVELS.map((level) => (
            <LevelBadge key={String(level)} level={level} />
          ))}
        </p>
        <p>
          <QuantityValue
            quantity={{ value: 24, unit: 'µm', origin: 'derived', interval95: [18, 30] }}
            signed
            showOrigin
          />
        </p>
      </Card>
      <SimulatedNotice />
    </main>
  );
}
