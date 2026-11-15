import type { FindingId, SessionRecord } from '@app/core';

/** Keys of `assistantMessages` used as suggested questions. */
export type SuggestionKey =
  | 'q.explain-result'
  | 'q.first-sign'
  | 'q.clinically-concerning'
  | 'q.folds'
  | 'q.not-measured'
  | 'q.near-vision'
  | 'q.amsler'
  | 'q.headache'
  | 'q.surgeon'
  | 'q.what-is-trt'
  | 'q.threshold-origin'
  | 'q.brain-pressure'
  | 'q.brain-mri';

const BY_FINDING: Partial<Record<FindingId, SuggestionKey>> = {
  'swelling-first-sign': 'q.first-sign',
  'swelling-clinically-concerning': 'q.clinically-concerning',
  'folds-new': 'q.folds',
  'eye-not-measured': 'q.not-measured',
  'near-vision-worse': 'q.near-vision',
  'symptom-near-blur': 'q.near-vision',
  'amsler-marked': 'q.amsler',
  'amsler-marked-central': 'q.amsler',
  'symptom-headache': 'q.headache',
};

export const MAX_SUGGESTIONS = 6;

/** Fixed questions plus templates chosen by the session's findings. */
export function suggestedQuestions(record: SessionRecord | null): SuggestionKey[] {
  const keys: SuggestionKey[] = [];
  if (record) {
    keys.push('q.explain-result');
    for (const finding of record.assessment.findings) {
      const key = BY_FINDING[finding];
      if (key) keys.push(key);
    }
    keys.push('q.surgeon');
  }
  keys.push('q.what-is-trt', 'q.threshold-origin', 'q.brain-pressure', 'q.brain-mri');
  return [...new Set(keys)].slice(0, MAX_SUGGESTIONS);
}
