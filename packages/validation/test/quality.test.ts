import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, INSTRUMENT_VERSION, VALIDATION_SUMMARY } from '@app/core';
import { analyzeValidation } from '../src/quality/analysis';
import { REPORT_FILE, SUMMARY_FILE, fitOutputs, readRows } from '../src/quality/fit';
import { PROTOCOL_VERSION, captureMatrix } from '../src/quality/protocol';
import type { QualityRowsFile } from '../src/quality/rows';

const T = 300_000;

describe('synthetic validation of the error model (specification 08)', () => {
  const rows = readRows();

  it('the rows are simulated data of this protocol and of the planned matrix', { timeout: T }, () => {
    expect(rows.simulated).toBe(true);
    expect(rows.notice).toMatch(/Simulated data/);
    expect(rows.protocol).toBe(PROTOCOL_VERSION);
    expect(rows.versions.instrument).toBe(INSTRUMENT_VERSION);
    const matrix = captureMatrix();
    expect(rows.rows.map((r) => r.id)).toEqual(matrix.map((c) => c.id));
    expect(rows.rows.map((r) => JSON.stringify(r.request))).toEqual(matrix.map((c) => JSON.stringify(c.request)));
    // Only summaries and errors are kept: no pixels, no per-scan arrays.
    expect(JSON.stringify(rows.rows[0])).not.toMatch(/"scans"|"pixels"/);
  });

  it('the published summary and report are what `quality:fit` gives for these rows', { timeout: T }, () => {
    const { summary, report } = fitOutputs(rows);
    expect(readFileSync(SUMMARY_FILE, 'utf8')).toBe(summary);
    expect(readFileSync(REPORT_FILE, 'utf8')).toBe(report);
    expect(JSON.parse(summary)).toEqual(JSON.parse(JSON.stringify(VALIDATION_SUMMARY)));
  });

  it('the final tests choose nothing: their true values do not change the model', { timeout: T }, () => {
    const altered: QualityRowsFile = structuredClone(rows);
    for (const row of altered.rows) {
      // Shift only follow-ups: the same offset on the reference cancels in the change.
      if (row.partition === 'development' || row.role !== 'follow-up') continue;
      row.truth = { ...row.truth, trtUm: row.truth.trtUm + 17, roughnessUm: row.truth.roughnessUm - 3 };
    }
    const original = analyzeValidation(rows);
    const changed = analyzeValidation(altered);
    expect(changed.spec).toEqual(original.spec);
    for (const partition of ['test-anatomy', 'test-family'] as const) {
      expect(changed.summary.partitions[partition].results.trt.biasUm).toBeCloseTo(original.summary.partitions[partition].results.trt.biasUm - 17);
      expect(changed.summary.partitions[partition].results.roughness.biasUm).toBeCloseTo(original.summary.partitions[partition].results.roughness.biasUm + 3);
    }
  });

  it('names the versions behind it', () => {
    expect(VALIDATION_SUMMARY.protocol).toBe(PROTOCOL_VERSION);
    expect(VALIDATION_SUMMARY.versions.instrument).toBe(INSTRUMENT_VERSION);
    expect(VALIDATION_SUMMARY.versions.engine).toBe(rows.versions.engine);
    expect(rows.versions.engine).toBe(ENGINE_VERSION);
  });
});
