/**
 * PROVISIONAL stand-in for the parts of `@app/core` that are being written in
 * parallel (specification 04): mission, crew, thresholds, assessment and history.
 *
 * It exists only so the screens can be built and tried before the real functions
 * land. It follows the signatures of specification 04 but it is NOT the product's
 * rule set: it is a simplified copy, without tests of its own, and it is deleted
 * when `app/core.ts` starts importing from `@app/core`. No screen imports this
 * file directly.
 *
 * SIMULATED DATA: the crew, their exams and their histories are fictional.
 */
import {
  alertForLevel,
  maxLevel,
  type ChangeFromBaseline,
  type ContactUrgency,
  type CrewId,
  type CrewMember,
  type ExamQuality,
  type ExamSummary,
  type Eye,
  type EyeAssessment,
  type EyeCaptureResult,
  type FindingId,
  type Level,
  type LikelihoodWord,
  type LimitationId,
  type Mission,
  type NextStep,
  type Quantity,
  type SessionAssessment,
  type SessionRecord,
  type ThresholdAssessment,
  type VisionSession,
} from '@app/core';
import { makeExamSummary, makeMeasuredCapture } from '../sample/exams';
import { makeVisionSession } from '../sample/vision';

// ------------------------------------------------------------ Mission and crew

/** Specification 01, section 4: fictional 180-day mission, NASA routine controls on flight days 30, 90 and 150. */
export const MISSION: Mission = {
  name: 'SIM-180',
  durationDays: 180,
  launchDateIso: '2026-05-20',
  routineControlDays: [30, 90, 150],
};

/** Specification 01, section 4. Invented names. */
export const CREW: readonly CrewMember[] = [
  { id: 'A', name: 'Kofi Mensah', role: { en: 'Flight engineer', es: 'Ingeniero de vuelo' }, ageYears: 43, sex: 'M', patientId: 'SIM-A' },
  { id: 'B', name: 'Elena Voss', role: { en: 'Commander', es: 'Comandante' }, ageYears: 47, sex: 'F', patientId: 'SIM-B' },
  { id: 'C', name: 'Ravi Anand', role: { en: 'Flight engineer', es: 'Ingeniero de vuelo' }, ageYears: 51, sex: 'M', patientId: 'SIM-C' },
  { id: 'D', name: 'Lucía Ferreyra', role: { en: 'Mission specialist', es: 'Especialista de misión' }, ageYears: 39, sex: 'F', patientId: 'SIM-D' },
];

// ------------------------------------------------------------------ Thresholds

/**
 * An increase of the 0–250 µm ring ABOVE this value is NASA's first sign of optic
 * disc swelling: two standard deviations of the normal variation between sessions.
 * Source: research doc `sans-evolucion-y-logica-clinica.md`, tables A7 and B1.
 */
export const TRT_FIRST_SIGN_UM = 19.4;
/** An increase EQUAL OR ABOVE this value is clinically concerning. Same document, table B1. */
export const TRT_CLINICALLY_CONCERNING_UM = 55;
/** A roughness increase ABOVE this value indicates new folds. Specification 04, section 2 (Ferguson 2023). */
export const BM_ROUGHNESS_FOLDS_UM = 2.8;

// ------------------------------------------------------------------ Assessment

export interface ErrorModel {
  version: string;
  trtChangeSeUm(current: ExamQuality, baseline: ExamQuality): number;
  roughnessChangeSeUm(current: ExamQuality, baseline: ExamQuality): number;
}

export interface AssessmentInput {
  crewId: CrewId;
  flightDay: number;
  eyes: { OD: EyeCaptureResult; OS: EyeCaptureResult };
  vision: VisionSession | null;
  /** Earlier sessions of this crew member, oldest first. The first one is the pre-flight session (flight day 0). */
  history: readonly SessionRecord[];
}

/** Specification 04, section 3: 3 µm per exam at 27 dB or more, rising to 6 µm at 15 dB. */
function examSeUm(quality: ExamQuality): number {
  const t = Math.min(1, Math.max(0, (27 - quality.meanQualityDb) / 12));
  return 3 + 3 * t;
}

