import { describe, it } from 'vitest';
import { analyzeWith, expectRefused } from './reject';

// Spec test 7: every strong failure ends in cannot-measure, with its reason.
describe('strong capture failures are refused (spec test 7)', () => {
  const T = 120000;
  it('signal loss of 18 dB: low signal', () => expectRefused(analyzeWith({ signalLossDb: 18 }), 'too-few-usable-scans', 'low-signal'), T);
  it('a blink over every scan: signal dropout', () => expectRefused(analyzeWith({ blink: { startFraction: 0.4, widthFraction: 0.35 } }), 'too-few-usable-scans', 'signal-dropout'), T);
  it('retina 60 rows out of the frame: truncated', () => expectRefused(analyzeWith({ truncationPx: 60 }), 'too-few-usable-scans', 'truncated'), T);
  it('pattern 0.6 mm away from the nerve: decentred', () => expectRefused(analyzeWith({ decentrationMm: { x: 0.6, y: 0.2 } }), 'decentered'), T);
  it('severe eye movement: motion', () => expectRefused(analyzeWith({ motion: 0.9 }), 'too-few-usable-scans', 'motion'), T);
  it('signal fading over 45 % of every scan: signal dropout', () => expectRefused(analyzeWith({ edgeFade: { side: 'end', widthFraction: 0.45 } }), 'too-few-usable-scans', 'signal-dropout'), T);
});
