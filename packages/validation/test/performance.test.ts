import { describe, expect, it } from 'vitest';
import { acquire, analyzeExam } from '@app/core';

// Spec test 9 (section 5.7): generating and analysing a whole exam of one eye takes less
// than 10 s on one thread on this machine (goal: less than 6 s), without holding the 48
// B-scans in memory at once. It runs alone, after the other tests (see package.json).
describe('performance (spec test 9)', () => {
  it('generates and analyses a whole exam, fundus image included, in less than 10 s', () => {
    // Warm-up on another eye, so the time measured is that of a steady session.
    analyzeExam(acquire({ crewId: 'A', eye: 'OS', flightDay: 30, attempt: 1 }));
    const t0 = performance.now();
    const exam = acquire({ crewId: 'B', eye: 'OD', flightDay: 90, attempt: 1 });
    expect(exam.slo.length).toBe(1536 * 1536);
    const a = analyzeExam(exam);
    const seconds = (performance.now() - t0) / 1000;
    console.log(`Whole exam generated and analysed in ${seconds.toFixed(2)} s (eye model already built).`);
    expect(a.status).toBe('measured');
    expect(seconds).toBeLessThan(10);
  }, 120000);
});
