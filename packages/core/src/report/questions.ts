/**
 * Questions the astronaut may want to ask the flight surgeon, by template,
 * according to the findings of the session. They are suggestions to pick from:
 * none asks about medication and none assumes an answer.
 */
import type { FindingId, SessionAssessment } from '../contract';
import type { Locale } from '../product';

export const MAX_SUGGESTED_QUESTIONS = 5;

type QuestionId =
  | 'acute-until-we-talk'
  | 'level-meaning'
  | 'repeat-how-often'
  | 'watch-between-scans'
  | 'folds-meaning'
  | 'close-to-threshold'
  | 'repeat-capture'
  | 'amsler-changes'
  | 'vision-change-related'
  | 'glasses-which'
  | 'headache-record'
  | 'after-landing'
  | 'look-closer'
  | 'compare-with-ground';

const QUESTIONS: Readonly<Record<Locale, Readonly<Record<QuestionId, string>>>> = {
  en: {
    'acute-until-we-talk': 'What should I do until we talk, and what should make me call you again?',
    'level-meaning': 'What does a change at this level mean for the rest of my mission?',
    'repeat-how-often': 'How often should I repeat the scan from now on?',
    'watch-between-scans': 'Is there anything I should watch for between scans?',
    'folds-meaning': 'What do the new folds mean, and can they affect my vision?',
    'close-to-threshold': 'My result is close to a threshold: would you repeat the scan sooner?',
    'repeat-capture': 'One scan could not be measured: what can I do differently when I repeat it?',
    'amsler-changes': 'What should I do if the marks on the Amsler grid change?',
    'vision-change-related': 'Could the change in vision I noticed be related to what the scan shows?',
    'glasses-which': 'Which of my on-board glasses should I use, and when should I tell you if they stop helping?',
    'headache-record': 'Should I keep a record of my headaches, and what should I write down?',
    'after-landing': 'Which eye exams will I have after landing?',
    'look-closer': 'Is there anything in this result you would look at more closely?',
    'compare-with-ground': 'How does this first reading compare with what you see from the ground?',
  },
  es: {
    'acute-until-we-talk': '¿Qué hago hasta que hablemos, y ante qué te vuelvo a llamar?',
    'level-meaning': '¿Qué significa un cambio de este nivel para el resto de mi misión?',
    'repeat-how-often': '¿Cada cuánto conviene que repita la tomografía de ahora en adelante?',
    'watch-between-scans': '¿Hay algo a lo que deba prestar atención entre una tomografía y la siguiente?',
    'folds-meaning': '¿Qué significan los pliegues nuevos, y pueden afectar mi visión?',
    'close-to-threshold': 'Mi resultado quedó cerca de un umbral: ¿conviene repetir la tomografía antes?',
    'repeat-capture': 'Una tomografía no se pudo medir: ¿qué puedo hacer distinto cuando la repita?',
    'amsler-changes': '¿Qué hago si cambian las marcas de la grilla de Amsler?',
    'vision-change-related': '¿El cambio de visión que noté puede tener relación con lo que muestra la tomografía?',
    'glasses-which': '¿Cuál de mis anteojos de a bordo me conviene usar, y cuándo te aviso si dejan de alcanzar?',
    'headache-record': '¿Conviene que lleve un registro de mis dolores de cabeza? ¿Qué anoto?',
    'after-landing': '¿Qué exámenes de ojos me van a hacer al volver?',
    'look-closer': '¿Hay algo de este resultado que mirarías con más detalle?',
    'compare-with-ground': '¿Cómo se compara esta primera lectura con lo que ven desde Tierra?',
  },
};

/** Questions each finding brings, most useful first. */
const BY_FINDING: Readonly<Record<FindingId, readonly QuestionId[]>> = {
  'symptom-acute': ['acute-until-we-talk'],
  'amsler-marked-central': ['acute-until-we-talk', 'amsler-changes'],
  'swelling-clinically-concerning': ['level-meaning', 'repeat-how-often', 'after-landing'],
  'amsler-marked': ['amsler-changes'],
  'symptom-other': ['vision-change-related'],
  'swelling-first-sign': ['repeat-how-often', 'watch-between-scans'],
  'folds-new': ['folds-meaning'],
  'eye-not-measured': ['repeat-capture'],
  'near-vision-worse': ['glasses-which'],
  'symptom-near-blur': ['glasses-which'],
  'symptom-headache': ['headache-record'],
};

/**
 * Up to five questions for the flight surgeon. The findings are taken in their
 * order of urgency, one question each first, so that every finding is covered
 * before any of them gets a second question.
 */
export function suggestQuestions(assessment: SessionAssessment, locale: Locale): string[] {
  const ids: QuestionId[] = [];
  const add = (id: QuestionId | undefined) => {
    if (id !== undefined && !ids.includes(id)) ids.push(id);
  };
  const longest = Math.max(0, ...assessment.findings.map((finding) => BY_FINDING[finding]?.length ?? 0));
  for (let round = 0; round < longest; round++) {
    for (const finding of assessment.findings) add(BY_FINDING[finding]?.[round]);
    // A result close to a threshold is worth asking about right after the main question of each finding.
    if (round === 0 && (assessment.eyes.OD.borderline || assessment.eyes.OS.borderline)) add('close-to-threshold');
  }
  if (longest === 0 && (assessment.eyes.OD.borderline || assessment.eyes.OS.borderline)) add('close-to-threshold');
  add('look-closer');
  add('compare-with-ground');
  return ids.slice(0, MAX_SUGGESTED_QUESTIONS).map((id) => QUESTIONS[locale][id]);
}
