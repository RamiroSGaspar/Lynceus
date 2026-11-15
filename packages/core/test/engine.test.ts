import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { AnalysisProgress, CaptureRequest, CrewId, Eye, ExamSummary } from '../src/contract';
import { analyzeExam, analyzeExamSteps, compareWithBaseline, summarize } from '../src/engine/analyze';
import { groundTruth } from '../src/eye/groundTruth';
import { acquire } from '../src/instrument/acquire';
import { captureSetup } from '../src/instrument/capture';
import { anatomicalToFundus } from '../src/instrument/geometry';

const EYES: [CrewId, Eye][] = (['A', 'B', 'C', 'D'] as CrewId[]).flatMap((c) => (['OD', 'OS'] as Eye[]).map((e) => [c, e] as [CrewId, Eye]));

// Spec test 5: engine on noise-free captures (no speckle, no failures).
describe.each(EYES)('engine without noise, %s %s, reference exam (spec test 5)', (crewId, eye) => {
  it('measures ring ≤ 3 µm, MRW ≤ 10 µm, opening area ≤ 3 % and centre ≤ 25 µm from the truth', () => {
    const request: CaptureRequest = { crewId, eye, flightDay: 0, attempt: 1, conditions: {} };
    const a = analyzeExam(acquire(request, { speckle: false }));
    const truth = groundTruth(crewId, eye, 0);
    expect(a.status).toBe('measured');
    expect(Math.abs(a.trtRingUm!.value - truth.trtRingUm)).toBeLessThanOrEqual(3);
    expect(Math.abs(a.mrwUm!.value - truth.mrwUm)).toBeLessThanOrEqual(10);
    expect(Math.abs(a.bmo!.areaMm2 / truth.bmo.areaMm2 - 1)).toBeLessThanOrEqual(0.03);
    const g = captureSetup(request).geometry;
    const [cx, cy] = anatomicalToFundus(g, truth.bmo.centerXMm * 1000, truth.bmo.centerYMm * 1000);
    expect(Math.hypot(a.bmo!.centerXMm - cx, a.bmo!.centerYMm - cy) * 1000).toBeLessThanOrEqual(25);
  }, 120000);
});

describe('engine output', () => {
  const exam = acquire({ crewId: 'C', eye: 'OS', flightDay: 30, attempt: 1 });

  it('reports every step of every scan and the same result as analyzeExam', () => {
    const steps: AnalysisProgress[] = [];
    const it = analyzeExamSteps(exam);
    let r = it.next();
    while (!r.done) {
      steps.push(r.value);
      r = it.next();
    }
    expect(steps[0]!.step).toBe('read');
    expect(steps.filter((s) => s.step === 'segment').length).toBe(48);
    expect(steps.filter((s) => s.step === 'bmo').length).toBe(48);
    expect(steps.at(-1)!.step).toBe('done');
    const a = r.value;
    expect(a.status).toBe('measured');
    // Every number carries its unit, its origin and its sources (AGENTS.md rule 6).
    for (const q of [a.trtRingUm!, a.mrwUm!, a.bmRoughnessUm!, ...a.rings.map((x) => x.thickness), ...a.mrwSectors.map((s) => s.value)]) {
      expect(q.unit).toBe('µm');
      expect(q.origin).toBe('measured');
      expect(q.sources!.length).toBeGreaterThan(0);
      expect(q.standardError).toBeUndefined();
    }
    expect(a.mrwSectors.map((s) => s.sector)).toEqual(['T', 'TS', 'NS', 'N', 'NI', 'TI']);
    expect(a.rings.map((x) => [x.innerUm, x.outerUm])).toEqual([
      [0, 250],
      [250, 500],
      [500, 1000],
      [1000, 1500],
    ]);
    const s = summarize(a);
    expect('scans' in s).toBe(false);
    expect(s.trtRingUm).toEqual(a.trtRingUm);
  }, 120000);

  it('compares with the reference exam of the same series, and refuses anything else', () => {
    const base = summarize(analyzeExam(acquire({ crewId: 'C', eye: 'OS', flightDay: 0, attempt: 1 })));
    const cur = summarize(analyzeExam(exam, { baseline: base }));
    expect(cur.bmoSource).toBe('reference-shape');
    const change = compareWithBaseline(cur, base);
    expect(change.trtRingUm.origin).toBe('derived');
    expect(change.trtRingUm.value).toBeCloseTo(cur.trtRingUm!.value - base.trtRingUm!.value, 9);
    expect(change.rings.length).toBe(4);
    expect(Math.abs(change.bmoAreaChangePct)).toBeLessThan(3);
    const otherEye: ExamSummary = { ...cur, eye: 'OD' };
    expect(() => compareWithBaseline(otherEye, base)).toThrow();
    const otherSeries: ExamSummary = { ...cur, referenceId: '999' };
    expect(() => compareWithBaseline(otherSeries, base)).toThrow();
  }, 120000);
});

// Spec test 8: the engine imports nothing from the eye model or the instrument.
describe('engine independence (spec test 8)', () => {
  it('reaches no module of eye/ or instrument/ through its imports', () => {
    const engineDir = fileURLToPath(new URL('../src/engine/', import.meta.url));
    const seen = new Set<string>();
    const queue = ['analyze.ts', 'segment.ts', 'measure.ts', 'path.ts'].map((f) => resolve(engineDir, f));
    while (queue.length) {
      const file = queue.pop()!;
      if (seen.has(file)) continue;
      seen.add(file);
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
        const target = resolve(dirname(file), m[1]!) + '.ts';
        queue.push(target);
      }
    }
    const reached = [...seen].map((f) => f.replace(/\\/g, '/'));
    expect(reached.some((f) => f.includes('/src/eye/'))).toBe(false);
    expect(reached.some((f) => f.includes('/src/instrument/'))).toBe(false);
    expect(reached.length).toBeGreaterThan(4);
  });
});
