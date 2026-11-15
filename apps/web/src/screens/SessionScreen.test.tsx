import { describe, expect, it, vi } from 'vitest';
import type { CrewId, ExamSummary, Eye, ScreenCalibration } from '@app/core';
import { getHistory } from '../app/core';
import { baselineOf } from '../app/history';
import { STEP_IDS, applyEvent, startDraft, type DraftEvent, type SessionDraft } from '../app/session';
import { withDraft, withMissionDay, withRecord } from '../app/store';
import { SAMPLE_CALIBRATION, makeAcuity, makeSymptomAnswers } from '../sample/vision';
import { makeExamSummary, makeMeasuredCapture, makeUnmeasuredCapture } from '../sample/exams';
import { sampleRecord } from '../testing/fixtures';
import { LOCALES, renderHtml, testStore, textOf, unfilledPlaceholders } from '../testing/render';
import { SessionScreen } from './SessionScreen';

/**
 * The pieces other people build are replaced by markers that show what the
 * session hands them. They have their own tests; these are about the session.
 */
vi.mock('../slots', () => ({
  SymptomsStep: () => <h1 data-slot="symptoms">symptoms step</h1>,
  AcuityStep: () => <h1 data-slot="acuity">acuity step</h1>,
  AmslerStep: ({ calibration }: { calibration: ScreenCalibration | null }) => (
    <h1 data-slot="amsler" data-calibration={calibration ? String(calibration.pxPerMm) : 'none'}>
      amsler step
    </h1>
  ),
  // The real capture step opens with a second-level heading: the session gives it the screen title.
  OctCaptureStep: (props: { crewId: CrewId; eye: Eye; flightDay: number; baseline: ExamSummary }) => (
    <h2
      data-slot="oct"
      data-crew={props.crewId}
      data-eye={props.eye}
      data-day={props.flightDay}
      data-baseline={props.baseline.examId}
      data-baseline-eye={props.baseline.eye}
    >
      capture step
    </h2>
  ),
  AssistantPanel: () => null,
  ExamViewer: () => null,
}));

const BASELINE = baselineOf(getHistory('B', 150));
if (!BASELINE?.eyes.OD.accepted || !BASELINE.eyes.OS.accepted) {
  throw new Error('The pre-flight exam of the sample crew member is missing');
}
const BASELINE_OD = BASELINE.eyes.OD.accepted;
const BASELINE_OS = BASELINE.eyes.OS.accepted;

const EVENTS: DraftEvent[] = [
  { type: 'begin' },
  { type: 'symptoms', value: makeSymptomAnswers() },
  { type: 'acuity', value: { calibration: SAMPLE_CALIBRATION, OD: makeAcuity('OD', 0.1), OS: makeAcuity('OS', 0.1) } },
  { type: 'amsler', value: null },
  {
    type: 'eye',
    value: makeMeasuredCapture('B', makeExamSummary({ crewId: 'B', eye: 'OD', flightDay: 150, trtRingUm: 423 }), 150),
  },
  { type: 'eye', value: makeUnmeasuredCapture('B', 'OS', 150) },
];

/** The control of crew member B on flight day 150 after the first `count` steps. */
function draftAfter(count: number, events: DraftEvent[] = EVENTS): SessionDraft {
  return events.slice(0, count).reduce(applyEvent, startDraft('B', 150));
}

function render(draft: SessionDraft | null, locale: 'en' | 'es' = 'en'): string {
  return renderHtml(<SessionScreen crewId="B" />, locale, testStore((state) => (draft ? withDraft(state, draft) : state)));
}

const attribute = (html: string, name: string): string | undefined => html.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const currentStepOf = (html: string): string | undefined =>
  html.match(/aria-current="step"[^>]*>[\s\S]*?<span class="steps__number">(\d)/)?.[1];

