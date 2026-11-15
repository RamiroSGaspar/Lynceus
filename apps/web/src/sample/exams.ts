/**
 * Sample values of the contract types: exam summaries and capture results.
 *
 * SIMULATED DATA. Nothing here comes from a person or from the analysis engine.
 * These factories only give the screens, the provisional pieces and the tests
 * well-formed values to work with.
 */
import type {
  CaptureAttemptRecord,
  CrewId,
  ExamRejection,
  ExamSummary,
  Eye,
  EyeCaptureResult,
  Quantity,
  ScanRejection,
  Sector,
} from '@app/core';

const DAY_MS = 86_400_000;
/** Flight day 1 of the fictional mission (specification 01, section 4). Only gives sample exams a plausible time. */
const SAMPLE_LAUNCH_MS = Date.UTC(2026, 4, 20);
/** The NASA protocol takes 48 radial scans per exam (specification 01, section 1). */
const SCANS_PER_EXAM = 48;

const SECTORS: readonly { sector: Sector; factor: number }[] = [
  { sector: 'T', factor: 0.8 },
  { sector: 'TS', factor: 1.1 },
  { sector: 'NS', factor: 1.15 },
  { sector: 'N', factor: 0.95 },
  { sector: 'NI', factor: 1.2 },
  { sector: 'TI', factor: 1.0 },
];

/** Ring limits in micrometres from the opening, with a plausible thickness relative to the innermost ring. */
const RINGS: readonly { innerUm: number; outerUm: number; factor: number }[] = [
  { innerUm: 0, outerUm: 250, factor: 1 },
  { innerUm: 250, outerUm: 500, factor: 0.86 },
  { innerUm: 500, outerUm: 1000, factor: 0.74 },
  { innerUm: 1000, outerUm: 1500, factor: 0.66 },
];

