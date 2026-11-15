import { describe, expect, it } from 'vitest';
import {
  assessSession,
  explainAssessment,
  getHistory,
  type CrewId,
  type Explanation,
  type Locale,
  type SessionAssessment,
} from '../src/index';
import {
  acuity,
  amsler,
  BASE,
  eyesWithChange,
  inFlight,
  measured,
  notMeasured,
  preflight,
  symptoms,
  vision,
} from './helpers/fixtures';

const LOCALES: readonly Locale[] = ['en', 'es'];
const pre = preflight();
const base = { crewId: 'B' as const, flightDay: 30, history: [pre] };
const mark = { col: 1, row: 1, kind: 'wavy' } as const;

/** Assessments that cover every level, every finding and every special case of the texts. */
const CASES: Record<string, SessionAssessment> = {
  reference: pre.assessment,
  noChange: assessSession({ ...base, eyes: eyesWithChange({ OD: 8, OS: 3 }), vision: vision() }),
  noChangeBorderline: assessSession({ ...base, eyes: eyesWithChange({ OD: 17, OS: -3 }), vision: vision() }),
  noIncrease: assessSession({ ...base, eyes: eyesWithChange({ OD: -12, OS: 0.2 }), vision: null }),
  firstSign: assessSession({ ...base, flightDay: 90, eyes: eyesWithChange({ OD: 24, OS: 6 }, {}, 90), vision: vision() }),
  firstSignNearConcerning: assessSession({ ...base, eyes: eyesWithChange({ OD: 52, OS: 21 }), vision: vision() }),
  firstSignFromFolds: assessSession({ ...base, eyes: eyesWithChange({ OD: 19.4, OS: 2 }, { OD: 3.5, OS: 2 }), vision: vision() }),
  concerning: assessSession({ ...base, eyes: eyesWithChange({ OD: 70, OS: 30 }, { OD: 4, OS: 3.5 }), vision: vision() }),
  concerningBorderline: assessSession({ ...base, flightDay: 165, eyes: eyesWithChange({ OD: 56, OS: 52 }, {}, 165), vision: vision() }),
  acuteSymptom: assessSession({
    ...base,
    eyes: eyesWithChange({ OD: 30, OS: 3 }, { OD: 4 }),
    vision: vision({
      symptoms: symptoms({ 'sudden-vision-loss': { eye: 'OD' }, 'new-dark-spot': { eye: 'both' }, headache: { severity: 'severe' } }),
      amsler: { OD: amsler('OD', { marks: [mark], markedFraction: 0.07 }), OS: amsler('OS', { marks: [mark], markedFraction: 0.01, centralMarked: true }) },
    }),
  }),
  acuteNothingMeasured: assessSession({
    ...base,
    eyes: { OD: notMeasured('OD'), OS: notMeasured('OS') },
    vision: vision({ symptoms: symptoms({ 'new-dark-spot': {} }) }),
  }),
  amslerAndSymptoms: assessSession({
    ...base,
    eyes: eyesWithChange({ OD: 5, OS: 3 }),
    vision: vision({
      symptoms: symptoms({ distortion: { severity: 'mild', eye: 'OS' }, 'low-light-vision': { severity: 'severe' }, headache: { severity: 'severe' } }),
      amsler: { OD: amsler('OD'), OS: amsler('OS', { marks: [mark], markedFraction: 0.0075 }) },
    }),
  }),
  nearVision: assessSession({
    ...base,
    eyes: eyesWithChange({ OD: 5, OS: 3 }),
    vision: vision({
      acuity: { OD: acuity('OD', 0.24, { withCorrection: false }), OS: acuity('OS', 0.3) },
      symptoms: symptoms({ 'near-vision': { severity: 'mild', eye: 'both' }, headache: { severity: 'mild' } }),
    }),
  }),
  oneEyeNotMeasured: assessSession({
    ...base,
    eyes: { OD: measured('OD', { trt: BASE.OD.trt + 5 }), OS: notMeasured('OS') },
    vision: vision(),
  }),
  nothingMeasured: assessSession({
    ...base,
    flightDay: 85,
    eyes: { OD: notMeasured('OD', ['decentered'], []), OS: notMeasured('OS', ['too-few-usable-scans'], ['signal-dropout']) },
    vision: null,
  }),
  testsSkipped: assessSession({
    ...base,
    eyes: eyesWithChange({ OD: 5, OS: 3 }),
    vision: { calibration: null, acuity: { OD: null, OS: null }, amsler: { OD: null, OS: null }, symptoms: symptoms() },
  }),
  sustained: inFlight(58, { OD: 12, OS: 3 }, [pre, inFlight(30, { OD: 30, OS: 3 }, [pre])]).assessment,
  endOfMission: assessSession({ ...base, flightDay: 150, eyes: eyesWithChange({ OD: 5, OS: 3 }, {}, 150), vision: vision() }),
};

