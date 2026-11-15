import { useEffect, useRef, useState } from 'react';
import type { CrewId, Eye, SessionRecord } from '@app/core';
import { assessSession } from '../app/core';
import { baselineOf, historyBefore } from '../app/history';
import { crewMember, useCrewHistory, useDocumentTitle } from '../app/hooks';
import {
  STEP_IDS,
  applyEvent,
  buildRecord,
  calibrationOf,
  capturedEyes,
  currentStep,
  startDraft,
  stepHasOutcome,
  stepStatus,
  visionOf,
  type DraftEvent,
  type SessionDraft,
  type StepId,
  type StepStatus,
} from '../app/session';
import { findDraft, findLiveRecord, withDraft, withRecord, withoutDraft } from '../app/store';
import { useAppState, useAppStore } from '../app/StoreContext';
import { navigate } from '../app/useRoute';
import { useI18n, useMessages } from '../i18n';
import { commonMessages } from '../i18n/common';
import { sessionMessages } from '../i18n/session';
import { LinkButton } from '../shell/LinkButton';
import { ScreenTitle } from '../shell/ScreenTitle';
import { AcuityStep, AmslerStep, OctCaptureStep, SymptomsStep } from '../slots';
import { Button } from '../ui';

/**
 * Minutes a whole control takes. An estimate of this interface, not a measured
 * time: the questionnaire takes under two minutes (specification 03, section 1),
 * the acuity test shows 18 optotypes per eye, and each tomography is generated
 * and measured in under ten seconds (specification 01, section 5.7).
 */
const SESSION_MINUTES_ESTIMATE = 10;

const INTL_LOCALE = { en: 'en-US', es: 'es-AR' } as const;

/** One shape per state, so the progress can be read without colour. */
function StepMark({ status }: { status: StepStatus }) {
  const common = { width: 20, height: 20, viewBox: '0 0 20 20', 'aria-hidden': true, focusable: false } as const;
  switch (status) {
    case 'done':
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="9" fill="currentColor" />
          <path d="M5.5 10.5l3 3 6-7" fill="none" stroke="var(--color-bg)" strokeWidth="2.2" />
        </svg>
      );
    case 'skipped':
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M6 10h8" stroke="currentColor" strokeWidth="2.2" />
        </svg>
      );
    case 'current':
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="10" cy="10" r="4.5" fill="currentColor" />
        </svg>
      );
    case 'upcoming':
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
  }
}

/** Where the astronaut is in the seven steps. */
function StepIndicator({ draft }: { draft: SessionDraft }) {
  const t = useMessages(sessionMessages);
  const step = currentStep(draft);
  return (
    <div className="steps">
      <ol className="steps__list" aria-label={t('steps.label')}>
        {STEP_IDS.map((id, index) => {
          const status = stepStatus(draft, index);
          return (
            <li
              key={id}
              className={`steps__item steps__item--${status}`}
              aria-current={status === 'current' ? 'step' : undefined}
            >
              <StepMark status={status} />
              <span className="steps__name">
                <span className="steps__number">{index + 1}</span> {t(`step.${id}`)}
              </span>
              <span className="visually-hidden"> ({t(`status.${status}`)})</span>
            </li>
          );
        })}
      </ol>
      <p className="steps__position">
        {t('steps.position', { step: draft.stepIndex + 1, total: STEP_IDS.length, name: t(`step.${step}`) })}
      </p>
    </div>
  );
}

/** Step 1: what will be done, how long it takes and what it is compared with. */
function IntroStep({
  name,
  flightDay,
  baselineTimeMs,
  onBegin,
}: {
  name: string;
  flightDay: number;
  baselineTimeMs: number | null;
  onBegin: () => void;
}) {
  const t = useMessages(sessionMessages);
  const { locale } = useI18n();
  const date =
    baselineTimeMs === null
      ? null
      : new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: 'long', timeZone: 'UTC' }).format(
          new Date(baselineTimeMs),
        );
  return (
    <div className="session__step">
      <ScreenTitle>{t('intro.title', { name, day: flightDay })}</ScreenTitle>
      <section aria-labelledby="intro-what">
        <h2 id="intro-what">{t('intro.what')}</h2>
        <p>{t('intro.what.lead')}</p>
        <ol className="session__plan">
          <li>{t('intro.item.symptoms')}</li>
          <li>{t('intro.item.acuity')}</li>
          <li>{t('intro.item.amsler')}</li>
          <li>{t('intro.item.oct')}</li>
          <li>{t('intro.item.result')}</li>
        </ol>
        <p>{t('intro.skip')}</p>
      </section>
      <section aria-labelledby="intro-time">
        <h2 id="intro-time">{t('intro.time')}</h2>
        <p>{t('intro.time.text', { minutes: SESSION_MINUTES_ESTIMATE })}</p>
      </section>
      <section aria-labelledby="intro-reference">
        <h2 id="intro-reference">{t('intro.reference')}</h2>
        {date ? (
          <p>{t('intro.reference.text', { date })}</p>
        ) : (
          <p className="callout callout--caution">{t('intro.reference.missing')}</p>
        )}
      </section>
      <p className="callout">{t('intro.limits')}</p>
      <div className="actions">
        <Button variant="primary" size="lg" disabled={date === null} onClick={onBegin}>
          {t('intro.begin')}
        </Button>
      </div>
    </div>
  );
}

