import { describe, expect, it } from 'vitest';
import { readVol, toDisplayGray, writeVolBlocks, type AnalysisProgress, type AnalyzeOptions, type BScan, type CaptureRequest, type ExamAnalysis, type ExamSource, type ScanAnalysis, type VolHeader } from '@app/core';
import { examHeader } from '@app/core/instrument/acquire';
import { ExamStore } from './examStore';
import type { WorkerMessage } from './protocol';
import { runJob, type RunnerDeps } from './runner';

const REQUEST: CaptureRequest = { crewId: 'B', eye: 'OD', flightDay: 90, attempt: 1 };
const SIZE = { sizeX: 16, sizeZ: 8, numBScans: 3, sizeXSlo: 8, sizeYSlo: 8 };

function header(): VolHeader {
  return { ...examHeader(REQUEST), ...SIZE };
}

/** A tiny exam that counts how often each scan is drawn. */
function tinyExam(draws: number[]): ExamSource {
  const h = header();
  const slo = new Uint8Array(h.sizeXSlo * h.sizeYSlo).map((_, i) => i);
  return {
    header: h,
    slo,
    bscan(index): BScan {
      draws[index] = (draws[index] ?? 0) + 1;
      const pixels = new Float32Array(h.sizeX * h.sizeZ).fill(0.01 * (index + 1));
      return {
        index,
        header: { version: 'HSF-BS-103', bscanHdrSize: h.bscanHdrSize, startXMm: index, startYMm: 1, endXMm: index + 1, endYMm: 2, numSeg: 0, offSeg: 256, qualityDb: 20 + index, shift: 0, ivTrafo: [0, 0, 0, 0, 0, 0] },
        segLines: [],
        pixels,
      };
    },
  };
}

function scanAnalysis(index: number): ScanAnalysis {
  return {
    index,
    qualityDb: 20 + index,
    headerQualityDb: 20 + index,
    validColumnFraction: 1,
    usable: index !== 1,
    rejections: index === 1 ? ['signal-dropout'] : [],
    ilmPx: new Float32Array(SIZE.sizeX).fill(2),
    bmPx: new Float32Array(SIZE.sizeX).fill(6),
    bmo: [null, null],
  };
}

/** Same shape as the engine: progress per step and scan, `onScan` after each scan, analysis at the end. */
function* fakeEngine(exam: ExamSource, options: AnalyzeOptions = {}): Generator<AnalysisProgress, ExamAnalysis> {
  const n = exam.header.numBScans;
  yield { step: 'read', scansTotal: n };
  const scans: ScanAnalysis[] = [];
  for (let k = 0; k < n; k++) {
    yield { step: 'quality', scanIndex: k, scansTotal: n };
    exam.bscan(k);
    const scan = scanAnalysis(k);
    scans.push(scan);
    yield { step: 'segment', scanIndex: k, scansTotal: n };
    options.onScan?.(scan);
  }
  yield { step: 'fit', scansTotal: n };
  yield { step: 'measure', scansTotal: n };
  yield { step: 'done', scansTotal: n };
  return {
    examId: exam.header.id,
    referenceId: exam.header.referenceId,
    patientId: exam.header.patientId,
    visitId: exam.header.visitId,
    eye: exam.header.scanPosition,
    examTimeMs: exam.header.examTimeMs,
    status: 'cannot-measure',
    rejections: ['too-few-usable-scans'],
    quality: { usableScans: 2, totalScans: n, meanQualityDb: 21, minQualityDb: 20, decentrationUm: 10, features: {} },
    bmo: null,
    bmoSource: 'this-exam',
    rings: [],
    trtRingUm: null,
    mrwUm: null,
    mrwSectors: [],
    bmRoughnessUm: null,
    scans,
    engineVersion: 'test',
  };
}

function deps(draws: number[], overrides: Partial<RunnerDeps> = {}): RunnerDeps {
  let t = 0;
  return {
    acquire: () => tinyExam(draws),
    analyzeExamSteps: fakeEngine,
    toDisplayGray,
    writeVolBlocks,
    groundTruth: () => {
      throw new Error('not used');
    },
    now: () => (t += 100),
    heapBytes: () => null,
    ...overrides,
  };
}

function collect(job: Parameters<typeof runJob>[0], d: RunnerDeps) {
  const messages: { message: WorkerMessage; transfer: Transferable[] }[] = [];
  runJob(job, (message, transfer) => messages.push({ message, transfer }), d);
  return messages;
}

