import { buildApiBody, callModel, describeFailure, TIMEOUT_MS, type ApiUsage, type FetchLike, type ModelResult, type UpstreamFailure } from './anthropic.js';
import type { AssistantResponse } from './contract.js';
import { sourcesForStatements } from './knowledge.js';
import { RateLimiter } from './rate-limit.js';
import { reviewModelOutput, type ReviewResult } from './review.js';
import { validateRequest } from './validate.js';

export interface HandlerDeps {
  /** Read from `ANTHROPIC_API_KEY` by the caller, server side only. */
  apiKey: string | undefined;
  fetch: FetchLike;
  now: () => number;
  limiter: RateLimiter;
  timeoutMs?: number;
  /** Server-side diagnosis of each model call; nothing in it reaches the browser. */
  report?: (diagnostic: AssistantDiagnostic) => void;
}

/**
 * One per model call. `failure` carries only an HTTP status and a documented error
 * type. `draft` is the model's text when the review blocked it: kept for local
 * diagnosis of the review, never sent to the browser and never logged by the server.
 */
export interface AssistantDiagnostic {
  model: ModelResult['kind'];
  failure?: UpstreamFailure;
  usage?: ApiUsage | null;
  review?: ReviewResult['kind'];
  why?: string;
  draft?: string;
}

/** A log line for failures and blocked answers, or null. Never the question, the draft or anything from the key. */
export function diagnosticLine(d: AssistantDiagnostic): string | null {
  if (d.failure) return `[assistant] ${d.model}: ${describeFailure(d.failure)}`;
  if (d.model === 'truncated') return '[assistant] answer cut at max_tokens';
  if (d.review === 'unsafe') return `[assistant] answer blocked by the review: ${d.why}`;
  return null;
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
  const report = deps.report ?? (() => undefined);
  switch (result.kind) {
    case 'refusal':
      report({ model: result.kind, usage: result.usage });
      return reply({ status: 'refused', reason: 'out-of-scope' }, 200);
    case 'rate-limited':
      report({ model: result.kind, failure: result.failure });
      return reply({ status: 'unavailable', reason: 'rate-limited' }, 429);
    case 'truncated':
      report({ model: result.kind, usage: result.usage });
      return reply({ status: 'unavailable', reason: 'upstream-error' }, 502);
    case 'error':
      report({ model: result.kind, failure: result.failure });
      return reply({ status: 'unavailable', reason: 'upstream-error' }, 502);
  }

  const review = reviewModelOutput(result.text, clean.context);
  report({
    model: 'text',
    usage: result.usage,
    review: review.kind,
    ...(review.kind === 'unsafe' ? { why: review.why, draft: result.text } : {}),
  });
  if (review.kind === 'refused') return reply({ status: 'refused', reason: 'out-of-scope' }, 200);
  if (review.kind === 'unsafe') return reply({ status: 'refused', reason: 'unsafe-output' }, 200);
  return reply({ status: 'answered', answer: review.answer, sources: sourcesForStatements(review.statementIds) }, 200);
}
