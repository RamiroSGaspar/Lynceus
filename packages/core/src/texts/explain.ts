/**
 * From an assessment to the words the astronaut reads. Fixed templates: the same
 * assessment always gives the same text, in English and in Spanish with the same
 * structure. This module decides which sentences a result gets; `en.ts` and
 * `es.ts` say how each one reads.
 */
import type {
  Eye,
  EyeAssessment,
  FindingId,
  FunctionalAssessment,
  LimitationId,
  NextStep,
  NextStepId,
  Quantity,
  SessionAssessment,
  ThresholdAssessment,
} from '../contract';
import type { Locale } from '../product';
import { isProvisionalErrorModel } from '../rules/errorModel';
import { ACUTE_SYMPTOMS, PROMPT_SYMPTOMS, VISION_SYMPTOMS } from '../rules/functional';
import { levelRank } from '../rules/levels';
import {
  ACUITY_REAL_CHANGE_LOGMAR,
  AMSLER_EXTENSIVE_FRACTION,
  BM_ROUGHNESS_FOLDS_UM,
  TRT_CLINICALLY_CONCERNING_UM,
  TRT_FIRST_SIGN_UM,
} from '../rules/thresholds';
import { EN } from './en';
import { ES } from './es';
import { capitalize, decimalsFor, formatNumber, NBSP, percentText, signedText } from './format';
import type {
  AcuityWorse,
  AcuteCause,
  AmslerMarks,
  ChangeText,
  EyeSet,
  FindingText,
  FunctionalTest,
  Phrases,
  PromptCause,
  Relation,
  ReportedSymptom,
  StepValues,
} from './phrases';

export interface Explanation {
  /** One sentence: the result of the session. */
  headline: string;
  /** Two to four sentences. */
  summary: string[];
  eyes: Record<Eye, { headline: string; lines: string[] }>;
  nextSteps: { id: NextStepId; text: string; why: string; basis: 'nasa' | 'assumption' }[];
  limitations: { id: LimitationId; text: string }[];
  /** One sentence per finding of the session, in the order of `assessment.findings`. */
  findings: { id: FindingId; text: string }[];
}

const PHRASES: Readonly<Record<Locale, Phrases>> = { en: EN, es: ES };
const EYES: readonly Eye[] = ['OD', 'OS'];
const MAX_SUMMARY_SENTENCES = 4;

/** Findings that come from the vision tests and the questionnaire, most urgent first. */
const FUNCTIONAL_FINDINGS: readonly FindingId[] = [
  'symptom-acute',
  'amsler-marked-central',
  'amsler-marked',
  'symptom-other',
  'near-vision-worse',
  'symptom-near-blur',
  'symptom-headache',
];
const ACUTE_FINDINGS: readonly FindingId[] = ['symptom-acute', 'amsler-marked-central'];

// ------------------------------------------------------------ Formatting

/** A published value with the decimals it is written with: 19.4, 55, 2.8, 0.2. */
function exact(value: number, unit: string, locale: Locale): string {
  const text = String(value);
  return `${locale === 'es' ? text.replace('.', ',') : text}${NBSP}${unit}`;
}

/** A change and its range, with the fewest decimals that keep it on the right side of the limits. */
function changeText(quantity: Quantity, limits: readonly number[], minimumDecimals: number, locale: Locale): ChangeText {
  const decimals = decimalsFor(quantity.value, limits, minimumDecimals);
  return {
    value: signedText(quantity.value, decimals, locale),
    range: quantity.interval95
      ? [signedText(quantity.interval95[0], decimals, locale), signedText(quantity.interval95[1], decimals, locale)]
      : null,
  };
}

function eyeSet(eyes: readonly Eye[]): EyeSet {
  return eyes.length === 1 ? eyes[0]! : 'both';
}

function sentence(clause: string): string {
  return `${capitalize(clause)}.`;
}

// --------------------------------------------------------------- Details

function findThreshold(eye: EyeAssessment, id: ThresholdAssessment['thresholdId']): ThresholdAssessment | undefined {
  return eye.thresholds.find((threshold) => threshold.thresholdId === id);
}

