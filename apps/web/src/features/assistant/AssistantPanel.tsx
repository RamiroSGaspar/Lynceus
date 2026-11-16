import type { SessionRecord } from '@app/core';
import { Component, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { QUESTION_MAX_CHARS, type AssistantContext } from '../../../api/_lib/contract';
import { useI18n, useMessages } from '../../i18n';
import { Action, BrandWorking, Button, Icon, Notice, NoticeText, SimulatedNotice } from '../../ui';
import { askAssistant, type ClientResponse } from './client';
import { hasConsent, saveConsent } from './consent';
import { buildAssistantContext } from './context';
import { assistantMessages } from './messages';
import { suggestedQuestions } from './suggestions';
import './assistant.css';

type T = ReturnType<typeof useMessages<keyof (typeof assistantMessages)['en']>>;

interface Props {
  /** The result the questions are about, or null when no result is open. */
  record: SessionRecord | null;
  /** In the navigation: the short word under its disc. Elsewhere: the whole sentence. */
  compact?: boolean;
}

/**
 * The assistant: a veil that comes in from the right, opened from the navigation. The question,
 * the answer with its sources, and what leaves the device, always in view. No bubbles.
 * Optional: whatever happens inside, the rest of the application keeps working.
 */
export function AssistantPanel({ record, compact = false }: Props) {
  const t = useMessages(assistantMessages);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) titleRef.current?.focus();
    else returnFocus.current?.focus();
  }, [open]);

  const show = () => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') setOpen(false);
  };

  return (
    <>
      <Action icon="message-circle-question-mark" onClick={show} aria-expanded={open} aria-controls={panelId} aria-label={compact ? t('open') : undefined}>
        {compact ? t('open.short') : t('open')}
      </Action>
      {/* The sheet belongs to the page, not to whatever opened it: the navigation is fixed and moved, and would confine it. */}
      {open &&
        createPortal(
          <aside id={panelId} className="co-hoja co-velo co-velo--der assistant" aria-labelledby={titleId} onKeyDown={onKeyDown}>
            <header className="co-hoja__cabeza">
              <h2 id={titleId} ref={titleRef} tabIndex={-1} className="co-micro">
                {t('title')}
              </h2>
              <Action icon="x" size="sm" hideLabel onClick={() => setOpen(false)}>
                {t('close')}
              </Action>
            </header>
            <PanelBoundary fallback={<Unavailable t={t} line={t('unavailable.broken')} />}>
              <PanelBody record={record} t={t} />
            </PanelBoundary>
            <SimulatedNotice />
          </aside>,
          document.body,
        )}
    </>
  );
}

class PanelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function safeContext(record: SessionRecord | null): AssistantContext | null {
  if (!record) return null;
  try {
    return buildAssistantContext(record);
  } catch {
    return null;
  }
}

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'done'; response: ClientResponse };

