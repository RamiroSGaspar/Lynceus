import type { LocalizedText } from '../contract';

export type KnowledgeTopic =
  | 'sans'
  | 'measurement'
  | 'thresholds'
  | 'brain'
  | 'symptoms'
  | 'countermeasures'
  | 'limits'
  | 'glossary';

/** How firm the statement is. */
export type KnowledgeCertainty = 'established' | 'limited-evidence' | 'unknown' | 'not-measurable-on-board';

/** One short, cited statement. Used by the brain screen and by the assistant. */
export interface KnowledgeStatement {
  /** Stable, for example `brain.icp-never-measured-in-flight`. */
  id: string;
  topic: KnowledgeTopic;
  certainty: KnowledgeCertainty;
  /** One or two sentences in plain language. */
  text: LocalizedText;
  /** Ids of `REFERENCES`. */
  sources: readonly string[];
  /** Research document and section it comes from, so it can be reviewed. */
  basis: string;
}

export interface Reference {
  id: string;
  title: string;
  publisher: string;
  year: number;
  url: string;
}
