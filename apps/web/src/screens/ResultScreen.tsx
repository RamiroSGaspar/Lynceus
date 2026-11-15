import { useMemo, useState, type ReactNode } from 'react';
import {
  ENGINE_VERSION,
  QUALITY_MAX_DB,
  QUALITY_POOR_DB,
  ACUITY_RETEST_LIMIT_LOGMAR,
  type AcuityResult,
  type AmslerResult,
  type CrewId,
  type ExamRejection,
  type Eye,
  type EyeAssessment,
  type EyeCaptureResult,
  type FindingId,
  type Quantity,
  type ScanRejection,
  type SessionRecord,
  type SymptomAnswers,
  type SymptomId,
  type SymptomSeverity,
  type ThresholdAssessment,
} from '@app/core';
import {
  TRT_CLINICALLY_CONCERNING_UM,
  TRT_FIRST_SIGN_UM,
  explainAssessment,
  isProvisionalErrorModel,
  type Explanation,
} from '../app/core';
import { formatPlain, percentLabel } from '../app/format';
import { baselineOf, changePoints, findRecord } from '../app/history';
import { crewMember, useCrewHistory, useDocumentTitle } from '../app/hooks';
import { formatRoute } from '../app/routes';
import { ChangeScale, changeScaleDomain, type ScaleMark } from '../charts/ChangeScale';
import { unionDomain, type Domain } from '../charts/scale';
import { useI18n, useMessages } from '../i18n';
import { appMessages } from '../i18n/app';
import { commonMessages } from '../i18n/common';
import { resultMessages } from '../i18n/result';
import { LinkButton } from '../shell/LinkButton';
import { ScreenTitle } from '../shell/ScreenTitle';
import { AssistantPanel, ExamViewer } from '../slots';
import { Card, LevelBadge, OriginTag, QuantityValue } from '../ui';
import { NotFoundScreen } from './NotFoundScreen';

const EYES: readonly Eye[] = ['OD', 'OS'];
const THRESHOLDS = { firstSignUm: TRT_FIRST_SIGN_UM, clinicallyConcerningUm: TRT_CLINICALLY_CONCERNING_UM };

/** Findings that come from the vision tests and the questionnaire, not from the image. */
const FUNCTIONAL_FINDINGS: readonly FindingId[] = [
  'symptom-acute',
  'amsler-marked-central',
  'amsler-marked',
  'symptom-other',
  'near-vision-worse',
  'symptom-near-blur',
  'symptom-headache',
];

type T = ReturnType<typeof useMessages<keyof (typeof resultMessages)['en']>>;

/** Earlier controls of one eye that have a value: the faint marks of the number line. */
function earlierMarks(history: readonly SessionRecord[], eye: Eye, beforeDay: number): ScaleMark[] {
  return changePoints(history, eye).flatMap((point) =>
    point.flightDay < beforeDay && point.change ? [{ flightDay: point.flightDay, change: point.change }] : [],
  );
}

function todayMark(record: SessionRecord, eye: Eye): ScaleMark | null {
  const assessment = record.assessment.eyes[eye];
  const change = assessment.measured ? assessment.change?.trtRingUm : undefined;
  return change ? { flightDay: record.flightDay, change } : null;
}

// ----------------------------------------------------------------- How sure

function Chance({ threshold, t }: { threshold: ThresholdAssessment; t: T }) {
  const { locale } = useI18n();
  const tc = useMessages(commonMessages);
  const percent = percentLabel(threshold.probabilityExceeded, threshold.word, locale);
  const number =
    percent.kind === 'below'
      ? t('sure.below', { value: percent.text })
      : percent.kind === 'above'
        ? t('sure.above', { value: percent.text })
        : percent.text;
  return (
    <li className="sure__item">
      <span className="sure__what">
        {t(`sure.threshold.${threshold.thresholdId}`)}{' '}
        <QuantityValue
          quantity={threshold.threshold}
          digits={(String(threshold.threshold.value).split('.')[1] ?? '').length}
          showOrigin
        />
      </span>
      <span className="sure__chance">
        <strong>{t('sure.chance', { word: tc(`likelihood.${threshold.word}`), percent: number })}</strong>{' '}
        <OriginTag origin="estimated" />
      </span>
    </li>
  );
}

