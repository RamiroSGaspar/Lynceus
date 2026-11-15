/**
 * Sample histories for the tests: well-formed values of the contract types,
 * assessed by the real rules of the core.
 *
 * SIMULATED DATA. The exams are made up here, not measured on any image.
 */
import type { CrewId, Eye, EyeCaptureResult, SessionRecord, VisionSession } from '@app/core';
import { assessSession } from '../app/core';
import { makeExamSummary, makeMeasuredCapture, makeUnmeasuredCapture } from '../sample/exams';
import { makeVisionSession } from '../sample/vision';

export interface SampleControl {
  flightDay: number;
  /** Change of the 0–250 µm ring since the pre-flight exam, in micrometres; null when the eye could not be measured. */
  od: number | null;
  os: number | null;
  /** Increase of the roughness of Bruch's membrane (folds), in micrometres. */
  roughness?: number;
  vision?: VisionSession | null;
  origin?: SessionRecord['origin'];
}

/** Pre-flight thickness of the 0–250 µm ring used by the sample histories, in micrometres. */
export const SAMPLE_BASELINE_UM: Readonly<Record<Eye, number>> = { OD: 396, OS: 391 };
const SAMPLE_BASELINE_ROUGHNESS_UM = 2;

function capture(crewId: CrewId, eye: Eye, flightDay: number, changeUm: number | null, roughnessUm: number): EyeCaptureResult {
  if (changeUm === null) return makeUnmeasuredCapture(crewId, eye, flightDay);
  const exam = makeExamSummary({
    crewId,
    eye,
    flightDay,
    trtRingUm: SAMPLE_BASELINE_UM[eye] + changeUm,
    bmRoughnessUm: SAMPLE_BASELINE_ROUGHNESS_UM + roughnessUm,
  });
  return makeMeasuredCapture(crewId, exam, flightDay);
}

/** One more control on top of a history, assessed with everything before it. */
export function sampleRecord(history: readonly SessionRecord[], crewId: CrewId, control: SampleControl): SessionRecord {
  const eyes = {
    OD: capture(crewId, 'OD', control.flightDay, control.od, control.roughness ?? 0),
    OS: capture(crewId, 'OS', control.flightDay, control.os, control.roughness ?? 0),
  };
  const vision = control.vision === undefined ? makeVisionSession() : control.vision;
  const earlier = history.filter((record) => record.flightDay < control.flightDay);
  const assessment = assessSession({ crewId, flightDay: control.flightDay, eyes, vision, history: earlier });
  return {
    crewId,
    flightDay: control.flightDay,
    origin: control.origin ?? 'precomputed',
    eyes,
    vision,
    assessment,
    questions: [],
  };
}

/** The pre-flight exam (flight day 0) followed by the controls given, oldest first. */
export function sampleHistory(crewId: CrewId, controls: readonly SampleControl[]): SessionRecord[] {
  const records: SessionRecord[] = [];
  for (const control of [{ flightDay: 0, od: 0, os: 0 }, ...controls]) {
    records.push(sampleRecord(records, crewId, control));
  }
  return records;
}

/** A typical first-sign course: rises slowly and passes NASA's first threshold near flight day 90. */
export const FIRST_SIGN_CONTROLS: readonly SampleControl[] = [
  { flightDay: 30, od: 15, os: 10 },
  { flightDay: 90, od: 24, os: 17 },
  { flightDay: 150, od: 31, os: 23 },
];
