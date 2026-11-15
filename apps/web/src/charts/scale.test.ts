import { describe, expect, it } from 'vitest';
import { bandOf, bands, changeDomain, linearScale, tickStep, ticks, unionDomain } from './scale';

const NASA = { firstSignUm: 19.4, clinicallyConcerningUm: 55 };

describe('changeDomain', () => {
  it('is −20 to +80 µm by default', () => {
    expect(changeDomain([])).toEqual({ min: -20, max: 80 });
    expect(changeDomain([0])).toEqual({ min: -20, max: 80 });
    expect(changeDomain([24, 16, 32])).toEqual({ min: -20, max: 80 });
    expect(changeDomain([80])).toEqual({ min: -20, max: 80 });
    expect(changeDomain([-20])).toEqual({ min: -20, max: 80 });
  });

  it('extends to +140 when the value or its range does not fit', () => {
    expect(changeDomain([80.1])).toEqual({ min: -20, max: 140 });
    expect(changeDomain([74, 66, 82])).toEqual({ min: -20, max: 140 });
    expect(changeDomain([140])).toEqual({ min: -20, max: 140 });
  });

  it('extends to +260 for the largest published changes', () => {
    expect(changeDomain([140.5])).toEqual({ min: -20, max: 260 });
    expect(changeDomain([232, 224, 240])).toEqual({ min: -20, max: 260 });
    expect(changeDomain([260])).toEqual({ min: -20, max: 260 });
  });

  it('keeps growing in round steps beyond +260 instead of cutting a value off', () => {
    expect(changeDomain([261])).toEqual({ min: -20, max: 300 });
    expect(changeDomain([300])).toEqual({ min: -20, max: 300 });
    expect(changeDomain([301])).toEqual({ min: -20, max: 400 });
  });

  it('starts on a round value when a change is below −20', () => {
    expect(changeDomain([-20.5])).toEqual({ min: -40, max: 80 });
    expect(changeDomain([-40])).toEqual({ min: -40, max: 80 });
    expect(changeDomain([-75, 100])).toEqual({ min: -80, max: 140 });
  });

  it('always contains 0, the pre-flight exam', () => {
    for (const values of [[5], [200], [-60], [30, 250, -30]]) {
      const domain = changeDomain(values);
      expect(domain.min).toBeLessThan(0);
      expect(domain.max).toBeGreaterThan(0);
      expect(Math.abs(domain.min % 20)).toBe(0);
    }
  });

  it('ignores values that are missing or not finite', () => {
    expect(changeDomain([null, undefined, Number.NaN, Number.POSITIVE_INFINITY, 30])).toEqual({ min: -20, max: 80 });
  });
});

describe('unionDomain', () => {
  it('gives both eyes the wider scale, so the two lines compare', () => {
    expect(unionDomain([changeDomain([66, 74]), changeDomain([38])])).toEqual({ min: -20, max: 80 });
    expect(unionDomain([changeDomain([168]), changeDomain([38])])).toEqual({ min: -20, max: 260 });
    expect(unionDomain([changeDomain([-30]), changeDomain([100])])).toEqual({ min: -40, max: 140 });
    expect(unionDomain([])).toEqual({ min: -20, max: 80 });
  });
});

describe('linearScale', () => {
  it('maps the limits of the domain to the limits of the range', () => {
    const x = linearScale({ min: -20, max: 80 }, 10, 510);
    expect(x(-20)).toBe(10);
    expect(x(80)).toBe(510);
    expect(x(0)).toBe(110);
    expect(x(30)).toBe(260);
  });

  it('works on a reversed range, as a vertical axis needs', () => {
    const y = linearScale({ min: -20, max: 80 }, 300, 0);
    expect(y(-20)).toBe(300);
    expect(y(80)).toBe(0);
    expect(y(0)).toBe(240);
  });
});

describe('ticks', () => {
  it('gives round values that include 0', () => {
    expect(ticks({ min: -20, max: 80 }, 20)).toEqual([-20, 0, 20, 40, 60, 80]);
    expect(ticks({ min: -20, max: 140 }, 50)).toEqual([0, 50, 100]);
    expect(ticks({ min: -20, max: 260 }, 50)).toEqual([0, 50, 100, 150, 200, 250]);
    expect(ticks({ min: -40, max: 80 }, 20)).toEqual([-40, -20, 0, 20, 40, 60, 80]);
    expect(ticks({ min: 0, max: 180 }, 30)).toEqual([0, 30, 60, 90, 120, 150, 180]);
  });

  it('never writes a negative zero', () => {
    expect(Object.is(ticks({ min: -20, max: 20 }, 20)[1], 0)).toBe(true);
  });
});

describe('tickStep', () => {
  it('uses 20 µm on the default axis, at any width a screen can have', () => {
    expect(tickStep({ min: -20, max: 80 }, 280, 44)).toBe(20);
    expect(tickStep({ min: -20, max: 80 }, 1000, 44)).toBe(20);
  });

  it('thins the ticks when the axis is long or the screen is narrow', () => {
    expect(tickStep({ min: -20, max: 260 }, 300, 44)).toBe(50);
    expect(tickStep({ min: -20, max: 260 }, 900, 44)).toBe(20);
    expect(tickStep({ min: -20, max: 140 }, 300, 44)).toBe(50);
  });
});

describe('bands', () => {
  it('applies NASA’s limits as written: above 19.4, and 55 or more', () => {
    expect(bandOf(19.4, NASA)).toBe('normal-variation');
    expect(bandOf(19.5, NASA)).toBe('first-sign');
    expect(bandOf(54.9, NASA)).toBe('first-sign');
    expect(bandOf(55, NASA)).toBe('clinically-concerning');
    expect(bandOf(-5, NASA)).toBe('normal-variation');
    expect(bandOf(232, NASA)).toBe('clinically-concerning');
  });

  it('covers the whole axis with three bands that meet at the thresholds', () => {
    expect(bands({ min: -20, max: 80 }, NASA)).toEqual([
      { id: 'normal-variation', from: -20, to: 19.4 },
      { id: 'first-sign', from: 19.4, to: 55 },
      { id: 'clinically-concerning', from: 55, to: 80 },
    ]);
    const extended = bands({ min: -40, max: 260 }, NASA);
    expect(extended[0]?.from).toBe(-40);
    expect(extended[2]?.to).toBe(260);
  });
});
