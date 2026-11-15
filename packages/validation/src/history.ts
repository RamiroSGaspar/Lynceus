/**
 * `pnpm --filter @app/validation history:generate`: computes the history of the
 * fictional crew with the virtual instrument and the analysis engine (specification
 * 07) and publishes it as `packages/core/src/dataset/measured-history.json`, plus a
 * short report in `packages/validation/out/history.md`. Simulated data.
 *
 * Options:
 *   --concurrency N  crew members computed at the same time (default 2, at most 4)
 *   --check          compute again in memory and compare with the published file;
 *                    nothing is written, the exit code says whether they match
 *   --crew A,B       only these crew members; nothing is published, for trying out
 *
 * It is slow (minutes): it never runs as part of the tests, the build or the web app.
 * The file is written only when every crew member has been computed and has passed the
 * integrity checks, so a failed run leaves the previous file as it was.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import {
  CREW,
  ENGINE_VERSION,
  MEASURED_HISTORY_FORMAT,
  PRODUCT,
  PROVISIONAL_ERROR_MODEL,
  RULES_VERSION,
  VISION_SCENARIOS_VERSION,
  acquire,
  checkHistoryDataset,
  type CrewId,
  type MeasuredHistoryDataset,
  type SessionRecord,
} from '@app/core';
import { MAX_ATTEMPTS, measureRequest, simulateCrew } from './historySuite';

const CREW_IDS: readonly CrewId[] = CREW.map((member) => member.id);
const HERE = fileURLToPath(new URL('.', import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const DATASET_PATH = join(REPO, 'packages', 'core', 'src', 'dataset', 'measured-history.json');
const REPORT_PATH = join(HERE, '..', 'out', 'history.md');
const SCRATCH = join(REPO, '.tmp');

interface WorkerResult {
  type: 'done';
  crewId: CrewId;
  records: SessionRecord[];
  seconds: number;
}
type WorkerMessage = WorkerResult | { type: 'session'; crewId: CrewId; flightDay: number; seconds: number } | { type: 'error'; crewId: CrewId; message: string };

// ------------------------------------------------------------------ File

function versions(): MeasuredHistoryDataset['versions'] {
  const exam = acquire({ crewId: 'A', eye: 'OD', flightDay: 0, attempt: 1 });
  return {
    engine: ENGINE_VERSION,
    rules: RULES_VERSION,
    errorModel: PROVISIONAL_ERROR_MODEL.version,
    instrument: { examFormat: exam.header.version, scanFormat: exam.bscan(0).header.version },
    visionScenarios: VISION_SCENARIOS_VERSION,
  };
}

function buildDataset(results: ReadonlyMap<CrewId, SessionRecord[]>): MeasuredHistoryDataset {
  return {
    format: MEASURED_HISTORY_FORMAT,
    simulated: true,
    notice: PRODUCT.simulatedDataNotice.en,
    versions: versions(),
    maxAttempts: MAX_ATTEMPTS,
    crew: Object.fromEntries(CREW_IDS.map((id) => [id, results.get(id) ?? []])) as unknown as MeasuredHistoryDataset['crew'],
  };
}

/** Header pretty-printed, one line per session: reviewable in git and free of dates, so the same inputs give the same bytes. */
function serialize(dataset: MeasuredHistoryDataset): string {
  const { crew, ...head } = dataset;
  const body = CREW_IDS.map((id) => `    "${id}": [\n${crew[id].map((record) => `      ${JSON.stringify(record)}`).join(',\n')}\n    ]`).join(',\n');
  return `${JSON.stringify(head, null, 2).slice(0, -2)},\n  "crew": {\n${body}\n  }\n}\n`;
}

function describeCapture(record: SessionRecord, eye: 'OD' | 'OS'): string {
  const capture = record.eyes[eye];
  const attempts = capture.attempts.length;
  const refused = capture.attempts.filter((a) => a.status === 'cannot-measure');
  const reasons = refused.map((a) => `#${a.attempt}: ${[...a.rejections, ...a.scanRejections].join(' + ') || 'no reason'}`).join('; ');
  const outcome = capture.accepted ? `measured in attempt ${attempts}` : 'no result';
  return refused.length > 0 ? `${outcome} (refused ${reasons})` : outcome;
}