/** A step that already has an outcome, reached again by going back: keep it or do it again. */
function RedoPanel({
  step,
  skipped,
  onContinue,
  onRedo,
}: {
  step: StepId;
  skipped: boolean;
  onContinue: () => void;
  onRedo: () => void;
}) {
  const t = useMessages(sessionMessages);
  return (
    <div className="session__step">
      <ScreenTitle>{t(`step.${step}`)}</ScreenTitle>
      <div className="callout">
        <p>
          <strong>{skipped ? t('redo.title.skipped') : t('redo.title.done')}</strong>
        </p>
        <p>{skipped ? t('redo.text.skipped') : t('redo.text.done')}</p>
      </div>
      <div className="actions">
        <Button variant="primary" size="lg" onClick={onContinue}>
          {t('redo.continue')}
        </Button>
        <Button size="lg" onClick={onRedo}>
          {skipped ? t('redo.now') : t('redo.again')}
        </Button>
      </div>
    </div>
  );
}

/** Step 7: the rules assess the control; the record is saved and the result opens. */
function EvaluationStep({
  draft,
  history,
  onEvaluated,
}: {
  draft: SessionDraft;
  history: readonly SessionRecord[];
  onEvaluated: (record: SessionRecord) => void;
}) {
  const t = useMessages(sessionMessages);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    try {
      const eyes = capturedEyes(draft);
      if (!eyes) throw new Error('The tomography of one eye is missing');
      const assessment = assessSession({
        crewId: draft.crewId,
        flightDay: draft.flightDay,
        eyes,
        vision: visionOf(draft),
        history,
      });
      const record = buildRecord(draft, assessment);
      if (!record) throw new Error('The control is incomplete');
      onEvaluated(record);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    }
    // Evaluating is a one-off action of this step: it runs when the step appears and on "try again".
  }, [attempt]);

  if (error) {
    return (
      <div className="session__step" role="alert">
        <ScreenTitle>{t('evaluation.error.title')}</ScreenTitle>
        <p>{t('evaluation.error.what', { message: error.message })}</p>
        <p>{t('evaluation.error.cause')}</p>
        <p>{t('evaluation.error.do')}</p>
        <div className="actions">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setError(null);
              setAttempt((count) => count + 1);
            }}
          >
            {t('evaluation.retry')}
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="session__step">
      <ScreenTitle>{t('evaluation.title')}</ScreenTitle>
      <p role="status">{t('evaluation.text')}</p>
    </div>
  );
}

