import type { CrewId, SessionRecord } from '@app/core';
import { isCrewId } from './routes';
import { STEP_IDS, sessionKey, type SessionDraft } from './session';

/**
 * What this browser remembers: the controls done here, the controls in progress,
 * the questions for the flight surgeon and the chosen mission day.
 *
 * Health data stay on the device. This module only talks to the storage it is
 * given; nothing in it reaches the network.
 */
export interface AppState {
  /** The mission day the astronaut "travelled" to: one of NASA's routine control days. */
  missionDay: number;
  /** Controls done in this browser. */
  records: SessionRecord[];
  /** Controls in progress, by `sessionKey`. */
  drafts: Record<string, SessionDraft>;
  /** Questions written for controls that come with the application, by `sessionKey`. */
  questions: Record<string, string[]>;
}

/** Bumped whenever the stored shape changes. A payload of another version is not read. */
export const STORAGE_VERSION = 1;
export const STORAGE_KEY = 'app.state';

export interface StoreOptions {
  /** Mission days that can be chosen; anything else stored is replaced by the default. */
  missionDays: readonly number[];
  defaultMissionDay: number;
}

/** `discarded`: something was stored but could not be read (another version, or damaged). */
export type LoadStatus = 'empty' | 'loaded' | 'discarded';

export function emptyState(options: StoreOptions): AppState {
  return { missionDay: options.defaultMissionDay, records: [], drafts: {}, questions: {} };
}

// ------------------------------------------------------------- Transitions

export function withMissionDay(state: AppState, missionDay: number): AppState {
  return state.missionDay === missionDay ? state : { ...state, missionDay };
}

/** Saves a control done here. It replaces an earlier one of the same crew member and day, and ends its draft. */
export function withRecord(state: AppState, record: SessionRecord): AppState {
  const key = sessionKey(record.crewId, record.flightDay);
  const drafts = { ...state.drafts };
  delete drafts[key];
  return {
    ...state,
    records: [...state.records.filter((other) => sessionKey(other.crewId, other.flightDay) !== key), record],
    drafts,
  };
}

export function withDraft(state: AppState, draft: SessionDraft): AppState {
  return { ...state, drafts: { ...state.drafts, [sessionKey(draft.crewId, draft.flightDay)]: draft } };
}

export function withoutDraft(state: AppState, crewId: CrewId, flightDay: number): AppState {
  const key = sessionKey(crewId, flightDay);
  if (!(key in state.drafts)) return state;
  const drafts = { ...state.drafts };
  delete drafts[key];
  return { ...state, drafts };
}

/**
 * Saves the questions for the flight surgeon. For a control done here they live
 * in its record; for one that comes with the application, next to it.
 */
export function withQuestions(state: AppState, crewId: CrewId, flightDay: number, questions: string[]): AppState {
  const key = sessionKey(crewId, flightDay);
  const index = state.records.findIndex((record) => sessionKey(record.crewId, record.flightDay) === key);
  if (index >= 0) {
    const records = state.records.slice();
    records[index] = { ...(records[index] as SessionRecord), questions };
    return { ...state, records };
  }
  return { ...state, questions: { ...state.questions, [key]: questions } };
}

export function findLiveRecord(state: AppState, crewId: CrewId, flightDay: number): SessionRecord | null {
  return state.records.find((record) => record.crewId === crewId && record.flightDay === flightDay) ?? null;
}

export function findDraft(state: AppState, crewId: CrewId, flightDay: number): SessionDraft | null {
  return state.drafts[sessionKey(crewId, flightDay)] ?? null;
}

/** The questions written for a control, wherever they are kept. */
export function questionsFor(state: AppState, record: SessionRecord): string[] {
  if (record.origin === 'live') return record.questions;
  return state.questions[sessionKey(record.crewId, record.flightDay)] ?? record.questions;
}

/** Whether anything at all is saved in this browser. */
export function hasSavedData(state: AppState): boolean {
  return (
    state.records.length > 0 || Object.keys(state.drafts).length > 0 || Object.keys(state.questions).length > 0
  );
}

