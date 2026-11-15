/**
 * Contract between the assistant panel (browser) and the assistant function
 * (server). This file has no runtime imports from the repository: the function
 * must run on Vercel without the workspace packages. The enumerations repeat the
 * unions of `packages/core/src/contract.ts`; the panel checks at compile time
 * that both lists are the same (`features/assistant/context.ts`).
 */

export const LOCALES = ['en', 'es'] as const;
export type AssistantLocale = (typeof LOCALES)[number];

export const LEVELS = ['no-detectable-change', 'first-sign', 'clinically-concerning', 'acute-visual-symptom'] as const;
export const ALERT_CLASSES = ['none', 'advisory', 'caution', 'warning'] as const;
export const LIKELIHOOD_WORDS = ['unlikely', 'possible', 'likely', 'very-likely'] as const;
export const THRESHOLD_IDS = ['trt-first-sign', 'trt-clinically-concerning', 'folds-new'] as const;
export const CONTACT_URGENCIES = ['routine-report', 'without-delay', 'now'] as const;
export const FINDING_IDS = [
  'swelling-first-sign',
  'swelling-clinically-concerning',
  'folds-new',
  'eye-not-measured',
  'near-vision-worse',
  'amsler-marked',
  'amsler-marked-central',
  'symptom-acute',
  'symptom-near-blur',
  'symptom-headache',
  'symptom-other',
] as const;
export const NEXT_STEP_IDS = [
  'oct-routine',
  'oct-in-4-weeks',
  'oct-in-3-weeks',
  'oct-repeat-soon',
  'amsler-at-controls',
  'amsler-twice-a-week',
  'amsler-three-times-a-week',
  'report-routine',
  'notify-surgeon-without-delay',
  'contact-surgeon-now',
  'try-stronger-glasses',
  'post-flight-exams',
] as const;
/** Measures whose change from the pre-flight exam is sent. All in micrometres. */
export const MEASURE_IDS = ['trt-0-250', 'trt-250-500', 'trt-500-1000', 'trt-1000-1500', 'mrw', 'bm-roughness'] as const;

export type AssistantLevel = (typeof LEVELS)[number];
export type AssistantAlert = (typeof ALERT_CLASSES)[number];
export type AssistantLikelihood = (typeof LIKELIHOOD_WORDS)[number];
export type AssistantThresholdId = (typeof THRESHOLD_IDS)[number];
export type AssistantContact = (typeof CONTACT_URGENCIES)[number];
export type AssistantFinding = (typeof FINDING_IDS)[number];
export type AssistantNextStep = (typeof NEXT_STEP_IDS)[number];
export type AssistantMeasure = (typeof MEASURE_IDS)[number];

export interface ContextChange {
  measure: AssistantMeasure;
  /** Change from the pre-flight exam of the same eye, micrometres. */
  changeUm: number;
  /** 95 % interval of the change, micrometres; null when the engine cannot support one. */
  interval95Um: readonly [number, number] | null;
}

export interface ContextThreshold {
  id: AssistantThresholdId;
  /** NASA threshold value, micrometres. */
  thresholdUm: number;
  exceeded: boolean;
  /** Probability that the true change is beyond the threshold, 0 to 1. */
  probabilityExceeded: number;
  word: AssistantLikelihood;
}

export interface ContextCapture {
  attempts: number;
  usableScans: number;
  totalScans: number;
  meanQualityDb: number;
}

export interface ContextEye {
  measured: boolean;
  level: AssistantLevel | null;
  changes: readonly ContextChange[];
  thresholds: readonly ContextThreshold[];
  capture: ContextCapture | null;
}

/**
 * Numeric summary of one session, without identity: no name, no crew or exam
 * identifier, no free-text answers. This is everything that leaves the device.
 */
export interface AssistantContext {
  flightDay: number;
  level: AssistantLevel;
  alert: AssistantAlert;
  eyes: { OD: ContextEye; OS: ContextEye };
  findings: readonly AssistantFinding[];
  nextSteps: readonly AssistantNextStep[];
  contact: AssistantContact;
  nextOctFlightDay: number | null;
}

export interface AssistantRequest {
  question: string;
  locale: AssistantLocale;
  context: AssistantContext | null;
}

export interface AnswerSource {
  id: string;
  title: string;
  url: string;
}

export type AssistantResponse =
  | { status: 'answered'; answer: string; sources: AnswerSource[] }
  | { status: 'refused'; reason: 'out-of-scope' | 'invalid-input' | 'unsafe-output' }
  | { status: 'unavailable'; reason: 'no-key' | 'rate-limited' | 'upstream-error' };

export const QUESTION_MAX_CHARS = 500;
