import { useState } from 'react';
import type { CrewId, Eye, SessionRecord } from '@app/core';
import { MISSION, TRT_CLINICALLY_CONCERNING_UM, TRT_FIRST_SIGN_UM } from '../app/core';
import { formatFlightDate } from '../app/dates';
import { baselineOf, changePoints, findRecord, inFlightControls, lastControl } from '../app/history';
import { crewMember, useCrewHistory, useDocumentTitle } from '../app/hooks';
import { findDraft } from '../app/store';
import { useAppState } from '../app/StoreContext';
import { HistoryChart } from '../charts/HistoryChart';
import { useI18n, useMessages } from '../i18n';
import { commonMessages } from '../i18n/common';
import { historyMessages } from '../i18n/history';
import { LinkButton } from '../shell/LinkButton';
import { ScreenTitle } from '../shell/ScreenTitle';
import { AssistantPanel } from '../slots';
import { Card, LevelBadge, QuantityValue } from '../ui';

const EYES: readonly Eye[] = ['OD', 'OS'];
const THRESHOLDS = { firstSignUm: TRT_FIRST_SIGN_UM, clinicallyConcerningUm: TRT_CLINICALLY_CONCERNING_UM };

type T = ReturnType<typeof useMessages<keyof (typeof historyMessages)['en']>>;

function attemptsText(count: number, t: T): string {
  if (count === 0) return t('eye.attempts.none');
  return count === 1 ? t('eye.attempts.one') : t('eye.attempts.many', { count });
}

/** One eye at one control: level, change with its range, capture quality and attempts. */
function EyeRow({ record, eye, t }: { record: SessionRecord; eye: Eye; t: T }) {
  const tc = useMessages(commonMessages);
  const assessment = record.assessment.eyes[eye];
  const capture = record.eyes[eye];
  const change = assessment.measured ? assessment.change?.trtRingUm : undefined;
  const quality = capture.accepted?.quality;
  const preflight = record.flightDay === 0;
  return (
    <div className="control__eye">
      <dt>{tc(`eye.${eye}`)}</dt>
      <dd>
        {!preflight && <LevelBadge level={assessment.measured ? assessment.level : null} />}
        {preflight && capture.accepted?.trtRingUm ? (
          <span>
            {t('eye.thickness')}: <QuantityValue quantity={capture.accepted.trtRingUm} showOrigin />
          </span>
        ) : change ? (
          <span>
            {t('eye.change')}: <QuantityValue quantity={change} signed showOrigin />
          </span>
        ) : (
          <span>{t('eye.unmeasured')}</span>
        )}
        <span className="note">
          {quality && (
            <>
              {t('eye.quality')}:{' '}
              <QuantityValue quantity={{ value: quality.meanQualityDb, unit: 'dB', origin: 'measured' }} digits={0} />
              {' · '}
            </>
          )}
          {attemptsText(capture.attempts.length, t)}
        </span>
      </dd>
    </div>
  );
}

function ControlCard({ record, today, t }: { record: SessionRecord; today: boolean; t: T }) {
  const { locale } = useI18n();
  const preflight = record.flightDay === 0;
  return (
    <Card as="article" className="control">
      <header className="control__head">
        <h3 className="card__title">
          {preflight ? t('control.preflight') : t('control.title', { day: record.flightDay })}
          {today && <span className="control__today"> · {t('control.today')}</span>}
        </h3>
        {!preflight && <span className="note">{formatFlightDate(MISSION, record.flightDay, locale)}</span>}
        {!preflight && <LevelBadge level={record.assessment.level} />}
        <span className={`origin-mark origin-mark--${record.origin}`}>
          {record.origin === 'live' ? t('origin.live') : t('origin.precomputed')}
        </span>
      </header>
      {preflight && <p className="note">{t('control.preflight.text')}</p>}
      <dl className="control__eyes">
        {EYES.map((eye) => (
          <EyeRow key={eye} record={record} eye={eye} t={t} />
        ))}
      </dl>
      <div className="actions">
        <LinkButton
          to={{ name: 'result', crewId: record.crewId, flightDay: record.flightDay }}
          aria-label={preflight ? t('control.open.preflight') : t('control.open.label', { day: record.flightDay })}
        >
          {preflight ? t('control.open.preflight') : t('control.open')}
        </LinkButton>
      </div>
    </Card>
  );
}

/** History: how each eye has been evolving. */
export function HistoryScreen({ crewId }: { crewId: CrewId }) {
  const t = useMessages(historyMessages);
  const tc = useMessages(commonMessages);
  const state = useAppState();
  const member = crewMember(crewId);
  const history = useCrewHistory(crewId);
  const [shown, setShown] = useState<readonly Eye[]>(EYES);
  useDocumentTitle(t('title', { name: member.name }));

  const controls = [...inFlightControls(history)].reverse();
  const baseline = baselineOf(history);
  const todayRecord = findRecord(history, state.missionDay);
  const draft = findDraft(state, crewId, state.missionDay);
  const toggle = (eye: Eye): void =>
    setShown((current) => {
      const next = current.includes(eye) ? current.filter((other) => other !== eye) : [...current, eye];
      // At least one eye stays on: an empty chart says nothing.
      return next.length === 0 ? current : next;
    });

  return (
    <div className="screen history">
      <ScreenTitle>{t('title', { name: member.name })}</ScreenTitle>
      <p className="lead">{t('lead', { day: state.missionDay })}</p>

      <section className="screen__section" aria-labelledby="chart-heading">
        <h2 id="chart-heading">{t('chart.heading')}</h2>
        <fieldset className="eye-toggle">
          <legend>{t('chart.eyes')}</legend>
          {EYES.map((eye) => (
            <label key={eye} className="eye-toggle__option">
              <input type="checkbox" checked={shown.includes(eye)} onChange={() => toggle(eye)} />
              {tc(`eye.${eye}`)}
            </label>
          ))}
        </fieldset>
        <Card as="div">
          <HistoryChart
            points={{ OD: changePoints(history, 'OD'), OS: changePoints(history, 'OS') }}
            eyes={shown}
            mission={MISSION}
            thresholds={THRESHOLDS}
            currentDay={state.missionDay}
          />
        </Card>
      </section>

      <section className="screen__section" aria-labelledby="list-heading">
        <h2 id="list-heading">{t('list.heading')}</h2>
        {controls.length === 0 && <p>{t('list.empty')}</p>}
        <ol className="controls">
          {controls.map((record) => (
            <li key={record.flightDay}>
              <ControlCard record={record} today={record.flightDay === state.missionDay} t={t} />
            </li>
          ))}
          {baseline && (
            <li>
              <ControlCard record={baseline} today={false} t={t} />
            </li>
          )}
        </ol>
      </section>

      <section className="screen__section" aria-labelledby="history-actions">
        <h2 id="history-actions">{t('actions.heading')}</h2>
        <div className="actions">
          {todayRecord && !draft ? (
            <LinkButton to={{ name: 'result', crewId, flightDay: state.missionDay }} variant="primary" size="lg">
              {t('actions.result')}
            </LinkButton>
          ) : (
            <LinkButton to={{ name: 'session', crewId }} variant="primary" size="lg">
              {draft ? t('actions.resume') : t('actions.start')}
            </LinkButton>
          )}
          <AssistantPanel record={lastControl(history)} />
          <LinkButton to={{ name: 'home' }} variant="ghost">
            {t('actions.home')}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
