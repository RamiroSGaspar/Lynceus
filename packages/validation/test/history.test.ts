import { describe, expect, it } from 'vitest';
import {
  assessSession,
  getHistory,
  groundTruth,
  type CaptureRequest,
  type CrewId,
  type Eye,
  type ExamSummary,
  type SessionRecord,
} from '@app/core';
import { MAX_ATTEMPTS, MissingReferenceError, measureRequest, simulateCrew, type Measurer } from '../src/historySuite';

/** Simulated summaries: only the fields the rules and the generator read. No engine, no images. */
function fakeSummary(request: CaptureRequest, status: 'measured' | 'cannot-measure', trtUm: number): ExamSummary {
  const measured = status === 'measured';
  const quantity = (value: number) => ({ value, unit: 'µm' as const, origin: 'measured' as const });
  const id = `${request.crewId}${request.eye}${request.flightDay}/${request.attempt}`;
  const rings = [0, 250, 500, 1000].map((innerUm, i) => ({ innerUm, outerUm: [250, 500, 1000, 1500][i]!, thickness: quantity(trtUm - 20 * i), radiiUsed: 96 }));
  return {
    examId: id,
    referenceId: `${request.crewId}${request.eye}0/1`,
    patientId: `SIM-CREW-${request.crewId}`,
    visitId: request.flightDay > 0 ? `FD${request.flightDay}` : 'PRE',
    eye: request.eye,
    examTimeMs: 0,
    status,
    rejections: measured ? [] : ['too-few-usable-scans'],
    quality: { usableScans: measured ? 48 : 10, totalScans: 48, meanQualityDb: 26, minQualityDb: 24, decentrationUm: 50, features: {} },
    bmo: measured ? { centerXMm: 4, centerYMm: 4, semiMajorMm: 0.9, semiMinorMm: 0.8, angleDeg: 90, areaMm2: 2.2, fitRmsUm: 8, pointsUsed: 94, pointsRejected: 2 } : null,
    bmoSource: request.flightDay > 0 ? 'reference-shape' : 'this-exam',
    rings: measured ? rings : [],
    trtRingUm: measured ? quantity(trtUm) : null,
    mrwUm: measured ? quantity(380) : null,
    mrwSectors: [],
    bmRoughnessUm: measured ? quantity(2.5) : null,
    engineVersion: 'fake',
  };
}

/** Records what the generator asked for. `refuse` says which requests fail. */
function stubMeasurer(refuse: (request: CaptureRequest) => boolean = () => false) {
  const calls: { request: CaptureRequest; baseline: ExamSummary | undefined }[] = [];
  const measure: Measurer = (request, baseline) => {
    calls.push({ request, baseline });
    const failed = refuse(request);
    return {
      summary: fakeSummary(request, failed ? 'cannot-measure' : 'measured', 400 + (baseline ? 2 : 0) + request.attempt),
      scanRejections: failed ? ['low-signal'] : [],
    };
  };
  return { measure, calls };
}

