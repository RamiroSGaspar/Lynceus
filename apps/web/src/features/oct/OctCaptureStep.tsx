import { RADIAL_SCANS, SOURCES, summarize, type CaptureAttemptRecord, type CrewId, type Eye, type EyeCaptureResult, type ExamSummary } from '@app/core';
import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { commonMessages } from '../../i18n/common';
import { useI18n, useMessages } from '../../i18n';
import { Action, Button, Group, Notice, NoticeText, Readout } from '../../ui';
import { attemptRecord, captureReducer, captureRequest, captureResult, INITIAL_CAPTURE, mainReason, MAX_ATTEMPTS, scanRejectionCounts } from './attempts';
import { CaptureOcular, ProgressGroup, QualityGroup, ScanGroup, useLiveView } from './ExamLive';
import type { ExamStore } from './examStore';
import { ExamViewerPanel } from './ExamViewer';
import { ringPlacement } from './geometry';
import { octMessages } from './messages';
import { RadialLegend } from './RadialLegend';
import { reasonText } from './reasons';
import { StrokeLegend } from './ScanFigure';
import { useExamJob } from './useExamJob';
import './oct.css';

/**
 * Typical time to take and analyse one exam on a laptop, seconds, shown so the astronaut
 * knows how long to wait. Measured in Chromium on the development laptop (shared with
 * other processes): 9 to 11 s per exam, 15 s the first time while the code warms up.
 */
export const EXPECTED_SECONDS = 10;

interface Props {
  crewId: CrewId;
  eye: Eye;
  flightDay: number;
  /** The pre-flight exam of this eye. */
  baseline: ExamSummary;
  onComplete(result: EyeCaptureResult): void;
}

/** A heading that takes the focus when it appears, so keyboard and screen-reader users follow each state. */
function StateHeading({ children, className }: { children: string; className: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: false });
  }, []);
  return (
    <h3 ref={ref} tabIndex={-1} className={className}>
      {children}
    </h3>
  );
}

