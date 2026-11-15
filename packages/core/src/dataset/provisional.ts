/**
 * PROVISIONAL history of the fictional crew. Simulated data.
 *
 * Until the past sessions are computed by the real engine from generated exams,
 * this module stands in for them: it builds each exam summary from the scenario
 * tables of section 4 of `especificaciones/01-nucleo.md` (reference anatomy,
 * swelling E(d), roughness) plus a small deterministic measurement error. Nothing
 * here was measured on an image, which `PROVISIONAL_ENGINE_VERSION` states in
 * every exam.
 *
 * The controls are not a fixed list: the calendar is simulated with the product's
 * own rules, starting from the routine days, and each assessment decides the next
 * control. Whoever uses `getHistory` does not change when the real history replaces it.
 */
import type {
  AcuityResult,
  AmslerResult,
  BmoEllipse,
  CaptureAttemptRecord,
  CrewId,
  CrewMember,
  Eye,
  EyeCaptureResult,
  ExamSummary,
  Quantity,
  RingMeasure,
  SessionRecord,
  SymptomAnswer,
  SymptomAnswers,
  VisionSession,
} from '../contract';
import { CREW, MISSION } from '../mission';
import { assessSession } from '../rules/assess';
import { SYMPTOM_ORDER } from '../rules/functional';

/** Written in every exam of this module: it was not produced by the analysis engine. */
export const PROVISIONAL_ENGINE_VERSION = 'provisional-history-1 (scenario tables, not measured on images)';

/**
 * Seed of the measurement error. Each value has its own stream, keyed by crew
 * member, eye, flight day and measure, so any session can be rebuilt alone.
 */
const SEED = 'provisional-history-1';

// ---------------------------------------------------------- Scenario tables
// especificaciones/01-nucleo.md, section 4. Values per eye: OD, OS.

/** Flight days of the scenario curves. */
const CURVE_DAYS = [0, 10, 30, 60, 90, 120, 150, 180] as const;

interface EyeScenario {
  /** Pre-flight thickness of the 0–250 µm ring, µm. */
  trtUm: number;
  /** Pre-flight minimum rim width, µm. */
  mrwUm: number;
  /** Area of the opening, mm². */
  bmoAreaMm2: number;
  /** Swelling E(d): change of the 0–250 µm ring at each curve day, µm. */
  swellingUm: readonly number[];
  /** Increase of the roughness of Bruch's membrane at each curve day, µm. */
  roughnessUm: readonly number[];
}

const NO_FOLDS = [0, 0, 0, 0, 0, 0, 0, 0] as const;

const SCENARIO: Readonly<Record<CrewId, Readonly<Record<Eye, EyeScenario>>>> = {
  A: {
    OD: { trtUm: 371, mrwUm: 295, bmoAreaMm2: 2.31, swellingUm: [0, 4, 6, 7, 8, 9, 9, 10], roughnessUm: NO_FOLDS },
    OS: { trtUm: 366, mrwUm: 290, bmoAreaMm2: 2.24, swellingUm: [0, 3, 4, 5, 5, 6, 6, 7], roughnessUm: NO_FOLDS },
  },
  B: {
    OD: { trtUm: 396, mrwUm: 372, bmoAreaMm2: 1.98, swellingUm: [0, 12, 15, 19, 24, 27, 31, 32], roughnessUm: NO_FOLDS },
    OS: { trtUm: 391, mrwUm: 364, bmoAreaMm2: 2.05, swellingUm: [0, 8, 10, 13, 17, 20, 23, 24], roughnessUm: NO_FOLDS },
  },
  C: {
    OD: {
      trtUm: 418,
      mrwUm: 398,
      bmoAreaMm2: 1.86,
      swellingUm: [0, 16, 27, 38, 48, 58, 66, 68],
      roughnessUm: [0, 0, 0, 1.6, 3.8, 5.6, 7.0, 7.2],
    },
    OS: {
      trtUm: 409,
      mrwUm: 386,
      bmoAreaMm2: 1.91,
      swellingUm: [0, 9, 15, 21, 27, 33, 38, 39],
      roughnessUm: [0, 0, 0, 1.0, 3.1, 4.0, 4.6, 4.8],
    },
  },
  D: {
    OD: {
      trtUm: 404,
      mrwUm: 381,
      bmoAreaMm2: 1.72,
      swellingUm: [0, 46, 118, 176, 203, 190, 168, 138],
      roughnessUm: [0, 1.5, 4.0, 8.0, 10.5, 11.8, 12.4, 11.5],
    },
    OS: {
      trtUm: 408,
      mrwUm: 377,
      bmoAreaMm2: 1.77,
      swellingUm: [0, 42, 110, 186, 214, 222, 200, 176],
      roughnessUm: [0, 1.2, 3.6, 8.6, 11.6, 14.2, 13.4, 12.2],
    },
  },
};

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

