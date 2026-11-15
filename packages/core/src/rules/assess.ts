/**
 * The rules of the product (specification 04, section 4): which level each
 * result gets, how sure it is and what to do next. Pure: the same input gives
 * the same output.
 *
 * Levels and thresholds are NASA's. The follow-up intervals, the contact urgency
 * of each level and everything about the vision tests are assumptions of this
 * project; each step says which it is.
 */
import type {
  ChangeFromBaseline,
  ContactUrgency,
  CrewId,
  Eye,
  EyeAssessment,
  EyeCaptureResult,
  ExamSummary,
  FindingId,
  Level,
  LimitationId,
  NextStep,
  NextStepId,
  NotMeasuredReason,
  Quantity,
  SessionAssessment,
  SessionRecord,
  ThresholdAssessment,
  VisionSession,
} from '../contract';
import { MISSION } from '../mission';
import { PROVISIONAL_ERROR_MODEL, type ErrorModel } from './errorModel';
import { assessFunctional } from './functional';
import { alertForLevel, levelRank, maxLevel } from './levels';
import { cleanDifference, likelihoodWord, probabilityBeyond } from './probability';
import type { RuleSourceId } from './sources';
import { IMAGING_THRESHOLDS, thresholdQuantity } from './thresholds';

/** Changes whenever the rules change. */
export const RULES_VERSION = 'rules-1.0.0';

export interface AssessmentInput {
  crewId: CrewId;
  flightDay: number;
  eyes: { OD: EyeCaptureResult; OS: EyeCaptureResult };
  vision: VisionSession | null;
  /** Earlier sessions of this crew member, oldest first. The first one is the pre-flight session (flight day 0). */
  history: readonly SessionRecord[];
}

// ------------------------------------------------------------- Follow-up
// NASA publishes the routine calendar and that a first sign "requires increased
// monitoring", but not how often. The intervals below are ASSUMPTIONS OF THIS
// PROJECT, based on the one published case (Brunstetter 2024: tomography every 3
// to 6 weeks and Amsler grid several times a week).
// Research: sans-evolucion-y-logica-clinica.md, B2.

/** Days to the next tomography after a first sign. */
export const FIRST_SIGN_OCT_INTERVAL_DAYS = 28;
/** Days to the next tomography at the clinically concerning level. */
export const CLINICALLY_CONCERNING_OCT_INTERVAL_DAYS = 21;
/** Longest wait to repeat the tomography when an eye could not be measured. */
export const NOT_MEASURED_OCT_MAX_DAYS = 7;
/** A routine day up to this many days after the computed date replaces it. */
export const ROUTINE_MERGE_WINDOW_DAYS = 7;
/** Amsler grid sessions per week after a first sign. */
export const FIRST_SIGN_AMSLER_PER_WEEK = 2;
/** Amsler grid sessions per week at the clinically concerning level. */
export const CLINICALLY_CONCERNING_AMSLER_PER_WEEK = 3;

/** Width of a 95 % interval in standard errors. */
const Z_95 = 1.96;