const PROVISIONAL_ERROR_MODEL: ErrorModel = {
  version: 'provisional-ui',
  trtChangeSeUm: (current, baseline) => Math.hypot(examSeUm(current), examSeUm(baseline)),
  roughnessChangeSeUm: () => Math.hypot(0.8, 0.8),
};

/** Standard normal cumulative distribution (Abramowitz and Stegun 26.2.17). */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const tail = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - tail : tail;
}

function likelihoodWord(probability: number): LikelihoodWord {
  if (probability < 0.1) return 'unlikely';
  if (probability < 0.5) return 'possible';
  if (probability < 0.9) return 'likely';
  return 'very-likely';
}

function derived(value: number, standardError: number): Quantity {
  const rounded = Math.round(value * 10) / 10;
  return {
    value: rounded,
    unit: 'µm',
    origin: 'derived',
    standardError,
    interval95: [rounded - 1.96 * standardError, rounded + 1.96 * standardError],
  };
}

function threshold(
  thresholdId: ThresholdAssessment['thresholdId'],
  limit: number,
  change: Quantity,
  inclusive: boolean,
): ThresholdAssessment {
  const probabilityExceeded = normalCdf((change.value - limit) / (change.standardError ?? 1));
  return {
    thresholdId,
    threshold: { value: limit, unit: 'µm', origin: 'reference' },
    exceeded: inclusive ? change.value >= limit : change.value > limit,
    probabilityExceeded,
    word: likelihoodWord(probabilityExceeded),
  };
}

function measuredExam(capture: EyeCaptureResult | undefined): ExamSummary | null {
  const exam = capture?.accepted ?? null;
  return exam && exam.trtRingUm && exam.mrwUm && exam.bmRoughnessUm ? exam : null;
}

function assessEye(eye: Eye, input: AssessmentInput, errorModel: ErrorModel): EyeAssessment {
  const exam = measuredExam(input.eyes[eye]);
  if (!exam) {
    return {
      eye,
      measured: false,
      level: null,
      alert: 'none',
      change: null,
      thresholds: [],
      borderline: false,
      sincePrevious: null,
      findings: ['eye-not-measured'],
    };
  }
  const baseline = measuredExam(input.history[0]?.eyes[eye]) ?? exam;
  const trtSe = errorModel.trtChangeSeUm(exam.quality, baseline.quality);
  const roughSe = errorModel.roughnessChangeSeUm(exam.quality, baseline.quality);
  const value = (quantity: Quantity | null): number => quantity?.value ?? 0;
  const change: ChangeFromBaseline = {
    eye,
    baselineExamId: baseline.examId,
    examId: exam.examId,
    trtRingUm: derived(value(exam.trtRingUm) - value(baseline.trtRingUm), trtSe),
    rings: exam.rings.map((ring, index) =>
      derived(ring.thickness.value - (baseline.rings[index]?.thickness.value ?? ring.thickness.value), trtSe),
    ),
    mrwUm: derived(value(exam.mrwUm) - value(baseline.mrwUm), trtSe * 2),
    bmRoughnessUm: derived(value(exam.bmRoughnessUm) - value(baseline.bmRoughnessUm), roughSe),
    bmoAreaChangePct: 0,
  };
  const thresholds = [
    threshold('trt-first-sign', TRT_FIRST_SIGN_UM, change.trtRingUm, false),
    threshold('trt-clinically-concerning', TRT_CLINICALLY_CONCERNING_UM, change.trtRingUm, true),
    threshold('folds-new', BM_ROUGHNESS_FOLDS_UM, change.bmRoughnessUm, false),
  ];
  const [firstSign, concerning, folds] = thresholds as [ThresholdAssessment, ThresholdAssessment, ThresholdAssessment];
  const level: Level = concerning.exceeded
    ? 'clinically-concerning'
    : firstSign.exceeded || folds.exceeded
      ? 'first-sign'
      : 'no-detectable-change';
  const findings: FindingId[] = [];
  if (concerning.exceeded) findings.push('swelling-clinically-concerning');
  else if (firstSign.exceeded) findings.push('swelling-first-sign');
  if (folds.exceeded) findings.push('folds-new');

  let sincePrevious: EyeAssessment['sincePrevious'] = null;
  for (let index = input.history.length - 1; index >= 1; index -= 1) {
    const record = input.history[index];
    const previous = measuredExam(record?.eyes[eye]);
    if (record && previous) {
      sincePrevious = {
        flightDay: record.flightDay,
        trtRingUm: derived(
          value(exam.trtRingUm) - value(previous.trtRingUm),
          errorModel.trtChangeSeUm(exam.quality, previous.quality),
        ),
      };
      break;
    }
  }
  return {
    eye,
    measured: true,
    level,
    alert: alertForLevel(level),
    change,
    thresholds,
    borderline: thresholds.some(({ probabilityExceeded }) => probabilityExceeded >= 0.1 && probabilityExceeded <= 0.9),
    sincePrevious,
    findings,
  };
}

