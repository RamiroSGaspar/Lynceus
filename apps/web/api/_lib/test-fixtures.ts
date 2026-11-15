/** Shared fixtures for the assistant tests. Simulated data; no network. */
import type { AssistantContext } from './contract.js';
import type { FetchLike } from './anthropic.js';

export const SAMPLE_CONTEXT: AssistantContext = {
  flightDay: 90,
  level: 'first-sign',
  alert: 'advisory',
  eyes: {
    OD: {
      measured: true,
      level: 'first-sign',
      changes: [
        { measure: 'trt-0-250', changeUm: 24.1, interval95Um: [17.9, 30.3] },
        { measure: 'mrw', changeUm: 18.2, interval95Um: null },
      ],
      thresholds: [
        { id: 'trt-first-sign', thresholdUm: 19.4, exceeded: true, probabilityExceeded: 0.86, word: 'likely' },
        { id: 'trt-clinically-concerning', thresholdUm: 55, exceeded: false, probabilityExceeded: 0.01, word: 'unlikely' },
      ],
      capture: { attempts: 1, usableScans: 47, totalScans: 48, meanQualityDb: 31.5 },
    },
    OS: {
      measured: true,
      level: 'no-detectable-change',
      changes: [{ measure: 'trt-0-250', changeUm: 8.3, interval95Um: [2.1, 14.5] }],
      thresholds: [{ id: 'trt-first-sign', thresholdUm: 19.4, exceeded: false, probabilityExceeded: 0.05, word: 'unlikely' }],
      capture: { attempts: 2, usableScans: 45, totalScans: 48, meanQualityDb: 27 },
    },
  },
  findings: ['swelling-first-sign'],
  nextSteps: ['oct-in-4-weeks', 'amsler-twice-a-week', 'report-routine'],
  contact: 'routine-report',
  nextOctFlightDay: 118,
};

export interface ModelOutput {
  in_scope: boolean;
  category: string;
  answer: string;
  source_ids: string[];
}

export interface RecordedCall {
  url: string;
  init: RequestInit;
  body: Record<string, unknown>;
}

/** A fake Messages API: answers every call with the given status and body, and records the calls. */
export function fakeApi(response: { status?: number; body: unknown } | (() => Promise<Response>)) {
  const calls: RecordedCall[] = [];
  const fetch: FetchLike = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(String(init.body)) as Record<string, unknown> });
    if (typeof response === 'function') return response();
    return new Response(JSON.stringify(response.body), {
      status: response.status ?? 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  return { fetch, calls };
}

/** A successful API message whose text block carries `output` as JSON, after an empty thinking block. */
export function apiMessage(output: ModelOutput | string, stopReason = 'end_turn') {
  return {
    type: 'message',
    role: 'assistant',
    stop_reason: stopReason,
    content: [
      { type: 'thinking', thinking: '', signature: 'sig' },
      { type: 'text', text: typeof output === 'string' ? output : JSON.stringify(output) },
    ],
    usage: { input_tokens: 10, output_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
  };
}

export function answer(partial: Partial<ModelOutput>): ModelOutput {
  return { in_scope: true, category: 'sans', answer: 'Text.', source_ids: [], ...partial };
}
