import type { ScreenCalibration } from '@app/core';
import { useState } from 'react';
import { useMessages } from '../../i18n';
import { Button, Card, LanguageToggle } from '../../ui';
import { AcuityStep } from './AcuityStep';
import { AmslerStep } from './AmslerStep';
import { devMessages } from './messages';
import { SymptomsStep } from './SymptomsStep';

type Tab = 'symptoms' | 'acuity' | 'amsler';
const TABS: readonly Tab[] = ['symptoms', 'acuity', 'amsler'];

/** `#/dev/vision`: each test on its own, showing what it hands to the guided session. */
export function DevVisionPage() {
  const t = useMessages(devMessages);
  const [tab, setTab] = useState<Tab>('symptoms');
  const [run, setRun] = useState(0);
  const [calibration, setCalibration] = useState<ScreenCalibration | null>(null);
  const [output, setOutput] = useState<Partial<Record<Tab, unknown>>>({});
  const done = (key: Tab) => (value: unknown) => setOutput((previous) => ({ ...previous, [key]: value }));
  const skipped = (key: Tab) => () => setOutput((previous) => ({ ...previous, [key]: 'skipped' }));
  const result = output[tab];

  return (
    <main className="shell vt-root" style={{ maxWidth: 'var(--content-width)' }}>
      <LanguageToggle />
      <h1>{t('title')}</h1>
      <p>{t('intro')}</p>
      <nav className="vt-dev-tabs" aria-label={t('title')}>
        {TABS.map((key) => (
          <Button
            key={key}
            variant={tab === key ? 'primary' : 'secondary'}
            aria-pressed={tab === key}
            onClick={() => {
              setTab(key);
              setRun((value) => value + 1);
            }}
          >
            {t(`tab.${key}`)}
          </Button>
        ))}
      </nav>
      <div key={`${tab}/${run}`}>
        {tab === 'symptoms' && <SymptomsStep onComplete={done('symptoms')} onSkip={skipped('symptoms')} />}
        {tab === 'acuity' && (
          <AcuityStep
            onComplete={(value) => {
              setCalibration(value.calibration);
              done('acuity')(value);
            }}
            onSkip={skipped('acuity')}
          />
        )}
        {tab === 'amsler' && <AmslerStep calibration={calibration} onComplete={done('amsler')} onSkip={skipped('amsler')} />}
      </div>
      <Card title={t('result')}>
        {result === undefined ? (
          <p>{t('none')}</p>
        ) : result === 'skipped' ? (
          <p>{t('skipped')}</p>
        ) : (
          <pre className="vt-dev-output">{JSON.stringify(result, null, 2)}</pre>
        )}
      </Card>
    </main>
  );
}
