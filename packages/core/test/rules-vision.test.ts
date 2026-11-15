import { describe, expect, it } from 'vitest';
import { assessSession, type NextStepId, type SessionAssessment, type VisionSession } from '../src/index';
import { acuity, amsler, eyesWithChange, preflight, symptoms, vision } from './helpers/fixtures';

// Pre-flight near acuity of the fixtures: 0.00 (OD) and 0.02 (OS).
const history = [preflight()];

function assess(functional: VisionSession | null, change = { OD: 5, OS: 3 }): SessionAssessment {
  return assessSession({ crewId: 'B', flightDay: 30, eyes: eyesWithChange(change), vision: functional, history });
}

const stepIds = (assessment: SessionAssessment): NextStepId[] => assessment.nextSteps.map((step) => step.id);

describe('vision tests and symptoms: each row of table 4.2', () => {
  it('nothing to report: no finding, routine report', () => {
    const assessment = assess(vision());
    expect(assessment.findings).toEqual([]);
    expect(assessment.level).toBe('no-detectable-change');
    expect(assessment.contact).toBe('routine-report');
    expect(assessment.functional?.done).toEqual({ symptoms: true, acuity: true, amsler: true });
    expect(assessment.functional?.symptoms).toEqual([]);
  });

  it.each(['sudden-vision-loss', 'new-dark-spot'] as const)('%s: acute visual symptom, contact now', (id) => {
    const assessment = assess(vision({ symptoms: symptoms({ [id]: { severity: 'mild', eye: 'OD' } }) }));
    expect(assessment.findings).toEqual(['symptom-acute']);
    expect(assessment.level).toBe('acute-visual-symptom');
    expect(assessment.alert).toBe('warning');
    expect(assessment.contact).toBe('now');
    expect(stepIds(assessment)[0]).toBe('contact-surgeon-now');
    expect(stepIds(assessment)).not.toContain('report-routine');
    expect(assessment.functional?.symptoms).toEqual([{ id, severity: 'mild', eye: 'OD' }]);
    // The image is still read on its own: the eyes keep their level and the calendar follows it.
    expect(assessment.eyes.OD.level).toBe('no-detectable-change');
    expect(assessment.nextOct).toEqual({ flightDay: 90, reason: 'routine' });
  });

  it('Amsler grid marked within the central 2 degrees: acute visual symptom, contact now', () => {
    const marked = amsler('OS', { marks: [{ col: 10, row: 10, kind: 'wavy' }], markedFraction: 0.0025, centralMarked: true });
    const assessment = assess(vision({ amsler: { OD: amsler('OD'), OS: marked } }));
    expect(assessment.findings).toEqual(['amsler-marked-central']);
    expect(assessment.level).toBe('acute-visual-symptom');
    expect(assessment.contact).toBe('now');
    expect(assessment.functional?.amsler.OS).toEqual({ marked: true, markedFraction: 0.0025, centralMarked: true, extensive: false });
    expect(assessment.functional?.amsler.OD?.marked).toBe(false);
  });

  it('Amsler grid marked over 5 % or more, anywhere: acute visual symptom, contact now', () => {
    const mark = { col: 1, row: 1, kind: 'missing' } as const;
    const extensive = assess(vision({ amsler: { OD: amsler('OD', { marks: [mark], markedFraction: 0.05 }), OS: amsler('OS') } }));
    expect(extensive.findings).toEqual(['amsler-marked-central']);
    expect(extensive.contact).toBe('now');
    expect(extensive.functional?.amsler.OD).toMatchObject({ centralMarked: false, extensive: true });
  });

  it('Amsler grid with other marks: tell the surgeon without delay, level unchanged', () => {
    const mark = { col: 1, row: 1, kind: 'blurred' } as const;
    const assessment = assess(vision({ amsler: { OD: amsler('OD', { marks: [mark], markedFraction: 0.049 }), OS: amsler('OS') } }));
    expect(assessment.findings).toEqual(['amsler-marked']);
    expect(assessment.level).toBe('no-detectable-change');
    expect(assessment.contact).toBe('without-delay');
    expect(stepIds(assessment)[0]).toBe('notify-surgeon-without-delay');
  });

  it('one eye with central marks and the other with other marks: both findings', () => {
    const mark = { col: 1, row: 1, kind: 'wavy' } as const;
    const assessment = assess(
      vision({
        amsler: {
          OD: amsler('OD', { marks: [mark], markedFraction: 0.01, centralMarked: true }),
          OS: amsler('OS', { marks: [mark], markedFraction: 0.01 }),
        },
      }),
    );
    expect(assessment.findings).toEqual(['amsler-marked-central', 'amsler-marked']);
    expect(assessment.contact).toBe('now');
  });

  it.each(['distortion', 'double-vision', 'transient-vision-loss'] as const)(
    '%s at any grade: tell the surgeon without delay',
    (id) => {
      const assessment = assess(vision({ symptoms: symptoms({ [id]: { severity: 'mild' } }) }));
      expect(assessment.findings).toEqual(['symptom-other']);
      expect(assessment.level).toBe('no-detectable-change');
      expect(assessment.contact).toBe('without-delay');
    },
  );

  it('any vision symptom graded severe: tell the surgeon without delay; milder grades are only recorded', () => {
    const severe = assess(vision({ symptoms: symptoms({ 'low-light-vision': { severity: 'severe' } }) }));
    expect(severe.findings).toEqual(['symptom-other']);
    expect(severe.contact).toBe('without-delay');

    const moderate = assess(vision({ symptoms: symptoms({ 'low-light-vision': { severity: 'moderate' } }) }));
    expect(moderate.findings).toEqual([]);
    expect(moderate.contact).toBe('routine-report');
    expect(moderate.functional?.symptoms).toEqual([{ id: 'low-light-vision', severity: 'moderate', eye: null }]);
  });

  it('near acuity 0.2 logMAR worse than before the flight: try the stronger glasses', () => {
    // 0.22 − 0.02 is 0.19999999999999998 in binary arithmetic: it must still count as 0.2.
    const assessment = assess(vision({ acuity: { OD: acuity('OD', 0.1), OS: acuity('OS', 0.22) } }));
    expect(assessment.findings).toEqual(['near-vision-worse']);
    expect(assessment.level).toBe('no-detectable-change');
    expect(assessment.contact).toBe('routine-report');
    expect(stepIds(assessment)).toContain('try-stronger-glasses');
    expect(assessment.functional?.acuity.OS).toMatchObject({
      logMar: { value: 0.22, unit: 'logMAR', origin: 'self-reported' },
      baselineLogMar: { value: 0.02, unit: 'logMAR', origin: 'self-reported' },
      change: { value: 0.2, unit: 'logMAR', origin: 'derived', interval95: [0.03, 0.37] },
      worse: true,
    });
    expect(assessment.functional?.acuity.OD).toMatchObject({ change: { value: 0.1 }, worse: false });
  });

  it('near acuity 0.19 logMAR worse: within the variation of the test, no finding', () => {
    const assessment = assess(vision({ acuity: { OD: acuity('OD', 0.19), OS: acuity('OS', 0.02) } }));
    expect(assessment.findings).toEqual([]);
    expect(stepIds(assessment)).not.toContain('try-stronger-glasses');
  });

  it('a result limited by the screen is not taken as a worsening', () => {
    const assessment = assess(vision({ acuity: { OD: acuity('OD', 0.3, { atScreenFloor: true }), OS: acuity('OS', 0.02) } }));
    expect(assessment.findings).toEqual([]);
    expect(assessment.functional?.acuity.OD).toMatchObject({ change: { value: 0.3 }, atScreenFloor: true, worse: false });
  });

  it('a test that did not converge, or without a pre-flight value, compares nothing', () => {
    const assessment = assess(vision({ acuity: { OD: acuity('OD', null), OS: null } }));
    expect(assessment.findings).toEqual([]);
    expect(assessment.functional?.acuity).toEqual({ OD: null, OS: null });

    const noBaseline = assessSession({
      crewId: 'B',
      flightDay: 30,
      eyes: eyesWithChange({ OD: 5, OS: 3 }),
      vision: vision({ acuity: { OD: acuity('OD', 0.5), OS: acuity('OS', 0.5) } }),
      history: [{ ...history[0]!, vision: null }],
    });
    expect(noBaseline.findings).toEqual([]);
    expect(noBaseline.functional?.acuity.OD).toMatchObject({ baselineLogMar: null, change: null, worse: false });
  });

  it('gives the acuity change a range only when both tests have the 18 trials it was measured with', () => {
    const short = assess(vision({ acuity: { OD: acuity('OD', 0.3, { trials: 12 }), OS: acuity('OS', 0.02) } }));
    expect(short.functional?.acuity.OD?.change).toEqual({ value: 0.3, unit: 'logMAR', origin: 'derived' });
    expect(short.findings).toEqual(['near-vision-worse']);
  });

  it('records when the two tests were not done in the same correction state', () => {
    const assessment = assess(vision({ acuity: { OD: acuity('OD', 0.1, { withCorrection: false }), OS: acuity('OS', 0.02) } }));
    expect(assessment.functional?.acuity.OD?.sameCorrection).toBe(false);
    expect(assessment.functional?.acuity.OS?.sameCorrection).toBe(true);
  });

  it('near blur reported: try the stronger glasses', () => {
    const assessment = assess(vision({ symptoms: symptoms({ 'near-vision': { severity: 'mild', eye: 'both' } }) }));
    expect(assessment.findings).toEqual(['symptom-near-blur']);
    expect(assessment.contact).toBe('routine-report');
    expect(stepIds(assessment)).toEqual(['try-stronger-glasses', 'oct-routine', 'amsler-at-controls', 'report-routine']);
    const glasses = assessment.nextSteps.find((step) => step.id === 'try-stronger-glasses')!;
    expect(glasses.sources).toContain('nasa-mtb-2024');
  });

  it('headache: recorded, without changing the level; severe: tell the surgeon without delay', () => {
    const mild = assess(vision({ symptoms: symptoms({ headache: { severity: 'moderate' } }) }));
    expect(mild.findings).toEqual(['symptom-headache']);
    expect(mild.level).toBe('no-detectable-change');
    expect(mild.alert).toBe('none');
    expect(mild.contact).toBe('routine-report');

    const severe = assess(vision({ symptoms: symptoms({ headache: { severity: 'severe' } }) }));
    expect(severe.findings).toEqual(['symptom-headache']);
    expect(severe.level).toBe('no-detectable-change');
    expect(severe.contact).toBe('without-delay');
  });

  it('the other symptoms of the questionnaire are recorded and change nothing, even when severe', () => {
    const assessment = assess(
      vision({ symptoms: symptoms({ tinnitus: { severity: 'severe' }, nausea: { severity: 'severe' }, 'difficulty-thinking': { severity: 'severe' } }) }),
    );
    expect(assessment.findings).toEqual([]);
    expect(assessment.contact).toBe('routine-report');
    expect(assessment.functional?.symptoms.map((s) => s.id)).toEqual(['tinnitus', 'nausea', 'difficulty-thinking']);
  });
});

