import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { KNOWLEDGE, REFERENCES } from '@app/core';
import { describe, expect, it } from 'vitest';
import { buildKnowledgeSnapshot, serializeSnapshot } from './knowledge-snapshot';

describe('knowledge.generated.json', () => {
  it('matches the core knowledge base (regenerate with `pnpm --filter @app/web knowledge:generate`)', () => {
    const file = readFileSync(fileURLToPath(new URL('./knowledge.generated.json', import.meta.url)), 'utf8');
    expect(file).toBe(serializeSnapshot(buildKnowledgeSnapshot(KNOWLEDGE, REFERENCES)));
  });
});
