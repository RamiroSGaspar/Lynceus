import { KNOWLEDGE } from './statements';
import type { KnowledgeStatement } from './types';

export type { KnowledgeCertainty, KnowledgeStatement, KnowledgeTopic, Reference } from './types';
export { KNOWLEDGE } from './statements';
export { REFERENCES } from './references';

function pick(ids: readonly string[]): readonly KnowledgeStatement[] {
  return ids.map((id) => {
    const statement = KNOWLEDGE.find((s) => s.id === id);
    if (!statement) throw new Error(`Unknown knowledge statement: ${id}`);
    return statement;
  });
}

/** The three columns of the screen "What is known about the brain". */
export const BRAIN_KNOWLEDGE: {
  /** What is known. */
  known: readonly KnowledgeStatement[];
  /** What is seen only with MRI before and after flight. */
  mriOnly: readonly KnowledgeStatement[];
  /** What cannot be known during the mission. */
  notKnowableOnBoard: readonly KnowledgeStatement[];
} = {
  known: pick([
    'brain.noninvasive-indicators',
    'brain.nasa-position-on-pressure',
    'brain.jugular-flow',
    'brain.eye-brain-link-weak',
    'brain.swelling-appears-decoupled',
    'brain.cognition-in-flight',
  ]),
  mriOnly: pick([
    'brain.mri-only-before-and-after',
    'brain.ventricles-enlarge',
    'brain.upward-shift',
    'brain.recovery',
    'brain.perivascular-spaces',
    'brain.consequences-unknown',
  ]),
  notKnowableOnBoard: pick([
    'brain.icp-never-measured-in-flight',
    'brain.eye-is-not-a-pressure-gauge',
    'brain.no-preflight-pressure',
    'brain.cause-of-eye-changes-unknown',
    'brain.effect-on-thinking-unknown',
    'brain.personal-carbon-dioxide',
  ]),
};
