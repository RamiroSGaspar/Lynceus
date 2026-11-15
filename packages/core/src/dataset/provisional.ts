/**
 * What an exam says about itself when it did not come from the analysis engine.
 *
 * The first versions of the product built the controls of the crew history from
 * the scenario tables plus a small invented error: nothing in them was measured on
 * an image. That path is gone (`measuredHistory.ts` replaced it), but records saved
 * in a browser by those versions still carry this text. The screens compare an
 * exam's `engineVersion` with the engine's own to tell the two apart, so the text
 * stays, and such records are never relabelled as measured.
 */

/** Written in every exam that was not produced by the analysis engine. */
export const PROVISIONAL_ENGINE_VERSION = 'provisional-history-1 (scenario tables, not measured on images)';
