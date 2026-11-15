/**
 * How the progress of a capture is told (spec 06, section 3): the four steps of the
 * process and one phrase for what is happening now. Pure, so it can be tested.
 */
import type { AnalysisProgress } from '@app/core';

export type StepState = 'pending' | 'current' | 'done';

export interface ProgressView {
  take: StepState;
  mark: StepState;
  locate: StepState;
  measure: StepState;
  phrase: { key: 'phase.start' | 'phase.fundus' | 'phase.read' | 'phase.quality' | 'phase.segment' | 'phase.bmo' | 'phase.fit' | 'phase.measure' | 'phase.done'; n?: number; total?: number };
  /** Coarse stage, for a polite live region that does not speak at every scan. */
  stage: 'scans' | 'fit' | 'measure' | 'done' | null;
}

export function progressView(progress: AnalysisProgress | null, started: { header: boolean; fundus: boolean }): ProgressView {
  const step = progress?.step;
  const n = progress?.scanIndex !== undefined ? progress.scanIndex + 1 : undefined;
  const total = progress?.scansTotal;
  const scanning = step === 'read' || step === 'quality' || step === 'segment' || step === 'bmo';
  const after = step === 'fit' || step === 'measure' || step === 'done';
  const scanState: StepState = after ? 'done' : scanning ? 'current' : 'pending';
  let phrase: ProgressView['phrase'];
  if (!started.header) phrase = { key: 'phase.start' };
  else if (!started.fundus) phrase = { key: 'phase.fundus' };
  else if (!step) phrase = { key: 'phase.read' };
  else phrase = { key: `phase.${step}` as ProgressView['phrase']['key'], n, total };
  return {
    take: scanState,
    mark: scanState,
    locate: step === 'fit' ? 'current' : step === 'measure' || step === 'done' ? 'done' : 'pending',
    measure: step === 'measure' ? 'current' : step === 'done' ? 'done' : 'pending',
    phrase,
    stage: scanning ? 'scans' : step === 'fit' ? 'fit' : step === 'measure' ? 'measure' : step === 'done' ? 'done' : null,
  };
}

/** Scans shown in chunks of this many when the user prefers reduced motion (spec 06, section 5). */
export const REDUCED_MOTION_CHUNK = 8;

/** How many of the scans taken are shown: all of them, or whole chunks with reduced motion. */
export function visibleCount(taken: number, total: number, reducedMotion: boolean): number {
  if (!reducedMotion || taken >= total) return taken;
  return Math.floor(taken / REDUCED_MOTION_CHUNK) * REDUCED_MOTION_CHUNK;
}
