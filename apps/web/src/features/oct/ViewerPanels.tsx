import { SOURCES, volFileBytes, type CaptureRequest, type EyeGroundTruth, type ExamAnalysis, type ExamSummary, type Quantity, type VolHeader } from '@app/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n, useMessages } from '../../i18n';
import { StrokeSample } from './ScanFigure';
import { Action, Button, Icon, Notice, QuantityValue, Readout } from '../../ui';
import { BScanCanvas, type LayerSet } from './BScanCanvas';
import type { ExamStore, ScanFrame } from './examStore';
import { columnDistancesUm, ringOf, ringPlacement, thicknessProfileUm, type Contribution, type RingPlacement } from './geometry';
import { startJob, type JobHandle } from './jobs';
import { octMessages } from './messages';
import { useExamJob } from './useExamJob';

export type MeasureId = 'ring0' | 'ring1' | 'ring2' | 'ring3' | 'mrw' | 'roughness';

export interface Selection {
  measure: MeasureId;
  /** Null for the minimum rim width, which comes from the opening points. */
  contribution: Contribution | null;
}

function citations(quantity: Quantity): string {
  return (quantity.sources ?? []).map((id) => SOURCES[id]?.citation ?? id).join('; ');
}

function maskCounts(mask: Uint8Array | undefined): { used: number; missing: number } {
  let used = 0;
  let missing = 0;
  if (mask) for (const m of mask) m === 2 ? used++ : m === 1 && missing++;
  return { used, missing };
}

