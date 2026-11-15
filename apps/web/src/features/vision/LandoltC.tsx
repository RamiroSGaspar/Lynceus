import type { ScreenCalibration } from '@app/core';
import { optotypeSizePx, type Orientation } from '@app/core/vision/index';
import { useEffect, useRef } from 'react';
import { ACUITY_BACKGROUND, ACUITY_FIGURE } from './testSurface';

interface Props {
  logMar: number;
  orientation: Orientation;
  calibration: ScreenCalibration;
  devicePixelRatio: number;
  label: string;
}

/** Smallest side of the light test area, CSS pixels. */
const MIN_AREA_CSS = 180;

/**
 * Landolt C drawn on a canvas in device pixels, with sub-pixel precision and anti-aliasing:
 * outer diameter five strokes, inner three, gap one stroke (research doc 1.A, P1 and F1).
 */
export function LandoltC({ logMar, orientation, calibration, devicePixelRatio, label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { heightPx, strokePx } = optotypeSizePx(logMar, calibration.viewingDistanceCm, calibration.pxPerMm);
  const sidePx = Math.ceil(Math.max(MIN_AREA_CSS * devicePixelRatio, heightPx * 2.5));

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = ACUITY_BACKGROUND;
    context.fillRect(0, 0, sidePx, sidePx);
    const centre = sidePx / 2;
    context.fillStyle = ACUITY_FIGURE;
    context.beginPath();
    context.arc(centre, centre, 2.5 * strokePx, 0, 2 * Math.PI);
    context.arc(centre, centre, 1.5 * strokePx, 0, 2 * Math.PI, true);
    context.fill();
    // Canvas y grows downwards, so a counter-clockwise direction is a negative rotation.
    context.translate(centre, centre);
    context.rotate((-orientation * Math.PI) / 4);
    context.fillStyle = ACUITY_BACKGROUND;
    context.fillRect(0, -strokePx / 2, 2.5 * strokePx + 2, strokePx);
  }, [sidePx, strokePx, orientation]);

  return (
    <canvas
      ref={ref}
      className="vt-optotype"
      width={sidePx}
      height={sidePx}
      style={{ width: `${sidePx / devicePixelRatio}px`, height: `${sidePx / devicePixelRatio}px` }}
      role="img"
      aria-label={label}
    />
  );
}
