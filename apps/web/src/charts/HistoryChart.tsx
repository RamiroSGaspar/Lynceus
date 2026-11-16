import { useId, useState } from 'react';
import type { Eye, Level, Mission } from '@app/core';
import type { ChangePoint } from '../app/history';
import { useI18n, useMessages } from '../i18n';
import { chartMessages } from '../i18n/charts';
import { commonMessages } from '../i18n/common';
import { Icon, LevelShape, type LevelKind } from '../ui';
import { formatExact, formatPlain } from '../app/format';
import { formatChange } from './format';
import { layoutHistoryChart, type PlacedText } from './historyChartLayout';
import { changeDomain, type BandId, type ChangeThresholds } from './scale';
import { useChartBox } from './useChartBox';

interface Props {
  /** The controls of each eye, oldest first, as `changePoints` gives them. */
  points: Readonly<Record<Eye, readonly ChangePoint[]>>;
  /** Eyes to draw. The scale stays the one of both eyes, so hiding one does not move the other. */
  eyes?: readonly Eye[];
  mission: Mission;
  /** NASA's thresholds, from the core. */
  thresholds: ChangeThresholds;
  /** Flight day of today's control, marked on the day axis. */
  currentDay?: number | null;
  /** Flight day of the next tomography, when it is still to come: marked on the day axis as a control to do. */
  nextScanDay?: number | null;
}

const EYES: readonly Eye[] = ['OD', 'OS'];
const BAND_IDS: readonly BandId[] = ['normal-variation', 'first-sign', 'clinically-concerning'];
/** The alert class each band belongs to: its colour and its shape. */
const BAND_KIND: Readonly<Record<BandId, LevelKind>> = {
  'normal-variation': 'none',
  'first-sign': 'advisory',
  'clinically-concerning': 'caution',
};
const THRESHOLD_KIND = { 'first-sign': 'advisory', 'clinically-concerning': 'caution' } as const;

function Label({ label, className }: { label: PlacedText; className?: string }) {
  return (
    <text className={className} textAnchor={label.anchor} x={label.x} y={label.baseline}>
      {label.text}
    </text>
  );
}

/** The eyes are told apart by shape, not by colour: the right eye is a filled disc on a solid line, the left a hollow diamond on a dashed one. */
function SeriesMark({ eye, x, y, size }: { eye: Eye; x: number; y: number; size: number }) {
  const className = `history-chart__mark history-chart__mark--${eye}`;
  return eye === 'OD' ? (
    <circle className={className} cx={x} cy={y} r={size} />
  ) : (
    <rect className={className} x={x - size * 0.82} y={y - size * 0.82} width={size * 1.64} height={size * 1.64} transform={`rotate(45 ${x} ${y})`} />
  );
}

/**
 * Evolution: the change of each eye at every control, against flight day, over
 * the same bands as the number line. An equivalent table follows the drawing.
 */
