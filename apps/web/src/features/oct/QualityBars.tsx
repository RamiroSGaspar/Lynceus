import { QUALITY_MAX_DB, QUALITY_POOR_DB } from '@app/core';
import { useI18n, useMessages } from '../../i18n';
import { octMessages } from './messages';

export interface BarScan {
  qualityDb: number;
  usable: boolean;
}

interface Props {
  /** One entry per scan; undefined while not taken. */
  scans: readonly (BarScan | undefined)[];
  highlight: number | null;
  onSelect?: (index: number) => void;
}

const W = 760;
const H = 128;
const LEFT = 30;
/** Room on the right for the 15 dB label, so it never sits on the bars. */
const RIGHT = 48;
const TOP = 8;
const PLOT_H = 92;

/** 48 bars of quality in decibels, with the 15 dB line of poor signal [P13]. */
export function QualityBars({ scans, highlight, onSelect }: Props) {
  const t = useMessages(octMessages);
  const { formatNumber } = useI18n();
  const total = scans.length;
  const slot = (W - LEFT - RIGHT) / Math.max(total, 1);
  const y = (db: number) => TOP + PLOT_H - (Math.min(Math.max(db, 0), QUALITY_MAX_DB) / QUALITY_MAX_DB) * PLOT_H;
  const taken = scans.filter((s): s is BarScan => s !== undefined);
  const mean = taken.length > 0 ? taken.reduce((a, s) => a + s.qualityDb, 0) / taken.length : 0;
  const one = (v: number) => formatNumber(v, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const summary = t('quality.alt', {
    taken: taken.length,
    total,
    mean: one(mean),
    below: taken.filter((s) => s.qualityDb < QUALITY_POOR_DB).length,
    unusable: taken.filter((s) => !s.usable).length,
  });
  return (
    <figure className="oct-quality">
      <figcaption className="oct-quality__caption">
        {t('quality.title')} <span className="oct-muted">({t('quality.axis')})</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="oct-quality__svg">
        {[0, QUALITY_POOR_DB, QUALITY_MAX_DB].map((db) => (
          <text key={db} x={LEFT - 6} y={y(db) + 4} className="oct-quality__tick" textAnchor="end">
            {db}
          </text>
        ))}
        <line x1={LEFT} x2={W - RIGHT} y1={y(0)} y2={y(0)} className="oct-quality__axis" />
        {scans.map((scan, index) => {
          const x = LEFT + index * slot;
          const bw = Math.max(slot - 3, 2);
          const selected = index === highlight;
          return (
            <g
              key={index}
              className={`oct-quality__slot${onSelect ? ' oct-quality__slot--pick' : ''}`}
              onClick={onSelect ? () => onSelect(index) : undefined}
            >
              <title>
                {scan
                  ? t('quality.bar', { n: index + 1, quality: one(scan.qualityDb), state: t(scan.usable ? 'quality.usable' : 'quality.unusable') })
                  : t('scan.title', { n: index + 1, total })}
              </title>
              <rect x={x} y={TOP} width={slot} height={PLOT_H + 26} className="oct-quality__hit" />
              {scan && (
                <rect
                  x={x + 1.5}
                  y={y(scan.qualityDb)}
                  width={bw}
                  height={y(0) - y(scan.qualityDb)}
                  className={scan.usable ? 'oct-quality__bar' : 'oct-quality__bar oct-quality__bar--unusable'}
                />
              )}
              {scan && !scan.usable && (
                <path
                  d={`M${x + 1.5} ${y(0) + 4} l${bw} 7 M${x + 1.5 + bw} ${y(0) + 4} l${-bw} 7`}
                  className="oct-quality__cross"
                />
              )}
              {selected && <path d={`M${x + slot / 2} ${y(0) + 14} l5 8 h-10 z`} className="oct-quality__marker" />}
            </g>
          );
        })}
        <line x1={LEFT} x2={W - RIGHT + 4} y1={y(QUALITY_POOR_DB)} y2={y(QUALITY_POOR_DB)} className="oct-quality__poor" />
        <text x={W - RIGHT + 8} y={y(QUALITY_POOR_DB) + 4} className="oct-quality__poor-label">
          {t('quality.line')}
        </text>
      </svg>
      <p className="oct-legend">
        <span>
          <svg width="14" height="14" aria-hidden="true">
            <rect x="2" y="2" width="10" height="10" className="oct-quality__bar" />
          </svg>
          {t('legend.barUsable')}
        </span>
        <span>
          <svg width="14" height="14" aria-hidden="true">
            <rect x="2" y="2" width="10" height="10" className="oct-quality__bar oct-quality__bar--unusable" />
          </svg>
          {t('legend.barUnusable')}
        </span>
        <span className="oct-muted">{t('quality.lineHelp')}</span>
      </p>
    </figure>
  );
}
