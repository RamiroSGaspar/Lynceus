import { useDocumentTitle } from '../app/hooks';
import { useMessages } from '../i18n';
import { howMessages } from '../i18n/how';
import { LinkButton } from '../shell/LinkButton';
import { ScreenTitle } from '../shell/ScreenTitle';

/** The eight steps of the process, in the order of section 5 of the architecture document. */
const STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
/** The project's own assumptions, numbered as in section 12 of the architecture document. */
const ASSUMPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const REAL = ['process', 'tests', 'format', 'thresholds'] as const;
const FICTIONAL = ['data', 'instrument', 'history'] as const;

/** How it works: the process step by step, with its sources, its assumptions and its validation. */
export function HowScreen() {
  const t = useMessages(howMessages);
  useDocumentTitle(t('title'));
  return (
    <div className="screen how">
      <ScreenTitle>{t('title')}</ScreenTitle>
      <p className="lead">{t('lead')}</p>

      <section className="screen__section" aria-labelledby="how-real">
        <h2 id="how-real">{t('real.heading')}</h2>
        <div className="how__split">
          <div className="how__side how__side--real">
            <h3>{t('real.real')}</h3>
            <ul>
              {REAL.map((item) => (
                <li key={item}>{t(`real.${item}`)}</li>
              ))}
            </ul>
          </div>
          <div className="how__side how__side--fictional">
            <h3>{t('real.fictional')}</h3>
            <ul>
              {FICTIONAL.map((item) => (
                <li key={item}>{t(`real.${item}`)}</li>
              ))}
            </ul>
          </div>
        </div>
        <p>{t('real.note')}</p>
      </section>

      <section className="screen__section" aria-labelledby="how-steps">
        <h2 id="how-steps">{t('steps.heading')}</h2>
        <ol className="how__steps">
          {STEPS.map((step) => (
            <li key={step} className="how__step">
              <h3>
                <span className="how__number">{step}</span> {t(`step.${step}.name`)}
              </h3>
              <dl>
                <div>
                  <dt>{t('steps.method')}</dt>
                  <dd>{t(`step.${step}.method`)}</dd>
                </div>
                <div>
                  <dt>{t('steps.backing')}</dt>
                  <dd>{t(`step.${step}.backing`)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
        <p>{t('steps.retry')}</p>
        <p>{t('steps.notMeasured')}</p>
      </section>

      <section className="screen__section" aria-labelledby="how-assumptions">
        <h2 id="how-assumptions">{t('assumptions.heading')}</h2>
        <p>{t('assumptions.lead')}</p>
        <ol className="how__assumptions">
          {ASSUMPTIONS.map((assumption) => (
            <li key={assumption}>{t(`assumption.${assumption}`)}</li>
          ))}
        </ol>
        <p className="note">{t('assumptions.more')}</p>
      </section>

      <section className="screen__section" aria-labelledby="how-validation">
        <h2 id="how-validation">{t('validation.heading')}</h2>
        <p>{t('validation.what')}</p>
        <p>{t('validation.use')}</p>
        <p className="callout callout--caution">{t('validation.pending')}</p>
        <p>{t('validation.limit')}</p>
      </section>

      <section className="screen__section" aria-labelledby="how-actions">
        <h2 id="how-actions">{t('actions.heading')}</h2>
        <div className="actions">
          <LinkButton to={{ name: 'brain' }}>{t('actions.brain')}</LinkButton>
          <LinkButton to={{ name: 'home' }} variant="ghost">
            {t('actions.home')}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
