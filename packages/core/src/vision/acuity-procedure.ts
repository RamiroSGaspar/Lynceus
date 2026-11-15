/**
 * Adaptive near-acuity procedure with the Landolt C, after FrACT: Best PEST, forced
 * choice among eight orientations, 18 presentations. Research doc
 * `pruebas-de-vision-en-pantalla.md`, section 1.A ("Puntaje adaptativo") and 1.C.
 *
 * Pure and resumable: the state is plain data, and every random draw comes from the
 * seeded generator kept in it.
 */
import type { AcuityResult, Eye } from '../contract';
import { nextRandom, seedFromKey } from './random';

/** Direction of the gap of the C: 0 = right, then counter-clockwise in 45° steps (2 = up, 4 = left, 6 = down). */
export type Orientation = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const ORIENTATIONS: readonly Orientation[] = [0, 1, 2, 3, 4, 5, 6, 7];

/** Presentations for eight alternatives, FrACT default. Section 1.A (F1). */
export const ACUITY_TRIALS = 18;

/** Chance of a correct guess with eight orientations. Section 1.A (F1). */
export const CHANCE_RATE = 1 / ORIENTATIONS.length;

/**
 * First presentations while every answer is right: decimal 0.1, 0.2, 0.4 and 0.8.
 * FrACT starts at 0.1 and reaches 0.8 in four steps (section 1.A, F1); the
 * intermediate values are ours, evenly spaced in logMAR.
 */
export const INITIAL_LOGMAR: readonly number[] = [1.0, 0.7, 0.4, 0.1];

/**
 * Largest figure shown: 20/400 (11.6 mm high at 40 cm). An estimate beyond it cannot be
 * told apart from answering at random, so the test reports that it did not converge.
 * Assumption of this project.
 */
export const MAX_LOGMAR = 1.3;

/**
 * Psychometric function used by Best PEST: logistic in logMAR between chance and
 * 1 − lapse. The threshold is where the logistic part is at one half, the midpoint between
 * chance (12.5 %) and 100 % (section 1.A, F1). Slope and lapse are assumptions of this
 * project: FrACT's own values were not read.
 */
export const PSYCHOMETRIC_SLOPE_PER_LOGMAR = 15;
export const LAPSE_RATE = 0.02;

/**
 * Normal test–retest variation: 95 % limits of agreement ±0.17 logMAR with 18
 * presentations (section 1.C and 2, B3). One line (0.1) is not a change.
 */
export const ACUITY_RETEST_LOA_LOGMAR = 0.17;

/**
 * Answers count as indistinguishable from guessing when the fitted threshold explains them
 * no better than chance alone: likelihood-ratio test at the 5 % level, 2 × Δlog L < 3.841
 * (chi-square, one degree of freedom). Choice of test: assumption of this project.
 */
export const CHANCE_TEST_CHI2 = 3.841;

/** Step and margins of the grid of candidate thresholds. */
const GRID_STEP = 0.01;
const GRID_MARGIN = 0.5;

export interface AcuityTrial {
  logMar: number;
  orientation: Orientation;
  response: Orientation;
  correct: boolean;
}

export interface AcuityProcedureState {
  floorLogMar: number;
  totalTrials: number;
  trials: readonly AcuityTrial[];
  /** Figure to show now; null when the test is finished. */
  current: { logMar: number; orientation: Orientation } | null;
  /** State of the seeded generator. */
  randomState: number;
}

export interface AcuityProcedureOptions {
  /** Finest logMAR the screen can draw (`ScreenCalibration.floorLogMar`). */
  floorLogMar: number;
  /** Text key of the random stream, for example `acuity/B/OD/90`. */
  seedKey: string;
  totalTrials?: number;
}

/** Probability of a correct answer to a figure of size `logMar` for an eye of threshold `thresholdLogMar`. */
export function probabilityCorrect(logMar: number, thresholdLogMar: number): number {
  const logistic = 1 / (1 + Math.exp(-PSYCHOMETRIC_SLOPE_PER_LOGMAR * (logMar - thresholdLogMar)));
  return CHANCE_RATE + (1 - CHANCE_RATE - LAPSE_RATE) * logistic;
}

function clampLevel(logMar: number, floorLogMar: number): number {
  return Math.min(MAX_LOGMAR, Math.max(floorLogMar, logMar));
}

