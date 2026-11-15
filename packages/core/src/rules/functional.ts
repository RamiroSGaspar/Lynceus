/**
 * What the vision tests and the questionnaire add to a session (specification 04,
 * section 4.2). Everything here is an assumption of this project, except what
 * counts as a positive Amsler grid, which is NASA's: any wavy, blurred or missing
 * line (pruebas-de-vision-en-pantalla.md, 1.B).
 */
import type {
  AcuityComparison,
  AcuityResult,
  AmslerResult,
  AmslerSummary,
  Eye,
  FindingId,
  FunctionalAssessment,
  Quantity,
  SymptomId,
  VisionSession,
} from '../contract';
import { cleanDifference } from './probability';
import {
  ACUITY_REAL_CHANGE_LOGMAR,
  ACUITY_RETEST_LIMIT_LOGMAR,
  ACUITY_RETEST_MIN_TRIALS,
  AMSLER_EXTENSIVE_FRACTION,
} from './thresholds';

/** Every symptom of the questionnaire, in the order it asks them. */
export const SYMPTOM_ORDER: readonly SymptomId[] = [
  'sudden-vision-loss',
  'new-dark-spot',
  'near-vision',
  'intermediate-vision',
  'distance-vision',
  'distortion',
  'low-light-vision',
  'fluctuating-vision',
  'depth-perception',
  'double-vision',
  'transient-vision-loss',
  'headache',
  'tinnitus',
  'nausea',
  'difficulty-thinking',
];

/** Present at any grade: acute visual symptom, contact now. */
export const ACUTE_SYMPTOMS: readonly SymptomId[] = ['sudden-vision-loss', 'new-dark-spot'];

/** Present at any grade: the flight surgeon should know without delay. */
export const PROMPT_SYMPTOMS: readonly SymptomId[] = ['distortion', 'double-vision', 'transient-vision-loss'];

/** The questionnaire's changes in vision. A severe grade in any of them cannot wait for the routine report. */
export const VISION_SYMPTOMS: readonly SymptomId[] = [
  'near-vision',
  'intermediate-vision',
  'distance-vision',
  'distortion',
  'low-light-vision',
  'fluctuating-vision',
  'depth-perception',
  'double-vision',
  'transient-vision-loss',
];

export interface FunctionalResult {
  digest: FunctionalAssessment;
  /** Findings of table 4.2, most urgent first. */
  findings: FindingId[];
  /** A finding that makes the session an acute visual symptom. */
  acute: boolean;
  /** A finding the flight surgeon should hear about without waiting for the routine report. */
  withoutDelay: boolean;
  /** Near vision got worse: suggest the stronger glasses. */
  nearVisionWorse: boolean;
}

const EYES: readonly Eye[] = ['OD', 'OS'];

function compareAcuity(today: AcuityResult | null, baseline: AcuityResult | null): AcuityComparison | null {
  if (!today || today.logMar === null) return null;
  const logMar: Quantity = { value: today.logMar, unit: 'logMAR', origin: 'self-reported' };
  if (!baseline || baseline.logMar === null) {
    return {
      logMar,
      baselineLogMar: null,
      change: null,
      atScreenFloor: today.atScreenFloor,
      sameCorrection: true,
      worse: false,
    };
  }
  const value = cleanDifference(today.logMar, baseline.logMar);
  const change: Quantity = { value, unit: 'logMAR', origin: 'derived' };
  // The published variation is for tests of 18 trials or more; with fewer, no range can be supported.
  if (today.trials >= ACUITY_RETEST_MIN_TRIALS && baseline.trials >= ACUITY_RETEST_MIN_TRIALS) {
    change.interval95 = [
      cleanDifference(value, ACUITY_RETEST_LIMIT_LOGMAR),
      cleanDifference(value, -ACUITY_RETEST_LIMIT_LOGMAR),
    ];
    change.sources = ['bach2025'];
  }
  return {
    logMar,
    baselineLogMar: { value: baseline.logMar, unit: 'logMAR', origin: 'self-reported' },
    change,
    atScreenFloor: today.atScreenFloor,
    sameCorrection: today.withCorrection === baseline.withCorrection,
    // A result limited by the screen says what the screen can draw, not what the eye sees.
    worse: value >= ACUITY_REAL_CHANGE_LOGMAR && !today.atScreenFloor,
  };
}

function summarizeAmsler(result: AmslerResult | null): AmslerSummary | null {
  if (!result) return null;
  return {
    marked: result.marks.length > 0 || result.markedFraction > 0,
    markedFraction: result.markedFraction,
    centralMarked: result.centralMarked,
    extensive: result.markedFraction >= AMSLER_EXTENSIVE_FRACTION,
  };
}

/** Applies table 4.2 to the functional part of a session. `baseline` is the pre-flight one. */
export function assessFunctional(vision: VisionSession | null, baseline: VisionSession | null): FunctionalResult {
  const answers = vision?.symptoms?.answers;
  const symptoms: FunctionalAssessment['symptoms'] = [];
  if (answers) {
    for (const id of SYMPTOM_ORDER) {
      const answer = answers[id];
      if (answer?.present) symptoms.push({ id, severity: answer.severity ?? null, eye: answer.eye ?? null });
    }
  }
  const digest: FunctionalAssessment = {
    done: {
      symptoms: Boolean(vision?.symptoms),
      acuity: Boolean(vision && (vision.acuity.OD || vision.acuity.OS)),
      amsler: Boolean(vision && (vision.amsler.OD || vision.amsler.OS)),
    },
    acuity: {
      OD: compareAcuity(vision?.acuity.OD ?? null, baseline?.acuity.OD ?? null),
      OS: compareAcuity(vision?.acuity.OS ?? null, baseline?.acuity.OS ?? null),
    },
    amsler: {
      OD: summarizeAmsler(vision?.amsler.OD ?? null),
      OS: summarizeAmsler(vision?.amsler.OS ?? null),
    },
    symptoms,
  };

  const present = (id: SymptomId) => symptoms.some((symptom) => symptom.id === id);
  const severe = (ids: readonly SymptomId[]) =>
    symptoms.some((symptom) => ids.includes(symptom.id) && symptom.severity === 'severe');
  const amsler = EYES.map((eye) => digest.amsler[eye]).filter((summary) => summary !== null);
  const amslerAcute = amsler.some((summary) => summary.marked && (summary.centralMarked || summary.extensive));
  const amslerOther = amsler.some((summary) => summary.marked && !summary.centralMarked && !summary.extensive);

  const symptomAcute = ACUTE_SYMPTOMS.some(present);
  const symptomOther = PROMPT_SYMPTOMS.some(present) || severe(VISION_SYMPTOMS);
  const acuityWorse = EYES.some((eye) => digest.acuity[eye]?.worse === true);
  const nearBlur = present('near-vision');
  const headache = present('headache');

  const findings: FindingId[] = [];
  if (symptomAcute) findings.push('symptom-acute');
  if (amslerAcute) findings.push('amsler-marked-central');
  if (amslerOther) findings.push('amsler-marked');
  if (symptomOther) findings.push('symptom-other');
  if (acuityWorse) findings.push('near-vision-worse');
  if (nearBlur) findings.push('symptom-near-blur');
  if (headache) findings.push('symptom-headache');

  return {
    digest,
    findings,
    acute: symptomAcute || amslerAcute,
    withoutDelay: amslerOther || symptomOther || severe(['headache']),
    nearVisionWorse: acuityWorse || nearBlur,
  };
}
