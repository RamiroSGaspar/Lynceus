import type { SessionRecord } from '@app/core';
import { Component, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { QUESTION_MAX_CHARS, type AssistantContext } from '../../../api/_lib/contract';
import { useI18n, useMessages } from '../../i18n';
import { Button, SimulatedNotice } from '../../ui';
import { askAssistant, type ClientResponse } from './client';
import { hasConsent, saveConsent } from './consent';
import { buildAssistantContext } from './context';
import { assistantMessages } from './messages';
import { suggestedQuestions } from './suggestions';
import './assistant.css';

type T = ReturnType<typeof useMessages<keyof (typeof assistantMessages)['en']>>;

/** Side panel of questions. Optional: whatever happens inside, the rest of the application keeps working. */
export function AssistantPanel({ record }: { record: SessionRecord | null }) {
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
      <Button onClick={show} aria-expanded={open} aria-controls={panelId}>
        {t('open')}
      </Button>
      {open && (
        <aside id={panelId} className="assistant" aria-labelledby={titleId} onKeyDown={onKeyDown}>
          <header className="assistant__header">
            <h2 id={titleId} ref={titleRef} tabIndex={-1} className="assistant__title">
              {t('title')}
            </h2>
            <Button variant="ghost" onClick={() => setOpen(false)} aria-label={t('close')}>
              <span aria-hidden="true" className="assistant__close-icon">×</span>
            </Button>
          </header>
          <PanelBoundary fallback={<Unavailable t={t} line={t('unavailable.broken')} />}>
            <PanelBody record={record} t={t} />
          </PanelBoundary>
          <SimulatedNotice />
        </aside>
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
  const context = useMemo(() => safeContext(record), [record]);
  const inputId = useId();
  const counterId = useId();
  const length = [...question.trim()].length;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || [...trimmed].length > QUESTION_MAX_CHARS || status.kind === 'sending') return;
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
      <section className="assistant__section" aria-label={t('consent.title')}>
        <h3>{t('consent.title')}</h3>
        <p>{t('consent.what')}</p>
        <p>{t('consent.where')}</p>
        {!record && <p>{t('consent.noRecord')}</p>}
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
      <section className="assistant__section" aria-label={t('suggested')}>
        <h3 className="assistant__subtitle">{t('suggested')}</h3>
        <ul className="assistant__suggestions">
          {suggestedQuestions(record).map((key) => (
            <li key={key}>
              <button
                type="button"
                className="assistant__suggestion"
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

      <form className="assistant__section assistant__form" onSubmit={onSubmit}>
        <label htmlFor={inputId} className="assistant__subtitle">
          {t('input.label')}
        </label>
        <textarea
          id={inputId}
          className="assistant__input"
          value={question}
          maxLength={QUESTION_MAX_CHARS}
          rows={3}
          aria-describedby={counterId}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={onInputKeyDown}
        />
        <div className="assistant__form-row">
          <span id={counterId} className="assistant__counter">
            {t('input.counter', { count: length, max: QUESTION_MAX_CHARS })}
          </span>
          <Button type="submit" variant="primary" disabled={length === 0 || status.kind === 'sending'}>
            {t('send')}
          </Button>
        </div>
      </form>

      <section className="assistant__section" aria-live="polite" aria-busy={status.kind === 'sending'}>
        {status.kind === 'sending' && <p className="assistant__muted">{t('sending')}</p>}
        {status.kind === 'done' && <Result response={status.response} t={t} />}
      </section>

      <SentSummary context={context} label={t('summary.title')} t={t} />
    </>
  );
}

function SentSummary({ context, label, t }: { context: AssistantContext | null; label: string; t: T }) {
  return (
    <details className="assistant__summary">
      <summary>{label}</summary>
      {context ? <pre className="assistant__json">{JSON.stringify(context, null, 2)}</pre> : <p>{t('summary.none')}</p>}
    </details>
  );
}

function Unavailable({ t, line }: { t: T; line: string }) {
  return (
    <p className="assistant__notice" role="status">
      {line} {t('unavailable.analysisWorks')}
    </p>
  );
}

function Result({ response, t }: { response: ClientResponse; t: T }) {
  if (response.status === 'unavailable') return <Unavailable t={t} line={t(`unavailable.${response.reason}`)} />;
  if (response.status === 'refused') {
    if (response.reason === 'invalid-input') return <p className="assistant__notice">{t('refused.invalid')}</p>;
    return (
      <div className="assistant__refusal">
        <h3 className="assistant__subtitle">{t('refused.title')}</h3>
        {response.reason === 'unsafe-output' && <p>{t('refused.unsafe')}</p>}
        <p>{t('refused.scope')}</p>
        <p>{t('refused.examples')}</p>
        <ul>
          <li>{t('refused.example1')}</li>
          <li>{t('refused.example2')}</li>
          <li>{t('refused.example3')}</li>
        </ul>
      </div>
    );
  }
  return (
    <article className="assistant__answer">
      <h3 className="assistant__subtitle">{t('answer.title')}</h3>
      <p className="assistant__label">{t('answer.label')}</p>
      <p className="assistant__answer-text">{response.answer}</p>
      {response.sources.length > 0 && (
        <>
          <h4 className="assistant__subtitle">{t('sources')}</h4>
          <ul className="assistant__sources">
            {response.sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noreferrer noopener">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}
