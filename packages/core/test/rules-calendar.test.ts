import { describe, expect, it } from 'vitest';
import {
  assessSession,
  MISSION,
  planFollowUp,
  type NextStepId,
  type SessionAssessment,
  type SessionRecord,
} from '../src/index';
import { BASE, eyesWithChange, inFlight, measured, notMeasured, preflight, vision } from './helpers/fixtures';

const pre = preflight();

/** One in-flight session with the given ring changes and no earlier in-flight control. */
function at(flightDay: number, change: { OD: number; OS: number }, history: SessionRecord[] = [pre]): SessionAssessment {
  return inFlight(flightDay, change, history).assessment;
}

const stepIds = (assessment: SessionAssessment): NextStepId[] => assessment.nextSteps.map((step) => step.id);
const stepOf = (assessment: SessionAssessment, id: NextStepId) => assessment.nextSteps.find((step) => step.id === id)!;

const NO_CHANGE = { OD: 5, OS: 3 };
const FIRST_SIGN = { OD: 30, OS: 3 };
const CONCERNING = { OD: 70, OS: 30 };

describe('next tomography: the four rows of the follow-up table', () => {
  it('no detectable change: next routine day, Amsler grid at each control', () => {
    const assessment = at(30, NO_CHANGE);
    expect(assessment.nextOct).toEqual({ flightDay: 90, reason: 'routine' });
    expect(assessment.amslerPerWeek).toBe(0);
    expect(assessment.contact).toBe('routine-report');
    expect(stepIds(assessment)).toEqual(['oct-routine', 'amsler-at-controls', 'report-routine']);
    expect(stepOf(assessment, 'oct-routine').params).toEqual({ flightDay: 90, inDays: 60, routineDays: '30,90,150' });
    expect(stepOf(assessment, 'oct-routine').basis).toBe('nasa');
    expect(at(90, NO_CHANGE).nextOct).toEqual({ flightDay: 150, reason: 'routine' });
  });

  it('first sign: 28 days later, Amsler grid twice a week, in the routine report', () => {
    const assessment = at(90, FIRST_SIGN);
    expect(assessment.level).toBe('first-sign');
    expect(assessment.nextOct).toEqual({ flightDay: 118, reason: 'first-sign' });
    expect(assessment.amslerPerWeek).toBe(2);
    expect(assessment.contact).toBe('routine-report');
    expect(stepIds(assessment)).toEqual(['oct-in-4-weeks', 'amsler-twice-a-week', 'report-routine']);
    expect(stepOf(assessment, 'oct-in-4-weeks').params).toEqual({
      flightDay: 118,
      inDays: 28,
      intervalDays: 28,
      targetFlightDay: 118,
    });
    expect(stepOf(assessment, 'oct-in-4-weeks').basis).toBe('assumption');
    expect(stepOf(assessment, 'amsler-twice-a-week').basis).toBe('assumption');
    expect(stepOf(assessment, 'report-routine').basis).toBe('nasa');
  });

  it('clinically concerning: 21 days later, Amsler grid three times a week, surgeon told without delay', () => {
    const assessment = at(30, CONCERNING);
    expect(assessment.level).toBe('clinically-concerning');
    expect(assessment.nextOct).toEqual({ flightDay: 51, reason: 'clinically-concerning' });
    expect(assessment.amslerPerWeek).toBe(3);
    expect(assessment.contact).toBe('without-delay');
    expect(stepIds(assessment)).toEqual(['notify-surgeon-without-delay', 'oct-in-3-weeks', 'amsler-three-times-a-week']);
    expect(stepOf(assessment, 'oct-in-3-weeks').params).toMatchObject({ flightDay: 51, inDays: 21, intervalDays: 21 });
    expect(stepOf(assessment, 'notify-surgeon-without-delay').basis).toBe('assumption');
  });

  it('an eye without a result: within 7 days, with the Amsler grid of the level that applies', () => {
    const assessment = assessSession({
      crewId: 'B',
      flightDay: 30,
      eyes: { OD: measured('OD', { trt: BASE.OD.trt + 30 }), OS: notMeasured('OS') },
      vision: vision(),
      history: [pre],
    });
    expect(assessment.nextOct).toEqual({ flightDay: 37, reason: 'not-measured' });
    expect(assessment.amslerPerWeek).toBe(2);
    expect(stepIds(assessment)).toEqual(['oct-repeat-soon', 'amsler-twice-a-week', 'report-routine']);
    expect(stepOf(assessment, 'oct-repeat-soon').params).toEqual({ flightDay: 37, inDays: 7, maxDays: 7, eyes: 'OS' });
    expect(stepOf(assessment, 'oct-repeat-soon').basis).toBe('assumption');
  });
});