/** A threshold has between 10 % and 90 % probability of having been passed: the next control will tell. */
function isUncertain(threshold: ThresholdAssessment | undefined): boolean {
  return threshold?.word === 'possible' || threshold?.word === 'likely';
}

function relationOf(eye: EyeAssessment): Relation {
  if (findThreshold(eye, 'trt-clinically-concerning')?.exceeded) return 'at-or-above-concerning';
  const firstSign = findThreshold(eye, 'trt-first-sign');
  if (firstSign?.exceeded) return 'above-first-sign';
  // Exactly the threshold does not pass it, and is not below it either.
  if (firstSign && eye.change?.trtRingUm.value === firstSign.threshold.value) return 'at-first-sign';
  return 'below-first-sign';
}

function isBelowFirstSign(relation: Relation): boolean {
  return relation === 'below-first-sign' || relation === 'at-first-sign';
}

function amslerMarks(functional: FunctionalAssessment | undefined, which: 'acute' | 'other', locale: Locale): AmslerMarks[] {
  const marks: AmslerMarks[] = [];
  if (!functional) return marks;
  for (const eye of EYES) {
    const summary = functional.amsler[eye];
    if (!summary?.marked) continue;
    const where = summary.centralMarked ? 'centre' : summary.extensive ? 'extensive' : 'elsewhere';
    if ((where === 'elsewhere') !== (which === 'other')) continue;
    const percent = summary.markedFraction * 100;
    const decimals = decimalsFor(percent, [AMSLER_EXTENSIVE_FRACTION * 100], 1);
    marks.push({ eye, where, fraction: `${formatNumber(percent, decimals, locale)}${NBSP}%` });
  }
  return marks;
}

function symptomsIn(functional: FunctionalAssessment | undefined, keep: (symptom: ReportedSymptom) => boolean): ReportedSymptom[] {
  return (functional?.symptoms ?? []).filter(keep);
}

function acuityWorse(functional: FunctionalAssessment | undefined, locale: Locale): AcuityWorse[] {
  const eyes: AcuityWorse[] = [];
  if (!functional) return eyes;
  for (const eye of EYES) {
    const comparison = functional.acuity[eye];
    if (!comparison?.worse || !comparison.change) continue;
    eyes.push({
      eye,
      change: changeText(comparison.change, [ACUITY_REAL_CHANGE_LOGMAR], 2, locale),
      sameCorrection: comparison.sameCorrection,
    });
  }
  return eyes;
}

function acuteCauses(assessment: SessionAssessment, locale: Locale): AcuteCause[] {
  const causes: AcuteCause[] = [];
  if (assessment.findings.includes('symptom-acute')) {
    for (const symptom of symptomsIn(assessment.functional, (s) => ACUTE_SYMPTOMS.includes(s.id))) {
      causes.push({ kind: 'symptom', id: symptom.id, eye: symptom.eye });
    }
  }
  if (assessment.findings.includes('amsler-marked-central')) {
    for (const mark of amslerMarks(assessment.functional, 'acute', locale)) {
      causes.push({ kind: mark.where === 'centre' ? 'amsler-central' : 'amsler-extensive', eye: mark.eye, fraction: mark.fraction });
    }
  }
  return causes.length > 0 ? causes : [{ kind: 'unspecified' }];
}

function promptCauses(assessment: SessionAssessment, locale: Locale): PromptCause[] {
  const causes: PromptCause[] = [];
  const concerning = EYES.filter((eye) => assessment.eyes[eye].level === 'clinically-concerning');
  if (concerning.length > 0) causes.push({ kind: 'concerning', eyes: eyeSet(concerning) });
  const marks = amslerMarks(assessment.functional, 'other', locale);
  if (marks.length > 0) causes.push({ kind: 'amsler', marks });
  const prompt = symptomsIn(assessment.functional, (s) => PROMPT_SYMPTOMS.includes(s.id));
  if (prompt.length > 0) causes.push({ kind: 'symptoms', symptoms: prompt });
  const affected = symptomsIn(
    assessment.functional,
    (s) => VISION_SYMPTOMS.includes(s.id) && !PROMPT_SYMPTOMS.includes(s.id) && s.severity === 'severe',
  );
  if (affected.length > 0) causes.push({ kind: 'activities-affected', symptoms: affected });
  if (symptomsIn(assessment.functional, (s) => s.id === 'headache' && s.severity === 'severe').length > 0) {
    causes.push({ kind: 'headache-activities-affected' });
  }
  return causes;
}

