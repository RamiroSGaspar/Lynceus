/**
 * Small seeded generator for the vision tests (mulberry32). Its whole state is one
 * 32-bit integer, so a test in progress can be stored and resumed and gives the
 * same sequence every time. No `Math.random` anywhere in the core.
 */

/** FNV-1a hash of a text key, as the starting state. */
export function seedFromKey(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** One draw in [0, 1) and the state after it. */
export function nextRandom(state: number): { value: number; state: number } {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: next };
}

/** Convenience generator for simulations and tests. */
export function createRandom(key: string): () => number {
  let state = seedFromKey(key);
  return () => {
    const draw = nextRandom(state);
    state = draw.state;
    return draw.value;
  };
}