function report(dataset: MeasuredHistoryDataset, text: string, seconds: Map<CrewId, number>, totalSeconds: number, concurrency: number): string {
  const bytes = Buffer.byteLength(text);
  const exams = CREW_IDS.flatMap((id) => dataset.crew[id].flatMap((r) => [r.eyes.OD, r.eyes.OS]));
  const lines = [
    '# Crew history measured by the engine',
    '',
    `> ${PRODUCT.simulatedDataNotice.en} Every exam below is fictional, produced by the virtual instrument and measured`,
    '> by the analysis engine. This is the generation of the history that comes with the application, not a validation:',
    '> the error model is still the provisional one and no uncertainty was estimated here.',
    '',
    '## Versions and artifact',
    '',
    '| Item | Value |',
    '|---|---|',
    `| File | \`packages/core/src/dataset/measured-history.json\` (${dataset.format}) |`,
    `| Engine | ${dataset.versions.engine} |`,
    `| Rules | ${dataset.versions.rules} |`,
    `| Error model | ${dataset.versions.errorModel} (provisional) |`,
    `| Instrument | virtual, no version of its own; exam format ${dataset.versions.instrument.examFormat}, scan format ${dataset.versions.instrument.scanFormat} |`,
    `| Vision scenarios | ${dataset.versions.visionScenarios} (fictional, not read from a tomography) |`,
    `| Attempts per eye and session | up to ${dataset.maxAttempts}, stopping at the first one the engine accepts |`,
    `| Size | ${bytes} bytes (${(bytes / 1024).toFixed(1)} KiB) |`,
    `| SHA-256 | ${createHash('sha256').update(text).digest('hex')} |`,
    `| Sessions / exams analysed | ${CREW_IDS.reduce((n, id) => n + dataset.crew[id].length, 0)} sessions / ${exams.reduce((n, c) => n + c.attempts.length, 0)} captures |`,
    '| Cache | none: every capture was generated and analysed in this run |',
    '',
    '## Controls per crew member',
    '',
    '| Crew | Flight days | Controls | Refused captures | Level on the last control |',
    '|---|---|---|---|---|',
    ...CREW_IDS.map((id) => {
      const sessions = dataset.crew[id];
      const refused = sessions.reduce((n, r) => n + [r.eyes.OD, r.eyes.OS].reduce((m, c) => m + c.attempts.filter((a) => a.status === 'cannot-measure').length, 0), 0);
      return `| ${id} | ${sessions.map((r) => r.flightDay).join(', ')} | ${sessions.length - 1} in flight | ${refused} | ${sessions.at(-1)!.assessment.level} |`;
    }),
    '',
    '## Sessions',
    '',
    '| Crew | Day | Level | Change of the 0–250 µm ring OD / OS (µm) | Next control (reason) | OD | OS |',
    '|---|---|---|---|---|---|---|',
    ...CREW_IDS.flatMap((id) =>
      dataset.crew[id].map((r) => {
        const change = (eye: 'OD' | 'OS') => {
          const value = r.assessment.eyes[eye].change?.trtRingUm.value;
          return value === undefined ? '—' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}`;
        };
        const next = r.assessment.nextOct;
        return `| ${id} | ${r.flightDay} | ${r.assessment.level} | ${change('OD')} / ${change('OS')} | ${next ? `day ${next.flightDay} (${next.reason})` : 'none, the mission ends'} | ${describeCapture(r, 'OD')} | ${describeCapture(r, 'OS')} |`;
      }),
    ),
    '',
    '## Timing (the only part of this file that changes between runs)',
    '',
    `Computed in ${totalSeconds.toFixed(0)} s with ${concurrency} worker(s): ${CREW_IDS.map((id) => `${id} ${(seconds.get(id) ?? 0).toFixed(0)} s`).join(', ')}.`,
    '',
  ];
  return lines.join('\n');
}

// ------------------------------------------------------------------ Main

function parseArgs(argv: string[]): { check: boolean; concurrency: number; crew: CrewId[] } {
  const value = (name: string): string | undefined => {
    const at = argv.indexOf(name);
    return at >= 0 ? argv[at + 1] : undefined;
  };
  const concurrency = Number(value('--concurrency') ?? 2);
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error('--concurrency takes a whole number from 1 to 4');
  const crew = (value('--crew')?.split(',') ?? CREW_IDS) as CrewId[];
  for (const id of crew) if (!CREW_IDS.includes(id)) throw new Error(`Unknown crew member ${id}`);
  return { check: argv.includes('--check'), concurrency, crew };
}

function runCrew(crewId: CrewId, onSession: (message: WorkerMessage) => void): Promise<WorkerResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: crewId, execArgv: ['--import', 'tsx'] });
    worker.on('message', (message: WorkerMessage) => {
      if (message.type === 'done') resolve(message);
      else if (message.type === 'error') reject(new Error(message.message));
      else onSession(message);
    });
    worker.once('error', reject);
    worker.once('exit', (code) => code !== 0 && reject(new Error(`Worker of ${crewId} exited with code ${code}`)));
  });
}

function firstDifference(a: string, b: string): string {
  const x = a.split('\n');
  const y = b.split('\n');
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] !== y[i]) {
      const where = [...x.slice(0, i + 1)].reverse().find((line) => /^ {4}"[A-D]": \[/.test(line));
      return `line ${i + 1}${where ? ` (crew ${where.trim()[1]})` : ''}`;
    }
  }
  return 'none';
}

async function main(): Promise<void> {
  const { check, concurrency, crew } = parseArgs(process.argv.slice(2));
  const t0 = performance.now();
  const queue = [...crew];
  const results = new Map<CrewId, SessionRecord[]>();
  const seconds = new Map<CrewId, number>();
  console.log(`Computing the history of ${crew.join(', ')} with ${concurrency} worker(s)…`);
  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      for (let id = queue.shift(); id; id = queue.shift()) {
        const done = await runCrew(id, (m) => m.type === 'session' && console.log(`${m.crewId}: day ${m.flightDay} done (${m.seconds.toFixed(0)} s)`));
        results.set(id, done.records);
        seconds.set(id, done.seconds);
        console.log(`${id}: ${done.records.length} sessions, days ${done.records.map((r) => r.flightDay).join(', ')}`);
      }
    }),
  );
  const totalSeconds = (performance.now() - t0) / 1000;

  if (crew.length < CREW_IDS.length) {
    console.log('Only some crew members were computed: nothing is published or compared.');
    return;
  }
  const dataset = buildDataset(results);
  const problems = checkHistoryDataset(dataset);
  if (problems.length > 0) throw new Error(`The new history does not pass its checks, nothing was published:\n- ${problems.join('\n- ')}`);
  const text = serialize(dataset);
  if (JSON.stringify(JSON.parse(text)) !== JSON.stringify(dataset)) throw new Error('The file does not read back as what was computed, nothing was published');

  if (check) {
    const published = readFileSync(DATASET_PATH, 'utf8');
    if (published === text) {
      console.log(`The published file matches a fresh computation (${Buffer.byteLength(text)} bytes, ${totalSeconds.toFixed(0)} s).`);
      return;
    }
    throw new Error(`The published file differs from a fresh computation, first at ${firstDifference(published, text)}`);
  }

  mkdirSync(SCRATCH, { recursive: true });
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  const partial = join(SCRATCH, 'measured-history.json.partial');
  writeFileSync(partial, text);
  try {
    renameSync(partial, DATASET_PATH);
  } catch {
    // Another file system: copy, then remove the scratch file.
    copyFileSync(partial, DATASET_PATH);
    rmSync(partial);
  }
  const summary = report(dataset, text, seconds, totalSeconds, concurrency);
  writeFileSync(REPORT_PATH, summary);
  console.log(summary);
  console.log(`Published ${DATASET_PATH} (${Buffer.byteLength(text)} bytes).`);
}

if (isMainThread) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
} else {
  const crewId = workerData as CrewId;
  try {
    const t0 = performance.now();
    let last = t0;
    const records = simulateCrew(crewId, measureRequest, (record) => {
      const now = performance.now();
      parentPort!.postMessage({ type: 'session', crewId, flightDay: record.flightDay, seconds: (now - last) / 1000 } satisfies WorkerMessage);
      last = now;
    });
    parentPort!.postMessage({ type: 'done', crewId, records, seconds: (performance.now() - t0) / 1000 } satisfies WorkerMessage);
  } catch (error) {
    parentPort!.postMessage({ type: 'error', crewId, message: error instanceof Error ? error.message : String(error) } satisfies WorkerMessage);
  }
}
