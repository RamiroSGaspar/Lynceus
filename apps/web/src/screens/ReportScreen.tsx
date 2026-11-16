import { useMemo, useState, type FormEvent } from 'react';
import {
  buildReport,
  renderReportMarkdown,
  suggestQuestions,
  type CrewId,
  type ReportCell,
  type ReportSection,
  type ReportTable,
} from '@app/core';
import { findRecord } from '../app/history';
import { crewMember, useCrewHistory, useDocumentTitle } from '../app/hooks';
import { questionsFor, withQuestions } from '../app/store';
import { useAppState, useAppStore } from '../app/StoreContext';
import { useI18n, useMessages } from '../i18n';
import { appMessages } from '../i18n/app';
import { reportMessages } from '../i18n/report';
import { LinkAction } from '../shell/LinkButton';
import { ScreenTitle } from '../shell/ScreenTitle';
import { SectionNav } from '../shell/SectionNav';
import { Action, BrandStill, Button, QuantityValue } from '../ui';
import { NotFoundScreen } from './NotFoundScreen';

/** Longest question kept, in characters: enough for two or three sentences. */
const QUESTION_MAX_CHARS = 400;

type T = ReturnType<typeof useMessages<keyof (typeof reportMessages)['en']>>;

function Cell({ cell }: { cell: ReportCell }) {
  return typeof cell === 'string' ? (
    <>{cell}</>
  ) : (
    <QuantityValue quantity={cell.quantity} digits={cell.digits} signed={cell.signed} showOrigin />
  );
}

