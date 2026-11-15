/**
 * Generation of the crew history (specification 07): for each crew member, the
 * pre-flight exam of each eye measured by the engine, and then each control the rules
 * ask for, measured against the astronaut's own pre-flight exam, until the mission
 * ends. Simulated data. Shared by the `history:generate` program and the tests.
 *
 * Nothing here reads the true values of the virtual eye: the engine receives the exam
 * and, for a control, the summary of the pre-flight exam, as in the application.
 */
import {
  acquire,
  analyzeExam,
  assessSession,
  summarize,
  visionScenario,
  MISSION,
  type CaptureAttemptRecord,
  type CaptureRequest,
  type CrewId,
  type Eye,
  type EyeCaptureResult,
  type ExamSummary,
  type ScanRejection,
  type SessionRecord,
} from '@app/core';

/** Captures of one eye before saying "I cannot measure this eye today" (arquitectura.md, section 12, item 10). */
export const MAX_ATTEMPTS = 3;

/** Contract's order: the tie-break when two scan reasons are equally frequent. Same list as the application's capture step. */
const SCAN_REJECTIONS: readonly ScanRejection[] = ['low-signal', 'signal-dropout', 'truncated', 'surface-not-found', 'bmo-not-found', 'motion'];

/** What measuring one request gives: the summary and, apart, the reasons the scans gave. */
export interface Measurement {
  summary: ExamSummary;
  scanRejections: ScanRejection[];
}

/** Measures one capture request. `baseline` is the pre-flight summary of the same eye, absent for the pre-flight exam itself. */
export type Measurer = (request: CaptureRequest, baseline?: ExamSummary) => Measurement;

export type Assessor = typeof assessSession;

/** The real measurer: the virtual instrument and the analysis engine, with the application's request and options. */
export const measureRequest: Measurer = (request, baseline) => {
  const analysis = analyzeExam(acquire(request), baseline ? { baseline } : {});
  const counts = new Map<ScanRejection, number>();
  for (const scan of analysis.scans) for (const reason of scan.rejections) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  const scanRejections = SCAN_REJECTIONS.filter((reason) => counts.has(reason)).sort((a, b) => counts.get(b)! - counts.get(a)!);
  return { summary: summarize(analysis), scanRejections };
};

function attemptRecord(request: CaptureRequest, { summary, scanRejections }: Measurement): CaptureAttemptRecord {
  return {
    attempt: request.attempt,
    request,
    status: summary.status,
    rejections: [...summary.rejections],
    scanRejections,
    usableScans: summary.quality.usableScans,
    meanQualityDb: summary.quality.meanQualityDb,
  };
}

/** Up to `MAX_ATTEMPTS` captures of one eye on one day; it stops at the first one the engine accepts. */
export function captureEye(measure: Measurer, crewId: CrewId, eye: Eye, flightDay: number, baseline?: ExamSummary): EyeCaptureResult {
  const attempts: CaptureAttemptRecord[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const request: CaptureRequest = { crewId, eye, flightDay, attempt };
    const measurement = measure(request, baseline);
    attempts.push(attemptRecord(request, measurement));
    if (measurement.summary.status === 'measured') return { eye, attempts, accepted: measurement.summary };
  }
  return { eye, attempts, accepted: null };
}

/** The pre-flight exam of one eye is the reference of every later control: without one the set is not published. */
export class MissingReferenceError extends Error {
  constructor(crewId: CrewId, eye: Eye, attempts: readonly CaptureAttemptRecord[]) {
    super(
      `${crewId} ${eye}: no valid pre-flight reference after ${attempts.length} attempts (` +
        attempts.map((a) => `attempt ${a.attempt}: ${[...a.rejections, ...a.scanRejections].join(', ') || 'no reason'}`).join('; ') +
        ')',
    );
  }
}

/**
 * The sessions of one crew member, oldest first, from the pre-flight one to the end of
 * the mission. Each assessment decides the next control; a date that does not move
 * forward would never end and stops the generation.
 */
export function simulateCrew(
  crewId: CrewId,
  measure: Measurer,
  onSession: (record: SessionRecord) => void = () => {},
  assess: Assessor = assessSession,
): SessionRecord[] {
  const records: SessionRecord[] = [];
  const baselines = {} as Record<Eye, ExamSummary>;
  const seen = new Set<number>();
  let flightDay: number | null = 0;
  while (flightDay !== null && flightDay <= MISSION.durationDays) {
    if (seen.has(flightDay)) throw new Error(`${crewId}: flight day ${flightDay} comes up twice, the calendar loops`);
    seen.add(flightDay);
    const day: number = flightDay;
    const eyes = { OD: captureEye(measure, crewId, 'OD', day, baselines.OD), OS: captureEye(measure, crewId, 'OS', day, baselines.OS) };
    if (day === 0) {
      for (const eye of ['OD', 'OS'] as const) {
        if (!eyes[eye].accepted) throw new MissingReferenceError(crewId, eye, eyes[eye].attempts);
        baselines[eye] = eyes[eye].accepted;
      }
    }
    const vision = visionScenario(crewId, day);
    const assessment = assess({ crewId, flightDay: day, eyes, vision, history: records });
    const record: SessionRecord = { crewId, flightDay: day, origin: 'precomputed', eyes, vision, assessment, questions: [] };
    records.push(record);
    onSession(record);
    const next: number | null = assessment.nextOct?.flightDay ?? null;
    if (next !== null && next <= day) throw new Error(`${crewId}: the assessment of day ${day} asks for day ${next}, which does not come after it`);
    flightDay = next;
  }
  return records;
}
