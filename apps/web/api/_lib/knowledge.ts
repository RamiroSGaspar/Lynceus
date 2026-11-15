import snapshot from './knowledge.generated.json' with { type: 'json' };
import type { AnswerSource } from './contract.js';
import type { KnowledgeSnapshot, SnapshotStatement } from './knowledge-snapshot.js';

export const KNOWLEDGE_SNAPSHOT: KnowledgeSnapshot = snapshot;

const STATEMENTS = new Map(KNOWLEDGE_SNAPSHOT.statements.map((s) => [s.id, s]));
const REFERENCES = new Map(KNOWLEDGE_SNAPSHOT.references.map((r) => [r.id, r]));

export function findStatement(id: string): SnapshotStatement | undefined {
  return STATEMENTS.get(id);
}

/** Sources of an answer, built on the server from the cited statements: the model never writes links. */
export function sourcesForStatements(statementIds: readonly string[]): AnswerSource[] {
  const seen = new Set<string>();
  const sources: AnswerSource[] = [];
  for (const statementId of statementIds) {
    for (const referenceId of STATEMENTS.get(statementId)?.sources ?? []) {
      const reference = REFERENCES.get(referenceId);
      if (!reference || seen.has(referenceId)) continue;
      seen.add(referenceId);
      sources.push({ id: reference.id, title: reference.title, url: reference.url });
    }
  }
  return sources;
}
