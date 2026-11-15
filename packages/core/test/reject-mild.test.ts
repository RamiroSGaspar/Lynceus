import { describe, expect, it } from 'vitest';
import type { CaptureRequest } from '../src/contract';
import { analyzeExam } from '../src/engine/analyze';
import { acquire } from '../src/instrument/acquire';
import { SCRIPTED_EVENTS } from '../src/instrument/capture';
import { analyzeWith, expectMeasured } from './reject';

const T = 120000;

// Spec test 7: every mild failure is still measured.
describe('mild capture failures are measured (spec test 7)', () => {
  it('signal loss of 4 dB', () => expectMeasured(analyzeWith({ signalLossDb: 4 })), T);
  it('a short blink on three scans', () => expectMeasured(analyzeWith({ blink: { startFraction: 0.4, widthFraction: 0.1 }, affectedScans: { from: 20, to: 22 } })), T);
  it('retina out of the frame on four scans', () => expectMeasured(analyzeWith({ truncationPx: 60, affectedScans: { from: 10, to: 13 } })), T);
  it('pattern 0.15 mm away from the nerve', () => expectMeasured(analyzeWith({ decentrationMm: { x: 0.15, y: 0 } })), T);
  it('slight eye movement', () => expectMeasured(analyzeWith({ motion: 0.1 })), T);
  it('signal fading over 6 % of every scan', () => expectMeasured(analyzeWith({ edgeFade: { side: 'start', widthFraction: 0.06 } })), T);
});

// Spec test 7: the three scripted events of 5.5 are refused and their attempt 2 is measured.
describe('scripted events of the scenario (spec 5.5 and test 7)', () => {
  for (const e of SCRIPTED_EVENTS) {
    it(`${e.crewId} ${e.eye} day ${e.flightDay}: attempt 1 refused, attempt 2 measured`, () => {
      const request: CaptureRequest = { crewId: e.crewId, eye: e.eye, flightDay: e.flightDay, attempt: 1 };
      const first = analyzeExam(acquire(request));
      expect(first.status).toBe('cannot-measure');
      expectMeasured(analyzeExam(acquire({ ...request, attempt: 2 })));
    }, T);
  }
});