/** Every piece of text of an explanation, with a label saying where it is. */
function texts(explanation: Explanation): { where: string; text: string }[] {
  return [
    { where: 'headline', text: explanation.headline },
    ...explanation.summary.map((text, i) => ({ where: `summary[${i}]`, text })),
    ...(['OD', 'OS'] as const).flatMap((eye) => [
      { where: `eyes.${eye}.headline`, text: explanation.eyes[eye].headline },
      ...explanation.eyes[eye].lines.map((text, i) => ({ where: `eyes.${eye}.lines[${i}]`, text })),
    ]),
    ...explanation.nextSteps.flatMap((step) => [
      { where: `step.${step.id}.text`, text: step.text },
      { where: `step.${step.id}.why`, text: step.why },
    ]),
    ...explanation.limitations.map((limitation) => ({ where: `limitation.${limitation.id}`, text: limitation.text })),
    ...explanation.findings.map((finding) => ({ where: `finding.${finding.id}`, text: finding.text })),
  ];
}

/** Plain spaces instead of no-break spaces, to compare with strings written in the tests. */
const plain = (text: string) => text.replace(/\u00a0/g, ' ');

/** Every explanation the tests look at: the cases above and the whole provisional history, in both languages. */
function everyExplanation(): { name: string; locale: Locale; assessment: SessionAssessment; explanation: Explanation }[] {
  const all: { name: string; assessment: SessionAssessment }[] = Object.entries(CASES).map(([name, assessment]) => ({ name, assessment }));
  for (const crewId of ['A', 'B', 'C', 'D'] as readonly CrewId[]) {
    for (const record of getHistory(crewId, 181)) all.push({ name: `${crewId}${record.flightDay}`, assessment: record.assessment });
  }
  return all.flatMap(({ name, assessment }) =>
    LOCALES.map((locale) => ({ name, locale, assessment, explanation: explainAssessment(assessment, locale) })),
  );
}

