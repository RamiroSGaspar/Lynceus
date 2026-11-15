import { BRAIN_KNOWLEDGE, REFERENCES, type KnowledgeCertainty, type KnowledgeStatement } from '@app/core';
import { useDocumentTitle } from '../app/hooks';
import { useI18n, useMessages } from '../i18n';
import { brainMessages } from '../i18n/brain';
import { LinkButton } from '../shell/LinkButton';
import { ScreenTitle } from '../shell/ScreenTitle';
import { AssistantPanel } from '../slots';

const COLUMNS = ['known', 'mriOnly', 'notKnowableOnBoard'] as const;
const CERTAINTIES: readonly KnowledgeCertainty[] = [
  'established',
  'limited-evidence',
  'unknown',
  'not-measurable-on-board',
];

type T = ReturnType<typeof useMessages<keyof (typeof brainMessages)['en']>>;

/** How firm a statement is, in words. The border style repeats it, so it does not rest on colour. */
function Certainty({ certainty, t }: { certainty: KnowledgeCertainty; t: T }) {
  return (
    <span className={`certainty certainty--${certainty}`} title={t(`certainty.${certainty}.help`)}>
      {t(`certainty.${certainty}`)}
    </span>
  );
}

function Statement({ statement, t }: { statement: KnowledgeStatement; t: T }) {
  const { locale } = useI18n();
  return (
    <li className="statement">
      <p className="statement__text">{statement.text[locale]}</p>
      <p className="statement__certainty">
        <Certainty certainty={statement.certainty} t={t} />
      </p>
      <p className="statement__sources-label">{t('sources')}</p>
      <ul className="statement__sources">
        {statement.sources.map((id) => {
          const reference = REFERENCES.find((candidate) => candidate.id === id);
          return (
            <li key={id}>
              {reference ? (
                <a href={reference.url} target="_blank" rel="noreferrer" lang="en">
                  {t('source', { title: reference.title, publisher: reference.publisher, year: reference.year })}
                </a>
              ) : (
                t('source.missing', { id })
              )}
            </li>
          );
        })}
      </ul>
    </li>
  );
}

/** What is known about the brain, what only an MRI shows, and what cannot be known during a mission. */
export function BrainScreen() {
  const t = useMessages(brainMessages);
  useDocumentTitle(t('title'));
  return (
    <div className="screen brain">
      <ScreenTitle>{t('title')}</ScreenTitle>
      <p className="lead">{t('lead')}</p>
      <p className="callout">{t('tool')}</p>

      <section className="screen__section" aria-labelledby="certainty-heading">
        <h2 id="certainty-heading" className="brain__legend-title">
          {t('certainty.heading')}
        </h2>
        <dl className="brain__legend">
          {CERTAINTIES.map((certainty) => (
            <div key={certainty}>
              <dt>
                <Certainty certainty={certainty} t={t} />
              </dt>
              <dd>{t(`certainty.${certainty}.help`)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="brain__columns">
        {COLUMNS.map((column) => (
          <section key={column} className="brain__column" aria-labelledby={`brain-${column}`}>
            <h2 id={`brain-${column}`}>{t(`column.${column}`)}</h2>
            <ul className="brain__statements">
              {BRAIN_KNOWLEDGE[column].map((statement) => (
                <Statement key={statement.id} statement={statement} t={t} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="screen__section" aria-labelledby="brain-actions">
        <h2 id="brain-actions">{t('actions.heading')}</h2>
        <div className="actions">
          <AssistantPanel record={null} />
          <LinkButton to={{ name: 'how' }}>{t('actions.how')}</LinkButton>
          <LinkButton to={{ name: 'home' }} variant="ghost">
            {t('actions.home')}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
