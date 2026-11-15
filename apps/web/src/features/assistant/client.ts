import type { AnswerSource, AssistantRequest, AssistantResponse } from '../../../api/_lib/contract';

export type ClientResponse = AssistantResponse | { status: 'unavailable'; reason: 'offline' };

export const ASSISTANT_ENDPOINT = '/api/assistant';
const CLIENT_TIMEOUT_MS = 30_000;

const REFUSED = ['out-of-scope', 'invalid-input', 'unsafe-output'];
const UNAVAILABLE = ['no-key', 'rate-limited', 'upstream-error'];
const UPSTREAM_ERROR: ClientResponse = { status: 'unavailable', reason: 'upstream-error' };

function isSource(value: unknown): value is AnswerSource {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  return typeof s.id === 'string' && typeof s.title === 'string' && typeof s.url === 'string' && s.url.startsWith('https://');
}

/** Accepts only the three documented shapes; anything else counts as a failed answer. */
export function parseResponse(data: unknown): ClientResponse {
  if (typeof data !== 'object' || data === null) return UPSTREAM_ERROR;
  const r = data as Record<string, unknown>;
  if (r.status === 'answered' && typeof r.answer === 'string' && Array.isArray(r.sources) && r.sources.every(isSource)) {
    return {
      status: 'answered',
      answer: r.answer,
      sources: r.sources.map((s) => ({ id: s.id, title: s.title, url: s.url })),
    };
  }
  if (r.status === 'refused' && typeof r.reason === 'string' && REFUSED.includes(r.reason)) {
    return { status: 'refused', reason: r.reason as 'out-of-scope' };
  }
  if (r.status === 'unavailable' && typeof r.reason === 'string' && UNAVAILABLE.includes(r.reason)) {
    return { status: 'unavailable', reason: r.reason as 'no-key' };
  }
  return UPSTREAM_ERROR;
}

/** Never throws: a failed request becomes an `unavailable` answer. */
export async function askAssistant(
  request: AssistantRequest,
  fetchImpl: typeof fetch = (input, init) => fetch(input, init),
): Promise<ClientResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetchImpl(ASSISTANT_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    return controller.signal.aborted ? UPSTREAM_ERROR : { status: 'unavailable', reason: 'offline' };
  }
  try {
    return parseResponse(await response.json());
  } catch {
    return UPSTREAM_ERROR;
  } finally {
    clearTimeout(timer);
  }
}
