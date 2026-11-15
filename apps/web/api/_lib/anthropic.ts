/**
 * Call to the Claude Messages API with `fetch`, no package. Format from
 * `arquitectura-claude-y-vercel.md` sections 2, 4 and 5.2: URL, headers and
 * version, model `claude-haiku-5-5`, `output_config.effort: "medium"`, no
 * `temperature`/`top_p`/`top_k`, `cache_control` on the fixed part of `system`,
 * structured output, and only `text` blocks read from the answer.
 */
import type { AssistantContext, AssistantLocale } from './contract.js';
import { OUTPUT_SCHEMA, SYSTEM_PROMPT, buildUserMessage } from './prompt.js';

export const API_URL = 'https://api.anthropic.com/v1/messages';
export const API_VERSION = '2026-10-21';
export const MODEL = 'claude-haiku-5-5';
/** Answers are at most 1200 characters, but reasoning counts inside `max_tokens`, so leave room. */
export const MAX_TOKENS = 4096;
export const TIMEOUT_MS = 20_000;

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/** Error types of the API, `arquitectura-claude-y-vercel.md` section 5.2; any other value is reported as `unknown`. */
export const API_ERROR_TYPES = [
  'invalid_request_error',
  'authentication_error',
  'billing_error',
  'permission_error',
  'not_found_error',
  'request_too_large',
  'rate_limit_error',
  'api_error',
  'timeout_error',
  'overloaded_error',
] as const;
export type ApiErrorType = (typeof API_ERROR_TYPES)[number] | 'unknown';

/**
 * Why a call gave no usable text, for server-side diagnosis only: an HTTP status
 * and the documented error type, never the API's message, headers or request id.
 */
export type UpstreamFailure =
  | { cause: 'http'; httpStatus: number; errorType: ApiErrorType }
  | { cause: 'timeout' | 'network' }
  | { cause: 'unexpected-response'; stopReason: string | null };

export interface ApiUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export type ModelResult =
  | { kind: 'text'; text: string; usage: ApiUsage | null }
  | { kind: 'refusal'; usage: ApiUsage | null }
  | { kind: 'truncated'; usage: ApiUsage | null }
  | { kind: 'rate-limited'; failure: UpstreamFailure }
  | { kind: 'error'; failure: UpstreamFailure };

export function buildApiBody(question: string, locale: AssistantLocale, context: AssistantContext | null) {
  return {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: buildUserMessage(question, locale, context) }],
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
    },
  };
}

interface ApiMessage {
  stop_reason?: string;
  content?: { type?: string; text?: string }[];
  usage?: Record<string, unknown>;
}

const count = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

function readUsage(usage: Record<string, unknown> | undefined): ApiUsage | null {
  if (typeof usage !== 'object' || usage === null) return null;
  return {
    inputTokens: count(usage.input_tokens),
    outputTokens: count(usage.output_tokens),
    cacheReadTokens: count(usage.cache_read_input_tokens),
    cacheWriteTokens: count(usage.cache_creation_input_tokens),
  };
}

/** Reads only `error.type` from an error body, and only if it is a documented value. */
async function errorType(response: Response): Promise<ApiErrorType> {
  try {
    const type = ((await response.json()) as { error?: { type?: unknown } }).error?.type;
    return API_ERROR_TYPES.find((t) => t === type) ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

const stopReasonOf = (value: unknown) => (typeof value === 'string' && /^[a-z_]{1,40}$/.test(value) ? value : null);

/** Never returns the API's error message or anything about the key. */
export async function callModel(
  fetchImpl: FetchLike,
  apiKey: string,
  body: ReturnType<typeof buildApiBody>,
  timeoutMs = TIMEOUT_MS,
): Promise<ModelResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let answered = false;
  try {
    const response = await fetchImpl(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'anthropic-version': API_VERSION,
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const failure: UpstreamFailure = { cause: 'http', httpStatus: response.status, errorType: await errorType(response) };
      return { kind: response.status === 429 ? 'rate-limited' : 'error', failure };
    }
    answered = true;
    const data = (await response.json()) as ApiMessage;
    const usage = readUsage(data.usage);
    if (data.stop_reason === 'refusal') return { kind: 'refusal', usage };
    if (data.stop_reason === 'max_tokens') return { kind: 'truncated', usage };
    if (data.stop_reason !== 'end_turn' || !Array.isArray(data.content)) {
      return { kind: 'error', failure: { cause: 'unexpected-response', stopReason: stopReasonOf(data.stop_reason) } };
    }
    const text = data.content
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text)
      .join('');
    return { kind: 'text', text, usage };
  } catch {
    if (controller.signal.aborted) return { kind: 'error', failure: { cause: 'timeout' } };
    return { kind: 'error', failure: answered ? { cause: 'unexpected-response', stopReason: null } : { cause: 'network' } };
  } finally {
    clearTimeout(timer);
  }
}

/** One line without secrets, for server logs and the red-team run. */
export function describeFailure(failure: UpstreamFailure): string {
  switch (failure.cause) {
    case 'http':
      return `HTTP ${failure.httpStatus} ${failure.errorType}`;
    case 'unexpected-response':
      return `unexpected response (stop_reason ${failure.stopReason ?? 'missing'})`;
    default:
      return failure.cause;
  }
}

/**
 * Failures that the same request will hit again until someone changes the key,
 * the account, the spend limit or the request: retrying only spends calls.
 */
export function isConfigurationFailure(failure: UpstreamFailure): boolean {
  return failure.cause === 'http' && [400, 401, 402, 403, 404, 413].includes(failure.httpStatus);
}
