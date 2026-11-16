import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CrewId, Eye, EyeCaptureResult, SessionRecord } from '@app/core';
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
import { SectionNav } from '../shell/SectionNav';
import { useFieldOff } from '../shell/useFieldOff';
import { AcuityStep, AmslerStep, CaptureSummary, OctCaptureStep, SymptomsStep } from '../slots';
import { BrandWorking, Button, Group, Notice, NoticeText, Subject } from '../ui';

/**
 * Minutes a whole control takes. An estimate of this interface, not a measured
 * time: the questionnaire takes under two minutes (specification 03, section 1),
 * the acuity test shows 18 optotypes per eye, and each tomography is generated
 * and measured in under ten seconds (specification 01, section 5.7).
 */
const SESSION_MINUTES_ESTIMATE = 10;

const INTL_LOCALE = { en: 'en-US', es: 'es-AR' } as const;
const EYES: readonly Eye[] = ['OD', 'OS'];
/** The steps the astronaut does with the eyes on a test surface. */
const VISION_STEPS: ReadonlySet<StepId> = new Set<StepId>(['symptoms', 'acuity', 'amsler']);

const STATUS_CLASS: Record<StepStatus, string> = { done: ' is-hecho', skipped: ' is-salteado', current: '', upcoming: '' };

/**
 * Where the astronaut is in the seven steps: a checklist on a line. Done: a filled disc.
 * Not done: a dashed one. Current: a disc with a ring, in bold. It is not navigation.
 * During a vision test nothing but the test is on screen, so the list is kept for assistive
 * technology only and the position is said in one line.
 */
function StepList({ draft, hidden = false }: { draft: SessionDraft; hidden?: boolean }) {
  const t = useMessages(sessionMessages);
  return (
    <ol className={`co-sesion${hidden ? ' co-oculto' : ''}`} aria-label={t('steps.label')}>
      {STEP_IDS.map((id, index) => {
        const status = stepStatus(draft, index);
        return (
          <li
            key={id}
            className={`steps__item steps__item--${status} co-sesion__paso${STATUS_CLASS[status]}`}
            aria-current={status === 'current' ? 'step' : undefined}
          >
            <span className="co-sesion__nodo" />
            <span>
              <span className="co-oculto">
                <span className="steps__number">{index + 1}</span>.{' '}
              </span>
              {t(`step.${id}`)}
            </span>
            <span className="co-oculto"> ({t(`status.${status}`)})</span>
          </li>
        );
      })}
    </ol>
  );
}

/** One step of the session that is read, not measured: its title, what it says and one main button to go on. */
function StepText({ children, role }: { children: ReactNode; role?: 'alert' }) {
  return (
    <div className="co-cabina__escena co-cabina__escena--texto" role={role}>
      <div className="co-halo co-paso-sesion">{children}</div>
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
    <StepText>
      <ScreenTitle>{t('intro.title', { name, day: flightDay })}</ScreenTitle>
      <Group icon="list-checks" title={t('intro.what')} id="intro-what">
        <p className="co-texto">{t('intro.what.lead')}</p>
        <ol className="co-lista co-lista--numerada">
          <li>{t('intro.item.symptoms')}</li>
          <li>{t('intro.item.acuity')}</li>
          <li>{t('intro.item.amsler')}</li>
          <li>{t('intro.item.oct')}</li>
          <li>{t('intro.item.result')}</li>
        </ol>
        <p className="co-nota">{t('intro.skip')}</p>
      </Group>
      <div className="co-columnas co-columnas--dos">
        <Group icon="clock" title={t('intro.time')} id="intro-time">
          <p className="co-nota">{t('intro.time.text', { minutes: SESSION_MINUTES_ESTIMATE })}</p>
        </Group>
        <Group icon="ruler" title={t('intro.reference')} id="intro-reference">
          {date ? <p className="co-nota">{t('intro.reference.text', { date })}</p> : <Notice kind="unmeasured" title={t('intro.reference.missing')} />}
        </Group>
      </div>
      <Notice title={t('intro.limits')} />
      <div className="co-fila">
        <Button variant="primary" size="lg" iconEnd="arrow-right" disabled={date === null} onClick={onBegin}>
          {t('intro.begin')}
        </Button>
      </div>
    </StepText>
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
    <StepText>
      <ScreenTitle>{t(`step.${step}`)}</ScreenTitle>
      <Notice title={skipped ? t('redo.title.skipped') : t('redo.title.done')}>
        <NoticeText>{skipped ? t('redo.text.skipped') : t('redo.text.done')}</NoticeText>
      </Notice>
      <div className="co-fila">
        <Button variant="primary" size="lg" iconEnd="arrow-right" onClick={onContinue}>
          {t('redo.continue')}
        </Button>
        <Button size="lg" icon="rotate-ccw" onClick={onRedo}>
          {skipped ? t('redo.now') : t('redo.again')}
        </Button>
      </div>
    </StepText>
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
      <StepText role="alert">
        <ScreenTitle>{t('evaluation.error.title')}</ScreenTitle>
        <p className="co-texto">{t('evaluation.error.what', { message: error.message })}</p>
        <p className="co-nota">{t('evaluation.error.cause')}</p>
        <p className="co-nota">{t('evaluation.error.do')}</p>
        <div className="co-fila">
          <Button
            variant="primary"
            size="lg"
            icon="rotate-ccw"
            onClick={() => {
              setError(null);
              setAttempt((count) => count + 1);
            }}
          >
            {t('evaluation.retry')}
          </Button>
        </div>
      </StepText>
    );
  }
  return <Evaluating text={t('evaluation.text')} />;
}

