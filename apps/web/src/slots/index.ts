/**
 * The pieces other people build, behind the contracts of specification 02,
 * section 6. The rest of the application imports them from here only.
 *
 * PROVISIONAL: each one points at a stand-in in `./provisional` until the real
 * component exists. Plugging in a real one is changing its line in this file:
 *
 *   features/vision    -> SymptomsStep, AcuityStep, AmslerStep
 *   features/oct       -> OctCaptureStep
 *   features/assistant -> AssistantPanel
 */
export { AssistantPanel } from './provisional/AssistantPlaceholder';