// ------------------------------------------------------------- Persistence

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFlightDay(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 999;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** Structural check of the parts the screens rely on. A record that fails is dropped, not repaired. */
function isLiveRecord(value: unknown): value is SessionRecord {
  if (!isObject(value) || !isCrewId(value.crewId) || !isFlightDay(value.flightDay) || value.origin !== 'live') {
    return false;
  }
  const { eyes, assessment } = value;
  if (!isObject(eyes) || !isObject(assessment) || !isStringArray(value.questions)) return false;
  for (const eye of ['OD', 'OS'] as const) {
    const capture = eyes[eye];
    if (!isObject(capture) || capture.eye !== eye || !Array.isArray(capture.attempts)) return false;
    if (capture.accepted !== null && !isObject(capture.accepted)) return false;
  }
  if (!(value.vision === null || isObject(value.vision))) return false;
  const assessedEyes = assessment.eyes;
  return (
    typeof assessment.level === 'string' &&
    isObject(assessedEyes) &&
    isObject(assessedEyes.OD) &&
    isObject(assessedEyes.OS) &&
    Array.isArray(assessment.nextSteps) &&
    Array.isArray(assessment.limitations) &&
    Array.isArray(assessment.findings)
  );
}

function isOutcome(value: unknown): boolean {
  return (
    isObject(value) &&
    (value.status === 'pending' || value.status === 'skipped' || (value.status === 'done' && isObject(value.value)))
  );
}

function isDraft(value: unknown): value is SessionDraft {
  if (!isObject(value) || !isCrewId(value.crewId) || !isFlightDay(value.flightDay)) return false;
  const { stepIndex, eyes } = value;
  return (
    typeof stepIndex === 'number' &&
    Number.isInteger(stepIndex) &&
    stepIndex >= 0 &&
    stepIndex < STEP_IDS.length &&
    isOutcome(value.symptoms) &&
    isOutcome(value.acuity) &&
    isOutcome(value.amsler) &&
    isObject(eyes) &&
    (eyes.OD === null || isObject(eyes.OD)) &&
    (eyes.OS === null || isObject(eyes.OS))
  );
}

export function serializeState(state: AppState): string {
  return JSON.stringify({ version: STORAGE_VERSION, ...state });
}

/**
 * Reads a stored payload. Never throws: a payload of another version or a damaged
 * one gives an empty state, and damaged entries inside a good payload are dropped.
 */
export function parseStoredState(raw: string | null, options: StoreOptions): { state: AppState; status: LoadStatus } {
  const empty = emptyState(options);
  if (raw === null || raw === '') return { state: empty, status: 'empty' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { state: empty, status: 'discarded' };
  }
  if (!isObject(parsed) || parsed.version !== STORAGE_VERSION) return { state: empty, status: 'discarded' };

  const missionDay =
    typeof parsed.missionDay === 'number' && options.missionDays.includes(parsed.missionDay)
      ? parsed.missionDay
      : options.defaultMissionDay;

  const seen = new Set<string>();
  const records: SessionRecord[] = [];
  for (const candidate of Array.isArray(parsed.records) ? parsed.records : []) {
    if (!isLiveRecord(candidate)) continue;
    const key = sessionKey(candidate.crewId, candidate.flightDay);
    if (seen.has(key)) continue;
    seen.add(key);
    records.push(candidate);
  }

  const drafts: Record<string, SessionDraft> = {};
  if (isObject(parsed.drafts)) {
    for (const candidate of Object.values(parsed.drafts)) {
      if (isDraft(candidate)) drafts[sessionKey(candidate.crewId, candidate.flightDay)] = candidate;
    }
  }

  const questions: Record<string, string[]> = {};
  if (isObject(parsed.questions)) {
    for (const [key, list] of Object.entries(parsed.questions)) {
      if (/^[A-D]:\d{1,3}$/.test(key) && isStringArray(list)) questions[key] = list;
    }
  }

  return { state: { missionDay, records, drafts, questions }, status: 'loaded' };
}

// ------------------------------------------------------------------- Store

/** The part of the Web Storage API this module uses. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface AppStore {
  getState(): AppState;
  subscribe(listener: () => void): () => void;
  update(transform: (state: AppState) => AppState): void;
  /** Forgets everything saved in this browser. */
  clear(): void;
  /** Reads the storage again, for a change made in another tab. */
  reload(): void;
  /** What happened when the storage was first read. */
  readonly loadStatus: LoadStatus;
  /** False when there is no storage or the last write failed: the state then lives only in this page. */
  isPersistent(): boolean;
}

export function createAppStore(storage: KeyValueStorage | null, options: StoreOptions): AppStore {
  const listeners = new Set<() => void>();
  let persistent = storage !== null;

  const read = (): { state: AppState; status: LoadStatus } => {
    let raw: string | null = null;
    try {
      raw = storage?.getItem(STORAGE_KEY) ?? null;
    } catch {
      persistent = false;
    }
    return parseStoredState(raw, options);
  };

  const initial = read();
  let state = initial.state;

  const notify = (): void => {
    for (const listener of listeners) listener();
  };

  const write = (): void => {
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, serializeState(state));
      persistent = true;
    } catch {
      // Storage full or blocked: keep working in memory and say so on screen.
      persistent = false;
    }
  };

  return {
    loadStatus: initial.status,
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update(transform) {
      const next = transform(state);
      if (next === state) return;
      state = next;
      write();
      notify();
    },
    clear() {
      state = { ...emptyState(options), missionDay: state.missionDay };
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        persistent = false;
      }
      write();
      notify();
    },
    reload() {
      state = read().state;
      notify();
    },
    isPersistent: () => persistent,
  };
}

/** The browser's local storage, or null where it does not exist or is blocked (private mode, tests). */
export function browserStorage(): KeyValueStorage | null {
  try {
    const storage = globalThis.localStorage;
    const probe = `${STORAGE_KEY}.probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

/** An in-memory storage with the same interface, for tests and for browsers without storage. */
export function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
    removeItem: (key) => {
      items.delete(key);
    },
  };
}
