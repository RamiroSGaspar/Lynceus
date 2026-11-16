import { RINGS_UM } from '@app/core';
import type { Ellipse } from '@app/core/math/ellipse';
import type { ReactNode } from 'react';
import { BrandWorking, SimulatedStamp, type LevelKind } from '../../ui';
import type { FundusFrame } from './examStore';
import { FundusImage } from './FundusCanvas';
import { ellipseOffset, lowestPoint, toWindowUnits, windowPath, type FundusWindow, type Point, type ScanLine } from './geometry';

/** Middle of the ring from 0 to 250 µm, µm from the opening: where its band is drawn and where the guide starts. */
const MAIN_RING_MIDDLE_UM = (RINGS_UM[0]![0] + RINGS_UM[0]![1]) / 2;
const MAIN_RING_WIDTH_UM = RINGS_UM[0]![1] - RINGS_UM[0]![0];

/**
 * What the engine measured, drawn over the ocular with its own geometry: the opening of the
 * nerve (solid), the band from 0 to 250 µm in the colour of the level, its outer limit
 * (dashed) and the limits at 500, 1000 and 1500 µm (dotted). White over a dark casing.
 */
export function RingMarks({ ellipse, window }: { ellipse: Ellipse; window: FundusWindow }) {
  const at = (distanceUm: number): string => windowPath(window, ellipseOffset(ellipse, distanceUm));
  const opening = at(0);
  const mainLimit = at(RINGS_UM[0]![1]);
  return (
    <>
      <path className="co-zona" d={at(MAIN_RING_MIDDLE_UM)} strokeWidth={(MAIN_RING_WIDTH_UM / 1000 / window.side) * 100} />
      <path className="co-trazo co-trazo--base" d={opening} />
      <path className="co-trazo" d={opening} />
      <path className="co-trazo co-trazo--base" d={mainLimit} />
      <path className="co-trazo co-trazo--trazos" d={mainLimit} />
      {RINGS_UM.slice(1).map(([, outer]) => (
        <path key={outer} className="co-trazo co-trazo--puntos" d={at(outer)} />
      ))}
    </>
  );
}

/** Where the guide to the figure starts: the lowest point on screen of the middle of the measured band, in window units. */
export function guideStart(ellipse: Ellipse, window: FundusWindow): Point | null {
  const lowest = lowestPoint(ellipseOffset(ellipse, MAIN_RING_MIDDLE_UM));
  return lowest ? toWindowUnits(window, lowest) : null;
}

/** `quiet`: taken, and stepping back so that what was measured on them reads over them. */
export type RadialState = 'pending' | 'taken' | 'quiet' | 'unusable' | 'current';

const RADIAL_CLASS: Record<RadialState, string> = {
  pending: 'co-radio',
  taken: 'co-radio is-tomado',
  quiet: 'co-radio is-quieto',
  unusable: 'co-radio is-malo',
  current: 'co-radio is-actual',
};

/** The 48 radial scans of a capture, one line each: the whole pattern is in view from the start, and each line lights up when its scan arrives. */
export function RadialMarks({ lines, window }: { lines: readonly { line: ScanLine; state: RadialState }[]; window: FundusWindow }) {
  return (
    <>
      {lines.map(({ line, state }, index) => {
        const a = toWindowUnits(window, { x: line.startXMm, y: line.startYMm });
        const b = toWindowUnits(window, { x: line.endXMm, y: line.endYMm });
        return <line key={index} className={RADIAL_CLASS[state]} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
      })}
    </>
  );
}

interface Props {
  /** The level of the eye: its ring and its glow, and the colour of the measured band. Null: no ring (no result yet, or a reference exam). */
  level: LevelKind | null;
  /** Four corners around the disc: the veil next to it shows this eye. */
  selected?: boolean;
  /** Makes the disc a button that chooses this eye. */
  onSelect?: () => void;
  /** What the image is, in words. */
  label: string;
  /** Above the disc: which eye, its level and any other finding of that eye. */
  head?: ReactNode;
  /** Under the disc: the figure. */
  foot?: ReactNode;
  /** The fundus image and the square of it that is shown. Null while there is none. */
  image: { fundus: FundusFrame; scaleXMm: number; scaleYMm: number; window: FundusWindow } | null;
  /** What is drawn over the image, in the 0 to 100 units of the window. */
  marks?: ReactNode;
  /** Start of the guide that joins the measured band with its figure, in window units. */
  guide?: Point | null;
  /** The image is being generated: the brand sweeps in its place. */
  working?: boolean;
  /** Said inside an empty disc: why there is no image, or no measurement. */
  empty?: ReactNode;
  className?: string;
}

/**
 * The eye as a disc of light in the field: the image every number comes from, with what the
 * engine measured drawn on it, the ring of its level around it and a guide that ties the
 * figure to the place where it was measured. The image is never retouched: only the round
 * crop, which leaves out the corners where nothing is measured. The whole square image is
 * in the viewer.
 */
export function Ocular({ level, selected = false, onSelect, label, head, foot, image, marks, guide, working = false, empty, className = '' }: Props) {
  const unmeasured = level === 'unmeasured';
  const lens = (
    <>
      {image && <FundusImage fundus={image.fundus} scaleXMm={image.scaleXMm} scaleYMm={image.scaleYMm} window={image.window} />}
      {image && marks && (
        <svg className="co-ocular__marcas" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          {marks}
        </svg>
      )}
      {!image && working && (
        <span className="co-ocular__vacio">
          <BrandWorking size="sm" />
        </span>
      )}
      {!image && !working && empty && <span className="co-ocular__vacio">{empty}</span>}
      {image && <SimulatedStamp />}
    </>
  );
  return (
    <figure
      className={`co-ocular${level ? ` co-ocular--${level}` : ''}${selected ? ' is-elegido' : ''}${image ? '' : ' is-sin-imagen'}${className ? ` ${className}` : ''}`}
    >
      {head && <div className="co-ocular__cabeza co-halo">{head}</div>}
      <div className="co-ocular__campo">
        {onSelect ? (
          <button type="button" className="co-ocular__lente" aria-pressed={selected} aria-label={label} onClick={onSelect}>
            {lens}
          </button>
        ) : (
          <div className="co-ocular__lente co-ocular__lente--fija" role="img" aria-label={label}>
            {lens}
          </div>
        )}
        {level && !unmeasured && <span className="co-ocular__anillo" />}
        {image && guide && (
          <svg className="co-ocular__guia" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            <line className="co-trazo co-trazo--base" x1={guide.x} y1={guide.y} x2={guide.x} y2={99} />
            <line className="co-trazo" x1={guide.x} y1={guide.y} x2={guide.x} y2={113} />
            <circle className="co-punto co-punto--lleno" cx={guide.x} cy={guide.y} r={1.4} />
          </svg>
        )}
      </div>
      {foot && <figcaption className="co-ocular__pie co-halo">{foot}</figcaption>}
    </figure>
  );
}
