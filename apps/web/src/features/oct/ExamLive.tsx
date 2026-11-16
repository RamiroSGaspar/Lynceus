import type { Ellipse } from '@app/core/math/ellipse';
import { radialScanEndpoints } from '@app/core/instrument/geometry';
import { RADIAL_SCANS, type Eye } from '@app/core';
import { useMemo, type ReactNode } from 'react';
import { useI18n, useMessages } from '../../i18n';
import { Group, Readout } from '../../ui';
import { usePrefersReducedMotion } from './canvasKit';
import type { ExamStore, ScanFrame } from './examStore';
import { fundusWindow } from './FundusCanvas';
import { patternCentre, type ScanLine } from './geometry';
import { octMessages } from './messages';
import { Ocular, RadialMarks, RingMarks, type RadialState } from './Ocular';
import { progressView, visibleCount, type ProgressView, type StepState } from './progress';
import { QualityBars, meanQualityDb, type BarScan } from './QualityBars';
import { ScanFigure } from './ScanFigure';

/** Lines, usable flags and quality of the scans that are shown. */
export function scanSeries(store: ExamStore, shown: ReadonlySet<number> | null) {
  const lines: (ScanLine | undefined)[] = [];
  const usable: (boolean | undefined)[] = [];
  const bars: (BarScan | undefined)[] = [];
  store.scans.forEach((frame, index) => {
    const visible = frame && (!shown || shown.has(index));
    lines.push(visible ? frame.header : undefined);
    usable.push(visible ? frame.analysis.usable : undefined);
    bars.push(visible ? { qualityDb: frame.analysis.qualityDb, usable: frame.analysis.usable } : undefined);
  });
  return { lines, usable, bars };
}

/** What the screen shows of an exam while the instrument takes the scans and the engine analyses them, and once it has finished. */
export interface LiveView {
  total: number;
  /** Scans on screen, in the order they arrived. With reduced motion they appear in whole chunks. */
  shown: number;
  /** The scan drawn thick on the eye: the one being taken or, once finished, the first that could not be used. */
  highlight: number | null;
  frame: ScanFrame | undefined;
  series: ReturnType<typeof scanSeries>;
  progress: ProgressView;
  unusable: number;
}

/**
 * `running`: scans arrive and the last one is the current one. Once finished, everything
 * taken is shown; `problem` then points at the first scan that could not be used: that is
 * where the problem shows.
 */
export function useLiveView(store: ExamStore | null, version: number, mode: 'running' | 'finished' | 'problem'): LiveView | null {
  const reduced = usePrefersReducedMotion();
  const total = store?.header?.numBScans ?? RADIAL_SCANS;
  const taken = store?.taken ?? 0;
  const shown = mode === 'running' ? visibleCount(taken, total, reduced) : taken;
  const series = useMemo(() => (store ? scanSeries(store, new Set(store.order.slice(0, shown))) : null), [store, version, shown]);
  if (!store || !series) return null;
  const order = store.order.slice(0, shown);
  const firstUnusable = mode === 'problem' ? store.scans.findIndex((frame) => frame !== undefined && !frame.analysis.usable) : -1;
  const highlight = mode === 'finished' ? null : firstUnusable >= 0 ? firstUnusable : order.length > 0 ? order[order.length - 1]! : null;
  return {
    total,
    shown,
    highlight,
    frame: highlight !== null ? store.scans[highlight] : mode === 'finished' ? store.scans[0] : undefined,
    series,
    progress: progressView(store.progress, { header: store.header !== null, fundus: store.fundus !== null }),
    unusable: series.usable.filter((usable) => usable === false).length,
  };
}

interface OcularProps {
  store: ExamStore | null;
  live: LiveView | null;
  eye: Eye;
  /** The ellipse the rings were measured with: drawn once the capture is accepted, over the scans, which then go quiet. */
  ellipse?: Ellipse | null;
  /** Under the disc: the readout of the capture. */
  foot?: ReactNode;
  /** Said inside the disc while there is no image. */
  empty?: ReactNode;
  working?: boolean;
}

/**
 * The eye being captured, as a disc: what moves is the datum. Each of the 48 radial scans
 * lights up on the eye, where it was taken, when it arrives. No ring of a level: there is
 * no result yet.
 */