describe('next tomography: joined with the routine calendar', () => {
  it('takes a routine day that falls up to 7 days after the computed date', () => {
    const day58 = at(58, FIRST_SIGN);
    expect(day58.nextOct).toEqual({ flightDay: 90, reason: 'first-sign' });
    expect(stepOf(day58, 'oct-in-4-weeks').params).toEqual({ flightDay: 90, inDays: 32, intervalDays: 28, targetFlightDay: 86 });
    expect(at(118, FIRST_SIGN).nextOct).toEqual({ flightDay: 150, reason: 'first-sign' });
    // Day 55 + 28 = 83: the routine day 90 is exactly 7 days later.
    expect(at(55, FIRST_SIGN).nextOct?.flightDay).toBe(90);
    // Day 54 + 28 = 82: the routine day 90 is 8 days later, too far to wait for.
    expect(at(54, FIRST_SIGN).nextOct?.flightDay).toBe(82);
  });

  it('never skips a routine day that comes before the computed date', () => {
    // Day 72 + 21 = 93, but the routine control of day 90 comes first.
    expect(at(72, CONCERNING).nextOct).toEqual({ flightDay: 90, reason: 'clinically-concerning' });
    expect(at(132, CONCERNING).nextOct?.flightDay).toBe(150);
    expect(at(10, FIRST_SIGN).nextOct?.flightDay).toBe(30);
  });

  it('does not push the repeat of an unmeasured eye beyond 7 days', () => {
    const plan = (flightDay: number) => planFollowUp(flightDay, ['no-detectable-change', null], null, true);
    expect(plan(85).nextOct).toEqual({ flightDay: 90, reason: 'not-measured' });
    expect(plan(80).nextOct).toEqual({ flightDay: 87, reason: 'not-measured' });
    expect(plan(83).nextOct).toEqual({ flightDay: 90, reason: 'not-measured' });
  });
});

describe('next tomography: end of the mission', () => {
  it('is null when there is no routine day left, and the next exams are after the flight', () => {
    const assessment = at(150, NO_CHANGE);
    expect(assessment.nextOct).toBeNull();
    expect(stepIds(assessment)).toEqual(['report-routine', 'post-flight-exams']);
    expect(stepOf(assessment, 'post-flight-exams').params).toEqual({ missionDays: 180 });
    expect(stepOf(assessment, 'post-flight-exams').basis).toBe('nasa');
  });

  it('keeps a date up to the last day of the mission and drops one beyond it', () => {
    expect(MISSION.durationDays).toBe(180);
    expect(at(150, FIRST_SIGN).nextOct).toEqual({ flightDay: 178, reason: 'first-sign' });
    expect(at(152, FIRST_SIGN).nextOct).toEqual({ flightDay: 180, reason: 'first-sign' });
    expect(at(159, CONCERNING).nextOct).toEqual({ flightDay: 180, reason: 'clinically-concerning' });

    const beyond = at(153, FIRST_SIGN);
    expect(beyond.nextOct).toBeNull();
    expect(beyond.amslerPerWeek).toBe(2);
    expect(stepIds(beyond)).toEqual(['amsler-twice-a-week', 'report-routine', 'post-flight-exams']);
    expect(stepOf(beyond, 'post-flight-exams').params).toEqual({ missionDays: 180, targetFlightDay: 181 });
    expect(at(160, CONCERNING).nextOct).toBeNull();
    expect(planFollowUp(175, [null, null], null, true).nextOct).toBeNull();
  });
});