/**
 * Capture failures scripted in the scenario (especificaciones/01-nucleo.md, 5.5)
 * that fall on a past control: the first attempt is rejected and the second one is measured.
 */
const SCRIPTED_FIRST_ATTEMPT: readonly (Pick<CaptureAttemptRecord, 'rejections' | 'scanRejections' | 'usableScans'> & {
  crewId: CrewId;
  eye: Eye;
  flightDay: number;
  meanQualityDb: number | null;
})[] = [
  { crewId: 'A', eye: 'OD', flightDay: 30, rejections: ['too-few-usable-scans'], scanRejections: ['truncated'], usableScans: 9, meanQualityDb: null },
  { crewId: 'C', eye: 'OD', flightDay: 90, rejections: ['too-few-usable-scans'], scanRejections: ['low-signal'], usableScans: 0, meanQualityDb: 12.1 },
];

// ------------------------------------------------- Provisional measurement
// The values below shape the stand-in exams. They are not results of the engine.

/** Standard deviation of the simulated error of the ring of one exam, µm (specification 04, section 6). */
const RING_NOISE_SD_UM = 2.5;
/** Same for the outer rings, the rim width and the roughness. Chosen here: small against the changes shown. */
const OUTER_RING_NOISE_SD_UM = 2;
const MRW_NOISE_SD_UM = 4;
const ROUGHNESS_NOISE_SD_UM = 0.4;
/**
 * Rim width change per micrometre of ring change. In the 11-astronaut group the
 * rim width rose 35.7 µm while the ring rose 27.6 µm on flight day 150
 * (sans-evolucion-y-logica-clinica.md, A1).
 */
const MRW_PER_RING_UM = 1.3;
/** Mean exam quality: normal(30; 1.5) kept between 27 and 33 dB (specification 04, section 6). */
const QUALITY_MEAN_DB = 30;
const QUALITY_SD_DB = 1.5;
const QUALITY_RANGE_DB = [27, 33] as const;
/** Rings of the protocol, µm from the opening (sans-oct-base-tecnica.md, 1.B). */
const RINGS_UM = [
  [0, 250],
  [250, 500],
  [500, 1000],
  [1000, 1500],
] as const;
/** Thickness far from the nerve and decay length of the eye model (especificaciones/01-nucleo.md, 3.3). */
const FAR_THICKNESS_UM = 290;
const THICKNESS_DECAY_UM = 700;
/** Shape of the swelling along the distance from the opening: g(ρ) = 1.481 · exp(−ρ / 296 µm) (same document, 3.4). */
const SWELLING_GAIN = 1.481;
const SWELLING_DECAY_UM = 296;
/** Scans of the radial pattern and radii they give (two per scan). */
const TOTAL_SCANS = 48;
/** The pre-flight exam is dated this many days before launch. Invented: the scenario gives no date for it. */
const PREFLIGHT_DAYS_BEFORE_LAUNCH = 90;
const DAY_MS = 86_400_000;
/** Size of the fundus image: 1536 pixels of 0.0057 mm (sans-spectralis-datos.md, 1.2). */
const FUNDUS_SIZE_MM = 1536 * 0.0057;

// ------------------------------------------------------------ Seeded draws

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

/**
 * Monotone cubic interpolation (Fritsch and Carlson, 1980): a smooth curve
 * through the points that never overshoots between them. Holds the end values outside.
 */
export function monotoneCubic(xs: readonly number[], ys: readonly number[], x: number): number {
  const n = xs.length;
  if (x <= xs[0]!) return ys[0]!;
  if (x >= xs[n - 1]!) return ys[n - 1]!;
  const h: number[] = [];
  const delta: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(xs[i + 1]! - xs[i]!);
    delta.push((ys[i + 1]! - ys[i]!) / h[i]!);
  }
  const slope = (i: number): number => {
    if (i === 0) return delta[0]!;
    if (i === n - 1) return delta[n - 2]!;
    const d0 = delta[i - 1]!;
    const d1 = delta[i]!;
    if (d0 * d1 <= 0) return 0;
    const w1 = 2 * h[i]! + h[i - 1]!;
    const w2 = h[i]! + 2 * h[i - 1]!;
    return (w1 + w2) / (w1 / d0 + w2 / d1);
  };
  let k = 0;
  while (xs[k + 1]! <= x) k++;
  const t = (x - xs[k]!) / h[k]!;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * ys[k]! +
    (t3 - 2 * t2 + t) * h[k]! * slope(k) +
    (-2 * t3 + 3 * t2) * ys[k + 1]! +
    (t3 - t2) * h[k]! * slope(k + 1)
  );
}

// ------------------------------------------------------------------ Exams

