/** Builders of exams, captures and sessions for the tests of the rules. All values are invented. */
import {
  assessSession,
  type AcuityResult,
  type AmslerResult,
  type AssessmentInput,
  type CrewId,
  type ErrorModel,
  type ExamRejection,
  type ExamSummary,
  type Eye,
  type EyeCaptureResult,
  type ScanRejection,
  type SessionRecord,
  type SymptomAnswer,
  type SymptomAnswers,
  type SymptomId,
  type VisionSession,
} from '../../src/index';

export interface ExamValues {
  trt: number;
  roughness?: number;
  mrw?: number;
  qualityDb?: number;
}

/** Pre-flight values used by the fixtures: ring thickness and roughness of each eye. */
export const BASE = { OD: { trt: 396, roughness: 2.5 }, OS: { trt: 391, roughness: 2.5 } } as const;

export function exam(eye: Eye, values: ExamValues, flightDay = 30): ExamSummary {
  const quantity = (value: number) => ({ value, unit: 'µm', origin: 'measured' }) as const;
  const trt = quantity(values.trt);
  return {
    examId: `${eye}-${flightDay}`,
    referenceId: `${eye}-0`,
    patientId: 'SIM-TEST',
    visitId: flightDay > 0 ? `FD${String(flightDay).padStart(3, '0')}` : 'PRE',
    eye,
    examTimeMs: 0,
    status: 'measured',
    rejections: [],
    quality: {
      usableScans: 48,
      totalScans: 48,
      meanQualityDb: values.qualityDb ?? 30,
      minQualityDb: (values.qualityDb ?? 30) - 2,
      decentrationUm: 80,
      features: {},
    },
    bmo: {
      centerXMm: 4.4,
      centerYMm: 4.4,
      semiMajorMm: 0.85,
      semiMinorMm: 0.75,
      angleDeg: 90,
      areaMm2: 2,
      fitRmsUm: 8,
      pointsUsed: 96,
      pointsRejected: 0,
    },
    bmoSource: flightDay > 0 ? 'reference-shape' : 'this-exam',
    rings: [
      { innerUm: 0, outerUm: 250, thickness: trt, radiiUsed: 96 },
      { innerUm: 250, outerUm: 500, thickness: quantity(350), radiiUsed: 96 },
      { innerUm: 500, outerUm: 1000, thickness: quantity(325), radiiUsed: 96 },
      { innerUm: 1000, outerUm: 1500, thickness: quantity(307), radiiUsed: 96 },
    ],
    trtRingUm: trt,
    mrwUm: quantity(values.mrw ?? 370),
    mrwSectors: [],
    bmRoughnessUm: quantity(values.roughness ?? 2.5),
    engineVersion: 'test',
  };
}

export function measured(eye: Eye, values: ExamValues, flightDay = 30): EyeCaptureResult {
  const accepted = exam(eye, values, flightDay);
  return {
    eye,
    attempts: [
      {
        attempt: 1,
        request: { crewId: 'B', eye, flightDay, attempt: 1 },
        status: 'measured',
        rejections: [],
        scanRejections: [],
        usableScans: 48,
        meanQualityDb: accepted.quality.meanQualityDb,
      },
    ],
    accepted,
  };
}

/** Three rejected attempts: the eye could not be measured. */
export function notMeasured(
  eye: Eye,
  rejections: ExamRejection[] = ['too-few-usable-scans'],
  scanRejections: ScanRejection[] = ['low-signal'],
  flightDay = 30,
): EyeCaptureResult {
  return {
    eye,
    attempts: [1, 2, 3].map((attempt) => ({
      attempt,
      request: { crewId: 'B', eye, flightDay, attempt },
      status: 'cannot-measure',
      rejections,
      scanRejections,
      usableScans: 12,
      meanQualityDb: 12,
    })),
    accepted: null,
  };
}

/** Both eyes measured, each with the given change of the ring (and of the roughness) against `BASE`. */
export function eyesWithChange(
  change: { OD: number; OS: number },
  roughnessChange: { OD?: number; OS?: number } = {},
  flightDay = 30,
): AssessmentInput['eyes'] {
  return {
    OD: measured('OD', { trt: BASE.OD.trt + change.OD, roughness: BASE.OD.roughness + (roughnessChange.OD ?? 0) }, flightDay),
    OS: measured('OS', { trt: BASE.OS.trt + change.OS, roughness: BASE.OS.roughness + (roughnessChange.OS ?? 0) }, flightDay),
  };
}

const SYMPTOM_IDS: readonly SymptomId[] = [
  'near-vision',
  'intermediate-vision',
  'distance-vision',
  'distortion',
  'low-light-vision',
  'fluctuating-vision',
  'depth-perception',
  'double-vision',
  'transient-vision-loss',
  'sudden-vision-loss',
  'new-dark-spot',
  'headache',
  'tinnitus',
  'nausea',
  'difficulty-thinking',
];

export function symptoms(present: Partial<Record<SymptomId, Omit<SymptomAnswer, 'present'>>> = {}): SymptomAnswers {
  const answers = Object.fromEntries(
    SYMPTOM_IDS.map((id) => [id, present[id] ? { present: true, ...present[id] } : { present: false }]),
  ) as SymptomAnswers['answers'];
  return { changeNoticed: Object.keys(present).length > 0, answers, glasses: 'reading' };
}

export function acuity(eye: Eye, logMar: number | null, extra: Partial<AcuityResult> = {}): AcuityResult {
  return { eye, logMar, atScreenFloor: false, trials: 18, correct: 12, withCorrection: true, ...extra };
}

export function amsler(eye: Eye, extra: Partial<AmslerResult> = {}): AmslerResult {
  return { eye, gridSize: 20, cellDeg: 1, marks: [], markedFraction: 0, centralMarked: false, cornersSeen: true, ...extra };
}

/** A complete functional session with nothing to report: acuity 0.00 / 0.02, clean grid, no symptoms. */
export function vision(overrides: Partial<VisionSession> = {}): VisionSession {
  return {
    calibration: { pxPerMm: 10.4, viewingDistanceCm: 40, floorLogMar: -0.38 },
    acuity: { OD: acuity('OD', 0), OS: acuity('OS', 0.02) },
    amsler: { OD: amsler('OD'), OS: amsler('OS') },
    symptoms: symptoms(),
    ...overrides,
  };
}

/** Turns an input into the record the application would store. */
export function record(input: AssessmentInput, errorModel?: ErrorModel): SessionRecord {
  return {
    crewId: input.crewId,
    flightDay: input.flightDay,
    origin: 'live',
    eyes: input.eyes,
    vision: input.vision,
    assessment: assessSession(input, errorModel),
    questions: [],
  };
}

/** The pre-flight session: both eyes at `BASE`, complete vision tests without findings. */
export function preflight(crewId: CrewId = 'B'): SessionRecord {
  return record({
    crewId,
    flightDay: 0,
    eyes: {
      OD: measured('OD', { trt: BASE.OD.trt, roughness: BASE.OD.roughness }, 0),
      OS: measured('OS', { trt: BASE.OS.trt, roughness: BASE.OS.roughness }, 0),
    },
    vision: vision(),
    history: [],
  });
}

/** An in-flight session with the given ring changes, assessed against `history`. */
export function inFlight(
  flightDay: number,
  change: { OD: number; OS: number },
  history: readonly SessionRecord[],
  crewId: CrewId = 'B',
): SessionRecord {
  return record({ crewId, flightDay, eyes: eyesWithChange(change, {}, flightDay), vision: vision(), history });
}