describe('next tomography: the closer follow-up is kept for one more control', () => {
  const day30 = inFlight(30, FIRST_SIGN, [pre]);
  const day58 = inFlight(58, NO_CHANGE, [pre, day30]);
  const day90 = inFlight(90, NO_CHANGE, [pre, day30, day58]);

  it('uses the higher imaging level of this control and the previous one', () => {
    expect(day30.assessment.nextOct).toEqual({ flightDay: 58, reason: 'first-sign' });
    // Day 58 shows no detectable change, but the control before it showed a first sign.
    expect(day58.assessment.level).toBe('no-detectable-change');
    expect(day58.assessment.alert).toBe('none');
    expect(day58.assessment.nextOct).toEqual({ flightDay: 90, reason: 'first-sign' });
    expect(day58.assessment.amslerPerWeek).toBe(2);
    expect(stepOf(day58.assessment, 'oct-in-4-weeks').params).toMatchObject({ sustainedFromFlightDay: 30 });
    expect(stepOf(day58.assessment, 'amsler-twice-a-week').params).toEqual({ perWeek: 2, sustainedFromFlightDay: 30 });
  });

  it('goes back to the routine calendar after two controls without a sign', () => {
    expect(day90.assessment.nextOct).toEqual({ flightDay: 150, reason: 'routine' });
    expect(day90.assessment.amslerPerWeek).toBe(0);
    expect(stepIds(day90.assessment)).toEqual(['oct-routine', 'amsler-at-controls', 'report-routine']);
  });

  it('keeps the clinically concerning follow-up when the next control is only a first sign', () => {
    const concerning = inFlight(30, CONCERNING, [pre]);
    const after = inFlight(51, FIRST_SIGN, [pre, concerning]);
    expect(after.assessment.level).toBe('first-sign');
    expect(after.assessment.contact).toBe('routine-report');
    expect(after.assessment.nextOct).toEqual({ flightDay: 72, reason: 'clinically-concerning' });
    expect(after.assessment.amslerPerWeek).toBe(3);
    expect(stepIds(after.assessment)).toEqual(['oct-in-3-weeks', 'amsler-three-times-a-week', 'report-routine']);
  });

  it('looks only at the control just before, whatever the order and the content of the history given', () => {
    const later = inFlight(150, CONCERNING, [pre]);
    const otherCrew = inFlight(60, CONCERNING, [preflight('C')], 'C');
    const shuffled = [day58, later, pre, otherCrew, day30];
    const assessment = assessSession({
      crewId: 'B',
      flightDay: 90,
      eyes: eyesWithChange(NO_CHANGE, {}, 90),
      vision: vision(),
      history: shuffled,
    });
    expect(assessment).toEqual(day90.assessment);
    expect(shuffled.map((r) => r.flightDay)).toEqual([58, 150, 0, 60, 30]);
  });

  it('reports the change since the previous control of each eye', () => {
    expect(day30.assessment.eyes.OD.sincePrevious).toBeNull();
    const since = day58.assessment.eyes.OD.sincePrevious!;
    expect(since.flightDay).toBe(30);
    expect(since.trtRingUm).toMatchObject({ value: -25, unit: 'µm', origin: 'derived' });
    expect(since.trtRingUm.standardError).toBeCloseTo(Math.sqrt(18), 12);
    expect(since.trtRingUm.interval95?.[0]).toBeCloseTo(-25 - 1.96 * Math.sqrt(18), 12);
    expect(day90.assessment.eyes.OS.sincePrevious?.flightDay).toBe(58);
  });

  it('skips a control where that eye had no result', () => {
    const blind = assessSession({
      crewId: 'B',
      flightDay: 58,
      eyes: { OD: notMeasured('OD', undefined, undefined, 58), OS: measured('OS', { trt: BASE.OS.trt + 3 }, 58) },
      vision: vision(),
      history: [pre, day30],
    });
    const day58Blind: SessionRecord = { ...day58, assessment: blind, eyes: { ...day58.eyes, OD: notMeasured('OD', undefined, undefined, 58) } };
    const next = inFlight(65, NO_CHANGE, [pre, day30, day58Blind]);
    expect(next.assessment.eyes.OD.sincePrevious?.flightDay).toBe(30);
    expect(next.assessment.eyes.OS.sincePrevious?.flightDay).toBe(58);
  });
});

describe('the pre-flight session', () => {
  it('is the reference: nothing to compare, first routine day next', () => {
    const { assessment } = pre;
    expect(assessment.flightDay).toBe(0);
    expect(assessment.level).toBe('no-detectable-change');
    for (const eye of ['OD', 'OS'] as const) {
      expect(assessment.eyes[eye]).toMatchObject({ measured: true, level: 'no-detectable-change', change: null, thresholds: [], borderline: false });
    }
    expect(assessment.nextOct).toEqual({ flightDay: 30, reason: 'routine' });
    expect(assessment.findings).toEqual([]);
  });
});
