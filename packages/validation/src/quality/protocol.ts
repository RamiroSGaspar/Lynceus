/**
 * The capture matrix of the synthetic validation (`packages/validation/protocol.md`,
 * version `sim-validation-protocol-1`). Everything is a fixed list of capture requests:
 * the same code gives the same matrix. Simulated data.
 *
 * The true values of the virtual eyes are read here only to choose the flight days
 * that sit next to each threshold. The engine never sees them.
 */
import { groundTruth, type CaptureConditions, type CaptureRequest, type CrewId, type Eye } from '@app/core';
import { CREW_IDS, EVOLUTION_DAYS, ROUGHNESS_INCREASE_UM, SWELLING_UM } from '@app/core/eye/crew';
import { monotoneCubic } from '@app/core/math/interp';
import { createRng } from '@app/core/rng';

export const PROTOCOL_VERSION = 'sim-validation-protocol-1';

export const EYES: readonly Eye[] = ['OD', 'OS'];
export const ALL_EYES: readonly (readonly [CrewId, Eye])[] = CREW_IDS.flatMap((crewId) => EYES.map((eye) => [crewId, eye] as const));

/** NASA's thresholds the sample has to straddle (rules/thresholds.ts); used here only to choose days. */
const TRT_THRESHOLDS_UM = [19.4, 55] as const;
const ROUGHNESS_THRESHOLD_UM = 2.8;
const GRID_DAYS = [0, 30, 60, 90, 120, 150, 180] as const;
const LAST_DAY = 180;

export type Family = 'clean' | 'signal' | 'motion' | 'blink' | 'truncation' | 'decentration' | 'edge-fade' | 'combination';
export const DEV_FAMILIES: readonly Family[] = ['clean', 'signal', 'motion', 'blink', 'truncation', 'decentration'];
export const HELD_OUT_FAMILIES: readonly Family[] = ['edge-fade', 'combination'];

export type Partition = 'development' | 'test-anatomy' | 'test-family';
/** Crew members whose eyes are only in the final test (protocol, section 3). */
export const TEST_CREW: readonly CrewId[] = ['C'];

export function partitionOf(crewId: CrewId, family: Family): Partition {
  if (TEST_CREW.includes(crewId)) return 'test-anatomy';
  return HELD_OUT_FAMILIES.includes(family) ? 'test-family' : 'development';
}

interface Level {
  label: string;
  conditions: (rng: ReturnType<typeof createRng>) => CaptureConditions;
}

const blink = (startFraction: number, widthFraction: number, scans: number) => (rng: ReturnType<typeof createRng>): CaptureConditions => {
  const from = Math.floor(rng.uniform(0, 48 - scans));
  return { blink: { startFraction, widthFraction }, affectedScans: { from, to: from + scans - 1 } };
};
const truncation = (px: number, scans: number | null) => (rng: ReturnType<typeof createRng>): CaptureConditions => {
  if (scans === null) return { truncationPx: px };
  const from = Math.floor(rng.uniform(0, 48 - scans));
  return { truncationPx: px, affectedScans: { from, to: from + scans - 1 } };
};
const decentration = (mm: number) => (rng: ReturnType<typeof createRng>): CaptureConditions => {
  const angle = rng.uniform(0, 2 * Math.PI);
  return { decentrationMm: { x: mm * Math.cos(angle), y: mm * Math.sin(angle) } };
};
const edgeFade = (widthFraction: number) => (rng: ReturnType<typeof createRng>): CaptureConditions => ({
  edgeFade: { side: rng.uniform(0, 1) < 0.5 ? 'start' : 'end', widthFraction },
});

