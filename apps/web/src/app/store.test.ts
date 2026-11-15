import { describe, expect, it } from 'vitest';
import type { SessionRecord } from '@app/core';
import { getHistory } from './core';
import { applyEvent, startDraft } from './session';
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  createAppStore,
  emptyState,
  findDraft,
  findLiveRecord,
  hasSavedData,
  memoryStorage,
  parseStoredState,
  questionsFor,
  serializeState,
  withDraft,
  withMissionDay,
  withQuestions,
  withRecord,
  withoutDraft,
  type AppState,
  type KeyValueStorage,
} from './store';

const OPTIONS = { missionDays: [30, 90, 150], defaultMissionDay: 150 } as const;

/** A sample control "done in this browser": a precomputed sample one, relabelled. */
function liveRecord(crewId: 'A' | 'B', flightDay: number): SessionRecord {
  const sample = getHistory(crewId, 151).find((record) => record.flightDay === flightDay);
  if (!sample) throw new Error('sample record missing');
  return { ...sample, origin: 'live' };
}

describe('state transitions', () => {
  const base = emptyState(OPTIONS);

  it('starts on the default mission day with nothing saved', () => {
    expect(base).toEqual({ missionDay: 150, records: [], drafts: {}, questions: {} });
    expect(hasSavedData(base)).toBe(false);
  });

  it('changes the mission day and keeps the same object when nothing changes', () => {
    expect(withMissionDay(base, 90).missionDay).toBe(90);
    expect(withMissionDay(base, 150)).toBe(base);
  });

  it('saves a control, replaces the one of the same crew member and day, and ends its draft', () => {
    const draft = startDraft('A', 150);
    const first = liveRecord('A', 150);
    const second: SessionRecord = { ...first, questions: ['again'] };
    let state = withDraft(base, draft);
    expect(findDraft(state, 'A', 150)).toEqual(draft);
    state = withRecord(state, first);
    expect(findDraft(state, 'A', 150)).toBeNull();
    state = withRecord(state, liveRecord('A', 90));
    state = withRecord(state, second);
    expect(state.records).toHaveLength(2);
    expect(findLiveRecord(state, 'A', 150)).toBe(second);
    expect(findLiveRecord(state, 'B', 150)).toBeNull();
    expect(hasSavedData(state)).toBe(true);
  });

  it('removes a draft and keeps the same object when there was none', () => {
    const state = withDraft(base, startDraft('B', 90));
    expect(withoutDraft(state, 'B', 90).drafts).toEqual({});
    expect(withoutDraft(state, 'B', 30)).toBe(state);
  });

  it('keeps the questions in the record of a control done here, and beside a precomputed one', () => {
    const live = liveRecord('A', 150);
    let state = withRecord(base, live);
    state = withQuestions(state, 'A', 150, ['How often should I repeat the scan?']);
    const saved = findLiveRecord(state, 'A', 150);
    expect(saved?.questions).toEqual(['How often should I repeat the scan?']);
    expect(state.questions).toEqual({});
    expect(saved && questionsFor(state, saved)).toEqual(['How often should I repeat the scan?']);

    const precomputed = getHistory('B', 151).find((record) => record.flightDay === 90) as SessionRecord;
    state = withQuestions(state, 'B', 90, ['Should I try other glasses?']);
    expect(state.questions).toEqual({ 'B:90': ['Should I try other glasses?'] });
    expect(questionsFor(state, precomputed)).toEqual(['Should I try other glasses?']);
    expect(questionsFor(base, precomputed)).toEqual([]);
  });
});

