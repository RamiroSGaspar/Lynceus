import { buildApiBody, callModel, TIMEOUT_MS, type FetchLike } from './anthropic.js';
import type { AssistantResponse } from './contract.js';
import { sourcesForStatements } from './knowledge.js';
import { RateLimiter } from './rate-limit.js';
import { reviewModelOutput } from './review.js';
import { validateRequest } from './validate.js';

export interface HandlerDeps {
  /** Read from `ANTHROPIC_API_KEY` by the caller, server side only. */
  apiKey: string | undefined;
  fetch: FetchLike;
  now: () => number;
  limiter: RateLimiter;
  timeoutMs?: number;
}

const MAX_BODY_BYTES = 16 * 1024;

function reply(body: AssistantResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

const invalid = (status = 400) => reply({ status: 'refused', reason: 'invalid-input' }, status);

/** Vercel overwrites these headers with the real client address. */
export function clientIp(headers: Headers): string {
  return headers.get('x-real-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export async function handleAssistant(request: Request, ip: string, deps: HandlerDeps): Promise<Response> {
  if (request.method !== 'POST') return invalid(405);
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return invalid(415);

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return invalid();
  }
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return invalid(413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return invalid();
  }
  const clean = validateRequest(body);
  if (!clean) return invalid();

  if (!deps.apiKey) return reply({ status: 'unavailable', reason: 'no-key' }, 503);
  if (!deps.limiter.take(ip, deps.now())) return reply({ status: 'unavailable', reason: 'rate-limited' }, 429);

  const result = await callModel(
    deps.fetch,
    deps.apiKey,
    buildApiBody(clean.question, clean.locale, clean.context),
    deps.timeoutMs ?? TIMEOUT_MS,
  );
  switch (result.kind) {
    case 'refusal':
      return reply({ status: 'refused', reason: 'out-of-scope' }, 200);
    case 'rate-limited':
      return reply({ status: 'unavailable', reason: 'rate-limited' }, 429);
    case 'truncated':
    case 'error':
      return reply({ status: 'unavailable', reason: 'upstream-error' }, 502);
  }

  const review = reviewModelOutput(result.text, clean.context);
  if (review.kind === 'refused') return reply({ status: 'refused', reason: 'out-of-scope' }, 200);
  if (review.kind === 'unsafe') return reply({ status: 'refused', reason: 'unsafe-output' }, 200);
  return reply({ status: 'answered', answer: review.answer, sources: sourcesForStatements(review.statementIds) }, 200);
}
