import { describe, expect, it } from 'vitest';
import { validateContext } from '../../../api/_lib/validate';
import { buildAssistantContext } from './context';
import { TEST_RECORD } from './test-record';

const IDENTITY_KEYS = [
  'crewId',
  'name',
  'role',
  'ageYears',
  'sex',
  'patientId',
  'examId',
  'baselineExamId',
  'referenceId',
  'visitId',
  'progId',
  'examTimeMs',
  'questions',
  'symptoms',
  'answers',
  'request',
];

function keysDeep(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => keysDeep(v, out));
  else if (typeof value === 'object' && value !== null) {
    for (const [key, v] of Object.entries(value)) {
      out.push(key);
      keysDeep(v, out);
    }
  }
  return out;
}

describe('buildAssistantContext', () => {
  const context = buildAssistantContext(TEST_RECORD);
  const json = JSON.stringify(context);

  it('carries no identity field at any depth', () => {
    const keys = keysDeep(context);
    for (const key of IDENTITY_KEYS) expect(keys).not.toContain(key);
  });

  it('carries no identity value: no identifiers, no written text', () => {
    expect(json).not.toMatch(/SIM-/);
    expect(json).not.toContain('Ada');
    expect(json).not.toContain('private note');
  });

  it('has exactly the fields of the contract', () => {
    expect(Object.keys(context).sort()).toEqual(
      ['alert', 'contact', 'eyes', 'findings', 'flightDay', 'level', 'nextOctFlightDay', 'nextSteps'].sort(),
    );
    expect(Object.keys(context.eyes.OD).sort()).toEqual(['capture', 'changes', 'level', 'measured', 'thresholds']);
  });

  it('keeps the numbers the assistant needs, rounded, and drops values not in micrometres', () => {
    expect(context.flightDay).toBe(90);
    expect(context.nextOctFlightDay).toBe(118);
    expect(context.eyes.OD.changes).toEqual([
      { measure: 'trt-0-250', changeUm: 24.1, interval95Um: [17.9, 30.3] },
      { measure: 'trt-250-500', changeUm: 9.8, interval95Um: [3.1, 16.5] },
      { measure: 'trt-500-1000', changeUm: 2, interval95Um: null },
      { measure: 'mrw', changeUm: 18.2, interval95Um: null },
      { measure: 'bm-roughness', changeUm: 0.4, interval95Um: [-1, 1.8] },
    ]);
    expect(context.eyes.OD.thresholds).toEqual([
      { id: 'trt-first-sign', thresholdUm: 19.4, exceeded: true, probabilityExceeded: 0.86, word: 'likely' },
    ]);
    expect(context.eyes.OD.capture).toEqual({ attempts: 1, usableScans: 47, totalScans: 48, meanQualityDb: 31.5 });
  });

  it('describes an eye that could not be measured without inventing numbers', () => {
    expect(context.eyes.OS).toEqual({
      measured: false,
      level: null,
      changes: [],
      thresholds: [],
      capture: { attempts: 1, usableScans: 12, totalScans: null, meanQualityDb: 11.2 },
    });
  });

  it('lists findings and next steps once each', () => {
    expect(context.findings).toEqual(['swelling-first-sign', 'eye-not-measured', 'symptom-headache']);
    expect(context.nextSteps).toEqual(['oct-in-4-weeks', 'report-routine']);
  });

  it('passes the server input validation unchanged', () => {
    expect(validateContext(JSON.parse(json))).toEqual(context);
  });
});
