import { useState } from 'react';
import type { CrewId, Eye, Level, SessionRecord } from '@app/core';
import { MISSION, TRT_CLINICALLY_CONCERNING_UM, TRT_FIRST_SIGN_UM } from '../app/core';
import { formatFlightDate } from '../app/dates';
import { baselineOf, changePoints, findRecord, inFlightControls, lastControl } from '../app/history';
import { crewMember, useCrewHistory, useDocumentTitle } from '../app/hooks';
import { findDraft } from '../app/store';
import { useAppState } from '../app/StoreContext';
import { formatChange } from '../charts/format';
import { HistoryChart } from '../charts/HistoryChart';
import { useI18n, useMessages } from '../i18n';
import { commonMessages } from '../i18n/common';
import { historyMessages } from '../i18n/history';
import { LinkAction, LinkButton } from '../shell/LinkButton';
import { ScreenTitle } from '../shell/ScreenTitle';
import { SectionNav } from '../shell/SectionNav';
import { EyePair, Group, Icon, LevelBadge, OriginSign, QuantityValue, Readout, Section, Subject } from '../ui';

const EYES: readonly Eye[] = ['OD', 'OS'];
const THRESHOLDS = { firstSignUm: TRT_FIRST_SIGN_UM, clinicallyConcerningUm: TRT_CLINICALLY_CONCERNING_UM };

type T = ReturnType<typeof useMessages<keyof (typeof historyMessages)['en']>>;

function attemptsText(count: number, t: T): string {
  if (count === 0) return t('eye.attempts.none');
  return count === 1 ? t('eye.attempts.one') : t('eye.attempts.many', { count });
}

/** One eye at one control: its change with its range and how it was obtained, the capture quality and the attempts. */
function EyeCell({ record, eye, t }: { record: SessionRecord; eye: Eye; t: T }) {
  const assessment = record.assessment.eyes[eye];
  const capture = record.eyes[eye];
  const change = assessment.measured ? assessment.change?.trtRingUm : undefined;
  const quality = capture.accepted?.quality;
  const preflight = record.flightDay === 0;
  return (
    <td className="es-cifra">
      <span className="co-tabla__celda">
        {preflight && capture.accepted?.trtRingUm ? (
          <span>
            <span className="co-oculto">{t('eye.thickness')}: </span>
            <QuantityValue quantity={capture.accepted.trtRingUm} showOrigin />
          </span>
        ) : change ? (
          <span>
            <span className="co-oculto">{t('eye.change')}: </span>
            <QuantityValue quantity={change} signed showOrigin />
          </span>
        ) : (
          <span className="co-apagado">{t('eye.unmeasured')}</span>
        )}
        {/* Two facts that may fall on two lines, never broken in the middle. */}
        <span className="co-rotulo co-tabla__apoyo">
          {quality && (
            <>
              <span className="co-entero">
                {t('eye.quality')}:{' '}
                <QuantityValue quantity={{ value: quality.meanQualityDb, unit: 'dB', origin: 'measured' }} digits={0} />
              </span>
              {' · '}
            </>
          )}
          <span className="co-entero">{attemptsText(capture.attempts.length, t)}</span>
        </span>
      </span>
    </td>
  );
}

/** A row that is a control: its name and, under it, its level and where it comes from; each eye; both eyes at a glance; and what opens it. */
function ControlRow({ record, today, t }: { record: SessionRecord; today: boolean; t: T }) {
  const { locale } = useI18n();
  const preflight = record.flightDay === 0;
  const eyeLevel = (eye: Eye): Level | null => {
    const assessment = record.assessment.eyes[eye];
    return assessment.measured ? assessment.level : null;
  };
  return (
    <tr className={today ? 'is-hoy' : undefined}>
      <th scope="row">
        <span className="co-tabla__control">
          <span>
            {preflight ? t('control.preflight') : t('control.title', { day: record.flightDay })}
            {today && ` · ${t('control.today')}`}
            {!preflight && <span className="co-apagado"> · {formatFlightDate(MISSION, record.flightDay, locale)}</span>}
          </span>
          {preflight ? <span className="co-rotulo">{t('control.preflight.text')}</span> : <LevelBadge level={record.assessment.level} />}
          {/* Where a control comes from: done here, or part of the history that came with the application. */}
          <span className={`co-rotulo origin-mark origin-mark--${record.origin}`}>
            {record.origin === 'live' ? <OriginSign origin="measured" /> : <Icon name="history" />}
            {record.origin === 'live' ? t('origin.live') : t('origin.precomputed')}
          </span>
        </span>
      </th>
      {EYES.map((eye) => (
        <EyeCell key={eye} record={record} eye={eye} t={t} />
      ))}
      <td>{!preflight && <EyePair levels={{ OD: eyeLevel('OD'), OS: eyeLevel('OS') }} />}</td>
      <td>
        <LinkAction to={{ name: 'result', crewId: record.crewId, flightDay: record.flightDay }} icon="arrow-right" size="sm" hideLabel>
          {preflight ? t('control.open.preflight') : t('control.open.label', { day: record.flightDay })}
        </LinkAction>
      </td>
    </tr>
  );
}

