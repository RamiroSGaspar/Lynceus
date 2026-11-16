/**
 * Messages between the screen and the OCT worker (spec 06, section 2). Both sides
 * import these types, so a change of shape breaks the build on both.
 *
 * One job per worker: terminating the worker cancels the job.
 */
import type {
  AnalysisProgress,
  BScanHeader,
  CaptureRequest,
  CrewId,
  Eye,
  EyeGroundTruth,
  ExamAnalysis,
  ExamSummary,
  ScanAnalysis,
  VolHeader,
} from '@app/core';

export type WorkerJob =
  /** Acquire an exam with the virtual instrument and analyse it while it is taken. */
  | { type: 'capture'; request: CaptureRequest; baseline?: ExamSummary }
  /** Regenerate an exam and stream it as the blocks of a `.vol` file. */
  | { type: 'download'; request: CaptureRequest }
  /** True values of the fictional eye (transparency view only). */
  | { type: 'ground-truth'; crewId: CrewId; eye: Eye; flightDay: number }
  /**
   * The image behind a result without the wait of a whole exam: the fundus image and one
   * B-scan with what the engine marks on it. The measures are not computed again: they are
   * the ones saved with the control.
   */
  | { type: 'preview'; request: CaptureRequest; scan: number };

export type WorkerMessage =
  | { type: 'header'; header: VolHeader }
  /** Fundus image, `height × width` grey levels. The buffer is transferred. */
  | { type: 'fundus'; width: number; height: number; gray: Uint8Array }
  | { type: 'progress'; progress: AnalysisProgress }
  /**
   * One B-scan as soon as the engine has analysed it: display grey levels (one byte per
   * pixel, buffer transferred), its header and what the engine marked on it.
   */
  | { type: 'scan'; index: number; header: BScanHeader; width: number; height: number; gray: Uint8ClampedArray; analysis: ScanAnalysis }
  | { type: 'done'; analysis: ExamAnalysis; elapsedMs: number; workerHeapBytes: number | null }
  /** One block of the `.vol` file (buffer transferred). */
  | { type: 'vol-block'; index: number; total: number; bytes: Uint8Array }
  | { type: 'vol-done'; totalBytes: number }
  | { type: 'ground-truth'; truth: EyeGroundTruth }
  /** Answer to a `preview` job, in one message. The two image buffers are transferred. */
  | {
      type: 'preview';
      header: VolHeader;
      fundus: { width: number; height: number; gray: Uint8Array };
      scan: { index: number; header: BScanHeader; width: number; height: number; gray: Uint8ClampedArray; analysis: ScanAnalysis };
    }
  | { type: 'error'; message: string };

export type PostMessage = (message: WorkerMessage, transfer: Transferable[]) => void;