/** Levels of each family, protocol section 2. One per eye and day, rotating. */
export const LEVELS: Readonly<Record<Exclude<Family, 'clean'>, readonly Level[]>> = {
  signal: [3, 6, 9, 12, 15].map((db) => ({ label: `${db} dB`, conditions: () => ({ signalLossDb: db }) })),
  motion: [0.1, 0.2, 0.3, 0.45, 0.6].map((m) => ({ label: `${m}`, conditions: () => ({ motion: m }) })),
  blink: [
    { label: '10 % × 3 scans', conditions: blink(0.4, 0.1, 3) },
    { label: '20 % × 6 scans', conditions: blink(0.3, 0.2, 6) },
    { label: '35 % × 4 scans', conditions: blink(0.5, 0.35, 4) },
    { label: '25 % × 10 scans', conditions: blink(0.2, 0.25, 10) },
    { label: '35 % × 14 scans', conditions: blink(0.4, 0.35, 14) },
  ],
  truncation: [
    { label: '30 px, all scans', conditions: truncation(30, null) },
    { label: '45 px × 8 scans', conditions: truncation(45, 8) },
    { label: '60 px × 4 scans', conditions: truncation(60, 4) },
    { label: '60 px × 10 scans', conditions: truncation(60, 10) },
    { label: '90 px × 3 scans', conditions: truncation(90, 3) },
  ],
  decentration: [0.1, 0.2, 0.3, 0.4, 0.5].map((mm) => ({ label: `${mm} mm`, conditions: decentration(mm) })),
  'edge-fade': [0.06, 0.12, 0.2, 0.3].map((w) => ({ label: `${Math.round(w * 100)} %`, conditions: edgeFade(w) })),
  combination: [
    { label: 'signal 8 dB + motion 0.2', conditions: () => ({ signalLossDb: 8, motion: 0.2 }) },
    { label: 'blink 20 % × 6 + decentration 0.2 mm', conditions: (rng) => ({ ...blink(0.3, 0.2, 6)(rng), ...decentration(0.2)(rng) }) },
    { label: 'truncation 45 px × 8 + edge fade 12 %', conditions: (rng) => ({ ...truncation(45, 8)(rng), ...edgeFade(0.12)(rng) }) },
    { label: 'signal 10 dB + decentration 0.3 mm', conditions: (rng) => ({ signalLossDb: 10, ...decentration(0.3)(rng) }) },
    { label: 'motion 0.3 + blink 10 % × 3', conditions: (rng) => ({ motion: 0.3, ...blink(0.4, 0.1, 3)(rng) }) },
  ],
};

/** Attempt numbers, protocol section 2. The instrument takes 1 to 9; each attempt has its own seed. */
const CLEAN_ATTEMPTS = [2, 3] as const;
const FAMILY_ATTEMPTS: Readonly<Record<Exclude<Family, 'clean'>, number>> = {
  signal: 1,
  motion: 4,
  blink: 5,
  truncation: 6,
  decentration: 7,
  'edge-fade': 8,
  combination: 9,
};
/** Day 0: attempts 1 and 9 are the references; repeats use 2 to 8 and only the development families. */
const DAY0_FAMILY_ATTEMPTS: Readonly<Partial<Record<Exclude<Family, 'clean'>, number>>> = {
  signal: 4,
  motion: 5,
  blink: 6,
  truncation: 7,
  decentration: 8,
};
export const REFERENCE_ATTEMPTS = { R1: 1, R2: 9 } as const;
export type ReferenceKey = keyof typeof REFERENCE_ATTEMPTS;

export interface PlannedCapture {
  /** Stable id: crew, eye, day, attempt. */
  id: string;
  role: 'reference' | 'follow-up';
  crewId: CrewId;
  eye: Eye;
  flightDay: number;
  family: Family;
  level: string;
  request: CaptureRequest;
  /** Reference the follow-up is analysed against; null for a reference itself. */
  reference: ReferenceKey | null;
  partition: Partition;
}

export function captureId(request: CaptureRequest): string {
  return `${request.crewId}-${request.eye}-d${String(request.flightDay).padStart(3, '0')}-a${request.attempt}`;
}