describe('guided session', () => {
  it.each(LOCALES)('opens in %s on the presentation: what, how long and against what', (locale) => {
    const html = render(null, locale);
    const text = textOf(html);
    expect(text).toContain('Elena Voss');
    expect(html.match(/class="steps__item /g)).toHaveLength(STEP_IDS.length);
    expect(currentStepOf(html)).toBe('1');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(text).toMatch(locale === 'en' ? /About 10 minutes/ : /Unos 10 minutos/);
    expect(text).toMatch(
      locale === 'en' ? /your own pre-flight exam, taken on/ : /tu propio examen de antes del vuelo, tomado el/,
    );
    expect(text).toMatch(locale === 'en' ? /not a diagnosis/ : /no un diagnóstico/);
    expect(unfilledPlaceholders(html)).toEqual([]);
  });

  it('puts the seven steps on screen one at a time, in NASA’s order', () => {
    const slots = [null, 'symptoms', 'acuity', 'amsler', 'oct', 'oct'];
    slots.forEach((slot, done) => {
      const html = render(draftAfter(done));
      expect(currentStepOf(html)).toBe(String(done + 1));
      expect(attribute(html, 'data-slot') ?? null).toBe(slot);
      expect(html.match(/<h1/g), `step ${done + 1}`).toHaveLength(1);
    });
  });

  it('hands the Amsler grid the calibration of the acuity test, or none when that test was skipped', () => {
    expect(attribute(render(draftAfter(3)), 'data-calibration')).toBe(String(SAMPLE_CALIBRATION.pxPerMm));
    const skipped: DraftEvent[] = [{ type: 'begin' }, { type: 'symptoms', value: null }, { type: 'acuity', value: null }];
    expect(attribute(render(draftAfter(3, skipped)), 'data-calibration')).toBe('none');
  });

  it('hands each tomography step its eye, the flight day and the pre-flight exam of that eye', () => {
    const right = render(draftAfter(4));
    expect(attribute(right, 'data-eye')).toBe('OD');
    expect(attribute(right, 'data-crew')).toBe('B');
    expect(attribute(right, 'data-day')).toBe('150');
    expect(attribute(right, 'data-baseline')).toBe(BASELINE_OD.examId);
    const left = render(draftAfter(5));
    expect(attribute(left, 'data-eye')).toBe('OS');
    expect(attribute(left, 'data-baseline')).toBe(BASELINE_OS.examId);
    expect(attribute(left, 'data-baseline-eye')).toBe('OS');
  });

  it('shows the progress in words and shapes: done, not done, current, pending', () => {
    const html = render(draftAfter(5));
    const states = [...html.matchAll(/steps__item--(\w+)/g)].map((match) => match[1]);
    expect(states).toEqual(['done', 'done', 'done', 'skipped', 'done', 'current', 'upcoming']);
    const text = textOf(html);
    expect(text).toContain('(not done)');
    expect(text).toContain('(current step)');
    expect(text).toContain('Step 6 of 7: Left eye scan');
  });

  it('resumes at the step it was on, with the way back, the way out and the way to start over', () => {
    const html = render(draftAfter(2));
    const text = textOf(html);
    expect(attribute(html, 'data-slot')).toBe('acuity');
    expect(text).toContain('Previous step');
    expect(text).toContain('Leave: what you did is saved');
    expect(text).toContain('Start this control over');
    expect(textOf(render(null))).not.toContain('Previous step');
  });

  it('asks before redoing a step that already has an outcome', () => {
    const back = applyEvent(draftAfter(3), { type: 'back' });
    const html = render(back);
    const text = textOf(html);
    expect(currentStepOf(html)).toBe('3');
    expect(attribute(html, 'data-slot')).toBeUndefined();
    expect(text).toContain('You already did this step');
    expect(text).toContain('Do this step again');
    const skippedBack = applyEvent(draftAfter(4), { type: 'back' });
    expect(textOf(render(skippedBack))).toContain('You skipped this step');
  });

  it('evaluates at the seventh step', () => {
    const html = render(draftAfter(6), 'es');
    expect(currentStepOf(html)).toBe('7');
    expect(textOf(html)).toContain('Evaluando tu control');
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it('follows the chosen mission day', () => {
    const store = testStore((state) => withMissionDay(state, 90));
    expect(textOf(renderHtml(<SessionScreen crewId="B" />, 'en', store))).toContain('Elena Voss, flight day 90');
  });

  it('does not start a second control over one that is saved without asking', () => {
    const record = sampleRecord(getHistory('B', 150), 'B', { flightDay: 150, od: 26, os: 12, origin: 'live' });
    const store = testStore((state) => withRecord(state, record));
    const html = renderHtml(<SessionScreen crewId="B" />, 'en', store);
    const text = textOf(html);
    expect(text).toContain('You already did today’s control');
    expect(html).toContain('href="#/result/B/150"');
    expect(text).toContain('Repeat the control');
    expect(text).toContain('replaces the saved control');
  });
});
