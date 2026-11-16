import { describe, expect, it, vi } from 'vitest';
import { BRAIN_KNOWLEDGE, REFERENCES, type SessionRecord } from '@app/core';
import { LOCALES, renderHtml, textOf, unfilledPlaceholders } from '../testing/render';
import { BrainScreen } from './BrainScreen';

vi.mock('../slots', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slots')>()),
  ExamViewer: () => <div data-slot="viewer" />,
  AssistantPanel: ({ record }: { record: SessionRecord | null }) => (
    <button data-slot="assistant" data-record={record ? 'record' : 'none'}>
      assistant
    </button>
  ),
}));

const COLUMNS = ['known', 'mriOnly', 'notKnowableOnBoard'] as const;
const CERTAINTY_WORDS = {
  en: {
    established: 'Established',
    'limited-evidence': 'Limited evidence',
    unknown: 'Not known',
    'not-measurable-on-board': 'Cannot be measured on board',
  },
  es: {
    established: 'Establecido',
    'limited-evidence': 'Evidencia limitada',
    unknown: 'No se sabe',
    'not-measurable-on-board': 'No se puede medir a bordo',
  },
} as const;

describe('screen "what is known about the brain"', () => {
  it.each(LOCALES)('shows in %s the three columns with every statement of the knowledge base, word for word', (locale) => {
    const html = renderHtml(<BrainScreen />, locale);
    const text = textOf(html);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html.match(/class="brain__column"/g)).toHaveLength(3);
    for (const column of COLUMNS) {
      expect(BRAIN_KNOWLEDGE[column].length).toBeGreaterThan(0);
      for (const statement of BRAIN_KNOWLEDGE[column]) expect(text).toContain(statement.text[locale]);
    }
    const total = COLUMNS.reduce((count, column) => count + BRAIN_KNOWLEDGE[column].length, 0);
    expect(html.match(/class="statement"/g)).toHaveLength(total);
    expect(unfilledPlaceholders(html)).toEqual([]);
  });

  it.each(LOCALES)('says in %s how firm each statement is, in words', (locale) => {
    const html = renderHtml(<BrainScreen />, locale);
    const statements = COLUMNS.flatMap((column) => [...BRAIN_KNOWLEDGE[column]]);
    for (const certainty of new Set(statements.map((statement) => statement.certainty))) {
      const used = statements.filter((statement) => statement.certainty === certainty).length;
      // Once in the legend and once per statement that carries it.
      const word = CERTAINTY_WORDS[locale][certainty];
      expect(html.split(`>${word}</span>`).length - 1, certainty).toBe(used + 1);
    }
  });

  it('gives every statement its sources, as links to the reference list', () => {
    const html = renderHtml(<BrainScreen />, 'en');
    const statements = COLUMNS.flatMap((column) => [...BRAIN_KNOWLEDGE[column]]);
    for (const statement of statements) {
      expect(statement.sources.length).toBeGreaterThan(0);
      for (const id of statement.sources) {
        const reference = REFERENCES.find((candidate) => candidate.id === id);
        expect(reference, id).toBeDefined();
        expect(html).toContain(`href="${reference?.url.replace(/&/g, '&amp;')}"`);
      }
    }
    expect(textOf(html)).not.toContain('is not in the reference list');
  });

  it('states that the tool never reads the pressure inside the skull from the eye', () => {
    expect(textOf(renderHtml(<BrainScreen />, 'en'))).toContain(
      'it never reads the pressure inside the skull from the eye',
    );
    expect(textOf(renderHtml(<BrainScreen />, 'es'))).toContain('nunca lee en el ojo la presión dentro del cráneo');
  });

  it('mounts the assistant without a result, and leads on to "how it works"', () => {
    const html = renderHtml(<BrainScreen />, 'en');
    expect(html).toContain('data-record="none"');
    expect(html).toContain('href="#/how"');
    expect(html).toContain('href="#/"');
  });
});
