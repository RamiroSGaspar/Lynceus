import type { CaptureRequest, ExamSummary } from '@app/core';
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useI18n, useMessages } from '../../i18n';
import { Button, SimulatedNotice } from '../../ui';
import { ALL_LAYERS, BScanCanvas, LAYER_KEYS, type LayerSet } from './BScanCanvas';
import { ExamLive, LayerSwatch, scanSeries } from './ExamLive';
import type { ExamStore, ScanFrame } from './examStore';
import { FundusCanvas } from './FundusCanvas';
import {
  columnDistancesUm,
  columnToFundusMm,
  patternCentre,
  ringContribution,
  ringPlacement,
  roughnessContribution,
  navigate,
  scanAngleDeg,
  type MeasureInputs,
  type Point,
} from './geometry';
import { octMessages } from './messages';
import { QualityBars } from './QualityBars';
import { reasonText, SCAN_REJECTIONS } from './reasons';
import { useExamJob } from './useExamJob';
import { ComparePanel, DownloadPanel, NumberSource, SimulationPanel, type MeasureId, type Selection } from './ViewerPanels';
import './oct.css';

/** Fundus positions of the columns of a measure, one in `step`, for the dots on the fundus image. */
function maskDots(masks: readonly Uint8Array[], inputs: MeasureInputs, step = 3): { x: number; y: number; used: boolean }[] {
  const dots: { x: number; y: number; used: boolean }[] = [];
  masks.forEach((mask, k) => {
    for (let j = 0; j < mask.length; j += step) {
      if (mask[j] === 0) continue;
      const p = columnToFundusMm(inputs.lines[k]!, inputs.sizeX, j);
      dots.push({ ...p, used: mask[j] === 2 });
    }
  });
  return dots;
}

/**
 * Viewer of an exam already analysed (spec 06, section 4): every scan with what the
 * engine marked, the fundus image with the pattern and the opening, the comparison with
 * the pre-flight exam, where each number comes from, the simulation check and the file.
 */
