import { describe, expect, it } from 'vitest';
import { askAssistant, parseResponse } from './client';

const REQUEST = { question: 'What is SANS?', locale: 'en' as const, context: null };

function fetchReturning(status: number, body: unknown): typeof fetch {
  return async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
}

describe('assistant client', () => {
  it('passes through the three documented answers', async () => {
    const answered = { status: 'answered', answer: 'Text', sources: [{ id: 'macias-2020', title: 'T', url: 'https://x.org/a' }] };
    expect(await askAssistant(REQUEST, fetchReturning(200, answered))).toEqual(answered);
    expect(await askAssistant(REQUEST, fetchReturning(200, { status: 'refused', reason: 'unsafe-output' }))).toEqual({ status: 'refused', reason: 'unsafe-output' });
    expect(await askAssistant(REQUEST, fetchReturning(429, { status: 'unavailable', reason: 'rate-limited' }))).toEqual({ status: 'unavailable', reason: 'rate-limited' });
  });

  it('turns anything unexpected into an upstream error, never into text to show', async () => {
    expect(await askAssistant(REQUEST, fetchReturning(500, '<html>error</html>'))).toEqual({ status: 'unavailable', reason: 'upstream-error' });
    expect(parseResponse({ status: 'answered', answer: 'x', sources: [{ id: 'a', title: 't', url: 'javascript:alert(1)' }] })).toEqual({ status: 'unavailable', reason: 'upstream-error' });
    expect(parseResponse({ status: 'refused', reason: 'because I said so' })).toEqual({ status: 'unavailable', reason: 'upstream-error' });
    expect(parseResponse({ status: 'answered', answer: 'x', sources: [], extra: 'dropped' })).toEqual({ status: 'answered', answer: 'x', sources: [] });
  });

  it('reports a network failure as offline, without throwing', async () => {
    const offline: typeof fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await askAssistant(REQUEST, offline)).toEqual({ status: 'unavailable', reason: 'offline' });
  });

  it('sends only the question, the language and the context, as JSON, to the same origin', async () => {
    let seen: { url: string; init: RequestInit } | null = null;
    const spy: typeof fetch = async (url, init) => {
      seen = { url: String(url), init: init! };
      return new Response(JSON.stringify({ status: 'refused', reason: 'out-of-scope' }));
    };
    await askAssistant(REQUEST, spy);
    expect(seen!.url).toBe('/api/assistant');
    expect(seen!.init.method).toBe('POST');
    expect(JSON.parse(String(seen!.init.body))).toEqual(REQUEST);
  });
});
