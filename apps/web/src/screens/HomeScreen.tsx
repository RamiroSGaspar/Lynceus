import { useId, useState } from 'react';
import { PRODUCT, type CrewMember, type Eye, type Level } from '@app/core';
import { CREW, MISSION } from '../app/core';
import { formatFlightDate } from '../app/dates';
import { lastControl } from '../app/history';
import { useCrewHistory, useDocumentTitle } from '../app/hooks';
import { STEP_IDS } from '../app/session';
import { findDraft, findLiveRecord, hasSavedData, withMissionDay } from '../app/store';
import { useAppState, useAppStore } from '../app/StoreContext';
import { useI18n, useMessages } from '../i18n';
import { chartMessages } from '../i18n/charts';
import { commonMessages } from '../i18n/common';
import { historyMessages } from '../i18n/history';
import { homeMessages } from '../i18n/home';
import { LinkAction, LinkButton } from '../shell/LinkButton';
import { ScreenTitle } from '../shell/ScreenTitle';
import { BrandCover, Button, EyePair, LevelBadge, MissionLine, Notice, NoticeText, Readout, Section, Subject, type MissionStop } from '../ui';

/** Choosing the mission day is "travelling" to that control: the line of the mission is the selector. */
function MissionDayPicker() {
  const t = useMessages(homeMessages);
  const tc = useMessages(commonMessages);
  const th = useMessages(historyMessages);
  const tch = useMessages(chartMessages);
  const { locale, formatNumber } = useI18n();
  const store = useAppStore();
  const { missionDay } = useAppState();
  const helpId = useId();
  const days = MISSION.routineControlDays;
  const list = new Intl.ListFormat(locale, { type: 'conjunction' }).format(days.map((day) => formatNumber(day)));
  const shortDate = (day: number): string =>
    new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : 'en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
      new Date(Date.parse(`${MISSION.launchDateIso}T00:00:00Z`) + (day - 1) * 86_400_000),
    );
  const stops: MissionStop[] = [
    { day: 0, point: { kind: 'day' }, mark: tc('preflight'), name: th('control.preflight') },
    ...days.map(
      (day): MissionStop => ({
        day,
        point: { kind: 'day' },
        mark: day === missionDay ? tch('history.today') : undefined,
        label: `${tc('flightDay.short', { day })} · ${shortDate(day)}`,
        current: day === missionDay,
        name: `${tc('flightDay', { day })}, ${formatFlightDate(MISSION, day, locale)}`,
        option: { name: 'mission-day', value: day, checked: day === missionDay, onChange: () => store.update((state) => withMissionDay(state, day)) },
      }),
    ),
    { day: MISSION.durationDays, point: { kind: 'end' }, mark: tc('mission.return'), name: `${tc('flightDay', { day: MISSION.durationDays })}: ${tc('mission.return')}` },
  ];
  return (
    <section className="co-bloque co-bloque--mision" aria-labelledby="dia-titulo">
      <div className="co-halo co-portada__mision">
        <div className="co-portada__dia">
          <h2 className="co-micro" id="dia-titulo">
            {t('day.legend')}
          </h2>
          <p id={helpId} className="co-nota">
            {t('day.help', { days: list })}
          </p>
        </div>
        <MissionLine label={t('day.legend')} legend={t('day.legend')} describedBy={helpId} durationDays={MISSION.durationDays} stops={stops} />
      </div>
    </section>
  );
}