/** True (noise-free) change of the 0–250 µm ring of the scenario on a flight day, µm. */
export function scenarioSwellingUm(crewId: CrewId, eye: Eye, flightDay: number): number {
  return monotoneCubic(CURVE_DAYS, SCENARIO[crewId][eye].swellingUm, flightDay);
}

/** True (noise-free) increase of the roughness of the scenario on a flight day, µm. */
export function scenarioRoughnessIncreaseUm(crewId: CrewId, eye: Eye, flightDay: number): number {
  return monotoneCubic(CURVE_DAYS, SCENARIO[crewId][eye].roughnessUm, flightDay);
}

function measured(value: number, decimals = 2): Quantity {
  return { value: round(value, decimals), unit: 'µm', origin: 'measured' };
}

/** Mean of exp(−ρ / decay) between two distances. */
function meanDecay(fromUm: number, toUm: number, decayUm: number): number {
  return (decayUm * (Math.exp(-fromUm / decayUm) - Math.exp(-toUm / decayUm))) / (toUm - fromUm);
}

function examId(crewId: CrewId, eye: Eye, flightDay: number): string {
  const crewIndex = CREW.findIndex((member) => member.id === crewId);
  return String(1_000_000 + crewIndex * 100_000 + (eye === 'OD' ? 0 : 10_000) + flightDay);
}

function examTimeMs(eye: Eye, flightDay: number): number {
  const launchMs = Date.parse(`${MISSION.launchDateIso}T00:00:00Z`);
  const dayMs = flightDay > 0 ? launchMs + (flightDay - 1) * DAY_MS : launchMs - PREFLIGHT_DAYS_BEFORE_LAUNCH * DAY_MS;
  // Right eye at 10:00 UTC, left eye twenty minutes later.
  return dayMs + 10 * 3_600_000 + (eye === 'OD' ? 0 : 20 * 60_000);
}

function referenceBmo(crewId: CrewId, eye: Eye, usableScans: number): BmoEllipse {
  const key = `${crewId}/${eye}/bmo`;
  const areaMm2 = SCENARIO[crewId][eye].bmoAreaMm2;
  // Taller than wide, turned up to ±12° (especificaciones/01-nucleo.md, 3.1).
  const axisRatio = 1.05 + 0.13 * uniform(`${key}/ratio`);
  const semiMinorMm = Math.sqrt(areaMm2 / (Math.PI * axisRatio));
  const rejected = Math.floor(3 * uniform(`${key}/rejected`));
  return {
    centerXMm: round(FUNDUS_SIZE_MM / 2 + 0.07 * normal(`${key}/x`), 4),
    centerYMm: round(FUNDUS_SIZE_MM / 2 + 0.07 * normal(`${key}/y`), 4),
    semiMajorMm: round(semiMinorMm * axisRatio, 4),
    semiMinorMm: round(semiMinorMm, 4),
    angleDeg: round(90 + 24 * (uniform(`${key}/angle`) - 0.5), 1),
    areaMm2,
    fitRmsUm: round(6 + 4 * uniform(`${key}/rms`), 1),
    pointsUsed: usableScans * 2 - rejected,
    pointsRejected: rejected,
  };
}

