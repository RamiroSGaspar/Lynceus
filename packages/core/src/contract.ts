/**
 * Public contract of the core library.
 *
 * The web application, the validation scripts and the tests are written against
 * these types. The core owner may add optional fields; renaming or removing
 * anything here needs the coordinator's agreement, because other people are
 * building on it in parallel.
 *
 * Units are part of the name whenever a number is not dimensionless.
 * Coordinates: en-face positions are millimetres in the frame of the fundus
 * (SLO) image, x to the right and y downwards, origin at its top-left corner.
 * Inside a B-scan, columns run from the scan start to its end and rows run from
 * the vitreous (row 0) into the eye.
 */
import type { Locale } from './product';

// ---------------------------------------------------------------- Identity

export type Eye = 'OD' | 'OS';
export type CrewId = 'A' | 'B' | 'C' | 'D';
export type LocalizedText = Readonly<Record<Locale, string>>;

/** A fictional crew member. Names and histories are invented. */
export interface CrewMember {
  id: CrewId;
  name: string;
  role: LocalizedText;
  ageYears: number;
  sex: 'F' | 'M';
  /** Written to the exam files. Always starts with `SIM-` to mark simulated data. */
  patientId: string;
}

export interface Mission {
  name: string;
  durationDays: number;
  /** ISO date of flight day 1. */
  launchDateIso: string;
  /** Flight days of NASA's routine in-flight calendar for this mission length. */
  routineControlDays: readonly number[];
}

// ------------------------------------------------------------- Provenance

/** How a value was obtained. Shown next to every number the astronaut sees. */
export type Origin =
  | 'measured' // computed by the engine from the image
  | 'derived' // arithmetic on measured values, e.g. change from baseline
  | 'estimated' // statistical estimate, e.g. a probability or an expected error
  | 'self-reported' // answered or performed by the astronaut
  | 'reference' // published constant: a threshold, a normal variation
  | 'not-measurable'; // cannot be obtained on board

export type Unit = 'µm' | 'mm' | 'mm²' | 'mm³' | 'dB' | '%' | 'px' | 'logMAR' | 'D' | 'days' | '';

export interface Quantity {
  value: number;
  unit: Unit;
  origin: Origin;
  /** Standard error of the value, same unit. Absent until the engine has been validated for it. */
  standardError?: number;
  /** 95 % interval. Absent when it cannot be supported. */
  interval95?: readonly [number, number];
  /** Ids of the published sources behind the method or the constant (see `sources.ts`). */
  sources?: readonly string[];
}

// ------------------------------------------------------- Exam file (.vol)

/** Header of a Heidelberg `.vol` export. Field meanings: research doc `sans-spectralis-datos.md`, section 1.2. */
export interface VolHeader {
  version: string;
  sizeX: number;
  numBScans: number;
  sizeZ: number;
  scaleXMm: number;
  distanceMm: number;
  scaleZMm: number;
  sizeXSlo: number;
  sizeYSlo: number;
  scaleXSloMm: number;
  scaleYSloMm: number;
  fieldSizeSloDeg: number;
  scanFocusD: number;
  scanPosition: Eye;
  /** Exam time as Unix milliseconds. Stored in the file as 100-ns ticks since 1601-01-01. */
  examTimeMs: number;
  /** 5 = radial (star) pattern. */
  scanPattern: number;
  bscanHdrSize: number;
  id: string;
  /** Id of the reference (pre-flight) exam; equal to `id` in the reference exam itself. */
  referenceId: string;
  pid: number;
  patientId: string;
  /** Days since 1899-12-30 (25569 = 1970-01-01), as stored in the file. */
  dobDays: number;
  vid: number;
  visitId: string;
  visitDateDays: number;
  gridType: number;
  gridOffset: number;
  gridType1: number;
  gridOffset1: number;
  /** Shared by every exam of the same follow-up series. */
  progId: string;
}

export interface BScanHeader {
  version: string;
  bscanHdrSize: number;
  startXMm: number;
  startYMm: number;
  endXMm: number;
  endYMm: number;
  numSeg: number;
  offSeg: number;
  /** Quality index written by the instrument, 0 to 40 dB. */
  qualityDb: number;
  shift: number;
  ivTrafo: readonly number[];
}

export interface BScan {
  index: number;
  header: BScanHeader;
  /** `numSeg` layer lines of `sizeX` values each (row in pixels, with decimals); `INVALID_VALUE` where absent. */
  segLines: Float32Array[];
  /** `sizeZ × sizeX` linear reflectivity values between 0 and 1, row-major, exactly as stored. */
  pixels: Float32Array;
}

/**
 * An exam read lazily, block by block. Both a parsed `.vol` file and the virtual
 * instrument implement it, so a 78 MB exam never has to be held in memory at once.
 */
