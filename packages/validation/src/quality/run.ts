/**
 * `pnpm --filter @app/validation quality:run`: generates and measures the capture
 * matrix of the synthetic validation (`protocol.md`) and writes one row per capture to
 * `packages/validation/out/quality-rows.json`, with the true values of the virtual eye
 * joined for the errors. Simulated data.
 *
 * Options:
 *   --concurrency N  captures measured at the same time (default 2, at most 4)
 *   --no-cache       measure everything again, ignoring `.tmp/quality-cache/`
 *
 * It is slow (tens of minutes): it never runs in the tests, the build or `pnpm verify`.
 * Only summaries are kept: no `.vol`, no pixels, no per-scan arrays. Each measured
 * capture is cached in `.tmp/quality-cache/<protocol>/<engine>/<instrument>/`, keyed by
 * its request and its reference, so an interrupted run can go on.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { ENGINE_VERSION, INSTRUMENT_VERSION, PRODUCT, acquire, groundTruth, type ExamSummary } from '@app/core';
import { measureCapture, type CaptureMeasurement } from './measure';
import { PROTOCOL_VERSION, captureMatrix, type PlannedCapture, type ReferenceKey } from './protocol';
import { ROWS_FORMAT, type QualityRow, type QualityRowsFile } from './rows';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const PACKAGE = join(HERE, '..', '..');
const REPO = join(PACKAGE, '..', '..');
export const ROWS_PATH = join(PACKAGE, 'out', 'quality-rows.json');
const RUN_REPORT_PATH = join(PACKAGE, 'out', 'quality-run.md');

interface Job {
  capture: PlannedCapture;
  baseline?: ExamSummary;
}
interface JobResult {
  measurement: CaptureMeasurement;
  summary: ExamSummary;
  seconds: number;
}

function cacheDir(): string {
  return join(REPO, '.tmp', 'quality-cache', PROTOCOL_VERSION, ENGINE_VERSION, INSTRUMENT_VERSION);
}

function cacheKey(job: Job): string {
  const baseline = job.baseline ? createHash('sha256').update(JSON.stringify(job.baseline)).digest('hex') : null;
  return createHash('sha256').update(JSON.stringify({ request: job.capture.request, baseline })).digest('hex').slice(0, 32);
}

class Pool {
  private readonly idle: Worker[] = [];
  private readonly waiting: ((w: Worker) => void)[] = [];
  readonly workers: Worker[];
  constructor(size: number) {
    this.workers = Array.from({ length: size }, () => new Worker(new URL(import.meta.url), { execArgv: ['--import', 'tsx'] }));
    this.idle.push(...this.workers);
  }
  private acquire(): Promise<Worker> {
    const w = this.idle.pop();
    return w ? Promise.resolve(w) : new Promise((resolve) => this.waiting.push(resolve));
  }
  private release(w: Worker): void {
    const next = this.waiting.shift();
    if (next) next(w);
    else this.idle.push(w);
  }
  async run(job: Job): Promise<JobResult> {
    const w = await this.acquire();
    try {
      return await new Promise<JobResult>((resolve, reject) => {
        const onMessage = (m: { ok: true; result: JobResult } | { ok: false; error: string }) => {
          w.off('error', onError);
          if (m.ok) resolve(m.result);
          else reject(new Error(`${job.capture.id}: ${m.error}`));
        };
        const onError = (e: Error) => {
          w.off('message', onMessage);
          reject(e);
        };
        w.once('message', onMessage);
        w.once('error', onError);
        w.postMessage(job);
      });
    } finally {
      this.release(w);
    }
  }
  async close(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.terminate()));
  }
}

function parseArgs(argv: string[]): { concurrency: number; cache: boolean } {
  const at = argv.indexOf('--concurrency');
  const concurrency = at >= 0 ? Number(argv[at + 1]) : 2;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error('--concurrency takes a whole number from 1 to 4');
  return { concurrency, cache: !argv.includes('--no-cache') };
}

/** The rows file: header pretty-printed, one row per line, no dates or timings. */
export function serializeRows(file: QualityRowsFile): string {
  const { rows, ...head } = file;
  return `${JSON.stringify(head, null, 2).slice(0, -2)},\n  "rows": [\n${rows.map((r) => `    ${JSON.stringify(r)}`).join(',\n')}\n  ]\n}\n`;
}