function HowSure({
  eye,
  capture,
  provisional,
  t,
}: {
  eye: EyeAssessment;
  capture: EyeCaptureResult;
  provisional: boolean;
  t: T;
}) {
  const quality = capture.accepted?.quality;
  return (
    <section className="sure" aria-label={t('sure.heading')}>
      <h4>{t('sure.heading')}</h4>
      {eye.thresholds.length > 0 && (
        <>
          <p className="note">{t('sure.lead')}</p>
          <ul className="sure__list">
            {eye.thresholds.map((threshold) => (
              <Chance key={threshold.thresholdId} threshold={threshold} t={t} />
            ))}
          </ul>
          <p className="note">
            {t('sure.range')} {provisional ? t('sure.provisional') : t('sure.simulatedModel')}
          </p>
        </>
      )}
      {quality && (
        <p>
          {t('sure.quality')}:{' '}
          <QuantityValue quantity={{ value: quality.meanQualityDb, unit: 'dB', origin: 'measured' }} digits={0} showOrigin />
          {' · '}
          {t('sure.quality.scans', { usable: quality.usableScans, total: quality.totalScans })}.{' '}
          <span className="note">{t('sure.quality.scale', { max: QUALITY_MAX_DB, poor: QUALITY_POOR_DB })}</span>
        </p>
      )}
    </section>
  );
}

// ------------------------------------------------------------------- Detail

function Cell({ quantity, signed = false, digits }: { quantity: Quantity | null | undefined; signed?: boolean; digits?: number }) {
  const t = useMessages(resultMessages);
  return quantity ? (
    <QuantityValue quantity={quantity} signed={signed} digits={digits} showOrigin />
  ) : (
    <span className="note">{t('detail.missing')}</span>
  );
}

