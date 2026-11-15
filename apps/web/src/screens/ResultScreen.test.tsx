import { describe, expect, it, vi } from 'vitest';
import { ENGINE_VERSION, type SessionRecord } from '@app/core';
import { CREW, explainAssessment, getHistory } from '../app/core';
import { withMissionDay, withRecord } from '../app/store';
import { makeVisionSession } from '../sample/vision';
import { sampleRecord } from '../testing/fixtures';
import { LOCALES, renderHtml, testStore, textOf, unfilledPlaceholders } from '../testing/render';
import { ResultScreen } from './ResultScreen';

/** The assistant is someone else's piece, with its own tests: here only where it is mounted and what it is given. */
vi.mock('../slots', () => ({
  ExamViewer: () => <div data-slot="viewer" />,
  AssistantPanel: ({ record }: { record: SessionRecord | null }) => (
    <button data-slot="assistant" data-record={record ? `${record.crewId}:${record.flightDay}` : 'none'}>
      assistant
    </button>
  ),
}));

const normal = (text: string): string => text.replace(/\u00a0/g, ' ');

/** A control done in this browser on flight day 150 by crew member B, on top of what comes with the application. */
function liveStore(control: Parameters<typeof sampleRecord>[2]) {
  const record = sampleRecord(getHistory('B', 150), 'B', { ...control, origin: 'live' });
  return { record, store: testStore((state) => withRecord(state, record)) };
}

