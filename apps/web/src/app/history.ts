import type { CrewId, Eye, Level, Quantity, SessionRecord } from '@app/core';

/**
 * The history shown for a crew member: what comes with the application before
 * the chosen mission day, plus the controls done in this browser up to that day.
 * A control done here replaces the one of the same day that comes with the
 * application: it is what the astronaut actually did.
 */
export function mergeHistory(
  precomputed: readonly SessionRecord[],
  live: readonly SessionRecord[],
  crewId: CrewId,
  throughFlightDay: number,
): SessionRecord[] {
  const byDay = new Map<number, SessionRecord>();
  for (const record of precomputed) {
    if (record.crewId === crewId && record.flightDay <= throughFlightDay) byDay.set(record.flightDay, record);
  }
  for (const record of live) {
    // Flight day 0 is the pre-flight reference exam: it is never replaced from here.
    if (record.crewId === crewId && record.flightDay > 0 && record.flightDay <= throughFlightDay) {
      byDay.set(record.flightDay, record);
    }
  }
  return [...byDay.values()].sort((a, b) => a.flightDay - b.flightDay);
}

/** What the assessment of a control on `flightDay` is given as history: everything strictly before it. */
export function historyBefore(history: readonly SessionRecord[], flightDay: number): SessionRecord[] {
  return history.filter((record) => record.flightDay < flightDay);
}

export function findRecord(history: readonly SessionRecord[], flightDay: number): SessionRecord | null {
  return history.find((record) => record.flightDay === flightDay) ?? null;
}

/** The pre-flight session (flight day 0): the astronaut's own reference. */
export function baselineOf(history: readonly SessionRecord[]): SessionRecord | null {
  return findRecord(history, 0);
}

/** The most recent in-flight control. */
export function lastControl(history: readonly SessionRecord[]): SessionRecord | null {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const record = history[index];
    if (record && record.flightDay > 0) return record;
  }
  return null;
}

/** In-flight controls only, oldest first. */
export function inFlightControls(history: readonly SessionRecord[]): SessionRecord[] {
  return history.filter((record) => record.flightDay > 0);
}

/** One control of one eye, as the charts draw it. */
export interface ChangePoint {
  eye: Eye;
  flightDay: number;
  origin: SessionRecord['origin'];
  measured: boolean;
  level: Level | null;
  /** Change of the 0–250 µm ring since the pre-flight exam. Null when the eye could not be measured. */
  change: Quantity | null;
}

export function changePoints(history: readonly SessionRecord[], eye: Eye): ChangePoint[] {
  return inFlightControls(history).map((record) => {
    const assessment = record.assessment.eyes[eye];
    const change = assessment.measured ? (assessment.change?.trtRingUm ?? null) : null;
    return {
      eye,
      flightDay: record.flightDay,
      origin: record.origin,
      measured: change !== null,
      level: change !== null ? assessment.level : null,
      change,
    };
  });
}
