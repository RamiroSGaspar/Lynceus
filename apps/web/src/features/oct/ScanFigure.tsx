import type { ReactNode } from 'react';
import { useMessages } from '../../i18n';
import { BScanCanvas, CAPTURE_LAYERS, type LayerSet } from './BScanCanvas';
import type { ScanFrame } from './examStore';
import { octMessages } from './messages';

export type LegendKey = 'ilm' | 'bm' | 'bmo' | 'rings' | 'zone' | 'opening';

/** A sample of the stroke of one thing drawn over an image, as the design system draws it. */
export function StrokeSample({ kind }: { kind: LegendKey }) {
  return (
    <svg className="co-muestra" viewBox="0 0 28 10" aria-hidden="true" focusable="false">
      {(kind === 'ilm' || kind === 'opening') && <path className="co-trazo" d="M1 5h26" />}
      {kind === 'bm' && <path className="co-trazo co-trazo--trazos" d="M1 5h26" />}
      {kind === 'bmo' && <circle className="co-punto" cx="14" cy="5" r="3.5" />}
      {kind === 'rings' && <path className="co-trazo co-trazo--puntos" d="M1 5h26" />}
      {kind === 'zone' && (
        <>
          <path className="co-zona" strokeWidth="7" d="M1 5h26" />
          <path className="co-trazo" d="M1 1h26" />
          <path className="co-trazo co-trazo--trazos" d="M1 9h26" />
        </>
      )}
    </svg>
  );
}

/** Every mark that is drawn has its entry in the legend, with a sample of its stroke. Nothing depends on colour. */
export function StrokeLegend({ keys, className = '' }: { keys: readonly LegendKey[]; className?: string }) {
  const t = useMessages(octMessages);
  return (
    <ul className={`co-leyenda${className ? ` ${className}` : ''}`}>
      {keys.map((key) => (
        <li key={key}>
          <StrokeSample kind={key} /> {t(`layer.${key}`)}
        </li>
      ))}
    </ul>
  );
}

const LAYER_NAMES = ['ilm', 'bm', 'bmo'] as const;

/** What a scan shows, in words: which scan, and what is drawn on it. */
export function useScanLabel(): (frame: ScanFrame, total: number, layers?: LayerSet) => string {
  const t = useMessages(octMessages);
  return (frame, total, layers = CAPTURE_LAYERS) => {
    const shown = LAYER_NAMES.filter((key) => layers[key]).map((key) => t(`layer.${key}`));
    return [
      t('scan.alt', { n: frame.index + 1, total }),
      shown.length > 0 ? t('scan.alt.layers', { layers: shown.join(', ') }) : t('scan.alt.none'),
      frame.analysis.usable ? '' : t('scan.alt.unusable'),
    ]
      .filter(Boolean)
      .join(' ');
  };
}

interface Props {
  frame: ScanFrame;
  total: number;
  /** Shown under the image: the legend of its strokes. */
  legend?: boolean;
  children?: ReactNode;
}

/**
 * One scan of the tomography with the edges the engine marked: the second evidence, where
 * the thickness comes from. No border: four corners, like the viewfinder of an instrument.
 * Fixed proportion of 768 × 496: it is never stretched.
 */
export function ScanFigure({ frame, total, legend = false, children }: Props) {
  const t = useMessages(octMessages);
  const label = useScanLabel();
  return (
    <figure className="co-corte">
      <div className="co-corte__marco co-marco">
        <BScanCanvas frame={frame} layers={CAPTURE_LAYERS} label={label(frame, total)} mark={t('simulatedMark')} />
      </div>
      {legend && <StrokeLegend keys={LAYER_NAMES} />}
      {children}
    </figure>
  );
}