export interface ExamSource {
  readonly header: VolHeader;
  /** `sizeYSlo × sizeXSlo` grey levels, row-major. */
  readonly slo: Uint8Array;
  bscan(index: number): BScan;
}

// ------------------------------------------------------------ Acquisition

/** What can go wrong while capturing. Everything absent means a clean capture. */
export interface CaptureConditions {
  /** Signal lost before reaching the detector (dry eye, defocus, media), in dB. */
  signalLossDb?: number;
  /** Eyelid or blink: a band of columns without signal, as fractions of the scan width. */
  blink?: { startFraction: number; widthFraction: number };
  /** Retina pushed out of the top of the frame by this many pixels. */
  truncationPx?: number;
  /** Scan pattern centre away from where the reference exam placed it. */
  decentrationMm?: { x: number; y: number };
  /** Eye movement during averaging, 0 (none) to 1 (severe). */
  motion?: number;
  /** Signal fading at one end of the scan. */
  edgeFade?: { side: 'start' | 'end'; widthFraction: number };
  /**
   * B-scans hit by `blink`, `motion` and `edgeFade` (inclusive indices). A blink lasts a
   * moment, so it spoils consecutive scans, not the whole exam. Absent means every scan.
   */
  affectedScans?: { from: number; to: number };
}

export interface CaptureRequest {
  crewId: CrewId;
  eye: Eye;
  /** 0 is the pre-flight reference exam. */
  flightDay: number;
  /** 1-based. Each attempt is a different capture of the same eye on the same day. */
  attempt: number;
  /** When absent, the conditions of the attempt are drawn from its seed. */
  conditions?: CaptureConditions;
}

// ----------------------------------------------------------------- Engine

export type ScanRejection =
  | 'low-signal'
  | 'signal-dropout'
  | 'truncated'
  | 'surface-not-found'
  | 'bmo-not-found'
  | 'motion';

export type ExamRejection =
  | 'too-few-usable-scans'
  | 'bmo-fit-failed'
  | 'bmo-mismatch-with-baseline'
  | 'insufficient-ring-coverage'
  | 'decentered';

/** One end of Bruch's membrane in one B-scan. */
export interface BmoPoint {
  columnPx: number;
  rowPx: number;
  xMm: number;
  yMm: number;
  /** 0 to 1: how clearly the membrane ends there. */
  confidence: number;
}

export interface ScanAnalysis {
  index: number;
  /** Quality recomputed by the engine from the pixels. */
  qualityDb: number;
  /** Quality stated in the file. */
  headerQualityDb: number;
  /** Fraction of columns where both boundaries were found. */
  validColumnFraction: number;
  usable: boolean;
  rejections: ScanRejection[];
  /** Inner limiting membrane: row per column, pixels with decimals, NaN where not found. */
  ilmPx: Float32Array;
  /** Bruch's membrane: same convention. NaN inside the opening. */
  bmPx: Float32Array;
  /** The two ends of Bruch's membrane, in scan order; null where not found. */
  bmo: readonly [BmoPoint | null, BmoPoint | null];
}

export interface BmoEllipse {
  centerXMm: number;
  centerYMm: number;
  semiMajorMm: number;
  semiMinorMm: number;
  /** Orientation of the major axis, degrees from the x axis. */
  angleDeg: number;
  areaMm2: number;
  /** Root mean square distance of the points used to the ellipse. */
  fitRmsUm: number;
  pointsUsed: number;
  pointsRejected: number;
}

/** Garway-Heath sectors: temporal, temporal-superior, nasal-superior, nasal, nasal-inferior, temporal-inferior. */
export type Sector = 'T' | 'TS' | 'NS' | 'N' | 'NI' | 'TI';

export interface RingMeasure {
  /** Distance from the opening, micrometres. */
  innerUm: number;
  outerUm: number;
  thickness: Quantity;
  /** How many of the 96 radii contributed. */
  radiiUsed: number;
}

export interface ExamQuality {
  usableScans: number;
  totalScans: number;
  meanQualityDb: number;
  minQualityDb: number;
  /** Distance between the pattern centre and the opening centre. */
  decentrationUm: number;
  /** Features the quality model reads. Names are stable; the list may grow. */
  features: Readonly<Record<string, number>>;
}

