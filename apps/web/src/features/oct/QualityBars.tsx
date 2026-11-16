import { QUALITY_MAX_DB, QUALITY_POOR_DB } from '@app/core';
import type { CSSProperties } from 'react';
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
  /** Taller bars: in the viewer, where a bar is also something to tap. */
  tall?: boolean;
}

/** Mean quality of the scans taken so far, dB; 0 when none. */
export function meanQualityDb(scans: readonly (BarScan | undefined)[]): number {
  const taken = scans.filter((scan): scan is BarScan => scan !== undefined);
  return taken.length > 0 ? taken.reduce((sum, scan) => sum + scan.qualityDb, 0) / taken.length : 0;
}

/**
 * One bar per scan: its quality in decibels against the 15 dB line of poor signal [P13].
 * No colours: a scan that cannot be used is an outlined bar, what is still to be taken is a
 * low grey mark, and the limit is a dashed line.
 */
export function QualityBars({ scans, highlight, onSelect, tall = false }: Props) {
  const t = useMessages(octMessages);
  const { formatNumber } = useI18n();
  const total = scans.length;
  const taken = scans.filter((scan): scan is BarScan => scan !== undefined);
  const one = (value: number) => formatNumber(value, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const summary = t('quality.alt', {
    taken: taken.length,
    total,
    mean: one(meanQualityDb(scans)),
    below: taken.filter((scan) => scan.qualityDb < QUALITY_POOR_DB).length,
    unusable: taken.filter((scan) => !scan.usable).length,
  });
  const height = (db: number): string => `${Math.round((Math.min(Math.max(db, 0), QUALITY_MAX_DB) / QUALITY_MAX_DB) * 1000) / 10}%`;
  return (
    <div
      className={`co-barras${tall ? ' co-barras--alta' : ''}${onSelect ? ' co-barras--elegible' : ''}`}
      role="img"
      aria-label={summary}
      style={{ '--limite': height(QUALITY_POOR_DB) } as CSSProperties}
    >
      {scans.map((scan, index) => (
        <i
          key={index}
          className={[scan ? '' : 'is-pendiente', scan && !scan.usable ? 'is-malo' : '', index === highlight ? 'is-elegido' : ''].filter(Boolean).join(' ') || undefined}
          style={scan ? ({ '--v': height(scan.qualityDb) } as CSSProperties) : undefined}
          title={
            scan
              ? t('quality.bar', { n: index + 1, quality: one(scan.qualityDb), state: t(scan.usable ? 'quality.usable' : 'quality.unusable') })
              : t('scan.title', { n: index + 1, total })
          }
          onClick={onSelect ? () => onSelect(index) : undefined}
        />
      ))}
    </div>
  );
}
