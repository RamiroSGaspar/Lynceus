import { describe, expect, it } from 'vitest';
import type { CaptureAttemptRecord, ExamAnalysis, ExamSummary, ScanAnalysis, ScanRejection } from '@app/core';
import { attemptRecord, captureReducer, captureRequest, captureResult, INITIAL_CAPTURE, mainReason, MAX_ATTEMPTS, scanRejectionCounts, type CaptureState } from './attempts';

function scan(index: number, rejections: ScanRejection[]): ScanAnalysis {
  return {
    index,
    qualityDb: 24,
    headerQualityDb: 24,
    validColumnFraction: 1,
    usable: rejections.length === 0,
    rejections,
    ilmPx: new Float32Array(0),
    bmPx: new Float32Array(0),
    bmo: [null, null],
  };
}

function analysis(status: ExamAnalysis['status'], scans: ScanAnalysis[], rejections: ExamAnalysis['rejections'] = []): ExamAnalysis {
  return {
    examId: '210901',
    referenceId: '210001',
    patientId: 'SIM-CREW-B',
    visitId: 'FD090',
    eye: 'OD',
    examTimeMs: 0,
    status,
    rejections,
    quality: { usableScans: scans.filter((s) => s.usable).length, totalScans: scans.length, meanQualityDb: 24.1, minQualityDb: 21.7, decentrationUm: 30, features: {} },
    bmo: null,
    bmoSource: 'this-exam',
    rings: [],
    trtRingUm: null,
    mrwUm: null,
    mrwSectors: [],
    bmRoughnessUm: null,
    scans,
    engineVersion: 'test',
  };
}

const SUMMARY = { examId: '210901' } as ExamSummary;

function record(attempt: number, status: 'measured' | 'cannot-measure'): CaptureAttemptRecord {
  return { attempt, request: captureRequest('B', 'OS', 150, attempt), status, rejections: status === 'measured' ? [] : ['too-few-usable-scans'], scanRejections: status === 'measured' ? [] : ['signal-dropout'], usableScans: status === 'measured' ? 48 : 34, meanQualityDb: 24 };
}

function run(events: Parameters<typeof captureReducer>[1][]): CaptureState {
  return events.reduce(captureReducer, INITIAL_CAPTURE);
}

