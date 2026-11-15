import type { Eye, Quantity } from '@app/core';
import { useI18n, useMessages } from '../i18n';
import { chartMessages } from '../i18n/charts';
import { commonMessages } from '../i18n/common';
import { layoutChangeScale } from './changeScaleLayout';
import { formatExact, formatPlain } from '../app/format';
import { formatChange } from './format';
import { bandOf, changeDomain, type BandId, type ChangeThresholds, type Domain } from './scale';
import { useChartBox } from './useChartBox';

/** The change of one eye at one control: a `derived` quantity in micrometres, with its range when there is one. */
export interface ScaleMark {
  flightDay: number;
  change: Quantity;
}

interface Props {
  eye: Eye;
  /** Today's change, or null when the eye has no value today. */
  today: ScaleMark | null;
  /** Earlier controls of the same eye. */
  previous: readonly ScaleMark[];
  /** NASA's thresholds, from the core. */
  thresholds: ChangeThresholds;
  /** Axis range. Give both eyes the same one so their lines compare; when absent it fits this eye. */
  domain?: Domain;
}

/** The axis range that fits everything this chart draws for one eye. */
export function changeScaleDomain(today: ScaleMark | null, previous: readonly ScaleMark[]): Domain {
  return changeDomain([
    today?.change.value,
    today?.change.interval95?.[0],
    today?.change.interval95?.[1],
    ...previous.map((mark) => mark.change.value),
  ]);
}

const BAND_IDS: readonly BandId[] = ['normal-variation', 'first-sign', 'clinically-concerning'];

/**
 * The change number line: where today's value falls between "before the flight"
 * and NASA's two thresholds. A line and not a table, because on a table people
 * rate a slightly raised value and a very raised one as equally urgent (research
 * doc `comunicar-resultados-de-salud.md`, table row 3).
 */
