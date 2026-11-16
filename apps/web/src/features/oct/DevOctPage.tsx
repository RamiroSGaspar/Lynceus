import { CREW, summarize, type CaptureRequest, type CrewId, type Eye, type EyeCaptureResult, type ExamSummary } from '@app/core';
import { useEffect, useState } from 'react';
import { commonMessages } from '../../i18n/common';
import { useI18n, useMessages } from '../../i18n';
import { BrandStill, Button, Group, LanguageToggle, Notice, SimulatedTag } from '../../ui';
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
    <main className="co-dev">
      <header className="co-dev__cabeza co-velo">
        <div className="co-fila">
          <BrandStill />
          <SimulatedTag />
          <LanguageToggle />
        </div>
        <h1 className="co-titulo">{t('title')}</h1>
        <p className="co-nota">{t('intro')}</p>
        <div className="co-dev__controles">
          <label>
            <span className="co-rotulo">{t('crew')}</span>
            <select className="co-entrada" value={crewId} onChange={(event) => setCrewId(event.target.value as CrewId)}>
              {CREW.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.id} · {member.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="co-rotulo">{t('eye')}</span>
            <select className="co-entrada" value={eye} onChange={(event) => setEye(event.target.value as Eye)}>
              <option value="OD">{common('eye.OD')}</option>
              <option value="OS">{common('eye.OS')}</option>
            </select>
          </label>
          <label>
            <span className="co-rotulo">{t('day')}</span>
            <select className="co-entrada" value={flightDay} onChange={(event) => setFlightDay(Number(event.target.value))}>
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day === 0 ? common('preflight') : common('flightDay', { day })}
                </option>
              ))}
            </select>
          </label>
          <Button variant="primary" icon="play" onClick={start}>
            {t('start')}
          </Button>
        </div>
        <h2 className="co-micro">{t('capture')}</h2>
        {reference.status === 'running' && (
          <p className="co-nota" role="status">
            {t('baseline', { n: store?.taken ?? 0, total: 48 })}
          </p>
        )}
        {(reference.status === 'error' || reference.status === 'unavailable') && <Notice title={t('baselineFailed', { detail: reference.error ?? '' })} />}
      </header>

      {baseline && started && (
        <div className="co-cabina co-cabina--captura">
          <OctCaptureStep key={run} crewId={started.crewId} eye={started.eye} flightDay={started.flightDay} baseline={baseline.summary} onComplete={setResult} />
        </div>
      )}

      <div className="co-dev__cuerpo co-velo">
        {store?.elapsedMs != null && (
          <Group icon="clock" title={t('metrics')}>
            <p className="co-nota">{t('metrics.time', { seconds: formatNumber(store.elapsedMs / 1000, { maximumFractionDigits: 1 }) })}</p>
            <p className="co-nota">{t('metrics.memory', { mb: mb(store.retainedBytes), screen: mb(memory), worker: mb(store.workerHeapBytes) })}</p>
          </Group>
        )}

        <Group icon="clipboard-list" title={t('output')}>
          {result ? <pre className="co-dev__salida">{JSON.stringify(result, null, 2)}</pre> : <p className="co-nota">{t('none')}</p>}
        </Group>

        <Group icon="layers" title={t('viewer')}>
          <div className="co-dev__controles">
            <label>
              <span className="co-rotulo">{t('attempt')}</span>
              <select className="co-entrada" value={attempt} onChange={(event) => setAttempt(Number(event.target.value))}>
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <Button icon="layers" onClick={() => setViewerRequest({ crewId, eye, flightDay, attempt })}>
              {t('openViewer')}
            </Button>
          </div>
        </Group>
        {viewerRequest && (
          <ExamViewer
            key={JSON.stringify(viewerRequest)}
            request={viewerRequest}
            baseline={baseline && baseline.eye === viewerRequest.eye && baseline.crewId === viewerRequest.crewId ? baseline.summary : undefined}
          />
        )}
      </div>
    </main>
  );
}