describe('vision tests and symptoms: together with the image', () => {
  it('an acute symptom outranks any imaging level, and the eyes keep theirs', () => {
    const assessment = assess(vision({ symptoms: symptoms({ 'new-dark-spot': {} }) }), { OD: 70, OS: 30 });
    expect(assessment.level).toBe('acute-visual-symptom');
    expect(assessment.contact).toBe('now');
    expect(assessment.eyes.OD.level).toBe('clinically-concerning');
    expect(assessment.eyes.OS.level).toBe('first-sign');
    expect(assessment.findings).toEqual(['symptom-acute', 'swelling-clinically-concerning', 'swelling-first-sign']);
    expect(stepIds(assessment)).toEqual(['contact-surgeon-now', 'oct-in-3-weeks', 'amsler-three-times-a-week']);
  });

  it('orders several findings by urgency', () => {
    const assessment = assess(
      vision({
        acuity: { OD: acuity('OD', 0.3), OS: acuity('OS', 0.02) },
        symptoms: symptoms({ headache: { severity: 'mild' }, 'near-vision': { severity: 'moderate' }, distortion: { severity: 'mild' } }),
      }),
      { OD: 30, OS: 3 },
    );
    expect(assessment.findings).toEqual(['symptom-other', 'swelling-first-sign', 'near-vision-worse', 'symptom-near-blur', 'symptom-headache']);
    expect(stepIds(assessment)).toEqual([
      'notify-surgeon-without-delay',
      'oct-in-4-weeks',
      'amsler-twice-a-week',
      'try-stronger-glasses',
    ]);
  });

  it('skipped tests are recorded as not done and add no finding', () => {
    const none = assess(null);
    expect(none.findings).toEqual([]);
    expect(none.functional).toEqual({
      done: { symptoms: false, acuity: false, amsler: false },
      acuity: { OD: null, OS: null },
      amsler: { OD: null, OS: null },
      symptoms: [],
    });
    const partial = assess({ calibration: null, acuity: { OD: null, OS: null }, amsler: { OD: null, OS: null }, symptoms: symptoms() });
    expect(partial.functional?.done).toEqual({ symptoms: true, acuity: false, amsler: false });
  });

  it('tolerates a questionnaire with missing answers', () => {
    const incomplete = { changeNoticed: false, answers: {}, glasses: 'none' } as unknown as VisionSession['symptoms'];
    expect(assess(vision({ symptoms: incomplete })).findings).toEqual([]);
  });
});
