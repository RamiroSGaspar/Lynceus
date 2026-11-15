/**
 * Regenerates `knowledge.generated.json` from the core's knowledge base.
 * Run with `pnpm --filter @app/web knowledge:generate`. A test fails when the
 * file is out of date.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { KNOWLEDGE, REFERENCES } from '../../../../packages/core/src/knowledge/index';
import { buildKnowledgeSnapshot, serializeSnapshot } from './knowledge-snapshot.js';

const target = fileURLToPath(new URL('./knowledge.generated.json', import.meta.url));
writeFileSync(target, serializeSnapshot(buildKnowledgeSnapshot(KNOWLEDGE, REFERENCES)));
console.log(`Wrote ${KNOWLEDGE.length} statements and ${REFERENCES.length} references to ${target}`);
