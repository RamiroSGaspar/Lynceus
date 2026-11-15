/**
 * The sentences of the product, as one interface with an implementation per
 * language. `explain.ts` decides WHICH sentences a result gets; the languages
 * only say HOW each one reads. Both therefore always have the same structure.
 *
 * Writing rules (comunicar-resultados-de-salud.md and specification 04, section 5):
 * a number always carries its unit and its range; the probability word is glued
 * to its number; the reference is the astronaut's own pre-flight exam; second
 * person, short sentences, no unexplained abbreviations; passing a threshold is
 * not a diagnosis; nothing alarming and nothing reassuring beyond the data; no
 * medication, and nothing about the pressure inside the skull except that it
 * cannot be measured on board.
 */
import type {
  Eye,
  LikelihoodWord,
  LimitationId,
  NextStepId,
  NotMeasuredReason,
  SymptomId,
  SymptomSeverity,
} from '../contract';
import type { PercentText, SignedText } from './format';

export type EyeSet = Eye | 'both';

/** A change and its 95 % range, rounded and formatted. */
export interface ChangeText {
  value: SignedText;
  range: readonly [SignedText, SignedText] | null;
}

/** What a thickness change is compared with in the sentence. */
export type ThicknessReference = 'before-flight' | 'own-preflight-exam' | 'none';

/** Where the measured change of the ring falls among NASA's two thresholds. */
export type Relation = 'below-first-sign' | 'at-first-sign' | 'above-first-sign' | 'at-or-above-concerning';

/** How the summary introduces the eye it quotes: the only one measured, the one that rose most, or none rose. */
export type ThicknessLead = 'only-eye' | 'larger-increase' | 'no-increase';

export type FunctionalTest = 'symptoms' | 'acuity' | 'amsler';

/** What made the session an acute visual symptom. */
export type AcuteCause =
  | { kind: 'symptom'; id: SymptomId; eye: EyeSet | null }
  | { kind: 'amsler-central' | 'amsler-extensive'; eye: Eye; fraction: string }
  /** The finding is recorded but its detail is not available. */
  | { kind: 'unspecified' };

export interface ReportedSymptom {
  id: SymptomId;
  severity: SymptomSeverity | null;
  eye: EyeSet | null;
}

export interface AmslerMarks {
  eye: Eye;
  where: 'centre' | 'extensive' | 'elsewhere';
  /** Marked part of the grid, as a percentage with its sign. */
  fraction: string;
}

export interface AcuityWorse {
  eye: Eye;
  change: ChangeText;
  /** Both tests were done with, or both without, the usual near correction. */
  sameCorrection: boolean;
}

/** One finding of the session, with what its sentence needs. */
export type FindingText =
  | { id: 'swelling-clinically-concerning' | 'swelling-first-sign' | 'folds-new' | 'eye-not-measured'; eyes: EyeSet }
  | { id: 'symptom-acute'; symptoms: readonly ReportedSymptom[] }
  | { id: 'amsler-marked-central' | 'amsler-marked'; marks: readonly AmslerMarks[] }
  | { id: 'symptom-other'; symptoms: readonly ReportedSymptom[] }
  | { id: 'near-vision-worse'; eyes: readonly AcuityWorse[]; limit: string }
  | { id: 'symptom-near-blur' }
  | { id: 'symptom-headache' };

/** Why the flight surgeon should hear about the result without delay. */
export type PromptCause =
  | { kind: 'concerning'; eyes: EyeSet }
  | { kind: 'amsler'; marks: readonly AmslerMarks[] }
  | { kind: 'symptoms'; symptoms: readonly ReportedSymptom[] }
  | { kind: 'activities-affected'; symptoms: readonly ReportedSymptom[] }
  | { kind: 'headache-activities-affected' };