export function ExamViewerPanel({ store, request, baseline }: { store: ExamStore; request: CaptureRequest; baseline?: ExamSummary }) {
  const t = useMessages(octMessages);
  const { locale, formatNumber } = useI18n();
  const analysis = store.analysis;
  const header = store.header;
  const fundus = store.fundus;
  const [index, setIndex] = useState(0);
  const [layers, setLayers] = useState<LayerSet>(ALL_LAYERS);
  const [size, setSize] = useState<'fit' | 'actual'>('fit');
  const [whole, setWhole] = useState(false);
  const [measure, setMeasure] = useState<MeasureId | null>(analysis?.status === 'measured' ? 'ring0' : null);

  const series = useMemo(() => scanSeries(store, null), [store]);
  const frames = store.scans;
  const lines = series.lines;
  const placement = useMemo(() => (analysis ? ringPlacement(analysis, baseline) : null), [analysis, baseline]);
  const inputs = useMemo<MeasureInputs | null>(() => {
    const centre = patternCentre(lines);
    if (!analysis || !header || !placement || !centre || lines.some((line) => !line)) return null;
    return {
      scans: analysis.scans,
      lines: lines as NonNullable<(typeof lines)[number]>[],
      sizeX: header.sizeX,
      scaleZUm: header.scaleZMm * 1000,
      ellipse: placement.ellipse,
      centre,
    };
  }, [analysis, header, placement, lines]);
  const selection = useMemo<Selection | null>(() => {
    if (!inputs || !measure || analysis?.status !== 'measured') return null;
    if (measure === 'mrw') return { measure, contribution: null };
    if (measure === 'roughness') return { measure, contribution: { ...roughnessContribution(inputs), valueUm: Number.NaN } };
    return { measure, contribution: ringContribution(inputs, Number(measure.slice(4))) };
  }, [inputs, measure, analysis]);
  const dots = useMemo(() => (selection?.contribution && inputs ? maskDots(selection.contribution.masks, inputs) : undefined), [selection, inputs]);
  const points = useMemo<Point[]>(
    () => (analysis?.scans ?? []).flatMap((scan) => scan.bmo.flatMap((p) => (p && (measure !== 'mrw' || scan.usable) ? [{ x: p.xMm, y: p.yMm }] : []))),
    [analysis, measure],
  );
  const line = lines[index];
  const distances = useMemo(() => (placement && line && header ? columnDistancesUm(line, header.sizeX, placement.ellipse) : null), [placement, line, header]);

  if (!analysis || !header || !fundus) return null;
  const total = header.numBScans;
  const frame = frames[index] as ScanFrame | undefined;
  const go = (next: number) => setIndex(Math.min(Math.max(next, 0), total - 1));
  const onKeyDown = (event: KeyboardEvent) => {
    const next = navigate(event.key, index, total);
    if (next === null) return;
    event.preventDefault();
    go(next);
  };
  const one = (v: number, digits = 1) => formatNumber(v, { maximumFractionDigits: digits, minimumFractionDigits: digits });
  const scan = frame?.analysis;
  const scanState = scan
    ? scan.usable
      ? t('viewer.usable')
      : t('viewer.unusable', {
          reasons: SCAN_REJECTIONS.filter((r) => scan.rejections.includes(r))
            .map((r) => reasonText(r, locale).why)
            .join(' '),
        })
    : '';
  const shownLayers = LAYER_KEYS.filter((key) => layers[key]).map((key) => t(`layer.${key}`));
  const scanLabel = frame
    ? [
        t('scan.alt', { n: index + 1, total }),
        shownLayers.length > 0 ? t('scan.alt.layers', { layers: shownLayers.join(', ') }) : t('scan.alt.none'),
        scan && !scan.usable ? t('scan.alt.unusable') : '',
      ].join(' ')
    : '';
  const unusable = series.usable.filter((u) => u === false).length;
  const fundusLabel = [
    t('fundus.alt', { eye: t(`eyeName.${header.scanPosition}`), taken: store.taken, total, unusable }),
    t('fundus.alt.current', { n: index + 1 }),
    placement ? t('fundus.alt.ellipse') : '',
    layers.bmo ? t('fundus.alt.points') : '',
    dots ? t('fundus.alt.columns') : '',
  ].join(' ');

  return (
    <section className="oct-viewer" aria-labelledby="oct-viewer-title">
      <h3 id="oct-viewer-title" className="oct-viewer__title">
        {t('viewer.title')}
      </h3>
      <p className="oct-muted">{t('viewer.intro')}</p>
      {analysis.status !== 'measured' && <p className="oct-notice">{t('viewer.notMeasured')}</p>}

      <div className="oct-nav" role="group" aria-label={t('viewer.slider')}>
        <Button onClick={() => go((index - 1 + total) % total)} aria-label={t('viewer.prev')}>
          ‹
        </Button>
        <label className="oct-nav__slider">
          <span>{t('viewer.slider')}</span>
          <input
            type="range"
            min={1}
            max={total}
            step={1}
            value={index + 1}
            onChange={(event) => go(Number(event.target.value) - 1)}
            aria-valuetext={t('scan.title', { n: index + 1, total })}
          />
        </label>
        <Button onClick={() => go((index + 1) % total)} aria-label={t('viewer.next')}>
          ›
        </Button>
        <output className="oct-nav__value" aria-live="polite">
          {t('scan.title', { n: index + 1, total })}
        </output>
      </div>
      <p className="oct-muted">{t('viewer.keys')}</p>

      <div className="oct-viewer__images">
        <figure className="oct-figure oct-figure--fundus">
          <figcaption>{t('fundus.title')}</figcaption>
          <div tabIndex={0} onKeyDown={onKeyDown} className="oct-focusable" aria-label={fundusLabel} role="group">
            <FundusCanvas
              fundus={fundus}
              scaleXMm={header.scaleXSloMm}
              scaleYMm={header.scaleYSloMm}
              lines={lines}
              usable={series.usable}
              highlight={index}
              highlightKind="selected"
              ellipse={placement?.ellipse ?? null}
              showRings={layers.rings}
              points={layers.bmo || measure === 'mrw' ? points : undefined}
              columnDots={dots}
              whole={whole}
              onSelect={go}
              label={fundusLabel}
              mark={t('simulatedMark')}
            />
          </div>
          <label className="oct-check">
            <input type="checkbox" checked={whole} onChange={(event) => setWhole(event.target.checked)} />
            {t('fundus.whole')}
          </label>
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
              <span className="oct-swatch oct-swatch--selected" aria-hidden="true" />
              {t('legend.selected')}
            </span>
          </p>
        </figure>
        <figure className="oct-figure oct-figure--scan">
          <figcaption>
            {t('scan.title', { n: index + 1, total })}
            {line && scan && (
              <span className="oct-muted oct-block">
                {t('viewer.scanInfo', { angle: one(scanAngleDeg(line), 2), quality: one(scan.qualityDb) })} · {scanState}
              </span>
            )}
          </figcaption>
          {frame && (
            <BScanCanvas
              frame={frame}
              layers={layers}
              distancesUm={distances}
              mask={selection?.contribution?.masks[index] ?? null}
              size={size}
              scaleUm={{ x: header.scaleXMm * 1000, z: header.scaleZMm * 1000 }}
              scaleText={t('viewer.scale')}
              label={scanLabel}
              mark={t('simulatedMark')}
              onKeyDown={onKeyDown}
            />
          )}
          <fieldset className="oct-fieldset">
            <legend>{t('layers.title')}</legend>
            {LAYER_KEYS.map((key) => (
              <label key={key} className="oct-check">
                <input type="checkbox" checked={layers[key]} onChange={(event) => setLayers((current) => ({ ...current, [key]: event.target.checked }))} />
                <LayerSwatch layer={key} />
                <span>
                  {t(`layer.${key}`)} <span className="oct-muted">({t(`layer.${key}.style`)})</span>
                </span>
              </label>
            ))}
          </fieldset>
          <fieldset className="oct-fieldset">
            <legend>{t('viewer.size')}</legend>
            {(['fit', 'actual'] as const).map((value) => (
              <label key={value} className="oct-check">
                <input type="radio" name="oct-size" checked={size === value} onChange={() => setSize(value)} />
                {t(`viewer.size.${value}`)}
              </label>
            ))}
          </fieldset>
        </figure>
      </div>

      <QualityBarsForViewer store={store} index={index} onSelect={go} />

      <NumberSource analysis={analysis} placement={placement} selection={selection} measure={measure} onMeasure={setMeasure} index={index} />
      <ComparePanel request={request} baseline={baseline} index={index} today={store} />
      <SimulationPanel request={request} analysis={analysis} />
      <DownloadPanel request={request} header={header} />
      <SimulatedNotice />
    </section>
  );
}

