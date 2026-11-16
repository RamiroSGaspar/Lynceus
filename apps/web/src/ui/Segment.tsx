import type { ReactNode } from 'react';

export interface SegmentOption<V extends string> {
  value: V;
  /** What is seen. */
  label: ReactNode;
  /** The full name, for assistive technology, when what is seen is an abbreviation. */
  name?: string;
  /** Language of the label, when it is not the one of the page. */
  lang?: string;
}

interface Props<V extends string> {
  /** What is being chosen: "Language", "Eye". */
  label: string;
  options: readonly SegmentOption<V>[];
  value: V;
  onChange(value: V): void;
  className?: string;
}

/** Choosing between two or three: language, eye. The chosen one is white and underlined. */
export function Segment<V extends string>({ label, options, value, onChange, className = '' }: Props<V>) {
  return (
    <div className={`co-segmento${className ? ` ${className}` : ''}`} role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" lang={option.lang} aria-pressed={option.value === value} onClick={() => onChange(option.value)}>
          {option.name ? (
            <>
              <span aria-hidden="true">{option.label}</span>
              <span className="co-oculto">{option.name}</span>
            </>
          ) : (
            option.label
          )}
        </button>
      ))}
    </div>
  );
}
