/**
 * One capture of the validation matrix through the virtual instrument and the engine,
 * reduced to what is kept: status, reasons, the engine's quality features and the
 * measures. No pixels and no per-scan arrays. Simulated data.
 *
 * The engine receives the exam and, for a follow-up, the summary of its reference,
 * exactly as in the application, but with the provisional error model, which refuses
 * nothing of its own. The true values are joined later, by the program,
 * and only to compute errors.
 */
import { PROVISIONAL_ERROR_MODEL, acquire, analyzeExam, summarize, type ExamRejection, type ExamSummary, type ScanRejection } from '@app/core';
import type { PlannedCapture } from './protocol';

const SCAN_REJECTIONS: readonly ScanRejection[] = ['low-signal', 'signal-dropout', 'truncated', 'surface-not-found', 'bmo-not-found', 'motion'];

/** What the engine gave for one capture. Non-finite numbers are stored as null (JSON cannot keep them). */
export interface CaptureMeasurement {
  id: string;
  status: 'measured' | 'cannot-measure';
  rejections: ExamRejection[];
  /** Reasons given by individual scans, most frequent first. */
  scanRejections: ScanRejection[];
  examId: string;
  /** Exam id of the reference it was analysed against; null for a reference. */
  baselineExamId: string | null;
  bmoSource: ExamSummary['bmoSource'];
  meanQualityDb: number;
  /** `ExamQuality.features`, as the engine computed them from the image. */
  features: Record<string, number | null>;
  trtUm: number | null;
  roughnessUm: number | null;
  mrwUm: number | null;
}

function finite(value: number | undefined | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Measures one planned capture; `baseline` is the summary of its reference (absent for a reference). */
export function measureCapture(capture: PlannedCapture, baseline?: ExamSummary): { measurement: CaptureMeasurement; summary: ExamSummary } {
  // The provisional model has no domain: the rows record the engine's own refusals only, and the
  // domain of the model being validated is applied afterwards, from the features.
  const analysis = analyzeExam(acquire(capture.request), { ...(baseline ? { baseline } : {}), errorModel: PROVISIONAL_ERROR_MODEL });
  const counts = new Map<ScanRejection, number>();
  for (const scan of analysis.scans) for (const reason of scan.rejections) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  const summary = summarize(analysis);
  const features: Record<string, number | null> = {};
  for (const key of Object.keys(summary.quality.features).sort()) features[key] = finite(summary.quality.features[key]);
  return {
    summary,
    measurement: {
      id: capture.id,
      status: summary.status,
      rejections: [...summary.rejections],
      scanRejections: SCAN_REJECTIONS.filter((r) => counts.has(r)).sort((a, b) => counts.get(b)! - counts.get(a)!),
      examId: summary.examId,
      baselineExamId: baseline?.examId ?? null,
      bmoSource: summary.bmoSource,
      meanQualityDb: summary.quality.meanQualityDb,
      features,
      trtUm: finite(summary.trtRingUm?.value),
      roughnessUm: finite(summary.bmRoughnessUm?.value),
      mrwUm: finite(summary.mrwUm?.value),
    },
  };
}