describe('capture attempts', () => {
  it('builds each attempt as a request without conditions', () => {
    expect(captureRequest('B', 'OS', 150, 2)).toEqual({ crewId: 'B', eye: 'OS', flightDay: 150, attempt: 2 });
  });

  it('records an attempt with the scan reasons most frequent first', () => {
    const scans = [scan(0, []), scan(1, ['motion']), scan(2, ['signal-dropout']), scan(3, ['signal-dropout', 'bmo-not-found']), scan(4, ['bmo-not-found'])];
    expect(scanRejectionCounts(scans)).toEqual([
      { reason: 'signal-dropout', count: 2 },
      { reason: 'bmo-not-found', count: 2 },
      { reason: 'motion', count: 1 },
    ]);
    const r = attemptRecord(captureRequest('B', 'OS', 150, 1), analysis('cannot-measure', scans, ['too-few-usable-scans', 'insufficient-ring-coverage']));
    expect(r).toEqual({
      attempt: 1,
      request: { crewId: 'B', eye: 'OS', flightDay: 150, attempt: 1 },
      status: 'cannot-measure',
      rejections: ['too-few-usable-scans', 'insufficient-ring-coverage'],
      scanRejections: ['signal-dropout', 'bmo-not-found', 'motion'],
      usableScans: 1,
      meanQualityDb: 24.1,
    });
  });

  it('tells first what spoiled the scans, unless the pattern was off the nerve', () => {
    expect(mainReason({ status: 'measured', rejections: [], scanRejections: [] })).toBeNull();
    expect(mainReason({ status: 'cannot-measure', rejections: ['insufficient-ring-coverage', 'too-few-usable-scans'], scanRejections: ['signal-dropout'] })).toBe('signal-dropout');
    expect(mainReason({ status: 'cannot-measure', rejections: ['too-few-usable-scans', 'decentered'], scanRejections: ['bmo-not-found'] })).toBe('decentered');
    expect(mainReason({ status: 'cannot-measure', rejections: ['too-few-usable-scans'], scanRejections: [] })).toBe('too-few-usable-scans');
    expect(mainReason({ status: 'cannot-measure', rejections: ['insufficient-ring-coverage', 'bmo-fit-failed'], scanRejections: ['motion'] })).toBe('bmo-fit-failed');
    expect(mainReason({ status: 'cannot-measure', rejections: [], scanRejections: ['truncated'] })).toBe('truncated');
  });

  it('accepts a measured first attempt', () => {
    const state = run([{ type: 'start' }, { type: 'analysed', record: record(1, 'measured'), summary: SUMMARY }]);
    expect(state.phase).toBe('accepted');
    expect(captureResult('OS', state)).toEqual({ eye: 'OS', attempts: [record(1, 'measured')], accepted: SUMMARY });
  });

  it('asks to repeat after a rejection and accepts the second attempt', () => {
    const rejected = run([{ type: 'start' }, { type: 'analysed', record: record(1, 'cannot-measure'), summary: SUMMARY }]);
    expect(rejected).toMatchObject({ phase: 'rejected', attempt: 1 });
    expect(captureResult('OS', rejected)).toBeNull();
    const ready = captureReducer(rejected, { type: 'retry' });
    expect(ready).toMatchObject({ phase: 'ready', attempt: 2 });
    const done = run([{ type: 'start' }, { type: 'analysed', record: record(1, 'cannot-measure'), summary: SUMMARY }, { type: 'retry' }, { type: 'start' }, { type: 'analysed', record: record(2, 'measured'), summary: SUMMARY }]);
    expect(done.phase).toBe('accepted');
    expect(captureResult('OS', done)?.attempts.map((a) => a.attempt)).toEqual([1, 2]);
  });

  it(`gives up after ${MAX_ATTEMPTS} attempts with nothing accepted`, () => {
    const events: Parameters<typeof captureReducer>[1][] = [];
    for (let a = 1; a <= MAX_ATTEMPTS; a++) {
      events.push({ type: 'start' }, { type: 'analysed', record: record(a, 'cannot-measure'), summary: SUMMARY });
      if (a < MAX_ATTEMPTS) events.push({ type: 'retry' });
    }
    const state = run(events);
    expect(state.phase).toBe('gave-up');
    expect(captureReducer(state, { type: 'retry' })).toBe(state);
    expect(captureResult('OS', state)).toEqual({ eye: 'OS', attempts: [1, 2, 3].map((a) => record(a, 'cannot-measure')), accepted: null });
  });

  it('does not count a stopped capture or a technical error as an attempt', () => {
    const stopped = run([{ type: 'start' }, { type: 'cancel' }]);
    expect(stopped).toEqual({ phase: 'ready', attempt: 1, records: [] });
    const failed = run([{ type: 'start' }, { type: 'failed', detail: 'boom' }]);
    expect(failed).toMatchObject({ phase: 'error', attempt: 1 });
    expect(captureReducer(failed, { type: 'retry' })).toEqual({ phase: 'ready', attempt: 1, records: [] });
  });

  it('continues without image when the worker cannot start: the eye is not measured', () => {
    const state = run([{ type: 'start' }, { type: 'unavailable', detail: 'no workers' }]);
    expect(state.phase).toBe('unavailable');
    expect(captureResult('OD', state)).toEqual({ eye: 'OD', attempts: [], accepted: null });
  });

  it('ignores events that do not belong to the current phase', () => {
    expect(captureReducer(INITIAL_CAPTURE, { type: 'analysed', record: record(1, 'measured'), summary: SUMMARY })).toBe(INITIAL_CAPTURE);
    expect(captureReducer(INITIAL_CAPTURE, { type: 'cancel' })).toBe(INITIAL_CAPTURE);
    expect(captureReducer(INITIAL_CAPTURE, { type: 'retry' })).toBe(INITIAL_CAPTURE);
  });
});
