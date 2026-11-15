/**
 * Integrity checks of the history file. Pure and fast: they read the file's own
 * contents and the rules, never the instrument's pixels, so the generator can run
 * them before publishing a file and the normal tests can run them on every run.
 *
 * A problem is a sentence naming where it is; an empty list means the file is sound.
 * These checks say the file is consistent, not that the measures are right: that is
 * what comparing it with a fresh run of the engine (`history:generate --check`) is for.
 */
import type { CaptureRequest, CrewId, Eye, EyeCaptureResult, SessionRecord } from '../contract';
import { acquire } from '../instrument/acquire';
import { CREW, MISSION } from '../mission';
import { assessSession } from '../rules/assess';
import { MEASURED_HISTORY_FORMAT, type MeasuredHistoryDataset } from './measuredHistory';

const EYES: readonly Eye[] = ['OD', 'OS'];

/** Paths of numbers that a JSON file cannot keep as they are: NaN, infinities and negative zero. */
export function unstableNumbers(value: unknown, path = '$'): string[] {
  if (typeof value === 'number') return Number.isFinite(value) && !Object.is(value, -0) ? [] : [path];
  if (Array.isArray(value)) return value.flatMap((item, index) => unstableNumbers(item, `${path}[${index}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => unstableNumbers(item, `${path}.${key}`));
  }
  return [];
}

function checkEye(record: SessionRecord, eye: Eye, maxAttempts: number, reference: SessionRecord | null): string[] {
  const where = `${record.crewId} day ${record.flightDay} ${eye}`;
  const capture: EyeCaptureResult = record.eyes[eye];
  const problems: string[] = [];
  const member = CREW.find((crew) => crew.id === record.crewId)!;
  if (capture.eye !== eye) problems.push(`${where}: the capture says it is eye ${capture.eye}`);
  if (capture.attempts.length < 1 || capture.attempts.length > maxAttempts) {
    problems.push(`${where}: ${capture.attempts.length} attempts (1 to ${maxAttempts} allowed)`);
  }
  capture.attempts.forEach((attempt, index) => {
    const expected: CaptureRequest = { crewId: record.crewId, eye, flightDay: record.flightDay, attempt: index + 1 };
    if (JSON.stringify(attempt.request) !== JSON.stringify(expected)) {
      problems.push(`${where}: attempt ${index + 1} has the request ${JSON.stringify(attempt.request)}`);
    }
    if (attempt.attempt !== index + 1) problems.push(`${where}: attempt number ${attempt.attempt} at position ${index + 1}`);
    const last = index === capture.attempts.length - 1;
    const accepted = capture.accepted !== null && last;
    if (attempt.status !== (accepted ? 'measured' : 'cannot-measure')) {
      problems.push(`${where}: attempt ${index + 1} is ${attempt.status}`);
    }
    if (attempt.status === 'cannot-measure' && attempt.rejections.length === 0 && attempt.scanRejections.length === 0) {
      problems.push(`${where}: attempt ${index + 1} was refused without a reason`);
    }
  });
  const accepted = capture.accepted;
  if (!accepted) {
    if (capture.attempts.length !== maxAttempts) problems.push(`${where}: no result after ${capture.attempts.length} attempts`);
    return problems;
  }
  const request = capture.attempts.at(-1)?.request;
  if (!request) return problems;
  const header = acquire(request).header;
  if (accepted.examId !== header.id) problems.push(`${where}: exam id ${accepted.examId}, the request gives ${header.id}`);
  if (accepted.referenceId !== header.referenceId) problems.push(`${where}: reference id ${accepted.referenceId}, the request gives ${header.referenceId}`);
  if (accepted.visitId !== header.visitId) problems.push(`${where}: visit ${accepted.visitId}, the request gives ${header.visitId}`);
  if (accepted.examTimeMs !== header.examTimeMs) problems.push(`${where}: exam time differs from the request's`);
  if (accepted.patientId !== member.patientId) problems.push(`${where}: patient ${accepted.patientId}`);
  if (accepted.eye !== eye) problems.push(`${where}: the exam is of eye ${accepted.eye}`);
  if (accepted.status !== 'measured') problems.push(`${where}: the accepted exam is ${accepted.status}`);
  const last = capture.attempts.at(-1)!;
  if (last.usableScans !== accepted.quality.usableScans || last.meanQualityDb !== accepted.quality.meanQualityDb) {
    problems.push(`${where}: the last attempt's record does not match the accepted exam`);
  }
  if (!accepted.trtRingUm || !accepted.mrwUm || !accepted.bmRoughnessUm || !accepted.bmo) {
    problems.push(`${where}: a measure is missing`);
  } else {
    if (accepted.rings.length !== 4) problems.push(`${where}: ${accepted.rings.length} rings`);
    if (accepted.rings[0]?.thickness.value !== accepted.trtRingUm.value) problems.push(`${where}: the 0–250 µm ring is not the TRT`);
    for (const measure of [accepted.trtRingUm, accepted.mrwUm, accepted.bmRoughnessUm, ...accepted.rings.map((ring) => ring.thickness)]) {
      if (measure.origin !== 'measured') problems.push(`${where}: a measure comes as ${measure.origin}`);
    }
  }
  if ('scans' in accepted) problems.push(`${where}: per-scan arrays were kept`);
  if (record.flightDay > 0) {
    const preflight = reference?.eyes[eye].accepted;
    if (!preflight) problems.push(`${where}: no pre-flight exam of this eye to compare with`);
    else if (accepted.referenceId !== preflight.referenceId) problems.push(`${where}: compared with another series than the pre-flight exam's`);
  }
  return problems;
}

/** Every problem found in a history file, in reading order. */
export function checkHistoryDataset(dataset: MeasuredHistoryDataset): string[] {
  const problems: string[] = [];
  if (dataset.format !== MEASURED_HISTORY_FORMAT) problems.push(`format ${dataset.format}`);
  if (dataset.simulated !== true || !dataset.notice) problems.push('the file does not say that it is simulated');
  for (const path of unstableNumbers(dataset)) problems.push(`${path} is a number that JSON cannot keep as it is`);
  for (const member of CREW) {
    const sessions = dataset.crew[member.id as CrewId] ?? [];
    if (sessions.length === 0) problems.push(`${member.id}: no sessions`);
    sessions.forEach((record, index) => {
      const where = `${member.id} day ${record.flightDay}`;
      const earlier = sessions.slice(0, index);
      if (index === 0 && record.flightDay !== 0) problems.push(`${member.id}: the first session is day ${record.flightDay}, not the pre-flight one`);
      if (index > 0) {
        const asked = sessions[index - 1]!.assessment.nextOct?.flightDay;
        if (record.flightDay <= sessions[index - 1]!.flightDay) problems.push(`${where}: does not come after day ${sessions[index - 1]!.flightDay}`);
        if (record.flightDay !== asked) problems.push(`${where}: the previous assessment asked for day ${String(asked)}`);
      }
      if (record.flightDay > MISSION.durationDays) problems.push(`${where}: after the end of the mission`);
      if (record.crewId !== member.id) problems.push(`${where}: record of crew member ${record.crewId}`);
      if (record.origin !== 'precomputed') problems.push(`${where}: origin ${record.origin}`);
      if (record.questions.length > 0) problems.push(`${where}: has questions`);
      if (!record.vision) problems.push(`${where}: no vision session`);
      for (const eye of EYES) problems.push(...checkEye(record, eye, dataset.maxAttempts, sessions[0] ?? null));
      const again = assessSession({ crewId: member.id, flightDay: record.flightDay, eyes: record.eyes, vision: record.vision, history: earlier });
      if (JSON.stringify(again) !== JSON.stringify(record.assessment)) problems.push(`${where}: the stored assessment is not what the rules give now`);
    });
    const final = sessions.at(-1);
    if (final && final.assessment.nextOct !== null) problems.push(`${member.id}: the calendar does not end`);
  }
  return problems;
}