function findingText(id: FindingId, assessment: SessionAssessment, locale: Locale): FindingText {
  const { functional } = assessment;
  switch (id) {
    case 'swelling-clinically-concerning':
    case 'swelling-first-sign':
    case 'folds-new':
    case 'eye-not-measured':
      return { id, eyes: eyeSet(EYES.filter((eye) => assessment.eyes[eye].findings.includes(id))) };
    case 'symptom-acute':
      return { id, symptoms: symptomsIn(functional, (s) => ACUTE_SYMPTOMS.includes(s.id)) };
    case 'amsler-marked-central':
      return { id, marks: amslerMarks(functional, 'acute', locale) };
    case 'amsler-marked':
      return { id, marks: amslerMarks(functional, 'other', locale) };
    case 'symptom-other':
      return {
        id,
        symptoms: symptomsIn(
          functional,
          (s) => PROMPT_SYMPTOMS.includes(s.id) || (VISION_SYMPTOMS.includes(s.id) && s.severity === 'severe'),
        ),
      };
    case 'near-vision-worse':
      return { id, eyes: acuityWorse(functional, locale), limit: exact(ACUITY_REAL_CHANGE_LOGMAR, 'logMAR', locale) };
    case 'symptom-near-blur':
    case 'symptom-headache':
      return { id };
  }
}

// ------------------------------------------------------------------ Eyes

function explainEye(
  eye: EyeAssessment,
  isReference: boolean,
  p: Phrases,
  locale: Locale,
): { headline: string; lines: string[] } {
  if (!eye.measured) {
    // Two reasons at most: the ones that say the most come first.
    const reasons = (eye.notMeasuredReasons ?? []).slice(0, 2).map((reason) => p.eyeNotMeasuredReason(reason));
    return { headline: p.eyeHeadline(eye.eye, 'not-measured'), lines: [...reasons, p.eyeNoResult()] };
  }
  if (isReference || !eye.change) {
    return { headline: p.eyeHeadline(eye.eye, 'reference'), lines: [p.eyeReference()] };
  }

  const firstSign = findThreshold(eye, 'trt-first-sign');
  const concerning = findThreshold(eye, 'trt-clinically-concerning');
  const folds = findThreshold(eye, 'folds-new');
  const firstSignText = exact(firstSign?.threshold.value ?? TRT_FIRST_SIGN_UM, 'µm', locale);
  const concerningText = exact(concerning?.threshold.value ?? TRT_CLINICALLY_CONCERNING_UM, 'µm', locale);
  const relation = relationOf(eye);
  const likelihood = (threshold: ThresholdAssessment) =>
    p.likelihood(threshold.word, percentText(threshold.probabilityExceeded, threshold.word, locale));

  const lines = [
    p.eyeThickness(eye.eye, changeText(eye.change.trtRingUm, [TRT_FIRST_SIGN_UM, TRT_CLINICALLY_CONCERNING_UM], 0, locale)),
    p.eyeRelation(relation, firstSignText, concerningText),
  ];
  if (relation === 'at-or-above-concerning') {
    if (concerning) lines.push(p.eyeProbability('concerning', likelihood(concerning), isUncertain(concerning)));
  } else {
    if (firstSign) lines.push(p.eyeProbability('first-sign', likelihood(firstSign), isUncertain(firstSign)));
    // The upper threshold is mentioned only when it may have been reached.
    if (relation === 'above-first-sign' && concerning && concerning.word !== 'unlikely') {
      lines.push(p.eyeProbability('concerning', likelihood(concerning), false));
    }
  }
  if (folds) {
    const limit = exact(folds.threshold.value, 'µm', locale);
    lines.push(p.eyeFolds(folds.exceeded, changeText(eye.change.bmRoughnessUm, [BM_ROUGHNESS_FOLDS_UM], 1, locale), limit));
    if (folds.exceeded || folds.word !== 'unlikely') lines.push(p.eyeFoldsProbability(likelihood(folds), folds.exceeded));
  }
  if (eye.sincePrevious) {
    lines.push(p.eyeSincePrevious(eye.sincePrevious.flightDay, changeText(eye.sincePrevious.trtRingUm, [], 0, locale)));
  }

  const state =
    eye.level === 'clinically-concerning'
      ? 'clinically-concerning'
      : eye.level === 'first-sign'
        ? isBelowFirstSign(relation)
          ? 'first-sign-folds'
          : 'first-sign'
        : 'no-detectable-change';
  return { headline: p.eyeHeadline(eye.eye, state), lines };
}

