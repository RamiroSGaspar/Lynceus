import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { LevelShape, type LevelKind } from './LevelShape';

/** What is drawn on the line at a stop. */
export type MissionPoint =
  /** A control that was done: the shape and the colour of its level. `unmeasured`: a control still to do, or without a result. */
  | { kind: 'level'; level: LevelKind }
  /** A day that can be chosen, where there is no level to show yet: a hollow disc, filled when chosen. */
  | { kind: 'day' }
  /** An end of the mission: a short mark. */
  | { kind: 'end' };

export interface MissionStop {
  /** Flight day: 0 is the pre-flight exam, the mission length is the return. */
  day: number;
  point: MissionPoint;
  /** Above the line, with its triangle: before the flight, today, return. */
  mark?: string;
  /** Under the line: the day of the control. */
  label?: string;
  /** The stop being looked at, or the day chosen: larger, white and bold. */
  current?: boolean;
  /** Day and level in words: the shape alone is not enough, and the visible label is an abbreviation. */
  name: string;
  /** Opens the control. */
  href?: string;
  /** Makes the stop one option of a group of radio buttons: the line is then the selector of the mission day. */
  option?: { name: string; value: number; checked: boolean; onChange(): void };
}

interface Props {
  /** What the line is, for assistive technology. */
  label: string;
  durationDays: number;
  stops: readonly MissionStop[];
  /** Renders a `fieldset`: use it when the stops are options. The legend is hidden: the line is labelled next to it. */
  legend?: string;
  describedBy?: string;
}

/** Width the line is laid out for at its narrowest (`--_minimo`, 35rem, less its padding: 4.5rem on the left and 3.5rem on the right), in pixels. */
const NARROWEST_LINE_PX = 432;
/** Width of one character of a day label (14 px, capitals, medium weight), in pixels, on the generous side. */
const LABEL_CHAR_PX = 8.8;

/**
 * Two controls close together cannot both carry their label: the day stays in view on the stop
 * being looked at or, if neither is, on the more recent one. The other shows its day on focus or
 * under the pointer, and always has it in its name.
 */
function crowded(stops: readonly MissionStop[], durationDays: number): ReadonlySet<MissionStop> {
  const pxPerDay = NARROWEST_LINE_PX / durationDays;
  const width = (stop: MissionStop): number => (stop.label ?? '').length * LABEL_CHAR_PX + 6;
  const labelled = stops.filter((stop) => stop.label);
  const byPriority = [...labelled].sort((a, b) => Number(b.current ?? false) - Number(a.current ?? false) || b.day - a.day);
  const kept: MissionStop[] = [];
  const hidden = new Set<MissionStop>();
  for (const stop of byPriority) {
    const collides = kept.some((other) => Math.abs(other.day - stop.day) * pxPerDay < (width(other) + width(stop)) / 2);
    if (collides) hidden.add(stop);
    else kept.push(stop);
  }
  return hidden;
}

function Point({ point }: { point: MissionPoint }) {
  if (point.kind === 'level') return <LevelShape kind={point.level} className={`co-mision__punto co-mision__punto--${point.level}`} />;
  return <span className={`co-mision__punto co-mision__punto--${point.kind === 'day' ? 'dia' : 'tope'}`} />;
}

/**
 * The days of the mission on one line, from before the flight to the return, with every control
 * on its day and with its level. It is for knowing where one is and for travelling: touching a
 * control opens it. Above the line, the marks with a triangle; under it, the day of each control.
 */
export function MissionLine({ label, durationDays, stops, legend, describedBy }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const hidden = crowded(stops, durationDays);
  const currentDay = stops.find((stop) => stop.current)?.day;

  // On a narrow screen the line scrolls sideways: the current stop stays in view.
  useLayoutEffect(() => {
    const element = box.current;
    const current = element?.querySelector<HTMLElement>('.is-actual');
    const list = element?.querySelector<HTMLElement>('.co-mision__linea');
    if (!element || !current || !list || element.scrollWidth <= element.clientWidth) return;
    element.scrollLeft = list.offsetLeft + current.offsetLeft - element.clientWidth / 2;
  }, [currentDay]);

  const items = stops.map((stop) => {
    const className = `co-mision__control${hidden.has(stop) ? ' is-apretado' : ''}`;
    const content = (
      <>
        {stop.mark && <span className="co-mision__marca">{stop.mark}</span>}
        <Point point={stop.point} />
        {stop.label && <span className="co-mision__dia">{stop.label}</span>}
      </>
    );
    return (
      <li
        key={`${stop.day}-${stop.point.kind}`}
        className={stop.current ? 'is-actual' : undefined}
        style={{ '--x': `${Math.round((stop.day / durationDays) * 1000) / 10}%` } as CSSProperties}
        aria-current={stop.current && !stop.option ? 'step' : undefined}
      >
        {stop.option ? (
          <label className={className}>
            <input
              className="co-oculto"
              type="radio"
              name={stop.option.name}
              value={stop.option.value}
              checked={stop.option.checked}
              onChange={stop.option.onChange}
              aria-label={stop.name}
            />
            {content}
          </label>
        ) : stop.href ? (
          <a className={className} href={stop.href} aria-label={stop.name}>
            {content}
          </a>
        ) : (
          <span className={`${className} co-mision__control--fijo`} role="img" aria-label={stop.name}>
            {content}
          </span>
        )}
      </li>
    );
  });

  return (
    <div ref={box} className="co-desliza">
      {legend ? (
        <fieldset className="co-mision" aria-describedby={describedBy}>
          <legend className="co-oculto">{legend}</legend>
          <ol className="co-mision__linea">{items}</ol>
        </fieldset>
      ) : (
        <nav className="co-mision" aria-label={label}>
          <ol className="co-mision__linea">{items}</ol>
        </nav>
      )}
    </div>
  );
}