export function CaptureOcular({ store, live, eye, ellipse, foot, empty, working }: OcularProps) {
  const t = useMessages(octMessages);
  const fundus = store?.fundus ?? null;
  const header = store?.header ?? null;
  const centre = live ? patternCentre(live.series.lines) : null;
  const image = fundus && header ? { fundus, scaleXMm: header.scaleXSloMm, scaleYMm: header.scaleYSloMm, window: fundusWindow(fundus, header.scaleXSloMm, header.scaleYSloMm, centre) } : null;
  const total = live?.total ?? RADIAL_SCANS;
  // The whole pattern is in view from the first scan on: the scans still to come are faint lines.
  const lines =
    live && centre
      ? Array.from({ length: total }, (_, index) => {
          const taken = live.series.lines[index];
          const state: RadialState = !taken
            ? 'pending'
            : index === live.highlight
              ? 'current'
              : live.series.usable[index] === false
                ? 'unusable'
                : ellipse
                  ? 'quiet'
                  : 'taken';
          return { line: taken ?? radialScanEndpoints(centre.x, centre.y, index), state };
        })
      : [];
  const label = [
    t('fundus.alt', { eye: t(`eyeName.${eye}`), taken: live?.shown ?? 0, total, unusable: live?.unusable ?? 0 }),
    live && live.highlight !== null ? t('fundus.alt.current', { n: live.highlight + 1 }) : '',
    ellipse ? t('fundus.alt.ellipse') : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Ocular
      level={null}
      label={label}
      image={image}
      marks={
        image && (
          <>
            <RadialMarks lines={lines} window={image.window} />
            {ellipse && <RingMarks ellipse={ellipse} window={image.window} />}
          </>
        )
      }
      foot={foot}
      empty={empty}
      working={working}
    />
  );
}

const STEP_CLASS: Record<StepState, string> = { done: ' is-hecho', current: ' is-en-curso', pending: '' };

/** The four steps of the analysis as a checklist on a line. Taking the scans and marking their edges run at the same time. */
export function ProgressGroup({ progress, taken, total, live = true }: { progress: ProgressView | null; taken: number; total: number; live?: boolean }) {
  const t = useMessages(octMessages);
  const view: ProgressView = progress ?? { take: 'pending', mark: 'pending', locate: 'pending', measure: 'pending', phrase: { key: 'phase.start' }, stage: null };
  const steps: { key: 'steps.take' | 'steps.mark' | 'steps.locate' | 'steps.measure'; state: StepState; counted: boolean }[] = [
    { key: 'steps.take', state: view.take, counted: true },
    { key: 'steps.mark', state: view.mark, counted: true },
    { key: 'steps.locate', state: view.locate, counted: false },
    { key: 'steps.measure', state: view.measure, counted: false },
  ];
  const stageText = view.stage === 'scans' ? t('steps.take') : view.stage === 'fit' ? t('steps.locate') : view.stage === 'measure' ? t('steps.measure') : view.stage === 'done' ? t('phase.done') : '';
  return (
    <Group icon="activity" title={t('steps.label')}>
      <ol className="co-sesion" aria-label={t('steps.label')}>
        {steps.map((step) => (
          <li key={step.key} className={`co-sesion__paso${STEP_CLASS[step.state]}`}>
            <span className="co-sesion__nodo" />
            <span>
              {t(step.key)}
              {step.counted && step.state !== 'pending' && <> · {t('steps.count', { n: taken, total })}</>}
            </span>
            <span className="co-oculto">, {t(`steps.${step.state}`)}</span>
          </li>
        ))}
      </ol>
      {progress && live && (
        <p className="co-grupo__fuente" aria-hidden="true">
          {t(view.phrase.key, { n: view.phrase.n ?? 0, total: view.phrase.total ?? total })}
        </p>
      )}
      {/* A coarse stage, said politely: a screen reader is not told about every scan. */}
      <p className="co-oculto" aria-live="polite">
        {stageText}
      </p>
    </Group>
  );
}

/** The quality of each scan against the limit of poor signal, and the two readouts that sum it up. */
export function QualityGroup({ bars, highlight, usable, source }: { bars: readonly (BarScan | undefined)[]; highlight: number | null; usable: number; source?: ReactNode }) {
  const t = useMessages(octMessages);
  const { formatNumber } = useI18n();
  const taken = bars.filter((bar) => bar !== undefined).length;
  return (
    <Group icon="gauge" title={t('quality.title')} source={source}>
      <div>
        <QualityBars scans={bars} highlight={highlight} />
        <p className="co-rotulo">{t('quality.lineHelp')}</p>
      </div>
      {taken > 0 && (
        <div className="co-lecturas">
          <Readout
            value={formatNumber(meanQualityDb(bars), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            unit={t('quality.axis')}
            label={t('accepted.quality')}
            origin="measured"
          />
          <Readout value={t('accepted.usableValue', { usable, total: taken })} label={t('accepted.usable')} origin="measured" />
        </div>
      )}
    </Group>
  );
}

/** The scan on screen with the edges the engine has just marked on it: where the thickness comes from. */
export function ScanGroup({ frame, total }: { frame: ScanFrame | undefined; total: number }) {
  const t = useMessages(octMessages);
  if (!frame) return null;
  return (
    <Group icon="corte" title={t('scan.title', { n: frame.index + 1, total })}>
      <ScanFigure frame={frame} total={total} legend />
    </Group>
  );
}
