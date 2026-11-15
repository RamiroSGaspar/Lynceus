/**
 * Output barrier: what the model wrote is shown only if it passes every check.
 * The refusal text is never the model's; the panel shows ours.
 */
import type { AssistantContext } from './contract.js';
import { findStatement } from './knowledge.js';
import { CATEGORIES, LEAK_MARKERS, type AnswerCategory } from './prompt.js';

export const ANSWER_MAX_CHARS = 1200;

export type ReviewResult =
  | { kind: 'answered'; category: AnswerCategory; answer: string; statementIds: string[] }
  | { kind: 'refused' }
  | { kind: 'unsafe'; why: string };

const CODE_OR_LINK: readonly RegExp[] = [
  /`/, // backticks, code fences
  /https?:\/\//i,
  /\bwww\./i,
  /\b[a-z0-9-]+\.(?:com|org|net|gov|io|dev|ai)\b/i,
  /[{}]/,
  /=>|<\/?[a-z][^>]*>/i,
  /^\s*(?:def|function|class|import|from|const|let|var|#include|public|SELECT)\b/im,
  /\b(?:console\.log|print\(|System\.out|printf\()/i,
];

const MEDICATION =
  /\b(?:acetazolamid[ea]|diamox|topiramat[eo]|furosemid[ea]|methazolamide|metazolamida|semaglutid[ea]|liraglutid[ea]|glp-?1|corticosteroids?|corticoides?|steroids?|esteroides?|prednison[ea]?|dexamethasone|dexametasona|ibuprofeno?|paracetamol|acetaminophen|aspirina?|naproxeno?|analgesics?|analgésicos?|painkillers?|diuretics?|diuréticos?|melatonina?|antibiotics?|antibióticos?)\b/i;
const DOSE = /\b\d+(?:[.,]\d+)?\s?(?:mg|µg|μg|mcg|IU|UI)\b|\b(?:doses?|dosage|dosis|posología)\b/i;

const DIAGNOSIS: readonly RegExp[] = [
  /\byou (?:have|don't have|do not have|probably have|may have) (?:sans|papill?edema|optic disc edema|a disease)\b/i,
  /\b(?:tenés|tienes|usted tiene|no tenés|no tienes) (?:sans|papiledema|edema|una enfermedad)\b/i,
  /\b(?:it is|it's|this is|that is|that's|which is) (?:serious|severe|fine|not serious|not a problem)\b/i,
  /\b(?:nothing to worry|don't worry|do not worry|no te preocupes|no se preocupe|no hay de qué preocuparse)\b/i,
  /\b(?:es|está) (?:grave|bien|leve)\b/i,
  /\byour (?:intracranial pressure|pressure inside (?:the|your) skull) (?:is|was|seems|appears|must be|may be|might be)\b/i,
  /\btu presión (?:intracraneal|dentro del cráneo) (?:es|está|parece|debe|puede)\b/i,
];

// ---------------------------------------------------------- numbers with units

const UNIT_FAMILIES: readonly [RegExp, string][] = [
  [/^(?:µm|μm|um|micrometres?|micrometers?|micrómetros?)$/, 'um'],
  [/^(?:mm³|mm3)$/, 'mm3'],
  [/^(?:mm²|mm2)$/, 'mm2'],
  [/^mm$/, 'mm'],
  [/^(?:cm H₂O|cm H2O|cmH2O|cmH₂O)$/, 'cmh2o'],
  [/^mmHg$/, 'mmhg'],
  [/^(?:ml|mL)$/, 'ml'],
  [/^dB$/, 'db'],
  [/^%$/, 'pct'],
  [/^D$/, 'diopter'],
  [/^(?:days?|días?)$/, 'day'],
  [/^(?:weeks?|semanas?)$/, 'week'],
  [/^(?:months?|meses|mes)$/, 'month'],
  [/^(?:years?|años?)$/, 'year'],
  [/^(?:minutes?|minutos?)$/, 'minute'],
  [/^(?:hours?|horas?)$/, 'hour'],
  [/^(?:mg|µg|μg|mcg|g)$/, 'mass'],
];

const NUMBER_WITH_UNIT =
  /(\d+(?:[.,]\d+)?)\s?(µm|μm|um|micrometres?|micrometers?|micrómetros?|mm³|mm3|mm²|mm2|mmHg|mm|cm H₂O|cm H2O|cmH2O|cmH₂O|ml|mL|dB|%|D|days?|días?|weeks?|semanas?|months?|meses|mes|years?|años?|minutes?|minutos?|hours?|horas?|mg|µg|μg|mcg|g)(?![\p{L}\d])/gu;

function familyOf(unit: string): string {
  return UNIT_FAMILIES.find(([re]) => re.test(unit))?.[1] ?? unit;
}

export function numbersWithUnits(text: string): { value: number; family: string }[] {
  return [...text.matchAll(NUMBER_WITH_UNIT)].map((m) => ({
    value: Number(m[1]!.replace(',', '.')),
    family: familyOf(m[2]!),
  }));
}

const round = (value: number, decimals: number) => Math.round(value * 10 ** decimals) / 10 ** decimals;

function allowedNumbers(context: AssistantContext | null, statementIds: readonly string[]): Set<string> {
  const allowed = new Set<string>();
  const add = (family: string, value: number) => {
    const v = Math.abs(value);
    for (const variant of [v, round(v, 1), round(v, 0)]) allowed.add(`${family}:${variant}`);
  };
  for (const id of statementIds) {
    const statement = findStatement(id);
    if (!statement) continue;
    for (const text of [statement.text.en, statement.text.es]) {
      for (const n of numbersWithUnits(text)) add(n.family, n.value);
    }
  }
  if (context) {
    add('day', context.flightDay);
    if (context.nextOctFlightDay !== null) {
      add('day', context.nextOctFlightDay);
      add('day', context.nextOctFlightDay - context.flightDay);
    }
    if (context.nextSteps.includes('oct-in-4-weeks')) add('week', 4);
    if (context.nextSteps.includes('oct-in-3-weeks')) add('week', 3);
    for (const eye of [context.eyes.OD, context.eyes.OS]) {
      for (const c of eye.changes) {
        add('um', c.changeUm);
        if (c.interval95Um) c.interval95Um.forEach((v) => add('um', v));
      }
      for (const t of eye.thresholds) {
        add('um', t.thresholdUm);
        add('pct', t.probabilityExceeded * 100);
      }
      if (eye.capture) add('db', eye.capture.meanQualityDb);
    }
  }
  return allowed;
}

// ------------------------------------------------------------------- review

function parse(text: string): { inScope: boolean; category: string; answer: string; sourceIds: string[] } | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  const o = data as Record<string, unknown>;
  const keys = Object.keys(o).sort().join(',');
  if (keys !== 'answer,category,in_scope,source_ids') return null;
  if (typeof o.in_scope !== 'boolean' || typeof o.category !== 'string' || typeof o.answer !== 'string') return null;
  if (!Array.isArray(o.source_ids) || !o.source_ids.every((id) => typeof id === 'string')) return null;
  return { inScope: o.in_scope, category: o.category, answer: o.answer, sourceIds: o.source_ids as string[] };
}

export function reviewModelOutput(text: string, context: AssistantContext | null): ReviewResult {
  const parsed = parse(text);
  if (!parsed) return { kind: 'unsafe', why: 'not-the-expected-json' };
  // Enum case is not guaranteed by structured outputs: compare without case.
  const category = CATEGORIES.find((c) => c === parsed.category.toLowerCase());
  if (!category) return { kind: 'unsafe', why: 'unknown-category' };
  if (!parsed.inScope || category === 'out-of-scope') return { kind: 'refused' };

  const answer = parsed.answer.trim();
  if (answer.length === 0) return { kind: 'unsafe', why: 'empty' };
  if (answer.length > ANSWER_MAX_CHARS) return { kind: 'unsafe', why: 'too-long' };
  if (CODE_OR_LINK.some((re) => re.test(answer))) return { kind: 'unsafe', why: 'code-or-link' };
  const lower = answer.toLowerCase();
  if (LEAK_MARKERS.some((marker) => lower.includes(marker.toLowerCase()))) return { kind: 'unsafe', why: 'instructions' };

  const statementIds = [...new Set(parsed.sourceIds)];
  if (statementIds.some((id) => !findStatement(id))) return { kind: 'unsafe', why: 'unknown-source' };
  if (statementIds.length === 0 && category !== 'result' && category !== 'questions-for-surgeon') {
    return { kind: 'unsafe', why: 'no-source' };
  }
  if (MEDICATION.test(answer) || DOSE.test(answer)) return { kind: 'unsafe', why: 'medication' };
  if (DIAGNOSIS.some((re) => re.test(answer))) return { kind: 'unsafe', why: 'diagnosis' };

  const allowed = allowedNumbers(context, statementIds);
  const unsupported = numbersWithUnits(answer).find((n) => !allowed.has(`${n.family}:${n.value}`));
  if (unsupported) return { kind: 'unsafe', why: 'unsupported-number' };

  return { kind: 'answered', category, answer, statementIds };
}
