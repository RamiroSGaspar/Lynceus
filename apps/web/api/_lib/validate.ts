import {
  ALERT_CLASSES,
  CONTACT_URGENCIES,
  FINDING_IDS,
  LEVELS,
  LIKELIHOOD_WORDS,
  LOCALES,
  MEASURE_IDS,
  NEXT_STEP_IDS,
  QUESTION_MAX_CHARS,
  THRESHOLD_IDS,
  type AssistantContext,
  type AssistantRequest,
  type ContextCapture,
  type ContextChange,
  type ContextEye,
  type ContextThreshold,
} from './contract.js';

/**
 * Input barrier. Everything is checked field by field and rebuilt from scratch:
 * what is not in the contract is dropped, what is out of range rejects the request.
 */

class Invalid extends Error {}

const fail = (): never => {
  throw new Invalid();
};

type Obj = Record<string, unknown>;

function obj(value: unknown): Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Obj) : fail();
}

function num(value: unknown, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fail();
}

function int(value: unknown, min: number, max: number): number {
  return Number.isInteger(num(value, min, max)) ? (value as number) : fail();
}

function bool(value: unknown): boolean {
  return typeof value === 'boolean' ? value : fail();
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fail();
}

function list<T>(value: unknown, maxLength: number, item: (v: unknown) => T): T[] {
  return Array.isArray(value) && value.length <= maxLength ? value.map(item) : fail();
}

function uniqueList<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  const items = list(value, allowed.length, (v) => oneOf(v, allowed));
  return new Set(items).size === items.length ? items : fail();
}

// Ranges are generous physical limits, not clinical ones: they only keep
// nonsense and oversized payloads out.
const MAX_CHANGE_UM = 1000;
const MAX_FLIGHT_DAY = 1100;

function change(value: unknown): ContextChange {
  const o = obj(value);
  const interval =
    o.interval95Um === null
      ? null
      : (list(o.interval95Um, 2, (v) => num(v, -MAX_CHANGE_UM, MAX_CHANGE_UM)) as number[]);
  if (interval !== null && (interval.length !== 2 || interval[0]! > interval[1]!)) fail();
  return {
    measure: oneOf(o.measure, MEASURE_IDS),
    changeUm: num(o.changeUm, -MAX_CHANGE_UM, MAX_CHANGE_UM),
    interval95Um: interval === null ? null : [interval[0]!, interval[1]!],
  };
}

function threshold(value: unknown): ContextThreshold {
  const o = obj(value);
  return {
    id: oneOf(o.id, THRESHOLD_IDS),
    thresholdUm: num(o.thresholdUm, 0, MAX_CHANGE_UM),
    exceeded: bool(o.exceeded),
    probabilityExceeded: num(o.probabilityExceeded, 0, 1),
    word: oneOf(o.word, LIKELIHOOD_WORDS),
  };
}

function capture(value: unknown): ContextCapture | null {
  if (value === null) return null;
  const o = obj(value);
  return {
    attempts: int(o.attempts, 0, 10),
    usableScans: int(o.usableScans, 0, 200),
    totalScans: o.totalScans === null ? null : int(o.totalScans, 0, 200),
    meanQualityDb: num(o.meanQualityDb, 0, 40),
  };
}

function eye(value: unknown): ContextEye {
  const o = obj(value);
  const changes = list(o.changes, MEASURE_IDS.length, change);
  if (new Set(changes.map((c) => c.measure)).size !== changes.length) fail();
  return {
    measured: bool(o.measured),
    level: o.level === null ? null : oneOf(o.level, LEVELS),
    changes,
    thresholds: list(o.thresholds, THRESHOLD_IDS.length, threshold),
    capture: capture(o.capture),
  };
}

export function validateContext(value: unknown): AssistantContext {
  const o = obj(value);
  const eyes = obj(o.eyes);
  return {
    flightDay: int(o.flightDay, 0, MAX_FLIGHT_DAY),
    level: oneOf(o.level, LEVELS),
    alert: oneOf(o.alert, ALERT_CLASSES),
    eyes: { OD: eye(eyes.OD), OS: eye(eyes.OS) },
    findings: uniqueList(o.findings, FINDING_IDS),
    nextSteps: uniqueList(o.nextSteps, NEXT_STEP_IDS),
    contact: oneOf(o.contact, CONTACT_URGENCIES),
    nextOctFlightDay: o.nextOctFlightDay === null ? null : int(o.nextOctFlightDay, 0, MAX_FLIGHT_DAY),
  };
}

/** C0 and C1 control characters except tab and line breaks, plus bidirectional overrides. */
const FORBIDDEN_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/;

export function validateQuestion(value: unknown): string {
  if (typeof value !== 'string' || FORBIDDEN_CHARS.test(value)) fail();
  const question = (value as string).trim();
  const length = [...question].length;
  return length >= 1 && length <= QUESTION_MAX_CHARS ? question : fail();
}

/** Returns the clean request, or null when anything is invalid. */
export function validateRequest(body: unknown): AssistantRequest | null {
  try {
    const o = obj(body);
    return {
      question: validateQuestion(o.question),
      locale: oneOf(o.locale, LOCALES),
      context: o.context === null || o.context === undefined ? null : validateContext(o.context),
    };
  } catch (error) {
    if (error instanceof Invalid) return null;
    throw error;
  }
}