/** Integer day in 1–180 whose value of `curve` is closest to `target`, or null if the curve never reaches it. */
function nearestDay(curve: (day: number) => number, target: number): number | null {
  let max = -Infinity;
  for (let day = 0; day <= LAST_DAY; day++) max = Math.max(max, curve(day));
  if (max < target) return null;
  let best = 1;
  for (let day = 1; day <= LAST_DAY; day++) if (Math.abs(curve(day) - target) < Math.abs(curve(best) - target)) best = day;
  return best;
}

/**
 * The integer day whose TRUE change is closest to the threshold: the evolution table
 * proposes a day, and the ground truth of the days around it decides.
 */
function dayNearThreshold(table: readonly number[], target: number, truth: (day: number) => number): number | null {
  const proposed = nearestDay(monotoneCubic(EVOLUTION_DAYS as number[], table as number[]), target);
  if (proposed === null) return null;
  let best = proposed;
  for (let day = Math.max(1, proposed - 3); day <= Math.min(LAST_DAY, proposed + 3); day++) {
    if (Math.abs(truth(day) - target) < Math.abs(truth(best) - target)) best = day;
  }
  return best;
}

/** Flight days of one eye, protocol section 2. */
export function daysOf(crewId: CrewId, eye: Eye): number[] {
  const days = new Set<number>(GRID_DAYS);
  for (const target of TRT_THRESHOLDS_UM) {
    const day = dayNearThreshold(SWELLING_UM[crewId][eye], target, (d) => groundTruth(crewId, eye, d).trtRingChangeUm);
    if (day !== null) days.add(day);
  }
  const rough = dayNearThreshold(ROUGHNESS_INCREASE_UM[crewId][eye], ROUGHNESS_THRESHOLD_UM, (d) => groundTruth(crewId, eye, d).bmRoughnessChangeUm);
  if (rough !== null) days.add(rough);
  return [...days].sort((a, b) => a - b);
}

function planned(crewId: CrewId, eye: Eye, flightDay: number, attempt: number, family: Family, level: string, conditions: CaptureConditions | undefined, reference: ReferenceKey | null): PlannedCapture {
  const request: CaptureRequest = conditions ? { crewId, eye, flightDay, attempt, conditions } : { crewId, eye, flightDay, attempt };
  return {
    id: captureId(request),
    role: reference ? 'follow-up' : 'reference',
    crewId,
    eye,
    flightDay,
    family,
    level,
    request,
    reference,
    partition: partitionOf(crewId, family),
  };
}

/** The whole matrix: references first, then every follow-up, in a fixed order. */
export function captureMatrix(): PlannedCapture[] {
  const references: PlannedCapture[] = [];
  const followUps: PlannedCapture[] = [];
  ALL_EYES.forEach(([crewId, eye], eyeIndex) => {
    for (const key of ['R1', 'R2'] as const) references.push(planned(crewId, eye, 0, REFERENCE_ATTEMPTS[key], 'clean', `reference ${key}`, undefined, null));
    let alternate = 0;
    const nextReference = (): ReferenceKey => (alternate++ % 2 === 0 ? 'R1' : 'R2');
    daysOf(crewId, eye).forEach((flightDay, dayIndex) => {
      for (const attempt of CLEAN_ATTEMPTS) followUps.push(planned(crewId, eye, flightDay, attempt, 'clean', 'seed', undefined, nextReference()));
      const attempts = flightDay === 0 ? DAY0_FAMILY_ATTEMPTS : FAMILY_ATTEMPTS;
      for (const family of Object.keys(LEVELS) as Exclude<Family, 'clean'>[]) {
        const attempt = attempts[family];
        if (attempt === undefined) continue;
        const levels = LEVELS[family];
        const level = levels[(eyeIndex + dayIndex) % levels.length]!;
        const rng = createRng(`${PROTOCOL_VERSION}/${crewId}/${eye}/${flightDay}/${family}`);
        followUps.push(planned(crewId, eye, flightDay, attempt, family, level.label, level.conditions(rng), nextReference()));
      }
    });
  });
  return [...references, ...followUps];
}
