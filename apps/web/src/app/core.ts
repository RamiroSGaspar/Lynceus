/**
 * What the application takes from the core: the crew, the mission, NASA's
 * thresholds, the rules, the texts and the crew history. Screens import these
 * from here, so the list of what the interface depends on is in one place.
 */
import { getHistory as coreGetHistory, type CrewId, type SessionRecord } from '@app/core';

export {
  CREW,
  MISSION,
  PROVISIONAL_ENGINE_VERSION,
  TRT_CLINICALLY_CONCERNING_UM,
  TRT_FIRST_SIGN_UM,
  assessSession,
  explainAssessment,
  isProvisionalErrorModel,
} from '@app/core';
export type { AssessmentInput, Explanation } from '@app/core';

const historyCache = new Map<string, SessionRecord[]>();

/**
 * The sessions of a crew member that come with the application, before a flight
 * day, oldest first, with the pre-flight session (flight day 0) first.
 *
 * The core computes them from its rules every time; the result depends only on
 * the arguments, so it is kept here. The screens then get the same records on
 * every render.
 */
export function getHistory(crewId: CrewId, beforeFlightDay: number): SessionRecord[] {
  const key = `${crewId}:${beforeFlightDay}`;
  let history = historyCache.get(key);
  if (!history) {
    history = coreGetHistory(crewId, beforeFlightDay);
    historyCache.set(key, history);
  }
  return history;
}
