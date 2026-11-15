import { describe, expect, it } from 'vitest';
import { PRODUCT } from '../src/index';

describe('product', () => {
  it('declares the name and the simulated-data notice in both languages', () => {
    expect(PRODUCT.name.length).toBeGreaterThan(0);
    for (const locale of ['en', 'es'] as const) {
      expect(PRODUCT.tagline[locale].length).toBeGreaterThan(0);
      expect(PRODUCT.simulatedDataNotice[locale].length).toBeGreaterThan(0);
    }
  });
});
