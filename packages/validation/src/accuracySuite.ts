/**
 * Accuracy of the engine on normal captures (spec 01, test 6): for every eye, the
 * reference exam and the exams of days 0 (a repeated pre-flight capture), 30, 90 and
 * 150; the change measured by the engine against the true change of the virtual eye.
 * A capture the engine refuses is repeated (attempt 2, 3), as the application does.
 * Shared by the `accuracy` program and the accuracy tests.
 */
import { acquire, analyzeExam, compareWithBaseline, groundTruth, summarize, type CrewId, type Eye, type ExamSummary } from '@app/core';

export const ACCURACY_DAYS = [0, 30, 90, 150] as const;
export const MAX_ATTEMPTS = 3;

export interface AccuracyRow {
  crewId: CrewId;
  eye: Eye;
  flightDay: number;
  /** Attempt that was measured; attempts before it were refused. */
  attempt: number;
  refused: string[];
  trueChangeUm: number;
  measuredChangeUm: number;
  errorUm: number;
  trueRoughnessChangeUm: number;
  measuredRoughnessChangeUm: number;
  roughnessErrorUm: number;
  trueMrwUm: number;
  measuredMrwUm: number;
  bmoAreaChangePct: number;
  qualityDb: number;
  bmoSource: string;
  seconds: number;
}

function measure(crewId: CrewId, eye: Eye, flightDay: number, first: number, baseline?: ExamSummary): { summary: ExamSummary; attempt: number; refused: string[] } {
  const refused: string[] = [];
  for (let attempt = first; attempt < first + MAX_ATTEMPTS; attempt++) {
    const summary = summarize(analyzeExam(acquire({ crewId, eye, flightDay, attempt }), baseline ? { baseline } : {}));
    if (summary.status === 'measured') return { summary, attempt, refused };
    refused.push(`attempt ${attempt}: ${summary.rejections.join(', ')}`);
  }
  throw new Error(`${crewId} ${eye} day ${flightDay}: no attempt could be measured (${refused.join('; ')})`);
}

/** All rows of one eye. */
export function accuracyForEye(crewId: CrewId, eye: Eye): AccuracyRow[] {
  const base = measure(crewId, eye, 0, 1);
  const truth0 = groundTruth(crewId, eye, 0);
  const rows: AccuracyRow[] = [];
  for (const flightDay of ACCURACY_DAYS) {
    const t0 = performance.now();
    // Day 0: a second pre-flight capture, compared with the reference one (true change 0).
    const m = measure(crewId, eye, flightDay, flightDay === 0 ? base.attempt + 1 : 1, base.summary);
    const change = compareWithBaseline(m.summary, base.summary);
    const truth = groundTruth(crewId, eye, flightDay);
    const trueChange = truth.trtRingUm - truth0.trtRingUm;
    const trueRough = truth.bmRoughnessUm - truth0.bmRoughnessUm;
    rows.push({
      crewId,
      eye,
      flightDay,
      attempt: m.attempt,
      refused: m.refused,
      trueChangeUm: trueChange,
      measuredChangeUm: change.trtRingUm.value,
      errorUm: change.trtRingUm.value - trueChange,
      trueRoughnessChangeUm: trueRough,
      measuredRoughnessChangeUm: change.bmRoughnessUm.value,
      roughnessErrorUm: change.bmRoughnessUm.value - trueRough,
      trueMrwUm: truth.mrwUm,
      measuredMrwUm: m.summary.mrwUm!.value,
      bmoAreaChangePct: change.bmoAreaChangePct,
      qualityDb: m.summary.quality.meanQualityDb,
      bmoSource: m.summary.bmoSource,
      seconds: (performance.now() - t0) / 1000,
    });
  }
  return rows;
}
