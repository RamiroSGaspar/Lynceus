/**
 * `pnpm --filter @app/validation quality:fit`: from the rows of `quality:run`, chooses
 * the variables, fits and calibrates the error model on the development partition,
 * evaluates the final test once (`protocol.md`) and writes:
 *
 * - `packages/validation/out/quality-validation.md`, the technical report;
 * - `packages/core/src/dataset/validation-summary.json`, the small summary the
 *   application shows and the coefficients of the model.
 *
 * Options:
 *   --check  compute again and compare with the published files; nothing is written
 *
 * It takes seconds; it never runs in the build. Simulated data.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeValidation } from './analysis';
import { renderReport } from './report';
import { ROWS_FORMAT, type QualityRowsFile } from './rows';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const PACKAGE = join(HERE, '..', '..');
export const ROWS_FILE = join(PACKAGE, 'out', 'quality-rows.json');
export const REPORT_FILE = join(PACKAGE, 'out', 'quality-validation.md');
export const SUMMARY_FILE = join(PACKAGE, '..', 'core', 'src', 'dataset', 'validation-summary.json');

export function readRows(path = ROWS_FILE): QualityRowsFile {
  const file = JSON.parse(readFileSync(path, 'utf8')) as QualityRowsFile;
  if (file.format !== ROWS_FORMAT) throw new Error(`${path}: format ${file.format}, expected ${ROWS_FORMAT}`);
  return file;
}

/** The two published texts, exactly as `quality:fit` writes them. */
export function fitOutputs(file: QualityRowsFile): { summary: string; report: string } {
  const result = analyzeValidation(file);
  return { summary: `${JSON.stringify(result.summary, null, 2)}\n`, report: renderReport(result) };
}

function main(): void {
  const check = process.argv.includes('--check');
  const t0 = performance.now();
  const { summary, report } = fitOutputs(readRows());
  if (check) {
    const same = readFileSync(SUMMARY_FILE, 'utf8') === summary && readFileSync(REPORT_FILE, 'utf8') === report;
    if (!same) throw new Error('The published summary or report differs from a fresh fit of out/quality-rows.json');
    console.log('The published summary and report match a fresh fit.');
    return;
  }
  writeFileSync(SUMMARY_FILE, summary);
  writeFileSync(REPORT_FILE, report);
  console.log(report);
  console.log(`Wrote ${SUMMARY_FILE} (${Buffer.byteLength(summary)} bytes) and ${REPORT_FILE} (${Buffer.byteLength(report)} bytes) in ${((performance.now() - t0) / 1000).toFixed(1)} s.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