const ALL_LIMITATIONS: LimitationId[] = [
  'not-a-diagnosis',
  'simulated-data',
  'not-validated-on-people',
  'ground-confirms',
  'no-intracranial-pressure',
  'no-choroid',
  'no-macula',
  'no-globe-flattening',
  'no-refraction',
];

function visionFindings(input: AssessmentInput): FindingId[] {
  const findings: FindingId[] = [];
  const vision = input.vision;
  if (!vision) return findings;
  const answers = vision.symptoms?.answers;
  if (answers?.['sudden-vision-loss'].present || answers?.['new-dark-spot'].present) findings.push('symptom-acute');
  for (const eye of ['OD', 'OS'] as const) {
    const amsler = vision.amsler[eye];
    if (!amsler || amsler.marks.length === 0) continue;
    const finding = amsler.centralMarked || amsler.markedFraction >= 0.05 ? 'amsler-marked-central' : 'amsler-marked';
    if (!findings.includes(finding)) findings.push(finding);
  }
  const baselineVision = input.history[0]?.vision;
  for (const eye of ['OD', 'OS'] as const) {
    const today = vision.acuity[eye];
    const before = baselineVision?.acuity[eye];
    if (
      today?.logMar != null &&
      before?.logMar != null &&
      !today.atScreenFloor &&
      today.logMar - before.logMar >= 0.2 &&
      !findings.includes('near-vision-worse')
    ) {
      findings.push('near-vision-worse');
    }
  }
  if (answers?.['near-vision'].present) findings.push('symptom-near-blur');
  if (answers?.headache.present) findings.push('symptom-headache');
  if (answers?.distortion.present || answers?.['double-vision'].present || answers?.['transient-vision-loss'].present) {
    findings.push('symptom-other');
  }
  return findings;
}

