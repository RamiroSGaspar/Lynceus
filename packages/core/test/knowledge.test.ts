import { describe, expect, it } from 'vitest';
import { BRAIN_KNOWLEDGE, KNOWLEDGE, REFERENCES } from '../src/index';
import type { KnowledgeTopic } from '../src/index';

const LOCALES = ['en', 'es'] as const;
const TOPICS: readonly KnowledgeTopic[] = [
  'sans',
  'measurement',
  'thresholds',
  'brain',
  'symptoms',
  'countermeasures',
  'limits',
  'glossary',
];

describe('knowledge base', () => {
  it('has between 45 and 70 statements, covering every topic', () => {
    expect(KNOWLEDGE.length).toBeGreaterThanOrEqual(45);
    expect(KNOWLEDGE.length).toBeLessThanOrEqual(70);
    for (const topic of TOPICS) expect(KNOWLEDGE.some((s) => s.topic === topic)).toBe(true);
  });

  it('uses unique statement ids prefixed by their topic', () => {
    const ids = KNOWLEDGE.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of KNOWLEDGE) expect(s.id.startsWith(`${s.topic}.`)).toBe(true);
  });

  it('cites at least one source per statement, and every cited source exists', () => {
    const referenceIds = new Set(REFERENCES.map((r) => r.id));
    for (const s of KNOWLEDGE) {
      expect(s.sources.length, s.id).toBeGreaterThan(0);
      for (const source of s.sources) expect(referenceIds.has(source), `${s.id} → ${source}`).toBe(true);
      expect(s.basis.length, s.id).toBeGreaterThan(0);
    }
  });

  it('has both languages complete and no statement longer than 320 characters', () => {
    for (const s of KNOWLEDGE) {
      for (const locale of LOCALES) {
        const text = s.text[locale];
        expect(text.trim().length, `${s.id} ${locale}`).toBeGreaterThan(0);
        expect(text.length, `${s.id} ${locale}`).toBeLessThanOrEqual(320);
      }
    }
  });

  it('has unique references, each complete and cited at least once', () => {
    const ids = REFERENCES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    const cited = new Set(KNOWLEDGE.flatMap((s) => s.sources));
    for (const r of REFERENCES) {
      expect(r.title.length, r.id).toBeGreaterThan(0);
      expect(r.publisher.length, r.id).toBeGreaterThan(0);
      expect(Number.isInteger(r.year) && r.year >= 1990 && r.year <= 2026, r.id).toBe(true);
      expect(r.url, r.id).toMatch(/^https:\/\//);
      expect(cited.has(r.id), `${r.id} is never cited`).toBe(true);
    }
  });

  it('fills the three brain lists with brain statements only, each statement in one list', () => {
    const lists = [BRAIN_KNOWLEDGE.known, BRAIN_KNOWLEDGE.mriOnly, BRAIN_KNOWLEDGE.notKnowableOnBoard];
    for (const list of lists) {
      expect(list.length).toBeGreaterThan(0);
      for (const s of list) expect(s.topic).toBe('brain');
    }
    const grouped = lists.flat().map((s) => s.id);
    expect(new Set(grouped).size).toBe(grouped.length);
    const brainIds = KNOWLEDGE.filter((s) => s.topic === 'brain').map((s) => s.id);
    expect([...grouped].sort()).toEqual([...brainIds].sort());
  });

});