/** Values of a step, read from `NextStep.params`. */
export interface StepValues {
  flightDay: number | null;
  inDays: number | null;
  /** Date the rule computed before joining it with the routine calendar. */
  targetFlightDay: number | null;
  /** Previous control that keeps the closer follow-up going. */
  sustainedFromFlightDay: number | null;
  maxDays: number | null;
  eyes: EyeSet | null;
  routineDays: readonly number[];
  missionDays: number | null;
  /** What triggered a contact step. */
  acuteCauses: readonly AcuteCause[];
  promptCauses: readonly PromptCause[];
  /** What triggered the glasses step. */
  acuityWorse: readonly AcuityWorse[];
  acuityLimit: string;
  nearBlurReported: boolean;
}

export interface Phrases {
  // ------------------------------------------------------------ Vocabulary
  /** "your right eye", "both eyes". */
  yourEyes(eyes: EyeSet): string;
  list(items: readonly string[]): string;
  /** "likely (87 %)": the word glued to its number. */
  likelihood(word: LikelihoodWord, percent: PercentText): string;
  /** "24 µm thicker than before the flight (range 16 to 32)". */
  thickness(change: ChangeText, reference: ThicknessReference): string;
  symptom(id: SymptomId): string;

  // -------------------------------------------------------------- Headline
  headlineReference(notMeasured: readonly Eye[]): string;
  headlineAcute(): string;
  headlineLevel(level: 'first-sign' | 'clinically-concerning', eyes: EyeSet, notMeasured: readonly Eye[]): string;
  headlineNoChange(measured: readonly Eye[], notMeasured: readonly Eye[]): string;
  headlineNothingMeasured(): string;

  // --------------------------------------------------------------- Summary
  summaryAcute(causes: readonly AcuteCause[]): string;
  summaryThickness(args: {
    eye: Eye;
    lead: ThicknessLead;
    change: ChangeText;
    relation: Relation;
    /** Below the threshold, but it may have been passed. */
    close: boolean;
    firstSign: string;
    concerning: string;
  }): string;
  summaryNothingMeasured(): string;
  summaryFolds(eyes: EyeSet): string;
  /** `findings` are clauses from `finding`; `notDone` are the tests skipped today. */
  summaryFunctional(findings: readonly string[], notDone: readonly FunctionalTest[]): string;
  /** None of the functional tests was done. `scanMeasured`: whether the scan gave a result to rest on. */
  summaryFunctionalNotDone(scanMeasured: boolean): string;
  summaryMeaning(kind: 'threshold' | 'first-reading' | 'no-result'): string;
  summaryReference(): readonly [string, string];

  // ------------------------------------------------------------------ Eyes
  eyeHeadline(eye: Eye, state: 'reference' | 'not-measured' | 'no-detectable-change' | 'first-sign' | 'first-sign-folds' | 'clinically-concerning'): string;
  eyeReference(): string;
  eyeNotMeasuredReason(reason: NotMeasuredReason): string;
  eyeNoResult(): string;
  eyeThickness(eye: Eye, change: ChangeText): string;
  eyeRelation(relation: Relation, firstSign: string, concerning: string): string;
  /** `close`: the probability is between 10 % and 90 %, so the next control will tell. */
  eyeProbability(threshold: 'first-sign' | 'concerning', likelihood: string, close: boolean): string;
  eyeFolds(isNew: boolean, change: ChangeText, limit: string): string;
  eyeFoldsProbability(likelihood: string, isNew: boolean): string;
  eyeSincePrevious(flightDay: number, change: ChangeText): string;

  // ----------------------------------------------------------------- Steps
  step(id: NextStepId, values: StepValues): { text: string; why: string };

  // ----------------------------------------------------------- Limitations
  limitation(id: LimitationId, provisionalErrorModel: boolean): string;

  // -------------------------------------------------------------- Findings
  /**
   * A clause, without capital or full stop, so it can stand alone or in a list.
   * `brief` leaves out ranges and explanations, for the summary.
   */
  finding(finding: FindingText, brief: boolean): string;
}
