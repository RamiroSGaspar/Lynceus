import type { Eye, Quantity } from '@app/core';
import { useI18n, useMessages } from '../i18n';
import { chartMessages } from '../i18n/charts';
import { commonMessages } from '../i18n/common';
import { LevelShape, type LevelKind } from '../ui';
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
/** The alert class each band of the scale belongs to: its colour and its shape. */
const BAND_KIND: Readonly<Record<BandId, LevelKind>> = {
  'normal-variation': 'none',
  'first-sign': 'advisory',
  'clinically-concerning': 'caution',
};

/**
 * The change number line: where today's value falls between "before the flight"
 * and NASA's two thresholds. A line and not a table, because on a table people
 * rate a slightly raised value and a very raised one as equally urgent (research
 * doc `comunicar-resultados-de-salud.md`, table row 3).
 *
 * The axis is the line, and it changes colour at every threshold. The thresholds are
 * dashed lines with their value above. Today is the large white disc, with its range as a
 * bar; earlier controls are small hollow discs, so what is past is told from what is current.
 */
export function ChangeScale({ eye, today, previous, thresholds, domain }: Props) {
  const { locale } = useI18n();
  const t = useMessages(chartMessages);
  const tc = useMessages(commonMessages);
  const { ref, width, fontPx, measure } = useChartBox<HTMLDivElement>();

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
    measure,
    domain: domain ?? changeScaleDomain(today, previous),
    thresholds,
    bandNames,
    zeroLabel: formatPlain(0, 0, locale),
    firstSignLabel: t('threshold.value', { value: first }),
    clinicallyConcerningLabel: t('threshold.value', { value: second }),
    tickLabel: (valueUm) => formatPlain(valueUm, 0, locale),
    today: today ? { valueUm: today.change.value, lowUm: range?.[0] ?? null, highUm: range?.[1] ?? null } : null,
    previous: previous.map((mark) => ({
      valueUm: mark.change.value,
      label: `${tc('flightDay', { day: mark.flightDay })}: ${t('value', { value: signed(mark.change.value) })}`,
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

  const { lineY } = layout;

  return (
    <figure className="chart change-scale">
      <figcaption className="co-oculto">{t('scale.caption', { eye: eyeName })}</figcaption>
      <div ref={ref} className="chart__canvas">
        <svg
          role="img"
          aria-label={sentences.join(' ')}
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
        >
          {layout.bands.map((band) => (
            <line
              key={band.id}
              className={`change-scale__stretch change-scale__stretch--${BAND_KIND[band.id]}`}
              x1={band.x}
              x2={band.x + band.width}
              y1={lineY}
              y2={lineY}
            />
          ))}
          {layout.thresholdLines.map((line) => (
            <line key={line.kind} className="change-scale__threshold" x1={line.x} x2={line.x} y1={line.y1} y2={line.y2} />
          ))}
          {layout.zero && <line className="change-scale__zero" x1={layout.zero.x} x2={layout.zero.x} y1={layout.zero.y1} y2={layout.zero.y2} />}
          {layout.tickMarks.map((mark) => (
            <line key={mark.x} className="change-scale__tick-mark" x1={mark.x} x2={mark.x} y1={mark.y1} y2={mark.y2} />
          ))}

          {layout.axisLabels.map((label) => (
            <text
              key={`${label.kind}-${label.valueUm}`}
              className={label.kind === 'tick' || label.kind === 'zero' ? 'change-scale__tick' : 'change-scale__mark'}
              textAnchor="middle"
              x={label.x}
              y={label.baseline}
            >
              {label.text}
            </text>
          ))}

          {layout.bandLabels.map((label) => (
            <g key={label.id} className={`change-scale__band change-scale__band--${BAND_KIND[label.id]}`}>
              <LevelShape kind={BAND_KIND[label.id]} x={label.shape.x} y={label.shape.y} size={label.shape.size} />
              <text className="change-scale__band-name" x={label.textX} y={label.baseline}>
                {label.lines.map((line, index) => (
                  <tspan key={`${index}-${line}`} x={label.textX} dy={index === 0 ? 0 : layout.lineHeight}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          ))}

          {layout.today?.range && (
            <rect
              className="change-scale__range"
              x={layout.today.range.x1}
              y={lineY - layout.today.range.height / 2}
              width={Math.max(layout.today.range.x2 - layout.today.range.x1, 1)}
              height={layout.today.range.height}
              rx={layout.today.range.height / 2}
            />
          )}
          {layout.previous.map((mark, index) => (
            <circle key={`${index}-${mark.x}`} className="change-scale__previous" cx={mark.x} cy={mark.y} r={mark.r}>
              <title>{mark.label}</title>
            </circle>
          ))}
          {layout.today && <circle className="change-scale__today" cx={layout.today.x} cy={layout.today.y} r={layout.today.r} />}
        </svg>
      </div>
    </figure>
  );
}
