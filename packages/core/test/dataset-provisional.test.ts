import { describe, expect, it } from 'vitest';
import { assessSession, CREW, getHistory, MISSION, PROVISIONAL_ENGINE_VERSION, type CrewId, type Eye } from '../src/index';
import { monotoneCubic, scenarioRoughnessIncreaseUm, scenarioSwellingUm } from '../src/dataset/provisional';

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

describe('provisional history', () => {
  it('is deterministic', () => {
    for (const crewId of CREW_IDS) {
      expect(JSON.stringify(getHistory(crewId, 181))).toBe(JSON.stringify(getHistory(crewId, 181)));
    }
  });

  it('hands out fresh records: changing one does not change the next call', () => {
    const first = getHistory('B', 150);
    first[1]!.questions.push('changed');
    first[1]!.assessment.level = 'acute-visual-symptom';
    const second = getHistory('B', 150);
    expect(second[1]!.questions).toEqual([]);
    expect(second[1]!.assessment.level).toBe('no-detectable-change');
  });

  it('simulating the calendar with the rules gives the expected controls', () => {
    // Up to and including flight day 150, the last routine control.
    expect(days('A', 151)).toEqual([0, 30, 90, 150]);
    expect(days('B', 151)).toEqual([0, 30, 90, 118, 150]);
    expect(days('C', 151)).toEqual([0, 30, 58, 90, 118, 139, 150]);
    expect(days('D', 151)).toEqual([0, 30, 51, 72, 90, 111, 132, 150]);
  });

  it('after day 150 the rules still ask for one more control when it falls within the mission', () => {
    expect(days('A', 181)).toEqual([0, 30, 90, 150]);
    expect(days('B', 181).slice(-1)).toEqual([178]);
    expect(days('C', 181).slice(-1)).toEqual([171]);
    expect(days('D', 181).slice(-1)).toEqual([171]);
    for (const crewId of CREW_IDS) {
      const last = getHistory(crewId, 181).at(-1)!;
      expect(last.assessment.nextOct).toBeNull();
      expect(last.assessment.nextSteps.map((step) => step.id)).toContain('post-flight-exams');
    }
  });

  it('includes the pre-flight session and only sessions before the day asked', () => {
    for (const crewId of CREW_IDS) {
      expect(days(crewId, 0)).toEqual([]);
      expect(days(crewId, 30)).toEqual([0]);
      expect(days(crewId, 31)).toEqual([0, 30]);
      for (const before of [90, 150]) {
        const history = days(crewId, before);
        expect(history[0]).toBe(0);
        expect(history.every((day) => day < before)).toBe(true);
        expect([...history].sort((a, b) => a - b)).toEqual(history);
      }
    }
  });

  it('each control is the one the previous assessment asked for', () => {
    for (const crewId of CREW_IDS) {
      const history = getHistory(crewId, 181);
      for (let i = 1; i < history.length; i++) {
        expect(history[i]!.flightDay).toBe(history[i - 1]!.assessment.nextOct?.flightDay);
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

  it('B shows a first sign near flight day 90', () => {
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

  it('marks every record as precomputed, simulated and not measured on an image', () => {
    for (const crewId of CREW_IDS) {
      for (const record of getHistory(crewId, 181)) {
        expect(record.origin).toBe('precomputed');
        expect(record.crewId).toBe(crewId);
        expect(record.questions).toEqual([]);
        for (const eye of EYES) {
          const exam = record.eyes[eye].accepted!;
          expect(exam.patientId).toBe(`SIM-CREW-${crewId}`);
          expect(exam.engineVersion).toBe(PROVISIONAL_ENGINE_VERSION);
          expect(exam.engineVersion).toMatch(/^provisional/);
          expect(exam.eye).toBe(eye);
          expect(exam.status).toBe('measured');
          expect(exam.visitId).toBe(record.flightDay === 0 ? 'PRE' : `FD${String(record.flightDay).padStart(3, '0')}`);
          expect(exam.quality.meanQualityDb).toBeGreaterThanOrEqual(27);
          expect(exam.quality.meanQualityDb).toBeLessThanOrEqual(33);
          expect(exam.rings).toHaveLength(4);
          expect(exam.rings[0]!.thickness).toEqual(exam.trtRingUm);
        }
      }
    }
  });

  it('gives every exam its own id and the id of its reference exam', () => {
    const ids = new Set<string>();
    let exams = 0;
    for (const crewId of CREW_IDS) {
      const history = getHistory(crewId, 181);
      for (const record of history) {
        for (const eye of EYES) {
          const exam = record.eyes[eye].accepted!;
          ids.add(exam.examId);
          exams++;
          expect(exam.referenceId).toBe(history[0]!.eyes[eye].accepted!.examId);
        }
      }
    }
    expect(ids.size).toBe(exams);
  });

  it('dates the exams from the launch date and the flight day, never from the clock', () => {
    const history = getHistory('A', 181);
    const date = (index: number) => new Date(history[index]!.eyes.OD.accepted!.examTimeMs).toISOString();
    expect(date(1)).toBe('2026-06-18T10:00:00.000Z'); // flight day 30; flight day 1 is 2026-05-20
    expect(date(0) < '2026-05-20').toBe(true);
  });

  it('keeps the simulated measurement close to the scenario curves', () => {
    for (const crewId of CREW_IDS) {
      for (const record of getHistory(crewId, 181)) {
        if (record.flightDay === 0) continue;
        for (const eye of EYES) {
          const change = record.assessment.eyes[eye].change!;
          // Two exams with an error of 2.5 µm each: 3.5 µm for the change. Allow 3.5 deviations.
          expect(Math.abs(change.trtRingUm.value - scenarioSwellingUm(crewId, eye, record.flightDay))).toBeLessThan(12.4);
          expect(Math.abs(change.bmRoughnessUm.value - scenarioRoughnessIncreaseUm(crewId, eye, record.flightDay))).toBeLessThan(2);
          expect(change.bmoAreaChangePct).toBe(0);
        }
      }
    }
  });

  it('follows the scenario tables at their days and stays monotone between them', () => {
    expect(scenarioSwellingUm('B', 'OD', 150)).toBe(31);
    expect(scenarioSwellingUm('C', 'OS', 90)).toBe(27);
    expect(scenarioSwellingUm('D', 'OS', 120)).toBe(222);
    expect(scenarioSwellingUm('A', 'OD', 0)).toBe(0);
    expect(scenarioRoughnessIncreaseUm('C', 'OD', 90)).toBe(3.8);
    expect(scenarioRoughnessIncreaseUm('B', 'OD', 100)).toBe(0);
    for (let day = 1; day <= 180; day++) {
      expect(scenarioSwellingUm('B', 'OD', day)).toBeGreaterThanOrEqual(scenarioSwellingUm('B', 'OD', day - 1));
    }
    // D rises and then falls: the curve must not go above its highest table value.
    for (let day = 0; day <= 180; day++) expect(scenarioSwellingUm('D', 'OD', day)).toBeLessThanOrEqual(203);
    expect(monotoneCubic([0, 10], [0, 5], 4)).toBeCloseTo(2, 12);
    expect(monotoneCubic([0, 10], [0, 5], -3)).toBe(0);
    expect(monotoneCubic([0, 10], [0, 5], 30)).toBe(5);
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
        // The simulated acuity never moves enough to count as a real change.
        expect(record.assessment.findings).not.toContain('near-vision-worse');
        expect(record.assessment.level).not.toBe('acute-visual-symptom');
        expect(Object.keys(record.vision!.symptoms!.answers)).toHaveLength(15);
      }
    }
  });

  it('repeats the two scripted captures that fail on a past control', () => {
    const attempts = (crewId: CrewId, day: number, eye: Eye) =>
      getHistory(crewId, 181).find((record) => record.flightDay === day)!.eyes[eye].attempts;
    expect(attempts('A', 30, 'OD').map((a) => a.status)).toEqual(['cannot-measure', 'measured']);
    expect(attempts('A', 30, 'OD')[0]!.scanRejections).toEqual(['truncated']);
    expect(attempts('C', 90, 'OD').map((a) => a.status)).toEqual(['cannot-measure', 'measured']);
    expect(attempts('C', 90, 'OD')[0]!.scanRejections).toEqual(['low-signal']);
    expect(attempts('A', 30, 'OS')).toHaveLength(1);
    expect(attempts('B', 90, 'OD')).toHaveLength(1);
  });

  it('rejects a crew member that does not exist', () => {
    expect(() => getHistory('Z' as CrewId, 150)).toThrow(/Unknown crew member/);
  });
});
