/**
 * The symptom questionnaire: which questions exist, its empty state and its validation.
 * Topics follow NASA's in-flight questionnaire as described in its 2017 evidence report
 * (research doc `pruebas-de-vision-en-pantalla.md`, section 6.1, N2 p. 27); the form is not
 * public and the wording and the list are ours (assumption 7, `arquitectura.md` section 12).
 */
import type { SymptomAnswer, SymptomAnswers, SymptomId } from '../contract';

/** Asked first and apart: they cannot wait for the routine report (assumption of this project). */
export const URGENT_SYMPTOMS: readonly SymptomId[] = ['sudden-vision-loss', 'new-dark-spot'];

/** NASA's topics of change in vision (N2 p. 27). Asked only when a change was noticed. */
export const VISION_CHANGE_SYMPTOMS: readonly SymptomId[] = [
  'near-vision',
  'intermediate-vision',
  'distance-vision',
  'distortion',
  'low-light-vision',
  'fluctuating-vision',
  'depth-perception',
  'double-vision',
  'transient-vision-loss',
];

/** Other symptoms NASA's questionnaire records (N2 p. 27). Recorded without claiming a link to the eye. */
export const OTHER_SYMPTOMS: readonly SymptomId[] = ['headache', 'tinnitus', 'nausea', 'difficulty-thinking'];

export const SYMPTOM_IDS: readonly SymptomId[] = [...URGENT_SYMPTOMS, ...VISION_CHANGE_SYMPTOMS, ...OTHER_SYMPTOMS];

export const GLASSES_OPTIONS: readonly SymptomAnswers['glasses'][] = [
  'none',
  'reading',
  'bifocal',
  'progressive',
  'adjustable',
];

/** Depth perception and double vision are reported for both eyes together; head symptoms have no eye. */
const NO_EYE: ReadonlySet<SymptomId> = new Set<SymptomId>(['depth-perception', 'double-vision', ...OTHER_SYMPTOMS]);

/** Whether the question asks which eye. */
export function symptomTakesEye(id: SymptomId): boolean {
  return !NO_EYE.has(id);
}

/** Whether the question asks NASA's grade. The two urgent questions are yes or no. */
export function symptomTakesSeverity(id: SymptomId): boolean {
  return !URGENT_SYMPTOMS.includes(id);
}

const ABSENT: SymptomAnswer = { present: false };

/** Every question unanswered counts as absent; no glasses for near. */
export function initialSymptomAnswers(): SymptomAnswers {
  const answers = {} as Record<SymptomId, SymptomAnswer>;
  for (const id of SYMPTOM_IDS) answers[id] = { ...ABSENT };
  return { changeNoticed: false, answers, glasses: 'none' };
}

/**
 * Removes what does not apply: grade and eye of absent symptoms, an eye where none is
 * asked, and every vision topic when no change was noticed.
 */
export function normalizeSymptomAnswers(input: SymptomAnswers): SymptomAnswers {
  const answers = {} as Record<SymptomId, SymptomAnswer>;
  for (const id of SYMPTOM_IDS) {
    const answer = input.answers[id] ?? ABSENT;
    const skipped = !input.changeNoticed && VISION_CHANGE_SYMPTOMS.includes(id);
    if (!answer.present || skipped) {
      answers[id] = { ...ABSENT };
      continue;
    }
    const normalized: SymptomAnswer = { present: true };
    if (symptomTakesSeverity(id) && answer.severity) normalized.severity = answer.severity;
    if (symptomTakesEye(id) && answer.eye) normalized.eye = answer.eye;
    answers[id] = normalized;
  }
  return { changeNoticed: input.changeNoticed, answers, glasses: input.glasses };
}

export type SymptomIssue =
  | { kind: 'missing-answer'; id: SymptomId }
  | { kind: 'missing-severity'; id: SymptomId }
  | { kind: 'missing-eye'; id: SymptomId }
  | { kind: 'unexpected-detail'; id: SymptomId }
  | { kind: 'topic-without-change'; id: SymptomId }
  | { kind: 'invalid-glasses' };

/** Everything that keeps the answers from being complete and consistent. Empty when valid. */
export function validateSymptomAnswers(input: SymptomAnswers): SymptomIssue[] {
  const issues: SymptomIssue[] = [];
  for (const id of SYMPTOM_IDS) {
    const answer = input.answers[id];
    if (!answer || typeof answer.present !== 'boolean') {
      issues.push({ kind: 'missing-answer', id });
      continue;
    }
    if (!answer.present) {
      if (answer.severity !== undefined || answer.eye !== undefined) issues.push({ kind: 'unexpected-detail', id });
      continue;
    }
    if (!input.changeNoticed && VISION_CHANGE_SYMPTOMS.includes(id)) issues.push({ kind: 'topic-without-change', id });
    if (symptomTakesSeverity(id) ? !answer.severity : answer.severity !== undefined) {
      issues.push(answer.severity ? { kind: 'unexpected-detail', id } : { kind: 'missing-severity', id });
    }
    if (symptomTakesEye(id) ? !answer.eye : answer.eye !== undefined) {
      issues.push(answer.eye ? { kind: 'unexpected-detail', id } : { kind: 'missing-eye', id });
    }
  }
  if (!GLASSES_OPTIONS.includes(input.glasses)) issues.push({ kind: 'invalid-glasses' });
  return issues;
}

/** Sudden loss of vision or a new dark spot: the astronaut is told at once to call the flight surgeon. */
export function hasUrgentSymptom(input: SymptomAnswers): boolean {
  return URGENT_SYMPTOMS.some((id) => input.answers[id]?.present === true);
}