function Table({ table }: { table: ReportTable }) {
  return (
    <div className="co-desliza">
      <table className="co-tabla">
        {table.caption && <caption>{table.caption}</caption>}
        <thead>
          <tr>
            {table.columns.map((column, index) => (
              <th key={`${index}-${column}`} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, index) => (
                <td key={index}>
                  <Cell cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ section }: { section: ReportSection }) {
  return (
    <section className="screen__section report__section" aria-labelledby={`report-${section.id}`}>
      <h2 id={`report-${section.id}`} className="co-subtitulo">
        {section.title}
      </h2>
      {section.paragraphs.map((paragraph, index) => (
        <p key={index} className="co-texto">
          {paragraph}
        </p>
      ))}
      {section.tables.map((table, index) => (
        <Table key={index} table={table} />
      ))}
    </section>
  );
}

/** "My questions for the flight surgeon": an editable list, with the suggested ones at hand. */
function Questions({
  title,
  questions,
  suggested,
  onChange,
  t,
}: {
  title: string;
  questions: readonly string[];
  suggested: readonly string[];
  onChange: (next: string[]) => void;
  t: T;
}) {
  const [draft, setDraft] = useState('');
  const written = questions.map((question) => question.trim()).filter((question) => question.length > 0);
  const pending = suggested.filter((question) => !written.includes(question));
  const add = (event: FormEvent): void => {
    event.preventDefault();
    const text = draft.trim();
    if (text.length === 0) return;
    onChange([...questions, text]);
    setDraft('');
  };
  return (
    <section className="screen__section report__section" aria-labelledby="report-questions">
      <h2 id="report-questions" className="co-subtitulo">
        {title}
      </h2>
      <p className="co-nota no-print">{t('questions.lead')}</p>

      {/* On paper: the questions as plain text. */}
      {written.length === 0 ? (
        <p className={`co-texto${questions.length > 0 ? ' print-only' : ''}`}>{t('questions.empty')}</p>
      ) : (
        <ol className="co-lista co-lista--numerada print-only">
          {written.map((question, index) => (
            <li key={index}>{question}</li>
          ))}
        </ol>
      )}

      {questions.length > 0 && (
        <ol className="questions no-print">
          {questions.map((question, index) => (
            <li key={index} className="questions__item">
              <textarea
                className="co-entrada co-entrada--area"
                rows={2}
                maxLength={QUESTION_MAX_CHARS}
                aria-label={t('question.label', { n: index + 1 })}
                value={question}
                onChange={(event) => onChange(questions.map((other, at) => (at === index ? event.target.value : other)))}
              />
              <Action icon="trash-2" size="sm" hideLabel aria-label={t('question.remove.label', { n: index + 1 })} onClick={() => onChange(questions.filter((_, at) => at !== index))}>
                {t('question.remove')}
              </Action>
            </li>
          ))}
        </ol>
      )}

      <form className="questions__add no-print" onSubmit={add}>
        <label className="co-micro" htmlFor="new-question">
          {t('add.label')}
        </label>
        <textarea
          id="new-question"
          className="co-entrada co-entrada--area"
          rows={2}
          maxLength={QUESTION_MAX_CHARS}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" variant="primary" disabled={draft.trim().length === 0}>
          {t('add.button')}
        </Button>
      </form>

      <div className="co-pila no-print">
        <h3 className="co-micro">{t('suggested.heading')}</h3>
        <p className="co-nota">{t('suggested.lead')}</p>
        {pending.length === 0 ? (
          <p className="co-nota">{t('suggested.none')}</p>
        ) : (
          <ul className="questions__suggested">
            {pending.map((question) => (
              <li key={question}>
                <span>{question}</span>
                <Button aria-label={t('suggested.add.label', { question })} onClick={() => onChange([...questions, question])}>
                  {t('suggested.add')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Medical conference: what I take to the flight surgeon, and what I ask. */
export function ReportScreen({ crewId, flightDay }: { crewId: CrewId; flightDay: number }) {
  const t = useMessages(reportMessages);
  const ta = useMessages(appMessages);
  const { locale } = useI18n();
  const store = useAppStore();
  const state = useAppState();
  const member = crewMember(crewId);
  const history = useCrewHistory(crewId);
  const record = findRecord(history, flightDay);
  const questions = record ? questionsFor(state, record) : null;
  const report = useMemo(
    () => (record && questions ? buildReport({ ...record, questions: [...questions] }, history, locale) : null),
    [record, questions, history, locale],
  );
  const suggested = useMemo(() => (record ? suggestQuestions(record.assessment, locale) : []), [record, locale]);
  useDocumentTitle(t('title', { name: member.name, day: flightDay }));

  if (!record || !report || !questions) {
    return <NotFoundScreen message={ta('notFound.record', { name: member.name, day: flightDay })} />;
  }

  const download = (): void => {
    // Made and saved on this device: no request carries the report anywhere.
    const blob = new Blob([renderReportMarkdown(report)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medical-conference-${crewId}-FD${String(flightDay).padStart(3, '0')}.md`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="co-detalle co-velo co-detalle--primera">
        <article className="co-informe report">
          <header className="co-informe__cabeza">
            <BrandStill />
            <p className="co-micro no-print">{t('eyebrow', { name: member.name, day: flightDay })}</p>
            <ScreenTitle>{report.title}</ScreenTitle>
            <p className="co-subtitulo report__purpose">{report.purpose}</p>
            <p className="co-nota co-simulado" role="note">
              {report.simulatedDataNotice}
            </p>
          </header>

          {report.sections.map((section) =>
            section.id === 'questions' ? (
              <Questions
                key={section.id}
                title={section.title}
                questions={questions}
                suggested={suggested}
                onChange={(next) => store.update((current) => withQuestions(current, crewId, flightDay, next))}
                t={t}
              />
            ) : (
              <Section key={section.id} section={section} />
            ),
          )}

          <section className="screen__section no-print" aria-labelledby="report-export">
            <h2 id="report-export" className="co-subtitulo">
              {t('export.heading')}
            </h2>
            <div className="co-fila">
              <Button variant="primary" size="lg" icon="download" onClick={download}>
                {t('export.download')}
              </Button>
              <Button size="lg" icon="printer" onClick={() => window.print()}>
                {t('export.print')}
              </Button>
            </div>
            <p className="co-nota">{t('export.local')}</p>
          </section>

          <section className="screen__section no-print" aria-labelledby="report-actions">
            <h2 id="report-actions" className="co-subtitulo">
              {t('actions.heading')}
            </h2>
            <div className="co-fila">
              <LinkAction to={{ name: 'result', crewId, flightDay }} icon="anillo">
                {t('actions.result')}
              </LinkAction>
              <LinkAction to={{ name: 'history', crewId }} icon="chart-line">
                {t('actions.history')}
              </LinkAction>
              <LinkAction to={{ name: 'home' }} icon="house">
                {t('actions.home')}
              </LinkAction>
            </div>
          </section>
        </article>
      </div>
      <SectionNav crewId={crewId} current="report" flightDay={flightDay} record={record} />
    </>
  );
}
