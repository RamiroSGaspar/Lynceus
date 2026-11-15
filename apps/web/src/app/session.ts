import type {
  AcuityResult,
  AmslerResult,
  CrewId,
  EyeCaptureResult,
  ScreenCalibration,
  SessionAssessment,
  SessionRecord,
  SymptomAnswers,
  VisionSession,
} from '@app/core';

/**
 * The guided session: seven steps in the order of NASA's series, function first
 * and image after. This module is the session's logic without any interface.
 */
export const STEP_IDS = ['intro', 'symptoms', 'acuity', 'amsler', 'oct-od', 'oct-os', 'evaluation'] as const;
export type StepId = (typeof STEP_IDS)[number];

/** `skipped` is recorded, not forgotten: the result says the test was not done. */
export type StepOutcome<T> = { status: 'pending' } | { status: 'skipped' } | { status: 'done'; value: T };

export interface AcuityOutcome {
  calibration: ScreenCalibration;
  OD: AcuityResult;
  OS: AcuityResult;
}

export interface AmslerOutcome {
  OD: AmslerResult;
  OS: AmslerResult;
}

/** A control in progress. Stored after every step so a reload resumes where it was. */
export interface SessionDraft {
  crewId: CrewId;
  flightDay: number;
  /** Index into `STEP_IDS` of the step on screen. */
  stepIndex: number;
  symptoms: StepOutcome<SymptomAnswers>;
  acuity: StepOutcome<AcuityOutcome>;
  amsler: StepOutcome<AmslerOutcome>;
  eyes: { OD: EyeCaptureResult | null; OS: EyeCaptureResult | null };
}

export type StepStatus = 'done' | 'skipped' | 'current' | 'upcoming';

/** What a step reports when it ends. `null` means the astronaut skipped the test. */
export type DraftEvent =
  | { type: 'begin' }
  | { type: 'symptoms'; value: SymptomAnswers | null }
  | { type: 'acuity'; value: AcuityOutcome | null }
  | { type: 'amsler'; value: AmslerOutcome | null }
  | { type: 'eye'; value: EyeCaptureResult }
  | { type: 'continue' }
  | { type: 'back' };

const LAST_STEP = STEP_IDS.length - 1;

/** Key of a control of one crew member on one flight day. */
export function sessionKey(crewId: CrewId, flightDay: number): string {
  return `${crewId}:${flightDay}`;
}

export function startDraft(crewId: CrewId, flightDay: number): SessionDraft {
  return {
    crewId,
    flightDay,
    stepIndex: 0,
    symptoms: { status: 'pending' },
    acuity: { status: 'pending' },
    amsler: { status: 'pending' },
    eyes: { OD: null, OS: null },
  };
}

export function currentStep(draft: SessionDraft): StepId {
  return STEP_IDS[Math.min(Math.max(draft.stepIndex, 0), LAST_STEP)] ?? 'intro';
}

function outcome<T>(value: T | null): StepOutcome<T> {
  return value === null ? { status: 'skipped' } : { status: 'done', value };
}

function advance(draft: SessionDraft): SessionDraft {
  return { ...draft, stepIndex: Math.min(draft.stepIndex + 1, LAST_STEP) };
}

/**
 * Applies what a step reported. An event that does not belong to the step on
 * screen is ignored, so a late or repeated callback cannot corrupt the session.
 */
export function applyEvent(draft: SessionDraft, event: DraftEvent): SessionDraft {
  const step = currentStep(draft);
  switch (event.type) {
    case 'back':
      return { ...draft, stepIndex: Math.max(draft.stepIndex - 1, 0) };
    case 'begin':
      return step === 'intro' ? advance(draft) : draft;
    case 'continue':
      // Moving on from a step that already has an outcome, after going back.
      return step !== 'intro' && step !== 'evaluation' && stepHasOutcome(draft, step) ? advance(draft) : draft;
    case 'symptoms':
      return step === 'symptoms' ? advance({ ...draft, symptoms: outcome(event.value) }) : draft;
    case 'acuity':
      return step === 'acuity' ? advance({ ...draft, acuity: outcome(event.value) }) : draft;
    case 'amsler':
      return step === 'amsler' ? advance({ ...draft, amsler: outcome(event.value) }) : draft;
    case 'eye': {
      const eye = step === 'oct-od' ? 'OD' : step === 'oct-os' ? 'OS' : null;
      if (eye === null || event.value.eye !== eye) return draft;
      return advance({ ...draft, eyes: { ...draft.eyes, [eye]: event.value } });
    }
  }
}

/** Whether the step already produced something in this control (a result, or a recorded skip). */
export function stepHasOutcome(draft: SessionDraft, step: StepId): boolean {
  switch (step) {
    case 'symptoms':
    case 'acuity':
    case 'amsler':
      return draft[step].status !== 'pending';
    case 'oct-od':
      return draft.eyes.OD !== null;
    case 'oct-os':
      return draft.eyes.OS !== null;
    case 'intro':
    case 'evaluation':
      return false;
  }
}

export function stepStatus(draft: SessionDraft, index: number): StepStatus {
  const step = STEP_IDS[index];
  if (step === undefined) return 'upcoming';
  if (index === draft.stepIndex) return 'current';
  if (step === 'symptoms' || step === 'acuity' || step === 'amsler') {
    const status = draft[step].status;
    if (status === 'skipped') return 'skipped';
    if (status === 'done') return 'done';
    return 'upcoming';
  }
  if (step === 'intro') return index < draft.stepIndex ? 'done' : 'upcoming';
  return stepHasOutcome(draft, step) ? 'done' : 'upcoming';
}

/** The calibration of the screen, when the acuity test was done; the Amsler grid needs it to draw true sizes. */
export function calibrationOf(draft: SessionDraft): ScreenCalibration | null {
  return draft.acuity.status === 'done' ? draft.acuity.value.calibration : null;
}

/** The functional part of the session. A skipped test stays as `null`: not done. */
export function visionOf(draft: SessionDraft): VisionSession {
  const acuity = draft.acuity.status === 'done' ? draft.acuity.value : null;
  const amsler = draft.amsler.status === 'done' ? draft.amsler.value : null;
  return {
    calibration: acuity?.calibration ?? null,
    acuity: { OD: acuity?.OD ?? null, OS: acuity?.OS ?? null },
    amsler: { OD: amsler?.OD ?? null, OS: amsler?.OS ?? null },
    symptoms: draft.symptoms.status === 'done' ? draft.symptoms.value : null,
  };
}

/** Both eyes went through the capture step (measured or not): the session can be assessed. */
export function capturedEyes(draft: SessionDraft): { OD: EyeCaptureResult; OS: EyeCaptureResult } | null {
  const { OD, OS } = draft.eyes;
  return OD && OS ? { OD, OS } : null;
}

export function buildRecord(draft: SessionDraft, assessment: SessionAssessment): SessionRecord | null {
  const eyes = capturedEyes(draft);
  if (!eyes) return null;
  return {
    crewId: draft.crewId,
    flightDay: draft.flightDay,
    origin: 'live',
    eyes,
    vision: visionOf(draft),
    assessment,
    questions: [],
  };
}
