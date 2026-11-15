import { describe, expect, it } from 'vitest';
import { makeExamSummary, makeMeasuredCapture, makeUnmeasuredCapture } from '../sample/exams';
import { SAMPLE_CALIBRATION, makeAcuity, makeAmsler, makeSymptomAnswers } from '../sample/vision';
import { assessSession, getHistory } from './core';
import {
  STEP_IDS,
  applyEvent,
  buildRecord,
  calibrationOf,
  capturedEyes,
  currentStep,
  sessionKey,
  startDraft,
  stepHasOutcome,
  stepStatus,
  visionOf,
  type DraftEvent,
  type SessionDraft,
} from './session';

const acuity = { calibration: SAMPLE_CALIBRATION, OD: makeAcuity('OD', 0.1), OS: makeAcuity('OS', 0.0) };
const amsler = { OD: makeAmsler('OD'), OS: makeAmsler('OS') };
const symptoms = makeSymptomAnswers();
const capture = (eye: 'OD' | 'OS') =>
  makeMeasuredCapture('B', makeExamSummary({ crewId: 'B', eye, flightDay: 150, trtRingUm: 420 }), 150);

function run(events: DraftEvent[], from: SessionDraft = startDraft('B', 150)): SessionDraft {
  return events.reduce(applyEvent, from);
}

const COMPLETE: DraftEvent[] = [
  { type: 'begin' },
  { type: 'symptoms', value: symptoms },
  { type: 'acuity', value: acuity },
  { type: 'amsler', value: amsler },
  { type: 'eye', value: capture('OD') },
  { type: 'eye', value: capture('OS') },
];

describe('guided session', () => {
  it('has seven steps: function first, image after, evaluation last', () => {
    expect(STEP_IDS).toEqual(['intro', 'symptoms', 'acuity', 'amsler', 'oct-od', 'oct-os', 'evaluation']);
  });

  it('starts at the presentation with nothing done', () => {
    const draft = startDraft('B', 150);
    expect(currentStep(draft)).toBe('intro');
    expect(STEP_IDS.map((_, index) => stepStatus(draft, index))).toEqual([
      'current',
      'upcoming',
      'upcoming',
      'upcoming',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
    expect(capturedEyes(draft)).toBeNull();
  });

  it('walks the seven steps in order and ends ready to be assessed', () => {
    const steps = [startDraft('B', 150)];
    for (const event of COMPLETE) steps.push(applyEvent(steps.at(-1) as SessionDraft, event));
    expect(steps.map(currentStep)).toEqual([...STEP_IDS]);
    const done = steps.at(-1) as SessionDraft;
    expect(STEP_IDS.map((_, index) => stepStatus(done, index))).toEqual([
      'done',
      'done',
      'done',
      'done',
      'done',
      'done',
      'current',
    ]);
    expect(capturedEyes(done)).not.toBeNull();
    expect(calibrationOf(done)).toEqual(SAMPLE_CALIBRATION);
  });

  it('records a skipped test as not done instead of forgetting it', () => {
    const draft = run([
      { type: 'begin' },
      { type: 'symptoms', value: null },
      { type: 'acuity', value: null },
      { type: 'amsler', value: amsler },
    ]);
    expect(stepStatus(draft, 1)).toBe('skipped');
    expect(stepStatus(draft, 2)).toBe('skipped');
    expect(stepStatus(draft, 3)).toBe('done');
    expect(stepHasOutcome(draft, 'symptoms')).toBe(true);
    expect(calibrationOf(draft)).toBeNull();
    expect(visionOf(draft)).toEqual({
      calibration: null,
      acuity: { OD: null, OS: null },
      amsler,
      symptoms: null,
    });
  });

  it('ignores an event that does not belong to the step on screen', () => {
    const atSymptoms = run([{ type: 'begin' }]);
    expect(applyEvent(atSymptoms, { type: 'amsler', value: amsler })).toBe(atSymptoms);
    expect(applyEvent(atSymptoms, { type: 'eye', value: capture('OD') })).toBe(atSymptoms);
    expect(applyEvent(atSymptoms, { type: 'begin' })).toBe(atSymptoms);
    expect(applyEvent(atSymptoms, { type: 'continue' })).toBe(atSymptoms);
    const atRightEye = run(COMPLETE.slice(0, 4));
    expect(applyEvent(atRightEye, { type: 'eye', value: capture('OS') })).toBe(atRightEye);
  });

  it('does not advance past the last step, so a repeated callback is harmless', () => {
    const done = run(COMPLETE);
    expect(applyEvent(done, { type: 'eye', value: capture('OS') })).toBe(done);
    expect(done.stepIndex).toBe(STEP_IDS.length - 1);
  });

  it('goes back one step, keeps what was done and lets it continue or be redone', () => {
    const atAmsler = run(COMPLETE.slice(0, 3));
    const back = applyEvent(atAmsler, { type: 'back' });
    expect(currentStep(back)).toBe('acuity');
    expect(back.acuity).toEqual({ status: 'done', value: acuity });
    expect(currentStep(applyEvent(back, { type: 'continue' }))).toBe('amsler');
    const redone = applyEvent(back, { type: 'acuity', value: null });
    expect(redone.acuity).toEqual({ status: 'skipped' });
    expect(currentStep(redone)).toBe('amsler');
    expect(applyEvent(startDraft('B', 150), { type: 'back' }).stepIndex).toBe(0);
  });

  it('builds the record of a control done here, with the eyes that could not be measured too', () => {
    const history = getHistory('B', 150);
    const draft = run([
      ...COMPLETE.slice(0, 5),
      { type: 'eye', value: makeUnmeasuredCapture('B', 'OS', 150) },
    ]);
    const eyes = capturedEyes(draft);
    expect(eyes).not.toBeNull();
    if (!eyes) return;
    const assessment = assessSession({ crewId: 'B', flightDay: 150, eyes, vision: visionOf(draft), history });
    const record = buildRecord(draft, assessment);
    expect(record).toMatchObject({ crewId: 'B', flightDay: 150, origin: 'live', questions: [] });
    expect(record?.eyes.OS.accepted).toBeNull();
    expect(record?.assessment.eyes.OS.measured).toBe(false);
    expect(buildRecord(startDraft('B', 150), assessment)).toBeNull();
  });

  it('keys a control by crew member and flight day', () => {
    expect(sessionKey('C', 90)).toBe('C:90');
  });
});