function buildExam(crew: CrewMember, eye: Eye, flightDay: number): ExamSummary {
  const key = `${crew.id}/${eye}/${flightDay}`;
  const scenario = SCENARIO[crew.id][eye];
  const swellingUm = scenarioSwellingUm(crew.id, eye, flightDay);

  const usableScans = TOTAL_SCANS - Math.floor(3 * uniform(`${key}/usable`));
  const meanQualityDb = round(
    clamp(QUALITY_MEAN_DB + QUALITY_SD_DB * normal(`${key}/quality`), QUALITY_RANGE_DB[0], QUALITY_RANGE_DB[1]),
    1,
  );

  // Ring thickness: the eye model's profile fitted to this eye's 0–250 µm ring, plus the swelling.
  const edgeExcessUm = (scenario.trtUm - FAR_THICKNESS_UM) / meanDecay(0, 250, THICKNESS_DECAY_UM);
  const rings: RingMeasure[] = RINGS_UM.map(([innerUm, outerUm], index) => {
    const anatomyUm = FAR_THICKNESS_UM + edgeExcessUm * meanDecay(innerUm, outerUm, THICKNESS_DECAY_UM);
    const share = index === 0 ? 1 : SWELLING_GAIN * meanDecay(innerUm, outerUm, SWELLING_DECAY_UM);
    const noiseUm = (index === 0 ? RING_NOISE_SD_UM : OUTER_RING_NOISE_SD_UM) * normal(`${key}/ring${index}`);
    return {
      innerUm,
      outerUm,
      thickness: measured(anatomyUm + swellingUm * share + noiseUm),
      radiiUsed: usableScans * 2,
    };
  });

  const referenceShape = referenceBmo(crew.id, eye, usableScans);
  // In-flight exams are placed with the reference shape at today's centre (same document, 6.4).
  const bmo: BmoEllipse =
    flightDay > 0
      ? {
          ...referenceShape,
          centerXMm: round(referenceShape.centerXMm + 0.012 * normal(`${key}/dx`), 4),
          centerYMm: round(referenceShape.centerYMm + 0.012 * normal(`${key}/dy`), 4),
        }
      : referenceShape;

  const baseRoughnessUm = 2 + uniform(`${crew.id}/${eye}/roughness`);
  return {
    examId: examId(crew.id, eye, flightDay),
    referenceId: examId(crew.id, eye, 0),
    patientId: crew.patientId,
    visitId: flightDay > 0 ? `FD${String(flightDay).padStart(3, '0')}` : 'PRE',
    eye,
    examTimeMs: examTimeMs(eye, flightDay),
    status: 'measured',
    rejections: [],
    quality: {
      usableScans,
      totalScans: TOTAL_SCANS,
      meanQualityDb,
      minQualityDb: round(meanQualityDb - 1.5 - uniform(`${key}/minq`), 1),
      decentrationUm: round(40 + 120 * uniform(`${key}/decentration`), 0),
      features: {},
    },
    bmo,
    bmoSource: flightDay > 0 ? 'reference-shape' : 'this-exam',
    rings,
    trtRingUm: rings[0]!.thickness,
    mrwUm: measured(scenario.mrwUm + MRW_PER_RING_UM * swellingUm + MRW_NOISE_SD_UM * normal(`${key}/mrw`)),
    // Sector values are not part of the stand-in.
    mrwSectors: [],
    bmRoughnessUm: measured(
      baseRoughnessUm +
        scenarioRoughnessIncreaseUm(crew.id, eye, flightDay) +
        ROUGHNESS_NOISE_SD_UM * normal(`${key}/roughness`),
    ),
    engineVersion: PROVISIONAL_ENGINE_VERSION,
  };
}

function buildCapture(crew: CrewMember, eye: Eye, flightDay: number): EyeCaptureResult {
  const accepted = buildExam(crew, eye, flightDay);
  const scripted = SCRIPTED_FIRST_ATTEMPT.find(
    (event) => event.crewId === crew.id && event.eye === eye && event.flightDay === flightDay,
  );
  const attempts: CaptureAttemptRecord[] = [];
  if (scripted) {
    attempts.push({
      attempt: 1,
      request: { crewId: crew.id, eye, flightDay, attempt: 1 },
      status: 'cannot-measure',
      rejections: [...scripted.rejections],
      scanRejections: [...scripted.scanRejections],
      usableScans: scripted.usableScans,
      meanQualityDb: scripted.meanQualityDb ?? accepted.quality.meanQualityDb,
    });
  }
  const attempt = attempts.length + 1;
  attempts.push({
    attempt,
    request: { crewId: crew.id, eye, flightDay, attempt },
    status: 'measured',
    rejections: [],
    scanRejections: [],
    usableScans: accepted.quality.usableScans,
    meanQualityDb: accepted.quality.meanQualityDb,
  });
  return { eye, attempts, accepted };
}

// ----------------------------------------------------------- Vision tests

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

function buildVision(crewId: CrewId, flightDay: number): VisionSession {
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

// ---------------------------------------------------------------- History

/** Simulates the calendar of one crew member with the rules, from the pre-flight session to the end of the mission. */
function simulate(crew: CrewMember): SessionRecord[] {
  const records: SessionRecord[] = [];
  let flightDay: number | null = 0;
  while (flightDay !== null && flightDay <= MISSION.durationDays) {
    const eyes = { OD: buildCapture(crew, 'OD', flightDay), OS: buildCapture(crew, 'OS', flightDay) };
    const vision = buildVision(crew.id, flightDay);
    const assessment = assessSession({ crewId: crew.id, flightDay, eyes, vision, history: records });
    records.push({ crewId: crew.id, flightDay, origin: 'precomputed', eyes, vision, assessment, questions: [] });
    const next: number | null = assessment.nextOct?.flightDay ?? null;
    // Each assessment decides the next control. A date that does not advance would never end.
    flightDay = next !== null && next > flightDay ? next : null;
  }
  return records;
}

/**
 * PROVISIONAL. The sessions of a crew member before a flight day, oldest first,
 * including the pre-flight session (flight day 0). Every record is `precomputed`.
 */
export function getHistory(crewId: CrewId, beforeFlightDay: number): SessionRecord[] {
  const crew = CREW.find((member) => member.id === crewId);
  if (!crew) throw new Error(`Unknown crew member: ${String(crewId)}`);
  return simulate(crew).filter((record) => record.flightDay < beforeFlightDay);
}
