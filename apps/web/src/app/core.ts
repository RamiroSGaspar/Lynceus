/**
 * The single place where the application takes the rules, the texts and the crew
 * history from. Screens import from here, never from the provisional stand-in.
 *
 * PROVISIONAL: these come from `provisional/sampleCore` until the real functions
 * of specification 04 are in `@app/core`. Switching is an edit of this file only.
 */
export {
  CREW,
  MISSION,
  TRT_CLINICALLY_CONCERNING_UM,
  TRT_FIRST_SIGN_UM,
  assessSession,
  getHistory,
} from '../provisional/sampleCore';
export type { AssessmentInput } from '../provisional/sampleCore';

/** True while the rules behind the screens are the provisional stand-in. Shown on screen so nobody mistakes them for the product's rules. */
export const CORE_IS_PROVISIONAL = true;
