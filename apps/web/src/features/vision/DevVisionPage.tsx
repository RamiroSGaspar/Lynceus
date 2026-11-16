import type { ScreenCalibration } from '@app/core';
import { useState } from 'react';
import { useMessages } from '../../i18n';
import { BrandStill, Button, Group, LanguageToggle, SimulatedTag } from '../../ui';
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
    <main className="co-dev co-dev--prueba">
      <header className="co-dev__cabeza">
        <div className="co-fila">
          <BrandStill />
          <SimulatedTag />
          <LanguageToggle />
        </div>
        <h1 className="co-titulo">{t('title')}</h1>
        <p className="co-nota">{t('intro')}</p>
        <nav className="co-fila" aria-label={t('title')}>
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
      </header>
      <div key={`${tab}/${run}`} className="co-prueba__paso">
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
      <div className="co-dev__cuerpo">
        <Group icon="clipboard-list" title={t('result')}>
          {result === undefined ? (
            <p className="co-nota">{t('none')}</p>
          ) : result === 'skipped' ? (
            <p className="co-nota">{t('skipped')}</p>
          ) : (
            <pre className="co-dev__salida">{JSON.stringify(result, null, 2)}</pre>
          )}
        </Group>
      </div>
    </main>
  );
}
