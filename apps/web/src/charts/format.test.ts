import { describe, expect, it } from 'vitest';
import { changeDigits, changeFormat } from './format';

const NASA = { firstSignUm: 19.4, clinicallyConcerningUm: 55 };

describe('changeDigits', () => {
  it('shows whole micrometres when rounding does not move the value across a threshold', () => {
    for (const value of [0, 9, 19.4, 19.6, 24, 31.4, 55, 66.2, 232, -5.3]) {
      expect(changeDigits(value, NASA), String(value)).toBe(0);
    }
  });

  it('adds the decimals that keep a value on its own side of a threshold', () => {
    expect(changeDigits(54.6, NASA)).toBe(1);
    expect(changeDigits(54.96, NASA)).toBe(2);
    expect(changeDigits(19.44, NASA)).toBe(2);
    expect(changeDigits(19.5, NASA)).toBe(0);
  });

  it('formats with an explicit sign', () => {
    const format = (value: number): string => new Intl.NumberFormat('en-US', changeFormat(value, NASA)).format(value);
    expect(format(24.2)).toBe('+24');
    expect(format(54.6)).toBe('+54.6');
    expect(format(-5.3)).toBe('-5');
    expect(format(0)).toBe('0');
  });
});
