import { describe, expect, it } from 'vitest';
import { PRODUCT, type SessionRecord } from '@app/core';
import { CREW, getHistory } from '../app/core';
import { lastControl } from '../app/history';
import { applyEvent, startDraft } from '../app/session';
import { withDraft, withMissionDay, withRecord } from '../app/store';
import { LOCALES, renderHtml, testStore, textOf, unfilledPlaceholders } from '../testing/render';
import { HomeScreen } from './HomeScreen';

const LEVEL_NAMES = {
  'no-detectable-change': 'No detectable change',
  'first-sign': 'First sign',
  'clinically-concerning': 'Clinically concerning',
  'acute-visual-symptom': 'Acute visual symptom',
  'not-measured': 'Could not be measured',
} as const;

/** The value of the radio button that is checked. */
function checkedRadio(html: string): string | undefined {
  const input = (html.match(/<input[^>]*>/g) ?? []).find((tag) => tag.includes('checked'));
  return input?.match(/value="([^"]*)"/)?.[1];
}

describe('start screen', () => {
  it.each(LOCALES)('opens in %s with the four crew members and the mission days', (locale) => {
    const html = renderHtml(<HomeScreen />, locale);
    const text = textOf(html);
    for (const member of CREW) {
      expect(text).toContain(member.name);
      expect(text).toContain(member.role[locale]);
    }
    expect(text).toContain(PRODUCT.tagline[locale]);
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    expect(checkedRadio(html)).toBe('150');
    expect(html.match(/href="#\/session\/[A-D]"/g)).toHaveLength(4);
    expect(html.match(/href="#\/history\/[A-D]"/g)).toHaveLength(4);
    expect(html).toContain('href="#/brain"');
    expect(html).toContain('href="#/how"');
    expect(unfilledPlaceholders(html)).toEqual([]);
  });

  it('shows the level of the last control of each crew member, with words and its day', () => {
    const text = textOf(renderHtml(<HomeScreen />, 'en'));
    for (const member of CREW) {
      const last = lastControl(getHistory(member.id, 150));
      expect(last).not.toBeNull();
      if (!last) continue;
      expect(text).toContain(`Flight day ${last.flightDay}`);
      expect(text).toContain(LEVEL_NAMES[last.assessment.level ?? 'not-measured']);
    }
  });

  it('travels to another mission day: the last control is the one before it', () => {
    const store = testStore((state) => withMissionDay(state, 90));
    const html = renderHtml(<HomeScreen />, 'en', store);
    expect(checkedRadio(html)).toBe('90');
    const text = textOf(html);
    for (const member of CREW) {
      const last = lastControl(getHistory(member.id, 90));
      expect(last && last.flightDay).toBeLessThan(90);
      expect(text).toContain(`Flight day ${last?.flightDay}`);
    }
    expect(text).toContain('Today’s control · Flight day 90');
    expect(text).not.toContain('Today’s control · Flight day 150');
  });

  it('offers to resume a control in progress and to see the result of one done here', () => {
    const done = getHistory('A', 151).find((record) => record.flightDay === 150) as SessionRecord;
    const store = testStore((state) =>
      withDraft(withRecord(state, { ...done, origin: 'live' }), applyEvent(startDraft('B', 150), { type: 'begin' })),
    );
    const html = renderHtml(<HomeScreen />, 'en', store);
    const text = textOf(html);
    expect(html).toContain('href="#/result/A/150"');
    expect(html.match(/href="#\/session\/[A-D]"/g)).toHaveLength(3);
    expect(text).toContain('See the result');
    expect(text).toContain('Resume today’s control');
    expect(text).toContain('In progress: step 2 of 7.');
    expect(text).toContain('done in this browser');
    // What is saved is said as two readouts: the figure, a line, and what it counts.
    expect(text).toMatch(/\b1 Controls done here\b/);
    expect(text).toMatch(/\b1 Controls in progress\b/);
  });

  it('says so when nothing is saved, and keeps the delete action disabled', () => {
    const html = renderHtml(<HomeScreen />, 'es');
    expect(textOf(html)).toContain('Todavía no hay nada guardado en este navegador.');
    expect(html).toMatch(/<button[^>]*disabled[^>]*>(?:<svg[\s\S]*?<\/svg>)?Borrar lo guardado en este navegador/);
  });
});
