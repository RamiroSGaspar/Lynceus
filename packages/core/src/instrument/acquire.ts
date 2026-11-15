/**
 * Virtual instrument (spec 01, section 5): `acquire(request)` returns an exam in
 * the shape of a Spectralis `.vol` export. The fundus image and each B-scan are
 * computed when asked for, so a whole exam is never held in memory at once.
 */
import type { BScan, CaptureRequest, CrewId, Eye, ExamSource, VolHeader } from '../contract';
import {
  RADIAL_SCANS,
  SCALE_X_MM,
  SCALE_Z_MM,
  SCAN_COLUMNS,
  SCAN_ROWS,
  SLO_FIELD_DEG,
  SLO_SCALE_MM,
  SLO_SIZE_PX,
} from '../constants';
import { BIRTH_DATES, CREW_IDS, crewMember, flightDayDateMs } from '../eye/crew';
import { getEye } from '../eye/model';
import { qualityDb } from '../quality';
import { createRng } from '../rng';
import { BSCAN_VERSION, DEFAULT_BSCAN_HDR_SIZE, SCAN_PATTERN_RADIAL, VOL_VERSION, msToOleDays } from '../vol/format';
import { renderBScan } from './bscan';
import { captureSetup, scanSetup } from './capture';
import { radialScanEndpoints } from './geometry';
import { renderSlo } from './slo';
import { seedOf } from './texture';

/**
 * Target quality at which the signal has its calibrated grey levels (spec 3.7). A scan
 * aiming at q dB is rendered with a gain of q − 30 dB. The quality written to the header
 * is measured on the image with the definition of 5.4; for a nominal clean scan it reads
 * about 25 dB, not 27–33: with the greys of 3.7 and the vitreous at 0.10 both cannot hold
 * (see NOTES.md, "Cambios respecto de la especificación").
 */
export const NOMINAL_QUALITY_DB = 30;

/**
 * Version of the virtual instrument: what it draws for a given request. The `.vol`
 * format alone does not identify it. Changes whenever the same request would give
 * different pixels or headers.
 */
export const INSTRUMENT_VERSION = 'virtual-instrument-1';

export interface AcquireOptions {
  /** false renders without speckle (noise-free engine tests, spec 01 test 5). Default true. */
  speckle?: boolean;
}

function crewIndex(id: CrewId): number {
  return CREW_IDS.indexOf(id);
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

/** Unique exam id: crew digit, eye digit, flight day (3 digits) and attempt (our numbering). */
export function examId(crewId: CrewId, eye: Eye, flightDay: number, attempt: number): string {
  return `${crewIndex(crewId) + 1}${eye === 'OD' ? 1 : 2}${pad(flightDay, 3)}${attempt}`;
}

function validate(request: CaptureRequest): void {
  if (crewIndex(request.crewId) < 0) throw new RangeError(`Unknown crew member ${String(request.crewId)}`);
  if (request.eye !== 'OD' && request.eye !== 'OS') throw new RangeError(`Unknown eye ${String(request.eye)}`);
  if (!Number.isInteger(request.flightDay) || request.flightDay < 0 || request.flightDay > 999) throw new RangeError('flightDay must be an integer from 0 to 999');
  if (!Number.isInteger(request.attempt) || request.attempt < 1 || request.attempt > 9) throw new RangeError('attempt must be an integer from 1 to 9');
}

export function examHeader(request: CaptureRequest): VolHeader {
  const { crewId, eye, flightDay, attempt } = request;
  const member = crewMember(crewId);
  const ci = crewIndex(crewId);
  const dayMs = flightDayDateMs(flightDay);
  // Exams start at 09:00 UTC, crew members 30 min apart, left eye 10 min after the right,
  // a repeated attempt 4 min after the previous one (our scenario).
  const examTimeMs = dayMs + 9 * 3600000 + ci * 1800000 + (eye === 'OS' ? 600000 : 0) + (attempt - 1) * 240000;
  const [by, bm, bd] = BIRTH_DATES[crewId];
  const focus = createRng(`eye/${crewId}/${eye}/refraction`).uniform(-1.5, 0.5);
  return {
    version: VOL_VERSION,
    sizeX: SCAN_COLUMNS,
    numBScans: RADIAL_SCANS,
    sizeZ: SCAN_ROWS,
    scaleXMm: SCALE_X_MM,
    distanceMm: 0,
    scaleZMm: SCALE_Z_MM,
    sizeXSlo: SLO_SIZE_PX,
    sizeYSlo: SLO_SIZE_PX,
    scaleXSloMm: SLO_SCALE_MM,
    scaleYSloMm: SLO_SCALE_MM,
    fieldSizeSloDeg: SLO_FIELD_DEG,
    scanFocusD: Math.round(focus * 100) / 100,
    scanPosition: eye,
    examTimeMs,
    scanPattern: SCAN_PATTERN_RADIAL,
    bscanHdrSize: DEFAULT_BSCAN_HDR_SIZE,
    id: examId(crewId, eye, flightDay, attempt),
    // The reference exam is attempt 1 of day 0; a repeated pre-flight capture refers to it too.
    referenceId: examId(crewId, eye, 0, 1),
    pid: 1000 + ci + 1,
    patientId: member.patientId,
    dobDays: msToOleDays(Date.UTC(by, bm - 1, bd)),
    vid: 50000 + (ci + 1) * 1000 + flightDay,
    visitId: flightDay === 0 ? 'PRE' : `FD${pad(flightDay, 3)}`,
    visitDateDays: msToOleDays(dayMs),
    gridType: 0,
    gridOffset: 0,
    gridType1: 0,
    gridOffset1: 0,
    progId: `SIM-SANS-${crewId}-${eye}`,
  };
}

export function acquire(request: CaptureRequest, options: AcquireOptions = {}): ExamSource {
  validate(request);
  const { crewId, eye, flightDay, attempt } = request;
  const speckle = options.speckle ?? true;
  const state = getEye(crewId, eye).state(flightDay);
  const setup = captureSetup(request);
  const header = examHeader(request);
  const choroidSeed = seedOf(`choroid/${crewId}/${eye}`);
  const prefix = `${crewId}/${eye}/${flightDay}/${attempt}`;
  let slo: Uint8Array | null = null;
  return {
    header,
    get slo(): Uint8Array {
      if (!slo) slo = renderSlo(state, setup.geometry, `slo/${prefix}`);
      return slo;
    },
    bscan(index: number): BScan {
      if (!Number.isInteger(index) || index < 0 || index >= RADIAL_SCANS) throw new RangeError(`B-scan ${index} out of range`);
      const ends = radialScanEndpoints(setup.geometry.patternCenterXMm, setup.geometry.patternCenterYMm, index);
      const scan = scanSetup(request, setup, index);
      const gainDb = scan.targetQualityDb - NOMINAL_QUALITY_DB - (setup.conditions.signalLossDb ?? 0);
      const pixels = renderBScan({
        state,
        geometry: setup.geometry,
        ...ends,
        setup: scan,
        conditions: setup.conditions,
        gainDb,
        noiseKey: `scan/${prefix}/${index}`,
        speckle,
        choroidSeed,
      });
      return {
        index,
        header: {
          version: BSCAN_VERSION,
          bscanHdrSize: DEFAULT_BSCAN_HDR_SIZE,
          ...ends,
          numSeg: 0,
          offSeg: 256,
          qualityDb: Math.fround(qualityDb(pixels, SCAN_COLUMNS, SCAN_ROWS)),
          shift: 0,
          ivTrafo: [0, 0, 0, 0, 0, 0],
        },
        segLines: [],
        pixels,
      };
    },
  };
}
