import { describe, expect, it } from 'vitest';
import type { SessionRecord } from '@app/core';
import { FIRST_SIGN_CONTROLS, sampleHistory, sampleRecord } from '../testing/fixtures';
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

/** What comes with the application for a crew member: the pre-flight exam and controls on days 30, 90 and 150. */
const FULL = sampleHistory('B', FIRST_SIGN_CONTROLS);
/** The same as the core gives it for a chosen mission day: only what is strictly before that day. */
const before = (flightDay: number): SessionRecord[] => FULL.filter((record) => record.flightDay < flightDay);
const day = (flightDay: number): SessionRecord => findRecord(FULL, flightDay) as SessionRecord;

describe('mergeHistory', () => {
  it('shows what comes with the application before the chosen day', () => {
    expect(days(mergeHistory(before(90), [], 'B', 90))).toEqual([0, 30]);
    expect(days(mergeHistory(before(150), [], 'B', 150))).toEqual([0, 30, 90]);
  });

  it('adds the controls done in this browser up to the chosen day, in order', () => {
    const live = [relabel(day(150)), relabel(day(90))];
    expect(days(mergeHistory(before(150), live, 'B', 150))).toEqual([0, 30, 90, 150]);
    const atDay90 = mergeHistory(before(90), live, 'B', 90);
    expect(days(atDay90)).toEqual([0, 30, 90]);
    expect(atDay90.at(-1)?.origin).toBe('live');
  });

  it('prefers the control done here over the one of the same day that comes with the application', () => {
    const live = relabel(day(30), ['mine']);
    const merged = mergeHistory(before(150), [live], 'B', 150);
    expect(days(merged)).toEqual([0, 30, 90]);
    expect(findRecord(merged, 30)).toBe(live);
    expect(findRecord(merged, 90)?.origin).toBe('precomputed');
  });

  it('ignores controls of other crew members and never replaces the pre-flight exam', () => {
    const other = relabel(findRecord(sampleHistory('A', FIRST_SIGN_CONTROLS), 30) as SessionRecord);
    const fakeBaseline = relabel(day(0));
    const merged = mergeHistory(before(150), [other, fakeBaseline], 'B', 150);
    expect(merged.every((record) => record.crewId === 'B')).toBe(true);
    expect(baselineOf(merged)?.origin).toBe('precomputed');
  });

  it('does not change its inputs', () => {
    const precomputed = before(150);
    const snapshot = days(precomputed);
    mergeHistory(precomputed, [relabel(day(150))], 'B', 150);
    expect(days(precomputed)).toEqual(snapshot);
  });
});

describe('history helpers', () => {
  it('gives the assessment only what happened strictly before a control', () => {
    expect(days(historyBefore(FULL, 90))).toEqual([0, 30]);
    expect(days(historyBefore(FULL, 0))).toEqual([]);
  });

  it('finds the pre-flight exam, a given control and the last in-flight control', () => {
    expect(baselineOf(FULL)?.flightDay).toBe(0);
    expect(findRecord(FULL, 90)?.flightDay).toBe(90);
    expect(findRecord(FULL, 91)).toBeNull();
    expect(lastControl(FULL)?.flightDay).toBe(150);
    expect(lastControl(historyBefore(FULL, 30))).toBeNull();
    expect(days(inFlightControls(FULL))).toEqual([30, 90, 150]);
  });
});

describe('changePoints', () => {
  it('lists the change of one eye at every in-flight control, with its range', () => {
    const points = changePoints(FULL, 'OD');
    expect(points.map((point) => point.flightDay)).toEqual([30, 90, 150]);
    for (const point of points) {
      expect(point.measured).toBe(true);
      expect(point.change?.unit).toBe('µm');
      expect(point.change?.origin).toBe('derived');
      expect(point.change?.interval95).toBeDefined();
      expect(point.level).not.toBeNull();
    }
    expect(points.map((point) => point.change?.value)).toEqual([15, 24, 31]);
    expect(points.map((point) => point.level)).toEqual(['no-detectable-change', 'first-sign', 'first-sign']);
    expect(changePoints(FULL, 'OS').map((point) => point.change?.value)).toEqual([10, 17, 23]);
  });

  it('leaves the pre-flight exam out: it is the reference, not a change', () => {
    expect(changePoints(FULL, 'OD').some((point) => point.flightDay === 0)).toBe(false);
  });

  it('marks a control without measurement apart, without a number', () => {
    const live = sampleRecord(before(150), 'B', { flightDay: 150, od: null, os: 23, origin: 'live' });
    const merged = mergeHistory(before(150), [live], 'B', 150);
    expect(changePoints(merged, 'OD').at(-1)).toEqual({
      eye: 'OD',
      flightDay: 150,
      origin: 'live',
      measured: false,
      level: null,
      change: null,
    });
    expect(changePoints(merged, 'OS').at(-1)?.measured).toBe(true);
  });
});
