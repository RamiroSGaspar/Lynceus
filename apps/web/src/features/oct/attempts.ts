/**
 * Attempts of one eye's capture (spec 06, section 3): up to three, each a capture
 * request with its own attempt number and no conditions, so the scenario decides
 * what happens. Pure functions: the screen only dispatches events.
 */
import type { CaptureAttemptRecord, CaptureRequest, CrewId, Eye, EyeCaptureResult, ExamAnalysis, ExamRejection, ExamSummary, ScanRejection } from '@app/core';
import { SCAN_REJECTIONS, type CaptureReason } from './reasons';

/** Captures before saying "I cannot measure this eye today": our assumption (arquitectura.md, section 12, item 10). */
export const MAX_ATTEMPTS = 3;

export function captureRequest(crewId: CrewId, eye: Eye, flightDay: number, attempt: number): CaptureRequest {
  return { crewId, eye, flightDay, attempt };
}

/** Reasons given by individual scans, most frequent first (ties in the contract's order). */
export function scanRejectionCounts(scans: readonly { rejections: readonly ScanRejection[] }[]): { reason: ScanRejection; count: number }[] {
  const counts = new Map<ScanRejection, number>();
  for (const scan of scans) for (const reason of scan.rejections) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  return SCAN_REJECTIONS.filter((reason) => counts.has(reason))
    .map((reason) => ({ reason, count: counts.get(reason)! }))
    .sort((a, b) => b.count - a.count);
}

export function attemptRecord(request: CaptureRequest, analysis: ExamAnalysis): CaptureAttemptRecord {
  return {
    attempt: request.attempt,
    request,
    status: analysis.status,
    rejections: [...analysis.rejections],
    scanRejections: scanRejectionCounts(analysis.scans).map((entry) => entry.reason),
    usableScans: analysis.quality.usableScans,
    meanQualityDb: analysis.quality.meanQualityDb,
  };
}

/**
 * Order in which exam reasons explain a failed capture best. A decentred pattern spoils
 * everything else; "too few usable scans" is a consequence, so what spoiled the scans
 * is said instead (as the rules do, `packages/core/src/rules/assess.ts`).
 */
const EXAM_ORDER: readonly ExamRejection[] = [
  'decentered',
  'too-few-usable-scans',
  'bmo-mismatch-with-baseline',
  'bmo-fit-failed',
  'insufficient-ring-coverage',
];

/** The reason to tell first, or null when the attempt was measured. */
export function mainReason(record: Pick<CaptureAttemptRecord, 'status' | 'rejections' | 'scanRejections'>): CaptureReason | null {
  if (record.status === 'measured') return null;
  for (const rejection of EXAM_ORDER) {
    if (!record.rejections.includes(rejection)) continue;
    return rejection === 'too-few-usable-scans' && record.scanRejections[0] ? record.scanRejections[0] : rejection;
  }
  return record.rejections[0] ?? record.scanRejections[0] ?? null;
}

export type CaptureState =
  | { phase: 'ready'; attempt: number; records: CaptureAttemptRecord[] }
  | { phase: 'running'; attempt: number; records: CaptureAttemptRecord[] }
  | { phase: 'accepted'; attempt: number; records: CaptureAttemptRecord[]; accepted: ExamSummary }
  | { phase: 'rejected'; attempt: number; records: CaptureAttemptRecord[] }
  | { phase: 'gave-up'; attempt: number; records: CaptureAttemptRecord[] }
  | { phase: 'error'; attempt: number; records: CaptureAttemptRecord[]; detail: string }
  | { phase: 'unavailable'; attempt: number; records: CaptureAttemptRecord[]; detail: string };

export type CaptureEvent =
  | { type: 'start' }
  | { type: 'cancel' }
  | { type: 'analysed'; record: CaptureAttemptRecord; summary: ExamSummary }
  | { type: 'retry' }
  | { type: 'failed'; detail: string }
  | { type: 'unavailable'; detail: string };

export const INITIAL_CAPTURE: CaptureState = { phase: 'ready', attempt: 1, records: [] };

export function captureReducer(state: CaptureState, event: CaptureEvent): CaptureState {
  const { attempt, records } = state;
  switch (event.type) {
    case 'start':
      return state.phase === 'ready' ? { phase: 'running', attempt, records } : state;
    case 'cancel':
      // A stopped capture does not count as an attempt.
      return state.phase === 'running' ? { phase: 'ready', attempt, records } : state;
    case 'analysed': {
      if (state.phase !== 'running') return state;
      const next = [...records, event.record];
      if (event.record.status === 'measured') return { phase: 'accepted', attempt, records: next, accepted: event.summary };
      return attempt >= MAX_ATTEMPTS ? { phase: 'gave-up', attempt, records: next } : { phase: 'rejected', attempt, records: next };
    }
    case 'retry':
      if (state.phase === 'rejected') return { phase: 'ready', attempt: attempt + 1, records };
      if (state.phase === 'error' || state.phase === 'unavailable') return { phase: 'ready', attempt, records };
      return state;
    case 'failed':
      return state.phase === 'running' ? { phase: 'error', attempt, records, detail: event.detail } : state;
    case 'unavailable':
      return state.phase === 'running' || state.phase === 'ready' ? { phase: 'unavailable', attempt, records, detail: event.detail } : state;
  }
}

/**
 * What the guided session receives. Only final phases have one: an accepted exam, three
 * failed attempts, or giving up on the image (no worker, or an error) with what was done.
 */
export function captureResult(eye: Eye, state: CaptureState): EyeCaptureResult | null {
  switch (state.phase) {
    case 'accepted':
      return { eye, attempts: state.records, accepted: state.accepted };
    case 'gave-up':
    case 'error':
    case 'unavailable':
      return { eye, attempts: state.records, accepted: null };
    default:
      return null;
  }
}
