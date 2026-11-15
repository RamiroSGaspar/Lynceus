import { describe, expect, it } from 'vitest';
import {
  canMeasureNormalVision,
  decimalToLogMar,
  logMarToDecimal,
  logMarToSnellenDenominator,
  makeScreenCalibration,
  MM_PER_INCH,
  optotypeSizeMm,
  optotypeSizePx,
  pxPerMmFromCard,
  screenFloorLogMar,
  snellenToLogMar,
  strokeMmToLogMar,
} from '../../src/vision/acuity-geometry';

describe('optotype size', () => {
  it('matches the 40 cm examples of section 1.A', () => {
    const normal = optotypeSizeMm(0, 40);
    expect(normal.heightMm).toBeCloseTo(0.582, 3);
    expect(normal.strokeMm).toBeCloseTo(0.116, 3);
    expect(optotypeSizeMm(-0.1, 40).heightMm).toBeCloseTo(0.46, 2);
    expect(optotypeSizeMm(0.3, 40).heightMm).toBeCloseTo(1.16, 2);
    expect(optotypeSizeMm(0.5, 40).heightMm).toBeCloseTo(1.84, 2);
    expect(optotypeSizeMm(1.0, 40).heightMm).toBeCloseTo(5.82, 2);
  });

  it('converts to device pixels with decimals', () => {
    const size = optotypeSizePx(0, 40, 10);
    expect(size.heightPx).toBeCloseTo(5.818, 3);
    expect(size.strokePx).toBeCloseTo(size.heightPx / 5, 10);
  });

  it('inverts back to logMAR', () => {
    for (const logMar of [-0.3, 0, 0.42, 1.3]) {
      expect(strokeMmToLogMar(optotypeSizeMm(logMar, 40).strokeMm, 40)).toBeCloseTo(logMar, 10);
    }
  });
});

describe('screen floor', () => {
  const pxPerMm141 = 141 / MM_PER_INCH;

  it('gives +0.19 at 141 ppi with a one-pixel stroke', () => {
    expect(screenFloorLogMar(pxPerMm141, 40, 1)).toBeCloseTo(0.19, 2);
  });

  it('needs 218 ppi for 20/20 with one-pixel strokes and 262 ppi for 1.2 decimal', () => {
    expect(screenFloorLogMar(218 / MM_PER_INCH, 40, 1)).toBeCloseTo(0, 2);
    expect(screenFloorLogMar(262 / MM_PER_INCH, 40, 1)).toBeCloseTo(-0.08, 2);
  });

  it('uses half-pixel anti-aliased strokes by default', () => {
    expect(screenFloorLogMar(pxPerMm141, 40)).toBeCloseTo(0.19 - Math.log10(2), 2);
  });

  it('says whether normal vision can be measured', () => {
    expect(canMeasureNormalVision(screenFloorLogMar(pxPerMm141, 40))).toBe(true);
    expect(canMeasureNormalVision(screenFloorLogMar(pxPerMm141, 40, 1))).toBe(false);
    expect(canMeasureNormalVision(-0.08)).toBe(true);
    expect(canMeasureNormalVision(-0.07)).toBe(false);
  });

  it('builds a calibration from the card width', () => {
    expect(pxPerMmFromCard(856)).toBeCloseTo(10, 10);
    const calibration = makeScreenCalibration(pxPerMm141);
    expect(calibration.viewingDistanceCm).toBe(40);
    expect(calibration.floorLogMar).toBeCloseTo(screenFloorLogMar(pxPerMm141, 40), 12);
  });
});

describe('notations', () => {
  it('converts known values', () => {
    expect(logMarToSnellenDenominator(0)).toBe(20);
    expect(logMarToSnellenDenominator(0.3)).toBeCloseTo(39.9, 1);
    expect(logMarToSnellenDenominator(1)).toBeCloseTo(200, 8);
    expect(logMarToDecimal(0)).toBe(1);
    expect(logMarToDecimal(1)).toBeCloseTo(0.1, 12);
    expect(decimalToLogMar(0.5)).toBeCloseTo(0.301, 3);
    expect(snellenToLogMar(20, 40)).toBeCloseTo(0.301, 3);
    expect(snellenToLogMar(20, 20)).toBe(0);
  });

  it('matches the manual example: 6 arcmin stroke is decimal 0.17, 20/120, 0.78 logMAR', () => {
    const logMar = Math.log10(6);
    expect(logMar).toBeCloseTo(0.78, 2);
    expect(logMarToDecimal(logMar)).toBeCloseTo(0.17, 2);
    expect(logMarToSnellenDenominator(logMar)).toBeCloseTo(120, 8);
  });
});
