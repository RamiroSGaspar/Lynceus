import { CARD_HEIGHT_MM, CARD_WIDTH_MM } from '@app/core/vision/index';
import { useState } from 'react';
import { useI18n, useMessages } from '../../i18n';
import { Button, OriginTag } from '../../ui';
import { loadCalibration, saveCalibration, type StoredCalibration } from './calibrationStore';
import { FocusHeading } from './FocusHeading';
import { calibrationMessages } from './messages';
import { useDevicePixelRatio } from './useDevicePixelRatio';

/** CSS reference pixel: 96 per inch. Only the starting size of the box. */
const CSS_PX_PER_MM = 96 / 25.4;
const MIN_WIDTH_CSS = 80;
const MAX_WIDTH_CSS = 1400;

/**
 * Card-matching calibration (research doc `pruebas-de-vision-en-pantalla.md`, 1.A, L1 and F1):
 * the box is resized until it matches a bank-size card held against the screen.
 * Pixels per millimetre = box width in device pixels / card side in millimetres.
 */
export function Calibration({ onDone }: { onDone(stored: StoredCalibration): void }) {
  const t = useMessages(calibrationMessages);
  const { formatNumber } = useI18n();
  const dpr = useDevicePixelRatio();
  const [saved] = useState(loadCalibration);
  const savedUsable = saved !== null && Math.abs(saved.devicePixelRatio - dpr) < 0.01;
  const [adjusting, setAdjusting] = useState(!savedUsable);
  const [upright, setUpright] = useState(() => window.innerWidth < 600);
  const sideMm = upright ? CARD_HEIGHT_MM : CARD_WIDTH_MM;
  const otherMm = upright ? CARD_WIDTH_MM : CARD_HEIGHT_MM;
  const [widthCss, setWidthCss] = useState(() =>
    saved ? (saved.calibration.pxPerMm / saved.devicePixelRatio) * sideMm : sideMm * CSS_PX_PER_MM,
  );
  const pxPerMm = (widthCss * dpr) / sideMm;
  const clamp = (value: number) => Math.min(MAX_WIDTH_CSS, Math.max(MIN_WIDTH_CSS, value));
  const nudge = (delta: number) => setWidthCss((width) => clamp(Math.round((width + delta) * 2) / 2));

  const switchOrientation = () => {
    // Keep the same scale when the card is turned.
    setWidthCss((width) => clamp((width / sideMm) * otherMm));
    setUpright((value) => !value);
  };

  if (!adjusting && saved) {
    return (
      <section className="vt-panel" aria-labelledby="vt-calibration-title">
        <FocusHeading>
          <span id="vt-calibration-title">{t('title')}</span>
        </FocusHeading>
        <p>{t('saved', { value: formatNumber(saved.calibration.pxPerMm, { maximumFractionDigits: 2 }) })}</p>
        <p className="vt-note">{t('zoomWarning')}</p>
        <div className="vt-actions">
          <Button variant="primary" size="lg" onClick={() => onDone(saved)}>
            {t('useSaved')}
          </Button>
          <Button size="lg" onClick={() => setAdjusting(true)}>
            {t('redo')}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="vt-panel" aria-labelledby="vt-calibration-title">
      <FocusHeading>
        <span id="vt-calibration-title">{t('title')}</span>
      </FocusHeading>
      <p>{t('intro')}</p>
      <p>
        <strong>
          {t('matchSide', {
            side: t(upright ? 'side.short' : 'side.long'),
            mm: formatNumber(sideMm, { minimumFractionDigits: 2 }),
          })}
        </strong>
      </p>
      <div className="vt-card-area">
        <div
          className="vt-card-box"
          role="img"
          aria-label={t('boxLabel')}
          style={{ width: `${widthCss}px`, height: `${(widthCss / sideMm) * otherMm}px` }}
        />
      </div>
      <div className="vt-calibration-controls">
        <Button aria-label={`${t('smaller')} (10)`} onClick={() => nudge(-10)}>
          −10
        </Button>
        <Button aria-label={`${t('smaller')} (1)`} onClick={() => nudge(-1)}>
          −1
        </Button>
        <label className="vt-slider">
          <span className="vt-visually-hidden">{t('slider')}</span>
          <input
            type="range"
            min={MIN_WIDTH_CSS}
            max={MAX_WIDTH_CSS}
            step={0.5}
            value={widthCss}
            onChange={(event) => setWidthCss(clamp(Number(event.target.value)))}
          />
        </label>
        <Button aria-label={`${t('larger')} (1)`} onClick={() => nudge(1)}>
          +1
        </Button>
        <Button aria-label={`${t('larger')} (10)`} onClick={() => nudge(10)}>
          +10
        </Button>
      </div>
      <p className="vt-note">{t('keyboardHint')}</p>
      <p className="vt-measure">
        <span>{t('result')}:</span>{' '}
        <strong className="vt-number">{formatNumber(pxPerMm, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>{' '}
        <OriginTag origin="derived" />
        <span className="vt-note"> {t('result.how', { mm: formatNumber(sideMm, { minimumFractionDigits: 2 }) })}</span>
      </p>
      <p className="vt-note">{t('zoomWarning')}</p>
      <div className="vt-actions">
        <Button variant="primary" size="lg" onClick={() => onDone(saveCalibration(pxPerMm, dpr))}>
          {t('done')}
        </Button>
        <Button onClick={switchOrientation}>{t(upright ? 'landscape' : 'upright')}</Button>
      </div>
    </section>
  );
}
