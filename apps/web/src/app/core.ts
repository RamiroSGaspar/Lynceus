/**
 * What the application takes from the core: the crew, the mission, NASA's
 * thresholds, the rules, the texts and the crew history. Screens import these
 * from here, so the list of what the interface depends on is in one place.
 */
export {
  CREW,
  MISSION,
  TRT_CLINICALLY_CONCERNING_UM,
  TRT_FIRST_SIGN_UM,
  assessSession,
  explainAssessment,
  getHistory,
} from '@app/core';
export type { AssessmentInput, Explanation } from '@app/core';
