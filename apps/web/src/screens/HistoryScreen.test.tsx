import { describe, expect, it, vi } from 'vitest';
import type { SessionRecord } from '@app/core';
import { CREW, getHistory } from '../app/core';
import { inFlightControls } from '../app/history';
import { applyEvent, startDraft } from '../app/session';
import { withDraft, withMissionDay, withRecord } from '../app/store';
import { sampleRecord } from '../testing/fixtures';
import { LOCALES, renderHtml, testStore, textOf, unfilledPlaceholders } from '../testing/render';
import { HistoryScreen } from './HistoryScreen';

vi.mock('../slots', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slots')>()),
  ExamViewer: () => <div data-slot="viewer" />,
  AssistantPanel: ({ record }: { record: SessionRecord | null }) => (
    <button data-slot="assistant" data-record={record ? `${record.crewId}:${record.flightDay}` : 'none'}>
      assistant
    </button>
  ),
}));

/** The results the list of controls opens, in the order of its rows. The navigation and the veil have their own links: they are not the list. */
const resultLinks = (html: string): string[] => {
  const table = html.match(/<table class="co-tabla co-tabla--controles"[\s\S]*?<\/table>/)?.[0] ?? '';
  return [...table.matchAll(/href="#\/result\/[A-D]\/(\d+)"/g)].map((m) => m[1] ?? '');
};

describe('history screen', () => {
  it.each(LOCALES)('opens in %s for the four crew members', (locale) => {
    for (const member of CREW) {
      const html = renderHtml(<HistoryScreen crewId={member.id} />, locale);
      expect(html.match(/<h1/g)).toHaveLength(1);
      expect(textOf(html)).toContain(member.name);
      expect(unfilledPlaceholders(html)).toEqual([]);
    }
  });

  it('lists the controls from the newest to the oldest, each one opening its result, then the pre-flight exam', () => {
    const html = renderHtml(<HistoryScreen crewId="C" />, 'en');
    const days = inFlightControls(getHistory('C', 150)).map((record) => String(record.flightDay));
    expect(days.length).toBeGreaterThan(2);
    expect(resultLinks(html)).toEqual([...days].reverse().concat('0'));
    const text = textOf(html);
    expect(text).toContain('Pre-flight exam');
    expect(text).toContain('The reference: every in-flight control is compared with it.');
  });

  it('shows for each eye the level, the change with its range and how it was obtained, the quality and the attempts', () => {
    const text = textOf(renderHtml(<HistoryScreen crewId="C" />, 'en')).replace(/\u00a0/g, ' ');
    expect(text).toMatch(/Right eye .*Change since before the flight: \+\d+ µm \(\+\d+ to \+\d+\) Calculated Capture quality: \d+ dB · \d capture attempts?/);
    expect(text).toContain('Clinically concerning');
    expect(text).toContain('First sign');
  });

  it('tells the controls done in this browser from the ones that come with the application', () => {
    const live = sampleRecord(getHistory('B', 150), 'B', { flightDay: 150, od: 26, os: null, origin: 'live' });
    const html = renderHtml(<HistoryScreen crewId="B" />, 'en', testStore((state) => withRecord(state, live)));
    const text = textOf(html);
    expect(html.match(/origin-mark--live/g)).toHaveLength(1);
    expect(html.match(/origin-mark--precomputed/g)?.length).toBeGreaterThan(1);
    expect(text).toContain('Done in this browser');
    expect(text).toContain('Comes with the application');
    expect(text).toContain('Flight day 150 · today');
    // The eye that could not be measured has words and no number.
    expect(text).toContain('Could not be measured: no number');
    expect(text).toContain('3 capture attempts');
    expect(resultLinks(html)[0]).toBe('150');
    expect(html).toContain('data-record="B:150"');
  });

  it('draws the evolution with its equivalent table, and both eyes by default', () => {
    const html = renderHtml(<HistoryScreen crewId="B" />, 'en');
    expect(html).toContain('history-chart__series--OD');
    expect(html).toContain('history-chart__series--OS');
    expect(html).toMatch(/<svg role="group" aria-label="Chart of the change in retinal thickness by flight day, from 0 to 180, for Right eye and Left eye\./);
    expect(html).toContain('<table');
    expect(html.match(/type="checkbox"[^>]*checked/g) ?? html.match(/checked=""[^>]*type="checkbox"/g)).toHaveLength(2);
  });

  it('shows only what came before the chosen mission day', () => {
    const store = testStore((state) => withMissionDay(state, 90));
    const html = renderHtml(<HistoryScreen crewId="C" />, 'en', store);
    const days = resultLinks(html).map(Number);
    expect(days.every((day) => day < 90)).toBe(true);
    expect(days).toContain(0);
    expect(html).toContain('href="#/session/C"');
  });

  it('says so when there is no in-flight control yet', () => {
    const store = testStore((state) => withMissionDay(state, 30));
    const text = textOf(renderHtml(<HistoryScreen crewId="A" />, 'es', store));
    expect(text).toContain('Todavía no hay controles en vuelo.');
    expect(text).toContain('Examen de antes del vuelo');
  });

  it('offers to resume a control in progress', () => {
    const store = testStore((state) => withDraft(state, applyEvent(startDraft('A', 150), { type: 'begin' })));
    expect(textOf(renderHtml(<HistoryScreen crewId="A" />, 'en', store))).toContain('Resume today’s control');
  });
});