describe('generation of the history: the sequence of captures, with a stand-in for the engine', () => {
  it('measures the pre-flight exam of each eye first and gives it, as baseline, to every later capture of the same eye', () => {
    const { measure, calls } = stubMeasurer();
    const records = simulateCrew('A', measure);
    const first = calls.slice(0, 2);
    expect(first.map((c) => [c.request.flightDay, c.request.eye, c.baseline])).toEqual([[0, 'OD', undefined], [0, 'OS', undefined]]);
    for (const eye of ['OD', 'OS'] as Eye[]) {
      const reference = records[0]!.eyes[eye].accepted!;
      for (const call of calls.filter((c) => c.request.flightDay > 0 && c.request.eye === eye)) {
        expect(call.baseline).toBe(reference);
        expect(call.baseline!.eye).toBe(eye);
      }
    }
    expect(calls.filter((c) => c.request.flightDay === 0).every((c) => c.baseline === undefined)).toBe(true);
  });

  it('stops at the first accepted attempt and records every attempt that was made, in order', () => {
    const { measure, calls } = stubMeasurer((r) => r.flightDay === 30 && r.eye === 'OD' && r.attempt < 3);
    const records = simulateCrew('A', measure);
    const control = records.find((r) => r.flightDay === 30)!;
    expect(control.eyes.OD.attempts.map((a) => [a.attempt, a.status])).toEqual([[1, 'cannot-measure'], [2, 'cannot-measure'], [3, 'measured']]);
    expect(control.eyes.OD.attempts.map((a) => a.request.attempt)).toEqual([1, 2, 3]);
    expect(control.eyes.OD.accepted!.examId).toBe('AOD30/3');
    expect(control.eyes.OS.attempts).toHaveLength(1);
    expect(calls.filter((c) => c.request.flightDay === 30 && c.request.eye === 'OS')).toHaveLength(1);
    expect(calls.filter((c) => c.request.flightDay === 30 && c.request.eye === 'OD')).toHaveLength(3);
  });

  it('an eye that no attempt could measure has no result, only its attempts, and the rules ask to repeat soon', () => {
    const { measure } = stubMeasurer((r) => r.flightDay === 30 && r.eye === 'OS');
    const records = simulateCrew('A', measure);
    const control = records.find((r) => r.flightDay === 30)!;
    expect(control.eyes.OS.accepted).toBeNull();
    expect(control.eyes.OS.attempts).toHaveLength(MAX_ATTEMPTS);
    for (const attempt of control.eyes.OS.attempts) {
      expect(attempt.status).toBe('cannot-measure');
      expect(attempt.rejections).toEqual(['too-few-usable-scans']);
      expect(attempt.scanRejections).toEqual(['low-signal']);
    }
    expect(control.assessment.eyes.OS.measured).toBe(false);
    expect(control.assessment.eyes.OS.change).toBeNull();
    expect(control.assessment.nextOct).toEqual({ flightDay: 37, reason: 'not-measured' });
    expect(records.map((r) => r.flightDay).slice(0, 3)).toEqual([0, 30, 37]);
  });

  it('does not go on without a valid pre-flight exam of every eye', () => {
    const { measure } = stubMeasurer((r) => r.flightDay === 0 && r.eye === 'OS');
    expect(() => simulateCrew('B', measure)).toThrow(MissingReferenceError);
    expect(() => simulateCrew('B', measure)).toThrow(/B OS: no valid pre-flight reference after 3 attempts/);
  });

  it('builds precomputed records with the fictional vision and the rules’ assessment, and follows the calendar to the end', () => {
    const { measure } = stubMeasurer();
    const seen: number[] = [];
    const records = simulateCrew('B', measure, (record) => seen.push(record.flightDay));
    expect(seen).toEqual(records.map((r) => r.flightDay));
    expect(records.map((r) => r.flightDay)).toEqual([0, 30, 90, 150]);
    records.forEach((record, index) => {
      expect(record.origin).toBe('precomputed');
      expect(record.questions).toEqual([]);
      expect(record.vision?.symptoms?.glasses).toBe('reading');
      expect(assessSession({ crewId: 'B', flightDay: record.flightDay, eyes: record.eyes, vision: record.vision, history: records.slice(0, index) })).toEqual(record.assessment);
    });
    expect(records.at(-1)!.assessment.nextOct).toBeNull();
  });

  it('refuses a calendar that does not move forward or that loops', () => {
    const { measure } = stubMeasurer();
    const stuck = (input: Parameters<typeof assessSession>[0]) => ({ ...assessSession(input), nextOct: { flightDay: input.flightDay, reason: 'routine' as const } });
    expect(() => simulateCrew('A', measure, undefined, stuck)).toThrow(/does not come after it/);
    const loops = (input: Parameters<typeof assessSession>[0]) => ({
      ...assessSession(input),
      nextOct: input.flightDay === 0 ? { flightDay: 30, reason: 'routine' as const } : input.flightDay === 30 ? { flightDay: 60, reason: 'routine' as const } : { flightDay: 30, reason: 'routine' as const },
    });
    expect(() => simulateCrew('A', measure, undefined, loops)).toThrow(/does not come after it|loops/);
  });

  it('a new simulation gives the same records again', () => {
    const { measure } = stubMeasurer((r) => r.flightDay === 30 && r.attempt === 1);
    expect(JSON.stringify(simulateCrew('C', measure))).toBe(JSON.stringify(simulateCrew('C', stubMeasurer((r) => r.flightDay === 30 && r.attempt === 1).measure)));
  });
});

describe('the published history against the engine', () => {
  const published = (crewId: CrewId, day: number): SessionRecord => getHistory(crewId, 1000).find((r) => r.flightDay === day)!;

  it('a fresh run of the same requests gives the same summaries: the B OS reference, its control, and a refused attempt', () => {
    // B OS: the reference measured now, then the day-30 control measured against it.
    const reference = measureRequest({ crewId: 'B', eye: 'OS', flightDay: 0, attempt: 1 });
    expect(JSON.stringify(reference.summary)).toBe(JSON.stringify(published('B', 0).eyes.OS.accepted));
    const control = measureRequest({ crewId: 'B', eye: 'OS', flightDay: 30, attempt: 1 }, reference.summary);
    expect(JSON.stringify(control.summary)).toBe(JSON.stringify(published('B', 30).eyes.OS.accepted));
    // A OD, flight day 30: the first attempt is refused by the instrument's scripted truncation.
    const refused = measureRequest({ crewId: 'A', eye: 'OD', flightDay: 30, attempt: 1 }, published('A', 0).eyes.OD.accepted!);
    const stored = published('A', 30).eyes.OD.attempts[0]!;
    expect(refused.summary.status).toBe('cannot-measure');
    expect(refused.summary.trtRingUm).toBeNull();
    expect(refused.summary.rings).toEqual([]);
    expect(stored.status).toBe('cannot-measure');
    expect(stored.rejections).toEqual(refused.summary.rejections);
    expect(stored.scanRejections).toEqual(refused.scanRejections);
    expect(stored.usableScans).toBe(refused.summary.quality.usableScans);
  }, 600000);

  it('every control is within the accuracy of the engine against the true change of the virtual eye', () => {
    // The true values are only read here, to judge the measures after the fact: the engine never sees them.
    for (const crewId of ['A', 'B', 'C', 'D'] as CrewId[]) {
      const history = getHistory(crewId, 1000);
      for (const eye of ['OD', 'OS'] as Eye[]) {
        const truth0 = groundTruth(crewId, eye, 0);
        const reference = history[0]!.eyes[eye].accepted!;
        for (const record of history.slice(1)) {
          const change = record.assessment.eyes[eye].change!;
          const truth = groundTruth(crewId, eye, record.flightDay);
          const label = `${crewId} ${eye} day ${record.flightDay}`;
          expect(change.baselineExamId, label).toBe(reference.examId);
          expect(Math.abs(change.trtRingUm.value - (truth.trtRingUm - truth0.trtRingUm)), label).toBeLessThanOrEqual(6);
          expect(Math.abs(change.bmRoughnessUm.value - (truth.bmRoughnessUm - truth0.bmRoughnessUm)), label).toBeLessThanOrEqual(1.5);
        }
      }
    }
  }, 600000);
});
