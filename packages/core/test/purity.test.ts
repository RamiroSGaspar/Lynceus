import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : path.endsWith('.ts') ? [path] : [];
  });
}

function code(path: string): string {
  // Drop comments so documentation may name the forbidden calls.
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('packages/core/src is pure and deterministic (AGENTS.md rules 4 and 5)', () => {
  const files = sourceFiles(SRC);

  it('never uses Math.random, Date.now or new Date() without arguments', () => {
    for (const f of files) {
      const c = code(f);
      expect(c, f).not.toMatch(/Math\.random/);
      expect(c, f).not.toMatch(/Date\.now/);
      expect(c, f).not.toMatch(/new Date\(\s*\)/);
    }
  });

  it('imports no Node or DOM modules', () => {
    for (const f of files) {
      const c = code(f);
      expect(c, f).not.toMatch(/from ['"]node:/);
      expect(c, f).not.toMatch(/\b(window|document|localStorage)\./);
    }
  });

  it('names the product only in product.ts (AGENTS.md rule 10)', async () => {
    const { PRODUCT } = await import('../src/product');
    for (const f of files) {
      if (f.endsWith('product.ts')) continue;
      expect(readFileSync(f, 'utf8'), f).not.toContain(PRODUCT.name);
    }
  });
});
