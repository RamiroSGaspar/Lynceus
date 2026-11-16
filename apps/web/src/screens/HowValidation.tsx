import type { ValidationMeasure, ValidationPartition } from '@app/core/dataset/validationSummary';
import { ERROR_FEATURES } from '@app/core/rules/simulatedErrorModel';
import { ACTIVE_ERROR_MODEL, VALIDATION_SUMMARY, isProvisionalErrorModel } from '../app/core';
import { useI18n, useMessages } from '../i18n';
import { howMessages } from '../i18n/how';
import { Notice } from '../ui';

const PARTITIONS: readonly ValidationPartition[] = ['development', 'test-anatomy', 'test-family'];
const MEASURES: readonly ValidationMeasure[] = ['trt', 'roughness'];
/** Criteria whose value is a fraction, shown as a percentage. */
const SHARES = new Set(['coverage', 'coverage-low', 'beyond-3-se', 'clean-model-refused']);

/**
 * The validation as it was generated (`quality:fit`): sample, partitions, errors,
 * coverage, refusals, formula and weights, decision, limits and versions. Every
 * number comes from the validation summary in the core; none is written here.
 */
export function HowValidation() {
  const t = useMessages(howMessages);
  const { formatNumber } = useI18n();
  const summary = VALIDATION_SUMMARY;
  const n = (value: number, digits = 2) => (Number.isFinite(value) ? formatNumber(value, { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—');
  const pct = (value: number) => (Number.isFinite(value) ? formatNumber(value, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—');
  const failed = summary.decision.criteria.filter((c) => !c.passed);
  const active = !isProvisionalErrorModel(ACTIVE_ERROR_MODEL.version);
  const formula = (measure: ValidationMeasure) => {
    const term = summary.model[measure];
    return [n(term.intercept, 3), ...term.terms.map((x) => `${n(x.beta, 3)} · z(${x.feature})`)].join(' + ');
  };

  return (
    <>
      <p className="co-nota co-simulado">{t('validation.simulated')}</p>
      <p className="co-texto">
        {t('validation.sample', {
          captures: summary.sample.captures,
          references: summary.sample.references,
          eyes: summary.sample.eyes,
          crew: summary.sample.crewMembers,
        })}
      </p>
      <Notice title={active ? t('validation.active', { model: summary.versions.model }) : t('validation.inactive')} />
      {failed.length > 0 && (
        <ul className="co-lista">
          {failed.map((c) => (
            <li key={`${c.id}-${c.partition}-${c.measure}`}>
              {t('validation.failed', {
                criterion: t(`criterion.${c.id}` as Parameters<typeof t>[0]),
                partition: t(`partition.${c.partition}.short` as Parameters<typeof t>[0]),
                measure: t(`measure.${c.measure}` as Parameters<typeof t>[0]),
                value: SHARES.has(c.id) ? pct(c.value) : Number.isInteger(c.value) ? String(c.value) : n(c.value, 1),
                limit: `${c.comparison === '<=' ? '≤' : '≥'} ${SHARES.has(c.id) ? pct(c.limit) : n(c.limit, Number.isInteger(c.limit) ? 0 : 1)}`,
              })}
            </li>
          ))}
        </ul>
      )}

      <h3 className="co-subtitulo">{t('validation.partitions')}</h3>
      <p className="co-nota">{t('validation.partitions.lead')}</p>
      <div className="co-desliza">
        <table className="co-tabla">
          <caption>{t('validation.partitions.caption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('col.partition')}</th>
              <th scope="col">{t('col.crew')}</th>
              <th scope="col">{t('col.eyes')}</th>
              <th scope="col">{t('col.captures')}</th>
              <th scope="col">{t('col.engineRefused')}</th>
              <th scope="col">{t('col.modelRefused')}</th>
              <th scope="col">{t('col.pairs')}</th>
            </tr>
          </thead>
          <tbody>
            {PARTITIONS.map((p) => {
              const x = summary.partitions[p];
              return (
                <tr key={p}>
                  <th scope="row">{t(`partition.${p}` as Parameters<typeof t>[0])}</th>
                  <td>{x.crew.join(', ')}</td>
                  <td>{x.eyes}</td>
                  <td>{x.captures}</td>
                  <td>{x.engineRefused}</td>
                  <td>{x.modelRefused}</td>
                  <td>{x.pairs}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="co-subtitulo">{t('validation.errors')}</h3>
      <p className="co-nota">{t('validation.errors.lead')}</p>
      <div className="co-desliza">
        <table className="co-tabla co-tabla--ancha">
          <caption>{t('validation.errors.caption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('col.partition')}</th>
              <th scope="col">{t('col.measure')}</th>
              <th scope="col">{t('col.pairsEyes')}</th>
              <th scope="col">{t('col.bias')}</th>
              <th scope="col">{t('col.rmse')}</th>
              <th scope="col">{t('col.max')}</th>
              <th scope="col">{t('col.se')}</th>
              <th scope="col">{t('col.coverage')}</th>
            </tr>
          </thead>
          <tbody>
            {PARTITIONS.flatMap((p) =>
              MEASURES.map((m) => {
                const r = summary.partitions[p].results[m];
                return (
                  <tr key={`${p}-${m}`}>
                    <th scope="row">{t(`partition.${p}.short` as Parameters<typeof t>[0])}</th>
                    <td>{t(`measure.${m}` as Parameters<typeof t>[0])}</td>
                    <td>{t('cell.pairsEyes', { pairs: r.pairs, eyes: r.eyes })}</td>
                    <td>{n(r.biasUm)} µm</td>
                    <td>{n(r.rmseUm)} µm</td>
                    <td>{n(r.maxAbsUm)} µm</td>
                    <td>{n(r.medianSeUm)} µm</td>
                    <td>{t('cell.coverage', { value: pct(r.coverage), low: pct(r.coverageLow), high: pct(r.coverageHigh) })}</td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
      <p className="co-rotulo">{t('validation.errors.note')}</p>
      <p className="co-nota">
        {t('validation.gross', {
          trt: summary.grossErrors.trt,
          roughness: summary.grossErrors.roughness,
          trtTolerance: n(summary.grossErrors.toleranceTrtUm, 0),
          roughnessTolerance: n(summary.grossErrors.toleranceRoughnessUm, 1),
        })}
      </p>
      <p className="co-nota">
        {t('validation.correlation', {
          trt: n(summary.examErrorCorrelation.trt),
          roughness: n(summary.examErrorCorrelation.roughness),
          references: summary.examErrorCorrelation.references,
        })}
      </p>

      <h3 className="co-subtitulo">{active ? t('validation.model') : t('validation.model.experimental')}</h3>
      <p className="co-nota">{t('validation.model.lead')}</p>
      <ul className="co-lista co-formulas">
        {MEASURES.map((m) => (
          <li key={m}>
            {t(`measure.${m}` as Parameters<typeof t>[0])}: <code>s = exp({formula(m)}) µm</code>, <code>σ = {n(summary.model.calibration[m], 3)} · √(s₁² + s₀²)</code>
          </li>
        ))}
      </ul>
      <ul className="co-lista co-formulas co-apagado">
        {[...new Set(MEASURES.flatMap((m) => summary.model[m].terms.map((x) => x.feature)))].map((feature) => (
          <li key={feature}>
            <code>z({feature})</code> = {ERROR_FEATURES[feature].transform}
          </li>
        ))}
      </ul>
      <p className="co-nota">{active ? t('validation.domain') : t('validation.domain.inactive')}</p>

      <h3 className="co-subtitulo">{t('validation.limits')}</h3>
      <ul className="co-lista">
        <li>{t('validation.limit.people')}</li>
        <li>{t('validation.limit.shared')}</li>
        <li>{t('validation.limit.quality')}</li>
        <li>{t('validation.limit.probability')}</li>
        <li>{t('validation.limit')}</li>
      </ul>
      <p className="co-rotulo">
        {t('validation.versions', {
          protocol: summary.protocol,
          engine: summary.versions.engine,
          instrument: summary.versions.instrument,
          model: summary.versions.model,
        })}
      </p>
    </>
  );
}
