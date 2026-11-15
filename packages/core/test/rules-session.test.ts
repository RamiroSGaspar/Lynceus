import { describe, expect, it } from 'vitest';
import { assessSession, RULES_VERSION, type AssessmentInput, type NextStepId } from '../src/index';
import { BASE, eyesWithChange, measured, notMeasured, preflight, symptoms, vision } from './helpers/fixtures';

const pre = preflight();

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

describe('an eye that could not be measured', () => {
  it('one eye: no level and no number for it; the session follows the other eye', () => {
    const assessment = assessSession({
      crewId: 'B',
      flightDay: 30,
      eyes: { OD: measured('OD', { trt: BASE.OD.trt + 30 }), OS: notMeasured('OS') },
      vision: vision(),
      history: [pre],
    });
    expect(assessment.eyes.OS).toEqual({
      eye: 'OS',
      measured: false,
      level: null,
      alert: 'none',
      change: null,
      thresholds: [],
      borderline: false,
      sincePrevious: null,
      findings: ['eye-not-measured'],
      notMeasuredReasons: ['low-signal'],
    });
    expect(assessment.eyes.OD.level).toBe('first-sign');
    expect(assessment.level).toBe('first-sign');
    expect(assessment.findings).toEqual(['swelling-first-sign', 'eye-not-measured']);
    expect(assessment.nextOct).toEqual({ flightDay: 37, reason: 'not-measured' });
  });

  it('both eyes: nothing measured, repeat within 7 days', () => {
    const assessment = assessSession({
      crewId: 'B',
      flightDay: 90,
      eyes: { OD: notMeasured('OD', ['decentered'], []), OS: notMeasured('OS', ['too-few-usable-scans'], ['signal-dropout', 'motion']) },
      vision: vision(),
      history: [pre],
    });
    expect(assessment.eyes.OD.measured).toBe(false);
    expect(assessment.eyes.OS.measured).toBe(false);
    expect(assessment.eyes.OD.notMeasuredReasons).toEqual(['decentered']);
    // "Too few usable scans" is replaced by what spoiled most of them.
    expect(assessment.eyes.OS.notMeasuredReasons).toEqual(['signal-dropout']);
    expect(assessment.findings).toEqual(['eye-not-measured']);
    // Nothing was read: the session has no level. "No detectable change" would reassure without a measurement.
    expect(assessment.level).toBeNull();
    expect(assessment.alert).toBe('none');
    expect(assessment.contact).toBe('routine-report');
    expect(assessment.nextOct).toEqual({ flightDay: 97, reason: 'not-measured' });
    expect(assessment.nextSteps[0]).toMatchObject({ id: 'oct-repeat-soon', params: { flightDay: 97, inDays: 7, eyes: 'both' } });
    expect(assessment.amslerPerWeek).toBe(0);
  });

  it('gives the reasons of the last attempt first and does not repeat them', () => {
    const capture = notMeasured('OS');
    capture.attempts[0] = { ...capture.attempts[0]!, rejections: ['too-few-usable-scans'], scanRejections: ['truncated'] };
    capture.attempts[2] = { ...capture.attempts[2]!, rejections: ['bmo-fit-failed', 'too-few-usable-scans'], scanRejections: ['low-signal'] };
    const assessment = assessSession({
      crewId: 'B',
      flightDay: 30,
      eyes: { OD: measured('OD', { trt: BASE.OD.trt }), OS: capture },
      vision: null,
      history: [pre],
    });
    expect(assessment.eyes.OS.notMeasuredReasons).toEqual(['bmo-fit-failed', 'low-signal', 'truncated']);
  });

  it('an eye that was never captured, or whose accepted exam has no measures, is not measured either', () => {
    const cannot = measured('OS', { trt: BASE.OS.trt });
    cannot.accepted = { ...cannot.accepted!, status: 'cannot-measure', rejections: ['insufficient-ring-coverage'], trtRingUm: null };
    const assessment = assessSession({
      crewId: 'B',
      flightDay: 30,
      eyes: { OD: { eye: 'OD', attempts: [], accepted: null }, OS: cannot },
      vision: null,
      history: [pre],
    });
    expect(assessment.eyes.OD).toMatchObject({ measured: false, level: null, notMeasuredReasons: ['not-captured'] });
    expect(assessment.eyes.OS).toMatchObject({ measured: false, level: null, notMeasuredReasons: ['insufficient-ring-coverage'] });
  });

  it('without a pre-flight exam of that eye there is nothing to compare with', () => {
    const noHistory = assessSession({ crewId: 'B', flightDay: 30, eyes: eyesWithChange({ OD: 30, OS: 0 }), vision: null, history: [] });
    expect(noHistory.eyes.OD).toMatchObject({ measured: false, level: null, change: null, notMeasuredReasons: ['no-baseline'] });

    const preWithoutOs = { ...pre, eyes: { ...pre.eyes, OS: notMeasured('OS', undefined, undefined, 0) } };
    const assessment = assessSession({ crewId: 'B', flightDay: 30, eyes: eyesWithChange({ OD: 30, OS: 0 }), vision: null, history: [preWithoutOs] });
    expect(assessment.eyes.OD.level).toBe('first-sign');
    expect(assessment.eyes.OS).toMatchObject({ measured: false, notMeasuredReasons: ['no-baseline'] });
  });

  it('the session has a level as soon as one eye is measured, and none before the flight without a measured eye', () => {
    const oneEye = assessSession({
      crewId: 'B',
      flightDay: 30,
      eyes: { OD: notMeasured('OD'), OS: measured('OS', { trt: BASE.OS.trt + 3 }) },
      vision: null,
      history: [pre],
    });
    expect(oneEye.level).toBe('no-detectable-change');

    const reference = assessSession({
      crewId: 'B',
      flightDay: 0,
      eyes: { OD: notMeasured('OD', undefined, undefined, 0), OS: notMeasured('OS', undefined, undefined, 0) },
      vision: null,
      history: [],
    });
    expect(reference.level).toBeNull();
    expect(reference.findings).toEqual(['eye-not-measured']);

    // Findings that are not acute do not give the session a level either.
    const withHeadache = assessSession({
      crewId: 'B',
      flightDay: 30,
      eyes: { OD: notMeasured('OD'), OS: notMeasured('OS') },
      vision: vision({ symptoms: symptoms({ headache: { severity: 'severe' }, distortion: {} }) }),
      history: [pre],
    });
    expect(withHeadache.level).toBeNull();
    expect(withHeadache.contact).toBe('without-delay');
    expect(withHeadache.findings).toEqual(['symptom-other', 'eye-not-measured', 'symptom-headache']);
  });

  it('an acute symptom still makes the session acute when nothing could be measured', () => {
    const assessment = assessSession({
      crewId: 'B',
      flightDay: 30,
      eyes: { OD: notMeasured('OD'), OS: notMeasured('OS') },
      vision: vision({ symptoms: symptoms({ 'sudden-vision-loss': { eye: 'OD' } }) }),
      history: [pre],
    });
    expect(assessment.level).toBe('acute-visual-symptom');
    expect(assessment.contact).toBe('now');
    expect(assessment.nextSteps.map((step) => step.id).slice(0, 2)).toEqual(['contact-surgeon-now', 'oct-repeat-soon']);
  });
});

