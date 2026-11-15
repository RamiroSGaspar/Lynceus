import { RADIAL_SCANS, SOURCES, summarize, type CaptureAttemptRecord, type CrewId, type Eye, type EyeCaptureResult, type ExamSummary } from '@app/core';
import { useEffect, useReducer, useRef, useState } from 'react';
import { commonMessages } from '../../i18n/common';
import { useI18n, useMessages } from '../../i18n';
import { Button, OriginTag, SimulatedNotice } from '../../ui';
import { attemptRecord, captureReducer, captureRequest, captureResult, INITIAL_CAPTURE, mainReason, MAX_ATTEMPTS, scanRejectionCounts } from './attempts';
import { ExamLive, scanSeries } from './ExamLive';
import type { ExamStore } from './examStore';
import { ExamViewerPanel } from './ExamViewer';
import { FundusCanvas } from './FundusCanvas';
import { ringPlacement } from './geometry';
import { octMessages } from './messages';
import { reasonText } from './reasons';
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
function StateHeading({ children }: { children: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: false });
  }, []);
  return (
    <h3 ref={ref} tabIndex={-1} className="oct-state-heading">
      {children}
    </h3>
  );
}

function Attempts({ records }: { records: readonly CaptureAttemptRecord[] }) {
  const t = useMessages(octMessages);
  const { locale } = useI18n();
  if (records.length === 0) return null;
  return (
    <div className="oct-attempts">
      <h4>{t('attempts.title')}</h4>
      <ul>
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

/**
 * Guided-session step: capture and analysis of one eye, with up to three attempts
 * (spec 06, section 3). It does not decide levels or show the clinical result.
 */
export function OctCaptureStep({ crewId, eye, flightDay, baseline, onComplete }: Props) {
  const t = useMessages(octMessages);
  const common = useMessages(commonMessages);
  const { locale, formatNumber } = useI18n();
  const [state, dispatch] = useReducer(captureReducer, INITIAL_CAPTURE);
  const job = useExamJob();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const request = captureRequest(crewId, eye, flightDay, state.attempt);
  const store = job.store;
  const eyeName = t(`eyeName.${eye}`);

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

  const one = (v: number) => formatNumber(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const series = state.phase === 'accepted' && store ? scanSeries(store, null) : null;
  const lastRecord = state.records[state.records.length - 1];
  const lastReason = lastRecord ? mainReason(lastRecord) : null;

  return (
    <section className="oct" aria-labelledby={`oct-title-${eye}`}>
      <header className="oct-header">
        <h2 id={`oct-title-${eye}`} className="oct-title">
          {t('title', { eye: eyeName })}
        </h2>
        <p className="oct-muted">
          {common('flightDay', { day: flightDay })} · {t('attempt', { n: state.attempt, max: MAX_ATTEMPTS })}
        </p>
      </header>

      {state.phase === 'ready' && (
        <div className="oct-panel">
          {state.attempt > 1 && lastReason ? (
            <StateHeading>{t('ready.repeatTitle')}</StateHeading>
          ) : (
            <StateHeading>{t('ready.capture', { eye: eyeName })}</StateHeading>
          )}
          {state.attempt > 1 && lastReason && (
            <div className="oct-reason">
              <p>
                <strong>{t('attempt', { n: state.attempt, max: MAX_ATTEMPTS })}.</strong> {reasonText(lastReason, locale).why}
              </p>
              <p>{reasonText(lastReason, locale).advice}</p>
            </div>
          )}
          <p>{t('ready.what')}</p>
          <p>{t('ready.duration', { seconds: EXPECTED_SECONDS })}</p>
          <p className="oct-muted">{t('ready.simulated')}</p>
          {notice && (
            <p className="oct-notice" role="status">
              {notice}
            </p>
          )}
          <Attempts records={state.records} />
          <p>
            <Button variant="primary" size="lg" onClick={capture}>
              {t('ready.capture', { eye: eyeName })}
            </Button>
          </p>
        </div>
      )}

      {state.phase === 'running' && store && (
        <div className="oct-panel">
          <StateHeading>{t('running.title')}</StateHeading>
          <ExamLive store={store} version={job.version} eye={eye} />
          <p>
            <Button onClick={stop}>{t('running.cancel')}</Button>
          </p>
        </div>
      )}

      {state.phase === 'accepted' && store?.analysis && store.header && store.fundus && (
        <div className="oct-panel">
          <StateHeading>{t('accepted.title')}</StateHeading>
          <div className="oct-accepted">
            <div className="oct-accepted__facts">
              <dl className="oct-facts">
                <div>
                  <dt>{t('accepted.usable')}</dt>
                  <dd>
                    <span className="qty">
                      <span className="qty__value">
                        {t('accepted.usableValue', { usable: state.accepted.quality.usableScans, total: state.accepted.quality.totalScans })}
                      </span>
                    </span>{' '}
                    <OriginTag origin="measured" />
                  </dd>
                </div>
                <div>
                  <dt>{t('accepted.quality')}</dt>
                  <dd>
                    <span className="qty">
                      <span className="qty__value">
                        {t('accepted.qualityValue', { mean: one(state.accepted.quality.meanQualityDb), min: one(state.accepted.quality.minQualityDb) })}
                      </span>
                    </span>{' '}
                    <OriginTag origin="measured" />
                    <span className="oct-muted oct-block">{t('accepted.qualityHow', { source: SOURCES.P13?.citation ?? 'P13' })}</span>
                  </dd>
                </div>
              </dl>
              {state.accepted.bmo && (
                <p>
                  {t('accepted.ellipse', { used: state.accepted.bmo.pointsUsed, rejected: state.accepted.bmo.pointsRejected })}
                </p>
              )}
              <p className="oct-muted">{t('accepted.next')}</p>
              <p className="oct-actions">
                <Button variant="primary" size="lg" onClick={finish}>
                  {common('action.continue')}
                </Button>
                <Button onClick={() => setViewerOpen((open) => !open)} aria-expanded={viewerOpen}>
                  {viewerOpen ? t('accepted.hideViewer') : t('accepted.viewer')}
                </Button>
              </p>
            </div>
            {!viewerOpen && (
              <figure className="oct-figure oct-figure--fundus">
                <figcaption>{t('fundus.title')}</figcaption>
                <FundusCanvas
                  fundus={store.fundus}
                  scaleXMm={store.header.scaleXSloMm}
                  scaleYMm={store.header.scaleYSloMm}
                  lines={series?.lines ?? []}
                  usable={series?.usable ?? []}
                  highlight={null}
                  highlightKind="selected"
                  ellipse={ringPlacement(state.accepted, baseline)?.ellipse ?? null}
                  showRings
                  label={`${t('fundus.alt', { eye: eyeName, taken: store.taken, total: state.accepted.quality.totalScans, unusable: state.accepted.quality.totalScans - state.accepted.quality.usableScans })} ${t('fundus.alt.ellipse')}`}
                  mark={t('simulatedMark')}
                />
              </figure>
            )}
          </div>
          {viewerOpen && <ExamViewerPanel store={store} request={request} baseline={baseline} />}
        </div>
      )}

      {state.phase === 'rejected' && store?.analysis && lastReason && (
        <div className="oct-panel">
          <StateHeading>{t('rejected.title')}</StateHeading>
          <div className="oct-reason">
            <h4>{t('rejected.why')}</h4>
            <p>{reasonText(lastReason, locale).why}</p>
            <h4>{t('rejected.todo')}</h4>
            <p>{reasonText(lastReason, locale).advice}</p>
          </div>
          <RejectedScans store={store} />
          <p>
            <Button variant="primary" size="lg" onClick={retry}>
              {t('rejected.retry', { n: state.attempt + 1, max: MAX_ATTEMPTS })}
            </Button>
          </p>
          <ExamLive store={store} version={job.version} eye={eye} showProgress={false} />
        </div>
      )}

      {state.phase === 'gave-up' && (
        <div className="oct-panel">
          <StateHeading>{t('gaveUp.title')}</StateHeading>
          <p>{t('gaveUp.body')}</p>
          {lastReason && (
            <p>
              <strong>{t('gaveUp.reason')}:</strong> {reasonText(lastReason, locale).why}
            </p>
          )}
          <Attempts records={state.records} />
          <p>
            <Button variant="primary" size="lg" onClick={finish}>
              {t('gaveUp.continue')}
            </Button>
          </p>
        </div>
      )}

      {state.phase === 'unavailable' && (
        <div className="oct-panel">
          <StateHeading>{t('unavailable.title')}</StateHeading>
          <p>{t('unavailable.body')}</p>
          <p className="oct-muted">{state.detail}</p>
          <p className="oct-actions">
            <Button variant="primary" onClick={giveUpImage}>
              {t('unavailable.continue')}
            </Button>
            <Button onClick={retry}>{t('unavailable.retry')}</Button>
          </p>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="oct-panel">
          <StateHeading>{t('error.title')}</StateHeading>
          <p>{t('error.body', { detail: state.detail })}</p>
          <p className="oct-actions">
            <Button variant="primary" onClick={retry}>
              {t('unavailable.retry')}
            </Button>
            <Button onClick={giveUpImage}>{t('unavailable.continue')}</Button>
          </p>
        </div>
      )}

      <SimulatedNotice />
    </section>
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
    <div>
      <h4>{t('rejected.scans')}</h4>
      <ul>
        {counts.map(({ reason, count }) => (
          <li key={reason}>{t('rejected.scanCount', { count, total: analysis.quality.totalScans, why: reasonText(reason, locale).why })}</li>
        ))}
      </ul>
    </div>
  );
}
