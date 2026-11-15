/**
 * The pieces other people build, behind the contracts of specification 02,
 * section 6. The rest of the application imports them from here only, so
 * plugging one in is changing its line in this file.
 *
 *   features/vision    -> SymptomsStep, AcuityStep, AmslerStep   (real)
 *   features/assistant -> AssistantPanel                         (real)
 *   features/oct       -> OctCaptureStep                         (PROVISIONAL stand-in)
 */
export { AcuityStep, AmslerStep, SymptomsStep } from '../features/vision';
export { AssistantPanel } from '../features/assistant';
export { OctCaptureStep } from './provisional/OctCapturePlaceholder';
