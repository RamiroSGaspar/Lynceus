import { BRAIN_KNOWLEDGE, REFERENCES, type KnowledgeCertainty, type KnowledgeStatement } from '@app/core';
import { useDocumentTitle } from '../app/hooks';
import { useI18n, useMessages } from '../i18n';
import { brainMessages } from '../i18n/brain';
import { LinkAction } from '../shell/LinkButton';
import { ScreenTitle } from '../shell/ScreenTitle';
import { AssistantPanel } from '../slots';
import { Notice, Section } from '../ui';

const COLUMNS = ['known', 'mriOnly', 'notKnowableOnBoard'] as const;
const CERTAINTIES: readonly KnowledgeCertainty[] = [
  'established',
  'limited-evidence',
  'unknown',
  'not-measurable-on-board',
];

type T = ReturnType<typeof useMessages<keyof (typeof brainMessages)['en']>>;

/**
 * How firm a statement is, in words. The frame repeats it, so it does not rest on colour: the
 * firmer, the more solid (filled, solid edge, dashed, dotted). No level colours: nothing here is an alert.
 */
function Certainty({ certainty, t }: { certainty: KnowledgeCertainty; t: T }) {
  return (
    <span className={`co-ficha certainty certainty--${certainty}`} title={t(`certainty.${certainty}.help`)}>
      {t(`certainty.${certainty}`)}
    </span>
  );
}

function Statement({ statement, t }: { statement: KnowledgeStatement; t: T }) {
  const { locale } = useI18n();
  return (
    <li className="statement">
      <p className="statement__certainty">
        <Certainty certainty={statement.certainty} t={t} />
      </p>
      <p className="co-texto statement__text">{statement.text[locale]}</p>
      <p className="co-rotulo statement__sources-label">{t('sources')}</p>
      <ul className="co-nota statement__sources">
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
    <div className="co-detalle co-velo co-detalle--primera brain">
      <Section id="cerebro" level={1} title={t('title')} note={t('lead')}>
        <div className="co-pila co-pila--holgada">
          <Notice title={t('tool')} />
          <div className="co-pila">
            <h2 className="co-micro">{t('certainty.heading')}</h2>
            <dl className="brain__legend">
              {CERTAINTIES.map((certainty) => (
                <div key={certainty}>
                  <dt>
                    <Certainty certainty={certainty} t={t} />
                  </dt>
                  <dd className="co-nota">{t(`certainty.${certainty}.help`)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      <div className="co-seccion co-seccion--apilada">
        <div className="brain__columns">
          {COLUMNS.map((column) => (
            <section key={column} className="brain__column" aria-labelledby={`brain-${column}`}>
              <h2 id={`brain-${column}`} className="co-subtitulo">
                {t(`column.${column}`)}
              </h2>
              <ul className="brain__statements">
                {BRAIN_KNOWLEDGE[column].map((statement) => (
                  <Statement key={statement.id} statement={statement} t={t} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <Section id="desde-aca" title={t('actions.heading')}>
        <div className="co-fila">
          <AssistantPanel record={null} />
          <LinkAction to={{ name: 'how' }} icon="book-open">
            {t('actions.how')}
          </LinkAction>
          <LinkAction to={{ name: 'home' }} icon="house">
            {t('actions.home')}
          </LinkAction>
        </div>
      </Section>
    </div>
  );
}