export function HistoryChart({ points, eyes = EYES, mission, thresholds, currentDay = null, nextScanDay = null }: Props) {
  const { locale } = useI18n();
  const t = useMessages(chartMessages);
  const tc = useMessages(commonMessages);
  const { ref, width, fontPx, measure } = useChartBox<HTMLDivElement>();
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const hazeId = useId();

  const shown = EYES.filter((eye) => eyes.includes(eye));
  const signed = (valueUm: number, like: number = valueUm): string => formatChange(valueUm, thresholds, locale, like);
  const first = formatExact(thresholds.firstSignUm, locale);
  const second = formatExact(thresholds.clinicallyConcerningUm, locale);
  const levelName = (level: Level | null): string => (level === null ? tc('level.not-measured') : tc(`level.${level}`));

  const domain = changeDomain(
    EYES.flatMap((eye) =>
      points[eye].flatMap((point) => [point.change?.value, point.change?.interval95?.[0], point.change?.interval95?.[1]]),
    ),
  );

  const layout = layoutHistoryChart({
    width,
    fontPx,
    measure,
    durationDays: mission.durationDays,
    routineDays: mission.routineControlDays,
    domain,
    thresholds,
    bandNames: Object.fromEntries(BAND_IDS.map((id) => [id, t(`band.${id}`)])) as Record<BandId, string>,
    thresholdLabels: {
      firstSign: t('threshold.label', { value: first }),
      clinicallyConcerning: t('threshold.label', { value: second }),
    },
    zeroLabel: t('history.zero'),
    tickLabel: (value) => formatPlain(value, 0, locale),
    yTitle: t('history.axis.y'),
    xTitle: t('history.axis.x'),
    series: shown.map((eye) => ({
      eye,
      points: points[eye].map((point) => ({
        flightDay: point.flightDay,
        valueUm: point.change?.value ?? null,
        lowUm: point.change?.interval95?.[0] ?? null,
        highUm: point.change?.interval95?.[1] ?? null,
        live: point.origin === 'live',
      })),
    })),
    currentDay,
    currentLabel: t('history.today'),
  });

  // What one control says about one eye, in words: used by the readout, the focus label and the table.
  const pointText = (eye: Eye, point: ChangePoint | undefined): string | null => {
    if (!point) return null;
    const eyeName = tc(`eye.${eye}`);
    if (!point.change) return t('history.point.unmeasured', { eye: eyeName });
    const value = signed(point.change.value);
    const range = point.change.interval95;
    return range
      ? t('history.point.measured', {
          eye: eyeName,
          value,
          low: signed(range[0], point.change.value),
          high: signed(range[1], point.change.value),
          level: levelName(point.level),
        })
      : t('history.point.measured.noRange', { eye: eyeName, value, level: levelName(point.level) });
  };
  const pointAt = (eye: Eye, flightDay: number): ChangePoint | undefined =>
    points[eye].find((point) => point.flightDay === flightDay);
  const originText = (flightDay: number): string => {
    const point = pointAt('OD', flightDay) ?? pointAt('OS', flightDay);
    return point?.origin === 'live' ? t('history.origin.live') : t('history.origin.precomputed');
  };
  const controlTitle = (flightDay: number): string => t('history.point.title', { day: flightDay });
  const controlLines = (flightDay: number): string[] =>
    shown.flatMap((eye) => {
      const text = pointText(eye, pointAt(eye, flightDay));
      return text ? [text] : [];
    });

  const days = [...new Set(EYES.flatMap((eye) => points[eye].map((point) => point.flightDay)))].sort((a, b) => a - b);

  // The same content as the drawing, in words.
  const eyeList = new Intl.ListFormat(locale, { type: 'conjunction' });
  const summary = shown
    .map((eye) => {
      const last = [...points[eye]].reverse().find((point) => point.change);
      return last?.change
        ? t('history.alt.last', { eye: tc(`eye.${eye}`), value: signed(last.change.value), day: last.flightDay })
        : t('history.alt.none', { eye: tc(`eye.${eye}`) });
    })
    .join(' ');
  const alt = t('history.alt', {
    days: mission.durationDays,
    eyes: eyeList.format(shown.map((eye) => tc(`eye.${eye}`))),
    summary,
    first,
    second,
  });

  const { plot, mark } = layout;
  const active = activeDay !== null && days.includes(activeDay) ? activeDay : null;
  // The next tomography, when no control has been done on that day yet: a control to do, on the day axis.
  const nextX =
    nextScanDay !== null && nextScanDay <= mission.durationDays && !days.includes(nextScanDay)
      ? plot.left + (nextScanDay / mission.durationDays) * (plot.right - plot.left)
      : null;
  const nextLabel = t('history.next');
  const nextLabelWidth = measure(nextLabel, fontPx);

  return (
    <figure className="chart history-chart">
      <figcaption className="co-nota chart__caption">{t('history.caption')}</figcaption>
      <div ref={ref} className="chart__canvas">
        <svg
          role="group"
          aria-label={alt}
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setActiveDay(null);
          }}
        >
          <g aria-hidden="true">
            {/* No grid and no filled bands: each zone starts at its line, with a haze that rises from it and fades. */}
            <defs>
              {(['advisory', 'caution'] as const).map((kind) => (
                <linearGradient key={kind} id={`${hazeId}-${kind}`} className={`history-chart__haze history-chart__haze--${kind}`} x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopOpacity="0.16" />
                  <stop offset="1" stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            {layout.bands
              .filter((band) => band.id !== 'normal-variation' && band.height > 0)
              .map((band) => (
                <rect
                  key={band.id}
                  fill={`url(#${hazeId}-${BAND_KIND[band.id]})`}
                  x={plot.left}
                  y={band.y}
                  width={plot.right - plot.left}
                  height={band.height}
                />
              ))}
            <line className="history-chart__zero" x1={plot.left} x2={plot.right} y1={layout.zero.y} y2={layout.zero.y} />
            {layout.thresholdLines.map((line) => (
              <line
                key={line.kind}
                className={`history-chart__threshold history-chart__threshold--${THRESHOLD_KIND[line.kind]}`}
                x1={plot.left}
                x2={plot.right}
                y1={line.y}
                y2={line.y}
              />
            ))}
            {layout.current && (
              <>
                <line className="history-chart__today" x1={layout.current.x} x2={layout.current.x} y1={plot.top} y2={plot.bottom} />
                <path
                  className="history-chart__today-mark"
                  d={
                    `M${layout.current.x - fontPx * 0.36} ${plot.top - fontPx * 0.5}` +
                    `h${fontPx * 0.72}L${layout.current.x} ${plot.top - fontPx * 0.05}Z`
                  }
                />
              </>
            )}
            {active !== null &&
              layout.columns
                .filter((column) => column.flightDay === active)
                .map((column) => (
                  <rect
                    key={column.flightDay}
                    className="history-chart__active"
                    x={column.left}
                    y={plot.top}
                    width={column.width}
                    height={plot.bottom - plot.top}
                  />
                ))}

            {layout.bands.map((band) => band.label && <Label key={band.id} label={band.label} className="history-chart__band-name chart__over" />)}
            {layout.thresholdLines.map((line) => (
              <Label key={line.kind} label={line.label} className="history-chart__threshold-label chart__over" />
            ))}
            <Label label={layout.zero.label} className="history-chart__note chart__over" />
            {layout.current && <Label label={layout.current.label} className="history-chart__today-label" />}

            <g className="history-chart__axis">
              <line x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} />
              {layout.yTicks.map((tick) => (
                <Label key={tick.value} label={tick.label} className={tick.value === 0 ? 'history-chart__tick--strong' : undefined} />
              ))}
              {layout.xTicks.map((tick) => (
                <g key={tick.day}>
                  <line x1={tick.x} x2={tick.x} y1={plot.bottom} y2={plot.bottom + layout.tickLength} />
                  {tick.label && (
                    <Label label={tick.label} className={tick.routine ? 'history-chart__tick--strong' : undefined} />
                  )}
                </g>
              ))}
              <Label label={layout.yTitle} className="history-chart__title" />
              <Label label={layout.xTitle} className="history-chart__title" />
            </g>

            {nextX !== null && (
              <g className="history-chart__next">
                <LevelShape kind="unmeasured" x={nextX - fontPx * 0.57} y={plot.bottom - fontPx * 0.57} size={fontPx * 1.14} />
                <text
                  className="chart__over"
                  textAnchor="middle"
                  x={Math.min(Math.max(nextX, plot.left + nextLabelWidth / 2), plot.right - nextLabelWidth / 2)}
                  y={plot.bottom - fontPx * 0.95}
                >
                  {nextLabel}
                </text>
              </g>
            )}

            {layout.series.map((series) => (
              <g key={series.eye} className={`history-chart__series history-chart__series--${series.eye}`}>
                <polyline className="history-chart__line" points={series.line.map((point) => `${point.x},${point.y}`).join(' ')} />
                {series.points.map((point) => (
                  <g key={point.flightDay}>
                    {point.yLow !== null && point.yHigh !== null && (
                      <path
                        className="history-chart__range"
                        d={
                          `M${point.x - mark.cap} ${point.yHigh}h${2 * mark.cap}` +
                          `M${point.x} ${point.yHigh}V${point.yLow}` +
                          `M${point.x - mark.cap} ${point.yLow}h${2 * mark.cap}`
                        }
                      />
                    )}
                    <SeriesMark
                      eye={series.eye}
                      x={point.x}
                      y={point.y}
                      size={point.flightDay === currentDay || point.flightDay === active ? mark.radius * 1.4 : mark.radius}
                    />
                  </g>
                ))}
                {series.unmeasured.map((point) => (
                  <LevelShape
                    key={point.flightDay}
                    kind="unmeasured"
                    className="history-chart__unmeasured"
                    x={point.x - mark.radius * 1.4}
                    y={point.y - mark.radius * 1.4}
                    size={mark.radius * 2.8}
                  />
                ))}
              </g>
            ))}
            <circle className="history-chart__origin" cx={layout.origin.x} cy={layout.origin.y} r={mark.radius * 0.8} />
          </g>

          {layout.columns.map((column) => (
            <g
              key={column.flightDay}
              className="history-chart__column"
              tabIndex={0}
              role="img"
              aria-label={[`${controlTitle(column.flightDay)}, ${originText(column.flightDay)}.`, ...controlLines(column.flightDay)].join(' ')}
              onFocus={() => setActiveDay(column.flightDay)}
              onBlur={() => setActiveDay((current) => (current === column.flightDay ? null : current))}
              onPointerEnter={() => setActiveDay(column.flightDay)}
              onPointerLeave={(event) => {
                if (event.pointerType === 'mouse') setActiveDay((current) => (current === column.flightDay ? null : current));
              }}
              onClick={() => setActiveDay(column.flightDay)}
            >
              <rect x={column.left} y={plot.top} width={column.width} height={plot.bottom - plot.top} />
            </g>
          ))}
        </svg>
      </div>

      <div className="history-chart__readout" aria-hidden="true">
        {active === null ? (
          <p className="co-rotulo">{days.length > 0 ? t('history.readout.hint') : t('history.empty')}</p>
        ) : (
          <>
            <p className="co-micro history-chart__readout-title">
              {controlTitle(active)} · {originText(active)}
            </p>
            <ul>
              {controlLines(active).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <ul className="co-leyenda chart__legend">
        {shown.map((eye) => (
          <li key={eye}>
            <svg className={`co-muestra history-chart__series history-chart__series--${eye}`} viewBox="0 0 28 10" aria-hidden="true" focusable="false">
              <line className="history-chart__line" x1="1" x2="27" y1="5" y2="5" />
              <SeriesMark eye={eye} x={14} y={5} size={3.6} />
            </svg>
            {tc(`eye.${eye}`)}
          </li>
        ))}
        <li>
          <svg className="co-muestra history-chart__series history-chart__series--OD" viewBox="0 0 28 10" aria-hidden="true" focusable="false">
            <path className="history-chart__range" d="M10 0.5h8M14 0.5V9.5M10 9.5h8" />
          </svg>
          {t('history.legend.range')}
        </li>
        <li>
          <LevelShape kind="unmeasured" className="history-chart__legend-shape" />
          {t('history.legend.unmeasured')}
        </li>
        {BAND_IDS.map((id) => (
          <li key={id} className={`history-chart__band history-chart__band--${BAND_KIND[id]}`}>
            <LevelShape kind={BAND_KIND[id]} className="history-chart__legend-shape" />
            <span>
              <strong>{t(`band.${id}`)}</strong> · {t(`band.range.${id}`, { first, second })}
            </span>
          </li>
        ))}
      </ul>

      <details className="chart__table co-desplegable">
        <summary>
          {t('history.table.summary')} <Icon name="chevron-down" />
        </summary>
        <div className="co-desliza">
          <table className="co-tabla">
            <caption>{t('history.table.caption')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('history.table.day')}</th>
                {shown.map((eye) => (
                  <th key={eye} scope="col" className="es-cifra">
                    {t('history.table.change', { eye: tc(`eye.${eye}`) })}
                  </th>
                ))}
                {shown.map((eye) => (
                  <th key={eye} scope="col">
                    {t('history.table.level', { eye: tc(`eye.${eye}`) })}
                  </th>
                ))}
                <th scope="col">{t('history.table.origin')}</th>
              </tr>
            </thead>
            <tbody>
              {days.length === 0 && (
                <tr>
                  <td colSpan={2 + shown.length * 2}>{t('history.empty')}</td>
                </tr>
              )}
              {days.map((flightDay) => (
                <tr key={flightDay}>
                  <th scope="row">{flightDay}</th>
                  {shown.map((eye) => {
                    const change = pointAt(eye, flightDay)?.change;
                    const range = change?.interval95;
                    return (
                      <td key={eye} className="es-cifra">
                        {change
                          ? `${t('value', { value: signed(change.value) })}${
                              range
                                ? ` (${tc('range.to', { low: signed(range[0], change.value), high: signed(range[1], change.value) })})`
                                : ''
                            }`
                          : t('history.table.unmeasured')}
                      </td>
                    );
                  })}
                  {shown.map((eye) => (
                    <td key={eye}>{levelName(pointAt(eye, flightDay)?.level ?? null)}</td>
                  ))}
                  <td>{originText(flightDay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
