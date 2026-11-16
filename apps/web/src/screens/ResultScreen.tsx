import { useMemo, useState, type ReactNode } from 'react';
import {
  ENGINE_VERSION,
  QUALITY_MAX_DB,
  QUALITY_POOR_DB,
  ACUITY_RETEST_LIMIT_LOGMAR,
  levelRank,
  type AcuityResult,
  type AmslerResult,
  type CaptureRequest,
  type CrewId,
  type ExamRejection,
  type Eye,
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
  MISSION,
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
import { useAppState } from '../app/StoreContext';
import { ChangeScale, changeScaleDomain, type ScaleMark } from '../charts/ChangeScale';
import { formatChange } from '../charts/format';
import { unionDomain, type Domain } from '../charts/scale';
import { useI18n, useMessages } from '../i18n';
import { appMessages } from '../i18n/app';
import { chartMessages } from '../i18n/charts';
import { commonMessages } from '../i18n/common';
import { historyMessages } from '../i18n/history';
import { resultMessages } from '../i18n/result';
import { LinkAction, LinkButton } from '../shell/LinkButton';
import { ScreenTitle } from '../shell/ScreenTitle';
import { SectionNav } from '../shell/SectionNav';
import { ExamOcular, ExamScan, ExamViewer, OcularLegend, QualityReadouts } from '../slots';
import {
  Action,
  Button,
  Certainty,
  EyeTag,
  Group,
  Icon,
  LevelBadge,
  MissionLine,
  Notice,
  NoticeText,
  OriginSign,
  OriginTag,
  QuantityValue,
  Readout,
  Section,
  Segment,
  Subject,
  jumpToSection,
  levelKind,
  type MissionStop,
} from '../ui';
import { NotFoundScreen } from './NotFoundScreen';

const EYES: readonly Eye[] = ['OD', 'OS'];
const THRESHOLDS = { firstSignUm: TRT_FIRST_SIGN_UM, clinicallyConcerningUm: TRT_CLINICALLY_CONCERNING_UM };
/** Steps shown next to the answer, in the first view; the whole list, with its why, is further down. */
const FIRST_VIEW_STEPS = 2;

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

/** Earlier controls of one eye that have a value: the small hollow discs of the number line. */
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

/** The request of the capture the engine accepted, when the numbers of this eye were measured on an image. */
function measuredRequest(capture: EyeCaptureResult): CaptureRequest | null {
  if (capture.accepted?.engineVersion !== ENGINE_VERSION) return null;
  return [...capture.attempts].reverse().find((attempt) => attempt.status === 'measured')?.request ?? null;
}

/** A text of several sentences, split into them: the first one is the title of a notice. */
function sentences(text: string): string[] {
  return text.split(/(?<=\.)\s+/).filter((sentence) => sentence.length > 0);
}

// ----------------------------------------------------------------- How sure

/** The probability of one threshold as it is written: its word and its number, never 0 % or 100 %. */
function useChance(): (threshold: ThresholdAssessment) => { word: string; percent: string } {
  const { locale } = useI18n();
  const t = useMessages(resultMessages);
  const tc = useMessages(commonMessages);
  return (threshold) => {
    const percent = percentLabel(threshold.probabilityExceeded, threshold.word, locale);
    return {
      word: tc(`likelihood.${threshold.word}`),
      percent:
        percent.kind === 'below'
          ? t('sure.below', { value: percent.text })
          : percent.kind === 'above'
            ? t('sure.above', { value: percent.text })
            : percent.text,
    };
  };
}

/** The threshold the level of an eye rests on: the highest thickness threshold it passed, or the first one when it passed none. */
function decidingThreshold(thresholds: readonly ThresholdAssessment[]): ThresholdAssessment | null {
  const thickness = thresholds.filter((threshold) => threshold.thresholdId !== 'folds-new');
  return [...thickness].reverse().find((threshold) => threshold.exceeded) ?? thickness[0] ?? null;
}

/** How likely it is that the real change is past each limit, for the eyes that were measured: the equivalent table of the two scales. */
function SureTable({ record, eyes, t }: { record: SessionRecord; eyes: readonly Eye[]; t: T }) {
  const tc = useMessages(commonMessages);
  const chance = useChance();
  const ids = [...new Set(eyes.flatMap((eye) => record.assessment.eyes[eye].thresholds.map((threshold) => threshold.thresholdId)))];
  return (
    <div className="co-desliza">
      <table className="co-tabla">
        <thead>
          <tr>
            <th scope="col">{t('sure.limit')}</th>
            {eyes.map((eye) => (
              <th key={eye} scope="col">
                {tc(`eye.${eye}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => {
            const reference = eyes.flatMap((eye) => record.assessment.eyes[eye].thresholds).find((threshold) => threshold.thresholdId === id);
            return (
              <tr key={id}>
                <th scope="row">
                  {t(`sure.threshold.${id}`)}{' '}
                  {reference && (
                    <QuantityValue
                      quantity={reference.threshold}
                      digits={(String(reference.threshold.value).split('.')[1] ?? '').length}
                      showOrigin
                    />
                  )}
                </th>
                {eyes.map((eye) => {
                  const threshold = record.assessment.eyes[eye].thresholds.find((candidate) => candidate.thresholdId === id);
                  if (!threshold) {
                    return (
                      <td key={eye} className="co-apagado">
                        {t('detail.missing')}
                      </td>
                    );
                  }
                  const { word, percent } = chance(threshold);
                  return (
                    <td key={eye} className="es-entera">
                      {t('sure.chance', { word, percent })}
                      <OriginTag origin="estimated" />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------------- Detail

function Cell({ quantity, signed = false, digits }: { quantity: Quantity | null | undefined; signed?: boolean; digits?: number }) {
  const t = useMessages(resultMessages);
  return quantity ? (
    <QuantityValue quantity={quantity} signed={signed} digits={digits} showOrigin />
  ) : (
    <span className="co-apagado">{t('detail.missing')}</span>
  );
}

function Attempts({ capture, t }: { capture: EyeCaptureResult; t: T }) {
  const total = capture.accepted?.quality.totalScans ?? null;
  const reasons = (list: readonly (ExamRejection | ScanRejection)[]): string =>
    list.map((reason) => t(`rejection.${reason}`)).join('; ');
  return (
    <div className="co-pila co-intentos">
      <h4 className="co-micro">{t('attempts.heading')}</h4>
      {capture.attempts.length === 0 ? (
        <p className="co-nota">{t('attempts.none')}</p>
      ) : (
        <ol className="co-lista">
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
    </div>
  );
}

/** Everything that was measured on one eye, next to its pre-flight exam, and how the capture went. */
function EyeDetail({ record, baseline, eye, t }: { record: SessionRecord; baseline: SessionRecord | null; eye: Eye; t: T }) {
  const tc = useMessages(commonMessages);
  const capture = record.eyes[eye];
  const exam = capture.accepted;
  const before = record.flightDay === 0 ? null : (baseline?.eyes[eye].accepted ?? null);
  const change = record.assessment.eyes[eye].change;
  const inFlight = record.flightDay > 0;
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
    <div className="co-pila co-medidas">
      {exam ? (
        <div className="co-desliza">
          <table className="co-tabla">
            <caption>{t('detail.caption', { eye: tc(`eye.${eye}`) })}</caption>
            <thead>
              <tr>
                <th scope="col">{t('detail.measure')}</th>
                <th scope="col" className="es-cifra">
                  {t('detail.today')}
                </th>
                {inFlight && (
                  <th scope="col" className="es-cifra">
                    {t('detail.preflight')}
                  </th>
                )}
                {inFlight && (
                  <th scope="col" className="es-cifra">
                    {t('detail.change')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.name} className={index === 0 ? 'is-hoy' : undefined}>
                  <th scope="row">{row.name}</th>
                  <td className="es-cifra">
                    <Cell quantity={row.today} digits={row.digits} />
                  </td>
                  {inFlight && (
                    <td className="es-cifra">
                      <Cell quantity={row.before} digits={row.digits} />
                    </td>
                  )}
                  {inFlight && (
                    <td className="es-cifra">
                      <Cell quantity={row.change} signed digits={row.digits} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EyeTag eye={eye} />
      )}
      <Attempts capture={capture} t={t} />
      <p className="co-rotulo">
        {t('versions', {
          engine: exam?.engineVersion ?? t('versions.unknown'),
          rules: record.assessment.rulesVersion,
          error: record.assessment.errorModelVersion ?? t('versions.unknown'),
        })}
      </p>
    </div>
  );
}

// ------------------------------------------------------------- Vision tests

function symptomList(answers: SymptomAnswers | null | undefined, t: T): ReactNode {
  if (!answers) return null;
  const present = (Object.keys(answers.answers) as SymptomId[]).filter((id) => answers.answers[id].present);
  if (present.length === 0) return t('vision.symptoms.none');
  return (
    <ul className="co-lista co-lista--lisa">
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
      {result.atScreenFloor && <span className="co-apagado"> ({t('vision.acuity.floor')})</span>}
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
  const notDone = <strong>{t('vision.notDone')}</strong>;
  const notDoneBefore = <span className="co-apagado">{t('vision.notDone.preflight')}</span>;
  const noComparison = <span className="co-apagado">{t('vision.noChange')}</span>;
  const findings = explanation.findings.filter((finding) => FUNCTIONAL_FINDINGS.includes(finding.id));

  return (
    <Section id="vision" title={t('vision.heading')} note={t('vision.lead')}>
      <div className="co-pila co-pila--holgada">
        {findings.length > 0 && (
          <Notice role="group" aria-label={t('vision.findings')} title={findings[0]?.text}>
            {findings.slice(1).map((finding) => (
              <NoticeText key={finding.id}>{finding.text}</NoticeText>
            ))}
          </Notice>
        )}
        <div className="co-desliza">
          <table className="co-tabla">
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
                    {showBefore && <td>{before?.acuity[eye] ? <AcuityCell result={before.acuity[eye]} t={t} /> : notDoneBefore}</td>}
                    {showBefore && (
                      <td>
                        {comparison?.change ? (
                          <>
                            <QuantityValue quantity={comparison.change} signed digits={2} showOrigin />
                            {!comparison.sameCorrection && <span className="co-apagado"> ({t('vision.acuity.correction')})</span>}
                          </>
                        ) : (
                          noComparison
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
                  {showBefore && <td>{before?.amsler[eye] ? <AmslerCell result={before.amsler[eye]} t={t} /> : notDoneBefore}</td>}
                  {showBefore && <td>{noComparison}</td>}
                </tr>
              ))}
              <tr>
                <th scope="row">{t('vision.symptoms')}</th>
                <td>{today?.symptoms ? symptomList(today.symptoms, t) : notDone}</td>
                {showBefore && <td>{before?.symptoms ? symptomList(before.symptoms, t) : notDoneBefore}</td>}
                {showBefore && <td>{noComparison}</td>}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="co-nota">{t('vision.acuity.note', { limit: formatPlain(ACUITY_RETEST_LIMIT_LOGMAR, 2, locale) })}</p>
      </div>
    </Section>
  );
}

// ------------------------------------------------------------------- Screen

/** Result: whether it changed, how much, how sure, and what to do. */
export function ResultScreen({ crewId, flightDay }: { crewId: CrewId; flightDay: number }) {
  const t = useMessages(resultMessages);
  const ta = useMessages(appMessages);
  const tc = useMessages(commonMessages);
  const th = useMessages(historyMessages);
  const tch = useMessages(chartMessages);
  const { locale } = useI18n();
  const { missionDay } = useAppState();
  const chance = useChance();
  const member = crewMember(crewId);
  const history = useCrewHistory(crewId);
  const record = findRecord(history, flightDay);
  const explanation = useMemo(() => (record ? explainAssessment(record.assessment, locale) : null), [record, locale]);
  useDocumentTitle(t('title', { day: flightDay, name: member.name }));

  // The eye the answer is about comes first: the one with the higher level, the right one when they are level.
  const rank = (eye: Eye): number => {
    const assessment = record?.assessment.eyes[eye];
    return assessment?.measured && assessment.level ? levelRank(assessment.level) : -1;
  };
  const [chosen, setChosen] = useState<Eye | null>(null);
  const selected: Eye = chosen ?? (rank('OS') > rank('OD') ? 'OS' : 'OD');
  const [viewerEye, setViewerEye] = useState<Eye | null>(null);

  if (!record || !explanation) {
    return <NotFoundScreen message={ta('notFound.record', { name: member.name, day: flightDay })} />;
  }

  const inFlight = flightDay > 0;
  // Both eyes share one scale, so the two lines can be compared.
  const domain: Domain = unionDomain(
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
  const referenceSource = inFlight && !otherSource ? sourceOf(baseline) : undefined;
  const provisional = isProvisionalErrorModel(record.assessment.errorModelVersion);
  const modelNote = sentences(provisional ? t('sure.provisional') : t('sure.simulatedModel'));

  const requests = { OD: measuredRequest(record.eyes.OD), OS: measuredRequest(record.eyes.OS) };
  const viewerEyes = EYES.filter((eye) => requests[eye] !== null);
  const sureEyes = EYES.filter((eye) => record.assessment.eyes[eye].measured && record.assessment.eyes[eye].thresholds.length > 0);
  const steps = explanation.nextSteps;
  const summary = explanation.summary;
  const openViewer = (eye: Eye): void => {
    setViewerEye(eye);
    jumpToSection('visor');
  };

  // ---- The mission on one line: every control on its day, with its level; today; the next scan; the return.
  const levelName = (session: SessionRecord): string =>
    session.assessment.level === null ? tc('level.not-measured') : tc(`level.${session.assessment.level}`);
  const last = history.at(-1);
  const stops: MissionStop[] = history.map((session) => ({
    day: session.flightDay,
    point: { kind: 'level', level: session.flightDay === 0 ? 'none' : levelKind(session.assessment.level) },
    mark: session.flightDay === 0 ? tc('preflight') : session.flightDay === missionDay ? tch('history.today') : undefined,
    label: session.flightDay > 0 ? tc('flightDay.short', { day: session.flightDay }) : undefined,
    current: session.flightDay === flightDay,
    name:
      session.flightDay === 0
        ? th('control.preflight')
        : `${tc('flightDay', { day: session.flightDay })}${session.flightDay === missionDay ? `, ${tch('history.today')}` : ''}: ${levelName(session)}`,
    href: formatRoute({ name: 'result', crewId, flightDay: session.flightDay }),
  }));
  if (last && missionDay > last.flightDay) {
    stops.push({
      day: missionDay,
      point: { kind: 'level', level: 'unmeasured' },
      mark: tch('history.today'),
      label: tc('flightDay.short', { day: missionDay }),
      name: `${tc('flightDay', { day: missionDay })}, ${tch('history.today')}: ${ta('nav.control')}`,
      href: formatRoute({ name: 'session', crewId }),
    });
  }
  const nextDay = last?.assessment.nextOct?.flightDay;
  if (nextDay !== undefined && nextDay < MISSION.durationDays && !stops.some((stop) => stop.day === nextDay)) {
    stops.push({
      day: nextDay,
      point: { kind: 'level', level: 'unmeasured' },
      label: tc('flightDay.short', { day: nextDay }),
      name: `${tc('flightDay', { day: nextDay })}: ${tch('history.next')}`,
    });
  }
  stops.push({
    day: MISSION.durationDays,
    point: { kind: 'end' },
    mark: tc('mission.return'),
    name: `${tc('flightDay', { day: MISSION.durationDays })}: ${tc('mission.return')}`,
  });
  stops.sort((a, b) => a.day - b.day);

  /** The figure of one eye, under its ocular: its change with its range or, on the reference exam, its thickness. */
  const heroOf = (eye: Eye): ReactNode => {
    const today = todayMark(record, eye);
    if (today) {
      const value = today.change.value;
      const range = today.change.interval95;
      const end = (limit: number): string =>
        range && range[0] >= 0 && range[1] >= 0 ? formatChange(limit, THRESHOLDS, locale, value).replace(/^\+/, '') : formatChange(limit, THRESHOLDS, locale, value);
      return (
        <Readout
          size="hero"
          value={formatChange(value, THRESHOLDS, locale)}
          unit={today.change.unit}
          sub={range ? tch('range', { low: end(range[0]), high: end(range[1]) }) : undefined}
          label={th('eye.change')}
          origin={today.change.origin}
        />
      );
    }
    const thickness = !inFlight ? record.eyes[eye].accepted?.trtRingUm : null;
    if (thickness) {
      return <Readout size="hero" value={formatPlain(thickness.value, 0, locale)} unit={thickness.unit} label={th('eye.thickness')} origin={thickness.origin} />;
    }
    return null;
  };

  return (
    <>
      <div className="co-cabina">
        <section className="co-velo co-velo--izq co-cabina__lado" aria-labelledby="respuesta">
          <Subject
            name={member.name}
            role={member.role[locale]}
            state={
              <>
                {record.origin === 'live' ? <OriginSign origin="measured" /> : <Icon name="history" />}
                {record.origin === 'live' ? t('origin.live') : t('origin.precomputed')}
              </>
            }
          />
          <Group icon="anillo" title={t('answer.heading')} className="co-cabina__respuesta">
            {inFlight && <LevelBadge level={record.assessment.level} size="lg" />}
            <ScreenTitle className="co-texto" id="respuesta">
              {explanation.headline}
            </ScreenTitle>
          </Group>
          {otherSource && <Notice title={t('source.notImage', { engine: otherSource })} />}
          {referenceSource && <Notice title={t('source.referenceNotImage', { engine: referenceSource })} />}
          <Group icon="list-checks" title={t('next.heading')}>
            <ol className="co-pasos">
              {steps.slice(0, FIRST_VIEW_STEPS).map((step) => (
                <li key={step.id} className="co-paso">
                  <p className="co-paso__texto">{step.text}</p>
                  <p className={`co-base co-base--${step.basis}`}>{t(`next.basis.${step.basis}`)}</p>
                </li>
              ))}
            </ol>
            <Action icon="arrow-down" size="sm" onClick={() => jumpToSection('pasos')}>
              {t('next.all', { n: steps.length })}
            </Action>
          </Group>
          <div className="co-grupo">
            <p className="co-grupo__fuente">{summary.at(-1)}</p>
          </div>
        </section>

        <div className="co-cabina__escena">
          <Segment<Eye>
            className="co-cabina__selector co-halo"
            label={t('eyes.heading')}
            options={EYES.map((eye) => ({ value: eye, label: tc(`eye.${eye}`) }))}
            value={selected}
            onChange={setChosen}
          />
          <div className="co-cabina__ojos">
            {EYES.map((eye) => {
              const assessment = record.assessment.eyes[eye];
              return (
                <ExamOcular
                  key={eye}
                  request={requests[eye]}
                  exam={record.eyes[eye].accepted}
                  baseline={inFlight ? (baseline?.eyes[eye].accepted ?? null) : null}
                  level={inFlight ? (assessment.measured ? levelKind(assessment.level) : 'unmeasured') : null}
                  selected={selected === eye}
                  onSelect={() => setChosen(eye)}
                  head={
                    <>
                      <EyeTag eye={eye} />
                      {inFlight && <LevelBadge level={assessment.measured ? assessment.level : null} />}
                      {assessment.findings.includes('folds-new') && (
                        <span className="co-ocular__hallazgo">
                          <Icon name="corte" />
                          {t('finding.folds')}
                        </span>
                      )}
                    </>
                  }
                  foot={heroOf(eye)}
                  empty={assessment.measured ? undefined : explanation.eyes[eye].headline}
                />
              );
            })}
          </div>
          {viewerEyes.length > 0 && (
            <div className="co-halo co-cabina__leyenda">
              <OcularLegend />
            </div>
          )}
          <div className="co-cabina__mision co-halo">
            <MissionLine label={MISSION.name} durationDays={MISSION.durationDays} stops={stops} />
          </div>
        </div>

        {EYES.map((eye) => {
          const assessment = record.assessment.eyes[eye];
          const capture = record.eyes[eye];
          const today = todayMark(record, eye);
          const deciding = assessment.measured ? decidingThreshold(assessment.thresholds) : null;
          return (
            <aside
              key={eye}
              className="co-velo co-velo--der co-cabina__lado"
              aria-label={`${t('sure.heading')}, ${tc(`eye.${eye}`)}`}
              hidden={eye !== selected}
            >
              {assessment.measured && today && (
                <Group icon="target" title={`${t('sure.heading')} · ${tc(`eye.${eye}`)}`} className="sure">
                  <ChangeScale
                    eye={eye}
                    today={today}
                    previous={earlierMarks(history, eye, record.flightDay)}
                    thresholds={THRESHOLDS}
                    domain={domain}
                  />
                  {deciding && (
                    <Certainty
                      word={deciding.word}
                      wordText={chance(deciding).word}
                      percent={chance(deciding).percent}
                      label={t(`sure.threshold.${deciding.thresholdId}`)}
                    />
                  )}
                </Group>
              )}
              {!assessment.measured && (
                <Group icon={eye === 'OD' ? 'ojo-derecho' : 'ojo-izquierdo'} title={tc(`eye.${eye}`)}>
                  <Notice kind="unmeasured" title={explanation.eyes[eye].headline}>
                    {explanation.eyes[eye].lines.map((line) => (
                      <NoticeText key={line}>{line}</NoticeText>
                    ))}
                  </Notice>
                </Group>
              )}
              {capture.accepted && (
                <Group
                  icon="gauge"
                  title={inFlight || !assessment.measured ? t('sure.quality') : `${t('sure.quality')} · ${tc(`eye.${eye}`)}`}
                  source={t('sure.quality.scale', { max: QUALITY_MAX_DB, poor: QUALITY_POOR_DB })}
                >
                  <QualityReadouts exam={capture.accepted} />
                </Group>
              )}
              <ExamScan request={requests[eye]} onOpenViewer={() => openViewer(eye)} />
              {assessment.measured && today && (
                <div className="co-grupo">
                  <p className="co-grupo__fuente">{modelNote[0]}</p>
                </div>
              )}
            </aside>
          );
        })}
      </div>

      <div className="co-detalle co-velo">
        <Section id="pasos" title={t('next.heading')}>
          <ol className="co-pasos">
            {steps.map((step) => (
              <li key={step.id} className="co-paso">
                <p className="co-paso__texto">{step.text}</p>
                <p className={`co-base co-base--${step.basis} basis-tag--${step.basis}`}>{t(`next.basis.${step.basis}`)}</p>
                <details className="co-paso__porque">
                  <summary>
                    {t('next.why').replace(/:$/, '')} <Icon name="chevron-down" />
                  </summary>
                  <p>{step.why}</p>
                </details>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="ojos" title={t('eyes.heading')}>
          <div className="co-pila co-pila--holgada">
            {summary.length > 1 && (
              <div className="co-pila">
                {summary.slice(0, -1).map((sentence) => (
                  <p key={sentence} className="co-texto">
                    {sentence}
                  </p>
                ))}
              </div>
            )}
            <div className="co-columnas co-columnas--dos">
              {EYES.map((eye) => (
                <article key={eye} className="co-pila">
                  <EyeTag eye={eye} />
                  <h3 className="co-subtitulo">{explanation.eyes[eye].headline}</h3>
                  <ul className="co-lista">
                    {explanation.eyes[eye].lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </Section>

        {sureEyes.length > 0 && (
          <Section id="seguro" title={t('sure.heading')} note={t('sure.lead')}>
            <div className="co-pila co-pila--holgada">
              <SureTable record={record} eyes={sureEyes} t={t} />
              <Notice title={modelNote[0]}>
                <NoticeText>
                  {[...modelNote.slice(1), t('sure.range')].join(' ')}
                </NoticeText>
              </Notice>
            </div>
          </Section>
        )}

        <VisionSection record={record} baseline={baseline} explanation={explanation} t={t} />

        {viewerEyes.length > 0 && (
          <Section id="visor" title={t('viewer.summary')} note={t('viewer.note')} stacked={viewerEye !== null}>
            <div className="co-pila co-pila--holgada">
              <div className="co-fila" role="group" aria-label={t('eyes.heading')}>
                {viewerEyes.map((eye) => (
                  <Button
                    key={eye}
                    icon="layers"
                    variant={viewerEye === eye ? 'primary' : 'secondary'}
                    aria-pressed={viewerEye === eye}
                    data-viewer-eye={eye}
                    onClick={() => setViewerEye(viewerEye === eye ? null : eye)}
                  >
                    {tc(`eye.${eye}`)}
                  </Button>
                ))}
              </div>
              {viewerEye && requests[viewerEye] && (
                <ExamViewer
                  key={viewerEye}
                  request={requests[viewerEye] as CaptureRequest}
                  baseline={inFlight ? (baseline?.eyes[viewerEye].accepted ?? undefined) : undefined}
                />
              )}
            </div>
          </Section>
        )}

        <Section id="medidas" title={t('detail.summary')}>
          <div className="co-pila co-pila--holgada">
            {EYES.map((eye) => (
              <EyeDetail key={eye} record={record} baseline={baseline} eye={eye} t={t} />
            ))}
          </div>
        </Section>

        <Section id="limites" title={t('limits.heading')}>
          <div className="co-pila co-pila--holgada co-pila--inicio">
            <ul className="co-limites">
              {explanation.limitations.map((limitation) => (
                <li key={limitation.id}>
                  <OriginSign origin="not-measurable" />
                  <span>{limitation.text}</span>
                </li>
              ))}
            </ul>
            <LinkAction to={{ name: 'brain' }} icon="brain">
              {t('limits.brain')}
            </LinkAction>
            <LinkButton to={{ name: 'report', crewId, flightDay }} variant="primary" size="lg" iconEnd="arrow-right" className="no-print">
              {t('actions.report')}
            </LinkButton>
            <LinkAction to={{ name: 'home' }} icon="house" size="sm" className="no-print">
              {t('actions.home')}
            </LinkAction>
          </div>
        </Section>
      </div>

      <SectionNav crewId={crewId} current="result" flightDay={flightDay} record={record} />
    </>
  );
}
