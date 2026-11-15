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

export type ModelResult =
  | { kind: 'text'; text: string }
  | { kind: 'refusal' }
  | { kind: 'truncated' }
  | { kind: 'rate-limited' }
  | { kind: 'error' };

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
}

/** Never returns the API's error message or anything about the key. */
export async function callModel(
  fetchImpl: FetchLike,
  apiKey: string,
  body: ReturnType<typeof buildApiBody>,
  timeoutMs = TIMEOUT_MS,
): Promise<ModelResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
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
    if (response.status === 429) return { kind: 'rate-limited' };
    if (!response.ok) return { kind: 'error' };
    const data = (await response.json()) as ApiMessage;
    if (data.stop_reason === 'refusal') return { kind: 'refusal' };
    if (data.stop_reason === 'max_tokens') return { kind: 'truncated' };
    if (data.stop_reason !== 'end_turn' || !Array.isArray(data.content)) return { kind: 'error' };
    const text = data.content
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text)
      .join('');
    return { kind: 'text', text };
  } catch {
    return { kind: 'error' };
  } finally {
    clearTimeout(timer);
  }
}