/** "Where the number comes from": which columns of which scans entered a measure (spec 06, section 4). */
export function NumberSource({
  analysis,
  placement,
  selection,
  measure,
  onMeasure,
  index,
}: {
  analysis: ExamAnalysis;
  placement: RingPlacement | null;
  selection: Selection | null;
  measure: MeasureId | null;
  onMeasure: (measure: MeasureId) => void;
  index: number;
}) {
  const t = useMessages(octMessages);
  const { formatNumber } = useI18n();
  const one = (v: number) => formatNumber(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (analysis.status !== 'measured' || !placement) {
    return (
      <section className="oct-panel">
        <h4 className="co-micro">{t('source.title')}</h4>
        <p className="co-nota">{t('source.none')}</p>
      </section>
    );
  }
  const options: { id: MeasureId; label: string; quantity: Quantity | null }[] = [
    ...analysis.rings.map((ring, r) => ({
      id: `ring${r}` as MeasureId,
      label: r === 0 ? t('source.ringMain') : t('source.ring', { inner: ring.innerUm, outer: ring.outerUm }),
      quantity: ring.thickness,
    })),
    { id: 'mrw', label: t('source.mrw'), quantity: analysis.mrwUm },
    { id: 'roughness', label: t('source.roughness'), quantity: analysis.bmRoughnessUm },
  ];
  const chosen = options.find((option) => option.id === measure);
  const contribution = selection?.contribution ?? null;
  const onScan = maskCounts(contribution?.masks[index]);
  const usableScans = analysis.scans.filter((scan) => scan.usable);
  const mrwPoints = usableScans.reduce((n, scan) => n + scan.bmo.filter(Boolean).length, 0);
  const ring = measure?.startsWith('ring') ? analysis.rings[Number(measure.slice(4))] : undefined;
  return (
    <section className="oct-panel" aria-labelledby="oct-source-title">
      <h4 id="oct-source-title" className="co-micro">
        {t('source.title')}
      </h4>
      <fieldset className="co-casillas">
        <legend className="co-rotulo">{t('source.pick')}</legend>
        {options.map((option) => (
          <label key={option.id} className="co-casilla">
            <input type="radio" name="oct-measure" checked={measure === option.id} onChange={() => onMeasure(option.id)} disabled={!option.quantity} />
            {option.label}
          </label>
        ))}
      </fieldset>
      {chosen?.quantity && (
        <div className="co-pila oct-panel__texto">
          <p className="co-texto">
            {t('source.engine')}: <QuantityValue quantity={chosen.quantity} digits={1} showOrigin />
          </p>
          {ring && contribution && (
            <>
              <p className="co-nota">
                {t('source.ringHow', {
                  columns: contribution.columns,
                  scans: contribution.scans,
                  total: analysis.quality.totalScans,
                  inner: ring.innerUm,
                  outer: ring.outerUm,
                  missing: contribution.missing,
                })}
              </p>
              <p className="co-nota">{t('source.recomputed', { value: one(contribution.valueUm) })}</p>
            </>
          )}
          {measure === 'mrw' && <p className="co-nota">{t('source.mrwHow', { points: mrwPoints })}</p>}
          {measure === 'roughness' && contribution && <p className="co-nota">{t('source.roughnessHow', { columns: contribution.columns, scans: contribution.scans })}</p>}
          <p className="co-rotulo">
            {measure === 'mrw'
              ? t('source.onScanPoints', { points: analysis.scans[index]?.usable ? analysis.scans[index]!.bmo.filter(Boolean).length : 0 })
              : t('source.onScan', onScan)}
          </p>
          {placement.source !== 'this-exam' && measure !== 'mrw' && (
            <p className="co-rotulo">{t(placement.source === 'reference-shape' ? 'source.placement.reference' : 'source.placement.thisOnly')}</p>
          )}
          {chosen.quantity.sources && chosen.quantity.sources.length > 0 && <p className="co-rotulo">{t('source.sources', { sources: citations(chosen.quantity) })}</p>}
        </div>
      )}
    </section>
  );
}

const EDGE_LAYERS: LayerSet = { ilm: true, bm: true, bmo: true, rings: false, zone: false };

/** Total retinal thickness along one scan, today against before the flight. */
function ThicknessProfile({ today, before, scaleXUm, zone, label }: { today: Float64Array; before: Float64Array; scaleXUm: number; zone: Float64Array | null; label: string }) {
  const t = useMessages(octMessages);
  const W = 640;
  const H = 220;
  const L = 48;
  const R = 8;
  const T = 10;
  const B = 34;
  const n = today.length;
  const values = [...today, ...before].filter(Number.isFinite);
  const lo = values.length > 0 ? Math.floor(Math.min(...values) / 50) * 50 : 0;
  const hi = values.length > 0 ? Math.ceil(Math.max(...values) / 50) * 50 : 500;
  const halfMm = (((n - 1) / 2) * scaleXUm) / 1000;
  const x = (j: number) => L + (j / (n - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / Math.max(hi - lo, 1)) * (H - T - B);
  const path = (series: Float64Array) => {
    let d = '';
    let open = false;
    for (let j = 0; j < n; j++) {
      const v = series[j]!;
      if (!Number.isFinite(v)) {
        open = false;
        continue;
      }
      d += `${open ? 'L' : 'M'}${x(j).toFixed(1)} ${y(v).toFixed(1)}`;
      open = true;
    }
    return d;
  };
  // Band between the two curves, run by run where both exist.
  const bands: string[] = [];
  let run: number[] = [];
  const flush = () => {
    if (run.length > 1) {
      const fwd = run.map((j) => `${x(j).toFixed(1)} ${y(today[j]!).toFixed(1)}`);
      const back = [...run].reverse().map((j) => `${x(j).toFixed(1)} ${y(before[j]!).toFixed(1)}`);
      bands.push(`M${fwd.join('L')}L${back.join('L')}Z`);
    }
    run = [];
  };
  for (let j = 0; j < n; j++) {
    if (Number.isFinite(today[j]!) && Number.isFinite(before[j]!)) run.push(j);
    else flush();
  }
  flush();
  const ticks = [];
  for (let v = lo; v <= hi; v += hi - lo > 400 ? 100 : 50) ticks.push(v);
  const zoneRects: { from: number; to: number }[] = [];
  if (zone) {
    let start = -1;
    for (let j = 0; j <= n; j++) {
      const inZone = j < n && ringOf(zone[j]!) === 0;
      if (inZone && start < 0) start = j;
      if (!inZone && start >= 0) {
        zoneRects.push({ from: start, to: j - 1 });
        start = -1;
      }
    }
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="oct-perfil">
      {zoneRects.map((r) => (
        <rect key={r.from} x={x(r.from)} y={T} width={Math.max(x(r.to) - x(r.from), 1)} height={H - T - B} className="oct-perfil__zona" />
      ))}
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="oct-perfil__grilla" />
          <text x={L - 6} y={y(v) + 4} textAnchor="end" className="oct-perfil__eje">
            {v}
          </text>
        </g>
      ))}
      {[-2, -1, 0, 1, 2].map((mm) => (
        <text key={mm} x={L + ((mm + halfMm) / (2 * halfMm)) * (W - L - R)} y={H - B + 16} textAnchor="middle" className="oct-perfil__eje">
          {mm}
        </text>
      ))}
      <text x={(L + W - R) / 2} y={H - 4} textAnchor="middle" className="oct-perfil__eje">
        {t('compare.axisX')}
      </text>
      <text x={12} y={T + (H - T - B) / 2} textAnchor="middle" className="oct-perfil__eje" transform={`rotate(-90 12 ${T + (H - T - B) / 2})`}>
        {t('compare.axisY')}
      </text>
      {bands.map((d, i) => (
        <path key={i} d={d} className="oct-perfil__diferencia" />
      ))}
      <path d={path(before)} className="oct-perfil__antes" />
      <path d={path(today)} className="oct-perfil__hoy" />
    </svg>
  );
}

