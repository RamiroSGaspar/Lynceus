import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
// Relative import on purpose: the config is bundled before workspace packages resolve.
import { PRODUCT } from '../../packages/core/src/product.ts';
import { diagnosticLine, handleAssistant, type AssistantDiagnostic } from './api/_lib/handler.ts';
import { RateLimiter } from './api/_lib/rate-limit.ts';

/** Injects the product name into index.html so the name stays defined in one place. */
function productName(): Plugin {
  return {
    name: 'product-name',
    transformIndexHtml: (html) => html.replaceAll('%PRODUCT_NAME%', PRODUCT.name),
  };
}

/**
 * Development only: mounts the same function as Vercel at `/api/assistant`. The
 * key is read here, in the Node process (its environment, or `.env.local`, only
 * the `ANTHROPIC_` prefix), so it never reaches the browser bundle.
 */
function assistantApi(): Plugin {
  return {
    name: 'assistant-api',
    apply: 'serve',
    configureServer(server) {
      const limiter = new RateLimiter();
      const report = (d: AssistantDiagnostic) => {
        const line = diagnosticLine(d);
        if (line) server.config.logger.warn(line);
      };
      const fileEnv = loadEnv(server.config.mode, server.config.envDir || server.config.root, 'ANTHROPIC_');
      server.middlewares.use('/api/assistant', async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const headers = new Headers();
        for (const [name, value] of Object.entries(req.headers)) {
          if (typeof value === 'string') headers.set(name, value);
        }
        const method = req.method ?? 'GET';
        const request = new Request('http://localhost/api/assistant', {
          method,
          headers,
          body: method === 'GET' || method === 'HEAD' ? undefined : Buffer.concat(chunks),
        });
        const response = await handleAssistant(request, req.socket.remoteAddress ?? 'local', {
          apiKey: process.env.ANTHROPIC_API_KEY || fileEnv.ANTHROPIC_API_KEY || undefined,
          fetch: (url, init) => fetch(url, init),
          now: () => Date.now(),
          limiter,
          report,
        });
        res.statusCode = response.status;
        response.headers.forEach((value, name) => res.setHeader(name, value));
        res.end(await response.text());
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), productName(), assistantApi()],
  worker: { format: 'es' },
  build: { target: 'es2022', sourcemap: true },
});
