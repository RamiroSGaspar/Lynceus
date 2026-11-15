import { describe, expect, it } from 'vitest';
import type { SessionRecord } from '@app/core';
import { makeUnmeasuredCapture } from '../sample/exams';
import { assessSession, getHistory } from './core';
import {
  baselineOf,
  changePoints,
  findRecord,
  historyBefore,
  inFlightControls,
  lastControl,
  mergeHistory,
} from './history';

const days = (records: readonly SessionRecord[]): number[] => records.map((record) => record.flightDay);
const relabel = (record: SessionRecord, questions: string[] = []): SessionRecord => ({ ...record, origin: 'live', questions });

describe('mergeHistory', () => {
  const full = getHistory('B', 151);
  const day = (flightDay: number): SessionRecord => findRecord(full, flightDay) as SessionRecord;

  it('shows what comes with the application before the chosen day', () => {
    expect(days(mergeHistory(getHistory('B', 90), [], 'B', 90))).toEqual([0, 30]);
    expect(days(mergeHistory(getHistory('B', 150), [], 'B', 150))).toEqual([0, 30, 90]);
  });

  it('adds the controls done in this browser up to the chosen day, in order', () => {
    const live = [relabel(day(150)), relabel(day(90))];
    expect(days(mergeHistory(getHistory('B', 150), live, 'B', 150))).toEqual([0, 30, 90, 150]);
    const atDay90 = mergeHistory(getHistory('B', 90), live, 'B', 90);
    expect(days(atDay90)).toEqual([0, 30, 90]);
    expect(atDay90.at(-1)?.origin).toBe('live');
  });

  it('prefers the control done here over the one of the same day that comes with the application', () => {
    const live = relabel(day(30), ['mine']);
    const merged = mergeHistory(getHistory('B', 150), [live], 'B', 150);
    expect(days(merged)).toEqual([0, 30, 90]);
    expect(findRecord(merged, 30)).toBe(live);
    expect(findRecord(merged, 90)?.origin).toBe('precomputed');
  });

  it('ignores controls of other crew members and never replaces the pre-flight exam', () => {
    const other = relabel(findRecord(getHistory('A', 151), 30) as SessionRecord);
    const fakeBaseline = relabel(day(0));
    const merged = mergeHistory(getHistory('B', 150), [other, fakeBaseline], 'B', 150);
    expect(merged.every((record) => record.crewId === 'B')).toBe(true);
    expect(baselineOf(merged)?.origin).toBe('precomputed');
  });

  it('does not change its inputs', () => {
    const precomputed = getHistory('B', 150);
    const before = days(precomputed);
    mergeHistory(precomputed, [relabel(day(150))], 'B', 150);
    expect(days(precomputed)).toEqual(before);
  });
});

describe('history helpers', () => {
  const history = getHistory('C', 151);

  it('gives the assessment only what happened strictly before a control', () => {
    expect(days(historyBefore(history, 90))).toEqual([0, 30]);
    expect(days(historyBefore(history, 0))).toEqual([]);
  });

  it('finds the pre-flight exam, a given control and the last in-flight control', () => {
    expect(baselineOf(history)?.flightDay).toBe(0);
    expect(findRecord(history, 90)?.flightDay).toBe(90);
    expect(findRecord(history, 91)).toBeNull();
    expect(lastControl(history)?.flightDay).toBe(150);
    expect(lastControl(historyBefore(history, 30))).toBeNull();
    expect(days(inFlightControls(history))).toEqual([30, 90, 150]);
  });
});

describe('changePoints', () => {
  it('lists the change of one eye at every in-flight control, with its range', () => {
    const points = changePoints(getHistory('B', 151), 'OD');
    expect(points.map((point) => point.flightDay)).toEqual([30, 90, 150]);
    for (const point of points) {
      expect(point.measured).toBe(true);
      expect(point.change?.unit).toBe('µm');
      expect(point.change?.interval95).toBeDefined();
      expect(point.level).not.toBeNull();
    }
    expect(points.map((point) => point.change?.value)).toEqual([15, 24, 31]);
  });

  it('marks a control without measurement apart, without a number', () => {
    const history = getHistory('A', 150);
    const eyes = {
      OD: makeUnmeasuredCapture('A', 'OD', 150),
      OS: (findRecord(getHistory('A', 151), 150) as SessionRecord).eyes.OS,
    };
    const assessment = assessSession({ crewId: 'A', flightDay: 150, eyes, vision: null, history });
    const live: SessionRecord = { crewId: 'A', flightDay: 150, origin: 'live', eyes, vision: null, assessment, questions: [] };
    const points = changePoints(mergeHistory(history, [live], 'A', 150), 'OD');
    expect(points.at(-1)).toEqual({ eye: 'OD', flightDay: 150, origin: 'live', measured: false, level: null, change: null });
    expect(changePoints(mergeHistory(history, [live], 'A', 150), 'OS').at(-1)?.measured).toBe(true);
  });
});