/** The guided session: the steps of today's control, one at a time. */
export function SessionScreen({ crewId }: { crewId: CrewId }) {
  const t = useMessages(sessionMessages);
  const tc = useMessages(commonMessages);
  const store = useAppStore();
  const state = useAppState();
  const member = crewMember(crewId);
  const flightDay = state.missionDay;
  const history = useCrewHistory(crewId);
  const earlier = historyBefore(history, flightDay);
  const baseline = baselineOf(earlier);

  const saved = findLiveRecord(state, crewId, flightDay);
  const stored = findDraft(state, crewId, flightDay);
  const [repeating, setRepeating] = useState(false);
  const [finished, setFinished] = useState(false);
  const [redoing, setRedoing] = useState<StepId | null>(null);
  const [confirmingRestart, setConfirmingRestart] = useState(false);

  const draft = stored ?? startDraft(crewId, flightDay);
  const step = currentStep(draft);

  const dispatch = (event: DraftEvent): void => {
    setRedoing(null);
    store.update((current) => {
      const base = findDraft(current, crewId, flightDay) ?? startDraft(crewId, flightDay);
      const next = applyEvent(base, event);
      return next === base ? current : withDraft(current, next);
    });
  };

  // A new step is on screen: back to the top, with the focus on its heading.
  const stepKey = `${draft.stepIndex}:${redoing ?? ''}`;
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>('#main h1[tabindex]')?.focus({ preventScroll: true });
  }, [stepKey]);

  const alreadyDone = saved !== null && stored === null && !repeating && !finished;
  useDocumentTitle(
    alreadyDone ? t('already.title') : `${t(`step.${step}`)} · ${t('context')} · ${member.name}`,
  );

  if (alreadyDone) {
    return (
      <div className="screen session">
        <ScreenTitle>{t('already.title')}</ScreenTitle>
        <p>{t('already.text', { name: member.name, day: flightDay })}</p>
        <div className="actions">
          <LinkButton to={{ name: 'result', crewId, flightDay }} variant="primary" size="lg">
            {t('already.result')}
          </LinkButton>
          <Button size="lg" onClick={() => setRepeating(true)}>
            {t('already.repeat')}
          </Button>
        </div>
        <p className="note">{t('already.repeat.note')}</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="screen session">
        <ScreenTitle>{t('evaluation.title')}</ScreenTitle>
        <p role="status">{t('evaluation.done')}</p>
        <div className="actions">
          <LinkButton to={{ name: 'result', crewId, flightDay }} variant="primary" size="lg">
            {t('evaluation.open')}
          </LinkButton>
        </div>
      </div>
    );
  }

  const octStep = (eye: Eye) => {
    const exam = baseline?.eyes[eye].accepted ?? null;
    if (!exam) {
      return (
        <div className="session__step">
          <ScreenTitle>{t('missing.title', { eye: tc(`eye.${eye}`).toLowerCase() })}</ScreenTitle>
          <p className="callout callout--caution">{t('missing.text')}</p>
          <div className="actions">
            <Button
              variant="primary"
              size="lg"
              onClick={() => dispatch({ type: 'eye', value: { eye, attempts: [], accepted: null } })}
            >
              {t('missing.continue')}
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="session__step">
        <ScreenTitle>{t(eye === 'OD' ? 'step.oct-od' : 'step.oct-os')}</ScreenTitle>
        <OctCaptureStep
          crewId={crewId}
          eye={eye}
          flightDay={flightDay}
          baseline={exam}
          onComplete={(value) => dispatch({ type: 'eye', value })}
        />
      </div>
    );
  };

  const hasOutcome = stepHasOutcome(draft, step);
  const skipped = (step === 'symptoms' || step === 'acuity' || step === 'amsler') && draft[step].status === 'skipped';

  let content;
  if (hasOutcome && redoing !== step) {
    content = (
      <RedoPanel
        step={step}
        skipped={skipped}
        onContinue={() => dispatch({ type: 'continue' })}
        onRedo={() => setRedoing(step)}
      />
    );
  } else {
    switch (step) {
      case 'intro':
        content = (
          <IntroStep
            name={member.name}
            flightDay={flightDay}
            baselineTimeMs={baseline?.eyes.OD.accepted?.examTimeMs ?? baseline?.eyes.OS.accepted?.examTimeMs ?? null}
            onBegin={() => dispatch({ type: 'begin' })}
          />
        );
        break;
      case 'symptoms':
        content = (
          <SymptomsStep
            onComplete={(value) => dispatch({ type: 'symptoms', value })}
            onSkip={() => dispatch({ type: 'symptoms', value: null })}
          />
        );
        break;
      case 'acuity':
        content = (
          <AcuityStep
            onComplete={(value) => dispatch({ type: 'acuity', value })}
            onSkip={() => dispatch({ type: 'acuity', value: null })}
          />
        );
        break;
      case 'amsler':
        content = (
          <AmslerStep
            calibration={calibrationOf(draft)}
            onComplete={(value) => dispatch({ type: 'amsler', value })}
            onSkip={() => dispatch({ type: 'amsler', value: null })}
          />
        );
        break;
      case 'oct-od':
        content = octStep('OD');
        break;
      case 'oct-os':
        content = octStep('OS');
        break;
      case 'evaluation':
        content = (
          <EvaluationStep
            draft={draft}
            history={earlier}
            onEvaluated={(record) => {
              setFinished(true);
              store.update((current) => withRecord(current, record));
              navigate({ name: 'result', crewId, flightDay }, { replace: true });
            }}
          />
        );
        break;
    }
  }

  return (
    <div className="screen session">
      <p className="session__context">
        {t('context')} · {member.name} · {tc('flightDay', { day: flightDay })}
      </p>
      <StepIndicator draft={draft} />
      <div key={stepKey}>{content}</div>
      <nav className="session__nav" aria-label={t('nav.label')}>
        {draft.stepIndex > 0 && (
          <Button onClick={() => dispatch({ type: 'back' })}>{t('nav.previous')}</Button>
        )}
        <LinkButton to={{ name: 'home' }} variant="ghost">
          {t('nav.leave')}
        </LinkButton>
        {stored !== null &&
          (confirmingRestart ? (
            <span className="session__restart" role="group" aria-label={t('nav.restart')}>
              <span>{t('nav.restart.confirm')}</span>
              <Button
                onClick={() => {
                  setConfirmingRestart(false);
                  setRedoing(null);
                  store.update((current) => withoutDraft(current, crewId, flightDay));
                }}
              >
                {t('nav.restart.yes')}
              </Button>
              <Button variant="ghost" autoFocus onClick={() => setConfirmingRestart(false)}>
                {t('nav.restart.no')}
              </Button>
            </span>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmingRestart(true)}>
              {t('nav.restart')}
            </Button>
          ))}
      </nav>
    </div>
  );
}