export function assessSession(
  input: AssessmentInput,
  errorModel: ErrorModel = PROVISIONAL_ERROR_MODEL,
): SessionAssessment {
  const eyes = { OD: assessEye('OD', input, errorModel), OS: assessEye('OS', input, errorModel) };
  const functional = visionFindings(input);
  const acute = functional.includes('symptom-acute') || functional.includes('amsler-marked-central');
  const imagingLevel = maxLevel([eyes.OD.level, eyes.OS.level]);
  const level: Level = acute ? 'acute-visual-symptom' : imagingLevel;
  const withoutDelay =
    imagingLevel === 'clinically-concerning' ||
    functional.includes('amsler-marked') ||
    functional.includes('symptom-other');
  const contact: ContactUrgency = acute ? 'now' : withoutDelay ? 'without-delay' : 'routine-report';
  const anyUnmeasured = !eyes.OD.measured || !eyes.OS.measured;

  const nextSteps: NextStep[] = [];
  const step = (id: NextStep['id'], basis: NextStep['basis'], params: NextStep['params'] = {}): void => {
    nextSteps.push({ id, params, basis, sources: [] });
  };
  if (contact === 'now') step('contact-surgeon-now', 'assumption');
  if (contact === 'without-delay') step('notify-surgeon-without-delay', 'assumption');

  const nextRoutine = MISSION.routineControlDays.find((day) => day > input.flightDay) ?? null;
  let nextOct: SessionAssessment['nextOct'] = null;
  let amslerPerWeek = 0;
  const schedule = (flightDay: number, reason: NonNullable<SessionAssessment['nextOct']>['reason']): void => {
    const routine = MISSION.routineControlDays.find((day) => day >= flightDay && day - flightDay <= 7);
    const chosen = routine ?? flightDay;
    nextOct = chosen <= MISSION.durationDays ? { flightDay: chosen, reason } : null;
  };
  if (anyUnmeasured) {
    schedule(input.flightDay + 7, 'not-measured');
    step('oct-repeat-soon', 'assumption', { flightDay: input.flightDay + 7 });
  } else if (imagingLevel === 'clinically-concerning') {
    schedule(input.flightDay + 21, 'clinically-concerning');
    step('oct-in-3-weeks', 'assumption', { flightDay: input.flightDay + 21 });
  } else if (imagingLevel === 'first-sign') {
    schedule(input.flightDay + 28, 'first-sign');
    step('oct-in-4-weeks', 'assumption', { flightDay: input.flightDay + 28 });
  } else if (nextRoutine !== null) {
    nextOct = { flightDay: nextRoutine, reason: 'routine' };
    step('oct-routine', 'nasa', { flightDay: nextRoutine });
  }
  if (imagingLevel === 'clinically-concerning') {
    amslerPerWeek = 3;
    step('amsler-three-times-a-week', 'assumption');
  } else if (imagingLevel === 'first-sign') {
    amslerPerWeek = 2;
    step('amsler-twice-a-week', 'assumption');
  } else {
    step('amsler-at-controls', 'nasa');
  }
  if (functional.includes('near-vision-worse') || functional.includes('symptom-near-blur')) {
    step('try-stronger-glasses', 'nasa');
  }
  if (contact === 'routine-report') step('report-routine', 'nasa');
  if (nextOct === null) step('post-flight-exams', 'nasa');

  return {
    crewId: input.crewId,
    flightDay: input.flightDay,
    eyes,
    level,
    alert: alertForLevel(level),
    findings: [...eyes.OD.findings, ...eyes.OS.findings.filter((id) => !eyes.OD.findings.includes(id)), ...functional],
    contact,
    nextOct,
    amslerPerWeek,
    nextSteps,
    limitations: ALL_LIMITATIONS,
    rulesVersion: 'provisional-ui-0',
  };
}

// --------------------------------------------------------------------- History

interface EyePair {
  OD: number;
  OS: number;
}

/** Specification 01, section 4: reference anatomy. Acuity: specification 04, section 6. */
const ANATOMY: Record<CrewId, { trt: EyePair; mrw: EyePair; area: EyePair; acuity: EyePair }> = {
  A: { trt: { OD: 371, OS: 366 }, mrw: { OD: 295, OS: 290 }, area: { OD: 2.31, OS: 2.24 }, acuity: { OD: 0, OS: 0.02 } },
  B: { trt: { OD: 396, OS: 391 }, mrw: { OD: 372, OS: 364 }, area: { OD: 1.98, OS: 2.05 }, acuity: { OD: 0.06, OS: 0.04 } },
  C: { trt: { OD: 418, OS: 409 }, mrw: { OD: 398, OS: 386 }, area: { OD: 1.86, OS: 1.91 }, acuity: { OD: 0.1, OS: 0.12 } },
  D: { trt: { OD: 404, OS: 408 }, mrw: { OD: 381, OS: 377 }, area: { OD: 1.72, OS: 1.77 }, acuity: { OD: -0.04, OS: -0.02 } },
};

