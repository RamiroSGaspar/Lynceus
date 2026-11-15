/**
 * Sample values of the contract types: vision tests and symptoms.
 *
 * SIMULATED DATA. Nobody answered or performed these tests.
 */
import type {
  AcuityResult,
  AmslerResult,
  Eye,
  ScreenCalibration,
  SymptomAnswer,
  SymptomAnswers,
  SymptomId,
  VisionSession,
} from '@app/core';

/** Every symptom of the contract, in the order of the questionnaire. */
export const SYMPTOM_IDS: readonly SymptomId[] = [
  'near-vision',
  'intermediate-vision',
  'distance-vision',
  'distortion',
  'low-light-vision',
  'fluctuating-vision',
  'depth-perception',
  'double-vision',
  'transient-vision-loss',
  'sudden-vision-loss',
  'new-dark-spot',
  'headache',
  'tinnitus',
  'nausea',
  'difficulty-thinking',
];

/** A laptop screen of 141 pixels per inch, read at 40 cm. */
export const SAMPLE_CALIBRATION: ScreenCalibration = {
  pxPerMm: 5.55,
  viewingDistanceCm: 40,
  floorLogMar: 0.19,
};

export function makeSymptomAnswers(
  present: Partial<Record<SymptomId, SymptomAnswer>> = {},
  glasses: SymptomAnswers['glasses'] = 'none',
): SymptomAnswers {
  const answers = {} as Record<SymptomId, SymptomAnswer>;
  for (const id of SYMPTOM_IDS) answers[id] = present[id] ?? { present: false };
  const visionIds = SYMPTOM_IDS.slice(0, 11);
  return {
    changeNoticed: visionIds.some((id) => answers[id].present),
    answers,
    glasses,
  };
}

export function makeAcuity(eye: Eye, logMar: number | null, withCorrection = false): AcuityResult {
  return { eye, logMar, atScreenFloor: false, trials: 18, correct: logMar === null ? 3 : 14, withCorrection };
}

export function makeAmsler(eye: Eye, marks: AmslerResult['marks'] = []): AmslerResult {
  const gridSize = 20;
  const centre = gridSize / 2;
  return {
    eye,
    gridSize,
    cellDeg: 1,
    marks,
    markedFraction: marks.length / (gridSize * gridSize),
    centralMarked: marks.some(
      ({ col, row }) => Math.abs(col + 0.5 - centre) <= 1 && Math.abs(row + 0.5 - centre) <= 1,
    ),
    cornersSeen: true,
  };
}

export interface SampleVisionOptions {
  acuity?: { OD: number | null; OS: number | null } | null;
  amsler?: { OD: AmslerResult['marks']; OS: AmslerResult['marks'] } | null;
  symptoms?: Partial<Record<SymptomId, SymptomAnswer>> | null;
}

/** A vision session; pass `null` for a part to record it as not done. */
export function makeVisionSession(options: SampleVisionOptions = {}): VisionSession {
  const acuity = options.acuity === undefined ? { OD: 0, OS: 0 } : options.acuity;
  const amsler = options.amsler === undefined ? { OD: [], OS: [] } : options.amsler;
  const symptoms = options.symptoms === undefined ? {} : options.symptoms;
  return {
    calibration: acuity === null ? null : SAMPLE_CALIBRATION,
    acuity: {
      OD: acuity === null ? null : makeAcuity('OD', acuity.OD),
      OS: acuity === null ? null : makeAcuity('OS', acuity.OS),
    },
    amsler: {
      OD: amsler === null ? null : makeAmsler('OD', amsler.OD),
      OS: amsler === null ? null : makeAmsler('OS', amsler.OS),
    },
    symptoms: symptoms === null ? null : makeSymptomAnswers(symptoms),
  };
}
