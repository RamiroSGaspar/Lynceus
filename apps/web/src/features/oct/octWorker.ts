/**
 * The OCT worker: generating and analysing an exam takes seconds and moves about
 * 78 MB, so it never runs on the screen's thread (spec 06, section 2).
 */
import { acquire, analyzeExamSteps, groundTruth, toDisplayGray, writeVolBlocks } from '@app/core';
import { segmentScan } from '@app/core/engine/segment';
import type { WorkerJob, WorkerMessage } from './protocol';
import { runJob, type RunnerDeps } from './runner';

interface WorkerScope {
  onmessage: ((event: MessageEvent<WorkerJob>) => void) | null;
  postMessage(message: WorkerMessage, options: { transfer: Transferable[] }): void;
}

const scope = self as unknown as WorkerScope;

const deps: RunnerDeps = {
  acquire: (request) => acquire(request),
  analyzeExamSteps,
  toDisplayGray,
  writeVolBlocks,
  groundTruth,
  segmentScan: (scan, header) =>
    segmentScan(scan, { sizeX: header.sizeX, sizeZ: header.sizeZ, scaleXUm: header.scaleXMm * 1000, scaleZUm: header.scaleZMm * 1000 }).analysis,
  now: () => performance.now(),
  heapBytes: () => (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? null,
};

scope.onmessage = (event) => {
  runJob(event.data, (message, transfer) => scope.postMessage(message, { transfer }), deps);
};