/** Specification 01, section 4: swelling E(d) in micrometres on the routine days. */
const SWELLING: Record<CrewId, Record<number, EyePair>> = {
  A: { 30: { OD: 6, OS: 4 }, 90: { OD: 8, OS: 5 }, 150: { OD: 9, OS: 6 } },
  B: { 30: { OD: 15, OS: 10 }, 90: { OD: 24, OS: 17 }, 150: { OD: 31, OS: 23 } },
  C: { 30: { OD: 27, OS: 15 }, 90: { OD: 48, OS: 27 }, 150: { OD: 66, OS: 38 } },
  D: { 30: { OD: 118, OS: 110 }, 90: { OD: 203, OS: 214 }, 150: { OD: 168, OS: 200 } },
};

/** Specification 01, section 4: increase of the roughness of Bruch's membrane on the routine days. */
const ROUGHNESS: Record<CrewId, Record<number, EyePair>> = {
  A: { 30: { OD: 0, OS: 0 }, 90: { OD: 0, OS: 0 }, 150: { OD: 0, OS: 0 } },
  B: { 30: { OD: 0, OS: 0 }, 90: { OD: 0, OS: 0 }, 150: { OD: 0, OS: 0 } },
  C: { 30: { OD: 0, OS: 0 }, 90: { OD: 3.8, OS: 3.1 }, 150: { OD: 7, OS: 4.6 } },
  D: { 30: { OD: 4, OS: 3.6 }, 90: { OD: 10.5, OS: 11.6 }, 150: { OD: 12.4, OS: 13.4 } },
};

const BASELINE_ROUGHNESS_UM = 2;

function sampleEye(crewId: CrewId, eye: Eye, flightDay: number): EyeCaptureResult {
  const anatomy = ANATOMY[crewId];
  const swelling = SWELLING[crewId][flightDay]?.[eye] ?? 0;
  const roughness = ROUGHNESS[crewId][flightDay]?.[eye] ?? 0;
  const exam = makeExamSummary({
    crewId,
    eye,
    flightDay,
    trtRingUm: anatomy.trt[eye] + swelling,
    mrwUm: anatomy.mrw[eye] + swelling * 0.8,
    bmRoughnessUm: BASELINE_ROUGHNESS_UM + roughness,
    bmoAreaMm2: anatomy.area[eye],
    meanQualityDb: 29 + ((flightDay / 30 + (eye === 'OD' ? 0 : 1)) % 4),
  });
  return makeMeasuredCapture(crewId, exam, flightDay);
}

function buildFullHistory(crewId: CrewId): SessionRecord[] {
  const records: SessionRecord[] = [];
  for (const flightDay of [0, ...MISSION.routineControlDays]) {
    const eyes = { OD: sampleEye(crewId, 'OD', flightDay), OS: sampleEye(crewId, 'OS', flightDay) };
    const nearBlur = (crewId === 'B' || crewId === 'C') && flightDay >= 90;
    const vision = makeVisionSession({
      acuity: ANATOMY[crewId].acuity,
      symptoms: nearBlur ? { 'near-vision': { present: true, severity: 'mild', eye: 'both' } } : {},
    });
    const assessment = assessSession({ crewId, flightDay, eyes, vision, history: records });
    records.push({ crewId, flightDay, origin: 'precomputed', eyes, vision, assessment, questions: [] });
  }
  return records;
}

const historyCache = new Map<string, SessionRecord[]>();

/** Sessions of a crew member before a flight day, oldest first, including the pre-flight session (flight day 0). */
export function getHistory(crewId: CrewId, beforeFlightDay: number): SessionRecord[] {
  const key = `${crewId}:${beforeFlightDay}`;
  let history = historyCache.get(key);
  if (!history) {
    let full = historyCache.get(crewId);
    if (!full) {
      full = buildFullHistory(crewId);
      historyCache.set(crewId, full);
    }
    history = full.filter((record) => record.flightDay < beforeFlightDay);
    historyCache.set(key, history);
  }
  return history;
}
