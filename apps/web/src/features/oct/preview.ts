/**
 * The image behind a result: the fundus image and one B-scan of an exam, regenerated from
 * its request in the worker. The same request always gives the same image, so what was
 * generated once is kept in memory and shown at once the next time. Nothing is stored and
 * nothing leaves the device.
 */
import type { CaptureRequest } from '@app/core';
import { useEffect, useState } from 'react';
import type { FundusFrame, ScanFrame } from './examStore';
import { startJob, type JobHandle } from './jobs';

export interface ExamPreview {
  fundus: FundusFrame;
  /** Fundus pixel size, mm. */
  scaleXMm: number;
  scaleYMm: number;
  /** The scan shown as the second evidence, with what the engine marks on it. */
  scan: ScanFrame;
  totalScans: number;
}

export type PreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; preview: ExamPreview }
  | { status: 'failed'; detail: string };

/** The scan a result shows before the viewer is opened: the first one, horizontal through the nerve. */
export const PREVIEW_SCAN = 0;
/** Previews kept: both eyes of a few controls. One takes about 2.7 MB (fundus image and one scan). */
const CACHE_SIZE = 8;

const cache = new Map<string, ExamPreview>();
const waiting = new Map<string, Set<(state: PreviewState) => void>>();
const running = new Map<string, JobHandle>();

const keyOf = (request: CaptureRequest): string => `${request.crewId}/${request.eye}/${request.flightDay}/${request.attempt}`;

function settle(key: string, state: PreviewState): void {
  running.delete(key);
  const listeners = waiting.get(key);
  waiting.delete(key);
  listeners?.forEach((listener) => listener(state));
}

function remember(key: string, preview: ExamPreview): void {
  cache.delete(key);
  cache.set(key, preview);
  while (cache.size > CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/** Asks for a preview; several screens asking for the same exam share one job. Returns how to stop waiting. */
function request(captureRequest: CaptureRequest, listener: (state: PreviewState) => void): () => void {
  const key = keyOf(captureRequest);
  let listeners = waiting.get(key);
  if (!listeners) {
    listeners = new Set();
    waiting.set(key, listeners);
  }
  listeners.add(listener);
  if (!running.has(key)) {
    running.set(
      key,
      startJob(
        { type: 'preview', request: captureRequest, scan: PREVIEW_SCAN },
        (message) => {
          if (message.type === 'preview') {
            const preview: ExamPreview = {
              fundus: message.fundus,
              scaleXMm: message.header.scaleXSloMm,
              scaleYMm: message.header.scaleYSloMm,
              scan: message.scan,
              totalScans: message.header.numBScans,
            };
            remember(key, preview);
            settle(key, { status: 'ready', preview });
          } else if (message.type === 'error') {
            settle(key, { status: 'failed', detail: message.message });
          }
        },
        (failure) => settle(key, { status: 'failed', detail: failure.detail }),
      ),
    );
  }
  return () => {
    const current = waiting.get(key);
    current?.delete(listener);
    // Nobody is waiting any more: the worker is stopped rather than left drawing for no one.
    if (current && current.size === 0) {
      waiting.delete(key);
      running.get(key)?.cancel();
      running.delete(key);
    }
  };
}

/** The preview of an exam, generated once per request. `null`: there is no exam to show. */
export function useExamPreview(captureRequest: CaptureRequest | null): PreviewState {
  const key = captureRequest ? keyOf(captureRequest) : null;
  const [state, setState] = useState<{ key: string | null; value: PreviewState }>(() => {
    const cached = key ? cache.get(key) : undefined;
    return { key, value: cached ? { status: 'ready', preview: cached } : { status: key ? 'loading' : 'idle' } };
  });

  useEffect(() => {
    if (!captureRequest || !key) {
      setState({ key: null, value: { status: 'idle' } });
      return;
    }
    const cached = cache.get(key);
    if (cached) {
      setState({ key, value: { status: 'ready', preview: cached } });
      return;
    }
    setState({ key, value: { status: 'loading' } });
    return request(captureRequest, (value) => setState({ key, value }));
    // The request is identified by its key: a new object with the same values is the same exam.
  }, [key]);

  // While the effect has not caught up with a new request, what is held belongs to the previous one.
  if (state.key !== key) {
    const cached = key ? cache.get(key) : undefined;
    return cached ? { status: 'ready', preview: cached } : { status: key ? 'loading' : 'idle' };
  }
  return state.value;
}
