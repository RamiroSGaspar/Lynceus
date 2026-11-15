import type { AcuityResult, Eye, ScreenCalibration } from '@app/core';
import {
  ACUITY_RETEST_LOA_LOGMAR,
  NORMAL_VISION_FLOOR_LOGMAR,
  acuityResult,
  answerAcuityProcedure,
  canMeasureNormalVision,
  logMarToDecimal,
  logMarToSnellenDenominator,
  startAcuityProcedure,
  type AcuityProcedureState,
  type Orientation,
} from '@app/core/vision/index';
import { useState } from 'react';
import { commonMessages } from '../../i18n/common';
import { useI18n, useMessages } from '../../i18n';
import { Button, Card, QuantityValue } from '../../ui';
import { Calibration } from './Calibration';
import { calibrationMessages, acuityMessages, visionMessages } from './messages';
import type { StoredCalibration } from './calibrationStore';
import { ChoiceGroup } from './ChoiceGroup';
import { FocusHeading } from './FocusHeading';
import { LandoltC } from './LandoltC';
import { ResponsePad } from './ResponsePad';
import { freshSeedKey, useDevicePixelRatio } from './useDevicePixelRatio';
import './vision.css';

interface Props {
  onComplete(result: { calibration: ScreenCalibration; OD: AcuityResult; OS: AcuityResult }): void;
  onSkip(): void;
}

const EYES: readonly Eye[] = ['OD', 'OS'];
const OTHER: Readonly<Record<Eye, Eye>> = { OD: 'OS', OS: 'OD' };

type Phase =
  | { kind: 'calibrate' }
  | { kind: 'setup' }
  | { kind: 'eye-intro'; eye: Eye }
  | { kind: 'test'; eye: Eye; procedure: AcuityProcedureState }
  | { kind: 'eye-result'; eye: Eye }
  | { kind: 'summary' };

/** Near acuity, one eye at a time, right eye first (spec 03, section 2). */
export function AcuityStep({ onComplete, onSkip }: Props) {
  const t = useMessages(acuityMessages);
  const tv = useMessages(visionMessages);
  const tc = useMessages(commonMessages);
  const tcal = useMessages(calibrationMessages);
  const dpr = useDevicePixelRatio();
  const [stored, setStored] = useState<StoredCalibration | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'calibrate' });
  const [withCorrection, setWithCorrection] = useState<Partial<Record<Eye, boolean>>>({});
  const [results, setResults] = useState<Partial<Record<Eye, AcuityResult>>>({});
  const zoomChanged = stored !== null && Math.abs(stored.devicePixelRatio - dpr) >= 0.01;

  const answer = (orientation: Orientation) => {
    if (phase.kind !== 'test') return;
    const procedure = answerAcuityProcedure(phase.procedure, orientation);
    if (procedure.current) {
      setPhase({ ...phase, procedure });
      return;
    }
    const result = acuityResult(procedure, phase.eye, withCorrection[phase.eye] ?? false);
    setResults((previous) => ({ ...previous, [phase.eye]: result }));
    setPhase({ kind: 'eye-result', eye: phase.eye });
  };

  const skip = (
    <div className="vt-skip">
      <Button variant="ghost" onClick={onSkip}>
        {tc('action.skip')}
      </Button>
    </div>
  );

  const eyeName = (eye: Eye) => tv(`eyeName.${eye}`);
  const calibration = stored?.calibration ?? null;

  const startEye = (eye: Eye) => {
    if (!calibration) return;
    setResults((previous) => {
      const next = { ...previous };
      delete next[eye];
      return next;
    });
    setPhase({
      kind: 'test',
      eye,
      procedure: startAcuityProcedure({ floorLogMar: calibration.floorLogMar, seedKey: freshSeedKey(`acuity/${eye}`) }),
    });
  };

  let body;
  if (phase.kind === 'calibrate' || !calibration) {
    body = (
      <Calibration
        onDone={(next) => {
          setStored(next);
          setPhase({ kind: 'setup' });
        }}
      />
    );
  } else if (zoomChanged) {
    body = (
      <section className="vt-panel">
        <p className="vt-caution">{tcal('zoomChanged')}</p>
        <Button variant="primary" size="lg" onClick={() => setPhase({ kind: 'calibrate' })}>
          {tcal('redo')}
        </Button>
      </section>
    );
  } else if (phase.kind === 'setup') {
    body = <Setup calibration={calibration} onStart={() => setPhase({ kind: 'eye-intro', eye: 'OD' })} />;
  } else if (phase.kind === 'eye-intro') {
    const eye = phase.eye;
    const corrected = withCorrection[eye];
    body = (
      <section className="vt-panel">
        <FocusHeading>{t('eye.title', { eye: eyeName(eye) })}</FocusHeading>
        <p className="vt-lead">{t('eye.cover', { other: eyeName(OTHER[eye]) })}</p>
        <ChoiceGroup
          legend={t('correction.question')}
          inline
          choices={[
            { value: 'yes', label: tv('yes') },
            { value: 'no', label: tv('no') },
          ]}
          value={corrected === undefined ? null : corrected ? 'yes' : 'no'}
          onChange={(value) => setWithCorrection((previous) => ({ ...previous, [eye]: value === 'yes' }))}
        />
        <p className="vt-note">{t('trial.instructions')}</p>
        <div className="vt-actions">
          <Button variant="primary" size="lg" disabled={corrected === undefined} onClick={() => startEye(eye)}>
            {t('eye.start', { eye: eyeName(eye) })}
          </Button>
        </div>
      </section>
    );
  } else if (phase.kind === 'test' && phase.procedure.current) {
    const { current, trials, totalTrials } = phase.procedure;
    body = (
      <section className="vt-panel vt-test" aria-label={t('eye.title', { eye: eyeName(phase.eye) })}>
        <p className="vt-counter" aria-live="polite">
          {tc(`eye.${phase.eye}`)} · {t('trial.counter', { current: trials.length + 1, total: totalTrials })}
        </p>
        <div className="vt-test-area">
          <LandoltC
            key={trials.length}
            logMar={current.logMar}
            orientation={current.orientation}
            calibration={calibration}
            devicePixelRatio={dpr}
            label={t('trial.figure')}
          />
        </div>
        <ResponsePad onAnswer={answer} />
        <p className="vt-note">{t('trial.instructions')}</p>
      </section>
    );
  } else if (phase.kind === 'eye-result' && results[phase.eye]) {
    const eye = phase.eye;
    const result = results[eye]!;
    const next = eye === 'OD' ? () => setPhase({ kind: 'eye-intro', eye: 'OS' }) : () => setPhase({ kind: 'summary' });
    body = (
      <section className="vt-panel">
        <FocusHeading>{t('result.title', { eye: eyeName(eye) })}</FocusHeading>
        <AcuityResultView result={result} />
        {result.logMar !== null && <VariationNote />}
        <div className="vt-actions">
          <Button variant={result.logMar === null ? 'secondary' : 'primary'} size="lg" onClick={next}>
            {eye === 'OD' ? t('next') : tc('action.continue')}
          </Button>
          {result.logMar === null && (
            <Button variant="primary" size="lg" onClick={() => startEye(eye)}>
              {t('result.repeat')}
            </Button>
          )}
        </div>
      </section>
    );
  } else if (phase.kind === 'summary' && results.OD && results.OS) {
    const { OD, OS } = results;
    body = (
      <section className="vt-panel">
        <FocusHeading>{t('summary.title')}</FocusHeading>
        <div className="vt-columns">
          {EYES.map((eye) => (
            <Card key={eye} as="article" title={tc(`eye.${eye}`)}>
              <AcuityResultView result={results[eye]!} />
              {results[eye]!.logMar === null && (
                <Button onClick={() => startEye(eye)}>{t('result.repeat')}</Button>
              )}
            </Card>
          ))}
        </div>
        <VariationNote />
        <div className="vt-actions">
          <Button variant="primary" size="lg" onClick={() => onComplete({ calibration, OD, OS })}>
            {tv('saveAndContinue')}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="vt-root">
      <header className="vt-header">
        <h1 className="vt-title">{t('title')}</h1>
        <p className="vt-note">{tv('realTest')}</p>
      </header>
      {body}
      {skip}
    </div>
  );
}

