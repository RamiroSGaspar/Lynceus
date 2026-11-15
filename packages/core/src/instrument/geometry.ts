/**
 * Where an exam sits: the scan pattern on the fundus image and the eye under it
 * (spec 01, 5.1). Fundus frame: mm, x right, y down, origin at the top-left of
 * the fundus image. Anatomical frame: µm, origin at the centre of the opening,
 * x temporal, y superior. Temporal is on the left of the image in a right eye
 * (OD) and on the right in a left eye (OS); superior is up in both.
 */
import type { Eye } from '../contract';
import { RADIAL_SCANS, SCAN_LENGTH_MM } from '../constants';

export interface ExamGeometry {
  eye: Eye;
  /** Centre of the scan pattern, fundus mm. */
  patternCenterXMm: number;
  patternCenterYMm: number;
  /** Centre of the opening (origin of the anatomical frame), fundus mm. */
  bmoCenterXMm: number;
  bmoCenterYMm: number;
  /** Rotation of the anatomy in the image, radians (registration error of follow-up exams). */
  rotation: number;
}

/** −1 for OD (temporal = image left), +1 for OS. */
function lateral(eye: Eye): number {
  return eye === 'OD' ? -1 : 1;
}

export function anatomicalToFundus(g: ExamGeometry, xUm: number, yUm: number): [number, number] {
  const lx = (lateral(g.eye) * xUm) / 1000;
  const ly = -yUm / 1000;
  const c = Math.cos(g.rotation);
  const s = Math.sin(g.rotation);
  return [g.bmoCenterXMm + c * lx - s * ly, g.bmoCenterYMm + s * lx + c * ly];
}

export function fundusToAnatomical(g: ExamGeometry, fxMm: number, fyMm: number): [number, number] {
  const dx = fxMm - g.bmoCenterXMm;
  const dy = fyMm - g.bmoCenterYMm;
  const c = Math.cos(g.rotation);
  const s = Math.sin(g.rotation);
  const lx = c * dx + s * dy;
  const ly = -s * dx + c * dy;
  return [lateral(g.eye) * lx * 1000, -ly * 1000];
}

/**
 * Start and end of radial B-scan k (centres of its first and last column): it
 * passes through the pattern centre at k·3.75° from the x axis of the image,
 * measured counter-clockwise as seen on screen (y points down).
 */
export function radialScanEndpoints(patternCenterXMm: number, patternCenterYMm: number, k: number): { startXMm: number; startYMm: number; endXMm: number; endYMm: number } {
  const angle = (k * Math.PI) / RADIAL_SCANS;
  const dx = Math.cos(angle) * (SCAN_LENGTH_MM / 2);
  const dy = -Math.sin(angle) * (SCAN_LENGTH_MM / 2);
  return {
    startXMm: patternCenterXMm - dx,
    startYMm: patternCenterYMm - dy,
    endXMm: patternCenterXMm + dx,
    endYMm: patternCenterYMm + dy,
  };
}