function Attempts({ capture, t }: { capture: EyeCaptureResult; t: T }) {
  const total = capture.accepted?.quality.totalScans ?? null;
  const reasons = (list: readonly (ExamRejection | ScanRejection)[]): string =>
    list.map((reason) => t(`rejection.${reason}`)).join('; ');
  return (
    <>
      <h4>{t('attempts.heading')}</h4>
      {capture.attempts.length === 0 ? (
        <p>{t('attempts.none')}</p>
      ) : (
        <ol className="attempts">
          {capture.attempts.map((attempt) => {
            const why = [...attempt.rejections, ...attempt.scanRejections];
            return (
              <li key={attempt.attempt}>
                <strong>
                  {t('attempt', { n: attempt.attempt })}:{' '}
                  {attempt.status === 'measured' ? t('attempt.measured') : t('attempt.rejected')}
                </strong>
                {'. '}
                {t('attempt.facts', {
                  usable: attempt.usableScans,
                  total: total ?? Math.max(attempt.usableScans, 48),
                  quality: Math.round(attempt.meanQualityDb),
                })}
                {'. '}
                {why.length > 0 && (
                  <>
                    {t('attempt.reasons')} {reasons(why)}.
                  </>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

function EyeDetail({
  record,
  baseline,
  eye,
  t,
}: {
  record: SessionRecord;
  baseline: SessionRecord | null;
  eye: Eye;
  t: T;
}) {
  const tc = useMessages(commonMessages);
  const capture = record.eyes[eye];
  const exam = capture.accepted;
  const before = record.flightDay === 0 ? null : (baseline?.eyes[eye].accepted ?? null);
  const change = record.assessment.eyes[eye].change;
  const rows: { name: string; today: Quantity | null; before: Quantity | null; change: Quantity | null; digits?: number }[] =
    exam
      ? [
          { name: t('measure.trt'), today: exam.trtRingUm, before: before?.trtRingUm ?? null, change: change?.trtRingUm ?? null },
          ...exam.rings.slice(1).map((ring, index) => ({
            name: t('measure.ring', { inner: ring.innerUm, outer: ring.outerUm }),
            today: ring.thickness,
            before: before?.rings[index + 1]?.thickness ?? null,
            change: change?.rings[index + 1] ?? null,
          })),
          { name: t('measure.mrw'), today: exam.mrwUm, before: before?.mrwUm ?? null, change: change?.mrwUm ?? null },
          {
            name: t('measure.roughness'),
            today: exam.bmRoughnessUm,
            before: before?.bmRoughnessUm ?? null,
            change: change?.bmRoughnessUm ?? null,
            digits: 1,
          },
        ]
      : [];
  return (
    <details className="eye-detail">
      <summary>{t('detail.summary')}</summary>
      {exam && (
        <div className="table-scroll">
          <table>
            <caption>{t('detail.caption', { eye: tc(`eye.${eye}`) })}</caption>
            <thead>
              <tr>
                <th scope="col">{t('detail.measure')}</th>
                <th scope="col">{t('detail.today')}</th>
                {record.flightDay > 0 && <th scope="col">{t('detail.preflight')}</th>}
                {record.flightDay > 0 && <th scope="col">{t('detail.change')}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <th scope="row">{row.name}</th>
                  <td>
                    <Cell quantity={row.today} digits={row.digits} />
                  </td>
                  {record.flightDay > 0 && (
                    <td>
                      <Cell quantity={row.before} digits={row.digits} />
                    </td>
                  )}
                  {record.flightDay > 0 && (
                    <td>
                      <Cell quantity={row.change} signed digits={row.digits} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Attempts capture={capture} t={t} />
      <p className="note">
        {t('versions', {
          engine: exam?.engineVersion ?? t('versions.unknown'),
          rules: record.assessment.rulesVersion,
          error: record.assessment.errorModelVersion ?? t('versions.unknown'),
        })}
      </p>
    </details>
  );
}

/**
 * The image behind the numbers, for an exam the engine measured. It is mounted
 * only when opened: generating an exam again takes several seconds.
 */
function EyeImage({ record, baseline, eye, t }: { record: SessionRecord; baseline: SessionRecord | null; eye: Eye; t: T }) {
  const [open, setOpen] = useState(false);
  const capture = record.eyes[eye];
  const request = [...capture.attempts].reverse().find((attempt) => attempt.status === 'measured')?.request;
  if (!request || capture.accepted?.engineVersion !== ENGINE_VERSION) return null;
  return (
    <details className="eye-detail" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{t('viewer.summary')}</summary>
      <p className="note">{t('viewer.note')}</p>
      {open && <ExamViewer request={request} baseline={record.flightDay > 0 ? (baseline?.eyes[eye].accepted ?? undefined) : undefined} />}
    </details>
  );
}

// ------------------------------------------------------------------ One eye

function EyeCard({
  record,
  history,
  explanation,
  eye,
  domain,
  t,
}: {
  record: SessionRecord;
  history: readonly SessionRecord[];
  explanation: Explanation;
  eye: Eye;
  domain: Domain;
  t: T;
}) {
  const assessment = record.assessment.eyes[eye];
  const text = explanation.eyes[eye];
  const today = todayMark(record, eye);
  return (
    <Card as="article" className="eye-card">
      <header className="eye-card__head">
        <h3 className="card__title">{text.headline}</h3>
        {record.flightDay > 0 && <LevelBadge level={assessment.measured ? assessment.level : null} />}
      </header>
      {today ? (
        <>
          <ChangeScale
            eye={eye}
            today={today}
            previous={earlierMarks(history, eye, record.flightDay)}
            thresholds={THRESHOLDS}
            domain={domain}
          />
          <ul className="eye-card__lines">
            {text.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      ) : (
        // No number today: only the words, with the reason when the eye could not be measured.
        <ul className={`eye-card__lines${assessment.measured ? '' : ' callout callout--caution'}`}>
          {text.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {assessment.measured && (
        <HowSure
          eye={assessment}
          capture={record.eyes[eye]}
          provisional={isProvisionalErrorModel(record.assessment.errorModelVersion)}
          t={t}
        />
      )}
      <EyeImage record={record} baseline={record.flightDay === 0 ? null : baselineOf(history)} eye={eye} t={t} />
      <EyeDetail record={record} baseline={baselineOf(history)} eye={eye} t={t} />
    </Card>
  );
}

// ------------------------------------------------------------- Vision tests

function symptomList(answers: SymptomAnswers | null | undefined, t: T): ReactNode {
  if (!answers) return null;
  const present = (Object.keys(answers.answers) as SymptomId[]).filter((id) => answers.answers[id].present);
  if (present.length === 0) return t('vision.symptoms.none');
  return (
    <ul className="plain-list">
      {present.map((id) => {
        const answer = answers.answers[id];
        const severity: SymptomSeverity | undefined = answer.severity;
        const detail = [severity ? t(`severity.${severity}`) : t('severity.unknown'), answer.eye ? t(`where.${answer.eye}`) : null]
          .filter(Boolean)
          .join(', ');
        return <li key={id}>{t('vision.symptom.item', { symptom: t(`symptom.${id}`), detail })}</li>;
      })}
    </ul>
  );
}

function AcuityCell({ result, t }: { result: AcuityResult | null | undefined; t: T }) {
  if (!result) return null;
  if (result.logMar === null) return <>{t('vision.acuity.unsettled')}</>;
  return (
    <>
      <QuantityValue quantity={{ value: result.logMar, unit: 'logMAR', origin: 'self-reported' }} digits={2} showOrigin />
      {result.atScreenFloor && <span className="note"> ({t('vision.acuity.floor')})</span>}
    </>
  );
}

function AmslerCell({ result, t }: { result: AmslerResult | null | undefined; t: T }) {
  const { locale } = useI18n();
  if (!result) return null;
  if (result.marks.length === 0) {
    return (
      <>
        {t('vision.amsler.clean')} <OriginTag origin="self-reported" />
      </>
    );
  }
  return (
    <>
      {t('vision.amsler.marked', { percent: `${formatPlain(result.markedFraction * 100, 1, locale)}\u00a0%` })}
      {result.centralMarked && `, ${t('vision.amsler.central')}`} <OriginTag origin="self-reported" />
    </>
  );
}

function VisionSection({
  record,
  baseline,
  explanation,
  t,
}: {
  record: SessionRecord;
  baseline: SessionRecord | null;
  explanation: Explanation;
  t: T;
}) {
  const tc = useMessages(commonMessages);
  const { locale } = useI18n();
  const today = record.vision;
  const before = record.flightDay === 0 ? null : (baseline?.vision ?? null);
  const functional = record.assessment.functional;
  const showBefore = record.flightDay > 0;
  const notDone = <span className="vision__not-done">{t('vision.notDone')}</span>;
  const notDoneBefore = <span className="note">{t('vision.notDone.preflight')}</span>;
  const findings = explanation.findings.filter((finding) => FUNCTIONAL_FINDINGS.includes(finding.id));

  return (
    <section className="screen__section" aria-labelledby="vision-heading">
      <h2 id="vision-heading">{t('vision.heading')}</h2>
      <p className="note">{t('vision.lead')}</p>
      {findings.length > 0 && (
        <div className="callout" role="group" aria-label={t('vision.findings')}>
          {findings.map((finding) => (
            <p key={finding.id}>{finding.text}</p>
          ))}
        </div>
      )}
      <div className="table-scroll">
        <table className="vision-table">
          <caption>{t('vision.caption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('vision.test')}</th>
              <th scope="col">{t('vision.today')}</th>
              {showBefore && <th scope="col">{t('vision.preflight')}</th>}
              {showBefore && <th scope="col">{t('vision.change')}</th>}
            </tr>
          </thead>
          <tbody>
            {EYES.map((eye) => {
              const comparison = functional?.acuity[eye] ?? null;
              return (
                <tr key={`acuity-${eye}`}>
                  <th scope="row">{t('vision.acuity', { eye: tc(`eye.${eye}`).toLowerCase() })}</th>
                  <td>{today?.acuity[eye] ? <AcuityCell result={today.acuity[eye]} t={t} /> : notDone}</td>
                  {showBefore && (
                    <td>{before?.acuity[eye] ? <AcuityCell result={before.acuity[eye]} t={t} /> : notDoneBefore}</td>
                  )}
                  {showBefore && (
                    <td>
                      {comparison?.change ? (
                        <>
                          <QuantityValue quantity={comparison.change} signed digits={2} showOrigin />
                          {!comparison.sameCorrection && <span className="note"> ({t('vision.acuity.correction')})</span>}
                        </>
                      ) : (
                        <span className="note">{t('vision.noChange')}</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {EYES.map((eye) => (
              <tr key={`amsler-${eye}`}>
                <th scope="row">{t('vision.amsler', { eye: tc(`eye.${eye}`).toLowerCase() })}</th>
                <td>{today?.amsler[eye] ? <AmslerCell result={today.amsler[eye]} t={t} /> : notDone}</td>
                {showBefore && (
                  <td>{before?.amsler[eye] ? <AmslerCell result={before.amsler[eye]} t={t} /> : notDoneBefore}</td>
                )}
                {showBefore && (
                  <td>
                    <span className="note">{t('vision.noChange')}</span>
                  </td>
                )}
              </tr>
            ))}
            <tr>
              <th scope="row">{t('vision.symptoms')}</th>
              <td>{today?.symptoms ? symptomList(today.symptoms, t) : notDone}</td>
              {showBefore && <td>{before?.symptoms ? symptomList(before.symptoms, t) : notDoneBefore}</td>}
              {showBefore && (
                <td>
                  <span className="note">{t('vision.noChange')}</span>
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="note">
        {t('vision.acuity.note', { limit: formatPlain(ACUITY_RETEST_LIMIT_LOGMAR, 2, locale) })}
      </p>
    </section>
  );
}

// ------------------------------------------------------------------- Screen

/** Result: whether it changed, how much, how sure, and what to do. */
export function ResultScreen({ crewId, flightDay }: { crewId: CrewId; flightDay: number }) {
  const t = useMessages(resultMessages);
  const ta = useMessages(appMessages);
  const { locale } = useI18n();
  const member = crewMember(crewId);
  const history = useCrewHistory(crewId);
  const record = findRecord(history, flightDay);
  const explanation = useMemo(() => (record ? explainAssessment(record.assessment, locale) : null), [record, locale]);
  useDocumentTitle(t('title', { day: flightDay, name: member.name }));

  if (!record || !explanation) {
    return <NotFoundScreen message={ta('notFound.record', { name: member.name, day: flightDay })} />;
  }

  // Both eyes share one scale, so the two lines can be compared.
  const domain = unionDomain(
    EYES.map((eye) => changeScaleDomain(todayMark(record, eye), earlierMarks(history, eye, record.flightDay))),
  );
  const baseline = baselineOf(history);
  // An exam says which analysis produced it. Anything other than the measuring engine is said in plain sight.
  const sourceOf = (session: SessionRecord | null): string | undefined =>
    EYES.map((eye) => session?.eyes[eye].accepted?.engineVersion).find(
      (version) => version !== undefined && version !== ENGINE_VERSION,
    );
  const otherSource = sourceOf(record);
  // The same goes for the reference: a change is only as measured as the exam it is counted from.
  const referenceSource = flightDay > 0 && !otherSource ? sourceOf(baseline) : undefined;

  return (
    <div className="screen result">
      <p className="result__eyebrow">
        {flightDay === 0
          ? t('eyebrow.preflight', { name: member.name })
          : t('eyebrow', { name: member.name, day: flightDay })}
        {' · '}
        {record.origin === 'live' ? t('origin.live') : t('origin.precomputed')}
      </p>
      <div className="result__head">
        <ScreenTitle>{explanation.headline}</ScreenTitle>
        {flightDay > 0 && <LevelBadge level={record.assessment.level} size="lg" />}
      </div>
      <div className="result__summary">
        {explanation.summary.map((sentence) => (
          <p key={sentence}>{sentence}</p>
        ))}
      </div>

      {otherSource && <p className="callout callout--caution">{t('source.notImage', { engine: otherSource })}</p>}
      {referenceSource && (
        <p className="callout callout--caution">{t('source.referenceNotImage', { engine: referenceSource })}</p>
      )}

      <section className="screen__section" aria-labelledby="eyes-heading">
        <h2 id="eyes-heading">{t('eyes.heading')}</h2>
        <div className="eye-grid">
          {EYES.map((eye) => (
            <EyeCard key={eye} record={record} history={history} explanation={explanation} eye={eye} domain={domain} t={t} />
          ))}
        </div>
      </section>

      <VisionSection record={record} baseline={baseline} explanation={explanation} t={t} />

      <section className="screen__section" aria-labelledby="next-heading">
        <h2 id="next-heading">{t('next.heading')}</h2>
        <ol className="next-steps">
          {explanation.nextSteps.map((step) => (
            <li key={step.id} className="next-step">
              <p className="next-step__text">{step.text}</p>
              <p className={`basis-tag basis-tag--${step.basis}`}>{t(`next.basis.${step.basis}`)}</p>
              <p className="next-step__why">
                <strong>{t('next.why')}</strong> {step.why}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="screen__section" aria-labelledby="limits-heading">
        <h2 id="limits-heading">{t('limits.heading')}</h2>
        <ul className="limits">
          {explanation.limitations.map((limitation) => (
            <li key={limitation.id}>{limitation.text}</li>
          ))}
        </ul>
        <p>
          <a href={formatRoute({ name: 'brain' })}>{t('limits.brain')}</a>
        </p>
      </section>

      <section className="screen__section" aria-labelledby="actions-heading">
        <h2 id="actions-heading">{t('actions.heading')}</h2>
        <div className="actions">
          <LinkButton to={{ name: 'report', crewId, flightDay }} variant="primary" size="lg">
            {t('actions.report')}
          </LinkButton>
          <LinkButton to={{ name: 'history', crewId }} size="lg">
            {t('actions.history')}
          </LinkButton>
          <AssistantPanel record={record} />
          <LinkButton to={{ name: 'home' }} variant="ghost">
            {t('actions.home')}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
