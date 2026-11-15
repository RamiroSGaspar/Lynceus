import { useId, useState } from 'react';
import { PRODUCT, type CrewMember } from '@app/core';
import { CREW, MISSION } from '../app/core';
import { formatFlightDate } from '../app/dates';
import { lastControl } from '../app/history';
import { useCrewHistory, useDocumentTitle } from '../app/hooks';
import { formatRoute } from '../app/routes';
import { STEP_IDS } from '../app/session';
import { findDraft, findLiveRecord, hasSavedData, withMissionDay } from '../app/store';
import { useAppState, useAppStore } from '../app/StoreContext';
import { useI18n, useMessages } from '../i18n';
import { commonMessages } from '../i18n/common';
import { homeMessages } from '../i18n/home';
import { LinkButton } from '../shell/LinkButton';
import { ScreenTitle } from '../shell/ScreenTitle';
import { Button, Card, LevelBadge } from '../ui';

/** Choosing the mission day is "travelling" to that control. */
function MissionDayPicker() {
  const t = useMessages(homeMessages);
  const tc = useMessages(commonMessages);
  const { locale, formatNumber } = useI18n();
  const store = useAppStore();
  const { missionDay } = useAppState();
  const helpId = useId();
  const days = MISSION.routineControlDays;
  const list = new Intl.ListFormat(locale, { type: 'conjunction' }).format(days.map((day) => formatNumber(day)));
  return (
    <fieldset className="day-picker" aria-describedby={helpId}>
      <legend className="day-picker__legend">{t('day.legend')}</legend>
      <div className="day-picker__options">
        {days.map((day) => (
          <label key={day} className="day-option">
            <input
              type="radio"
              name="mission-day"
              value={day}
              checked={day === missionDay}
              onChange={() => store.update((state) => withMissionDay(state, day))}
            />
            <span className="day-option__text">
              <span className="day-option__day">{tc('flightDay', { day })}</span>
              <span className="day-option__date">{formatFlightDate(MISSION, day, locale)}</span>
            </span>
          </label>
        ))}
      </div>
      <p id={helpId} className="day-picker__help">
        {t('day.help', { days: list })}
      </p>
    </fieldset>
  );
}

function CrewCard({ member }: { member: CrewMember }) {
  const t = useMessages(homeMessages);
  const tc = useMessages(commonMessages);
  const { locale } = useI18n();
  const state = useAppState();
  const history = useCrewHistory(member.id);
  const last = lastControl(history);
  const done = findLiveRecord(state, member.id, state.missionDay);
  const draft = findDraft(state, member.id, state.missionDay);
  const headingId = useId();

  const status = done
    ? t('card.status.done')
    : draft
      ? t('card.status.inProgress', { step: draft.stepIndex + 1, total: STEP_IDS.length })
      : t('card.status.notStarted');
  const action = done ? t('card.result') : draft ? t('card.resume') : t('card.start');

  return (
    <Card as="article" className="crew-card" eyebrow={member.role[locale]}>
      <h3 id={headingId} className="card__title">
        {member.name}
      </h3>
      <dl className="crew-card__facts">
        <div>
          <dt>{t('card.last')}</dt>
          <dd>
            {last ? (
              <>
                <LevelBadge level={last.assessment.level} />
                <span className="crew-card__day">
                  {tc('flightDay', { day: last.flightDay })}
                  {last.origin === 'live' && ` · ${t('card.last.here')}`}
                </span>
              </>
            ) : (
              t('card.last.none')
            )}
          </dd>
        </div>
        <div>
          <dt>
            {t('card.today')} · {tc('flightDay', { day: state.missionDay })}
          </dt>
          <dd>
            <span>{t('card.today.routine')}</span>
            <span className="crew-card__status">{status}</span>
          </dd>
        </div>
      </dl>
      <div className="actions">
        <LinkButton
          to={done ? { name: 'result', crewId: member.id, flightDay: state.missionDay } : { name: 'session', crewId: member.id }}
          variant="primary"
          size="lg"
          aria-label={t('card.for', { action, name: member.name })}
        >
          {action}
        </LinkButton>
        <LinkButton
          to={{ name: 'history', crewId: member.id }}
          aria-label={t('card.for', { action: t('card.history'), name: member.name })}
        >
          {t('card.history')}
        </LinkButton>
      </div>
    </Card>
  );
}

/** What is saved in this browser, and the way to delete it. */
function SavedData() {
  const t = useMessages(homeMessages);
  const { formatNumber } = useI18n();
  const store = useAppStore();
  const state = useAppState();
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const saved = hasSavedData(state);
  return (
    <section className="screen__section" aria-labelledby="storage-heading">
      <h2 id="storage-heading">{t('storage.heading')}</h2>
      <p>{t('storage.local')}</p>
      {!store.isPersistent() && <p className="callout callout--caution">{t('storage.notPersistent')}</p>}
      {store.loadStatus === 'discarded' && <p className="callout">{t('storage.discarded')}</p>}
      <p>
        {saved
          ? t('storage.summary', {
              records: formatNumber(state.records.length),
              drafts: formatNumber(Object.keys(state.drafts).length),
            })
          : t('storage.none')}
      </p>
      <p role="status" className="status-line">
        {deleted && !saved ? t('storage.deleted') : ''}
      </p>
      {confirming ? (
        <div className="callout callout--caution" role="group" aria-label={t('storage.delete')}>
          <p>{t('storage.confirm')}</p>
          <div className="actions">
            <Button
              variant="primary"
              onClick={() => {
                store.clear();
                setConfirming(false);
                setDeleted(true);
              }}
            >
              {t('storage.confirm.yes')}
            </Button>
            <Button autoFocus onClick={() => setConfirming(false)}>
              {t('storage.confirm.no')}
            </Button>
          </div>
        </div>
      ) : (
        <Button disabled={!saved} onClick={() => setConfirming(true)}>
          {t('storage.delete')}
        </Button>
      )}
    </section>
  );
}

/** Start: who you are and which control is due today. */
export function HomeScreen() {
  const t = useMessages(homeMessages);
  const { locale } = useI18n();
  useDocumentTitle(t('title'));
  return (
    <div className="screen">
      <ScreenTitle>{t('title')}</ScreenTitle>
      <p className="lead">{PRODUCT.tagline[locale]}</p>

      <MissionDayPicker />

      <section className="screen__section" aria-labelledby="crew-heading">
        <h2 id="crew-heading">{t('crew.heading')}</h2>
        <p className="note">{t('crew.fictional')}</p>
        <ul className="crew-grid">
          {CREW.map((member) => (
            <li key={member.id}>
              <CrewCard member={member} />
            </li>
          ))}
        </ul>
      </section>

      <section className="screen__section" aria-labelledby="learn-heading">
        <h2 id="learn-heading">{t('learn.heading')}</h2>
        <ul className="link-cards">
          <li>
            <a className="link-card" href={formatRoute({ name: 'brain' })}>
              <span className="link-card__title">{t('learn.brain')}</span>
              <span className="link-card__text">{t('learn.brain.text')}</span>
            </a>
          </li>
          <li>
            <a className="link-card" href={formatRoute({ name: 'how' })}>
              <span className="link-card__title">{t('learn.how')}</span>
              <span className="link-card__text">{t('learn.how.text')}</span>
            </a>
          </li>
        </ul>
      </section>

      <SavedData />
    </div>
  );
}