function Attempts({ records }: { records: readonly CaptureAttemptRecord[] }) {
  const t = useMessages(octMessages);
  const { locale } = useI18n();
  if (records.length === 0) return null;
  return (
    <div className="co-pila oct-lista">
      <h4 className="co-micro">{t('attempts.title')}</h4>
      <ul className="co-limites">
        {records.map((record) => {
          const reason = mainReason(record);
          return (
            <li key={record.attempt}>
              {reason
                ? t('attempts.rejected', { n: record.attempt, why: reasonText(reason, locale).why })
                : t('attempts.measured', { n: record.attempt, usable: record.usableScans, total: RADIAL_SCANS })}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The quality of an accepted capture as two readouts: usable scans, and mean quality with the lowest scan under it. */
export function QualityReadouts({ exam, size }: { exam: ExamSummary; size?: 'md' | 'sm' }) {
  const t = useMessages(octMessages);
  const { formatNumber } = useI18n();
  const one = (value: number) => formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  // The text says "22.8 dB (lowest 21.2 dB)": the figure goes on the line and what is in brackets under it.
  const quality = t('accepted.qualityValue', { mean: one(exam.quality.meanQualityDb), min: one(exam.quality.minQualityDb) });
  const parts = quality.match(/^(.*?)\s+(\S+)\s+\((.*)\)$/);
  return (
    <div className="co-lecturas">
      <Readout
        size={size}
        value={t('accepted.usableValue', { usable: exam.quality.usableScans, total: exam.quality.totalScans })}
        label={t('accepted.usable')}
        origin="measured"
      />
      {parts ? (
        <Readout size={size} value={parts[1]} unit={parts[2]} sub={parts[3]} label={t('accepted.quality')} origin="measured" />
      ) : (
        <Readout size="words" value={quality} label={t('accepted.quality')} origin="measured" />
      )}
    </div>
  );
}

/** What stays of an eye already captured in this control, for the veil of the session: no level, only that it could be measured. */
export function CaptureSummary({ capture }: { capture: EyeCaptureResult }) {
  const t = useMessages(octMessages);
  const common = useMessages(commonMessages);
  const { locale } = useI18n();
  const eyeName = common(`eye.${capture.eye}`);
  if (capture.accepted) {
    return (
      <Group icon="check" title={`${eyeName} · ${t('accepted.title')}`} source={t('accepted.next')}>
        <QualityReadouts exam={capture.accepted} size="sm" />
      </Group>
    );
  }
  const last = capture.attempts[capture.attempts.length - 1];
  const reason = last ? mainReason(last) : null;
  return (
    <Group icon="eye" title={`${eyeName} · ${t('gaveUp.title')}`}>
      {reason && <p className="co-grupo__fuente">{reasonText(reason, locale).why}</p>}
    </Group>
  );
}

function RejectedScans({ store }: { store: ExamStore }) {
  const t = useMessages(octMessages);
  const { locale } = useI18n();
  const analysis = store.analysis;
  if (!analysis) return null;
  const counts = scanRejectionCounts(analysis.scans);
  if (counts.length === 0) return null;
  return (
    <div className="co-pila oct-lista">
      <h4 className="co-micro">{t('rejected.scans')}</h4>
      <ul className="co-limites">
        {counts.map(({ reason, count }) => (
          <li key={reason}>{t('rejected.scanCount', { count, total: analysis.quality.totalScans, why: reasonText(reason, locale).why })}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Guided-session step: capture and analysis of one eye, with up to three attempts
 * (spec 06, section 3). It does not decide levels or show the clinical result.
 *
 * It fills the centre and the right side of the session's cockpit: the eye being taken as a
 * disc, with its readout under it, and next to it the progress of the analysis, the quality
 * of each scan and the scan on screen.
 */
export function OctCaptureStep({ crewId, eye, flightDay, baseline, onComplete }: Props) {
  const t = useMessages(octMessages);
  const common = useMessages(commonMessages);
  const { locale } = useI18n();
  const [state, dispatch] = useReducer(captureReducer, INITIAL_CAPTURE);
  const job = useExamJob();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const request = captureRequest(crewId, eye, flightDay, state.attempt);
  const eyeName = t(`eyeName.${eye}`);
  // What the instrument and the engine sent stays on screen until the next capture starts.
  const store = state.phase === 'ready' ? null : job.store;

  useEffect(() => {
    if (state.phase !== 'running') return;
    const analysis = job.store?.analysis;
    if (job.status === 'done' && analysis) dispatch({ type: 'analysed', record: attemptRecord(request, analysis), summary: summarize(analysis) });
    else if (job.status === 'error') dispatch({ type: 'failed', detail: job.error ?? '' });
    else if (job.status === 'unavailable') dispatch({ type: 'unavailable', detail: job.error ?? '' });
    // `request` follows `state.attempt`, which only changes outside the running phase.
  }, [job.status, state.phase]);

  const capture = () => {
    setNotice(null);
    setViewerOpen(false);
    dispatch({ type: 'start' });
    job.start({ type: 'capture', request, baseline });
  };
  const stop = () => {
    job.cancel();
    dispatch({ type: 'cancel' });
    setNotice(t('running.cancelled'));
  };
  const retry = () => {
    job.cancel();
    setNotice(null);
    dispatch({ type: 'retry' });
  };
  const finish = () => {
    job.cancel();
    const result = captureResult(eye, state);
    if (result) onComplete(result);
  };
  const giveUpImage = () => {
    job.cancel();
    onComplete({ eye, attempts: state.records, accepted: null });
  };

  const live = useLiveView(store, job.version, state.phase === 'running' ? 'running' : state.phase === 'accepted' ? 'finished' : 'problem');
  const lastRecord = state.records[state.records.length - 1];
  const lastReason = lastRecord ? mainReason(lastRecord) : null;
  const attemptText = t('attempt', { n: state.attempt, max: MAX_ATTEMPTS });
  const repeating = state.phase === 'ready' && state.attempt > 1 && lastReason !== null;
  const accepted = state.phase === 'accepted' ? state.accepted : null;

  let foot: ReactNode = null;
  if (state.phase === 'running' && live) {
    foot = (
      <div role="status">
        <Readout
          size="hero"
          value={live.shown}
          unit={t('steps.count', { n: '', total: live.total }).trim()}
          sub={attemptText}
          label={live.progress.stage === 'fit' ? t('steps.locate') : live.progress.stage === 'measure' ? t('steps.measure') : t('steps.take')}
          origin="measured"
        />
      </div>
    );
  } else if (accepted) {
    foot = (
      <Readout
        size="hero"
        value={accepted.quality.usableScans}
        unit={t('steps.count', { n: '', total: accepted.quality.totalScans }).trim()}
        sub={attemptText}
        label={t('accepted.usable')}
        origin="measured"
      />
    );
  }

  return (
    <>
      <section className="co-cabina__escena co-cabina__escena--captura" aria-labelledby={`oct-title-${eye}`}>
        <div className="co-halo oct-cabeza">
          <h2 id={`oct-title-${eye}`} className="co-titulo">
            {t('title', { eye: eyeName })}
          </h2>
          {state.phase !== 'running' && !accepted && (
            <p className="co-rotulo">
              {common('flightDay', { day: flightDay })} · {attemptText}
            </p>
          )}
        </div>

        {state.phase === 'ready' && (
          <div className="co-halo oct-texto">
            {repeating && lastReason ? (
              <Notice kind="unmeasured" titleLevel={3} focusTitle title={t('ready.repeatTitle')}>
                <NoticeText>{reasonText(lastReason, locale).why}</NoticeText>
                <NoticeText>{reasonText(lastReason, locale).advice}</NoticeText>
              </Notice>
            ) : (
              <StateHeading className="co-oculto">{t('ready.capture', { eye: eyeName })}</StateHeading>
            )}
            <p className="co-texto">{t('ready.what')}</p>
            <p className="co-nota">{t('ready.duration', { seconds: EXPECTED_SECONDS })}</p>
            <p className="co-nota">{t('ready.simulated')}</p>
            {notice && <Notice role="status" title={notice} />}
            <Attempts records={state.records} />
            <Button variant="primary" size="lg" icon="scan-eye" onClick={capture}>
              {t('ready.capture', { eye: eyeName })}
            </Button>
          </div>
        )}

        {state.phase === 'running' && store && (
          <>
            {/* Said to assistive technology only: on screen the readout under the eye already says what is going on. */}
            <StateHeading className="co-oculto">{t('running.title')}</StateHeading>
            <CaptureOcular store={store} live={live} eye={eye} foot={foot} working />
            <div className="co-halo co-cabina__leyenda">
              <RadialLegend current />
            </div>
            <Button icon="x" onClick={stop}>
              {t('running.cancel')}
            </Button>
          </>
        )}

        {accepted && store?.analysis && (
          <>
            <StateHeading className="co-subtitulo co-halo">{t('accepted.title')}</StateHeading>
            <CaptureOcular store={store} live={live} eye={eye} ellipse={ringPlacement(accepted, baseline)?.ellipse ?? null} foot={foot} />
            {/* The next step stays in the first view, right under the readout; what explains the drawing comes after it. */}
            <div className="co-halo co-fila oct-acciones">
              <Button variant="primary" size="lg" iconEnd="arrow-right" onClick={finish}>
                {common('action.continue')}
              </Button>
              <Action icon="layers" onClick={() => setViewerOpen((open) => !open)} aria-expanded={viewerOpen}>
                {viewerOpen ? t('accepted.hideViewer') : t('accepted.viewer')}
              </Action>
            </div>
            <div className="co-halo co-cabina__leyenda">
              <StrokeLegend keys={['opening', 'zone', 'rings']} />
            </div>
            <div className="co-halo oct-texto">
              {accepted.bmo && <p className="co-nota">{t('accepted.ellipse', { used: accepted.bmo.pointsUsed, rejected: accepted.bmo.pointsRejected })}</p>}
              <p className="co-nota">{t('accepted.next')}</p>
            </div>
          </>
        )}

        {state.phase === 'rejected' && store?.analysis && lastReason && (
          <>
            <div className="co-halo oct-texto">
              <Notice kind="unmeasured" role="status" titleLevel={3} focusTitle title={t('rejected.title')}>
                <NoticeText>
                  {t('rejected.why')}: {reasonText(lastReason, locale).why}
                </NoticeText>
                <NoticeText>
                  {t('rejected.todo')}: {reasonText(lastReason, locale).advice}
                </NoticeText>
              </Notice>
              <RejectedScans store={store} />
              <Button variant="primary" size="lg" icon="rotate-ccw" onClick={retry}>
                {t('rejected.retry', { n: state.attempt + 1, max: MAX_ATTEMPTS })}
              </Button>
            </div>
            <CaptureOcular store={store} live={live} eye={eye} />
            <div className="co-halo co-cabina__leyenda">
              <RadialLegend />
            </div>
          </>
        )}

        {state.phase === 'gave-up' && (
          <div className="co-halo oct-texto">
            <Notice kind="unmeasured" role="status" titleLevel={3} focusTitle title={t('gaveUp.title')}>
              <NoticeText>{t('gaveUp.body')}</NoticeText>
              {lastReason && (
                <NoticeText>
                  {t('gaveUp.reason')}: {reasonText(lastReason, locale).why}
                </NoticeText>
              )}
            </Notice>
            <Attempts records={state.records} />
            <Button variant="primary" size="lg" iconEnd="arrow-right" onClick={finish}>
              {t('gaveUp.continue')}
            </Button>
          </div>
        )}

        {state.phase === 'unavailable' && (
          <div className="co-halo oct-texto">
            <Notice role="alert" titleLevel={3} focusTitle title={t('unavailable.title')}>
              <NoticeText>{t('unavailable.body')}</NoticeText>
              {state.detail && <NoticeText>{state.detail}</NoticeText>}
            </Notice>
            <div className="co-fila">
              <Button variant="primary" iconEnd="arrow-right" onClick={giveUpImage}>
                {t('unavailable.continue')}
              </Button>
              <Button icon="rotate-ccw" onClick={retry}>
                {t('unavailable.retry')}
              </Button>
            </div>
          </div>
        )}

        {state.phase === 'error' && (
          <div className="co-halo oct-texto">
            <Notice role="alert" titleLevel={3} focusTitle title={t('error.title')}>
              <NoticeText>{t('error.body', { detail: state.detail })}</NoticeText>
            </Notice>
            <div className="co-fila">
              <Button variant="primary" icon="rotate-ccw" onClick={retry}>
                {t('unavailable.retry')}
              </Button>
              <Button iconEnd="arrow-right" onClick={giveUpImage}>
                {t('unavailable.continue')}
              </Button>
            </div>
          </div>
        )}
      </section>

      <aside className="co-velo co-velo--der co-cabina__lado" aria-label={t('steps.label')}>
        <ProgressGroup progress={live?.progress ?? null} taken={live?.shown ?? 0} total={live?.total ?? RADIAL_SCANS} live={state.phase === 'running'} />
        {live && store && (
          <QualityGroup
            bars={live.series.bars}
            highlight={live.highlight}
            usable={live.series.usable.filter((usable) => usable === true).length}
            source={accepted ? t('accepted.qualityHow', { source: SOURCES.P13?.citation ?? 'P13' }) : undefined}
          />
        )}
        {live && <ScanGroup frame={live.frame} total={live.total} />}
      </aside>

      {viewerOpen && accepted && store && (
        <div className="co-detalle co-velo co-cabina__bajo">
          <ExamViewerPanel store={store} request={request} baseline={baseline} />
        </div>
      )}
    </>
  );
}
