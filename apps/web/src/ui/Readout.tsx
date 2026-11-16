import type { Origin } from '@app/core';
import type { ReactNode } from 'react';
import { OriginTag } from './OriginTag';

interface Props {
  /** The figure, already written for the language, or the words when the value is not a number. */
  value: ReactNode;
  unit?: string;
  /** Second line: the range, or the value it is compared with. */
  sub?: ReactNode;
  /** What the readout is, in two to five words, without a verb. */
  label: ReactNode;
  /** How the value was obtained: its sign goes before the label. */
  origin?: Origin;
  /**
   * `hero`: one per eye and nothing else on the screen. `lg`: the main figure of a veil.
   * `sm`: supporting readouts. `words`: when the value is not a number.
   */
  size?: 'hero' | 'lg' | 'md' | 'sm' | 'words';
  className?: string;
}

const SIZE_CLASS = { hero: ' co-lectura--heroe', lg: ' co-lectura--lg', md: '', sm: ' co-lectura--sm', words: ' co-lectura--palabras' } as const;

/**
 * The smallest unit of the interface, as on an instrument: a figure with its unit, a line,
 * and under it what it is and how it was obtained. Fixed order from top to bottom: figure and
 * unit, second line, line, label with its origin sign. No box and no background.
 */
export function Readout({ value, unit, sub, label, origin, size = 'md', className = '' }: Props) {
  return (
    <div className={`co-lectura${SIZE_CLASS[size]}${className ? ` ${className}` : ''}`}>
      <p className="co-lectura__valor">
        {value}
        {unit && (
          <>
            {' '}
            <span className="co-lectura__unidad">{unit}</span>
          </>
        )}
      </p>
      {sub !== undefined && sub !== null && sub !== false && <p className="co-lectura__sub">{sub}</p>}
      <p className="co-lectura__rotulo">
        {origin && <OriginTag origin={origin} />}
        <span>{label}</span>
      </p>
    </div>
  );
}