export function ChangeScale({ eye, today, previous, thresholds, domain }: Props) {
  const { locale } = useI18n();
  const t = useMessages(chartMessages);
  const tc = useMessages(commonMessages);
  const { ref, width, fontPx, valueFontPx, measure } = useChartBox<HTMLDivElement>();

  const signed = (valueUm: number, like: number = valueUm): string => formatChange(valueUm, thresholds, locale, like);
  const first = formatExact(thresholds.firstSignUm, locale);
  const second = formatExact(thresholds.clinicallyConcerningUm, locale);
  const bandNames = Object.fromEntries(BAND_IDS.map((id) => [id, t(`band.${id}`)])) as Record<BandId, string>;

  const range = today?.change.interval95 ?? null;
  const todayValue = today ? signed(today.change.value) : null;
  const todayLow = today && range ? signed(range[0], today.change.value) : null;
  const todayHigh = today && range ? signed(range[1], today.change.value) : null;

  const layout = layoutChangeScale({
    width,
    fontPx,
    valueFontPx,
    measure,
    domain: domain ?? changeScaleDomain(today, previous),
    thresholds,
    bandNames,
    zero: { value: formatPlain(0, 0, locale), note: t('scale.zero.note') },
    firstSign: { value: t('threshold.value', { value: first }), note: t('nasa') },
    clinicallyConcerning: { value: t('threshold.value', { value: second }), note: t('nasa') },
    tickLabel: (valueUm) => formatPlain(valueUm, 0, locale),
    today:
      today && todayValue !== null
        ? {
            valueUm: today.change.value,
            lowUm: range?.[0] ?? null,
            highUm: range?.[1] ?? null,
            valueLabel: t('value', { value: todayValue }),
            rangeLabel: todayLow !== null && todayHigh !== null ? t('range', { low: todayLow, high: todayHigh }) : null,
          }
        : null,
    previous: previous.map((mark) => ({
      valueUm: mark.change.value,
      label: tc('flightDay.short', { day: mark.flightDay }),
    })),
  });

  // The same content as the drawing, in words.
  const eyeName = tc(`eye.${eye}`);
  const sentences: string[] = [];
  if (today && todayValue !== null) {
    const band = bandOf(today.change.value, thresholds);
    const params = {
      eye: eyeName,
      value: todayValue,
      band: bandNames[band],
      bandRange: t(`band.range.${band}`, { first, second }),
    };
    sentences.push(
      todayLow !== null && todayHigh !== null
        ? t('scale.alt.today', { ...params, low: todayLow, high: todayHigh })
        : t('scale.alt.today.noRange', params),
    );
  } else {
    sentences.push(t('scale.alt.none', { eye: eyeName }));
  }
  sentences.push(t('scale.alt.thresholds', { first, second }));
  if (previous.length > 0) {
    const list = previous
      .map((mark) => t('scale.alt.previous.item', { day: mark.flightDay, value: signed(mark.change.value) }))
      .join('; ');
    sentences.push(t('scale.alt.previous', { list }));
  }

  const { plot, lineHeight } = layout;
  const axisTop = plot.bottom + layout.tickLength;

  return (
    <figure className="chart change-scale">
      <figcaption className="chart__caption">{t('scale.caption', { eye: eyeName })}</figcaption>
      <div ref={ref} className="chart__canvas">
        <svg
          role="img"
          aria-label={sentences.join(' ')}
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
        >
          {layout.bands.map((band) => (
            <rect
              key={band.id}
              className={`chart-band chart-band--${band.id}`}
              x={band.x}
              y={plot.top}
              width={band.width}
              height={plot.bottom - plot.top}
            />
          ))}
          <line
            className="chart-zero"
            x1={layout.zeroX}
            x2={layout.zeroX}
            y1={layout.contentTop}
            y2={axisTop}
          />
          {layout.thresholdLines.map((line) => (
            <line
              key={line.kind}
              className="chart-threshold"
              x1={line.x}
              x2={line.x}
              y1={plot.top}
              y2={axisTop}
            />
          ))}

          {layout.bandLabels.map((label) => (
            <g key={label.id}>
              {label.extent && (
                <path
                  className={`change-scale__extent change-scale__extent--${label.id}`}
                  d={`M${label.extent.x1} ${label.extent.y - 4}V${label.extent.y}H${label.extent.x2}V${label.extent.y - 4}`}
                />
              )}
              <text
                className={`change-scale__band-name${label.extent ? '' : ' chart__over'}`}
                textAnchor={label.anchor}
                x={label.x}
                y={label.baseline}
              >
                {label.lines.map((line, index) => (
                  <tspan key={line} x={label.x} dy={index === 0 ? 0 : lineHeight}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          ))}

          {layout.previous.map((mark) => (
            <g key={`${mark.label}-${mark.x}`} className="change-scale__previous">
              <line x1={mark.x} y1={mark.y + mark.r} x2={mark.labelX} y2={mark.labelBaseline - fontPx * 0.9} />
              <circle cx={mark.x} cy={mark.y} r={mark.r} />
              <text className="chart__over" textAnchor="middle" x={mark.labelX} y={mark.labelBaseline}>
                {mark.label}
              </text>
            </g>
          ))}

          {layout.today && (
            <g className="change-scale__today">
              {layout.today.range && (
                <path
                  className="change-scale__range"
                  d={
                    `M${layout.today.range.x1} ${layout.today.y - layout.today.range.cap}v${2 * layout.today.range.cap}` +
                    `M${layout.today.range.x1} ${layout.today.y}H${layout.today.range.x2}` +
                    `M${layout.today.range.x2} ${layout.today.y - layout.today.range.cap}v${2 * layout.today.range.cap}`
                  }
                />
              )}
              <line
                className="change-scale__pointer"
                x1={layout.today.pointer.x}
                x2={layout.today.pointer.x}
                y1={layout.today.pointer.y1}
                y2={layout.today.pointer.y2}
              />
              <path
                className="change-scale__marker"
                d={
                  `M${layout.today.x} ${layout.today.y - layout.today.half}` +
                  `L${layout.today.x + layout.today.half} ${layout.today.y}` +
                  `L${layout.today.x} ${layout.today.y + layout.today.half}` +
                  `L${layout.today.x - layout.today.half} ${layout.today.y}Z`
                }
              />
              <rect
                className="change-scale__chip"
                x={layout.today.chip.x - layout.today.chip.width / 2}
                y={layout.today.chip.y}
                width={layout.today.chip.width}
                height={layout.today.chip.height}
                rx={4}
              />
              <text
                className="change-scale__value"
                textAnchor="middle"
                x={layout.today.chip.x}
                y={layout.today.chip.valueBaseline}
              >
                {todayValue !== null && t('value', { value: todayValue })}
              </text>
              {layout.today.chip.rangeBaseline !== null && todayLow !== null && todayHigh !== null && (
                <text
                  className="change-scale__value-range"
                  textAnchor="middle"
                  x={layout.today.chip.x}
                  y={layout.today.chip.rangeBaseline}
                >
                  {t('range', { low: todayLow, high: todayHigh })}
                </text>
              )}
            </g>
          )}

          <g className="change-scale__axis">
            <line x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} />
            {layout.tickMarks.map((tickX) => (
              <line key={tickX} x1={tickX} x2={tickX} y1={plot.bottom} y2={axisTop} />
            ))}
            {layout.axisLabels.map((label) => (
              <g key={`${label.kind}-${label.valueUm}`}>
                {Math.abs(label.x - label.anchorX) > 1 && label.kind !== 'tick' && (
                  <line x1={label.anchorX} y1={axisTop} x2={label.x} y2={label.baseline - fontPx * 0.9} />
                )}
                <text
                  className={label.kind === 'tick' ? 'change-scale__tick' : 'change-scale__mark'}
                  textAnchor="middle"
                  x={label.x}
                  y={label.baseline}
                >
                  {label.lines.map((line, index) => (
                    <tspan
                      key={`${index}-${line}`}
                      className={index === 0 ? undefined : 'change-scale__note'}
                      x={label.x}
                      dy={index === 0 ? 0 : lineHeight}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
      <p className="chart__axis-title">{t('scale.axis')}</p>
      <ul className="chart__legend">
        <li>
          <svg width="34" height="16" viewBox="0 0 34 16" aria-hidden="true" focusable="false">
            <path className="change-scale__range" d="M2 3v10M2 8H32M32 3v10" />
            <path className="change-scale__marker" d="M17 1L24 8L17 15L10 8Z" />
          </svg>
          {t('scale.legend.today')}
        </li>
        {previous.length > 0 && (
          <li>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <circle className="change-scale__previous-symbol" cx="8" cy="8" r="5" />
            </svg>
            {t('scale.legend.previous')}
          </li>
        )}
      </ul>
    </figure>
  );
}
