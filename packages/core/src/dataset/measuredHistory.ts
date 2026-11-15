/**
 * History of the fictional crew, measured by the analysis engine. Simulated data.
 *
 * Every exam in `measured-history.json` was produced by the virtual instrument and
 * measured by the engine, the pre-flight exam first and then each control against
 * the astronaut's own pre-flight exam. The file is computed ahead of time by
 * `pnpm --filter @app/validation history:generate` and read here: nothing is
 * generated when the application starts, builds or runs its normal tests.
 *
 * Only compact summaries are kept, with the requests and attempts that produced them
 * and the versions used (`MeasuredHistoryDataset`). The vision tests and the
 * questionnaire of each session are fictional scenarios, not read from a tomography.
 * The ranges and probabilities still come from the provisional error model.
 */
import type { CrewId, SessionRecord } from '../contract';
import { CREW } from '../mission';
import dataset from './measured-history.json';

/** What the file is: written first, so that a reader can refuse a file in another format. */
export const MEASURED_HISTORY_FORMAT = 'measured-history-1';

/** Versions of everything that produced the file. A change in any of them calls for generating it again. */
export interface MeasuredHistoryVersions {
  /** Version of the analysis engine that measured the exams. */
  engine: string;
  /** Version of the rules that assessed the sessions and chose the calendar. */
  rules: string;
  /** Version of the error model behind the ranges. Provisional until the validation stage. */
  errorModel: string;
  /** Formats of the virtual instrument's output. The instrument has no version of its own. */
  instrument: { examFormat: string; scanFormat: string };
  /** Seed text of the fictional vision scenarios. */
  visionScenarios: string;
}

/** The file written by the generator. It carries no date and no timing, so the same inputs give the same bytes. */
export interface MeasuredHistoryDataset {
  format: typeof MEASURED_HISTORY_FORMAT;
  simulated: true;
  notice: string;
  versions: MeasuredHistoryVersions;
  /** Captures of one eye in one session before saying that the eye cannot be measured. */
  maxAttempts: number;
  /** Sessions of each crew member, oldest first, the pre-flight session (flight day 0) first. */
  crew: Readonly<Record<CrewId, readonly SessionRecord[]>>;
}

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const DATASET = dataset as unknown as MeasuredHistoryDataset;

/** The header of the file (everything except the sessions): formats, versions and limits. */
export function getHistoryInfo(): Omit<MeasuredHistoryDataset, 'crew'> {
  const { crew: _crew, ...info } = DATASET;
  return copy(info);
}

/**
 * The sessions of a crew member before a flight day, oldest first, including the
 * pre-flight session (flight day 0). Every record is `precomputed`. Each call
 * returns its own copy: changing it does not change the next answer.
 */
export function getHistory(crewId: CrewId, beforeFlightDay: number): SessionRecord[] {
  if (!CREW.some((member) => member.id === crewId)) throw new Error(`Unknown crew member: ${String(crewId)}`);
  const sessions = DATASET.crew[crewId];
  if (!sessions) throw new Error(`The history file has no sessions of crew member ${crewId}`);
  return copy(sessions.filter((record) => record.flightDay < beforeFlightDay));
}