function QualityBarsForViewer({ store, index, onSelect }: { store: ExamStore; index: number; onSelect: (index: number) => void }) {
  const bars = useMemo(() => scanSeries(store, null).bars, [store]);
  return <QualityBars scans={bars} highlight={index} onSelect={onSelect} />;
}

/** A finished exam on its own, regenerated from its request: the same request gives the same image. */
export function ExamViewer({ request, baseline }: { request: CaptureRequest; baseline?: ExamSummary }) {
  const t = useMessages(octMessages);
  const job = useExamJob();
  const key = JSON.stringify(request);
  useEffect(() => {
    job.start({ type: 'capture', request, baseline });
    // Restart only when the request itself changes.
  }, [key]);
  const store = job.store;
  if (job.status === 'done' && store?.analysis) return <ExamViewerPanel store={store} request={request} baseline={baseline} />;
  if (job.status === 'error' || job.status === 'unavailable')
    return (
      <p className="oct-notice" role="alert">
        {t('viewer.failed', { detail: job.error ?? '' })}
      </p>
    );
  return (
    <section className="oct-viewer" aria-busy="true">
      <h3 className="oct-viewer__title">{t('viewer.title')}</h3>
      <p role="status">{t('viewer.regenerating', { n: store?.taken ?? 0, total: store?.header?.numBScans ?? 48 })}</p>
      {store && <ExamLive store={store} version={job.version} eye={request.eye} />}
    </section>
  );
}

