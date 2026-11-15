/**
 * Starting OCT worker jobs from the screen. Each job gets its own worker, which is
 * terminated when the job ends or is cancelled.
 */
import type { WorkerJob, WorkerMessage } from './protocol';

export interface JobHandle {
  cancel(): void;
}

export type JobFailure =
  /** The browser could not create the worker at all. */
  | { kind: 'unavailable'; detail: string }
  /** The worker started but stopped with an error. */
  | { kind: 'crashed'; detail: string };

const FINAL: ReadonlySet<WorkerMessage['type']> = new Set(['done', 'vol-done', 'ground-truth', 'error']);

export function startJob(job: WorkerJob, onMessage: (message: WorkerMessage) => void, onFailure: (failure: JobFailure) => void): JobHandle {
  let worker: Worker;
  try {
    if (typeof Worker === 'undefined') throw new Error('Web Workers are not supported');
    worker = new Worker(new URL('./octWorker.ts', import.meta.url), { type: 'module', name: `oct-${job.type}` });
  } catch (error) {
    onFailure({ kind: 'unavailable', detail: error instanceof Error ? error.message : String(error) });
    return { cancel: () => {} };
  }
  let received = false;
  let finished = false;
  const stop = () => {
    finished = true;
    worker.terminate();
  };
  worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
    if (finished) return;
    received = true;
    const message = event.data;
    if (FINAL.has(message.type)) stop();
    onMessage(message);
  };
  worker.onerror = (event) => {
    if (finished) return;
    event.preventDefault();
    stop();
    // A worker that fails before saying anything most likely could not load at all.
    onFailure({ kind: received ? 'crashed' : 'unavailable', detail: event.message || 'Worker error' });
  };
  worker.onmessageerror = () => {
    if (finished) return;
    stop();
    onFailure({ kind: 'crashed', detail: 'A message from the worker could not be read' });
  };
  worker.postMessage(job);
  return { cancel: () => !finished && stop() };
}
