import type { AlertClass, Level } from '../contract';

/** Levels from least to most urgent. */
export const LEVEL_ORDER: readonly Level[] = [
  'no-detectable-change',
  'first-sign',
  'clinically-concerning',
  'acute-visual-symptom',
];

/**
 * Alert class shown for each level, following the NASA display convention
 * (advisory = blue, caution = yellow, warning = red; NASA-STD-3001 vol. 2).
 * Which class goes with which level is an assumption of this project.
 */
const ALERT_BY_LEVEL: Readonly<Record<Level, AlertClass>> = {
  'no-detectable-change': 'none',
  'first-sign': 'advisory',
  'clinically-concerning': 'caution',
  'acute-visual-symptom': 'warning',
};

export function alertForLevel(level: Level | null): AlertClass {
  return level === null ? 'none' : ALERT_BY_LEVEL[level];
}

export function levelRank(level: Level): number {
  return LEVEL_ORDER.indexOf(level);
}

/** The most urgent of the levels given; `no-detectable-change` when there are none. */
export function maxLevel(levels: readonly (Level | null)[]): Level {
  let best: Level = 'no-detectable-change';
  for (const level of levels) {
    if (level !== null && levelRank(level) > levelRank(best)) best = level;
  }
  return best;
}