// --------------------------------------------------------------- Session

function headline(assessment: SessionAssessment, isReference: boolean, p: Phrases): string {
  const measured = EYES.filter((eye) => assessment.eyes[eye].measured);
  const notMeasured = EYES.filter((eye) => !assessment.eyes[eye].measured);
  if (isReference) return p.headlineReference(notMeasured);
  if (assessment.level === 'acute-visual-symptom') return p.headlineAcute();
  if (measured.length === 0) return p.headlineNothingMeasured();
  if (assessment.level === 'first-sign' || assessment.level === 'clinically-concerning') {
    const atLevel = EYES.filter((eye) => assessment.eyes[eye].level === assessment.level);
    return p.headlineLevel(assessment.level, eyeSet(atLevel.length > 0 ? atLevel : measured), notMeasured);
  }
  return p.headlineNoChange(measured, notMeasured);
}

/** The sentence about the vision tests and the questionnaire, or null when there is nothing to say. */
function functionalSentence(assessment: SessionAssessment, p: Phrases, locale: Locale, skipAcute: boolean): string | null {
  const { functional } = assessment;
  const findings = assessment.findings
    .filter((id) => FUNCTIONAL_FINDINGS.includes(id) && !(skipAcute && ACUTE_FINDINGS.includes(id)))
    .map((id) => p.finding(findingText(id, assessment, locale), true));
  if (!functional) return findings.length > 0 ? p.summaryFunctional(findings, []) : null;
  const tests: readonly FunctionalTest[] = ['symptoms', 'acuity', 'amsler'];
  const notDone = tests.filter((test) => !functional.done[test]);
  if (notDone.length === tests.length) {
    return p.summaryFunctionalNotDone(EYES.some((eye) => assessment.eyes[eye].measured));
  }
  // After an acute symptom, "no finding" would contradict the sentence before it.
  if (skipAcute && findings.length === 0 && notDone.length === 0) return null;
  return p.summaryFunctional(findings, notDone);
}