async function main(): Promise<void> {
  const { concurrency, cache } = parseArgs(process.argv.slice(2));
  const t0 = performance.now();
  const matrix = captureMatrix();
  const dir = cacheDir();
  mkdirSync(dir, { recursive: true });
  const pool = new Pool(concurrency);
  let done = 0;
  let cached = 0;
  let computeSeconds = 0;
  const measureOne = async (job: Job): Promise<JobResult> => {
    const file = join(dir, `${job.capture.id}-${cacheKey(job)}.json`);
    let result: JobResult;
    if (cache && existsSync(file)) {
      result = JSON.parse(readFileSync(file, 'utf8')) as JobResult;
      cached++;
    } else {
      result = await pool.run(job);
      writeFileSync(file, JSON.stringify(result));
      computeSeconds += result.seconds;
    }
    done++;
    if (done % 10 === 0 || done === matrix.length) {
      console.log(`${done}/${matrix.length} captures (${cached} from cache), ${((performance.now() - t0) / 1000).toFixed(0)} s`);
    }
    return result;
  };

  console.log(`Protocol ${PROTOCOL_VERSION}: ${matrix.length} captures on ${concurrency} worker(s)…`);
  const references = matrix.filter((c) => c.role === 'reference');
  const followUps = matrix.filter((c) => c.role === 'follow-up');
  const results = new Map<string, JobResult>();
  try {
    for (const [capture, result] of await Promise.all(references.map(async (c) => [c, await measureOne({ capture: c })] as const))) results.set(capture.id, result);
    const referenceOf = (c: PlannedCapture): { key: ReferenceKey; summary: ExamSummary } | null => {
      const order: ReferenceKey[] = c.reference === 'R2' ? ['R2', 'R1'] : ['R1', 'R2'];
      for (const key of order) {
        const ref = references.find((r) => r.crewId === c.crewId && r.eye === c.eye && r.level === `reference ${key}`)!;
        const summary = results.get(ref.id)!.summary;
        if (summary.status === 'measured') return { key, summary };
      }
      return null;
    };
    const usedReference = new Map<string, ReferenceKey | null>();
    await Promise.all(
      followUps.map(async (c) => {
        const ref = referenceOf(c);
        usedReference.set(c.id, ref?.key ?? null);
        if (!ref) return;
        results.set(c.id, await measureOne({ capture: c, baseline: ref.summary }));
      }),
    );

    const truthOf = (c: PlannedCapture) => groundTruth(c.crewId, c.eye, c.flightDay);
    const rows: QualityRow[] = matrix.map((c) => {
      const truth = truthOf(c);
      const result = results.get(c.id);
      return {
        ...c,
        reference: c.role === 'reference' ? null : (usedReference.get(c.id) ?? null),
        plannedReference: c.reference,
        measurement: result?.measurement ?? null,
        truth: { trtUm: truth.trtRingUm, roughnessUm: truth.bmRoughnessUm, trtChangeUm: truth.trtRingChangeUm, roughnessChangeUm: truth.bmRoughnessChangeUm, mrwUm: truth.mrwUm },
      };
    });
    const exam = acquire(matrix[0]!.request);
    const file: QualityRowsFile = {
      format: ROWS_FORMAT,
      simulated: true,
      notice: PRODUCT.simulatedDataNotice.en,
      protocol: PROTOCOL_VERSION,
      versions: { engine: ENGINE_VERSION, instrument: INSTRUMENT_VERSION, examFormat: exam.header.version, scanFormat: exam.bscan(0).header.version },
      rows,
    };
    const text = serializeRows(file);
    mkdirSync(join(PACKAGE, 'out'), { recursive: true });
    writeFileSync(ROWS_PATH, text);
    const seconds = (performance.now() - t0) / 1000;
    const measured = rows.filter((r) => r.measurement).length;
    const report = [
      '# Run of the synthetic validation (timing only)',
      '',
      `> ${PRODUCT.simulatedDataNotice.en} The rows are fictional exams from the virtual instrument.`,
      '',
      `Protocol ${PROTOCOL_VERSION}, engine ${ENGINE_VERSION}, ${INSTRUMENT_VERSION}.`,
      '',
      '| Item | Value |',
      '|---|---|',
      `| Captures planned / analysed | ${matrix.length} / ${measured} |`,
      `| Taken from the cache in this run | ${cached} |`,
      `| Workers | ${concurrency} |`,
      `| Wall time | ${seconds.toFixed(0)} s |`,
      `| Compute time of the captures analysed in this run | ${computeSeconds.toFixed(0)} s (${(computeSeconds / Math.max(1, measured - cached)).toFixed(1)} s per capture) |`,
      `| \`out/quality-rows.json\` | ${Buffer.byteLength(text)} bytes, SHA-256 ${createHash('sha256').update(text).digest('hex')} |`,
      '',
    ].join('\n');
    writeFileSync(RUN_REPORT_PATH, report);
    console.log(report);
  } finally {
    await pool.close();
  }
}

if (isMainThread) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  });
} else {
  parentPort!.on('message', (job: Job) => {
    try {
      const t = performance.now();
      const { measurement, summary } = measureCapture(job.capture, job.baseline);
      parentPort!.postMessage({ ok: true, result: { measurement, summary, seconds: (performance.now() - t) / 1000 } });
    } catch (error) {
      parentPort!.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  });
}
