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

/** A number never travels alone: value, unit, range when there is one, and how it was obtained. */
export function QuantityValue({ quantity, signed = false, digits, showRange = true, showOrigin = false }: Props) {
  const { formatNumber } = useI18n();
  const t = useMessages(commonMessages);
  const places = digits ?? (quantity.unit === 'µm' || quantity.unit === 'days' || quantity.unit === '%' ? 0 : 2);
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
    signDisplay: signed ? 'exceptZero' : 'auto',
  };
  const range = quantity.interval95;
  return (
    <span className="qty">
      <span className="qty__value">{formatNumber(quantity.value, options)}</span>
      {quantity.unit && <span className="qty__unit">{quantity.unit}</span>}
      {showRange && range && (
        <span className="qty__range">
          ({t('range.to', { low: formatNumber(range[0], options), high: formatNumber(range[1], options) })})
        </span>
      )}
      {showOrigin && <OriginTag origin={quantity.origin} />}
    </span>
  );
}