function CrewColumn({ member }: { member: CrewMember }) {
  const t = useMessages(homeMessages);
  const tc = useMessages(commonMessages);
  const { locale } = useI18n();
  const state = useAppState();
  const history = useCrewHistory(member.id);
  const last = lastControl(history);
  const done = findLiveRecord(state, member.id, state.missionDay);
  const draft = findDraft(state, member.id, state.missionDay);

  // A control in progress comes first: also when it repeats one that is already saved.
  const status = draft
    ? t('card.status.inProgress', { step: draft.stepIndex + 1, total: STEP_IDS.length })
    : done
      ? t('card.status.done')
      : t('card.status.notStarted');
  const action = draft ? t('card.resume') : done ? t('card.result') : t('card.start');
  const eyeLevel = (eye: Eye): Level | null => {
    const assessment = last?.assessment.eyes[eye];
    return assessment?.measured ? assessment.level : null;
  };

  return (
    <article className="co-tripulante">
      <Subject name={member.name} role={member.role[locale]} level={3} />
      <div className="co-tripulante__estado">
        {last ? (
          <>
            <EyePair levels={{ OD: eyeLevel('OD'), OS: eyeLevel('OS') }} />
            <LevelBadge level={last.assessment.level} />
            <p className="co-rotulo">
              {t('card.last')} · {tc('flightDay', { day: last.flightDay })}
              {last.origin === 'live' && ` · ${t('card.last.here')}`}
            </p>
          </>
        ) : (
          <p className="co-nota">{t('card.last.none')}</p>
        )}
      </div>
      <Readout
        size="words"
        value={status}
        label={
          <>
            {t('card.today')} · {tc('flightDay', { day: state.missionDay })}
          </>
        }
      />
      <div className="co-pila co-pila--inicio co-tripulante__acciones">
        <LinkButton
          to={done && !draft ? { name: 'result', crewId: member.id, flightDay: state.missionDay } : { name: 'session', crewId: member.id }}
          variant={done && !draft ? 'secondary' : 'primary'}
          aria-label={t('card.for', { action, name: member.name })}
        >
          {action}
        </LinkButton>
        {done && draft && (
          <LinkButton
            to={{ name: 'result', crewId: member.id, flightDay: state.missionDay }}
            aria-label={t('card.for', { action: t('card.result'), name: member.name })}
          >
            {t('card.result')}
          </LinkButton>
        )}
        <LinkAction
          to={{ name: 'history', crewId: member.id }}
          icon="chart-line"
          size="sm"
          aria-label={t('card.for', { action: t('card.history'), name: member.name })}
        >
          {t('card.history')}
        </LinkAction>
      </div>
    </article>
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
    <Section id="guardado" title={t('storage.heading')} note={t('storage.local')}>
      <div className="co-pila co-pila--holgada co-pila--inicio">
        {!store.isPersistent() && <Notice kind="caution" title={t('storage.notPersistent')} />}
        {store.loadStatus === 'discarded' && <Notice title={t('storage.discarded')} />}
        {saved ? (
          <div className="co-lecturas co-guardado">
            <Readout value={formatNumber(state.records.length)} label={t('storage.records')} />
            <Readout value={formatNumber(Object.keys(state.drafts).length)} label={t('storage.drafts')} />
          </div>
        ) : (
          <p className="co-nota">{t('storage.none')}</p>
        )}
        <p role="status" className="co-nota co-estado">
          {deleted && !saved ? t('storage.deleted') : ''}
        </p>
        {confirming ? (
          <Notice kind="caution" role="group" aria-label={t('storage.delete')} title={t('storage.delete')}>
            <NoticeText>{t('storage.confirm')}</NoticeText>
            <div className="co-fila co-aviso__acciones">
              <Button
                variant="primary"
                icon="trash-2"
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
          </Notice>
        ) : (
          <Button icon="trash-2" disabled={!saved} onClick={() => setConfirming(true)}>
            {t('storage.delete')}
          </Button>
        )}
      </div>
    </Section>
  );
}

/** Start: who you are and which control is due today. */
export function HomeScreen() {
  const t = useMessages(homeMessages);
  const { locale } = useI18n();
  useDocumentTitle(t('title'));
  return (
    <>
      <section className="co-portada">
        <BrandCover />
        <div className="co-halo co-portada__lema">
          <p className="co-texto">{PRODUCT.tagline[locale]}</p>
        </div>
        <div className="co-halo co-portada__pregunta">
          <ScreenTitle>{t('title')}</ScreenTitle>
        </div>
      </section>

      <MissionDayPicker />

      <div className="co-detalle co-velo co-detalle--inicio">
        <Section id="tripulacion" title={t('crew.heading')} note={t('crew.fictional')} stacked>
          <p className="co-nota co-tripulacion__rutina">{t('card.today.routine')}</p>
          <div className="co-tripulacion">
            {CREW.map((member) => (
              <CrewColumn key={member.id} member={member} />
            ))}
          </div>
        </Section>

        <Section id="antes" title={t('learn.heading')}>
          <div className="co-columnas co-columnas--dos">
            <div className="co-pila">
              <LinkAction to={{ name: 'brain' }} icon="brain">
                {t('learn.brain')}
              </LinkAction>
              <p className="co-nota">{t('learn.brain.text')}</p>
            </div>
            <div className="co-pila">
              <LinkAction to={{ name: 'how' }} icon="book-open">
                {t('learn.how')}
              </LinkAction>
              <p className="co-nota">{t('learn.how.text')}</p>
            </div>
          </div>
        </Section>

        <SavedData />
      </div>
    </>
  );
}
