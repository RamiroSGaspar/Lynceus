/**
 * The rows written by `quality:run` and read by `quality:fit`: one per planned capture,
 * with what the engine gave and, apart, the true values of the virtual eye. Simulated data.
 */
import type { PlannedCapture, ReferenceKey } from './protocol';
import type { CaptureMeasurement } from './measure';

export const ROWS_FORMAT = 'quality-rows-1';

export interface QualityRow extends PlannedCapture {
  /** Reference actually used: the planned one, or the other if the planned one was refused. */
  reference: ReferenceKey | null;
  plannedReference: ReferenceKey | null;
  /** Null when there was no reference to analyse a follow-up against. */
  measurement: CaptureMeasurement | null;
  /** True values of the virtual eye on that day: for errors only, never given to the engine or the model. */
  truth: { trtUm: number; roughnessUm: number; trtChangeUm: number; roughnessChangeUm: number; mrwUm: number };
}

export interface QualityRowsFile {
  format: typeof ROWS_FORMAT;
  simulated: true;
  notice: string;
  protocol: string;
  versions: { engine: string; instrument: string; examFormat: string; scanFormat: string };
  rows: QualityRow[];
}
