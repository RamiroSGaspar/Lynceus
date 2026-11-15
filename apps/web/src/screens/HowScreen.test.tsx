import { describe, expect, it } from 'vitest';
import { LOCALES, renderHtml, textOf, unfilledPlaceholders } from '../testing/render';
import { HowScreen } from './HowScreen';

describe('screen "how it works"', () => {
  it.each(LOCALES)('shows in %s the eight steps in order, each with its method and its backing', (locale) => {
    const html = renderHtml(<HowScreen />, locale);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html.match(/class="how__step"/g)).toHaveLength(8);
    const numbers = [...html.matchAll(/class="how__number">(\d)</g)].map((match) => match[1]);
    expect(numbers).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
    expect(html.match(/<dt>/g)).toHaveLength(16);
    expect(unfilledPlaceholders(html)).toEqual([]);
  });

  it('names the steps as the architecture document does', () => {
    const text = textOf(renderHtml(<HowScreen />, 'en'));
    const names = [
      'Read the exam',
      'Check the quality',
      'Mark two boundaries',
      'Locate the opening of the nerve',
      'Measure',
      'Compare',
      'Work out the uncertainty',
      'Classify and decide',
    ];
    let from = 0;
    for (const name of names) {
      const at = text.indexOf(name, from);
      expect(at, name).toBeGreaterThan(-1);
      from = at;
    }
  });

  it.each(LOCALES)('lists in %s the project’s own assumptions', (locale) => {
    const html = renderHtml(<HowScreen />, locale);
    expect(html.match(/<ol class="how__assumptions">([\s\S]*?)<\/ol>/)?.[1]?.match(/<li>/g)).toHaveLength(11);
  });

  it('makes clear what is real and what is fictional', () => {
    const html = renderHtml(<HowScreen />, 'en');
    const text = textOf(html);
    expect(html).toContain('how__side--real');
    expect(html).toContain('how__side--fictional');
    expect(text).toContain('The process:');
    expect(text).toContain('The data: the four crew members, their eyes and their exams are invented.');
    expect(text).toContain('No tomograph is connected.');
  });

  it('says that it has not been validated on people', () => {
    expect(textOf(renderHtml(<HowScreen />, 'en'))).toContain('it has not been validated on people');
    expect(textOf(renderHtml(<HowScreen />, 'es'))).toContain('no está validado con personas');
  });
});
