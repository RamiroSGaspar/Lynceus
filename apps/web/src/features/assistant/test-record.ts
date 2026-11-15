/** A simulated session record for the assistant tests. Fictional values. */
import type { EyeAssessment, EyeCaptureResult, ExamSummary, Quantity, SessionRecord } from '@app/core';

const um = (value: number, interval95?: [number, number]): Quantity => ({ value, unit: 'µm', origin: 'derived', interval95 });

function exam(eye: 'OD' | 'OS'): ExamSummary {
  return {
    examId: `SIM-EXAM-${eye}-090`,
    referenceId: `SIM-EXAM-${eye}-000`,
    patientId: 'SIM-C-0042',
    visitId: 'SIM-VISIT-090',
    eye,
    examTimeMs: 1_800_000_000_000,
    status: 'measured',
    rejections: [],
    quality: { usableScans: 47, totalScans: 48, meanQualityDb: 31.46, minQualityDb: 26, decentrationUm: 40, features: {} },
    bmo: null,
    bmoSource: 'this-exam',
    rings: [],
    trtRingUm: { value: 431.2, unit: 'µm', origin: 'measured' },
    mrwUm: null,
    mrwSectors: [],
    bmRoughnessUm: null,
    engineVersion: 'test',
  };
}

function capture(eye: 'OD' | 'OS', measured: boolean): EyeCaptureResult {
  const request = { crewId: 'C' as const, eye, flightDay: 90, attempt: 1 };
  return {
    eye,
    attempts: [
      { attempt: 1, request, status: measured ? 'measured' : 'cannot-measure', rejections: [], scanRejections: [], usableScans: measured ? 47 : 12, meanQualityDb: measured ? 31.46 : 11.2 },
    ],
    accepted: measured ? exam(eye) : null,
  };
}

const measuredEye: EyeAssessment = {
  eye: 'OD',
  measured: true,
  level: 'first-sign',
  alert: 'advisory',
  change: {
    eye: 'OD',
    baselineExamId: 'SIM-EXAM-OD-000',
    examId: 'SIM-EXAM-OD-090',
    trtRingUm: um(24.137, [17.94, 30.31]),
    rings: [um(24.137, [17.94, 30.31]), um(9.8, [3.1, 16.5]), um(2.04), { value: 1, unit: 'mm', origin: 'derived' }],
    mrwUm: um(18.2),
    bmRoughnessUm: um(0.4, [-1, 1.8]),
    bmoAreaChangePct: 1.2,
  },
  thresholds: [
    { thresholdId: 'trt-first-sign', threshold: { value: 19.4, unit: 'µm', origin: 'reference' }, exceeded: true, probabilityExceeded: 0.8612, word: 'likely' },
  ],
  borderline: true,
  sincePrevious: null,
  findings: ['swelling-first-sign'],
};

const unmeasuredEye: EyeAssessment = {
  eye: 'OS',
  measured: false,
  level: null,
  alert: 'none',
  change: null,
  thresholds: [],
  borderline: false,
  sincePrevious: null,
  findings: ['eye-not-measured'],
};

export const TEST_RECORD: SessionRecord = {
  crewId: 'C',
  flightDay: 90,
  origin: 'live',
  eyes: { OD: capture('OD', true), OS: capture('OS', false) },
  vision: {
    calibration: null,
    acuity: { OD: null, OS: null },
    amsler: { OD: null, OS: null },
    symptoms: null,
  },
  assessment: {
    crewId: 'C',
    flightDay: 90,
    eyes: { OD: measuredEye, OS: unmeasuredEye },
    level: 'first-sign',
    alert: 'advisory',
    findings: ['swelling-first-sign', 'eye-not-measured', 'symptom-headache', 'swelling-first-sign'],
    contact: 'routine-report',
    nextOct: { flightDay: 118, reason: 'first-sign' },
    amslerPerWeek: 2,
    nextSteps: [
      { id: 'oct-in-4-weeks', params: { flightDay: 118 }, basis: 'assumption', sources: [] },
      { id: 'report-routine', params: {}, basis: 'nasa', sources: [] },
    ],
    limitations: ['not-a-diagnosis'],
    rulesVersion: 'test',
  },
  questions: ['My private note to the surgeon: Ada Lovelace, cabin 3'],
};
