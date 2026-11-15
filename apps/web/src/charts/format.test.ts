import { describe, expect, it } from 'vitest';
import { formatExact, formatPlain, formatSigned, percentLabel } from '../app/format';
import { changeDigits, formatChange } from './format';

const NASA = { firstSignUm: 19.4, clinicallyConcerningUm: 55 };

describe('changeDigits', () => {
  it('shows whole micrometres when rounding does not move the value across a threshold', () => {
    for (const value of [0, 9, 19.6, 24, 31.4, 55, 66.2, 232, -5.3]) {
      expect(changeDigits(value, NASA), String(value)).toBe(0);
    }
  });

  it('writes a value that sits exactly on a threshold with the decimals of the threshold', () => {
    expect(changeDigits(19.4, NASA)).toBe(1);
    expect(changeDigits(55, NASA)).toBe(0);
  });

  it('adds the decimals that keep a value on its own side of a threshold', () => {
    expect(changeDigits(54.6, NASA)).toBe(1);
    expect(changeDigits(54.96, NASA)).toBe(2);
    expect(changeDigits(19.44, NASA)).toBe(2);
  });
});

describe('formatChange', () => {
  it('writes an explicit sign, a true minus and the decimal mark of the language', () => {
    expect(formatChange(24.2, NASA, 'en')).toBe('+24');
    expect(formatChange(54.6, NASA, 'en')).toBe('+54.6');
    expect(formatChange(54.6, NASA, 'es')).toBe('+54,6');
    expect(formatChange(-5.3, NASA, 'en')).toBe('−5');
    expect(formatChange(0, NASA, 'en')).toBe('0');
    expect(formatChange(-0.2, NASA, 'en')).toBe('0');
  });

  it('writes the ends of a range with the decimals of their value', () => {
    expect(formatChange(46.3, NASA, 'en', 54.6)).toBe('+46.3');
    expect(formatChange(62.9, NASA, 'en', 54.6)).toBe('+62.9');
  });
});

describe('number formats shared with the texts of the core', () => {
  it('formats plain and signed numbers', () => {
    expect(formatPlain(-20, 0, 'en')).toBe('−20');
    expect(formatPlain(0.12, 2, 'es')).toBe('0,12');
    expect(formatSigned(0.06, 2, 'en')).toBe('+0.06');
    expect(formatSigned(-0.11, 2, 'es')).toBe('−0,11');
  });

  it('writes a published value with its own decimals', () => {
    expect(formatExact(19.4, 'en')).toBe('19.4');
    expect(formatExact(19.4, 'es')).toBe('19,4');
    expect(formatExact(55, 'en')).toBe('55');
    expect(formatExact(2.8, 'es')).toBe('2,8');
  });

  it('never writes a probability as 0 % or 100 %', () => {
    expect(percentLabel(0.944, 'very-likely', 'en')).toEqual({ kind: 'value', text: '94\u00a0%' });
    expect(percentLabel(0.00001, 'unlikely', 'en').kind).toBe('below');
    expect(percentLabel(0.99999, 'very-likely', 'en').kind).toBe('above');
  });
});
