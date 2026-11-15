import { CREW, summarize, type CaptureRequest, type CrewId, type Eye, type EyeCaptureResult, type ExamSummary } from '@app/core';
import { useEffect, useState } from 'react';
import { commonMessages } from '../../i18n/common';
import { useI18n, useMessages } from '../../i18n';
import { Button, Card, LanguageToggle } from '../../ui';
import { ExamViewer } from './ExamViewer';
import { octDevMessages } from './messages';
import { OctCaptureStep } from './OctCaptureStep';
import { useExamJob } from './useExamJob';
import './oct.css';

const DAYS = [0, 30, 90, 150] as const;

/** `#/dev/oct`: the capture step and the viewer on their own, with what they hand over. */
export function DevOctPage() {
  const t = useMessages(octDevMessages);
  const common = useMessages(commonMessages);
  const { formatNumber } = useI18n();
  const [crewId, setCrewId] = useState<CrewId>('B');
  const [eye, setEye] = useState<Eye>('OD');
  const [flightDay, setFlightDay] = useState<number>(90);
  const [attempt, setAttempt] = useState(1);
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<EyeCaptureResult | null>(null);
  const [viewerRequest, setViewerRequest] = useState<CaptureRequest | null>(null);
  const reference = useExamJob();
  const [baseline, setBaseline] = useState<{ crewId: CrewId; eye: Eye; summary: ExamSummary } | null>(null);
  const [started, setStarted] = useState<{ crewId: CrewId; eye: Eye; flightDay: number } | null>(null);

  useEffect(() => {
    if (reference.status === 'done' && reference.store?.analysis && started)
      setBaseline({ crewId: started.crewId, eye: started.eye, summary: summarize(reference.store.analysis) });
  }, [reference.status, reference.store, started]);

  const start = () => {
    setResult(null);
    setBaseline(null);
    setRun((n) => n + 1);
    setStarted({ crewId, eye, flightDay });
    reference.start({ type: 'capture', request: { crewId, eye, flightDay: 0, attempt: 1 } });
  };
  const store = reference.store;
  const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize;
  const mb = (bytes: number | null | undefined) => (bytes == null ? t('metrics.unknown') : `${formatNumber(bytes / 1e6, { maximumFractionDigits: 1 })} MB`);

  return (
    <main className="shell oct-dev">
      <LanguageToggle />
      <h1>{t('title')}</h1>
      <p>{t('intro')}</p>
      <div className="oct-dev__controls">
        <label>
          {t('crew')}
          <select value={crewId} onChange={(event) => setCrewId(event.target.value as CrewId)}>
            {CREW.map((member) => (
              <option key={member.id} value={member.id}>
                {member.id} · {member.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('eye')}
          <select value={eye} onChange={(event) => setEye(event.target.value as Eye)}>
            <option value="OD">{common('eye.OD')}</option>
            <option value="OS">{common('eye.OS')}</option>
          </select>
        </label>
        <label>
          {t('day')}
          <select value={flightDay} onChange={(event) => setFlightDay(Number(event.target.value))}>
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day === 0 ? common('preflight') : common('flightDay', { day })}
              </option>
            ))}
          </select>
        </label>
        <Button variant="primary" onClick={start}>
          {t('start')}
        </Button>
      </div>

      <h2>{t('capture')}</h2>
      {reference.status === 'running' && <p role="status">{t('baseline', { n: store?.taken ?? 0, total: 48 })}</p>}
      {(reference.status === 'error' || reference.status === 'unavailable') && <p className="oct-notice">{t('baselineFailed', { detail: reference.error ?? '' })}</p>}
      {baseline && started && (
        <OctCaptureStep key={run} crewId={started.crewId} eye={started.eye} flightDay={started.flightDay} baseline={baseline.summary} onComplete={setResult} />
      )}

      {store?.elapsedMs != null && (
        <Card title={t('metrics')}>
          <p>{t('metrics.time', { seconds: formatNumber(store.elapsedMs / 1000, { maximumFractionDigits: 1 }) })}</p>
          <p>{t('metrics.memory', { mb: mb(store.retainedBytes), screen: mb(memory), worker: mb(store.workerHeapBytes) })}</p>
        </Card>
      )}

      <Card title={t('output')}>
        {result ? <pre className="oct-dev__output">{JSON.stringify(result, null, 2)}</pre> : <p>{t('none')}</p>}
      </Card>

      <h2>{t('viewer')}</h2>
      <div className="oct-dev__controls">
        <label>
          {t('attempt')}
          <select value={attempt} onChange={(event) => setAttempt(Number(event.target.value))}>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={() => setViewerRequest({ crewId, eye, flightDay, attempt })}>{t('openViewer')}</Button>
      </div>
      {viewerRequest && (
        <ExamViewer
          key={JSON.stringify(viewerRequest)}
          request={viewerRequest}
          baseline={baseline && baseline.eye === viewerRequest.eye && baseline.crewId === viewerRequest.crewId ? baseline.summary : undefined}
        />
      )}
    </main>
  );
}