describe('OCT worker protocol', () => {
  it('streams header, fundus, each scan after its progress, and the analysis last', () => {
    const draws: number[] = [];
    const messages = collect({ type: 'capture', request: REQUEST }, deps(draws));
    const types = messages.map((m) => m.message.type);
    expect(types.slice(0, 3)).toEqual(['header', 'fundus', 'progress']);
    expect(types.at(-1)).toBe('done');
    expect(types.filter((t) => t === 'scan')).toHaveLength(3);
    // A scan message comes after the progress that announced that scan.
    const firstScan = types.indexOf('scan');
    expect(messages.slice(0, firstScan).some((m) => m.message.type === 'progress' && m.message.progress.scanIndex === 0)).toBe(true);
    // The instrument draws each scan once: the worker reuses the pixels the engine asked for.
    expect(draws).toEqual([1, 1, 1]);
  });

  it('transfers the grey levels without copying and keeps a one-byte-per-pixel image', () => {
    const messages = collect({ type: 'capture', request: REQUEST }, deps([]));
    for (const { message, transfer } of messages) {
      if (message.type === 'scan') {
        expect(message.gray).toBeInstanceOf(Uint8ClampedArray);
        expect(message.gray.length).toBe(SIZE.sizeX * SIZE.sizeZ);
        expect(transfer).toEqual([message.gray.buffer]);
      } else if (message.type === 'fundus') {
        expect(transfer).toEqual([message.gray.buffer]);
      } else {
        expect(transfer).toEqual([]);
      }
    }
  });

  it('does not give away the fundus image the exam keeps', () => {
    const exam = tinyExam([]);
    const messages = collect({ type: 'capture', request: REQUEST }, deps([], { acquire: () => exam }));
    const fundus = messages.find((m) => m.message.type === 'fundus')!;
    expect(fundus.transfer[0]).not.toBe(exam.slo.buffer);
  });

  it('fills the screen store with what arrives', () => {
    const store = new ExamStore();
    for (const { message } of collect({ type: 'capture', request: REQUEST }, deps([]))) store.apply(message);
    expect(store.header?.numBScans).toBe(3);
    expect(store.fundus?.gray.length).toBe(64);
    expect(store.taken).toBe(3);
    expect(store.order).toEqual([0, 1, 2]);
    expect(store.analysis?.status).toBe('cannot-measure');
    expect(store.progress?.step).toBe('done');
    expect(store.elapsedMs).toBeGreaterThan(0);
    expect(store.scans[1]?.analysis.usable).toBe(false);
    expect(store.retainedBytes).toBe(64 + 3 * 16 * 8);
  });

  it('reports a failure as an error message', () => {
    const messages = collect(
      { type: 'capture', request: REQUEST },
      deps([], {
        acquire: () => {
          throw new RangeError('attempt must be an integer from 1 to 9');
        },
      }),
    );
    expect(messages.map((m) => m.message)).toEqual([{ type: 'error', message: 'attempt must be an integer from 1 to 9' }]);
  });

  it('writes the .vol file block by block, and the blocks read back as the same exam', () => {
    const exam = tinyExam([]);
    const messages = collect({ type: 'download', request: REQUEST }, deps([], { acquire: () => exam }));
    const blocks = messages.filter((m) => m.message.type === 'vol-block');
    expect(blocks).toHaveLength(SIZE.numBScans + 2);
    const done = messages.at(-1)!.message;
    expect(done.type).toBe('vol-done');
    const bytes = new Uint8Array(blocks.reduce((n, b) => n + (b.message as { bytes: Uint8Array }).bytes.length, 0));
    let offset = 0;
    for (const { message, transfer } of blocks) {
      const block = (message as { bytes: Uint8Array }).bytes;
      expect(transfer).toEqual([block.buffer]);
      expect(block.buffer).not.toBe(exam.slo.buffer);
      bytes.set(block, offset);
      offset += block.length;
    }
    expect(done.type === 'vol-done' && done.totalBytes).toBe(bytes.length);
    const back = readVol(bytes);
    expect(back.header.id).toBe(exam.header.id);
    expect(Array.from(back.slo)).toEqual(Array.from(exam.slo));
    expect(back.bscan(2).pixels).toEqual(exam.bscan(2).pixels);
  });
});
