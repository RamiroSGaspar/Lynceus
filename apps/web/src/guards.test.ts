/**
 * Requirements that hold for the whole interface, checked on its sources:
 * contrast of the text against its background, no network use, and the product
 * name written in one place only.
 */
/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PRODUCT } from '@app/core';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const read = (path: string): string => readFileSync(`${ROOT}${path}`, 'utf8');

/** What this specification owns: everything under `src` except the three features other people build. */
const own: [path: string, text: string][] = (readdirSync(ROOT, { recursive: true }) as string[])
  .map((path) => path.replaceAll('\\', '/'))
  .filter((path) => /\.(ts|tsx|css)$/.test(path) && !path.startsWith('features/'))
  .sort()
  .map((path) => [path, read(path)]);

const tokensCss = read('styles/tokens.css');

/** The colours of the screen palette: the first `:root` block of tokens.css. */
function screenTokens(): Record<string, string> {
  const block = tokensCss.slice(0, tokensCss.indexOf('@media print'));
  return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((match) => [match[1], match[2]]));
}

function luminance(hex: string): number {
  const channel = (index: number): number => {
    const value = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

describe('contrast of the text (NASA display standard: 10:1 preferred, never under 6:1)', () => {
  const tokens = screenTokens();
  const ratio = (foreground: string, background: string): number =>
    contrast(tokens[foreground] as string, tokens[background] as string);
  const SURFACES = ['--color-bg', '--color-surface', '--color-surface-raised'];
  const BANDS = ['--level-none-bg', '--level-advisory-bg', '--level-caution-bg', '--level-warning-bg'];

  it('reads the palette from tokens.css', () => {
    for (const name of ['--color-text', '--color-text-secondary', '--color-text-muted', ...SURFACES, ...BANDS]) {
      expect(tokens[name], name).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('gives reading text 10:1 or more on every surface and on every band of the charts', () => {
    for (const background of [...SURFACES, ...BANDS]) {
      expect(ratio('--color-text', background), background).toBeGreaterThanOrEqual(10);
    }
    // Secondary text is read on the page and on cards; on a raised surface or a band it only labels.
    for (const background of ['--color-bg', '--color-surface']) {
      expect(ratio('--color-text-secondary', background), background).toBeGreaterThanOrEqual(10);
    }
  });

  it('never goes under 6:1, for any text colour on any background it is used on', () => {
    for (const background of [...SURFACES, ...BANDS]) {
      expect(ratio('--color-text-secondary', background), background).toBeGreaterThanOrEqual(6);
    }
    for (const background of SURFACES) {
      for (const foreground of [
        '--color-text-muted',
        '--color-accent',
        '--level-none',
        '--level-advisory',
        '--level-caution',
        '--level-warning',
        '--origin-measured',
        '--origin-estimated',
        '--origin-reported',
        '--series-od',
        '--series-os',
      ]) {
        expect(ratio(foreground, background), `${foreground} on ${background}`).toBeGreaterThanOrEqual(6);
      }
    }
    expect(ratio('--color-accent-contrast', '--color-accent')).toBeGreaterThanOrEqual(6);
    for (const level of ['none', 'advisory', 'caution', 'warning']) {
      expect(ratio(`--level-${level}`, `--level-${level}-bg`), level).toBeGreaterThanOrEqual(6);
    }
  });
});

describe('health data stay on the device', () => {
  it('makes no network request from the screens, the charts or the storage', () => {
    const network = /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|\bimportScripts\b/;
    const offenders = own.filter(([path, text]) => !path.endsWith('.test.ts') && !path.endsWith('.test.tsx') && network.test(text));
    expect(offenders.map(([path]) => path)).toEqual([]);
  });
});

describe('design tokens and product name', () => {
  it('writes the product name nowhere: it is read from the core', () => {
    const offenders = own.filter(([, text]) => text.includes(PRODUCT.name));
    expect(offenders.map(([path]) => path)).toEqual([]);
  });

  it('uses no colour outside tokens.css', () => {
    const colour = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
    const offenders = own.filter(
      ([path, text]) =>
        path.endsWith('.css') &&
        path !== 'styles/tokens.css' &&
        // ui.css is one of the shared pieces that exist already and are used as they are.
        path !== 'styles/ui.css' &&
        colour.test(text),
    );
    expect(offenders.map(([path]) => path)).toEqual([]);
  });
});