export interface ExamAnalysis {
  examId: string;
  referenceId: string;
  patientId: string;
  visitId: string;
  eye: Eye;
  examTimeMs: number;
  /** `cannot-measure` means the measures below are null and `rejections` says why. */
  status: 'measured' | 'cannot-measure';
  rejections: ExamRejection[];
  quality: ExamQuality;
  bmo: BmoEllipse | null;
  /** Whether rings were placed with this exam's opening or with the reference exam's shape. */
  bmoSource: 'this-exam' | 'reference-shape';
  /** 0–250, 250–500, 500–1000 and 1000–1500 µm from the opening. */
  rings: RingMeasure[];
  /** Total retinal thickness in the 0–250 µm ring: NASA's main measure of optic disc swelling. */
  trtRingUm: Quantity | null;
  /** Minimum rim width, mean of all opening points. */
  mrwUm: Quantity | null;
  mrwSectors: { sector: Sector; value: Quantity }[];
  /** Roughness of Bruch's membrane (folds): RMS height after removing tilt and curvature. */
  bmRoughnessUm: Quantity | null;
  /** Per-scan detail. Heavy: drop it with `summarize` before storing. */
  scans: ScanAnalysis[];
  engineVersion: string;
}

/** What is kept of an exam after analysis: everything except the per-scan arrays. */
export type ExamSummary = Omit<ExamAnalysis, 'scans'>;

export interface ChangeFromBaseline {
  eye: Eye;
  baselineExamId: string;
  examId: string;
  trtRingUm: Quantity;
  rings: Quantity[];
  mrwUm: Quantity;
  bmRoughnessUm: Quantity;
  /** Change of the opening area. The opening is anatomy that should not move: a large value flags a registration problem. */
  bmoAreaChangePct: number;
}

export interface AnalysisProgress {
  step: 'read' | 'quality' | 'segment' | 'bmo' | 'fit' | 'measure' | 'done';
  scanIndex?: number;
  scansTotal?: number;
}

// --------------------------------------------- Rules (provisional, stage C)

export type Level =
  | 'no-detectable-change'
  | 'first-sign'
  | 'clinically-concerning'
  | 'acute-visual-symptom';

/** NASA display convention: advisory (blue), caution (yellow), warning (red). */
export type AlertClass = 'none' | 'advisory' | 'caution' | 'warning';

export type LikelihoodWord = 'unlikely' | 'possible' | 'likely' | 'very-likely';

export interface ThresholdAssessment {
  thresholdId: 'trt-first-sign' | 'trt-clinically-concerning' | 'folds-new';
  threshold: Quantity;
  /** Decision on the measured value, as NASA's criterion is written. */
  exceeded: boolean;
  /** Probability that the true change is beyond the threshold, given the engine's validated error. */
  probabilityExceeded: number;
  word: LikelihoodWord;
}

// ----------------------------------------------------- Capture attempts

/** What happened with one capture attempt of one eye. */
export interface CaptureAttemptRecord {
  attempt: number;
  request: CaptureRequest;
  status: 'measured' | 'cannot-measure';
  rejections: ExamRejection[];
  /** Reasons given by individual scans, most frequent first. */
  scanRejections: ScanRejection[];
  usableScans: number;
  meanQualityDb: number;
}

/** Outcome of imaging one eye in one session: up to three attempts. */
export interface EyeCaptureResult {
  eye: Eye;
  attempts: CaptureAttemptRecord[];
  /** The accepted exam, or null when no attempt could be measured. */
  accepted: ExamSummary | null;
}

// ----------------------------------------------------------- Vision tests

/** How the screen was calibrated, so sizes on screen are true sizes. */
export interface ScreenCalibration {
  /** Device pixels per millimetre, from the card-matching step. */
  pxPerMm: number;
  viewingDistanceCm: number;
  /** Smallest logMAR this screen can draw with a stroke of at least one pixel at that distance. */
  floorLogMar: number;
}

export interface AcuityResult {
  eye: Eye;
  /** Near visual acuity. Lower is better; 0.0 is 20/20. Null when the test could not converge. */
  logMar: number | null;
  /** True when the result is limited by the screen (`floorLogMar`) and not by the eye. */
  atScreenFloor: boolean;
  trials: number;
  correct: number;
  /** Whether the astronaut wore their usual near correction. */
  withCorrection: boolean;
}

export type AmslerMarkKind = 'wavy' | 'blurred' | 'missing';

export interface AmslerResult {
  eye: Eye;
  /** Squares per side. */
  gridSize: number;
  /** Visual angle of one square at the test distance, degrees. */
  cellDeg: number;
  marks: { col: number; row: number; kind: AmslerMarkKind }[];
  /** Fraction of the grid that was marked, 0 to 1. */
  markedFraction: number;
  /** Any mark within the central 2 degrees around the fixation dot. */
  centralMarked: boolean;
  /** The astronaut confirmed seeing the four corners while fixating. */
  cornersSeen: boolean;
}

/**
 * The topics follow what NASA's in-flight eye questionnaire asks, as described in
 * its 2017 evidence report (the form itself is not public; research doc
 * `pruebas-de-vision-en-pantalla.md`, section 6.1). The wording is ours.
 */