describe('texts: number, unit and range for each level', () => {
  it('no detectable change', () => {
    const en = explainAssessment(CASES.noChange!, 'en');
    expect(plain(en.headline)).toBe('No detectable change in either eye since before the flight.');
    expect(en.eyes.OD.lines.map(plain).slice(0, 3)).toEqual([
      'The retina next to your right optic nerve is 8 µm thicker than before the flight (range 0 to 16).',
      'That is below NASA’s first-sign threshold of 19.4 µm, within the normal variation between two exams.',
      'It is unlikely (less than 1 %) that the real change is above the first-sign threshold.',
    ]);
    const es = explainAssessment(CASES.noChange!, 'es');
    expect(plain(es.headline)).toBe('Sin cambio detectable en ninguno de los dos ojos desde antes del vuelo.');
    expect(es.eyes.OD.lines.map(plain).slice(0, 3)).toEqual([
      'La retina junto al nervio óptico de tu ojo derecho está 8 µm más gruesa que antes del vuelo (rango 0 a 16).',
      'Eso está por debajo del umbral de primer indicio de la NASA, de 19,4 µm: dentro de la variación normal entre dos exámenes.',
      'Es improbable (menos de 1 %) que el cambio real esté por encima del umbral de primer indicio.',
    ]);
  });

  it('first sign: the example of the specification', () => {
    const en = explainAssessment(CASES.firstSign!, 'en');
    expect(plain(en.headline)).toBe('The change in your right eye is at NASA’s first-sign level.');
    expect(plain(en.eyes.OD.headline)).toBe('Right eye: first sign of optic nerve swelling, by NASA’s threshold.');
    expect(en.eyes.OD.lines.map(plain).slice(0, 3)).toEqual([
      'The retina next to your right optic nerve is 24 µm thicker than before the flight (range 16 to 32).',
      'That is above NASA’s first-sign threshold of 19.4 µm and below its clinically concerning threshold of 55 µm.',
      'It is likely (86 %) that the real change is above the first-sign threshold: this result is close to it, and your next exam will show whether it holds.',
    ]);
    expect(plain(en.summary[0]!)).toBe(
      'The larger increase is in your right eye: the retina next to the optic nerve is 24 µm thicker than in your own pre-flight exam (range 16 to 32), above NASA’s first-sign threshold of 19.4 µm.',
    );
    const es = explainAssessment(CASES.firstSign!, 'es');
    expect(plain(es.headline)).toBe('El cambio en tu ojo derecho está en el nivel de primer indicio de la NASA.');
    expect(plain(es.eyes.OD.headline)).toBe('Ojo derecho: primer indicio de hinchazón del nervio óptico, según el umbral de la NASA.');
    expect(es.eyes.OD.lines.map(plain).slice(0, 3)).toEqual([
      'La retina junto al nervio óptico de tu ojo derecho está 24 µm más gruesa que antes del vuelo (rango 16 a 32).',
      'Eso está por encima del umbral de primer indicio de la NASA, de 19,4 µm, y por debajo de su umbral clínicamente preocupante, de 55 µm.',
      'Es probable (86 %) que el cambio real esté por encima del umbral de primer indicio: el resultado quedó cerca del umbral, y tu próximo control va a mostrar si se mantiene.',
    ]);
  });

  it('clinically concerning, with new folds', () => {
    const en = explainAssessment(CASES.concerning!, 'en');
    expect(plain(en.headline)).toBe('The change in your right eye is at NASA’s clinically concerning level.');
    expect(en.eyes.OD.lines.map(plain)).toEqual([
      'The retina next to your right optic nerve is 70 µm thicker than before the flight (range 62 to 78).',
      'That is at or above NASA’s clinically concerning threshold of 55 µm.',
      'It is very likely (more than 99 %) that the real change is at or above the clinically concerning threshold.',
      'The scan indicates new folds: the waviness of the membrane under the retina rose by 4.0 µm since before the flight (range 1.8 to 6.2), above the limit of 2.8 µm.',
      'It is likely (86 %) that the real change is above that limit; NASA counts any fold as a first sign.',
    ]);
    const es = explainAssessment(CASES.concerning!, 'es');
    expect(plain(es.headline)).toBe('El cambio en tu ojo derecho está en el nivel clínicamente preocupante de la NASA.');
    expect(es.eyes.OD.lines.map(plain)).toEqual([
      'La retina junto al nervio óptico de tu ojo derecho está 70 µm más gruesa que antes del vuelo (rango 62 a 78).',
      'Eso está en el umbral clínicamente preocupante de la NASA, de 55 µm, o por encima.',
      'Es muy probable (más de 99 %) que el cambio real esté en el umbral clínicamente preocupante o por encima.',
      'La tomografía indica pliegues nuevos: la ondulación de la membrana que está debajo de la retina aumentó 4,0 µm desde antes del vuelo (rango 1,8 a 6,2), por encima del límite de 2,8 µm.',
      'Es probable (86 %) que el cambio real esté por encima de ese límite; para la NASA, cualquier pliegue es un primer indicio.',
    ]);
  });

  it('acute visual symptom: says what was reported and to contact now, and still reads the scan', () => {
    const en = explainAssessment(CASES.acuteSymptom!, 'en');
    expect(plain(en.headline)).toBe('Today’s answers or vision tests show an acute visual symptom: contact your flight surgeon now.');
    expect(plain(en.summary[0]!)).toBe(
      'You reported a sudden loss of vision (right eye), you reported a new dark spot in your vision (both eyes), the Amsler grid shows marks over 7.0 % of its area (right eye) and the Amsler grid shows marks at the centre of your vision (left eye): contact your flight surgeon now, whatever the scan shows.',
    );
    expect(plain(en.summary[1]!)).toContain('30 µm thicker than in your own pre-flight exam (range 22 to 38)');
    expect(plain(en.nextSteps[0]!.text)).toBe('Contact your flight surgeon now.');
    const es = explainAssessment(CASES.acuteSymptom!, 'es');
    expect(plain(es.headline)).toBe(
      'Tus respuestas o tus pruebas de visión de hoy muestran un síntoma agudo de visión: contactá a tu médico de vuelo ahora.',
    );
    expect(plain(es.summary[0]!)).toContain('contactá a tu médico de vuelo ahora, sin importar lo que muestre la tomografía.');
    expect(plain(es.summary[1]!)).toContain('30 µm más gruesa que en tu propio examen de antes del vuelo (rango 22 a 38)');
    expect(plain(es.nextSteps[0]!.text)).toBe('Contactá a tu médico de vuelo ahora.');
  });

  it('every measured eye states its change with the unit, the range and the probability glued to its word', () => {
    for (const { name, locale, assessment, explanation } of everyExplanation()) {
      for (const eye of ['OD', 'OS'] as const) {
        const eyeAssessment = assessment.eyes[eye];
        if (!eyeAssessment.measured || !eyeAssessment.change) continue;
        const lines = explanation.eyes[eye].lines.map(plain);
        const where = `${name} ${locale} ${eye}`;
        expect(lines[0], where).toMatch(/\d µm/);
        expect(lines[0], where).toMatch(locale === 'en' ? /\(.*range/ : /\(.*rango/);
        expect(lines[1], where).toMatch(locale === 'en' ? /19\.4 µm|55 µm/ : /19,4 µm|55 µm/);
        expect(lines[2], where).toMatch(
          locale === 'en'
            ? /It is (unlikely|possible|likely|very likely) \((less than |more than )?\d+(\.\d)? %\)/
            : /Es (improbable|posible|probable|muy probable) \((menos de |más de )?\d+(,\d)? %\)/,
        );
      }
    }
  });

  it('never shows a probability word without its number', () => {
    for (const { name, locale, explanation } of everyExplanation()) {
      for (const { where, text } of texts(explanation)) {
        const words = locale === 'en' ? /\b(unlikely|likely|possible)\b(?! \()/ : /\b(improbable|probable|posible)\b(?! \()/;
        expect(plain(text), `${name} ${locale} ${where}`).not.toMatch(words);
      }
    }
  });

  it('never shows 0 % or 100 %, and keeps the number on the side of the threshold it is on', () => {
    for (const { name, locale, explanation } of everyExplanation()) {
      for (const { where, text } of texts(explanation)) {
        expect(plain(text), `${name} ${locale} ${where}`).not.toMatch(/\((0|100) %\)/);
      }
    }
    // 19.44 µm is above 19.4 µm: it must not be shown as 19 µm, nor as 19.4 µm.
    const justAbove = assessSession({ ...base, eyes: eyesWithChange({ OD: 19.44, OS: 0 }), vision: null });
    expect(justAbove.eyes.OD.level).toBe('first-sign');
    expect(plain(explainAssessment(justAbove, 'en').eyes.OD.lines[0]!)).toContain('19.44 µm thicker');
    expect(plain(explainAssessment(justAbove, 'es').eyes.OD.lines[0]!)).toContain('19,44 µm más gruesa');
    // 19.6 µm needs one decimal, 30 µm none.
    const above = assessSession({ ...base, eyes: eyesWithChange({ OD: 19.6, OS: 30.4 }), vision: null });
    expect(plain(explainAssessment(above, 'en').eyes.OD.lines[0]!)).toContain('is 20 µm thicker');
    expect(plain(explainAssessment(above, 'en').eyes.OS.lines[0]!)).toContain('is 30 µm thicker');
    // 19.3 µm is below: 19 µm is on the right side.
    const below = assessSession({ ...base, eyes: eyesWithChange({ OD: 19.3, OS: 54.6 }), vision: null });
    expect(plain(explainAssessment(below, 'en').eyes.OD.lines[0]!)).toContain('is 19 µm thicker');
    expect(plain(explainAssessment(below, 'en').eyes.OS.lines[0]!)).toContain('is 54.6 µm thicker');
    // Exactly the threshold does not pass it.
    const exactly = explainAssessment(CASES.firstSignFromFolds!, 'en');
    expect(plain(exactly.eyes.OD.lines[0]!)).toContain('19.4 µm thicker');
    expect(plain(exactly.eyes.OD.lines[1]!)).toBe('That is exactly NASA’s first-sign threshold of 19.4 µm, which only a larger change passes.');
    expect(plain(exactly.eyes.OD.headline)).toBe('Right eye: first sign, from new folds.');
    // A probability just under 90 % stays "likely" with a number under 90.
    const almost = assessSession({ ...base, eyes: eyesWithChange({ OD: 24.83, OS: 0 }), vision: null });
    expect(almost.eyes.OD.thresholds[0]!.word).toBe('likely');
    expect(plain(explainAssessment(almost, 'en').eyes.OD.lines[2]!)).toContain('likely (89.9 %)');
  });
});

describe('texts: what a result means and what it does not', () => {
  it('a borderline result below the threshold says it is close and that the next control will show', () => {
    const en = explainAssessment(CASES.noChangeBorderline!, 'en');
    expect(plain(en.summary[0]!)).toContain('below NASA’s first-sign threshold of 19.4 µm, but close to it');
    expect(plain(en.eyes.OD.lines[2]!)).toBe(
      'It is possible (29 %) that the real change is above the first-sign threshold: this result is close to it, and your next exam will show whether it holds.',
    );
    const es = explainAssessment(CASES.noChangeBorderline!, 'es');
    expect(plain(es.summary[0]!)).toContain('por debajo del umbral de primer indicio de la NASA, de 19,4 µm, pero cerca de él');
    expect(plain(es.eyes.OD.lines[2]!)).toBe(
      'Es posible (29 %) que el cambio real esté por encima del umbral de primer indicio: el resultado quedó cerca del umbral, y tu próximo control va a mostrar si se mantiene.',
    );
  });

  it('says that passing a threshold is not a diagnosis, that most cases give no symptoms and that the surgeon decides', () => {
    for (const name of ['firstSign', 'concerning', 'firstSignFromFolds'] as const) {
      expect(plain(explainAssessment(CASES[name]!, 'en').summary.at(-1)!)).toBe(
        'Passing a threshold is not a diagnosis: most cases cause no symptoms, and your flight surgeon on the ground confirms the result and decides what to do.',
      );
      expect(plain(explainAssessment(CASES[name]!, 'es').summary.at(-1)!)).toBe(
        'Pasar un umbral no es un diagnóstico: en la mayoría de los casos no da síntomas, y tu médico de vuelo, en Tierra, confirma el resultado y decide qué hacer.',
      );
    }
    expect(plain(explainAssessment(CASES.noChange!, 'en').summary.at(-1)!)).toBe(
      'This is a first reading and not a diagnosis: your flight surgeon on the ground confirms it and decides what to do.',
    );
  });

  it('an eye that could not be measured says so, with the reason in plain words and without numbers', () => {
    const en = explainAssessment(CASES.oneEyeNotMeasured!, 'en');
    expect(en.eyes.OS).toEqual({
      headline: 'I could not measure your left eye today.',
      lines: ['The signal of the scan was too weak.', 'There is no result for this eye today: a number that cannot be supported is not shown.'],
    });
    expect(plain(en.headline)).toBe(
      'No detectable change in your right eye since before the flight; your left eye could not be measured today.',
    );
    const es = explainAssessment(CASES.oneEyeNotMeasured!, 'es');
    expect(es.eyes.OS).toEqual({
      headline: 'Hoy no pude medir tu ojo izquierdo.',
      lines: ['La señal de la tomografía fue demasiado débil.', 'Hoy no hay resultado para este ojo: no se muestra un número que no se puede sostener.'],
    });
    for (const locale of LOCALES) {
      const none = explainAssessment(CASES.nothingMeasured!, locale);
      for (const eye of ['OD', 'OS'] as const) {
        for (const text of [none.eyes[eye].headline, ...none.eyes[eye].lines]) expect(text).not.toMatch(/\d/);
      }
      expect(none.headline).not.toMatch(/\d/);
    }
    expect(plain(explainAssessment(CASES.nothingMeasured!, 'en').headline)).toBe(
      'Neither eye could be measured today: this exam has no scan result.',
    );
    expect(explainAssessment(CASES.nothingMeasured!, 'en').eyes.OD.lines[0]).toBe('The scan was not centred on the optic nerve.');
    expect(explainAssessment(CASES.nothingMeasured!, 'en').eyes.OS.lines[0]).toBe('Part of the image was missing, as happens with a blink.');
  });

  it('every step has its reason, and a step that is this tool’s own rule says so', () => {
    for (const { name, locale, assessment, explanation } of everyExplanation()) {
      expect(explanation.nextSteps.map((step) => step.id), name).toEqual(assessment.nextSteps.map((step) => step.id));
      explanation.nextSteps.forEach((step, index) => {
        const where = `${name} ${locale} ${step.id}`;
        expect(step.text.length, where).toBeGreaterThan(10);
        expect(step.why.length, where).toBeGreaterThan(20);
        expect(step.basis, where).toBe(assessment.nextSteps[index]!.basis);
        if (step.basis === 'assumption') {
          expect(step.why, where).toMatch(locale === 'en' ? /this tool’s own rule/ : /regla propia de esta herramienta/);
        }
      });
    }
    const en = explainAssessment(CASES.firstSign!, 'en').nextSteps.find((step) => step.id === 'oct-in-4-weeks')!;
    expect(plain(en.text)).toBe('Repeat the scan of both eyes on flight day 118 (in 28 days).');
    expect(plain(en.why)).toBe(
      'After a first sign, this tool asks for the next scan 4 weeks later. NASA does not publish how often to repeat the scan after a first sign. This interval is this tool’s own rule, based on the one published case.',
    );
    const es = explainAssessment(CASES.firstSign!, 'es').nextSteps.find((step) => step.id === 'oct-in-4-weeks')!;
    expect(plain(es.text)).toBe('Repetí la tomografía de los dos ojos el día de vuelo 118 (en 28 días).');
    expect(plain(es.why)).toBe(
      'Después de un primer indicio, esta herramienta pide la próxima tomografía a las 4 semanas. La NASA no publica cada cuánto repetir la tomografía después de un primer indicio. Este intervalo es una regla propia de esta herramienta, basada en el único caso publicado.',
    );
  });

  it('explains a follow-up that is kept from the previous control or joined with a routine day', () => {
    const step = explainAssessment(CASES.sustained!, 'en').nextSteps.find((s) => s.id === 'oct-in-4-weeks')!;
    expect(plain(step.text)).toBe('Repeat the scan of both eyes on flight day 90 (in 32 days).');
    expect(plain(step.why)).toContain('Your previous exam (flight day 30) showed a first sign, so this tool keeps the 4-week follow-up for one more exam.');
    expect(plain(step.why)).toContain('That would be flight day 86; flight day 90 is a routine exam of NASA’s calendar and falls close to it, so one scan covers both.');
  });

  it('at the end of the mission says that the next exams are after landing', () => {
    const step = explainAssessment(CASES.endOfMission!, 'en').nextSteps.find((s) => s.id === 'post-flight-exams')!;
    expect(plain(step.text)).toBe('No further scan is planned in flight: your next eye exams are after landing.');
    expect(plain(step.why)).toBe('No routine exam is left in NASA’s calendar for this mission. NASA examines the eyes between 1 and 3 days after return.');
    const late = explainAssessment(CASES.concerningBorderline!, 'es').nextSteps.find((s) => s.id === 'post-flight-exams')!;
    expect(plain(late.why)).toContain('La próxima tomografía caería el día de vuelo 186, después del final de la misión (día de vuelo 180).');
  });

  it('the vision findings carry their numbers and say what is this tool’s own criterion', () => {
    const en = explainAssessment(CASES.nearVision!, 'en');
    const glasses = en.nextSteps.find((step) => step.id === 'try-stronger-glasses')!;
    expect(plain(glasses.text)).toBe('For near work, try the stronger pair of your on-board glasses.');
    expect(plain(glasses.why)).toContain(
      'Your near vision test is worse than before the flight: right eye by 0.24 logMAR (range 0.07 to 0.41) and left eye by 0.28 logMAR (range 0.11 to 0.45).',
    );
    expect(plain(glasses.why)).toContain('This tool takes 0.2 logMAR or more, about two lines of a chart, as a real change.');
    expect(plain(glasses.why)).toContain('the two tests were not both done with, or both without, your near correction');
    expect(plain(glasses.why)).toContain('this is something to try, not a measurement');
    expect(en.findings.map((finding) => finding.id)).toEqual(['near-vision-worse', 'symptom-near-blur', 'symptom-headache']);
    expect(plain(en.findings[2]!.text)).toBe('You reported a headache, which is recorded without linking it to the eye findings.');
    expect(plain(en.summary[1]!)).toBe(
      'In today’s vision tests and answers: your near vision test is worse than before the flight (right eye by 0.24 logMAR and left eye by 0.28 logMAR); you reported worse near vision; you reported a headache.',
    );

    const notify = explainAssessment(CASES.amslerAndSymptoms!, 'es').nextSteps[0]!;
    expect(notify.id).toBe('notify-surgeon-without-delay');
    expect(plain(notify.why)).toBe(
      'La grilla de Amsler muestra marcas fuera de su centro (ojo izquierdo, 0,8 % de la grilla): para la NASA, cualquier línea ondulada, borrosa o faltante es un resultado positivo. Informaste visión distorsionada (ojo izquierdo). Informaste peor visión con poca luz, en un grado que afectó o impidió tus actividades. Informaste un dolor de cabeza que afectó o impidió tus actividades. Avisar pronto en estos casos es una regla propia de esta herramienta: la de la NASA no es pública.',
    );
  });

  it('says which tests were not done today', () => {
    expect(plain(explainAssessment(CASES.testsSkipped!, 'en').summary[1]!)).toBe(
      'Today’s vision tests and answers add no finding; not done today: the near vision test and the Amsler grid.',
    );
    expect(plain(explainAssessment(CASES.noIncrease!, 'es').summary[1]!)).toBe(
      'Hoy no se hicieron las pruebas de visión ni el cuestionario, así que este resultado se apoya solo en la tomografía.',
    );
    expect(explainAssessment(CASES.nothingMeasured!, 'en').summary.map(plain)).toEqual([
      'No scan could be measured today, so this exam has no result for the back of your eyes.',
      'The vision tests and the questionnaire were not done today either.',
      'No number is shown for a scan that could not be measured, and your flight surgeon on the ground is told that it has to be repeated.',
    ]);
  });

  it('the pre-flight session is explained as the reference', () => {
    const en = explainAssessment(CASES.reference!, 'en');
    expect(en.headline).toBe('This is your pre-flight reference exam: later exams are compared with it.');
    expect(en.summary).toHaveLength(2);
    expect(en.eyes.OD).toEqual({
      headline: 'Right eye: pre-flight reference.',
      lines: ['This is the reference for this eye: every in-flight exam is compared with it.'],
    });
    expect(explainAssessment(CASES.reference!, 'es').eyes.OS.headline).toBe('Ojo izquierdo: referencia de antes del vuelo.');
    expect(en.nextSteps[0]!.text).toBe('Next scan of both eyes: flight day 30, your next routine exam.');
    const inFlightStep = explainAssessment(CASES.noChange!, 'en').nextSteps[0]!;
    expect(inFlightStep.text).toBe('Next scan of both eyes: flight day 90, your next routine exam (in 60 days).');
  });

  it('the limitations are always the same nine, and say the error model is provisional while it is', () => {
    for (const { assessment, explanation, locale } of everyExplanation()) {
      expect(explanation.limitations.map((limitation) => limitation.id)).toEqual(assessment.limitations);
      expect(explanation.limitations).toHaveLength(9);
      expect(explanation.limitations[2]!.text).toMatch(locale === 'en' ? /provisional error model/ : /modelo de error provisorio/);
    }
    const validated = { ...CASES.noChange!, errorModelVersion: 'validated-1' };
    expect(explainAssessment(validated, 'en').limitations[2]!.text).toBe(
      'This tool has not been validated on people. Its ranges and probabilities come from its error on simulated eyes.',
    );
    expect(explainAssessment(CASES.noChange!, 'en').limitations.map((limitation) => limitation.text)).toEqual([
      'This is not a diagnosis: it is a first reading of a measurement against NASA’s published thresholds.',
      'The exams in this demonstration are simulated; the analysis that measures them is real.',
      'This tool has not been validated on people. Its ranges and probabilities come from a provisional error model that has not been measured yet.',
      'Your flight surgeon on the ground confirms every result and has the final word.',
      'The pressure inside the skull cannot be measured on board.',
      'It does not measure the choroid, the layer of blood vessels under the retina.',
      'It does not look at the macula, the centre of the retina: the scan covers only the area around the optic nerve.',
      'It does not measure flattening of the back of the eye.',
      'It does not measure a change in your glasses prescription: there is no reliable way to do that on board.',
    ]);
  });
});

describe('texts: what they must never contain', () => {
  const FORBIDDEN: Record<Locale, RegExp[]> = {
    en: [
      /don.t worry|do not worry|nothing to worry/i,
      /\b(grave|serious|severe|alarming|dangerous)\b/i,
      /edema|oedema|papill/i,
      /intracranial/i,
      /acetazolamide|diamox|vitamin|medication|medicine|\bdrugs?\b|\bdos(e|es|age)\b|\bmg\b|\bpills?\b|treatment|\btreat(s|ed)?\b|prescribe/i,
    ],
    es: [
      /no te preocupes|no hay de qué preocuparse|quedate tranquil/i,
      /\b(graves?|seri[oa]s?|alarmante|peligros[oa])\b/i,
      /edema|papila/i,
      /intracraneal/i,
      /acetazolamida|diamox|vitamina|medicaci[oó]n|medicamento|f[aá]rmaco|\bdosis\b|\bmg\b|pastilla|comprimido|tratamiento|\btratar\b|recetar/i,
    ],
  };

  it('no medication, no dose, no alarming or over-reassuring words, no clinical jargon', () => {
    for (const { name, locale, explanation } of everyExplanation()) {
      for (const { where, text } of texts(explanation)) {
        for (const pattern of FORBIDDEN[locale]) expect(text, `${name} ${locale} ${where}`).not.toMatch(pattern);
      }
    }
  });

  it('"diagnosis" appears only to say that this is not one', () => {
    let seen = 0;
    for (const { name, locale, explanation } of everyExplanation()) {
      for (const { where, text } of texts(explanation)) {
        const all = text.match(locale === 'en' ? /diagnos\w*/gi : /diagn[oó]stic\w*/gi) ?? [];
        const negated = text.match(locale === 'en' ? /not a diagnosis/gi : /no es un diagnóstico/gi) ?? [];
        expect(all.length, `${name} ${locale} ${where}`).toBe(negated.length);
        seen += all.length;
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('the pressure inside the skull is mentioned only to say that it cannot be measured on board', () => {
    for (const { name, locale, explanation } of everyExplanation()) {
      for (const { where, text } of texts(explanation)) {
        if (where === 'limitation.no-intracranial-pressure') continue;
        expect(text, `${name} ${locale} ${where}`).not.toMatch(/pressure|skull|presi[oó]n|cr[aá]neo/i);
      }
      const limitation = explanation.limitations.find((l) => l.id === 'no-intracranial-pressure')!;
      expect(limitation.text).toBe(
        locale === 'en' ? 'The pressure inside the skull cannot be measured on board.' : 'La presión dentro del cráneo no se puede medir a bordo.',
      );
    }
  });

  it('no unexplained abbreviations and no leftovers of the code', () => {
    for (const { name, locale, explanation } of everyExplanation()) {
      for (const { where, text } of texts(explanation)) {
        const label = `${name} ${locale} ${where}`;
        expect(text, label).not.toMatch(/\b(OCT|TRT|MRW|BMO|SANS|ODE|RNFL|OD|OS|OI)\b/);
        expect(text, label).not.toMatch(/NaN|undefined|null|\[object|\$\{|Infinity/);
        expect(text, label).not.toMatch(/ {2}|\( | \)|\.\.|,,| \.|^ | $/);
        expect(text, label).toMatch(/[.]$/);
        expect(text.charAt(0), label).toBe(text.charAt(0).toUpperCase());
      }
    }
  });

  it('Spanish is written in rioplatense second person, without the "tú" forms', () => {
    for (const { name, locale, explanation } of everyExplanation()) {
      if (locale !== 'es') continue;
      for (const { where, text } of texts(explanation)) {
        expect(text, `${name} ${where}`).not.toMatch(/\b(tú|tienes|puedes|debes|haz|repite|avisa|contacta|prueba tus|ti)\b/);
        expect(text, `${name} ${where}`).not.toMatch(/\busted(es)?\b/i);
      }
    }
  });
});

describe('texts: same structure in both languages, same text for the same assessment', () => {
  it('both languages have the same sentences in the same places', () => {
    const numbers = (text: string) => (plain(text).match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(',', '.'));
    const explanations = everyExplanation();
    for (const { name, assessment, explanation: en } of explanations.filter((e) => e.locale === 'en')) {
      const es = explainAssessment(assessment, 'es');
      const enTexts = texts(en);
      const esTexts = texts(es);
      expect(esTexts.map((t) => t.where), name).toEqual(enTexts.map((t) => t.where));
      enTexts.forEach((item, index) => {
        // The same numbers, in the same order, in both languages.
        expect(numbers(esTexts[index]!.text), `${name} ${item.where}`).toEqual(numbers(item.text));
        expect(esTexts[index]!.text, `${name} ${item.where}`).not.toBe(item.text);
      });
    }
  });

  it('the summary has two to four sentences and the headline one', () => {
    for (const { name, locale, explanation } of everyExplanation()) {
      expect(explanation.summary.length, `${name} ${locale}`).toBeGreaterThanOrEqual(2);
      expect(explanation.summary.length, `${name} ${locale}`).toBeLessThanOrEqual(4);
      expect(explanation.headline.length, `${name} ${locale}`).toBeLessThan(170);
    }
    // With an acute symptom, folds and other findings at once, the summary still fits.
    expect(explainAssessment(CASES.acuteSymptom!, 'en').summary).toHaveLength(4);
  });

  it('the same assessment gives the same text, also after being stored as JSON', () => {
    for (const { locale, assessment, explanation } of everyExplanation()) {
      expect(explainAssessment(assessment, locale)).toEqual(explanation);
      const stored = JSON.parse(JSON.stringify(assessment)) as SessionAssessment;
      expect(explainAssessment(stored, locale)).toEqual(explanation);
    }
  });

  it('still explains an assessment stored without the optional details', () => {
    for (const name of ['acuteSymptom', 'amslerAndSymptoms', 'nearVision', 'oneEyeNotMeasured'] as const) {
      const { functional: _functional, errorModelVersion: _version, ...bare } = CASES[name]!;
      const stripped: SessionAssessment = {
        ...bare,
        eyes: {
          OD: { ...bare.eyes.OD, notMeasuredReasons: undefined },
          OS: { ...bare.eyes.OS, notMeasuredReasons: undefined },
        },
      };
      for (const locale of LOCALES) {
        for (const { where, text } of texts(explainAssessment(stripped, locale))) {
          expect(text, `${name} ${locale} ${where}`).not.toMatch(/NaN|undefined|null/);
          expect(text.length, `${name} ${locale} ${where}`).toBeGreaterThan(10);
        }
      }
    }
  });
});
