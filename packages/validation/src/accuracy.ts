/**
 * `pnpm --filter @app/validation accuracy`: the accuracy table of spec 01, test 6.
 * Prints it and writes `packages/validation/out/accuracy.md`. Simulated data only:
 * this is the error of the engine against the virtual eye, not on people.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { availableParallelism } from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { ENGINE_VERSION, PRODUCT, type CrewId, type Eye } from '@app/core';
import { accuracyForEye, type AccuracyRow } from './accuracySuite';

const EYES: [CrewId, Eye][] = (['A', 'B', 'C', 'D'] as CrewId[]).flatMap((c) => (['OD', 'OS'] as Eye[]).map((e) => [c, e] as [CrewId, Eye]));

function fmt(v: number, d = 1): string {
  return (v >= 0 ? '+' : '') + v.toFixed(d);
}

function report(rows: AccuracyRow[], seconds: number): string {
  const abs = rows.map((r) => Math.abs(r.errorUm));
  const within6 = abs.filter((e) => e <= 6).length;
  const maxErr = Math.max(...abs);
  const rough = rows.map((r) => Math.abs(r.roughnessErrorUm));
  const rms = Math.sqrt(rows.reduce((a, r) => a + r.errorUm ** 2, 0) / rows.length);
  const mean = rows.reduce((a, r) => a + r.errorUm, 0) / rows.length;
  const lines = [
    '# Accuracy of the measurement engine on simulated exams',
    '',
    `> ${PRODUCT.simulatedDataNotice.en} Every exam below is fictional, produced by the virtual instrument;`,
    '> the error is the engine against the known truth of the virtual eye, not a validation on people.',
    '',
    `Engine ${ENGINE_VERSION}. Specification 01, test 6: normal captures (conditions drawn from each attempt's seed),`,
    'the 8 eyes on days 0, 30, 90 and 150. Day 0 is a second pre-flight capture compared with the reference one',
    '(true change 0). A capture the engine refused was repeated, as the application does; the refusals are listed.',
    '',
    '## Summary',
    '',
    '| Criterion | Required | Result |',
    '|---|---|---|',
    `| Change of the 0–250 µm ring: cases with error ≤ 6 µm | ≥ 95 % | ${within6} of ${rows.length} (${((100 * within6) / rows.length).toFixed(0)} %) |`,
    `| Change of the 0–250 µm ring: largest error | ≤ 10 µm | ${maxErr.toFixed(1)} µm |`,
    `| Change of the 0–250 µm ring: mean error / RMS | — | ${fmt(mean, 2)} µm / ${rms.toFixed(2)} µm |`,
    `| Change of roughness: largest error | ≤ 1.5 µm | ${Math.max(...rough).toFixed(2)} µm |`,
    '',
    '## All cases',
    '',
    '| Eye | Day | Attempt | True change (µm) | Measured (µm) | Error (µm) | True Δ roughness (µm) | Measured (µm) | Error (µm) | MRW true / measured (µm) | Opening area change (%) | Quality (dB) |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...rows.map(
      (r) =>
        `| ${r.crewId} ${r.eye} | ${r.flightDay} | ${r.attempt} | ${fmt(r.trueChangeUm)} | ${fmt(r.measuredChangeUm)} | ${fmt(r.errorUm)} | ${fmt(r.trueRoughnessChangeUm, 2)} | ${fmt(r.measuredRoughnessChangeUm, 2)} | ${fmt(r.roughnessErrorUm, 2)} | ${r.trueMrwUm.toFixed(0)} / ${r.measuredMrwUm.toFixed(0)} | ${fmt(r.bmoAreaChangePct, 2)} | ${r.qualityDb.toFixed(1)} |`,
    ),
    '',
    '## Refused captures that were repeated',
    '',
    ...(rows.some((r) => r.refused.length > 0)
      ? rows.filter((r) => r.refused.length > 0).map((r) => `- ${r.crewId} ${r.eye}, day ${r.flightDay}: ${r.refused.join('; ')}`)
      : ['None.']),
    '',
    `Computed in ${seconds.toFixed(0)} s.`,
    '',
  ];
  return lines.join('\n');
}

async function main(): Promise<void> {
  const t0 = performance.now();
  const threads = Math.max(1, Math.min(EYES.length, availableParallelism() - 1));
  console.log(`Analysing 8 eyes × 5 exams on ${threads} threads…`);
  const queue = [...EYES];
  const results = new Map<string, AccuracyRow[]>();
  const self = fileURLToPath(import.meta.url);
  await Promise.all(
    Array.from({ length: threads }, async () => {
      for (;;) {
        const next = queue.shift();
        if (!next) return;
        const rows = await new Promise<AccuracyRow[]>((resolve, reject) => {
          const w = new Worker(new URL(import.meta.url), { workerData: next, execArgv: ['--import', 'tsx'] });
          w.once('message', resolve);
          w.once('error', reject);
        });
        results.set(next.join(' '), rows);
        console.log(`${next.join(' ')}: ${rows.map((r) => `d${r.flightDay} ${fmt(r.errorUm)}`).join(', ')}`);
      }
    }),
  );
  void self;
  const rows = EYES.flatMap((e) => results.get(e.join(' '))!);
  const text = report(rows, (performance.now() - t0) / 1000);
  const outDir = join(fileURLToPath(new URL('..', import.meta.url)), 'out');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'accuracy.md'), text);
  console.log(text);
}

if (isMainThread) {
  void main();
} else {
  const [crewId, eye] = workerData as [CrewId, Eye];
  parentPort!.postMessage(accuracyForEye(crewId, eye));
}
