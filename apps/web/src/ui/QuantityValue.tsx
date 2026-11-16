import type { Quantity } from '@app/core';
import { commonMessages } from '../i18n/common';
import { useI18n, useMessages } from '../i18n';
import { OriginTag } from './OriginTag';

interface Props {
  quantity: Quantity;
  /** Show an explicit plus sign: use it for changes, not for absolute values. */
  signed?: boolean;
  /** Decimal places. Default: none for micrometres, two otherwise. */
  digits?: number;
  showRange?: boolean;
  showOrigin?: boolean;
}

/** Decimal places a quantity is written with when none is asked for. */
export function defaultDigits(quantity: Quantity): number {
  return quantity.unit === 'µm' || quantity.unit === 'days' || quantity.unit === '%' ? 0 : 2;
}

/**
 * A number never travels alone: value, unit, range when there is one, and how it was obtained.
 * This is the figure inside a sentence or a table cell; on its own line it is a `Readout`.
 */
export function QuantityValue({ quantity, signed = false, digits, showRange = true, showOrigin = false }: Props) {
  const { formatNumber } = useI18n();
  const t = useMessages(commonMessages);
  const places = digits ?? defaultDigits(quantity);
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
    signDisplay: signed ? 'exceptZero' : 'auto',
  };
  const range = quantity.interval95;
  return (
    <span className="co-cifra">
      <span className="co-cifra__valor">
        {formatNumber(quantity.value, options)}
        {quantity.unit && (
          <>
            {' '}
            <span className="co-cifra__unidad">{quantity.unit}</span>
          </>
        )}
      </span>
      {showRange && range && (
        <>
          {' '}
          <span className="co-cifra__rango">
            ({t('range.to', { low: formatNumber(range[0], options), high: formatNumber(range[1], options) })})
          </span>
        </>
      )}
      {showOrigin && <OriginTag origin={quantity.origin} />}
    </span>
  );
}
