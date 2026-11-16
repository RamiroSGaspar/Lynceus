/**
 * What the OCT worker does with a job, written without any worker API so the
 * protocol can be tested in Node. `octWorker.ts` wires it to `postMessage`.
 */
import type { AnalyzeOptions, AnalysisProgress, BScan, CaptureRequest, CrewId, Eye, EyeGroundTruth, ExamAnalysis, ExamSource, ScanAnalysis, VolHeader } from '@app/core';
import type { PostMessage, WorkerJob } from './protocol';

export interface RunnerDeps {
  acquire(request: CaptureRequest): ExamSource;
  analyzeExamSteps(exam: ExamSource, options?: AnalyzeOptions): Generator<AnalysisProgress, ExamAnalysis>;
  toDisplayGray(pixels: Float32Array): Uint8ClampedArray;
  writeVolBlocks(exam: ExamSource): Generator<Uint8Array>;
  groundTruth(crewId: CrewId, eye: Eye, flightDay: number): EyeGroundTruth;
  /** What the engine marks on one B-scan on its own: its two edges and the ends of Bruch's membrane. */
  segmentScan(scan: BScan, header: VolHeader): ScanAnalysis;
  now(): number;
  /** Heap in use, when the browser tells (non-standard); null otherwise. */
  heapBytes(): number | null;
}

/**
 * The engine asks the instrument for each B-scan once. Keeping the last one lets the
 * worker send its pixels to the screen without drawing the scan a second time.
 */
function rememberLastScan(exam: ExamSource): { source: ExamSource; scan(index: number): BScan } {
  let last: BScan | null = null;
  const source: ExamSource = {
    header: exam.header,
    get slo() {
      return exam.slo;
    },
    bscan(index) {
      if (last?.index !== index) last = exam.bscan(index);
      return last;
    },
  };
  return { source, scan: (index) => (last?.index === index ? last : exam.bscan(index)) };
}

function capture(job: Extract<WorkerJob, { type: 'capture' }>, post: PostMessage, deps: RunnerDeps): void {
  const start = deps.now();
  const exam = deps.acquire(job.request);
  const { header } = exam;
  post({ type: 'header', header }, []);
  // A copy: the exam keeps its fundus image and the transfer would empty it.
  const fundus = exam.slo.slice();
  post({ type: 'fundus', width: header.sizeXSlo, height: header.sizeYSlo, gray: fundus }, [fundus.buffer]);
  const memo = rememberLastScan(exam);
  const steps = deps.analyzeExamSteps(memo.source, {
    baseline: job.baseline,
    onScan: (analysis) => {
      const scan = memo.scan(analysis.index);
      const gray = deps.toDisplayGray(scan.pixels);
      post(
        { type: 'scan', index: analysis.index, header: scan.header, width: header.sizeX, height: header.sizeZ, gray, analysis },
        [gray.buffer],
      );
    },
  });
  for (;;) {
    const next = steps.next();
    if (next.done) {
      post({ type: 'done', analysis: next.value, elapsedMs: deps.now() - start, workerHeapBytes: deps.heapBytes() }, []);
      return;
    }
    post({ type: 'progress', progress: next.value }, []);
  }
}

function download(job: Extract<WorkerJob, { type: 'download' }>, post: PostMessage, deps: RunnerDeps): void {
  const exam = deps.acquire(job.request);
  const total = exam.header.numBScans + 2;
  let index = 0;
  let totalBytes = 0;
  for (const block of deps.writeVolBlocks(exam)) {
    // Some blocks are views on memory the exam keeps (the fundus image): send a copy of those.
    const bytes = block.byteOffset === 0 && block.byteLength === block.buffer.byteLength && block !== exam.slo ? block : block.slice();
    totalBytes += bytes.byteLength;
    post({ type: 'vol-block', index, total, bytes }, [bytes.buffer]);
    index++;
  }
  post({ type: 'vol-done', totalBytes }, []);
}

/** The fundus image and one scan with its edges: what a result shows before the viewer is opened. */
function preview(job: Extract<WorkerJob, { type: 'preview' }>, post: PostMessage, deps: RunnerDeps): void {
  const exam = deps.acquire(job.request);
  const { header } = exam;
  // A copy: the exam keeps its fundus image and the transfer would empty it.
  const fundus = exam.slo.slice();
  const scan = exam.bscan(job.scan);
  const gray = deps.toDisplayGray(scan.pixels);
  post(
    {
      type: 'preview',
      header,
      fundus: { width: header.sizeXSlo, height: header.sizeYSlo, gray: fundus },
      scan: { index: scan.index, header: scan.header, width: header.sizeX, height: header.sizeZ, gray, analysis: deps.segmentScan(scan, header) },
    },
    [fundus.buffer, gray.buffer],
  );
}

export function runJob(job: WorkerJob, post: PostMessage, deps: RunnerDeps): void {
  try {
    if (job.type === 'capture') capture(job, post, deps);
    else if (job.type === 'download') download(job, post, deps);
    else if (job.type === 'preview') preview(job, post, deps);
    else post({ type: 'ground-truth', truth: deps.groundTruth(job.crewId, job.eye, job.flightDay) }, []);
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : String(error) }, []);
  }
}