/** The evaluation has no image of its own: the brand sweeps, large, and under it what the engine is doing. Nothing else. */
function Evaluating({ text, children }: { text: string; children?: ReactNode }) {
  const t = useMessages(sessionMessages);
  return (
    <div className="co-cabina__escena co-cabina__escena--evaluacion">
      <BrandWorking />
      <div className="co-halo co-paso-sesion co-paso-sesion--centro">
        <ScreenTitle>{t('evaluation.title')}</ScreenTitle>
        <p className="co-texto" role="status">
          {text}
        </p>
        {children}
      </div>
    </div>
  );
}

/** The guided session: the steps of today's control, one at a time. */
export function SessionScreen({ crewId }: { crewId: CrewId }) {
  const t = useMessages(sessionMessages);
  const tc = useMessages(commonMessages);
  const { locale } = useI18n();
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

  const vision = !alreadyDone && !finished && VISION_STEPS.has(step) && !(stepHasOutcome(draft, step) && redoing !== step);
  // During a vision test the field of stars goes dark: nothing may be mistaken for the stimulus.
  useFieldOff(vision);

  const subject = (state: ReactNode) => <Subject name={member.name} role={member.role[locale]} state={state} />;

  if (alreadyDone) {
    return (
      <>
        <div className="co-cabina co-cabina--dos">
          <section className="co-velo co-velo--izq co-cabina__lado" aria-label={t('context')}>
            {subject(`${t('context')} · ${tc('flightDay', { day: flightDay })}`)}
          </section>
          <StepText>
            <ScreenTitle>{t('already.title')}</ScreenTitle>
            <p className="co-texto">{t('already.text', { name: member.name, day: flightDay })}</p>
            <div className="co-fila">
              <LinkButton to={{ name: 'result', crewId, flightDay }} variant="primary" size="lg" iconEnd="arrow-right">
                {t('already.result')}
              </LinkButton>
              <Button size="lg" icon="rotate-ccw" onClick={() => setRepeating(true)}>
                {t('already.repeat')}
              </Button>
            </div>
            <p className="co-nota">{t('already.repeat.note')}</p>
          </StepText>
        </div>
        <SectionNav crewId={crewId} current="control" record={saved} />
      </>
    );
  }

  if (finished) {
    return (
      <>
        <div className="co-cabina co-cabina--dos">
          <section className="co-velo co-velo--izq co-cabina__lado" aria-label={t('context')}>
            {subject(`${t('context')} · ${tc('flightDay', { day: flightDay })}`)}
          </section>
          <Evaluating text={t('evaluation.done')}>
            <LinkButton to={{ name: 'result', crewId, flightDay }} variant="primary" size="lg" iconEnd="arrow-right">
              {t('evaluation.open')}
            </LinkButton>
          </Evaluating>
        </div>
        <SectionNav crewId={crewId} current="control" record={saved} />
      </>
    );
  }

  const octStep = (eye: Eye) => {
    const exam = baseline?.eyes[eye].accepted ?? null;
    if (!exam) {
      return (
        <StepText>
          <ScreenTitle>{t('missing.title', { eye: tc(`eye.${eye}`).toLowerCase() })}</ScreenTitle>
          <Notice kind="unmeasured" title={t('missing.text')} />
          <div className="co-fila">
            <Button
              variant="primary"
              size="lg"
              iconEnd="arrow-right"
              onClick={() => dispatch({ type: 'eye', value: { eye, attempts: [], accepted: null } })}
            >
              {t('missing.continue')}
            </Button>
          </div>
        </StepText>
      );
    }
    return (
      <>
        {/* The capture step opens with its own visible title: the screen heading is for the announcement after each step. */}
        <ScreenTitle className="co-oculto">{t(eye === 'OD' ? 'step.oct-od' : 'step.oct-os')}</ScreenTitle>
        <OctCaptureStep
          crewId={crewId}
          eye={eye}
          flightDay={flightDay}
          baseline={exam}
          onComplete={(value) => dispatch({ type: 'eye', value })}
        />
      </>
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

  const position = t('steps.position', { step: draft.stepIndex + 1, total: STEP_IDS.length, name: t(`step.${step}`) });
  const moves = (
    <nav className="co-sesion-nav" aria-label={t('nav.label')}>
      {draft.stepIndex > 0 && (
        <Button variant="ghost" icon="arrow-left" onClick={() => dispatch({ type: 'back' })}>
          {t('nav.previous')}
        </Button>
      )}
      <LinkButton to={{ name: 'home' }} variant="ghost" icon="house">
        {t('nav.leave')}
      </LinkButton>
      {stored !== null &&
        (confirmingRestart ? (
          <Notice kind="caution" role="group" aria-label={t('nav.restart')} title={t('nav.restart.confirm')} className="co-sesion-nav__confirmar">
            <div className="co-fila co-aviso__acciones">
              <Button
                icon="rotate-ccw"
                onClick={() => {
                  setConfirmingRestart(false);
                  setRedoing(null);
                  store.update((current) => withoutDraft(current, crewId, flightDay));
                }}
              >
                {t('nav.restart.yes')}
              </Button>
              <Button variant="primary" autoFocus onClick={() => setConfirmingRestart(false)}>
                {t('nav.restart.no')}
              </Button>
            </div>
          </Notice>
        ) : (
          <Button variant="ghost" icon="rotate-ccw" onClick={() => setConfirmingRestart(true)}>
            {t('nav.restart')}
          </Button>
        ))}
    </nav>
  );

  // A vision test: plain black, no veils and no navigation. Only the test, where it is in the control and the way out.
  if (vision) {
    return (
      <div className="co-prueba">
        <header className="co-prueba__cabeza">
          <p className="co-micro">
            {member.name} · {tc('flightDay.short', { day: flightDay })}
          </p>
          <p className="co-rotulo">{position}</p>
          <StepList draft={draft} hidden />
        </header>
        <div key={stepKey} className="co-prueba__paso">
          {content}
        </div>
        {moves}
      </div>
    );
  }

  const captured = EYES.filter((eye) => draft.eyes[eye] !== null && step !== (eye === 'OD' ? 'oct-od' : 'oct-os'));
  const capturing = (step === 'oct-od' || step === 'oct-os') && !(hasOutcome && redoing !== step) && (baseline?.eyes[step === 'oct-od' ? 'OD' : 'OS'].accepted ?? null) !== null;

  return (
    <>
      <div className={`co-cabina${capturing ? ' co-cabina--captura' : ' co-cabina--dos'}`}>
        <section className="co-velo co-velo--izq co-cabina__lado" aria-label={t('context')}>
          {subject(position)}
          <Group icon="list-checks" title={`${t('context')} · ${tc('flightDay', { day: flightDay })}`} className="co-cabina__solo-ancho">
            <StepList draft={draft} />
          </Group>
          {captured.map((eye) => (
            <CaptureSummary key={eye} capture={draft.eyes[eye] as EyeCaptureResult} />
          ))}
          <div className="co-cabina__solo-ancho">{moves}</div>
        </section>
        <div key={stepKey} className="co-cabina__paso">
          {content}
        </div>
        {/* In one column the ways out come after the step, not before it: who and where first, then what there is to do. */}
        <div className="co-velo co-cabina__salidas co-cabina__solo-angosto">{moves}</div>
      </div>
      <SectionNav crewId={crewId} current="control" record={saved} />
    </>
  );
}
