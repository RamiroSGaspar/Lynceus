import type {
  AlertClass,
  ContactUrgency,
  Eye,
  EyeAssessment,
  EyeCaptureResult,
  FindingId,
  Level,
  LikelihoodWord,
  NextStepId,
  Quantity,
  SessionRecord,
} from '@app/core';
import type {
  AssistantAlert,
  AssistantContact,
  AssistantContext,
  AssistantFinding,
  AssistantLevel,
  AssistantLikelihood,
  AssistantMeasure,
  AssistantNextStep,
  ContextCapture,
  ContextChange,
  ContextEye,
} from '../../../api/_lib/contract';

// The server repeats the core's enumerations without importing them; fail the
// build if the two lists ever drift apart.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const ENUMS_MATCH: [
  Same<Level, AssistantLevel>,
  Same<AlertClass, AssistantAlert>,
  Same<LikelihoodWord, AssistantLikelihood>,
  Same<ContactUrgency, AssistantContact>,
  Same<FindingId, AssistantFinding>,
  Same<NextStepId, AssistantNextStep>,
] = [true, true, true, true, true, true];
void ENUMS_MATCH;

const round = (value: number, decimals: number) => Math.round(value * 10 ** decimals) / 10 ** decimals;

function change(measure: AssistantMeasure, quantity: Quantity | undefined): ContextChange | null {
  // Only micrometre values with a finite number are sent; anything else is left out rather than guessed.
  if (!quantity || quantity.unit !== 'µm' || !Number.isFinite(quantity.value)) return null;
  const interval = quantity.interval95;
  return {
    measure,
    changeUm: round(quantity.value, 1),
    interval95Um: interval ? [round(interval[0], 1), round(interval[1], 1)] : null,
  };
}

function capture(result: EyeCaptureResult): ContextCapture | null {
  const last = result.attempts.at(-1);
  if (!last) return null;
  const quality = result.accepted?.quality;
  return {
    attempts: result.attempts.length,
    usableScans: quality?.usableScans ?? last.usableScans,
    totalScans: quality?.totalScans ?? null,
    meanQualityDb: round(quality?.meanQualityDb ?? last.meanQualityDb, 1),
  };
}

function eye(assessment: EyeAssessment, result: EyeCaptureResult): ContextEye {
  const c = assessment.change;
  const changes = c
    ? [
        change('trt-0-250', c.trtRingUm),
        change('trt-250-500', c.rings[1]),
        change('trt-500-1000', c.rings[2]),
        change('trt-1000-1500', c.rings[3]),
        change('mrw', c.mrwUm),
        change('bm-roughness', c.bmRoughnessUm),
      ].filter((x): x is ContextChange => x !== null)
    : [];
  return {
    measured: assessment.measured,
    level: assessment.level,
    changes,
    thresholds: assessment.thresholds.map((t) => ({
      id: t.thresholdId,
      thresholdUm: t.threshold.value,
      exceeded: t.exceeded,
      probabilityExceeded: round(t.probabilityExceeded, 2),
      word: t.word,
    })),
    capture: capture(result),
  };
}

/**
 * The numeric summary that leaves the device when the astronaut asks. Built
 * field by field from an allow-list, so nothing that identifies the person
 * (name, crew or exam identifiers, written questions) can slip in.
 */
export function buildAssistantContext(record: SessionRecord): AssistantContext {
  const a = record.assessment;
  const eyes = Object.fromEntries(
    (['OD', 'OS'] as const satisfies readonly Eye[]).map((e) => [e, eye(a.eyes[e], record.eyes[e])]),
  ) as AssistantContext['eyes'];
  return {
    flightDay: record.flightDay,
    level: a.level,
    alert: a.alert,
    eyes,
    findings: [...new Set(a.findings)],
    nextSteps: [...new Set(a.nextSteps.map((s) => s.id))],
    contact: a.contact,
    nextOctFlightDay: a.nextOct?.flightDay ?? null,
  };
}