/** Maximum-likelihood threshold over a grid; ties go to the smallest value. */
export function estimateThreshold(trials: readonly AcuityTrial[], floorLogMar: number): number {
  const low = Math.min(floorLogMar, 0) - GRID_MARGIN;
  const steps = Math.round((MAX_LOGMAR + GRID_MARGIN - low) / GRID_STEP);
  let best = low;
  let bestLogLikelihood = -Infinity;
  for (let i = 0; i <= steps; i++) {
    const threshold = low + i * GRID_STEP;
    let logLikelihood = 0;
    for (const trial of trials) {
      const p = probabilityCorrect(trial.logMar, threshold);
      logLikelihood += Math.log(trial.correct ? p : 1 - p);
    }
    if (logLikelihood > bestLogLikelihood) {
      bestLogLikelihood = logLikelihood;
      best = threshold;
    }
  }
  return best;
}

/** Log-likelihood gain of the fitted threshold over answering at random. */
export function logLikelihoodGainOverChance(trials: readonly AcuityTrial[], thresholdLogMar: number): number {
  let gain = 0;
  for (const trial of trials) {
    const p = probabilityCorrect(trial.logMar, thresholdLogMar);
    gain += trial.correct ? Math.log(p / CHANCE_RATE) : Math.log((1 - p) / (1 - CHANCE_RATE));
  }
  return gain;
}

function nextLevel(trials: readonly AcuityTrial[], floorLogMar: number): number {
  const index = trials.length;
  if (index < INITIAL_LOGMAR.length && trials.every((trial) => trial.correct)) {
    return clampLevel(INITIAL_LOGMAR[index]!, floorLogMar);
  }
  return clampLevel(estimateThreshold(trials, floorLogMar), floorLogMar);
}

function present(
  trials: readonly AcuityTrial[],
  floorLogMar: number,
  totalTrials: number,
  randomState: number,
): AcuityProcedureState {
  if (trials.length >= totalTrials) return { floorLogMar, totalTrials, trials, current: null, randomState };
  const draw = nextRandom(randomState);
  const orientation = ORIENTATIONS[Math.floor(draw.value * ORIENTATIONS.length)]!;
  return {
    floorLogMar,
    totalTrials,
    trials,
    current: { logMar: nextLevel(trials, floorLogMar), orientation },
    randomState: draw.state,
  };
}

export function startAcuityProcedure(options: AcuityProcedureOptions): AcuityProcedureState {
  return present([], options.floorLogMar, options.totalTrials ?? ACUITY_TRIALS, seedFromKey(options.seedKey));
}

/** Records the answer to the figure on screen and chooses the next one. */
export function answerAcuityProcedure(state: AcuityProcedureState, response: Orientation): AcuityProcedureState {
  if (!state.current) return state;
  const trial: AcuityTrial = { ...state.current, response, correct: response === state.current.orientation };
  return present([...state.trials, trial], state.floorLogMar, state.totalTrials, state.randomState);
}

export function isAcuityProcedureDone(state: AcuityProcedureState): boolean {
  return state.current === null;
}

/**
 * Result of a finished (or abandoned) procedure. `logMar` is null when the estimate lies
 * beyond the largest figure or the answers cannot be told apart from guessing; both are
 * what random answers give. When the eye saw better
 * than the screen can draw, `logMar` is the screen floor and `atScreenFloor` is true.
 */
export function acuityResult(state: AcuityProcedureState, eye: Eye, withCorrection: boolean): AcuityResult {
  const correct = state.trials.filter((trial) => trial.correct).length;
  const base = { eye, trials: state.trials.length, correct, withCorrection };
  if (state.trials.length === 0) return { ...base, logMar: null, atScreenFloor: false };
  const estimate = estimateThreshold(state.trials, state.floorLogMar);
  const guessing = 2 * logLikelihoodGainOverChance(state.trials, estimate) < CHANCE_TEST_CHI2;
  if (estimate > MAX_LOGMAR || guessing) return { ...base, logMar: null, atScreenFloor: false };
  const atScreenFloor = estimate <= state.floorLogMar;
  // At the floor, round towards the worse value: never report finer than the screen can draw.
  const logMar = atScreenFloor ? Math.ceil(state.floorLogMar * 100) / 100 : Math.round(estimate * 100) / 100;
  return { ...base, logMar, atScreenFloor };
}