describe('stored format', () => {
  const full: AppState = withQuestions(
    withDraft(withRecord(withMissionDay(emptyState(OPTIONS), 90), liveRecord('A', 30)), applyEvent(startDraft('B', 90), { type: 'begin' })),
    'B',
    30,
    ['One question'],
  );

  it('writes its version and reads back the same state', () => {
    const raw = serializeState(full);
    expect(JSON.parse(raw).version).toBe(STORAGE_VERSION);
    expect(parseStoredState(raw, OPTIONS)).toEqual({ state: full, status: 'loaded' });
  });

  it('reports an absent payload as empty', () => {
    expect(parseStoredState(null, OPTIONS)).toEqual({ state: emptyState(OPTIONS), status: 'empty' });
    expect(parseStoredState('', OPTIONS).status).toBe('empty');
  });

  it('discards a payload of another version instead of guessing its shape', () => {
    const other = JSON.stringify({ ...JSON.parse(serializeState(full)), version: STORAGE_VERSION + 1 });
    expect(parseStoredState(other, OPTIONS)).toEqual({ state: emptyState(OPTIONS), status: 'discarded' });
    const none = JSON.stringify({ missionDay: 90, records: [] });
    expect(parseStoredState(none, OPTIONS).status).toBe('discarded');
  });

  it('discards damaged payloads without throwing', () => {
    for (const raw of ['{', 'null', '[]', '"text"', '42']) {
      expect(parseStoredState(raw, OPTIONS)).toEqual({ state: emptyState(OPTIONS), status: 'discarded' });
    }
  });

  it('falls back to the default mission day when the stored one is not a routine day', () => {
    const raw = JSON.stringify({ version: STORAGE_VERSION, missionDay: 77, records: [], drafts: {}, questions: {} });
    expect(parseStoredState(raw, OPTIONS).state.missionDay).toBe(150);
  });

  it('drops damaged entries and keeps the good ones', () => {
    const good = liveRecord('A', 30);
    const raw = JSON.stringify({
      version: STORAGE_VERSION,
      missionDay: 30,
      records: [
        good,
        { ...good, flightDay: 90, origin: 'precomputed' },
        { ...good, flightDay: 90, crewId: 'Z' },
        { ...good, flightDay: 90, assessment: null },
        { ...good, flightDay: 90, eyes: { OD: good.eyes.OD } },
        good,
        'not a record',
      ],
      drafts: {
        'B:90': startDraft('B', 90),
        bad: { ...startDraft('B', 30), stepIndex: 99 },
        worse: null,
      },
      questions: { 'B:30': ['ok'], 'B:90': [1, 2], nonsense: ['x'] },
    });
    const { state, status } = parseStoredState(raw, OPTIONS);
    expect(status).toBe('loaded');
    expect(state.records).toEqual([good]);
    expect(Object.keys(state.drafts)).toEqual(['B:90']);
    expect(state.questions).toEqual({ 'B:30': ['ok'] });
  });
});

describe('store', () => {
  it('persists every change and restores it in a new store', () => {
    const storage = memoryStorage();
    const store = createAppStore(storage, OPTIONS);
    expect(store.loadStatus).toBe('empty');
    store.update((state) => withMissionDay(state, 30));
    store.update((state) => withRecord(state, liveRecord('A', 30)));
    expect(store.isPersistent()).toBe(true);

    const restored = createAppStore(storage, OPTIONS);
    expect(restored.loadStatus).toBe('loaded');
    expect(restored.getState()).toEqual(store.getState());
  });

  it('notifies subscribers once per real change', () => {
    const store = createAppStore(memoryStorage(), OPTIONS);
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    store.update((state) => withMissionDay(state, 90));
    store.update((state) => withMissionDay(state, 90));
    expect(calls).toBe(1);
    unsubscribe();
    store.update((state) => withMissionDay(state, 30));
    expect(calls).toBe(1);
  });

  it('clears what was saved but stays on the chosen mission day', () => {
    const storage = memoryStorage();
    const store = createAppStore(storage, OPTIONS);
    store.update((state) => withRecord(withMissionDay(state, 90), liveRecord('A', 30)));
    store.clear();
    expect(store.getState()).toEqual({ ...emptyState(OPTIONS), missionDay: 90 });
    expect(createAppStore(storage, OPTIONS).getState().records).toEqual([]);
  });

  it('picks up a change made by another tab on reload', () => {
    const storage = memoryStorage();
    const here = createAppStore(storage, OPTIONS);
    const there = createAppStore(storage, OPTIONS);
    there.update((state) => withMissionDay(state, 30));
    expect(here.getState().missionDay).toBe(150);
    here.reload();
    expect(here.getState().missionDay).toBe(30);
  });

  it('keeps working in memory without a storage, and says it is not persistent', () => {
    const store = createAppStore(null, OPTIONS);
    store.update((state) => withMissionDay(state, 30));
    expect(store.getState().missionDay).toBe(30);
    expect(store.isPersistent()).toBe(false);
  });

  it('survives a storage that throws on every call', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const store = createAppStore(broken, OPTIONS);
    expect(store.loadStatus).toBe('empty');
    store.update((state) => withMissionDay(state, 90));
    store.clear();
    expect(store.getState().missionDay).toBe(90);
    expect(store.isPersistent()).toBe(false);
  });

  it('ignores a stored payload of another version and overwrites it on the next change', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: 0, anything: true }) });
    const store = createAppStore(storage, OPTIONS);
    expect(store.loadStatus).toBe('discarded');
    store.update((state) => withMissionDay(state, 30));
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}').version).toBe(STORAGE_VERSION);
  });
});
