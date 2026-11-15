import { describe, expect, it } from 'vitest';
import {
  acquire,
  assessSession,
  checkHistoryDataset,
  CREW,
  ENGINE_VERSION,
  getHistory,
  getHistoryInfo,
  isProvisionalErrorModel,
  MISSION,
  PROVISIONAL_ENGINE_VERSION,
  PROVISIONAL_ERROR_MODEL,
  RULES_VERSION,
  unstableNumbers,
  type CrewId,
  type Eye,
  type MeasuredHistoryDataset,
  type SessionRecord,
} from '../src/index';

const CREW_IDS: readonly CrewId[] = ['A', 'B', 'C', 'D'];
const EYES: readonly Eye[] = ['OD', 'OS'];
const days = (crewId: CrewId, before: number) => getHistory(crewId, before).map((record) => record.flightDay);

describe('mission and crew', () => {
  it('describes the fictional 180-day mission', () => {
    expect(MISSION).toMatchObject({ durationDays: 180, launchDateIso: '2026-05-20', routineControlDays: [30, 90, 150] });
    expect(MISSION.name.length).toBeGreaterThan(0);
  });

  it('has the four crew members of the scenario, marked as simulated', () => {
    expect(CREW.map((member) => [member.id, member.name, member.ageYears, member.sex])).toEqual([
      ['A', 'Kofi Mensah', 43, 'M'],
      ['B', 'Elena Voss', 47, 'F'],
      ['C', 'Ravi Anand', 51, 'M'],
      ['D', 'Lucía Ferreyra', 39, 'F'],
    ]);
    for (const member of CREW) {
      expect(member.patientId).toBe(`SIM-CREW-${member.id}`);
      expect(member.role.en.length).toBeGreaterThan(0);
      expect(member.role.es.length).toBeGreaterThan(0);
    }
  });
});