function summary(assessment: SessionAssessment, isReference: boolean, p: Phrases, locale: Locale): string[] {
  const acute = assessment.level === 'acute-visual-symptom';
  const functional = functionalSentence(assessment, p, locale, acute);
  if (isReference) {
    // Before the flight nothing is compared: say what the exam is for, and what the tests showed if anything.
    const hasFindings = assessment.findings.some((id) => FUNCTIONAL_FINDINGS.includes(id));
    const notDone = assessment.functional && Object.values(assessment.functional.done).some((done) => !done);
    return [...p.summaryReference(), ...(functional && (hasFindings || notDone) ? [functional] : [])];
  }

  const compared = EYES.map((eye) => assessment.eyes[eye]).filter((eye) => eye.measured && eye.change !== null);
  const top = [...compared].sort(
    (a, b) =>
      (b.level ? levelRank(b.level) : 0) - (a.level ? levelRank(a.level) : 0) ||
      (b.change?.trtRingUm.value ?? 0) - (a.change?.trtRingUm.value ?? 0),
  )[0];
  const foldEyes = EYES.filter((eye) => assessment.eyes[eye].findings.includes('folds-new'));
  const imagingSign = compared.some((eye) => eye.level === 'first-sign' || eye.level === 'clinically-concerning');

  let thickness = p.summaryNothingMeasured();
  if (top?.change) {
    const firstSign = findThreshold(top, 'trt-first-sign');
    const concerning = findThreshold(top, 'trt-clinically-concerning');
    const relation = relationOf(top);
    const change = changeText(top.change.trtRingUm, [TRT_FIRST_SIGN_UM, TRT_CLINICALLY_CONCERNING_UM], 0, locale);
    thickness = p.summaryThickness({
      eye: top.eye,
      lead: compared.length === 1 ? 'only-eye' : change.value.sign > 0 ? 'larger-increase' : 'no-increase',
      change,
      relation,
      close: relation === 'below-first-sign' && isUncertain(firstSign),
      firstSign: exact(firstSign?.threshold.value ?? TRT_FIRST_SIGN_UM, 'µm', locale),
      concerning: exact(concerning?.threshold.value ?? TRT_CLINICALLY_CONCERNING_UM, 'µm', locale),
    });
  }

  // Most important first; when there are too many, the ones the cards already say go.
  const sentences: { text: string; droppable: number }[] = [];
  if (acute) sentences.push({ text: p.summaryAcute(acuteCauses(assessment, locale)), droppable: 0 });
  sentences.push({ text: thickness, droppable: 0 });
  if (foldEyes.length > 0) sentences.push({ text: p.summaryFolds(eyeSet(foldEyes)), droppable: 1 });
  if (functional) sentences.push({ text: functional, droppable: acute ? 2 : 0 });
  const meaning = imagingSign ? 'threshold' : compared.length > 0 || acute ? 'first-reading' : 'no-result';
  sentences.push({ text: p.summaryMeaning(meaning), droppable: 0 });
  while (sentences.length > MAX_SUMMARY_SENTENCES) {
    const priority = Math.max(...sentences.map((s) => s.droppable));
    if (priority === 0) break;
    sentences.splice(sentences.findIndex((s) => s.droppable === priority), 1);
  }
  return sentences.map((s) => s.text);
}

function stepValues(step: NextStep, assessment: SessionAssessment, locale: Locale): StepValues {
  const number = (key: string): number | null => {
    const value = step.params[key];
    return typeof value === 'number' ? value : null;
  };
  const eyes = step.params.eyes;
  const routineDays = step.params.routineDays;
  return {
    flightDay: number('flightDay'),
    inDays: number('inDays'),
    targetFlightDay: number('targetFlightDay'),
    sustainedFromFlightDay: number('sustainedFromFlightDay'),
    maxDays: number('maxDays'),
    eyes: eyes === 'OD' || eyes === 'OS' || eyes === 'both' ? eyes : null,
    routineDays: typeof routineDays === 'string' ? routineDays.split(',').map(Number).filter(Number.isFinite) : [],
    missionDays: number('missionDays'),
    acuteCauses: step.id === 'contact-surgeon-now' ? acuteCauses(assessment, locale) : [],
    promptCauses: step.id === 'notify-surgeon-without-delay' ? promptCauses(assessment, locale) : [],
    acuityWorse: step.id === 'try-stronger-glasses' ? acuityWorse(assessment.functional, locale) : [],
    acuityLimit: exact(ACUITY_REAL_CHANGE_LOGMAR, 'logMAR', locale),
    nearBlurReported: assessment.findings.includes('symptom-near-blur'),
  };
}

/** The words for one assessment, in one language. */
export function explainAssessment(assessment: SessionAssessment, locale: Locale): Explanation {
  const p = PHRASES[locale];
  const isReference = assessment.flightDay <= 0;
  const provisional = isProvisionalErrorModel(assessment.errorModelVersion);
  return {
    headline: headline(assessment, isReference, p),
    summary: summary(assessment, isReference, p, locale),
    eyes: {
      OD: explainEye(assessment.eyes.OD, isReference, p, locale),
      OS: explainEye(assessment.eyes.OS, isReference, p, locale),
    },
    nextSteps: assessment.nextSteps.map((step) => ({
      id: step.id,
      ...p.step(step.id, stepValues(step, assessment, locale)),
      basis: step.basis,
    })),
    limitations: assessment.limitations.map((id) => ({ id, text: p.limitation(id, provisional) })),
    findings: assessment.findings.map((id) => ({
      id,
      text: sentence(p.finding(findingText(id, assessment, locale), false)),
    })),
  };
}
