/**
 * The fictional mission and its four crew members (specification 01, section 4).
 * Names, histories and every number below are invented for the simulation, shaped
 * on published astronaut data as the specification says for each one.
 */
import type { CrewId, CrewMember, Eye, Mission } from '../contract';

export const MISSION: Mission = {
  name: 'Simulated 180-day mission',
  durationDays: 180,
  launchDateIso: '2026-05-20',
  // NASA routine in-flight OCT for a mission of this length: FD30, FD90 and every 90 days
  // (sans-evolucion-y-logica-clinica.md B2 [N2]); the specification fixes 30, 90 and 150.
  routineControlDays: [30, 90, 150],
};

export const CREW: readonly CrewMember[] = [
  { id: 'A', name: 'Kofi Mensah', role: { en: 'Flight engineer', es: 'Ingeniero de vuelo' }, ageYears: 43, sex: 'M', patientId: 'SIM-CREW-A' },
  { id: 'B', name: 'Elena Voss', role: { en: 'Commander', es: 'Comandante' }, ageYears: 47, sex: 'F', patientId: 'SIM-CREW-B' },
  { id: 'C', name: 'Ravi Anand', role: { en: 'Flight engineer', es: 'Ingeniero de vuelo' }, ageYears: 51, sex: 'M', patientId: 'SIM-CREW-C' },
  { id: 'D', name: 'Lucía Ferreyra', role: { en: 'Mission specialist', es: 'Especialista de misión' }, ageYears: 39, sex: 'F', patientId: 'SIM-CREW-D' },
];

export const CREW_IDS: readonly CrewId[] = ['A', 'B', 'C', 'D'];
export const EYES: readonly Eye[] = ['OD', 'OS'];

/** Invented birth dates, consistent with the ages at launch. Written to the exam files (DOB). */
export const BIRTH_DATES: Readonly<Record<CrewId, readonly [number, number, number]>> = {
  A: [1983, 1, 14],
  B: [1979, 3, 8],
  C: [1974, 11, 2],
  D: [1987, 2, 25],
};

/** Reference (pre-flight) anatomy of one eye: the targets the virtual eye is calibrated to. */
export interface EyeAnatomy {
  /** Total retinal thickness, 0–250 µm ring from the opening, area-weighted. */
  ringUm: number;
  /** Minimum rim width, mean of the opening edge. */
  mrwUm: number;
  bmoAreaMm2: number;
  cupVolumeMm3: number;
  /** Peripapillary choroid on the 3.5 mm circle. */
  choroidUm: number;
}

// Specification 01, section 4 ("Anatomía de referencia"). All within the ranges
// measured in astronauts before flight (sans-oct-base-tecnica.md table 1.C [P3]).
export const ANATOMY: Readonly<Record<CrewId, Readonly<Record<Eye, EyeAnatomy>>>> = {
  A: {
    OD: { ringUm: 371, mrwUm: 295, bmoAreaMm2: 2.31, cupVolumeMm3: 0.44, choroidUm: 198 },
    OS: { ringUm: 366, mrwUm: 290, bmoAreaMm2: 2.24, cupVolumeMm3: 0.41, choroidUm: 205 },
  },
  B: {
    OD: { ringUm: 396, mrwUm: 372, bmoAreaMm2: 1.98, cupVolumeMm3: 0.21, choroidUm: 221 },
    OS: { ringUm: 391, mrwUm: 364, bmoAreaMm2: 2.05, cupVolumeMm3: 0.19, choroidUm: 214 },
  },
  C: {
    OD: { ringUm: 418, mrwUm: 398, bmoAreaMm2: 1.86, cupVolumeMm3: 0.1, choroidUm: 248 },
    OS: { ringUm: 409, mrwUm: 386, bmoAreaMm2: 1.91, cupVolumeMm3: 0.12, choroidUm: 239 },
  },
  D: {
    OD: { ringUm: 404, mrwUm: 381, bmoAreaMm2: 1.72, cupVolumeMm3: 0.05, choroidUm: 281 },
    OS: { ringUm: 408, mrwUm: 377, bmoAreaMm2: 1.77, cupVolumeMm3: 0.07, choroidUm: 274 },
  },
};

/** Flight days of the evolution tables; day 0 is the reference exam. */
export const EVOLUTION_DAYS: readonly number[] = [0, 10, 30, 60, 90, 120, 150, 180];

/**
 * Swelling E(d): change of the 0–250 µm ring from the reference exam, µm (specification 01,
 * section 4). B follows the mean curve of 11 astronauts [P1]; C the inter-eye differences of
 * the group of 31 [P4]; D the shape of the 2024 case [P5 in sans-evolucion-y-logica-clinica.md].
 */
export const SWELLING_UM: Readonly<Record<CrewId, Readonly<Record<Eye, readonly number[]>>>> = {
  A: { OD: [0, 4, 6, 7, 8, 9, 9, 10], OS: [0, 3, 4, 5, 5, 6, 6, 7] },
  B: { OD: [0, 12, 15, 19, 24, 27, 31, 32], OS: [0, 8, 10, 13, 17, 20, 23, 24] },
  C: { OD: [0, 16, 27, 38, 48, 58, 66, 68], OS: [0, 9, 15, 21, 27, 33, 38, 39] },
  D: { OD: [0, 46, 118, 176, 203, 190, 168, 138], OS: [0, 42, 110, 186, 214, 222, 200, 176] },
};

/** Increase of Bruch's membrane roughness from the reference exam, µm (specification 01, section 4) [P4, P5]. */
export const ROUGHNESS_INCREASE_UM: Readonly<Record<CrewId, Readonly<Record<Eye, readonly number[]>>>> = {
  A: { OD: [0, 0, 0, 0, 0, 0, 0, 0], OS: [0, 0, 0, 0, 0, 0, 0, 0] },
  B: { OD: [0, 0, 0, 0, 0, 0, 0, 0], OS: [0, 0, 0, 0, 0, 0, 0, 0] },
  C: { OD: [0, 0, 0, 1.6, 3.8, 5.6, 7.0, 7.2], OS: [0, 0, 0, 1.0, 3.1, 4.0, 4.6, 4.8] },
  D: { OD: [0, 1.5, 4.0, 8.0, 10.5, 11.8, 12.4, 11.5], OS: [0, 1.2, 3.6, 8.6, 11.6, 14.2, 13.4, 12.2] },
};

/** Increase of choroid thickness, µm, same in both eyes; drawn only, never measured (specification 01, section 4). */
export const CHOROID_INCREASE_UM: Readonly<Record<CrewId, readonly number[]>> = {
  A: [0, 6, 8, 9, 10, 10, 10, 10],
  B: [0, 20, 32, 34, 36, 37, 38, 38],
  C: [0, 24, 38, 40, 42, 44, 45, 45],
  D: [0, 12, 30, 50, 58, 64, 70, 72],
};

export function crewMember(id: CrewId): CrewMember {
  const m = CREW.find((c) => c.id === id);
  if (!m) throw new RangeError(`Unknown crew member ${id}`);
  return m;
}

/** UTC milliseconds of 00:00 on the given flight day; flight day 1 is the launch date. Day 0 is the day before. */
export function flightDayDateMs(flightDay: number): number {
  const [y, m, d] = MISSION.launchDateIso.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d) + (flightDay - 1) * 86400000;
}