/** History: how each eye has been evolving. */
export function HistoryScreen({ crewId }: { crewId: CrewId }) {
  const t = useMessages(historyMessages);
  const tc = useMessages(commonMessages);
  const { locale } = useI18n();
  const state = useAppState();
  const member = crewMember(crewId);
  const history = useCrewHistory(crewId);
  const [shown, setShown] = useState<readonly Eye[]>(EYES);
  useDocumentTitle(t('title', { name: member.name }));

  const controls = [...inFlightControls(history)].reverse();
  const baseline = baselineOf(history);
  const last = lastControl(history);
  const todayRecord = findRecord(history, state.missionDay);
  const draft = findDraft(state, crewId, state.missionDay);
  const toggle = (eye: Eye): void =>
    setShown((current) => {
      const next = current.includes(eye) ? current.filter((other) => other !== eye) : [...current, eye];
      // At least one eye stays on: an empty chart says nothing.
      return next.length === 0 ? current : next;
    });

  return (
    <>
      <div className="co-cabina co-cabina--dos">
        <section className="co-velo co-velo--izq co-cabina__lado" aria-label={t('list.heading')}>
          <Subject name={member.name} role={member.role[locale]} />
          {last ? (
            <Group
              icon="anillo"
              title={`${tc('flightDay', { day: last.flightDay })}${last.flightDay === state.missionDay ? ` · ${t('control.today')}` : ''}`}
              source={`${t('eye.change')}. ${t('eye.thickness')}.`}
              className="co-cabina__respuesta"
            >
              <LevelBadge level={last.assessment.level} size="lg" />
              <div className="co-lecturas">
                {EYES.map((eye) => {
                  const assessment = last.assessment.eyes[eye];
                  const change = assessment.measured ? assessment.change?.trtRingUm : undefined;
                  if (!change) return <Readout key={eye} size="words" value={tc('level.not-measured')} label={tc(`eye.${eye}`)} />;
                  const range = change.interval95;
                  const end = (value: number): string => formatChange(value, THRESHOLDS, locale, change.value);
                  return (
                    <Readout
                      key={eye}
                      value={formatChange(change.value, THRESHOLDS, locale)}
                      unit={change.unit}
                      sub={range ? tc('range.to', { low: end(range[0]), high: end(range[1]) }) : undefined}
                      label={tc(`eye.${eye}`)}
                      origin={change.origin}
                    />
                  );
                })}
              </div>
            </Group>
          ) : (
            <div className="co-grupo">
              <p className="co-grupo__fuente">{t('list.empty')}</p>
            </div>
          )}
          <Group icon="arrow-right" title={t('actions.heading')}>
            <div className="co-pila co-pila--inicio">
              {todayRecord && !draft ? (
                <LinkButton to={{ name: 'result', crewId, flightDay: state.missionDay }} variant="primary">
                  {t('actions.result')}
                </LinkButton>
              ) : (
                <LinkButton to={{ name: 'session', crewId }} variant="primary">
                  {draft ? t('actions.resume') : t('actions.start')}
                </LinkButton>
              )}
              <LinkAction to={{ name: 'home' }} icon="house" size="sm">
                {t('actions.home')}
              </LinkAction>
            </div>
          </Group>
        </section>

        <div className="co-cabina__escena co-cabina__escena--ancha">
          <div className="co-seccion__cabeza co-halo">
            <ScreenTitle className="co-micro">{t('title', { name: member.name })}</ScreenTitle>
            <p className="co-subtitulo">{t('lead', { day: state.missionDay })}</p>
          </div>
          <section className="co-halo co-grafico-caja" aria-labelledby="chart-heading">
            <h2 id="chart-heading" className="co-micro">
              {t('chart.heading')}
            </h2>
            <fieldset className="co-casillas co-casillas--fila">
              <legend className="co-rotulo">{t('chart.eyes')}</legend>
              {EYES.map((eye) => (
                <label key={eye} className="co-casilla">
                  <input type="checkbox" checked={shown.includes(eye)} onChange={() => toggle(eye)} />
                  {tc(`eye.${eye}`)}
                </label>
              ))}
            </fieldset>
            <HistoryChart
              points={{ OD: changePoints(history, 'OD'), OS: changePoints(history, 'OS') }}
              eyes={shown}
              mission={MISSION}
              thresholds={THRESHOLDS}
              currentDay={state.missionDay}
              nextScanDay={last?.assessment.nextOct?.flightDay ?? null}
            />
          </section>
        </div>
      </div>

      <div className="co-detalle co-velo">
        <Section id="controles" title={t('list.heading')} stacked>
          {controls.length === 0 && <p className="co-nota">{t('list.empty')}</p>}
          <div className="co-desliza">
            <table className="co-tabla co-tabla--controles">
              <caption>{t('eye.change')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('control.title', { day: '' }).trim()}</th>
                  {EYES.map((eye) => (
                    <th key={eye} scope="col" className="es-cifra">
                      {tc(`eye.${eye}`)}
                    </th>
                  ))}
                  <th scope="col">
                    <span className="co-oculto">{tc('table.bothEyes')}</span>
                  </th>
                  <th scope="col">
                    <span className="co-oculto">{t('control.open')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {controls.map((record) => (
                  <ControlRow key={record.flightDay} record={record} today={record.flightDay === state.missionDay} t={t} />
                ))}
                {baseline && <ControlRow record={baseline} today={false} t={t} />}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <SectionNav crewId={crewId} current="history" record={last} />
    </>
  );
}
