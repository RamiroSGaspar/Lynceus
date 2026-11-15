/**
 * What the screen keeps of an exam while it is taken and analysed: grey levels of
 * one byte per pixel (about 18 MB for 48 scans), the headers and what the engine
 * marked. Filled from the worker's messages; holds no React state.
 */
import type { AnalysisProgress, BScanHeader, ExamAnalysis, ScanAnalysis, VolHeader } from '@app/core';
import type { WorkerMessage } from './protocol';

export interface ScanFrame {
  index: number;
  header: BScanHeader;
  width: number;
  height: number;
  gray: Uint8ClampedArray;
  analysis: ScanAnalysis;
}

export interface FundusFrame {
  width: number;
  height: number;
  gray: Uint8Array;
}

export class ExamStore {
  header: VolHeader | null = null;
  fundus: FundusFrame | null = null;
  scans: (ScanFrame | undefined)[] = [];
  /** Scan indices in the order they arrived. */
  order: number[] = [];
  progress: AnalysisProgress | null = null;
  analysis: ExamAnalysis | null = null;
  elapsedMs: number | null = null;
  workerHeapBytes: number | null = null;
  error: string | null = null;

  apply(message: WorkerMessage): void {
    switch (message.type) {
      case 'header':
        this.header = message.header;
        this.scans = new Array<ScanFrame | undefined>(message.header.numBScans).fill(undefined);
        break;
      case 'fundus':
        this.fundus = { width: message.width, height: message.height, gray: message.gray };
        break;
      case 'progress':
        this.progress = message.progress;
        break;
      case 'scan':
        this.scans[message.index] = {
          index: message.index,
          header: message.header,
          width: message.width,
          height: message.height,
          gray: message.gray,
          analysis: message.analysis,
        };
        this.order.push(message.index);
        break;
      case 'done':
        this.analysis = message.analysis;
        this.elapsedMs = message.elapsedMs;
        this.workerHeapBytes = message.workerHeapBytes;
        this.progress = { step: 'done', scansTotal: message.analysis.quality.totalScans };
        // The final analysis is the reference: keep its per-scan detail.
        for (const scan of message.analysis.scans) {
          const frame = this.scans[scan.index];
          if (frame) frame.analysis = scan;
        }
        break;
      case 'error':
        this.error = message.message;
        break;
      default:
        break;
    }
  }

  /** Number of scans already taken and analysed. */
  get taken(): number {
    return this.order.length;
  }

  /** Index of the last scan that arrived, or null. */
  get latest(): number | null {
    return this.order.length > 0 ? this.order[this.order.length - 1]! : null;
  }

  /** Bytes of image data held by the screen for this exam. */
  get retainedBytes(): number {
    let bytes = this.fundus?.gray.byteLength ?? 0;
    for (const frame of this.scans) if (frame) bytes += frame.gray.byteLength;
    return bytes;
  }
}
