import { describe, expect, it } from 'vitest';
import { progressView, REDUCED_MOTION_CHUNK, visibleCount } from './progress';

const STARTED = { header: true, fundus: true };

describe('telling the progress of a capture', () => {
  it('starts with the instrument and the fundus image', () => {
    expect(progressView(null, { header: false, fundus: false }).phrase.key).toBe('phase.start');
    expect(progressView(null, { header: true, fundus: false }).phrase.key).toBe('phase.fundus');
    expect(progressView(null, STARTED).phrase.key).toBe('phase.read');
  });

  it('takes scans and marks edges together, then locates the opening, then measures', () => {
    const scanning = progressView({ step: 'segment', scanIndex: 11, scansTotal: 48 }, STARTED);
    expect(scanning).toMatchObject({ take: 'current', mark: 'current', locate: 'pending', measure: 'pending', stage: 'scans' });
    expect(scanning.phrase).toEqual({ key: 'phase.segment', n: 12, total: 48 });
    expect(progressView({ step: 'fit', scansTotal: 48 }, STARTED)).toMatchObject({ take: 'done', mark: 'done', locate: 'current', measure: 'pending', stage: 'fit' });
    expect(progressView({ step: 'measure', scansTotal: 48 }, STARTED)).toMatchObject({ locate: 'done', measure: 'current', stage: 'measure' });
    expect(progressView({ step: 'done', scansTotal: 48 }, STARTED)).toMatchObject({ take: 'done', locate: 'done', measure: 'done', stage: 'done' });
  });

  it('shows every scan, or whole chunks when motion is reduced', () => {
    expect(visibleCount(13, 48, false)).toBe(13);
    expect(visibleCount(13, 48, true)).toBe(REDUCED_MOTION_CHUNK);
    expect(visibleCount(7, 48, true)).toBe(0);
    expect(visibleCount(48, 48, true)).toBe(48);
  });
});
