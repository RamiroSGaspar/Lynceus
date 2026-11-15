import type { Eye } from '@app/core';
import { useMemo } from 'react';
import { useMessages } from '../../i18n';
import { BScanCanvas, CAPTURE_LAYERS } from './BScanCanvas';
import { usePrefersReducedMotion } from './canvasKit';
import type { ExamStore } from './examStore';
import { FundusCanvas } from './FundusCanvas';
import type { ScanLine } from './geometry';
import { octMessages } from './messages';
import { progressView, visibleCount, type StepState } from './progress';
import { QualityBars, type BarScan } from './QualityBars';

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

const STATE_MARK: Record<StepState, string> = { done: '✓', current: '▶', pending: '○' };

/** What the screen shows while the instrument takes the scans and the engine analyses them. */
export function ExamLive({ store, version, eye, showProgress = true }: { store: ExamStore; version: number; eye: Eye; showProgress?: boolean }) {
  const t = useMessages(octMessages);
  const reduced = usePrefersReducedMotion();
  const total = store.header?.numBScans ?? 48;
  const visible = visibleCount(store.taken, total, reduced);
  const shownOrder = store.order.slice(0, visible);
  // Once finished (a rejected capture), show the first scan that could not be used: that is where the problem shows.
  const firstUnusable = showProgress ? -1 : store.scans.findIndex((f) => f !== undefined && !f.analysis.usable);
  const latest = firstUnusable >= 0 ? firstUnusable : shownOrder.length > 0 ? shownOrder[shownOrder.length - 1]! : null;
  const highlightKind = showProgress ? 'current' : 'selected';
  const frame = latest !== null ? store.scans[latest] : undefined;
  const series = useMemo(() => scanSeries(store, new Set(shownOrder)), [store, version, visible]);
  const view = progressView(store.progress, { header: store.header !== null, fundus: store.fundus !== null });
  const phrase = t(view.phrase.key, { n: view.phrase.n ?? 0, total: view.phrase.total ?? total });
  const steps: { key: 'steps.take' | 'steps.mark' | 'steps.locate' | 'steps.measure'; state: StepState; count?: string }[] = [
    { key: 'steps.take', state: view.take, count: t('steps.count', { n: store.taken, total }) },
    { key: 'steps.mark', state: view.mark, count: t('steps.count', { n: store.taken, total }) },
    { key: 'steps.locate', state: view.locate },
    { key: 'steps.measure', state: view.measure },
  ];
  const stageText = view.stage === 'scans' ? t('steps.take') : view.stage === 'fit' ? t('steps.locate') : view.stage === 'measure' ? t('steps.measure') : view.stage === 'done' ? t('phase.done') : '';
  const unusable = series.usable.filter((u) => u === false).length;
  const fundusLabel = [
    t('fundus.alt', { eye: t(`eyeName.${eye}`), taken: shownOrder.length, total, unusable }),
    latest !== null ? t('fundus.alt.current', { n: latest + 1 }) : '',
  ].join(' ');

  return (
    <div className="oct-live">
      <div className="oct-live__images">
        <figure className="oct-figure oct-figure--fundus">
          <figcaption>{t('fundus.title')}</figcaption>
          {store.fundus && store.header ? (
            <FundusCanvas
              fundus={store.fundus}
              scaleXMm={store.header.scaleXSloMm}
              scaleYMm={store.header.scaleYSloMm}
              lines={series.lines}
              usable={series.usable}
              highlight={latest}
              highlightKind={highlightKind}
              label={fundusLabel}
              mark={t('simulatedMark')}
            />
          ) : (
            <div className="oct-placeholder oct-placeholder--square">{t('phase.fundus')}</div>
          )}
          <p className="oct-legend">
            <span>
              <span className="oct-swatch oct-swatch--usable" aria-hidden="true" />
              {t('legend.usable')}
            </span>
            <span>
              <span className="oct-swatch oct-swatch--unusable" aria-hidden="true" />
              {t('legend.unusable')}
            </span>
            <span>
              <span className="oct-swatch oct-swatch--current" aria-hidden="true" />
              {t(showProgress ? 'legend.current' : 'legend.selected')}
            </span>
          </p>
        </figure>
        <figure className="oct-figure oct-figure--scan">
          <figcaption>{latest !== null ? t('scan.title', { n: latest + 1, total }) : t('scan.waiting')}</figcaption>
          {frame ? (
            <BScanCanvas
              frame={frame}
              layers={CAPTURE_LAYERS}
              label={`${t('scan.alt', { n: frame.index + 1, total })} ${t('scan.alt.layers', { layers: [t('layer.ilm'), t('layer.bm'), t('layer.bmo')].join(', ') })}${frame.analysis.usable ? '' : ` ${t('scan.alt.unusable')}`}`}
              mark={t('simulatedMark')}
            />
          ) : (
            <div className="oct-placeholder oct-placeholder--scan">{t('scan.waiting')}</div>
          )}
          <LayerLegend keys={['ilm', 'bm', 'bmo']} />
        </figure>
      </div>
      <QualityBars scans={series.bars} highlight={latest} />
      {showProgress && (
      <div className="oct-progress">
        <ol className="oct-steps" aria-label={t('steps.label')}>
          {steps.map((step) => (
            <li key={step.key} className={`oct-steps__item oct-steps__item--${step.state}`}>
              <span aria-hidden="true" className="oct-steps__mark">
                {STATE_MARK[step.state]}
              </span>
              <span>{t(step.key)}</span>
              {step.count && step.state !== 'pending' && <span className="oct-muted"> · {step.count}</span>}
              <span className="oct-sr-only"> ({t(`steps.${step.state}`)})</span>
            </li>
          ))}
        </ol>
        <p className="oct-phase">{phrase}</p>
        <p className="oct-sr-only" aria-live="polite">
          {stageText}
        </p>
      </div>
      )}
    </div>
  );
}

/** Name and stroke of each layer, so nothing depends on colour alone. */
export function LayerLegend({ keys }: { keys: readonly ('ilm' | 'bm' | 'bmo' | 'rings' | 'zone')[] }) {
  const t = useMessages(octMessages);
  return (
    <p className="oct-legend">
      {keys.map((key) => (
        <span key={key}>
          <LayerSwatch layer={key} />
          {t(`layer.${key}`)}: {t(`layer.${key}.style`)}
        </span>
      ))}
    </p>
  );
}

export function LayerSwatch({ layer }: { layer: 'ilm' | 'bm' | 'bmo' | 'rings' | 'zone' }) {
  return (
    <svg width="28" height="14" aria-hidden="true" className={`oct-layer-swatch oct-layer-swatch--${layer}`}>
      {layer === 'ilm' && <line x1="1" y1="7" x2="27" y2="7" />}
      {layer === 'bm' && <line x1="1" y1="7" x2="27" y2="7" strokeDasharray="7 4" />}
      {layer === 'bmo' && (
        <g>
          <circle cx="14" cy="7" r="4.5" fill="none" />
          <line x1="8" y1="7" x2="20" y2="7" />
          <line x1="14" y1="1" x2="14" y2="13" />
        </g>
      )}
      {layer === 'rings' && <line x1="14" y1="0" x2="14" y2="14" strokeDasharray="2 3" />}
      {layer === 'zone' && <rect x="1" y="1" width="26" height="12" />}
    </svg>
  );
}
