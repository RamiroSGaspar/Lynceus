/**
 * What happens during one capture: where the pattern lands, which failures occur
 * and the small random differences of each B-scan (spec 01, 5.1, 5.2 and 5.5).
 * Everything comes from text-keyed seeds, so any scan can be regenerated alone.
 */
import type { CaptureConditions, CaptureRequest, CrewId, Eye } from '../contract';
import { SLO_SCALE_MM, SLO_SIZE_PX } from '../constants';
import { clamp } from '../math/interp';
import { createRng } from '../rng';
import type { ExamGeometry } from './geometry';

const DEG = Math.PI / 180;

/** Scripted events of the fictional scenario (spec 01, 5.5). They replace the seed-drawn failures. */
export const SCRIPTED_EVENTS: readonly { crewId: CrewId; eye: Eye; flightDay: number; attempt: number; conditions: CaptureConditions; purpose: string }[] = [
  {
    crewId: 'B',
    eye: 'OS',
    flightDay: 150,
    attempt: 1,
    conditions: { blink: { startFraction: 0.4, widthFraction: 0.35 }, affectedScans: { from: 18, to: 31 } },
    purpose: 'Blink on scans 18 to 31: the system asks to repeat and attempt 2 is good',
  },
  {
    crewId: 'C',
    eye: 'OD',
    flightDay: 90,
    attempt: 1,
    conditions: { signalLossDb: 18 },
    purpose: 'Signal loss of 18 dB (quality near 12 dB): poor signal, repeat',
  },
  {
    crewId: 'A',
    eye: 'OD',
    flightDay: 30,
    attempt: 1,
    conditions: { truncationPx: 60 },
    purpose: 'Retina 60 rows out of the frame: cut image, repeat',
  },
];

export interface CaptureSetup {
  geometry: ExamGeometry;
  conditions: CaptureConditions;
  /** Mean quality the capture aims at before any signal loss, dB. */
  targetQualityDb: number;
  /** Standard deviation of the quality from scan to scan, dB. */
  scanQualitySdDb: number;
}

export interface ScanSetup {
  /** Tilt of the retina in the frame: depth change per unit of width. */
  slope: number;
  /** Depth displacement at both ends of the scan relative to its middle, µm. */
  curvatureUm: number;
  /** Shift of the retina in the frame from its nominal position, rows. */
  verticalOffsetRows: number;
  /** Quality this scan aims at before signal loss, dB. */
  targetQualityDb: number;
  /** Whether blink, motion and edge fade hit this scan. */
  affected: boolean;
}

/** Operator centring error of the reference exam: normal, 70 µm per axis, fixed per eye (spec 5.1). */
function centringErrorMm(crewId: CrewId, eye: Eye): [number, number] {
  const rng = createRng(`eye/${crewId}/${eye}/centring`);
  return [rng.normal(0, 0.07), rng.normal(0, 0.07)];
}

export function captureSetup(request: CaptureRequest): CaptureSetup {
  const { crewId, eye, flightDay, attempt } = request;
  const rng = createRng(`attempt/${crewId}/${eye}/${flightDay}/${attempt}`);
  const half = (SLO_SIZE_PX * SLO_SCALE_MM) / 2;
  // The fundus image is framed a little differently every time; the pattern follows the anatomy.
  const patternX = half + rng.normal(0, 0.12);
  const patternY = half + rng.normal(0, 0.12);
  const [cx, cy] = centringErrorMm(crewId, eye);
  // Follow-up exams are placed on the reference exam by eye tracking: same centre relative to
  // the anatomy, with a small registration error (normal, 12 µm per axis, 0.3° turn) [P1, P3].
  const followUp = flightDay > 0 || attempt > 1;
  const regX = followUp ? rng.normal(0, 0.012) : 0;
  const regY = followUp ? rng.normal(0, 0.012) : 0;
  const rotation = followUp ? rng.normal(0, 0.3) * DEG : 0;

  let conditions: CaptureConditions;
  let targetQualityDb: number;
  let scanQualitySdDb: number;
  if (request.conditions) {
    conditions = request.conditions;
    targetQualityDb = 30;
    scanQualitySdDb = 0;
  } else {
    // Seed-drawn capture: mean quality normal(30; 1.5) clipped to 26–34 dB, 0.8 dB from scan to
    // scan, slight motion (spec 5.5); scripted events of the scenario override the failures.
    targetQualityDb = clamp(rng.normal(30, 1.5), 26, 34);
    scanQualitySdDb = 0.8;
    conditions = { motion: rng.uniform(0, 0.15) };
    const scripted = SCRIPTED_EVENTS.find((e) => e.crewId === crewId && e.eye === eye && e.flightDay === flightDay && e.attempt === attempt);
    if (scripted) conditions = { ...conditions, ...scripted.conditions };
  }
  const dec = conditions.decentrationMm ?? { x: 0, y: 0 };
  return {
    geometry: {
      eye,
      patternCenterXMm: patternX,
      patternCenterYMm: patternY,
      bmoCenterXMm: patternX - cx - regX - dec.x,
      bmoCenterYMm: patternY - cy - regY - dec.y,
      rotation,
    },
    conditions,
    targetQualityDb,
    scanQualitySdDb,
  };
}

export function scanSetup(request: CaptureRequest, setup: CaptureSetup, k: number): ScanSetup {
  const { crewId, eye, flightDay, attempt } = request;
  const rng = createRng(`scan/${crewId}/${eye}/${flightDay}/${attempt}/${k}/setup`);
  const range = setup.conditions.affectedScans;
  return {
    slope: rng.normal(0, 0.015),
    curvatureUm: rng.normal(0, 15),
    verticalOffsetRows: rng.normal(0, 12),
    targetQualityDb: setup.targetQualityDb + rng.normal(0, 1) * setup.scanQualitySdDb,
    affected: !range || (k >= range.from && k <= range.to),
  };
}