/** Always stated, in this order (specification 04, section 4.3). */
export const LIMITATIONS: readonly LimitationId[] = [
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

/** Session findings, most urgent first. */
const FINDING_ORDER: readonly FindingId[] = [
  'symptom-acute',
  'amsler-marked-central',
  'swelling-clinically-concerning',
  'amsler-marked',
  'symptom-other',
  'swelling-first-sign',
  'folds-new',
  'eye-not-measured',
  'near-vision-worse',
  'symptom-near-blur',
  'symptom-headache',
];

type ImagingLevel = Exclude<Level, 'acute-visual-symptom'>;
const EYES: readonly Eye[] = ['OD', 'OS'];

// ------------------------------------------------------------------ Eyes

/** A measured exam with the three measures the rules compare. */
type MeasuredExam = ExamSummary & {
  trtRingUm: Quantity;
  mrwUm: Quantity;
  bmRoughnessUm: Quantity;
};

function measuredExam(capture: EyeCaptureResult | undefined): MeasuredExam | null {
  const exam = capture?.accepted;
  if (!exam || exam.status !== 'measured') return null;
  if (!exam.trtRingUm || !exam.mrwUm || !exam.bmRoughnessUm) return null;
  return exam as MeasuredExam;
}

/** Why no attempt gave a result, in the words of the engine. The last attempt goes first. */
function notMeasuredReasons(capture: EyeCaptureResult): NotMeasuredReason[] {
  if (capture.attempts.length === 0 && !capture.accepted) return ['not-captured'];
  const reasons: NotMeasuredReason[] = [];
  const add = (reason: NotMeasuredReason) => {
    if (!reasons.includes(reason)) reasons.push(reason);
  };
  for (const rejection of capture.accepted?.rejections ?? []) add(rejection);
  for (let i = capture.attempts.length - 1; i >= 0; i--) {
    const attempt = capture.attempts[i]!;
    const mainScanReason = attempt.scanRejections[0];
    for (const rejection of attempt.rejections) {
      // "Too few usable scans" is a consequence: what spoiled the scans says more.
      add(rejection === 'too-few-usable-scans' && mainScanReason ? mainScanReason : rejection);
    }
    if (attempt.rejections.length === 0 && attempt.status === 'cannot-measure' && mainScanReason) add(mainScanReason);
  }
  return reasons;
}

function notMeasuredEye(eye: Eye, reasons: NotMeasuredReason[]): EyeAssessment {
  return {
    eye,
    measured: false,
    level: null,
    alert: alertForLevel(null),
    change: null,
    thresholds: [],
    borderline: false,
    sincePrevious: null,
    findings: ['eye-not-measured'],
    notMeasuredReasons: reasons,
  };
}

/** A difference between two exams, with its error and 95 % interval when the model gives one. */
function changeQuantity(current: number, reference: number, standardError: number | null): Quantity {
  const value = cleanDifference(current, reference);
  if (standardError === null) return { value, unit: 'µm', origin: 'derived' };
  return {
    value,
    unit: 'µm',
    origin: 'derived',
    standardError,
    interval95: [value - Z_95 * standardError, value + Z_95 * standardError],
  };
}

function compareWithBaseline(
  eye: Eye,
  exam: MeasuredExam,
  baseline: MeasuredExam,
  errorModel: ErrorModel,
): ChangeFromBaseline {
  const trtSe = errorModel.trtChangeSeUm(exam.quality, baseline.quality);
  const roughnessSe = errorModel.roughnessChangeSeUm(exam.quality, baseline.quality);
  const rings: Quantity[] = [];
  for (const ring of exam.rings) {
    const reference = baseline.rings.find((r) => r.innerUm === ring.innerUm && r.outerUm === ring.outerUm);
    if (!reference) continue;
    // The error model covers the 0–250 µm ring only: the other rings carry no range.
    const isMainRing = ring.innerUm === 0 && ring.outerUm === 250;
    rings.push(changeQuantity(ring.thickness.value, reference.thickness.value, isMainRing ? trtSe : null));
  }
  const areaChangePct =
    exam.bmo && baseline.bmo && baseline.bmo.areaMm2 > 0
      ? cleanDifference((exam.bmo.areaMm2 / baseline.bmo.areaMm2) * 100, 100)
      : 0;
  return {
    eye,
    baselineExamId: baseline.examId,
    examId: exam.examId,
    trtRingUm: changeQuantity(exam.trtRingUm.value, baseline.trtRingUm.value, trtSe),
    rings,
    mrwUm: changeQuantity(exam.mrwUm.value, baseline.mrwUm.value, null),
    bmRoughnessUm: changeQuantity(exam.bmRoughnessUm.value, baseline.bmRoughnessUm.value, roughnessSe),
    bmoAreaChangePct: areaChangePct,
  };
}

/** `exceeded` is decided on the measured value, as NASA's criterion is written; the probability says how sure that is. */
function assessThreshold(id: ThresholdAssessment['thresholdId'], change: Quantity): ThresholdAssessment {
  const definition = IMAGING_THRESHOLDS[id];
  const exceeded = definition.comparison === '>=' ? change.value >= definition.value : change.value > definition.value;
  const probabilityExceeded = probabilityBeyond(change.value, definition.value, change.standardError ?? 0);
  return {
    thresholdId: id,
    threshold: thresholdQuantity(id),
    exceeded,
    probabilityExceeded,
    word: likelihoodWord(probabilityExceeded),
  };
}

interface PreviousExam {
  flightDay: number;
  exam: MeasuredExam;
}

function assessMeasuredEye(
  eye: Eye,
  exam: MeasuredExam,
  baseline: MeasuredExam,
  previous: PreviousExam | null,
  errorModel: ErrorModel,
): EyeAssessment {
  const change = compareWithBaseline(eye, exam, baseline, errorModel);
  const firstSign = assessThreshold('trt-first-sign', change.trtRingUm);
  const concerning = assessThreshold('trt-clinically-concerning', change.trtRingUm);
  const folds = assessThreshold('folds-new', change.bmRoughnessUm);
  const thresholds = [firstSign, concerning, folds];

  let level: ImagingLevel = 'no-detectable-change';
  const findings: FindingId[] = [];
  if (concerning.exceeded) {
    level = 'clinically-concerning';
    findings.push('swelling-clinically-concerning');
  } else if (firstSign.exceeded) {
    level = 'first-sign';
    findings.push('swelling-first-sign');
  }
  if (folds.exceeded) {
    if (level === 'no-detectable-change') level = 'first-sign';
    findings.push('folds-new');
  }

  return {
    eye,
    measured: true,
    level,
    alert: alertForLevel(level),
    change,
    thresholds,
    borderline: thresholds.some((t) => t.word === 'possible' || t.word === 'likely'),
    sincePrevious: previous
      ? {
          flightDay: previous.flightDay,
          trtRingUm: changeQuantity(
            exam.trtRingUm.value,
            previous.exam.trtRingUm.value,
            errorModel.trtChangeSeUm(exam.quality, previous.exam.quality),
          ),
        }
      : null,
    findings,
  };
}

/** The pre-flight exam is the reference itself: there is nothing to compare it with. */
function referenceEye(eye: Eye): EyeAssessment {
  return {
    eye,
    measured: true,
    level: 'no-detectable-change',
    alert: alertForLevel('no-detectable-change'),
    change: null,
    thresholds: [],
    borderline: false,
    sincePrevious: null,
    findings: [],
  };
}

// ------------------------------------------------------------- Follow-up

function imagingLevel(levels: readonly (Level | null)[]): ImagingLevel {
  const level = maxLevel(levels);
  return level === 'acute-visual-symptom' ? 'clinically-concerning' : level;
}

export interface FollowUp {
  nextOct: SessionAssessment['nextOct'];
  amslerPerWeek: number;
  /** Highest imaging level between this control and the previous one: the row of the follow-up table that applies. */
  regime: ImagingLevel;
  /** Flight day of the previous control when the regime comes from it and not from today. */
  sustainedFromFlightDay: number | null;
  /** The date the rule computes before looking at the routine calendar and the end of the mission. */
  targetFlightDay: number | null;
}

/**
 * When the next tomography is due and how often to do the Amsler grid
 * (specification 04, section 4.3).
 *
 * The routine calendar is never skipped: a routine day that comes before the
 * computed date, or up to `ROUTINE_MERGE_WINDOW_DAYS` after it, is taken instead.
 * An eye without a result brings the next tomography to within
 * `NOT_MEASURED_OCT_MAX_DAYS`. A date after the end of the mission gives `null`.
 */
export function planFollowUp(
  flightDay: number,
  todayLevels: readonly (Level | null)[],
  previous: { flightDay: number; levels: readonly (Level | null)[] } | null,
  anyEyeNotMeasured: boolean,
): FollowUp {
  const today = imagingLevel(todayLevels);
  const before = previous ? imagingLevel(previous.levels) : 'no-detectable-change';
  // Once a sign appears, the closer follow-up is kept for one more control.
  const regime = levelRank(before) > levelRank(today) ? before : today;
  const sustainedFromFlightDay = previous && levelRank(before) > levelRank(today) ? previous.flightDay : null;
  const amslerPerWeek =
    regime === 'clinically-concerning'
      ? CLINICALLY_CONCERNING_AMSLER_PER_WEEK
      : regime === 'first-sign'
        ? FIRST_SIGN_AMSLER_PER_WEEK
        : 0;
  const nextRoutine = MISSION.routineControlDays.find((day) => day > flightDay);

  let reason: NonNullable<SessionAssessment['nextOct']>['reason'];
  let target: number | null;
  let chosen: number | null;
  if (anyEyeNotMeasured) {
    reason = 'not-measured';
    target = flightDay + NOT_MEASURED_OCT_MAX_DAYS;
    chosen = nextRoutine !== undefined && nextRoutine <= target ? nextRoutine : target;
  } else if (regime === 'no-detectable-change') {
    reason = 'routine';
    target = nextRoutine ?? null;
    chosen = target;
  } else {
    reason = regime;
    target =
      flightDay +
      (regime === 'clinically-concerning' ? CLINICALLY_CONCERNING_OCT_INTERVAL_DAYS : FIRST_SIGN_OCT_INTERVAL_DAYS);
    chosen = nextRoutine !== undefined && nextRoutine <= target + ROUTINE_MERGE_WINDOW_DAYS ? nextRoutine : target;
  }
  return {
    nextOct: chosen !== null && chosen <= MISSION.durationDays ? { flightDay: chosen, reason } : null,
    amslerPerWeek,
    regime,
    sustainedFromFlightDay,
    targetFlightDay: target,
  };
}

// ----------------------------------------------------------------- Steps

function step(
  id: NextStepId,
  basis: NextStep['basis'],
  sources: readonly RuleSourceId[],
  params: NextStep['params'] = {},
): NextStep {
  return { id, params, basis, sources };
}

function nextSteps(
  flightDay: number,
  contact: ContactUrgency,
  followUp: FollowUp,
  notMeasured: readonly Eye[],
  nearVisionWorse: boolean,
): NextStep[] {
  const steps: NextStep[] = [];
  const { nextOct } = followUp;
  const when = nextOct ? { flightDay: nextOct.flightDay, inDays: nextOct.flightDay - flightDay } : null;

  // Which urgency goes with which finding is this project's assumption.
  if (contact === 'now') steps.push(step('contact-surgeon-now', 'assumption', []));
  if (contact === 'without-delay') steps.push(step('notify-surgeon-without-delay', 'assumption', ['nasa-mtb-2024']));

  if (when && nextOct?.reason === 'not-measured') {
    steps.push(
      step('oct-repeat-soon', 'assumption', [], {
        ...when,
        maxDays: NOT_MEASURED_OCT_MAX_DAYS,
        eyes: notMeasured.length === 2 ? 'both' : (notMeasured[0] ?? 'both'),
      }),
    );
  }
  if (when && (nextOct?.reason === 'first-sign' || nextOct?.reason === 'clinically-concerning')) {
    const params: Record<string, number | string> = {
      ...when,
      intervalDays:
        nextOct.reason === 'first-sign' ? FIRST_SIGN_OCT_INTERVAL_DAYS : CLINICALLY_CONCERNING_OCT_INTERVAL_DAYS,
      targetFlightDay: followUp.targetFlightDay ?? when.flightDay,
    };
    if (followUp.sustainedFromFlightDay !== null) params.sustainedFromFlightDay = followUp.sustainedFromFlightDay;
    steps.push(
      step(nextOct.reason === 'first-sign' ? 'oct-in-4-weeks' : 'oct-in-3-weeks', 'assumption', ['brunstetter2024'], params),
    );
  }
  if (followUp.amslerPerWeek > 0) {
    const params: Record<string, number | string> = { perWeek: followUp.amslerPerWeek };
    if (followUp.sustainedFromFlightDay !== null) params.sustainedFromFlightDay = followUp.sustainedFromFlightDay;
    steps.push(
      step(
        followUp.regime === 'clinically-concerning' ? 'amsler-three-times-a-week' : 'amsler-twice-a-week',
        'assumption',
        ['brunstetter2024'],
        params,
      ),
    );
  }
  // The glasses and their use are NASA's; when to suggest them is this project's rule.
  if (nearVisionWorse) steps.push(step('try-stronger-glasses', 'nasa', ['nasa-mtb-2024', 'nguyen2025']));
  if (when && nextOct?.reason === 'routine') {
    steps.push(step('oct-routine', 'nasa', ['nasa-mtb-2024'], { ...when, routineDays: MISSION.routineControlDays.join(',') }));
  }
  if (when && followUp.amslerPerWeek === 0) steps.push(step('amsler-at-controls', 'nasa', ['nasa-evidence-2017']));
  if (contact === 'routine-report') steps.push(step('report-routine', 'nasa', ['nasa-mtb-2024']));
  if (!nextOct) {
    const params: Record<string, number | string> = { missionDays: MISSION.durationDays };
    if (followUp.targetFlightDay !== null) params.targetFlightDay = followUp.targetFlightDay;
    steps.push(step('post-flight-exams', 'nasa', ['nasa-mtb-2024'], params));
  }
  return steps;
}

// --------------------------------------------------------------- Session

/**
 * Assesses one session: each eye against its own pre-flight exam, the vision
 * tests and the questionnaire, and from them the level, the contact urgency and
 * the next steps. `errorModel` defaults to the provisional one.
 */
export function assessSession(
  input: AssessmentInput,
  errorModel: ErrorModel = PROVISIONAL_ERROR_MODEL,
): SessionAssessment {
  const { crewId, flightDay } = input;
  const earlier = input.history
    .filter((record) => record.crewId === crewId && record.flightDay < flightDay)
    .sort((a, b) => a.flightDay - b.flightDay);
  const preflight = earlier.find((record) => record.flightDay === 0) ?? null;
  const inFlight = earlier.filter((record) => record.flightDay > 0);
  const previousControl = inFlight.length > 0 ? inFlight[inFlight.length - 1]! : null;
  // The pre-flight session is the reference: it is recorded, not compared.
  const isReference = flightDay <= 0;

  const assessEye = (eye: Eye): EyeAssessment => {
    const capture = input.eyes[eye];
    const exam = measuredExam(capture);
    if (!exam) return notMeasuredEye(eye, notMeasuredReasons(capture));
    if (isReference) return referenceEye(eye);
    const baseline = measuredExam(preflight?.eyes[eye]);
    if (!baseline) return notMeasuredEye(eye, ['no-baseline']);
    let previous: PreviousExam | null = null;
    for (let i = inFlight.length - 1; i >= 0 && !previous; i--) {
      const earlierExam = measuredExam(inFlight[i]!.eyes[eye]);
      if (earlierExam) previous = { flightDay: inFlight[i]!.flightDay, exam: earlierExam };
    }
    return assessMeasuredEye(eye, exam, baseline, previous, errorModel);
  };
  const eyes = { OD: assessEye('OD'), OS: assessEye('OS') };

  const functional = assessFunctional(input.vision, isReference ? null : (preflight?.vision ?? null));
  const todayLevels = [eyes.OD.level, eyes.OS.level];
  const level: Level = functional.acute ? 'acute-visual-symptom' : maxLevel(todayLevels);
  const contact: ContactUrgency = functional.acute
    ? 'now'
    : functional.withoutDelay || todayLevels.includes('clinically-concerning')
      ? 'without-delay'
      : 'routine-report';

  const notMeasured = EYES.filter((eye) => !eyes[eye].measured);
  const followUp = planFollowUp(
    flightDay,
    todayLevels,
    previousControl
      ? {
          flightDay: previousControl.flightDay,
          levels: [previousControl.assessment.eyes.OD.level, previousControl.assessment.eyes.OS.level],
        }
      : null,
    // Before the flight an exam that fails is repeated on the ground, outside this calendar.
    notMeasured.length > 0 && !isReference,
  );

  const found = new Set<FindingId>([...eyes.OD.findings, ...eyes.OS.findings, ...functional.findings]);
  return {
    crewId,
    flightDay,
    eyes,
    level,
    alert: alertForLevel(level),
    findings: FINDING_ORDER.filter((finding) => found.has(finding)),
    contact,
    nextOct: followUp.nextOct,
    amslerPerWeek: followUp.amslerPerWeek,
    nextSteps: nextSteps(flightDay, contact, followUp, notMeasured, functional.nearVisionWorse),
    limitations: [...LIMITATIONS],
    rulesVersion: RULES_VERSION,
    functional: functional.digest,
    errorModelVersion: errorModel.version,
  };
}
