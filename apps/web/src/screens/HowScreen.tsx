import { useDocumentTitle } from '../app/hooks';
import { useMessages } from '../i18n';
import { howMessages } from '../i18n/how';
import { LinkAction } from '../shell/LinkButton';
import { Section } from '../ui';
import { HowValidation } from './HowValidation';

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
    <div className="co-detalle co-velo co-detalle--primera how">
      <Section id="como" level={1} title={t('title')} note={t('lead')}>
        <div className="co-pila co-pila--holgada">
          <h2 className="co-micro" id="how-real">
            {t('real.heading')}
          </h2>
          <div className="how__split">
            <div className="how__side how__side--real">
              <h3 className="co-subtitulo">{t('real.real')}</h3>
              <ul className="co-lista">
                {REAL.map((item) => (
                  <li key={item}>{t(`real.${item}`)}</li>
                ))}
              </ul>
            </div>
            <div className="how__side how__side--fictional">
              <h3 className="co-subtitulo">{t('real.fictional')}</h3>
              <ul className="co-lista">
                {FICTIONAL.map((item) => (
                  <li key={item}>{t(`real.${item}`)}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="co-nota">{t('real.note')}</p>
        </div>
      </Section>

      <Section id="pasos" title={t('steps.heading')} stacked>
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
        <div className="co-pila">
          <p className="co-nota">{t('steps.retry')}</p>
          <p className="co-nota">{t('steps.notMeasured')}</p>
        </div>
      </Section>

      <Section id="supuestos" title={t('assumptions.heading')} note={t('assumptions.lead')}>
        <div className="co-pila">
          <ol className="how__assumptions">
            {ASSUMPTIONS.map((assumption) => (
              <li key={assumption}>{t(`assumption.${assumption}`)}</li>
            ))}
          </ol>
          <p className="co-rotulo">{t('assumptions.more')}</p>
        </div>
      </Section>

      <Section id="validacion" title={t('validation.heading')} note={t('validation.what')}>
        <div className="co-pila co-pila--holgada">
          <p className="co-texto">{t('validation.use')}</p>
          <HowValidation />
        </div>
      </Section>

      <Section id="desde-aca" title={t('actions.heading')}>
        <div className="co-fila">
          <LinkAction to={{ name: 'brain' }} icon="brain">
            {t('actions.brain')}
          </LinkAction>
          <LinkAction to={{ name: 'home' }} icon="house">
            {t('actions.home')}
          </LinkAction>
        </div>
      </Section>
    </div>
  );
}