describe('result screen', () => {
  it.each(LOCALES)('opens in %s for every control that comes with the application', (locale) => {
    for (const member of CREW) {
      for (const record of getHistory(member.id, 150)) {
        const html = renderHtml(<ResultScreen crewId={member.id} flightDay={record.flightDay} />, locale);
        expect(html.match(/<h1/g), `${member.id} day ${record.flightDay}`).toHaveLength(1);
        expect(unfilledPlaceholders(html)).toEqual([]);
        expect(textOf(html)).toContain(member.name);
      }
    }
  });

  it.each(LOCALES)('shows in %s the texts of the core, word for word, and writes none of its own', (locale) => {
    const record = getHistory('C', 150).at(-1) as SessionRecord;
    const explanation = explainAssessment(record.assessment, locale);
    const text = normal(textOf(renderHtml(<ResultScreen crewId="C" flightDay={record.flightDay} />, locale)));
    const expected = [
      explanation.headline,
      ...explanation.summary,
      explanation.eyes.OD.headline,
      ...explanation.eyes.OD.lines,
      explanation.eyes.OS.headline,
      ...explanation.eyes.OS.lines,
      ...explanation.nextSteps.flatMap((step) => [step.text, step.why]),
      ...explanation.limitations.map((limitation) => limitation.text),
    ];
    for (const sentence of expected) expect(text).toContain(normal(sentence));
  });

  it('puts the change number line at the centre of each eye, with both eyes on the same scale', () => {
    const { store } = liveStore({ flightDay: 150, od: 120, os: 12 });
    const html = renderHtml(<ResultScreen crewId="B" flightDay={150} />, 'en', store);
    const labels = [...html.matchAll(/<svg role="img" aria-label="([^"]*)"/g)].map((match) => normal(match[1] ?? ''));
    expect(labels).toHaveLength(2);
    expect(labels[0]).toContain('Right eye: change of +120 micrometres since your pre-flight exam');
    expect(labels[0]).toContain('“Clinically concerning” (55 µm or more)');
    expect(labels[1]).toContain('Left eye: change of +12 micrometres');
    expect(labels[1]).toContain('“Normal variation” (up to 19.4 µm)');
    expect(labels[1]).toContain('Earlier controls: flight day 30');
    // The eye that would fit the default axis is drawn on the wider one, like the other eye.
    const ticks = (svg: string): string[] => [...svg.matchAll(/change-scale__tick"[^>]*>(?:<tspan[^>]*>)?([^<]+)/g)].map((m) => m[1] ?? '');
    const [right, left] = html.split('<svg role="img"').slice(1);
    expect(ticks(left ?? '')).toEqual(ticks(right ?? ''));
    expect(ticks(left ?? '')).toContain('100');
  });

  it('says how sure each result is, with the word glued to its number, and never 0 % or 100 %', () => {
    const { store } = liveStore({ flightDay: 150, od: 26, os: 3 });
    const text = normal(textOf(renderHtml(<ResultScreen crewId="B" flightDay={150} />, 'en', store)));
    expect(text).toMatch(/Past NASA’s first-sign threshold 19\.4 µm Reference (very likely|likely) \(\d+ %\) Estimated/);
    expect(text).toMatch(/At or past NASA’s clinically concerning threshold 55 µm Reference unlikely \(less than 1 %\)/);
    expect(text).not.toMatch(/\(0 %\)|\(100 %\)/);
    expect(text).toContain('Capture quality');
    expect(text).toContain('48 of 48 scans usable');
    expect(text).toContain('below 15 dB the signal is poor');
    expect(text).toContain('provisional error model');
  });

  it('gives every measured value its unit and how it was obtained', () => {
    const { store } = liveStore({ flightDay: 150, od: 26, os: 3 });
    const text = normal(textOf(renderHtml(<ResultScreen crewId="B" flightDay={150} />, 'en', store)));
    expect(text).toMatch(/ring from 0 to 250 µm \(main measure\) \d+ µm Measured \d+ µm Measured \+26 µm \(\+?\d+ to \+\d+\) Calculated/);
    expect(text).toContain('Minimum rim width of the optic nerve head');
    expect(text).toContain('Roughness of the membrane under the retina (folds)');
    expect(text).toContain('Attempt 1: measured');
    expect(text).toMatch(/Analysis: .+\. Rules: rules-.+\. Error model: .+\./);
  });

  it('says first, and without numbers, when an eye could not be measured, with the reason of each attempt', () => {
    const { record, store } = liveStore({ flightDay: 150, od: 26, os: null });
    const html = renderHtml(<ResultScreen crewId="B" flightDay={150} />, 'en', store);
    const text = normal(textOf(html));
    const explanation = explainAssessment(record.assessment, 'en');
    expect(text).toContain(explanation.eyes.OS.headline);
    for (const line of explanation.eyes.OS.lines) expect(text).toContain(normal(line));
    expect(text).toContain('Could not be measured');
    // Only the measured eye has a number line and a "how sure" block.
    expect(html.match(/<svg role="img"/g)).toHaveLength(1);
    expect(html.match(/class="sure"/g)).toHaveLength(1);
    expect(text).toContain('Attempt 3: could not be measured');
    expect(text).toContain('too few scans were good enough to measure');
    expect(text).toContain('the scan was not centred on the optic nerve');
  });

  it('shows "could not be measured", never "no detectable change", when no eye was measured', () => {
    const { record, store } = liveStore({ flightDay: 150, od: null, os: null, vision: null });
    expect(record.assessment.level).toBeNull();
    const html = renderHtml(<ResultScreen crewId="B" flightDay={150} />, 'en', store);
    const text = textOf(html);
    expect(text).toContain('Could not be measured');
    expect(text).not.toContain('No detectable change');
    expect(html).not.toContain('<svg role="img"');
  });

  it('compares the vision tests with the pre-flight ones, and says what was not done', () => {
    const skipped = liveStore({ flightDay: 150, od: 3, os: 3, vision: makeVisionSession({ acuity: null, amsler: null, symptoms: null }) });
    const text = normal(textOf(renderHtml(<ResultScreen crewId="B" flightDay={150} />, 'en', skipped.store)));
    expect(text.match(/Not done in this control/g)).toHaveLength(5);

    const done = liveStore({
      flightDay: 150,
      od: 3,
      os: 3,
      vision: makeVisionSession({
        acuity: { OD: 0.3, OS: 0.04 },
        amsler: { OD: [{ col: 2, row: 3, kind: 'wavy' }], OS: [] },
        symptoms: { headache: { present: true, severity: 'mild' } },
      }),
    });
    const shown = normal(textOf(renderHtml(<ResultScreen crewId="B" flightDay={150} />, 'en', done.store)));
    expect(shown).toMatch(/Near visual acuity, right eye 0\.30 logMAR Reported by you 0\.06 logMAR Reported by you \+0\.24 logMAR/);
    expect(shown).toContain('Marked: 0.3 % of the grid');
    expect(shown).toContain('Headache: mild');
    expect(shown).toContain('one line of difference (0.1) is not a change');
    expect(shown).not.toContain('Not done in this control');
  });

  it('marks each next step as NASA practice or as this tool’s own rule', () => {
    const { record, store } = liveStore({ flightDay: 150, od: 26, os: 3 });
    const html = renderHtml(<ResultScreen crewId="B" flightDay={150} />, 'en', store);
    const steps = record.assessment.nextSteps;
    expect(steps.some((step) => step.basis === 'assumption')).toBe(true);
    expect(html.match(/basis-tag--assumption/g)).toHaveLength(steps.filter((step) => step.basis === 'assumption').length);
    expect(html.match(/basis-tag--nasa/g) ?? []).toHaveLength(steps.filter((step) => step.basis === 'nasa').length);
    expect(textOf(html)).toContain('This tool’s own rule, not NASA’s');
  });

  it('leads on to the medical conference, the history, the brain screen and the assistant', () => {
    const html = renderHtml(<ResultScreen crewId="C" flightDay={118} />, 'en');
    expect(html).toContain('href="#/report/C/118"');
    expect(html).toContain('href="#/history/C"');
    expect(html).toContain('href="#/brain"');
    expect(html).toContain('href="#/"');
    expect(html).toContain('data-record="C:118"');
  });

  it('shows the pre-flight exam as the reference: no level, no change', () => {
    const html = renderHtml(<ResultScreen crewId="B" flightDay={0} />, 'en');
    const text = textOf(html);
    expect(text).toContain(explainAssessment((getHistory('B', 150)[0] as SessionRecord).assessment, 'en').headline);
    expect(html).not.toContain('level-badge');
    expect(html).not.toContain('<svg role="img"');
  });

  it('says in plain sight when the numbers of a control were not measured on an image', () => {
    const fromTables = textOf(renderHtml(<ResultScreen crewId="C" flightDay={118} />, 'en'));
    expect(fromTables).toContain('The numbers of this control were not measured on an image.');
    const record = sampleRecord(getHistory('B', 150), 'B', { flightDay: 150, od: 26, os: 3, origin: 'live' });
    const measured = (eye: 'OD' | 'OS') => {
      const capture = record.eyes[eye];
      return { ...capture, accepted: capture.accepted && { ...capture.accepted, engineVersion: ENGINE_VERSION } };
    };
    const byEngine: SessionRecord = { ...record, eyes: { OD: measured('OD'), OS: measured('OS') } };
    const text = textOf(renderHtml(<ResultScreen crewId="B" flightDay={150} />, 'en', testStore((state) => withRecord(state, byEngine))));
    expect(text).not.toContain('The numbers of this control were not measured on an image');
    // The engine measured today's exam, but the reference still comes from the scenario tables: that is said too.
    expect(text).toContain('The pre-flight exam this control is compared with was not measured on an image.');
  });

  it('follows the mission day: a control after it is not there yet', () => {
    const store = testStore((state) => withMissionDay(state, 90));
    const text = textOf(renderHtml(<ResultScreen crewId="B" flightDay={118} />, 'en', store));
    expect(text).toContain('There is no control of Elena Voss on flight day 118');
  });
});
