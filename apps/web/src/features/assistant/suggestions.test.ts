import { describe, expect, it } from 'vitest';
import { assistantMessages } from './messages';
import { MAX_SUGGESTIONS, suggestedQuestions } from './suggestions';
import { TEST_RECORD } from './test-record';

describe('suggested questions', () => {
  it('without a result offers fixed questions about terms and the brain', () => {
    expect(suggestedQuestions(null)).toEqual(['q.what-is-trt', 'q.threshold-origin', 'q.brain-pressure', 'q.brain-mri']);
  });

  it('with a result starts with the result and adds one template per finding, capped', () => {
    const keys = suggestedQuestions(TEST_RECORD);
    expect(keys.slice(0, 4)).toEqual(['q.explain-result', 'q.first-sign', 'q.not-measured', 'q.headache']);
    expect(keys).toContain('q.surgeon');
    expect(keys.length).toBeLessThanOrEqual(MAX_SUGGESTIONS);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('has every suggestion written in both languages, within the question limit', () => {
    for (const locale of ['en', 'es'] as const) {
      for (const [key, text] of Object.entries(assistantMessages[locale])) {
        if (key.startsWith('q.')) expect(text.length).toBeGreaterThan(0);
        if (key.startsWith('q.')) expect(text.length).toBeLessThanOrEqual(500);
      }
    }
  });
});