function Setup({ calibration, onStart }: { calibration: ScreenCalibration; onStart(): void }) {
  const t = useMessages(acuityMessages);
  const { formatNumber } = useI18n();
  const format = (value: number) => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const normal = canMeasureNormalVision(calibration.floorLogMar);
  return (
    <section className="vt-panel">
      <FocusHeading>{t('title')}</FocusHeading>
      <p className="vt-lead">{t('intro')}</p>
      <h3>{t('distance.title')}</h3>
      <p>{t('distance.how')}</p>
      <p className="vt-note">{t('distance.error')}</p>
      <p>{t('light')}</p>
      <h3>{t('floor.title')}</h3>
      <p className="vt-measure">
        <span>{t('floor.value')}:</span>{' '}
        <QuantityValue quantity={{ value: calibration.floorLogMar, unit: 'logMAR', origin: 'derived', sources: ['PV-F1'] }} showOrigin />
        <span className="vt-note">
          {' '}
          (20/{Math.round(logMarToSnellenDenominator(calibration.floorLogMar))})
        </span>
      </p>
      <p className="vt-note">{t('floor.how')}</p>
      <p className={normal ? '' : 'vt-caution'}>
        {normal
          ? t('floor.ok')
          : t('floor.short', { needed: format(NORMAL_VISION_FLOOR_LOGMAR), floor: format(calibration.floorLogMar) })}
      </p>
      <div className="vt-actions">
        <Button variant="primary" size="lg" onClick={onStart}>
          {t('start')}
        </Button>
      </div>
    </section>
  );
}

function AcuityResultView({ result }: { result: AcuityResult }) {
  const t = useMessages(acuityMessages);
  const { formatNumber } = useI18n();
  if (result.logMar === null) {
    return (
      <>
        <p className="vt-caution">{t('result.null')}</p>
        <p className="vt-note">{t('result.trials', { correct: result.correct, trials: result.trials })}</p>
      </>
    );
  }
  return (
    <div className="vt-result">
      <p className="vt-measure">
        <span>{t('result.logMar')}:</span>{' '}
        <span className="vt-result__value">
          <QuantityValue quantity={{ value: result.logMar, unit: 'logMAR', origin: 'self-reported', sources: ['PV-F1'] }} showOrigin />
        </span>
      </p>
      {result.atScreenFloor && <p className="vt-caution">{t('result.floor')}</p>}
      <p>
        {t('result.snellen', { value: Math.round(logMarToSnellenDenominator(result.logMar)) })} ·{' '}
        {t('result.decimal', { value: formatNumber(logMarToDecimal(result.logMar), { maximumFractionDigits: 2 }) })}
      </p>
      <p className="vt-note">
        {t('result.trials', { correct: result.correct, trials: result.trials })}{' '}
        {t(result.withCorrection ? 'result.correction' : 'result.noCorrection')}.
      </p>
    </div>
  );
}

function VariationNote() {
  const t = useMessages(acuityMessages);
  const { formatNumber } = useI18n();
  return (
    <p className="vt-reference">
      {t('variation', { loa: formatNumber(ACUITY_RETEST_LOA_LOGMAR, { minimumFractionDigits: 2 }) })}
    </p>
  );
}
