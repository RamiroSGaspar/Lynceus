import { useCallback, useEffect, useRef, useState } from 'react';
import { ExamStore } from './examStore';
import { startJob, type JobHandle } from './jobs';
import type { WorkerJob } from './protocol';

export type ExamJobStatus = 'idle' | 'running' | 'done' | 'error' | 'unavailable';

export interface ExamJob {
  status: ExamJobStatus;
  store: ExamStore | null;
  /** Changes whenever the store does; use it as a dependency for drawing. */
  version: number;
  error: string | null;
  start(job: Extract<WorkerJob, { type: 'capture' }>): void;
  cancel(): void;
}

/**
 * Runs one capture job at a time in a worker and exposes what has arrived. Leaving
 * the component or starting another job terminates the worker (spec 06, section 2).
 * Screen updates are batched to one per animation frame.
 */
export function useExamJob(): ExamJob {
  const [status, setStatus] = useState<ExamJobStatus>('idle');
  const [store, setStore] = useState<ExamStore | null>(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const handle = useRef<JobHandle | null>(null);
  const frame = useRef<number | null>(null);

  const cancel = useCallback(() => {
    handle.current?.cancel();
    handle.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const start = useCallback(
    (job: Extract<WorkerJob, { type: 'capture' }>) => {
      cancel();
      const next = new ExamStore();
      setStore(next);
      setError(null);
      setStatus('running');
      const bump = () => {
        if (frame.current !== null) return;
        frame.current = requestAnimationFrame(() => {
          frame.current = null;
          setVersion((v) => v + 1);
        });
      };
      handle.current = startJob(
        job,
        (message) => {
          next.apply(message);
          if (message.type === 'done') {
            handle.current = null;
            setStatus('done');
          } else if (message.type === 'error') {
            handle.current = null;
            setError(message.message);
            setStatus('error');
          }
          bump();
        },
        (failure) => {
          handle.current = null;
          setError(failure.detail);
          setStatus(failure.kind === 'unavailable' ? 'unavailable' : 'error');
        },
      );
    },
    [cancel],
  );

  useEffect(() => cancel, [cancel]);

  return { status, store, version, error, start, cancel };
}