/** The same scan of the pre-flight exam next to today's, with the thickness difference in view. */
export function ComparePanel({ request, baseline, index, today }: { request: CaptureRequest; baseline?: ExamSummary; index: number; today: ExamStore }) {
  const t = useMessages(octMessages);
  const { formatNumber } = useI18n();
  const one = (value: number, signed = false) =>
    formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: signed ? 'exceptZero' : 'auto' });
  const [open, setOpen] = useState(false);
  const job = useExamJob();
  const isReference = request.flightDay === 0 && request.attempt === 1;
  const toggle = () => {
    if (!open && !job.store && !isReference) job.start({ type: 'capture', request: { crewId: request.crewId, eye: request.eye, flightDay: 0, attempt: 1 } });
    setOpen((value) => !value);
  };
  const header = today.header;
  const todayFrame = today.scans[index] as ScanFrame | undefined;
  const pre = job.store;
  const preFrame = pre?.scans[index] as ScanFrame | undefined;
  const placement = useMemo(() => (today.analysis ? ringPlacement(today.analysis, baseline ?? pre?.analysis) : null), [today.analysis, baseline, pre?.analysis]);
  const zone = useMemo(
    () => (placement && todayFrame && header ? columnDistancesUm(todayFrame.header, header.sizeX, placement.ellipse) : null),
    [placement, todayFrame, header],
  );
  if (!header) return null;
  const scaleZUm = header.scaleZMm * 1000;
  const preSummary: Pick<ExamSummary, 'trtRingUm' | 'examId'> | null = baseline ?? pre?.analysis ?? null;
  const todayTrt = today.analysis?.trtRingUm ?? null;
  const preTrt = preSummary?.trtRingUm ?? null;
  const change: Quantity | null = todayTrt && preTrt ? { value: todayTrt.value - preTrt.value, unit: 'µm', origin: 'derived', sources: todayTrt.sources } : null;
  const total = header.numBScans;
  return (
    <section className="oct-panel" aria-labelledby="oct-compare-title">
      <h4 id="oct-compare-title" className="co-micro">
        {t('compare.title')}
      </h4>
      {isReference ? (
        <p className="co-nota">{t('compare.isReference')}</p>
      ) : (
        <Action icon="layers" onClick={toggle} aria-expanded={open}>
          {open ? t('compare.hide') : t('compare.show')}
        </Action>
      )}
      {open && !isReference && (
        <div className="co-pila oct-panel__texto">
          {job.status === 'running' && (
            <p className="co-nota" role="status">
              {t('compare.loading', { n: pre?.taken ?? 0, total })}
            </p>
          )}
          {(job.status === 'error' || job.status === 'unavailable') && <Notice title={t('viewer.failed', { detail: job.error ?? '' })} />}
          {job.status === 'done' && todayFrame && preFrame && (
            <>
              <div className="oct-par">
                <figure className="co-corte">
                  <figcaption className="co-micro">
                    {t('compare.today')} · {t('scan.title', { n: index + 1, total })}
                  </figcaption>
                  <div className="co-corte__marco co-marco">
                    <BScanCanvas frame={todayFrame} layers={EDGE_LAYERS} label={`${t('compare.today')}. ${t('scan.alt', { n: index + 1, total })}`} mark={t('simulatedMark')} />
                  </div>
                </figure>
                <figure className="co-corte">
                  <figcaption className="co-micro">
                    {t('compare.preflight')} · {t('scan.title', { n: index + 1, total })}
                  </figcaption>
                  <div className="co-corte__marco co-marco">
                    <BScanCanvas frame={preFrame} layers={EDGE_LAYERS} label={`${t('compare.preflight')}. ${t('scan.alt', { n: index + 1, total })}`} mark={t('simulatedMark')} />
                  </div>
                </figure>
              </div>
              <figure className="co-corte">
                <figcaption className="co-micro">{t('compare.profile', { n: index + 1 })}</figcaption>
                <ThicknessProfile
                  today={thicknessProfileUm(todayFrame.analysis, scaleZUm)}
                  before={thicknessProfileUm(preFrame.analysis, scaleZUm)}
                  scaleXUm={header.scaleXMm * 1000}
                  zone={zone}
                  label={t('compare.profileAlt', { n: index + 1 })}
                />
                <ul className="co-leyenda">
                  <li>
                    <svg className="co-muestra" viewBox="0 0 28 10" aria-hidden="true" focusable="false">
                      <line x1="1" y1="5" x2="27" y2="5" className="oct-perfil__hoy" />
                    </svg>{' '}
                    {t('compare.today')}
                  </li>
                  <li>
                    <svg className="co-muestra" viewBox="0 0 28 10" aria-hidden="true" focusable="false">
                      <line x1="1" y1="5" x2="27" y2="5" className="oct-perfil__antes" />
                    </svg>{' '}
                    {t('compare.preflight')}
                  </li>
                  <li>
                    <StrokeSample kind="zone" /> {t('layer.zone')}
                  </li>
                </ul>
              </figure>
              {todayTrt && preTrt && change && (
                <div className="co-lecturas oct-panel__lecturas">
                  <Readout
                    value={one(todayTrt.value)}
                    unit={todayTrt.unit}
                    label={`${t('compare.mainRing')} · ${t('compare.today')}`}
                    origin={todayTrt.origin}
                  />
                  <Readout
                    value={one(preTrt.value)}
                    unit={preTrt.unit}
                    label={`${t('compare.mainRing')} · ${t('compare.preflight')}`}
                    origin={preTrt.origin}
                  />
                  <Readout value={one(change.value, true)} unit={change.unit} label={t('compare.change')} origin={change.origin} />
                </div>
              )}
              <p className="co-rotulo">{t('compare.registration')}</p>
              {baseline && pre?.analysis && pre.analysis.examId !== baseline.examId && (
                <Notice title={t('compare.mismatch', { regenerated: pre.analysis.examId, given: baseline.examId })} />
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

/** True values of the fictional eye next to the measured ones (spec 06, section 4). */
export function SimulationPanel({ request, analysis }: { request: CaptureRequest; analysis: ExamAnalysis }) {
  const t = useMessages(octMessages);
  const { formatNumber } = useI18n();
  const [truth, setTruth] = useState<EyeGroundTruth | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const handle = useRef<JobHandle | null>(null);
  useEffect(() => () => handle.current?.cancel(), []);
  const onToggle = (open: boolean) => {
    if (!open || truth || handle.current) return;
    handle.current = startJob(
      { type: 'ground-truth', crewId: request.crewId, eye: request.eye, flightDay: request.flightDay },
      (message) => {
        if (message.type === 'ground-truth') setTruth(message.truth);
        if (message.type === 'error') setFailed(message.message);
      },
      (failure) => setFailed(failure.detail),
    );
  };
  const fmt = (v: number, digits: number, signed = false) =>
    formatNumber(v, { minimumFractionDigits: digits, maximumFractionDigits: digits, signDisplay: signed ? 'exceptZero' : 'auto' });
  const rows: { label: string; measured: number | null; truth: number | null; unit: string; digits: number }[] = truth
    ? [
        ...truth.rings.map((ring, r) => ({
          label: t('sim.ring', { inner: ring.innerUm, outer: ring.outerUm }),
          measured: analysis.rings[r]?.thickness.value ?? null,
          truth: ring.thicknessUm,
          unit: 'µm',
          digits: 1,
        })),
        { label: t('sim.mrw'), measured: analysis.mrwUm?.value ?? null, truth: truth.mrwUm, unit: 'µm', digits: 1 },
        { label: t('sim.roughness'), measured: analysis.bmRoughnessUm?.value ?? null, truth: truth.bmRoughnessUm, unit: 'µm', digits: 2 },
        { label: t('sim.area'), measured: analysis.bmo?.areaMm2 ?? null, truth: truth.bmo.areaMm2, unit: 'mm²', digits: 3 },
      ]
    : [];
  return (
    <details className="oct-panel co-desplegable" onToggle={(event) => onToggle(event.currentTarget.open)}>
      <summary>
        {t('sim.title')} <Icon name="chevron-down" />
      </summary>
      <p className="co-nota">{t('sim.body')}</p>
      {failed && <Notice title={failed} />}
      {!truth && !failed && (
        <p className="co-nota" role="status">
          {t('sim.loading')}
        </p>
      )}
      {truth && (
        <div className="co-desliza">
          <table className="co-tabla">
            <thead>
              <tr>
                <th scope="col">{t('sim.measure')}</th>
                <th scope="col" className="es-cifra">
                  {t('sim.measured')}
                </th>
                <th scope="col" className="es-cifra">
                  {t('sim.true')}
                </th>
                <th scope="col" className="es-cifra">
                  {t('sim.difference')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td className="es-cifra">{row.measured === null ? t('sim.notMeasured') : `${fmt(row.measured, row.digits)} ${row.unit}`}</td>
                  <td className="es-cifra">{row.truth === null ? '—' : `${fmt(row.truth, row.digits)} ${row.unit}`}</td>
                  <td className="es-cifra">{row.measured === null || row.truth === null ? '—' : `${fmt(row.measured - row.truth, row.digits, true)} ${row.unit}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}

/** The exam as a `.vol` file of the real instrument, assembled in the worker block by block. */
export function DownloadPanel({ request, header }: { request: CaptureRequest; header: VolHeader }) {
  const t = useMessages(octMessages);
  const { formatNumber } = useI18n();
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'writing'; n: number; total: number } | { kind: 'ready'; name: string } | { kind: 'failed'; detail: string }>({
    kind: 'idle',
  });
  const handle = useRef<JobHandle | null>(null);
  useEffect(() => () => handle.current?.cancel(), []);
  const sizeMb = formatNumber(volFileBytes(header) / 1e6, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const name = `${header.patientId}_${header.scanPosition}_${header.visitId}_attempt${request.attempt}.vol`;
  const download = () => {
    const blocks: Uint8Array<ArrayBuffer>[] = [];
    setState({ kind: 'writing', n: 0, total: header.numBScans + 2 });
    handle.current = startJob(
      { type: 'download', request },
      (message) => {
        if (message.type === 'vol-block') {
          blocks.push(message.bytes as Uint8Array<ArrayBuffer>);
          setState({ kind: 'writing', n: message.index + 1, total: message.total });
        } else if (message.type === 'vol-done') {
          handle.current = null;
          const url = URL.createObjectURL(new Blob(blocks, { type: 'application/octet-stream' }));
          blocks.length = 0;
          const a = document.createElement('a');
          a.href = url;
          a.download = name;
          document.body.append(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
          setState({ kind: 'ready', name });
        } else if (message.type === 'error') {
          handle.current = null;
          setState({ kind: 'failed', detail: message.message });
        }
      },
      (failure) => {
        handle.current = null;
        setState({ kind: 'failed', detail: failure.detail });
      },
    );
  };
  return (
    <section className="oct-panel" aria-labelledby="oct-download-title">
      <h4 id="oct-download-title" className="co-micro">
        {t('download.title')}
      </h4>
      <p className="co-nota">{t('download.body', { size: sizeMb, patientId: header.patientId })}</p>
      <Button icon="download" onClick={download} disabled={state.kind === 'writing'}>
        {t('download.button', { size: sizeMb })}
      </Button>
      <p role="status" className="co-rotulo">
        {state.kind === 'writing' && t('download.progress', { n: state.n, total: state.total })}
        {state.kind === 'ready' && t('download.ready', { name: state.name })}
        {state.kind === 'failed' && t('download.failed', { detail: state.detail })}
      </p>
    </section>
  );
}
