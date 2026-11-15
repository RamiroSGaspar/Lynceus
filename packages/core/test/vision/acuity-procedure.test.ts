import { describe, expect, it } from 'vitest';
import {
  ACUITY_TRIALS,
  INITIAL_LOGMAR,
  MAX_LOGMAR,
  ORIENTATIONS,
  acuityResult,
  answerAcuityProcedure,
  probabilityCorrect,
  startAcuityProcedure,
  type AcuityProcedureState,
  type Orientation,
} from '../../src/vision/acuity-procedure';
import { createRandom } from '../../src/vision/random';

/** Simulated observer: a known threshold and the same psychometric function, or random answers. */
function runObserver(thresholdLogMar: number | null, floorLogMar: number, key: string): AcuityProcedureState {
  const random = createRandom(`observer/${key}`);
  let state = startAcuityProcedure({ floorLogMar, seedKey: `procedure/${key}` });
  while (state.current) {
    const { logMar, orientation } = state.current;
    let response: Orientation;
    if (thresholdLogMar === null) response = ORIENTATIONS[Math.floor(random() * 8)]!;
    else if (random() < probabilityCorrect(logMar, thresholdLogMar)) response = orientation;
    else response = ((orientation + 1 + Math.floor(random() * 7)) % 8) as Orientation;
    state = answerAcuityProcedure(state, response);
  }
  return state;
}

describe('psychometric function', () => {
  it('puts the threshold halfway between chance and the top', () => {
    expect(probabilityCorrect(0.3, 0.3)).toBeCloseTo((0.125 + 0.98) / 2, 10);
    expect(probabilityCorrect(-2, 0)).toBeCloseTo(0.125, 6);
    expect(probabilityCorrect(3, 0)).toBeCloseTo(0.98, 6);
  });
});

describe('adaptive procedure', () => {
  it('is deterministic for a seed', () => {
    const a = runObserver(0.1, -0.2, 'same');
    const b = runObserver(0.1, -0.2, 'same');
    expect(a.trials).toEqual(b.trials);
    expect(acuityResult(a, 'OD', true)).toEqual(acuityResult(b, 'OD', true));
  });

  it('starts large and steps down while every answer is right', () => {
    let state = startAcuityProcedure({ floorLogMar: -0.2, seedKey: 'steps' });
    const levels: number[] = [];
    for (let i = 0; i < INITIAL_LOGMAR.length; i++) {
      levels.push(state.current!.logMar);
      state = answerAcuityProcedure(state, state.current!.orientation);
    }
    expect(levels).toEqual(INITIAL_LOGMAR);
    // All right so far: Best PEST goes to the smallest figure the screen can draw.
    expect(state.current!.logMar).toBeCloseTo(-0.2, 10);
  });

  it('presents 18 figures, all between the screen floor and the largest figure', () => {
    const state = runObserver(0.4, 0.05, 'bounds');
    expect(state.trials).toHaveLength(ACUITY_TRIALS);
    expect(state.current).toBeNull();
    for (const trial of state.trials) {
      expect(trial.logMar).toBeGreaterThanOrEqual(0.05);
      expect(trial.logMar).toBeLessThanOrEqual(MAX_LOGMAR);
    }
    expect(answerAcuityProcedure(state, 0)).toBe(state);
  });

  it('uses all eight orientations evenly', () => {
    const counts = new Array<number>(8).fill(0);
    for (let i = 0; i < 100; i++) for (const trial of runObserver(0.2, -0.2, `orient/${i}`).trials) counts[trial.orientation]!++;
    for (const count of counts) expect(count).toBeGreaterThan(1800 / 8 - 60);
  });

  it.each([0, 0.4])('recovers a known threshold of %s within ±0.1 logMAR in 90 % of 200 runs', (threshold) => {
    let within = 0;
    for (let i = 0; i < 200; i++) {
      const result = acuityResult(runObserver(threshold, -0.3, `known/${threshold}/${i}`), 'OD', true);
      if (result.logMar !== null && Math.abs(result.logMar - threshold) <= 0.1) within++;
    }
    expect(within / 200).toBeGreaterThanOrEqual(0.9);
  });

  it('does not converge with random answers', () => {
    let nulls = 0;
    for (let i = 0; i < 200; i++) {
      const result = acuityResult(runObserver(null, -0.3, `random/${i}`), 'OS', false);
      if (result.logMar === null) nulls++;
      expect(result.trials).toBe(ACUITY_TRIALS);
    }
    expect(nulls / 200).toBeGreaterThanOrEqual(0.95);
  });

  it('reports the screen floor, never a finer value, when the eye sees better than the screen draws', () => {
    for (let i = 0; i < 50; i++) {
      const result = acuityResult(runObserver(-0.3, -0.104, `floor/${i}`), 'OD', true);
      expect(result.atScreenFloor).toBe(true);
      expect(result.logMar).toBe(-0.1);
    }
  });

  it('does not flag the floor when the eye is the limit', () => {
    const result = acuityResult(runObserver(0.3, -0.2, 'not-floor'), 'OD', true);
    expect(result.atScreenFloor).toBe(false);
    expect(result.logMar).not.toBeNull();
  });

  it('records eye, correction, trials and correct answers', () => {
    const state = runObserver(0.2, -0.2, 'record');
    const result = acuityResult(state, 'OS', false);
    expect(result.eye).toBe('OS');
    expect(result.withCorrection).toBe(false);
    expect(result.trials).toBe(18);
    expect(result.correct).toBe(state.trials.filter((t) => t.correct).length);
  });

  it('cannot give a value without presentations', () => {
    const state = startAcuityProcedure({ floorLogMar: 0, seedKey: 'empty' });
    expect(acuityResult(state, 'OD', true)).toMatchObject({ logMar: null, trials: 0, correct: 0 });
  });
});
