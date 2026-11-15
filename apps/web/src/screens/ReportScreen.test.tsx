import { describe, expect, it } from 'vitest';
import { buildReport, renderReportMarkdown, suggestQuestions, type SessionRecord } from '@app/core';
import { CREW, getHistory } from '../app/core';
import { withQuestions, withRecord } from '../app/store';
import { sampleRecord } from '../testing/fixtures';
import { LOCALES, renderHtml, testStore, textOf, unfilledPlaceholders } from '../testing/render';
import { ReportScreen } from './ReportScreen';

const normal = (text: string): string => text.replace(/\u00a0/g, ' ');

describe('medical conference screen', () => {
  it.each(LOCALES)('opens in %s for the last control of every crew member', (locale) => {
    for (const member of CREW) {
      const last = getHistory(member.id, 150).at(-1) as SessionRecord;
      const html = renderHtml(<ReportScreen crewId={member.id} flightDay={last.flightDay} />, locale);
      expect(html.match(/<h1/g), member.id).toHaveLength(1);
      expect(unfilledPlaceholders(html)).toEqual([]);
    }
  });

  it.each(LOCALES)('draws in %s the report of the core, section by section, and says first what it is for', (locale) => {
    const history = getHistory('C', 150);
    const record = history.at(-1) as SessionRecord;
    const report = buildReport(record, history, locale);
    const html = renderHtml(<ReportScreen crewId="C" flightDay={record.flightDay} />, locale);
    const text = normal(textOf(html));
    expect(text.indexOf(normal(report.purpose))).toBeGreaterThan(-1);
    expect(text.indexOf(normal(report.purpose))).toBeLessThan(text.indexOf(report.sections[0]?.title ?? ''));
    expect(text).toContain(report.simulatedDataNotice);
    for (const section of report.sections) {
      expect(html).toContain(`id="report-${section.id}"`);
      expect(text).toContain(normal(section.title));
      if (section.id === 'questions') continue;
      for (const paragraph of section.paragraphs) expect(text).toContain(normal(paragraph));
      for (const table of section.tables) for (const column of table.columns) expect(text).toContain(normal(column));
    }
    expect(html.match(/<table/g)).toHaveLength(report.sections.reduce((count, section) => count + section.tables.length, 0));
  });

  it('offers the suggested questions of the core, and none that is already in the list', () => {
    const history = getHistory('B', 150);
    const record = history.at(-1) as SessionRecord;
    const suggested = suggestQuestions(record.assessment, 'en');
    expect(suggested.length).toBeGreaterThan(1);
    const empty = textOf(renderHtml(<ReportScreen crewId="B" flightDay={record.flightDay} />, 'en'));
    for (const question of suggested) expect(empty).toContain(question);
    expect(empty).toContain('No questions written yet.');

    const first = suggested[0] as string;
    const store = testStore((state) => withQuestions(state, 'B', record.flightDay, [first, 'My own question?']));
    const html = renderHtml(<ReportScreen crewId="B" flightDay={record.flightDay} />, 'en', store);
    expect(html.match(/class="questions__suggested"[\s\S]*?<\/ul>/)?.[0]).not.toContain(first);
    expect(html.match(/<textarea[^>]*aria-label="Question \d"/g)).toHaveLength(2);
    expect(html).toContain('My own question?');
  });

  it('keeps the questions of a control done here in its record, and they reach the downloaded text', () => {
    const live = sampleRecord(getHistory('B', 150), 'B', { flightDay: 150, od: 26, os: 3, origin: 'live' });
    const store = testStore((state) => withQuestions(withRecord(state, live), 'B', 150, ['How often should I repeat the scan?']));
    const saved = store.getState().records[0] as SessionRecord;
    expect(saved.questions).toEqual(['How often should I repeat the scan?']);
    const markdown = renderReportMarkdown(buildReport(saved, getHistory('B', 150), 'en'));
    expect(markdown).toContain('How often should I repeat the scan?');
    expect(markdown).toContain('Simulated data');
    expect(textOf(renderHtml(<ReportScreen crewId="B" flightDay={150} />, 'en', store))).toContain(
      'How often should I repeat the scan?',
    );
  });

  it('can be downloaded and printed, and what is only for the screen is left out of the paper', () => {
    const html = renderHtml(<ReportScreen crewId="C" flightDay={118} />, 'en');
    const text = textOf(html);
    expect(text).toContain('Download the report as text');
    expect(text).toContain('Print the report');
    expect(html).toMatch(/<section class="screen__section no-print" aria-labelledby="report-export"/);
    expect(html).toMatch(/<section class="screen__section no-print" aria-labelledby="report-actions"/);
    expect(html).toContain('href="#/result/C/118"');
  });

  it('says so when the control does not exist', () => {
    expect(textOf(renderHtml(<ReportScreen crewId="A" flightDay={77} />, 'en'))).toContain(
      'There is no control of Kofi Mensah on flight day 77',
    );
  });
});
