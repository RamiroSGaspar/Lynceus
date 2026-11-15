import { expect } from 'vitest';
import type { CaptureConditions, ExamAnalysis, ExamRejection, ScanRejection } from '../src/contract';
import { analyzeExam } from '../src/engine/analyze';
import { acquire } from '../src/instrument/acquire';

/** Analyses B OD on day 30 under the given conditions (attempt 3: no scripted event there). */
export function analyzeWith(conditions: CaptureConditions): ExamAnalysis {
  return analyzeExam(acquire({ crewId: 'B', eye: 'OD', flightDay: 30, attempt: 3, conditions }));
}

export function expectRefused(a: ExamAnalysis, exam: ExamRejection, scan?: ScanRejection): void {
  expect(a.status).toBe('cannot-measure');
  expect(a.rejections).toContain(exam);
  expect(a.trtRingUm).toBeNull();
  expect(a.mrwUm).toBeNull();
  expect(a.bmRoughnessUm).toBeNull();
  if (scan) {
    // The reason of the refusal is the failure that was put in, in most of the refused scans.
    const refused = a.scans.filter((s) => !s.usable);
    const withReason = refused.filter((s) => s.rejections.includes(scan));
    expect(withReason.length).toBeGreaterThanOrEqual(Math.ceil(0.8 * refused.length));
  }
}

export function expectMeasured(a: ExamAnalysis): void {
  expect(a.status, a.rejections.join(', ')).toBe('measured');
  expect(a.trtRingUm).not.toBeNull();
}
