import type { CaptureAttemptRecord, CrewId, ExamSummary, Eye, EyeCaptureResult, Quantity } from '@app/core';
import { MISSION } from '../../app/core';
import { flightDayTimeMs } from '../../app/dates';
import { useMessages } from '../../i18n';
import { commonMessages } from '../../i18n/common';
import { provisionalMessages } from '../../i18n/provisional';
import { sessionMessages } from '../../i18n/session';
import { makeAttempt } from '../../sample/exams';
import { ScreenTitle } from '../../shell/ScreenTitle';
import { Button, QuantityValue } from '../../ui';

interface Props {
  crewId: CrewId;
  eye: Eye;
  flightDay: number;
  /** The pre-flight exam of that eye. */
  baseline: ExamSummary;
  onComplete(result: EyeCaptureResult): void;
}

/** Said in the exam itself, so no screen can mistake an example for a measurement. */
export const EXAMPLE_ENGINE_VERSION = 'provisional-example (values chosen by hand, not measured on an image)';

/** How much of a change next to the opening reaches each of the four rings, from the inside out. */
const RING_SHARE = [1, 0.3, 0.15, 0];

/** Changes offered as examples, in micrometres: one in each of NASA's three bands. */
const EXAMPLE_CHANGES_UM = [4, 26, 61];

function shifted(quantity: Quantity, delta: number): Quantity {
  return { ...quantity, value: Math.round((quantity.value + delta) * 100) / 100 };
}

/** SIMULATED: the pre-flight exam with a change added by hand. Nothing is measured. */
export function exampleExam(baseline: ExamSummary, flightDay: number, changeUm: number): ExamSummary {
  return {
    ...baseline,
    examId: `${baseline.examId}-EXAMPLE-FD${flightDay}`,
    referenceId: baseline.examId,
    visitId: `FD${flightDay}`,
    examTimeMs: flightDayTimeMs(MISSION, flightDay),
    bmoSource: 'reference-shape',
    rings: baseline.rings.map((ring, index) => ({
      ...ring,
      thickness: shifted(ring.thickness, changeUm * (RING_SHARE[index] ?? 0)),
    })),
    trtRingUm: baseline.trtRingUm && shifted(baseline.trtRingUm, changeUm),
    mrwUm: baseline.mrwUm && shifted(baseline.mrwUm, changeUm * 1.5),
    engineVersion: EXAMPLE_ENGINE_VERSION,
  };
}

/** SIMULATED: an eye measured after `rejectedBefore` rejected attempts. */
export function exampleMeasured(
  crewId: CrewId,
  baseline: ExamSummary,
  flightDay: number,
  changeUm: number,
  rejectedBefore = 0,
): EyeCaptureResult {
  const exam = exampleExam(baseline, flightDay, changeUm);
  const attempts: CaptureAttemptRecord[] = [];
  for (let attempt = 1; attempt <= rejectedBefore; attempt += 1) {
    attempts.push(makeAttempt({ crewId, eye: baseline.eye, flightDay, attempt, status: 'cannot-measure' }));
  }
  attempts.push(
    makeAttempt({
      crewId,
      eye: baseline.eye,
      flightDay,
      attempt: rejectedBefore + 1,
      status: 'measured',
      usableScans: exam.quality.usableScans,
      meanQualityDb: exam.quality.meanQualityDb,
    }),
  );
  return { eye: baseline.eye, attempts, accepted: exam };
}

/** SIMULATED: an eye that could not be measured in three attempts. */
export function exampleUnmeasured(crewId: CrewId, eye: Eye, flightDay: number): EyeCaptureResult {
  return {
    eye,
    attempts: [1, 2, 3].map((attempt) =>
      makeAttempt({
        crewId,
        eye,
        flightDay,
        attempt,
        status: 'cannot-measure',
        rejections: attempt === 2 ? ['decentered'] : ['too-few-usable-scans'],
        scanRejections: attempt === 2 ? ['bmo-not-found'] : ['low-signal', 'signal-dropout'],
        usableScans: attempt === 2 ? 44 : 31,
        meanQualityDb: attempt === 2 ? 24 : 14,
      }),
    ),
    accepted: null,
  };
}

/**
 * PROVISIONAL: stands in for `features/oct` (capture and analysis of one eye, up
 * to three attempts). It shows what goes here and hands back an example result.
 */
export function OctCaptureStep({ crewId, eye, flightDay, baseline, onComplete }: Props) {
  const t = useMessages(sessionMessages);
  const tp = useMessages(provisionalMessages);
  const tc = useMessages(commonMessages);
  return (
    <div className="placeholder">
      <p className="placeholder__tag">{tp('tag')}</p>
      <ScreenTitle>{t('oct.title', { eye: tc(`eye.${eye}`).toLowerCase() })}</ScreenTitle>
      <p>{t('oct.what')}</p>
      {baseline.trtRingUm && (
        <p>
          {t('oct.baseline')} <QuantityValue quantity={baseline.trtRingUm} showOrigin />
        </p>
      )}
      <p>{t('oct.examples')}</p>
      <div className="actions actions--stack">
        {EXAMPLE_CHANGES_UM.map((changeUm) => (
          <Button
            key={changeUm}
            size="lg"
            onClick={() => onComplete(exampleMeasured(crewId, baseline, flightDay, changeUm))}
          >
            {t('oct.example.none', { value: `+${changeUm}` })}
          </Button>
        ))}
        <Button size="lg" onClick={() => onComplete(exampleMeasured(crewId, baseline, flightDay, 12, 1))}>
          {t('oct.example.retry')}
        </Button>
        <Button size="lg" onClick={() => onComplete(exampleUnmeasured(crewId, eye, flightDay))}>
          {t('oct.example.unmeasured')}
        </Button>
      </div>
    </div>
  );
}