describe('measured history', () => {
  const dataset = (): MeasuredHistoryDataset => ({
    ...getHistoryInfo(),
    crew: { A: getHistory('A', 181), B: getHistory('B', 181), C: getHistory('C', 181), D: getHistory('D', 181) },
  });
  const attemptsOf = (crewId: CrewId, day: number, eye: Eye) =>
    getHistory(crewId, 181).find((record) => record.flightDay === day)!.eyes[eye].attempts;

  it('passes the integrity checks and is deterministic', { timeout: 120_000 }, () => {
    expect(checkHistoryDataset(dataset())).toEqual([]);
    for (const crewId of CREW_IDS) {
      expect(JSON.stringify(getHistory(crewId, 181))).toBe(JSON.stringify(getHistory(crewId, 181)));
    }
  });

  it('says which versions produced it: the current engine and rules, and the provisional error model', () => {
    const info = getHistoryInfo();
    expect(info.simulated).toBe(true);
    expect(info.notice).toMatch(/Simulated data/);
    expect(info.versions.engine).toBe(ENGINE_VERSION);
    expect(info.versions.rules).toBe(RULES_VERSION);
    expect(info.versions.errorModel).toBe(PROVISIONAL_ERROR_MODEL.version);
    expect(isProvisionalErrorModel(info.versions.errorModel)).toBe(true);
    expect(info.maxAttempts).toBe(3);
    for (const crewId of CREW_IDS) {
      for (const record of getHistory(crewId, 181)) {
        expect(record.assessment.rulesVersion).toBe(RULES_VERSION);
        expect(record.assessment.errorModelVersion).toBe(PROVISIONAL_ERROR_MODEL.version);
      }
    }
  });

  it('hands out fresh records: changing one does not change the next call', () => {
    const first = getHistory('B', 150);
    first[1]!.questions.push('changed');
    first[1]!.assessment.level = 'acute-visual-symptom';
    first[1]!.eyes.OD.accepted!.trtRingUm!.value = 0;
    first[1]!.eyes.OD.attempts.pop();
    first.pop();
    const second = getHistory('B', 150);
    expect(second).toHaveLength(4);
    expect(second[1]!.questions).toEqual([]);
    expect(second[1]!.assessment.level).toBe('no-detectable-change');
    expect(second[1]!.eyes.OD.accepted!.trtRingUm!.value).toBeGreaterThan(300);
    expect(second[1]!.eyes.OD.attempts).toHaveLength(1);
    const info = getHistoryInfo();
    info.versions.engine = 'changed';
    expect(getHistoryInfo().versions.engine).toBe(ENGINE_VERSION);
  });

  it('asks for the controls the rules decide with the measured values', () => {
    expect(days('A', 181)).toEqual([0, 30, 90, 150]);
    expect(days('B', 181)).toEqual([0, 30, 90, 118, 150, 178]);
    expect(days('C', 181)).toEqual([0, 30, 58, 90, 118, 139, 150, 171]);
    expect(days('D', 181)).toEqual([0, 30, 51, 72, 90, 111, 132, 150, 171]);
    for (const crewId of CREW_IDS) {
      const history = getHistory(crewId, 181);
      const last = history.at(-1)!;
      expect(last.assessment.nextOct).toBeNull();
      expect(last.assessment.nextSteps.map((step) => step.id)).toContain('post-flight-exams');
      expect(last.flightDay).toBeLessThanOrEqual(MISSION.durationDays);
    }
  });

  it('each control is the one the previous assessment asked for, and the days only grow', () => {
    for (const crewId of CREW_IDS) {
      const history = getHistory(crewId, 181);
      for (let i = 1; i < history.length; i++) {
        expect(history[i]!.flightDay).toBe(history[i - 1]!.assessment.nextOct?.flightDay);
        expect(history[i]!.flightDay).toBeGreaterThan(history[i - 1]!.flightDay);
      }
    }
  });

  it('includes the pre-flight session and only sessions strictly before the day asked', () => {
    for (const crewId of CREW_IDS) {
      expect(days(crewId, 0)).toEqual([]);
      expect(days(crewId, -5)).toEqual([]);
      expect(days(crewId, 1)).toEqual([0]);
      expect(days(crewId, 30)).toEqual([0]);
      expect(days(crewId, 31)).toEqual([0, 30]);
      expect(days(crewId, 1000)).toEqual(days(crewId, 181));
      for (const before of [90, 150, 151]) {
        const history = days(crewId, before);
        expect(history[0]).toBe(0);
        expect(history.every((day) => day < before)).toBe(true);
        expect([...history].sort((a, b) => a - b)).toEqual(history);
      }
    }
  });

  it('each stored assessment is what the rules give for that session and the ones before it', () => {
    for (const crewId of CREW_IDS) {
      const history = getHistory(crewId, 181);
      history.forEach((record, index) => {
        const again = assessSession({
          crewId,
          flightDay: record.flightDay,
          eyes: record.eyes,
          vision: record.vision,
          history: history.slice(0, index),
        });
        expect(again).toEqual(record.assessment);
      });
    }
  });

  it('A never passes a threshold', () => {
    for (const record of getHistory('A', 181)) {
      expect(record.assessment.level).toBe('no-detectable-change');
      expect(record.assessment.findings).toEqual([]);
      for (const eye of EYES) {
        expect(record.assessment.eyes[eye].level).toBe('no-detectable-change');
        expect(record.assessment.eyes[eye].thresholds.every((threshold) => !threshold.exceeded)).toBe(true);
      }
    }
  });

  it('B shows a first sign by flight day 90 and never reaches the concerning level', () => {
    const history = getHistory('B', 181);
    const level = (day: number) => history.find((record) => record.flightDay === day)!.assessment.level;
    expect(level(30)).toBe('no-detectable-change');
    expect(level(90)).toBe('first-sign');
    expect(history.every((record) => record.assessment.level !== 'clinically-concerning')).toBe(true);
  });

  it('C reaches the clinically concerning level in one eye, less in the other, with folds in both', () => {
    const history = getHistory('C', 181);
    const last = history.at(-1)!.assessment;
    expect(last.eyes.OD.level).toBe('clinically-concerning');
    expect(last.eyes.OS.level).toBe('first-sign');
    expect(last.eyes.OD.findings).toContain('folds-new');
    expect(last.eyes.OS.findings).toContain('folds-new');
    expect(history.find((record) => record.flightDay === 30)!.assessment.findings).not.toContain('folds-new');
  });

  it('D is clinically concerning from flight day 30 on, in both eyes, without symptoms', () => {
    const inFlight = getHistory('D', 181).filter((record) => record.flightDay > 0);
    expect(inFlight[0]!.flightDay).toBe(30);
    for (const record of inFlight) {
      expect(record.assessment.level).toBe('clinically-concerning');
      expect(record.assessment.contact).toBe('without-delay');
      for (const eye of EYES) expect(record.assessment.eyes[eye].level).toBe('clinically-concerning');
      expect(record.assessment.functional?.symptoms).toEqual([]);
    }
  });

  it('marks every record as precomputed and simulated, and every exam as measured by the engine', () => {
    for (const crewId of CREW_IDS) {
      for (const record of getHistory(crewId, 181)) {
        expect(record.origin).toBe('precomputed');
        expect(record.crewId).toBe(crewId);
        expect(record.questions).toEqual([]);
        for (const eye of EYES) {
          const exam = record.eyes[eye].accepted!;
          expect(exam.patientId).toBe(`SIM-CREW-${crewId}`);
          expect(exam.engineVersion).toBe(ENGINE_VERSION);
          expect(exam.engineVersion).not.toBe(PROVISIONAL_ENGINE_VERSION);
          expect(exam.eye).toBe(eye);
          expect(exam.status).toBe('measured');
          expect(exam.visitId).toBe(record.flightDay === 0 ? 'PRE' : `FD${String(record.flightDay).padStart(3, '0')}`);
          expect(exam.rings).toHaveLength(4);
          expect(exam.rings[0]!.thickness).toEqual(exam.trtRingUm);
          for (const quantity of [exam.trtRingUm!, exam.mrwUm!, exam.bmRoughnessUm!]) {
            expect(quantity.origin).toBe('measured');
            expect(quantity.unit).toBe('µm');
            expect(quantity.sources?.length).toBeGreaterThan(0);
          }
          expect(record.assessment.limitations).toContain('simulated-data');
        }
      }
    }
  });

  it('keeps only compact summaries: no per-scan arrays, no pixels, no non-finite numbers', () => {
    for (const crewId of CREW_IDS) {
      const history = getHistory(crewId, 181);
      for (const record of history) {
        for (const eye of EYES) expect(Object.keys(record.eyes[eye].accepted!)).not.toContain('scans');
      }
      const text = JSON.stringify(history);
      expect(text).not.toMatch(/segLines|pixels|ilmPx|bmPx/);
      expect(unstableNumbers(history)).toEqual([]);
      expect(text.length).toBeLessThan(120_000);
    }
  });

  it('gives every exam its own id, and each eye one reference exam: its own pre-flight exam', () => {
    const ids = new Set<string>();
    let exams = 0;
    for (const crewId of CREW_IDS) {
      const history = getHistory(crewId, 181);
      for (const record of history) {
        for (const eye of EYES) {
          const exam = record.eyes[eye].accepted!;
          const reference = history[0]!.eyes[eye].accepted!;
          ids.add(exam.examId);
          exams++;
          expect(exam.eye).toBe(eye);
          expect(exam.referenceId).toBe(reference.referenceId);
          expect(exam.patientId).toBe(reference.patientId);
          if (record.flightDay > 0) {
            expect(exam.examId).not.toBe(reference.examId);
            expect(record.assessment.eyes[eye].change?.baselineExamId).toBe(reference.examId);
            expect(exam.bmoSource).toBe('reference-shape');
          } else {
            expect(exam.bmoSource).toBe('this-exam');
          }
        }
      }
      // The two eyes are never mixed up: the reference of each eye is another exam.
      expect(history[0]!.eyes.OD.accepted!.examId).not.toBe(history[0]!.eyes.OS.accepted!.examId);
    }
    expect(ids.size).toBe(exams);
  });

  it('every request is the capture that made the exam: the same request gives the same exam id', { timeout: 120_000 }, () => {
    for (const crewId of CREW_IDS) {
      for (const record of getHistory(crewId, 181)) {
        for (const eye of EYES) {
          const capture = record.eyes[eye];
          const request = capture.attempts.at(-1)!.request;
          expect(request).toEqual({ crewId, eye, flightDay: record.flightDay, attempt: capture.attempts.length });
          const header = acquire(request).header;
          expect(capture.accepted!.examId).toBe(header.id);
          expect(capture.accepted!.referenceId).toBe(header.referenceId);
          expect(capture.accepted!.examTimeMs).toBe(header.examTimeMs);
        }
      }
    }
  });

  it('dates the exams from the launch date and the flight day, never from the clock', () => {
    const history = getHistory('A', 181);
    const date = (index: number) => new Date(history[index]!.eyes.OD.accepted!.examTimeMs).toISOString().slice(0, 10);
    expect(date(1)).toBe('2026-06-18'); // flight day 30; flight day 1 is 2026-05-20
    expect(date(0) < '2026-05-20').toBe(true);
  });

  it('has the fictional pre-flight near acuity of the specification', () => {
    const expected = { A: [0, 0.02], B: [0.06, 0.04], C: [0.1, 0.12], D: [-0.04, -0.02] } as const;
    for (const crewId of CREW_IDS) {
      const vision = getHistory(crewId, 1)[0]!.vision!;
      expect([vision.acuity.OD?.logMar, vision.acuity.OS?.logMar]).toEqual(expected[crewId]);
    }
  });

  it('past sessions have no symptoms and a clean grid, except mild near blur in B and C from day 90', () => {
    for (const crewId of CREW_IDS) {
      for (const record of getHistory(crewId, 181)) {
        const functional = record.assessment.functional!;
        expect(functional.done).toEqual({ symptoms: true, acuity: true, amsler: true });
        expect(functional.amsler.OD?.marked).toBe(false);
        expect(functional.amsler.OS?.marked).toBe(false);
        const nearBlur = (crewId === 'B' || crewId === 'C') && record.flightDay >= 90;
        expect(functional.symptoms).toEqual(nearBlur ? [{ id: 'near-vision', severity: 'mild', eye: 'both' }] : []);
        expect(record.assessment.findings.includes('symptom-near-blur')).toBe(nearBlur);
        expect(record.assessment.findings).not.toContain('near-vision-worse');
        expect(record.assessment.level).not.toBe('acute-visual-symptom');
        expect(Object.keys(record.vision!.symptoms!.answers)).toHaveLength(15);
      }
    }
  });

  it('repeats the captures that the instrument spoils, and keeps what every attempt did', () => {
    // The instrument's scripted failures that fall on a past control (`SCRIPTED_EVENTS`).
    expect(attemptsOf('A', 30, 'OD').map((a) => [a.attempt, a.status])).toEqual([[1, 'cannot-measure'], [2, 'measured']]);
    expect(attemptsOf('A', 30, 'OD')[0]!.scanRejections).toContain('truncated');
    expect(attemptsOf('C', 90, 'OD').map((a) => a.status)).toEqual(['cannot-measure', 'measured']);
    expect(attemptsOf('C', 90, 'OD')[0]!.scanRejections).toContain('low-signal');
    expect(attemptsOf('B', 150, 'OS').map((a) => a.status)).toEqual(['cannot-measure', 'measured']);
    expect(attemptsOf('B', 150, 'OS')[0]!.scanRejections).toContain('signal-dropout');
    expect(attemptsOf('A', 30, 'OS')).toHaveLength(1);
    expect(attemptsOf('B', 90, 'OD')).toHaveLength(1);
  });

  it('a refused attempt carries its reasons and counts, and no measured value', () => {
    let refused = 0;
    for (const crewId of CREW_IDS) {
      for (const record of getHistory(crewId, 181)) {
        for (const eye of EYES) {
          for (const attempt of record.eyes[eye].attempts) {
            expect(Object.keys(attempt).sort()).toEqual(
              ['attempt', 'meanQualityDb', 'rejections', 'request', 'scanRejections', 'status', 'usableScans'],
            );
            if (attempt.status !== 'cannot-measure') continue;
            refused++;
            expect(attempt.rejections.length + attempt.scanRejections.length).toBeGreaterThan(0);
            expect(attempt.usableScans).toBeLessThan(40);
          }
        }
      }
    }
    expect(refused).toBe(3);
  });

  it('the accepted attempt of a retried capture is the one with the later request', () => {
    const capture = getHistory('A', 31).at(-1)!.eyes.OD;
    expect(capture.attempts).toHaveLength(2);
    expect(capture.attempts[1]!.request.attempt).toBe(2);
    expect(capture.accepted!.examId).toBe(acquire(capture.attempts[1]!.request).header.id);
    expect(capture.accepted!.examId).not.toBe(acquire(capture.attempts[0]!.request).header.id);
  });

  it('is only as honest as its checks: a tampered file is reported', { timeout: 120_000 }, () => {
    const tampered = dataset();
    const records = tampered.crew.B as SessionRecord[];
    records[2] = { ...records[2]!, flightDay: 91 };
    expect(checkHistoryDataset(tampered).length).toBeGreaterThan(0);
    const mixedUp = dataset();
    const b = mixedUp.crew.B as SessionRecord[];
    b[1] = { ...b[1]!, eyes: { OD: b[1]!.eyes.OS, OS: b[1]!.eyes.OD } };
    expect(checkHistoryDataset(mixedUp).length).toBeGreaterThan(0);
  });

  it('rejects a crew member that does not exist', () => {
    expect(() => getHistory('Z' as CrewId, 150)).toThrow(/Unknown crew member/);
  });
});