export type SymptomId =
  // Changes in vision
  | 'near-vision'
  | 'intermediate-vision'
  | 'distance-vision'
  | 'distortion'
  | 'low-light-vision'
  | 'fluctuating-vision'
  | 'depth-perception'
  | 'double-vision'
  | 'transient-vision-loss'
  // Asked apart because they cannot wait for a routine report (assumption of this project)
  | 'sudden-vision-loss'
  | 'new-dark-spot'
  // Other symptoms the questionnaire records, without claiming a link to the eye findings
  | 'headache'
  | 'tinnitus'
  | 'nausea'
  | 'difficulty-thinking';

/** NASA's three grades: mild does not affect activities; moderate needed adapting; severe affected or prevented activities. */
export type SymptomSeverity = 'mild' | 'moderate' | 'severe';

export interface SymptomAnswer {
  present: boolean;
  severity?: SymptomSeverity;
  /** Which eye, when it applies. */
  eye?: Eye | 'both';
}

export interface SymptomAnswers {
  /** NASA's opening question: any change in vision since launch or since the last exam. */
  changeNoticed: boolean;
  answers: Readonly<Record<SymptomId, SymptomAnswer>>;
  glasses: 'none' | 'reading' | 'bifocal' | 'progressive' | 'adjustable';
}

/** The functional part of a session. Every part is optional: a skipped test is recorded as not done. */
export interface VisionSession {
  calibration: ScreenCalibration | null;
  acuity: { OD: AcuityResult | null; OS: AcuityResult | null };
  amsler: { OD: AmslerResult | null; OS: AmslerResult | null };
  symptoms: SymptomAnswers | null;
}

// ------------------------------------------------------------ Assessment

export type FindingId =
  | 'swelling-first-sign'
  | 'swelling-clinically-concerning'
  | 'folds-new'
  | 'eye-not-measured'
  | 'near-vision-worse'
  | 'amsler-marked'
  | 'amsler-marked-central'
  | 'symptom-acute'
  | 'symptom-near-blur'
  | 'symptom-headache'
  | 'symptom-other';

export interface EyeAssessment {
  eye: Eye;
  /** False when no attempt could be measured: `level` is then null. */
  measured: boolean;
  level: Level | null;
  alert: AlertClass;
  change: ChangeFromBaseline | null;
  thresholds: ThresholdAssessment[];
  /** A threshold has between 10 % and 90 % probability of having been crossed. */
  borderline: boolean;
  /** Change since the previous control of this eye, when there is one. */
  sincePrevious: { flightDay: number; trtRingUm: Quantity } | null;
  findings: FindingId[];
}

export type ContactUrgency = 'routine-report' | 'without-delay' | 'now';

export type NextStepId =
  | 'oct-routine'
  | 'oct-in-4-weeks'
  | 'oct-in-3-weeks'
  | 'oct-repeat-soon'
  | 'amsler-at-controls'
  | 'amsler-twice-a-week'
  | 'amsler-three-times-a-week'
  | 'report-routine'
  | 'notify-surgeon-without-delay'
  | 'contact-surgeon-now'
  | 'try-stronger-glasses'
  | 'post-flight-exams';

export interface NextStep {
  id: NextStepId;
  /** Values the text needs, e.g. `{ flightDay: 118 }`. */
  params: Readonly<Record<string, number | string>>;
  /** Whether the step is NASA practice or an assumption of this project. */
  basis: 'nasa' | 'assumption';
  sources: readonly string[];
}

export type LimitationId =
  | 'not-a-diagnosis'
  | 'simulated-data'
  | 'not-validated-on-people'
  | 'no-choroid'
  | 'no-macula'
  | 'no-globe-flattening'
  | 'no-refraction'
  | 'no-intracranial-pressure'
  | 'ground-confirms';

export interface SessionAssessment {
  crewId: CrewId;
  flightDay: number;
  eyes: { OD: EyeAssessment; OS: EyeAssessment };
  /** Highest level of both eyes, or `acute-visual-symptom` when the functional tests demand it. */
  level: Level;
  alert: AlertClass;
  findings: FindingId[];
  contact: ContactUrgency;
  /** Flight day of the next tomography, or null when the mission ends before it. */
  nextOct: {
    flightDay: number;
    reason: 'routine' | 'first-sign' | 'clinically-concerning' | 'not-measured';
  } | null;
  amslerPerWeek: number;
  nextSteps: NextStep[];
  limitations: LimitationId[];
  rulesVersion: string;
}

/** One past or present control of one crew member, as stored and shown in the history. */
export interface SessionRecord {
  crewId: CrewId;
  flightDay: number;
  /** `precomputed` sessions come with the application; `live` ones were done in this browser. */
  origin: 'precomputed' | 'live';
  eyes: { OD: EyeCaptureResult; OS: EyeCaptureResult };
  vision: VisionSession | null;
  assessment: SessionAssessment;
  /** Questions the astronaut wrote for the flight surgeon. */
  questions: string[];
}