function PanelBody({ record, t }: { record: SessionRecord | null; t: T }) {
  const { locale } = useI18n();
  const [consent, setConsent] = useState(hasConsent);
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [asked, setAsked] = useState<string | null>(null);
  const context = useMemo(() => safeContext(record), [record]);
  const inputId = useId();
  const counterId = useId();
  const length = [...question.trim()].length;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || [...trimmed].length > QUESTION_MAX_CHARS || status.kind === 'sending') return;
    setAsked(trimmed);
    setStatus({ kind: 'sending' });
    setStatus({ kind: 'done', response: await askAssistant({ question: trimmed, locale, context }) });
  };
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send(question);
  };
  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void send(question);
    }
  };

  if (!consent) {
    return (
      <section className="co-pila" aria-label={t('consent.title')}>
        <h3 className="co-subtitulo">{t('consent.title')}</h3>
        <p className="co-nota">{t('consent.what')}</p>
        <p className="co-nota">{t('consent.where')}</p>
        {!record && <p className="co-nota">{t('consent.noRecord')}</p>}
        <SentSummary context={context} label={t('consent.show')} t={t} />
        <Button
          variant="primary"
          onClick={() => {
            saveConsent();
            setConsent(true);
          }}
        >
          {t('consent.accept')}
        </Button>
      </section>
    );
  }

  return (
    <>
      <section className="co-pila" aria-live="polite" aria-busy={status.kind === 'sending'}>
        {asked && <p className="co-mensaje co-mensaje--propio">{asked}</p>}
        {status.kind === 'sending' && (
          <p className="co-mensaje co-mensaje--espera">
            <BrandWorking size="sm" />
            <span className="co-nota">{t('sending')}</span>
          </p>
        )}
        {status.kind === 'done' && <Result response={status.response} t={t} />}
      </section>

      <form className="co-pila" onSubmit={onSubmit}>
        <label htmlFor={inputId} className="co-micro">
          {t('input.label')}
        </label>
        <textarea
          id={inputId}
          className="co-entrada co-entrada--area"
          value={question}
          maxLength={QUESTION_MAX_CHARS}
          rows={2}
          aria-describedby={counterId}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={onInputKeyDown}
        />
        <div className="co-hoja__fila">
          <span id={counterId} className="co-rotulo">
            {t('input.counter', { count: length, max: QUESTION_MAX_CHARS })}
          </span>
          <Button type="submit" variant="primary" icon="send" disabled={length === 0 || status.kind === 'sending'}>
            {t('send')}
          </Button>
        </div>
      </form>

      <section className="co-pila" aria-label={t('suggested')}>
        <h3 className="co-micro">{t('suggested')}</h3>
        <ul className="co-hoja__sugeridas">
          {suggestedQuestions(record).map((key) => (
            <li key={key}>
              <button
                type="button"
                className="co-hoja__sugerida"
                disabled={status.kind === 'sending'}
                onClick={() => {
                  setQuestion(t(key));
                  void send(t(key));
                }}
              >
                {t(key)}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* What leaves the device stays in view under the input, not only the first time. */}
      <SentSummary context={context} label={t('summary.title')} t={t} />
    </>
  );
}

function SentSummary({ context, label, t }: { context: AssistantContext | null; label: string; t: T }) {
  return (
    <details className="co-desplegable">
      <summary>
        {label} <Icon name="chevron-down" />
      </summary>
      {context ? <pre className="co-hoja__json">{JSON.stringify(context, null, 2)}</pre> : <p className="co-nota">{t('summary.none')}</p>}
    </details>
  );
}

function Unavailable({ t, line }: { t: T; line: string }) {
  return (
    <Notice role="status" title={line}>
      <NoticeText>{t('unavailable.analysisWorks')}</NoticeText>
    </Notice>
  );
}

function Result({ response, t }: { response: ClientResponse; t: T }) {
  if (response.status === 'unavailable') return <Unavailable t={t} line={t(`unavailable.${response.reason}`)} />;
  if (response.status === 'refused') {
    if (response.reason === 'invalid-input') return <Notice title={t('refused.invalid')} />;
    return (
      <Notice title={t('refused.title')} titleLevel={3}>
        {response.reason === 'unsafe-output' && <NoticeText>{t('refused.unsafe')}</NoticeText>}
        <NoticeText>{t('refused.scope')}</NoticeText>
        <NoticeText>{t('refused.examples')}</NoticeText>
        <ul className="co-lista co-aviso__texto">
          <li>{t('refused.example1')}</li>
          <li>{t('refused.example2')}</li>
          <li>{t('refused.example3')}</li>
        </ul>
      </Notice>
    );
  }
  return (
    <article className="co-mensaje">
      <h3 className="co-oculto">{t('answer.title')}</h3>
      <p className="co-mensaje__texto">{response.answer}</p>
      <p className="co-rotulo">{t('answer.label')}</p>
      {response.sources.length > 0 && (
        <div className="co-mensaje__fuentes">
          <h4 className="co-micro">{t('sources')}</h4>
          <ul className="co-lista">
            {response.sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noreferrer noopener">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
