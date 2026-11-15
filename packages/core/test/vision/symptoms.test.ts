import { describe, expect, it } from 'vitest';
import type { SymptomAnswers, SymptomId } from '../../src/contract';
import {
  OTHER_SYMPTOMS,
  SYMPTOM_IDS,
  URGENT_SYMPTOMS,
  VISION_CHANGE_SYMPTOMS,
  hasUrgentSymptom,
  initialSymptomAnswers,
  normalizeSymptomAnswers,
  symptomTakesEye,
  symptomTakesSeverity,
  validateSymptomAnswers,
} from '../../src/vision/symptoms';

/** Every `SymptomId` of the contract; the compiler checks this list stays complete. */
const ALL: Record<SymptomId, true> = {
  'near-vision': true,
  'intermediate-vision': true,
  'distance-vision': true,
  distortion: true,
  'low-light-vision': true,
  'fluctuating-vision': true,
  'depth-perception': true,
  'double-vision': true,
  'transient-vision-loss': true,
  'sudden-vision-loss': true,
  'new-dark-spot': true,
  headache: true,
  tinnitus: true,
  nausea: true,
  'difficulty-thinking': true,
};

function withAnswer(base: SymptomAnswers, id: SymptomId, answer: SymptomAnswers['answers'][SymptomId]): SymptomAnswers {
  return { ...base, answers: { ...base.answers, [id]: answer } };
}

describe('symptom questionnaire', () => {
  it('lists every symptom once, urgent ones first', () => {
    expect([...SYMPTOM_IDS].sort()).toEqual(Object.keys(ALL).sort());
    expect(new Set(SYMPTOM_IDS).size).toBe(SYMPTOM_IDS.length);
    expect(SYMPTOM_IDS.slice(0, 2)).toEqual(URGENT_SYMPTOMS);
    expect(VISION_CHANGE_SYMPTOMS.length + URGENT_SYMPTOMS.length + OTHER_SYMPTOMS.length).toBe(15);
  });

  it('starts with every key present and absent', () => {
    const initial = initialSymptomAnswers();
    expect(Object.keys(initial.answers).sort()).toEqual(Object.keys(ALL).sort());
    for (const id of SYMPTOM_IDS) expect(initial.answers[id]).toEqual({ present: false });
    expect(initial.changeNoticed).toBe(false);
    expect(initial.glasses).toBe('none');
    expect(validateSymptomAnswers(initial)).toEqual([]);
    expect(hasUrgentSymptom(initial)).toBe(false);
  });

  it('asks the eye and the grade only where they apply', () => {
    expect(symptomTakesEye('near-vision')).toBe(true);
    expect(symptomTakesEye('sudden-vision-loss')).toBe(true);
    expect(symptomTakesEye('double-vision')).toBe(false);
    expect(symptomTakesEye('headache')).toBe(false);
    expect(symptomTakesSeverity('new-dark-spot')).toBe(false);
    expect(symptomTakesSeverity('headache')).toBe(true);
  });

  it('accepts a complete answer', () => {
    let answers: SymptomAnswers = { ...initialSymptomAnswers(), changeNoticed: true, glasses: 'reading' };
    answers = withAnswer(answers, 'near-vision', { present: true, severity: 'mild', eye: 'both' });
    answers = withAnswer(answers, 'headache', { present: true, severity: 'moderate' });
    answers = withAnswer(answers, 'new-dark-spot', { present: true, eye: 'OS' });
    expect(validateSymptomAnswers(answers)).toEqual([]);
    expect(hasUrgentSymptom(answers)).toBe(true);
  });

  it('reports what is missing or inconsistent', () => {
    const initial = initialSymptomAnswers();
    const { headache: _dropped, ...rest } = initial.answers;
    expect(validateSymptomAnswers({ ...initial, answers: rest as SymptomAnswers['answers'] })).toEqual([
      { kind: 'missing-answer', id: 'headache' },
    ]);
    expect(validateSymptomAnswers(withAnswer(initial, 'tinnitus', { present: true }))).toEqual([
      { kind: 'missing-severity', id: 'tinnitus' },
    ]);
    expect(
      validateSymptomAnswers(withAnswer({ ...initial, changeNoticed: true }, 'distortion', { present: true, severity: 'mild' })),
    ).toEqual([{ kind: 'missing-eye', id: 'distortion' }]);
    expect(
      validateSymptomAnswers(withAnswer(initial, 'distortion', { present: true, severity: 'mild', eye: 'OD' })),
    ).toEqual([{ kind: 'topic-without-change', id: 'distortion' }]);
    expect(validateSymptomAnswers(withAnswer(initial, 'nausea', { present: false, severity: 'mild' }))).toEqual([
      { kind: 'unexpected-detail', id: 'nausea' },
    ]);
    expect(validateSymptomAnswers({ ...initial, glasses: 'monocle' as SymptomAnswers['glasses'] })).toEqual([
      { kind: 'invalid-glasses' },
    ]);
  });

  it('normalizes: vision topics absent without a change, details only where asked', () => {
    let answers = initialSymptomAnswers();
    answers = withAnswer(answers, 'distortion', { present: true, severity: 'mild', eye: 'OD' });
    answers = withAnswer(answers, 'headache', { present: true, severity: 'severe', eye: 'OD' });
    answers = withAnswer(answers, 'sudden-vision-loss', { present: true, severity: 'severe', eye: 'OD' });
    answers = withAnswer(answers, 'nausea', { present: false, severity: 'mild' });
    const normalized = normalizeSymptomAnswers(answers);
    expect(normalized.answers.distortion).toEqual({ present: false });
    expect(normalized.answers.headache).toEqual({ present: true, severity: 'severe' });
    expect(normalized.answers['sudden-vision-loss']).toEqual({ present: true, eye: 'OD' });
    expect(normalized.answers.nausea).toEqual({ present: false });
    expect(validateSymptomAnswers(normalized)).toEqual([]);
  });
});
