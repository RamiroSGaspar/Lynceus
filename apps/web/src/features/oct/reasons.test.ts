import { describe, expect, it } from 'vitest';
import { EXAM_REJECTIONS, reasonText, SCAN_REJECTIONS } from './reasons';

describe('rejection reasons in plain words', () => {
  it('has a reason and advice for every scan and exam rejection, in both languages', () => {
    for (const locale of ['en', 'es'] as const) {
      const all = [...SCAN_REJECTIONS, ...EXAM_REJECTIONS].map((reason) => reasonText(reason, locale));
      for (const text of all) {
        expect(text.why.length).toBeGreaterThan(10);
        expect(text.advice.length).toBeGreaterThan(10);
      }
      expect(new Set(all.map((t) => t.why)).size).toBe(all.length);
      expect(new Set(all.map((t) => t.advice)).size).toBe(all.length);
    }
  });

  it('uses the core’s sentence for what went wrong, so the result says the same', () => {
    expect(reasonText('signal-dropout', 'en').why).toBe('Part of the image was missing, as happens with a blink.');
    expect(reasonText('signal-dropout', 'es').why).toBe('Faltó una parte de la imagen, como pasa con un parpadeo.');
    expect(reasonText('signal-dropout', 'en').advice).toMatch(/keep the eye open/i);
  });
});