function measured(value: number, unit: Quantity['unit'] = 'µm'): Quantity {
  return { value, unit, origin: 'measured' };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Every sample id starts with `SIM-`, like the patient ids of the fictional crew. */
export function sampleExamId(crewId: CrewId, eye: Eye, flightDay: number, attempt = 1): string {
  return `SIM-${crewId}-${eye}-FD${String(flightDay).padStart(3, '0')}-${attempt}`;
}

export function sampleExamTimeMs(flightDay: number): number {
  return flightDay <= 0 ? SAMPLE_LAUNCH_MS - 60 * DAY_MS : SAMPLE_LAUNCH_MS + (flightDay - 1) * DAY_MS;
}

export interface SampleExamOptions {
  crewId: CrewId;
  eye: Eye;
  /** 0 is the pre-flight reference exam. */
  flightDay: number;
  attempt?: number;
  /** Total retinal thickness in the 0–250 µm ring. */
  trtRingUm: number;
  mrwUm?: number;
  bmRoughnessUm?: number;
  meanQualityDb?: number;
  bmoAreaMm2?: number;
}

/** A measured exam, as the engine would summarize it. */
export function makeExamSummary(options: SampleExamOptions): ExamSummary {
  const { crewId, eye, flightDay } = options;
  const attempt = options.attempt ?? 1;
  const mrwUm = options.mrwUm ?? Math.round(options.trtRingUm * 0.9);
  const meanQualityDb = options.meanQualityDb ?? 30;
  const areaMm2 = options.bmoAreaMm2 ?? 2;
  const semiMajorMm = Math.sqrt(areaMm2 / Math.PI) * 1.05;
  const semiMinorMm = areaMm2 / (Math.PI * semiMajorMm);
  return {
    examId: sampleExamId(crewId, eye, flightDay, attempt),
    referenceId: sampleExamId(crewId, eye, 0),
    patientId: `SIM-${crewId}`,
    visitId: `SIM-${crewId}-FD${String(flightDay).padStart(3, '0')}`,
    eye,
    examTimeMs: sampleExamTimeMs(flightDay),
    status: 'measured',
    rejections: [],
    quality: {
      usableScans: SCANS_PER_EXAM,
      totalScans: SCANS_PER_EXAM,
      meanQualityDb,
      minQualityDb: meanQualityDb - 4,
      decentrationUm: 60,
      features: {},
    },
    bmo: {
      centerXMm: 4.38,
      centerYMm: 4.38,
      semiMajorMm: Math.round(semiMajorMm * 1000) / 1000,
      semiMinorMm: Math.round(semiMinorMm * 1000) / 1000,
      angleDeg: 90,
      areaMm2,
      fitRmsUm: 12,
      pointsUsed: 96,
      pointsRejected: 0,
    },
    bmoSource: flightDay === 0 ? 'this-exam' : 'reference-shape',
    rings: RINGS.map(({ innerUm, outerUm, factor }) => ({
      innerUm,
      outerUm,
      thickness: measured(round1(options.trtRingUm * factor)),
      radiiUsed: 96,
    })),
    trtRingUm: measured(round1(options.trtRingUm)),
    mrwUm: measured(round1(mrwUm)),
    mrwSectors: SECTORS.map(({ sector, factor }) => ({ sector, value: measured(round1(mrwUm * factor)) })),
    bmRoughnessUm: measured(round1(options.bmRoughnessUm ?? 2)),
    engineVersion: 'sample-0',
  };
}

export interface SampleAttemptOptions {
  crewId: CrewId;
  eye: Eye;
  flightDay: number;
  attempt: number;
  status: CaptureAttemptRecord['status'];
  rejections?: ExamRejection[];
  scanRejections?: ScanRejection[];
  usableScans?: number;
  meanQualityDb?: number;
}

export function makeAttempt(options: SampleAttemptOptions): CaptureAttemptRecord {
  const measuredAttempt = options.status === 'measured';
  return {
    attempt: options.attempt,
    request: {
      crewId: options.crewId,
      eye: options.eye,
      flightDay: options.flightDay,
      attempt: options.attempt,
    },
    status: options.status,
    rejections: options.rejections ?? (measuredAttempt ? [] : ['too-few-usable-scans']),
    scanRejections: options.scanRejections ?? (measuredAttempt ? [] : ['low-signal', 'signal-dropout']),
    usableScans: options.usableScans ?? (measuredAttempt ? SCANS_PER_EXAM : 31),
    meanQualityDb: options.meanQualityDb ?? (measuredAttempt ? 30 : 14),
  };
}

/** An eye that was measured, optionally after some rejected attempts. */
export function makeMeasuredCapture(
  crewId: CrewId,
  exam: ExamSummary,
  flightDay: number,
  rejectedBefore = 0,
): EyeCaptureResult {
  const attempts: CaptureAttemptRecord[] = [];
  for (let attempt = 1; attempt <= rejectedBefore; attempt += 1) {
    attempts.push(makeAttempt({ crewId, eye: exam.eye, flightDay, attempt, status: 'cannot-measure' }));
  }
  attempts.push(
    makeAttempt({
      crewId,
      eye: exam.eye,
      flightDay,
      attempt: rejectedBefore + 1,
      status: 'measured',
      usableScans: exam.quality.usableScans,
      meanQualityDb: exam.quality.meanQualityDb,
    }),
  );
  return { eye: exam.eye, attempts, accepted: exam };
}

/** An eye that could not be measured after three attempts. */
export function makeUnmeasuredCapture(crewId: CrewId, eye: Eye, flightDay: number): EyeCaptureResult {
  return {
    eye,
    attempts: [
      makeAttempt({ crewId, eye, flightDay, attempt: 1, status: 'cannot-measure' }),
      makeAttempt({
        crewId,
        eye,
        flightDay,
        attempt: 2,
        status: 'cannot-measure',
        rejections: ['decentered'],
        scanRejections: ['bmo-not-found'],
        usableScans: 44,
        meanQualityDb: 24,
      }),
      makeAttempt({
        crewId,
        eye,
        flightDay,
        attempt: 3,
        status: 'cannot-measure',
        rejections: ['too-few-usable-scans', 'insufficient-ring-coverage'],
        scanRejections: ['motion', 'truncated'],
        usableScans: 35,
        meanQualityDb: 19,
      }),
    ],
    accepted: null,
  };
}
