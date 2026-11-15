import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
// Relative import on purpose: the config is bundled before workspace packages resolve.
import { PRODUCT } from '../../packages/core/src/product.ts';

/** Injects the product name into index.html so the name stays defined in one place. */
function productName(): Plugin {
  return {
    name: 'product-name',
    transformIndexHtml: (html) => html.replaceAll('%PRODUCT_NAME%', PRODUCT.name),
  };
}

export default defineConfig({
  plugins: [react(), productName()],
  worker: { format: 'es' },
  build: { target: 'es2022', sourcemap: true },
});
