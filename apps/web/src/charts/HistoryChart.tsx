import { useState } from 'react';
import type { Eye, Level, Mission } from '@app/core';
import type { ChangePoint } from '../app/history';
import { useI18n, useMessages } from '../i18n';
import { chartMessages } from '../i18n/charts';
import { commonMessages } from '../i18n/common';
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
}

const EYES: readonly Eye[] = ['OD', 'OS'];
const BAND_IDS: readonly BandId[] = ['normal-variation', 'first-sign', 'clinically-concerning'];

function Label({ label, className }: { label: PlacedText; className?: string }) {
  return (
    <text className={className} textAnchor={label.anchor} x={label.x} y={label.baseline}>
      {label.text}
    </text>
  );
}

/** The mark of one eye: a circle for the right eye, a square for the left. Filled when the control was done here. */
function SeriesMark({ eye, x, y, size, live }: { eye: Eye; x: number; y: number; size: number; live: boolean }) {
  const className = `history-chart__mark history-chart__mark--${eye}${live ? ' history-chart__mark--live' : ''}`;
  return eye === 'OD' ? (
    <circle className={className} cx={x} cy={y} r={size} />
  ) : (
    <rect className={className} x={x - size * 0.9} y={y - size * 0.9} width={size * 1.8} height={size * 1.8} />
  );
}

/**
 * Evolution: the change of each eye at every control, against flight day, over
 * the same bands as the number line. An equivalent table follows the drawing.
 */
export function HistoryChart({ points, eyes = EYES, mission, thresholds, currentDay = null }: Props) {
  const { locale } = useI18n();
  const t = useMessages(chartMessages);
  const tc = useMessages(commonMessages);
  const { ref, width, fontPx, measure } = useChartBox<HTMLDivElement>();
  const [activeDay, setActiveDay] = useState<number | null>(null);

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

  return (
    <figure className="chart history-chart">
      <figcaption className="chart__caption">{t('history.caption')}</figcaption>
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
            {layout.bands.map((band) => (
              <rect
                key={band.id}
                className={`chart-band chart-band--${band.id}`}
                x={plot.left}
                y={band.y}
                width={plot.right - plot.left}
                height={band.height}
              />
            ))}
            {layout.routineLines.map((lineX) => (
              <line key={lineX} className="history-chart__routine" x1={lineX} x2={lineX} y1={plot.top} y2={plot.bottom} />
            ))}
            <line className="chart-zero" x1={plot.left} x2={plot.right} y1={layout.zero.y} y2={layout.zero.y} />
            {layout.thresholdLines.map((line) => (
              <line key={line.kind} className="chart-threshold" x1={plot.left} x2={plot.right} y1={line.y} y2={line.y} />
            ))}
            {layout.current && (
              <path
                className="history-chart__current"
                d={
                  `M${layout.current.x - fontPx * 0.4} ${plot.top - fontPx * 0.35}` +
                  `h${fontPx * 0.8}L${layout.current.x} ${plot.top + fontPx * 0.25}Z`
                }
              />
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
            {layout.current && <Label label={layout.current.label} className="history-chart__current-label" />}

            <g className="history-chart__axis">
              <line x1={plot.left} x2={plot.left} y1={plot.top} y2={plot.bottom} />
              <line x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} />
              {layout.yTicks.map((tick) => (
                <g key={tick.value}>
                  <line x1={plot.left - layout.tickLength} x2={plot.left} y1={tick.y} y2={tick.y} />
                  <Label label={tick.label} className={tick.value === 0 ? 'history-chart__tick--strong' : undefined} />
                </g>
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
                      size={point.flightDay === active ? mark.radius * 1.35 : mark.radius}
                      live={point.live}
                    />
                  </g>
                ))}
                {series.unmeasured.map((point) => (
                  <path
                    key={point.flightDay}
                    className="history-chart__unmeasured"
                    d={
                      `M${point.x - mark.radius} ${point.y - mark.radius}l${2 * mark.radius} ${2 * mark.radius}` +
                      `M${point.x + mark.radius} ${point.y - mark.radius}l${-2 * mark.radius} ${2 * mark.radius}`
                    }
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
          <p className="history-chart__hint">{days.length > 0 ? t('history.readout.hint') : t('history.empty')}</p>
        ) : (
          <>
            <p className="history-chart__readout-title">
              <strong>{controlTitle(active)}</strong> · {originText(active)}
            </p>
            <ul>
              {controlLines(active).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <ul className="chart__legend">
        {shown.map((eye) => (
          <li key={eye}>
            <svg
              className={`history-chart__series history-chart__series--${eye}`}
              width="38"
              height="16"
              viewBox="0 0 38 16"
              aria-hidden="true"
              focusable="false"
            >
              <line className="history-chart__line" x1="1" x2="37" y1="8" y2="8" />
              <SeriesMark eye={eye} x={19} y={8} size={5} live={false} />
            </svg>
            {tc(`eye.${eye}`)}
          </li>
        ))}
        <li>
          <svg className="history-chart__series history-chart__series--OD" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path className="history-chart__range" d="M4 2h8M8 2V14M4 14h8" />
          </svg>
          {t('history.legend.range')}
        </li>
        <li>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <line className="history-chart__routine" x1="8" x2="8" y1="0" y2="16" />
          </svg>
          {t('history.legend.routine')}
        </li>
        <li>
          <svg className="history-chart__series history-chart__series--OD" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path className="history-chart__unmeasured" d="M3 3l10 10M13 3L3 13" />
          </svg>
          {t('history.legend.unmeasured')}
        </li>
        <li>{t('history.legend.live')}</li>
        <li>{t('history.legend.precomputed')}</li>
      </ul>

      <details className="chart__table">
        <summary>{t('history.table.summary')}</summary>
        <div className="table-scroll">
          <table>
            <caption>{t('history.table.caption')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('history.table.day')}</th>
                {shown.map((eye) => (
                  <th key={eye} scope="col">
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
                      <td key={eye}>
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
