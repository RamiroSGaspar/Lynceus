/**
 * Shape of `knowledge.generated.json`: the core's knowledge base, copied so the
 * function can run without the workspace packages. Pure, with structural types,
 * so the generator and the up-to-date test can share it.
 */

export interface SnapshotStatement {
  id: string;
  topic: string;
  certainty: string;
  text: { en: string; es: string };
  sources: string[];
}

export interface SnapshotReference {
  id: string;
  title: string;
  publisher: string;
  year: number;
  url: string;
}

export interface KnowledgeSnapshot {
  generatedFrom: string;
  statements: SnapshotStatement[];
  references: SnapshotReference[];
}

interface StatementLike {
  id: string;
  topic: string;
  certainty: string;
  text: Readonly<{ en: string; es: string }>;
  sources: readonly string[];
}

export function buildKnowledgeSnapshot(
  statements: readonly StatementLike[],
  references: readonly SnapshotReference[],
): KnowledgeSnapshot {
  return {
    generatedFrom: 'packages/core/src/knowledge — regenerate with `pnpm --filter @app/web knowledge:generate`; do not edit by hand',
    statements: statements.map((s) => ({
      id: s.id,
      topic: s.topic,
      certainty: s.certainty,
      text: { en: s.text.en, es: s.text.es },
      sources: [...s.sources],
    })),
    references: references.map((r) => ({ id: r.id, title: r.title, publisher: r.publisher, year: r.year, url: r.url })),
  };
}

export function serializeSnapshot(snapshot: KnowledgeSnapshot): string {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}
