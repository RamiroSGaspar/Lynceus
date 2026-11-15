import { describe, expect, it } from 'vitest';
import { ANATOMY, CREW, CREW_IDS, EVOLUTION_DAYS, EYES, MISSION, ROUGHNESS_INCREASE_UM, SWELLING_UM } from '../src/eye/crew';
import { groundTruth, ringThicknessUm } from '../src/eye/groundTruth';
import { EyeModel, emptyProfile, getEye } from '../src/eye/model';

describe('mission and crew (spec 4)', () => {
  it('is a 180-day mission launched on 2026-05-20 with controls on days 30, 90 and 150', () => {
    expect(MISSION.durationDays).toBe(180);
    expect(MISSION.launchDateIso).toBe('2026-05-20');
    expect(MISSION.routineControlDays).toEqual([30, 90, 150]);
  });
  it('has four fictional members whose files are marked as simulated', () => {
    expect(CREW.map((c) => c.id)).toEqual(['A', 'B', 'C', 'D']);
    for (const c of CREW) expect(c.patientId).toBe(`SIM-CREW-${c.id}`);
  });
});

// Spec 3.9: one test per objective, for the 8 eyes.
describe.each(CREW_IDS.flatMap((c) => EYES.map((e) => [c, e] as const)))('virtual eye %s %s (spec 3.9)', (crewId, eye) => {
  const model = getEye(crewId, eye);
  const target = ANATOMY[crewId][eye];
  const truth = groundTruth(crewId, eye, 0);

  it('reference ring thickness within ±2 µm', () => {
    expect(Math.abs(truth.trtRingUm - target.ringUm)).toBeLessThanOrEqual(2);
  });

  it('swelling E(d) within ±1 µm at every point of the curve', () => {
    const reference = ringThicknessUm(model, model.state(0), 0);
    EVOLUTION_DAYS.forEach((d, i) => {
      const change = ringThicknessUm(model, model.state(d), 0) - reference;
      expect(Math.abs(change - SWELLING_UM[crewId][eye][i]!), `day ${d}`).toBeLessThanOrEqual(1);
    });
  });

  it('roughness increase within ±0.5 µm at every point of the curve', () => {
    const reference = model.roughnessUm(0);
    EVOLUTION_DAYS.forEach((d, i) => {
      const change = model.roughnessUm(d) - reference;
      expect(Math.abs(change - ROUGHNESS_INCREASE_UM[crewId][eye][i]!), `day ${d}`).toBeLessThanOrEqual(0.5);
    });
  });

  it('opening area within ±2 %', () => {
    expect(Math.abs(truth.bmo.areaMm2 / target.bmoAreaMm2 - 1)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(truth.bmoTrueAreaMm2 / target.bmoAreaMm2 - 1)).toBeLessThanOrEqual(0.02);
  });

  it('cup volume and MRW of the reference exam within ±10 %', () => {
    expect(Math.abs(truth.cupVolumeMm3 / target.cupVolumeMm3 - 1)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(truth.mrwUm / target.mrwUm - 1)).toBeLessThanOrEqual(0.1);
  });

  it('stays within the ranges measured in astronauts before flight (table 1.C [P3])', () => {
    expect(truth.trtRingUm).toBeGreaterThanOrEqual(299.3);
    expect(truth.trtRingUm).toBeLessThanOrEqual(483.9);
    expect(truth.mrwUm).toBeGreaterThanOrEqual(225.1);
    expect(truth.mrwUm).toBeLessThanOrEqual(493.8);
    expect(truth.bmo.areaMm2).toBeGreaterThanOrEqual(1.33);
    expect(truth.bmo.areaMm2).toBeLessThanOrEqual(4.11);
    expect(truth.cupVolumeMm3).toBeGreaterThanOrEqual(0);
    expect(truth.cupVolumeMm3).toBeLessThanOrEqual(0.841);
    expect(truth.choroidThicknessUm).toBeGreaterThanOrEqual(107);
    expect(truth.choroidThicknessUm).toBeLessThanOrEqual(406.4);
    expect(truth.rnflCircleUm).toBeGreaterThanOrEqual(83.3);
    expect(truth.rnflCircleUm).toBeLessThanOrEqual(126.1);
  });

  it('has an opening taller than wide, axis ratio 1.05–1.18, and a continuous inner surface at the edge', () => {
    const ratio = model.ellipseAxisV / model.ellipseAxisH;
    expect(ratio).toBeGreaterThanOrEqual(1.05);
    expect(ratio).toBeLessThanOrEqual(1.18);
    const state = model.state(90);
    const p = emptyProfile();
    for (const th of [0, 1, 2, 3, 4, 5, 6]) {
      const rb = model.bmoRadius(th);
      state.profile((rb - 0.01) * Math.cos(th), (rb - 0.01) * Math.sin(th), p);
      const inside = p.zIlm;
      state.profile((rb + 0.01) * Math.cos(th), (rb + 0.01) * Math.sin(th), p);
      expect(Math.abs(p.zIlm - inside)).toBeLessThan(0.1);
    }
  });
});

describe('virtual eye is reproducible', () => {
  it('builds the same eye twice', () => {
    const a = new EyeModel('C', 'OS');
    const b = getEye('C', 'OS');
    expect(a.trtEdgeUm).toBe(b.trtEdgeUm);
    expect(a.cup).toEqual(b.cup);
    expect(a.vessels.segments).toEqual(b.vessels.segments);
  });
});
