/**
 * Vercel function `POST /api/assistant` (Node.js runtime, Web request handler).
 * The API key comes only from the `ANTHROPIC_API_KEY` environment variable and
 * never leaves the server. Everything else lives in `_lib/`, which Vercel does not
 * expose as functions.
 */
import { clientIp, diagnosticLine, handleAssistant } from './_lib/handler.js';
import { RateLimiter } from './_lib/rate-limit.js';

const limiter = new RateLimiter();

async function handler(request: Request): Promise<Response> {
  return handleAssistant(request, clientIp(request.headers), {
    apiKey: process.env.ANTHROPIC_API_KEY,
    fetch: (url, init) => fetch(url, init),
    now: () => Date.now(),
    limiter,
    report: (diagnostic) => {
      const line = diagnosticLine(diagnostic);
      if (line) console.warn(line);
    },
  });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