describe('every assessment', () => {
  const inputs: AssessmentInput[] = [
    { crewId: 'B', flightDay: 30, eyes: eyesWithChange({ OD: 5, OS: 3 }), vision: vision(), history: [pre] },
    { crewId: 'B', flightDay: 90, eyes: eyesWithChange({ OD: 30, OS: 3 }, {}, 90), vision: null, history: [pre] },
    { crewId: 'B', flightDay: 150, eyes: eyesWithChange({ OD: 70, OS: 30 }, { OD: 4 }, 150), vision: vision(), history: [pre] },
    {
      crewId: 'B',
      flightDay: 30,
      eyes: { OD: notMeasured('OD'), OS: notMeasured('OS') },
      vision: vision({ symptoms: symptoms({ 'sudden-vision-loss': {}, headache: { severity: 'severe' }, 'near-vision': {} }) }),
      history: [pre],
    },
  ];

  it('states the nine limitations, in the same order', () => {
    for (const input of inputs) {
      expect(assessSession(input).limitations).toEqual([
        'not-a-diagnosis',
        'simulated-data',
        'not-validated-on-people',
        'ground-confirms',
        'no-intracranial-pressure',
        'no-choroid',
        'no-macula',
        'no-globe-flattening',
        'no-refraction',
      ]);
    }
  });

  it('carries the version of the rules, the crew member and the flight day', () => {
    for (const input of inputs) {
      const assessment = assessSession(input);
      expect(assessment.rulesVersion).toBe(RULES_VERSION);
      expect(assessment.crewId).toBe(input.crewId);
      expect(assessment.flightDay).toBe(input.flightDay);
    }
    expect(RULES_VERSION.length).toBeGreaterThan(0);
  });

  it('has exactly one contact step, one tomography step and steps that are never medication', () => {
    const contact: NextStepId[] = ['contact-surgeon-now', 'notify-surgeon-without-delay', 'report-routine'];
    const oct: NextStepId[] = ['oct-routine', 'oct-in-4-weeks', 'oct-in-3-weeks', 'oct-repeat-soon', 'post-flight-exams'];
    const allowed: NextStepId[] = [...contact, ...oct, 'amsler-at-controls', 'amsler-twice-a-week', 'amsler-three-times-a-week', 'try-stronger-glasses'];
    for (const input of inputs) {
      const steps = assessSession(input).nextSteps;
      expect(steps.filter((step) => contact.includes(step.id))).toHaveLength(1);
      expect(steps.filter((step) => oct.includes(step.id))).toHaveLength(1);
      for (const step of steps) {
        expect(allowed).toContain(step.id);
        expect(['nasa', 'assumption']).toContain(step.basis);
      }
    }
  });

  it('is pure: the same input gives the same output and the input is not modified', () => {
    for (const input of inputs) {
      const frozen = deepFreeze(structuredClone(input));
      const first = assessSession(frozen);
      const second = assessSession(structuredClone(input));
      expect(second).toEqual(first);
      expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    }
  });

  it('survives being stored as JSON, as the application does', () => {
    for (const input of inputs) {
      const assessment = assessSession(input);
      expect(JSON.parse(JSON.stringify(assessment))).toEqual(assessment);
    }
  });
});
