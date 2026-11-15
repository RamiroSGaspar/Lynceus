/**
 * Fictional vision tests and questionnaire of the crew, one session at a time.
 * Simulated data: the acuity, the Amsler grid and the answers are not obtained
 * from a tomography; they are scripted per crew member and drawn from seeded
 * streams, so the same arguments always give the same session.
 */
import type {
  AcuityResult,
  AmslerResult,
  CrewId,
  Eye,
  SymptomAnswer,
  SymptomAnswers,
  VisionSession,
} from '../contract';
import { SYMPTOM_ORDER } from '../rules/functional';

/** Identifies these scenarios in the history file. Kept as it was so the values drawn do not change. */
export const VISION_SCENARIOS_VERSION = 'provisional-history-1';
const SEED = VISION_SCENARIOS_VERSION;

/** Fictional pre-flight near acuity, logMAR (specification 04, section 6). */
const PREFLIGHT_ACUITY_LOGMAR: Readonly<Record<CrewId, Readonly<Record<Eye, number>>>> = {
  A: { OD: 0.0, OS: 0.02 },
  B: { OD: 0.06, OS: 0.04 },
  C: { OD: 0.1, OS: 0.12 },
  D: { OD: -0.04, OS: -0.02 },
};

/** Fictional: which near glasses each crew member uses. Not in the specification; the questionnaire needs a value. */
const GLASSES: Readonly<Record<CrewId, SymptomAnswers['glasses']>> = {
  A: 'none',
  B: 'reading',
  C: 'progressive',
  D: 'none',
};

/** Crew members who report mild near blur, the most common complaint on long flights, and from which day. */
const NEAR_BLUR_FROM_DAY: Readonly<Partial<Record<CrewId, number>>> = { B: 90, C: 90 };

/** FNV-1a hash of a text key, 32 bits. */
function hash32(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 generator: uniform numbers in [0, 1) from a 32-bit seed. */
function stream(key: string): () => number {
  let state = hash32(`${SEED}/${key}`);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uniform(key: string): number {
  return stream(key)();
}

/** Standard normal deviate of a key (Box–Muller). */
function normal(key: string): number {
  const next = stream(key);
  const u1 = (Math.floor(next() * 4294967296) + 0.5) / 4294967296;
  const u2 = next();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, low: number, high: number): number {
  return value < low ? low : value > high ? high : value;
}

function buildAcuity(crewId: CrewId, eye: Eye, flightDay: number, nearBlur: boolean): AcuityResult {
  const key = `${crewId}/${eye}/${flightDay}/acuity`;
  // In flight: the pre-flight value plus a variation well inside the test's own (±0.17),
  // and a small loss once near blur is reported. Never enough to count as a real change.
  const drift = flightDay > 0 ? clamp(0.04 * normal(key), -0.08, 0.08) + (nearBlur ? 0.06 : 0) : 0;
  return {
    eye,
    logMar: round(PREFLIGHT_ACUITY_LOGMAR[crewId][eye] + drift, 2),
    atScreenFloor: false,
    trials: 18,
    correct: 11 + Math.floor(3 * uniform(`${key}/correct`)),
    withCorrection: GLASSES[crewId] !== 'none',
  };
}

function cleanAmsler(eye: Eye): AmslerResult {
  return { eye, gridSize: 20, cellDeg: 1, marks: [], markedFraction: 0, centralMarked: false, cornersSeen: true };
}

/** The fictional vision tests and questionnaire of a crew member on a flight day (0 is the pre-flight session). */
export function visionScenario(crewId: CrewId, flightDay: number): VisionSession {
  const nearBlurFrom = NEAR_BLUR_FROM_DAY[crewId];
  const nearBlur = nearBlurFrom !== undefined && flightDay >= nearBlurFrom;
  const answers = Object.fromEntries(
    SYMPTOM_ORDER.map((id): [string, SymptomAnswer] => [
      id,
      id === 'near-vision' && nearBlur ? { present: true, severity: 'mild', eye: 'both' } : { present: false },
    ]),
  ) as SymptomAnswers['answers'];
  return {
    // A fictional tablet of 264 pixels per inch at 40 cm: it can draw down to −0.38 logMAR with half-pixel strokes.
    calibration: { pxPerMm: 10.4, viewingDistanceCm: 40, floorLogMar: -0.38 },
    acuity: {
      OD: buildAcuity(crewId, 'OD', flightDay, nearBlur),
      OS: buildAcuity(crewId, 'OS', flightDay, nearBlur),
    },
    amsler: { OD: cleanAmsler('OD'), OS: cleanAmsler('OS') },
    symptoms: { changeNoticed: nearBlur, answers, glasses: GLASSES[crewId] },
  };
}
