import { describe, expect, it } from 'vitest';
import {
  assessSession,
  buildReport,
  explainAssessment,
  getHistory,
  MAX_SUGGESTED_QUESTIONS,
  PRODUCT,
  PROVISIONAL_ENGINE_VERSION,
  quantityText,
  renderReportMarkdown,
  RULES_VERSION,
  suggestQuestions,
  type CrewId,
  type Locale,
  type Report,
  type ReportCell,
  type ReportQuantity,
  type ReportSection,
  type ReportSectionId,
  type ReportTable,
  type SessionAssessment,
  type SessionRecord,
} from '../src/index';
import {
  acuity,
  amsler,
  BASE,
  eyesWithChange,
  measured,
  notMeasured,
  preflight,
  record,
  symptoms,
  vision,
} from './helpers/fixtures';

const LOCALES: readonly Locale[] = ['en', 'es'];
const SECTION_IDS: readonly ReportSectionId[] = [
  'identification',
  'summary',
  'eye-OD',
  'eye-OS',
  'vision',
  'next-steps',
  'limitations',
  'versions',
  'questions',
];

/** What no text of the product may contain: medication, alarm, false calm, jargon, leftovers of the code. */
const FORBIDDEN: Record<Locale, RegExp[]> = {
  en: [
    /don.t worry|do not worry|nothing to worry/i,
    /\b(grave|serious|severe|alarming|dangerous)\b/i,
    /edema|oedema|papill/i,
    /intracranial/i,
    /acetazolamide|diamox|vitamin|medication|medicine|\bdrugs?\b|\bdos(e|es|age)\b|\bmg\b|\bpills?\b|treatment|\btreat(s|ed)?\b|prescribe/i,
    /NaN|undefined|\[object|Infinity/,
  ],
  es: [
    /no te preocupes|no hay de qué preocuparse|quedate tranquil/i,
    /\b(graves?|seri[oa]s?|alarmante|peligros[oa])\b/i,
    /edema|papila/i,
    /intracraneal/i,
    /acetazolamida|diamox|vitamina|medicaci[oó]n|medicamento|f[aá]rmaco|\bdosis\b|\bmg\b|pastilla|comprimido|tratamiento|\btratar\b|recetar/i,
    /NaN|undefined|\[object|Infinity/,
  ],
};

const plain = (text: string) => text.replace(/\u00a0/g, ' ');
const section = (report: Report, id: ReportSectionId): ReportSection => report.sections.find((s) => s.id === id)!;
const table = (report: Report, id: ReportSectionId, caption: string): ReportTable =>
  section(report, id).tables.find((t) => t.caption === caption)!;
const isQuantity = (cell: ReportCell | undefined): cell is ReportQuantity => typeof cell === 'object';
const row = (t: ReportTable, label: string): ReportCell[] => t.rows.find((cells) => cells[0] === label)!;

// A session of the provisional history: C on flight day 118, clinically concerning in one eye, folds in both.
const historyC = getHistory('C', 181);
const c118 = historyC.find((r) => r.flightDay === 118)!;
const reportC = buildReport(c118, historyC, 'en');

// A live session with everything at once: one eye without a result, vision findings, written questions.
const pre = preflight();
const live: SessionRecord = {
  ...record({
    crewId: 'B',
    flightDay: 30,
    eyes: { OD: measured('OD', { trt: BASE.OD.trt + 30, roughness: 6 }), OS: notMeasured('OS') },
    vision: vision({
      acuity: { OD: acuity('OD', 0.24, { withCorrection: false }), OS: acuity('OS', null) },
      amsler: { OD: amsler('OD', { marks: [{ col: 1, row: 1, kind: 'wavy' }], markedFraction: 0.0075 }), OS: amsler('OS') },
      symptoms: symptoms({ distortion: { severity: 'mild', eye: 'OS' }, headache: { severity: 'severe' }, tinnitus: { severity: 'mild' } }),
    }),
    history: [pre],
  }),
  questions: ['Can I keep exercising as usual?', '   ', 'What about | pipes\nand new lines?', '# is this a heading?', '1. is this a list?'],
};
const reportLive = buildReport(live, [pre], 'en');

const nothingMeasured = record({
  crewId: 'B',
  flightDay: 85,
  eyes: { OD: notMeasured('OD', ['decentered'], [], 85), OS: notMeasured('OS', ['too-few-usable-scans'], ['signal-dropout'], 85) },
  vision: null,
  history: [pre],
});

/** Every record the broad checks run on: the whole provisional history and the special cases. */
function everyRecord(): { name: string; record: SessionRecord; history: SessionRecord[] }[] {
  const all: { name: string; record: SessionRecord; history: SessionRecord[] }[] = [
    { name: 'live', record: live, history: [pre] },
    { name: 'nothingMeasured', record: nothingMeasured, history: [pre] },
    { name: 'preflight', record: pre, history: [] },
  ];
  for (const crewId of ['A', 'B', 'C', 'D'] as readonly CrewId[]) {
    const history = getHistory(crewId, 181);
    for (const session of history) all.push({ name: `${crewId}${session.flightDay}`, record: session, history });
  }
  return all;
}

describe('report: structure', () => {
  it('has the sections of the specification, in order, and carries the simulated-data mark', () => {
    for (const locale of LOCALES) {
      const report = buildReport(c118, historyC, locale);
      expect(report.locale).toBe(locale);
      expect(report.sections.map((s) => s.id)).toEqual(SECTION_IDS);
      expect(report.title).toContain(PRODUCT.name);
      expect(report.simulatedDataNotice).toBe(PRODUCT.simulatedDataNotice[locale]);
      expect(report.purpose.length).toBeGreaterThan(20);
      for (const s of report.sections) {
        expect(s.title.length).toBeGreaterThan(0);
        expect(s.paragraphs.length + s.tables.length).toBeGreaterThan(0);
        for (const t of s.tables) {
          expect(t.columns.length).toBeGreaterThan(1);
          for (const cells of t.rows) expect(cells).toHaveLength(t.columns.length);
        }
      }
    }
  });

  it('identifies the crew member, the mission and the exam, and marks the data as simulated', () => {
    const rows = section(reportC, 'identification').tables[0]!.rows;
    expect(rows.map((cells) => cells[0])).toEqual(['Crew member', 'Identifier', 'Mission', 'Exam', 'Session', 'Data']);
    expect(rows[0]![1]).toBe('Ravi Anand, Flight engineer');
    expect(rows[1]![1]).toBe('SIM-CREW-C');
    expect(rows[2]![1]).toContain('2026-05-20');
    // Flight day 1 is the launch date, so flight day 118 is 117 days later.
    expect(rows[3]![1]).toBe('Flight day 118 (2026-09-14), additional exam');
    expect(rows[4]![1]).toBe('Supplied with the application (simulated history)');
    expect(rows[5]![1]).toBe(PRODUCT.simulatedDataNotice.en);

    const routine = buildReport(historyC.find((r) => r.flightDay === 90)!, historyC, 'es');
    expect(section(routine, 'identification').tables[0]!.rows[0]![1]).toBe('Ravi Anand, Ingeniero de vuelo');
    expect(section(routine, 'identification').tables[0]!.rows[3]![1]).toBe('Día de vuelo 90 (2026-08-17), control de rutina');
    expect(section(reportLive, 'identification').tables[0]!.rows[4]![1]).toBe('Done in this application');
    expect(section(buildReport(pre, [], 'en'), 'identification').tables[0]!.rows[3]![1]).toBe('Before the flight (reference exam)');
  });

  it('summarises the exam with the same sentences as the result screen', () => {
    const explanation = explainAssessment(c118.assessment, 'en');
    const summary = section(reportC, 'summary');
    expect(summary.paragraphs).toEqual([explanation.headline, ...explanation.summary]);
    expect(summary.tables[0]!.rows).toEqual([
      ['Level of this exam', 'Clinically concerning'],
      ['Right eye', 'Clinically concerning'],
      ['Left eye', 'First sign'],
      ['Contact with the flight surgeon', 'Without waiting for the routine report'],
      ['Next scan', 'Flight day 139'],
      ['Amsler grid', '3 times a week'],
    ]);
    const last = buildReport(historyC.at(-1)!, historyC, 'es');
    expect(row(section(last, 'summary').tables[0]!, 'Próxima tomografía')[1]).toBe('Ninguna prevista en vuelo');
    const quiet = buildReport(getHistory('A', 181)[1]!, getHistory('A', 181), 'en');
    expect(row(section(quiet, 'summary').tables[0]!, 'Amsler grid')[1]).toBe('At each exam');
    expect(row(section(quiet, 'summary').tables[0]!, 'Contact with the flight surgeon')[1]).toBe('In the routine report');
  });
});

describe('report: each eye', () => {
  it('a measured eye has its attempts, its measures, its thresholds and its evolution', () => {
    const eye = section(reportC, 'eye-OD');
    expect(eye.paragraphs).toEqual([explainAssessment(c118.assessment, 'en').eyes.OD.headline]);
    expect(eye.tables.map((t) => t.caption)).toEqual(['Capture attempts', 'Measures', 'Thresholds', 'Evolution']);
  });

  it('gives today, before the flight and the change with its range for the main measure', () => {
    const measures = table(reportC, 'eye-OD', 'Measures');
    expect(measures.columns).toEqual(['Measure', 'This exam', 'Before the flight', 'Change (95 % range)']);
    const [label, today, before, change] = measures.rows[0]!;
    expect(label).toContain('main measure');
    const exam = c118.eyes.OD.accepted!;
    const baseline = historyC[0]!.eyes.OD.accepted!;
    expect(today).toEqual({ quantity: exam.trtRingUm, digits: 0, signed: false });
    expect(before).toEqual({ quantity: baseline.trtRingUm, digits: 0, signed: false });
    expect(change).toEqual({ quantity: c118.assessment.eyes.OD.change!.trtRingUm, digits: 0, signed: true });
    expect(isQuantity(change) && change.quantity.interval95).toBeTruthy();
    expect(isQuantity(change) && change.quantity.origin).toBe('derived');
    expect(isQuantity(today) && today.quantity.origin).toBe('measured');
  });

  it('lists the other rings, the rim width, the waviness and the opening area, each with how it was obtained', () => {
    const measures = table(reportC, 'eye-OD', 'Measures');
    expect(measures.rows).toHaveLength(7);
    const change = c118.assessment.eyes.OD.change!;
    // Outer rings and rim width: a change without a range, because the error model does not cover them.
    for (const index of [1, 2, 3]) {
      const cell = measures.rows[index]![3];
      expect(cell).toEqual({ quantity: change.rings[index], digits: 0, signed: true });
      expect(isQuantity(cell) && cell.quantity.interval95).toBeUndefined();
    }
    expect(row(measures, 'Minimum rim width')[3]).toEqual({ quantity: change.mrwUm, digits: 0, signed: true });
    const waviness = row(measures, 'Waviness of the membrane under the retina (folds)');
    expect(waviness[3]).toEqual({ quantity: change.bmRoughnessUm, digits: 1, signed: true });
    const area = measures.rows[6]!;
    expect(area[1]).toEqual({ quantity: { value: 1.86, unit: 'mm²', origin: 'measured' }, digits: 2, signed: false });
    expect(area[3]).toEqual({ quantity: { value: 0, unit: '%', origin: 'derived' }, digits: 1, signed: true });
    for (const cells of measures.rows) {
      for (const cell of cells.slice(1)) expect(isQuantity(cell)).toBe(true);
    }
  });

  it('states each threshold, whether the measured value passed it and how sure that is', () => {
    const thresholds = table(reportC, 'eye-OD', 'Thresholds');
    expect(thresholds.rows.map((cells) => [cells[0], cells[2], plain(cells[3] as string)])).toEqual([
      ['First sign: thickness increase larger than', 'Yes', 'very likely (more than 99 %)'],
      ['Clinically concerning: thickness increase of at least', 'Yes', 'likely (57 %)'],
      ['New folds: waviness increase larger than', 'Yes', 'very likely (95 %)'],
    ]);
    expect(thresholds.rows.map((cells) => cells[1])).toEqual([
      { quantity: { value: 19.4, unit: 'µm', origin: 'reference', sources: ['laurie2020', 'nasa-mtb-2024'] }, digits: 1, signed: false },
      { quantity: { value: 55, unit: 'µm', origin: 'reference', sources: ['nasa-mtb-2024', 'brunstetter2024', 'nguyen2025'] }, digits: 0, signed: false },
      { quantity: { value: 2.8, unit: 'µm', origin: 'reference', sources: ['ferguson2023'] }, digits: 1, signed: false },
    ]);
  });

  it('shows the evolution over the earlier controls, ending in this one', () => {
    const evolution = table(reportC, 'eye-OD', 'Evolution');
    expect(evolution.rows.map((cells) => cells[0])).toEqual([
      'Before the flight',
      'Flight day 30',
      'Flight day 58',
      'Flight day 90',
      'Flight day 118 (this exam)',
    ]);
    expect(evolution.rows[0]!.slice(1, 3)).toEqual(['Reference', '—']);
    expect(evolution.rows.slice(1).map((cells) => cells[2])).toEqual([
      'First sign',
      'First sign',
      'First sign',
      'Clinically concerning',
    ]);
    const day30 = historyC.find((r) => r.flightDay === 30)!;
    expect(evolution.rows[1]![1]).toEqual({ quantity: day30.assessment.eyes.OD.change!.trtRingUm, digits: 0, signed: true });
    // The scripted capture of flight day 90 needed a second attempt.
    expect(evolution.rows[3]![4]).toBe('2');
    expect(evolution.rows[4]![4]).toBe('1');
  });

  it('uses only the sessions before this one, whatever history it is given', () => {
    const onlyEarlier = historyC.filter((r) => r.flightDay < 118);
    const shuffled = [...historyC].reverse();
    const other = getHistory('D', 181);
    expect(buildReport(c118, onlyEarlier, 'en')).toEqual(reportC);
    expect(buildReport(c118, [...shuffled, ...other], 'en')).toEqual(reportC);
  });

  it('an eye without a result says why in words and shows no measures', () => {
    const eye = section(reportLive, 'eye-OS');
    expect(eye.paragraphs).toEqual([
      'I could not measure your left eye today.',
      'The signal of the scan was too weak.',
      'There is no result for this eye today: a number that cannot be supported is not shown.',
    ]);
    expect(eye.tables.map((t) => t.caption)).toEqual(['Capture attempts', 'Evolution']);
    const attempts = eye.tables[0]!;
    expect(attempts.rows).toHaveLength(3);
    expect(attempts.rows[0]!.slice(0, 3)).toEqual(['1', 'Rejected', '12']);
    expect(attempts.rows[0]![4]).toBe('Too few of the scan lines were good enough to measure. The signal of the scan was too weak.');
    expect(eye.tables[1]!.rows.at(-1)).toEqual(['Flight day 30 (this exam)', 'Could not be measured', 'Could not be measured', '—', '3']);
    // The measured eye of the same session keeps its tables, with the total of scan lines.
    const od = section(reportLive, 'eye-OD');
    expect(od.tables.map((t) => t.caption)).toEqual(['Capture attempts', 'Measures', 'Thresholds', 'Evolution']);
    expect(od.tables[0]!.rows[0]!.slice(0, 3)).toEqual(['1', 'Measured', '48 of 48']);
    expect(od.tables[0]!.rows[0]![4]).toBe('—');
  });

  it('a session where nothing could be measured has no level, and says so', () => {
    const report = buildReport(nothingMeasured, [pre], 'en');
    expect(nothingMeasured.assessment.level).toBeNull();
    expect(section(report, 'summary').tables[0]!.rows.slice(0, 3)).toEqual([
      ['Level of this exam', 'Could not be measured'],
      ['Right eye', 'Could not be measured'],
      ['Left eye', 'Could not be measured'],
    ]);
    expect(renderReportMarkdown(report)).not.toMatch(/No detectable change/);
    expect(renderReportMarkdown(buildReport(nothingMeasured, [pre], 'es'))).not.toMatch(/Sin cambio detectable/);
    expect(row(section(report, 'versions').tables[0]!, 'Analysis engine')[1]).toBe('No exam was measured');
  });

  it('the pre-flight exam is reported as the reference, without comparison', () => {
    const report = buildReport(pre, [], 'en');
    expect(section(report, 'summary').tables[0]!.rows.slice(0, 3)).toEqual([
      ['Level of this exam', 'Reference'],
      ['Right eye', 'Reference'],
      ['Left eye', 'Reference'],
    ]);
    const eye = section(report, 'eye-OD');
    expect(eye.tables.map((t) => t.caption)).toEqual(['Capture attempts', 'Measures']);
    for (const cells of eye.tables[1]!.rows) {
      expect(isQuantity(cells[1])).toBe(true);
      expect(cells.slice(2)).toEqual(['—', '—']);
    }
  });
});

describe('report: vision tests, steps, limits, versions and questions', () => {
  it('reports the near vision test against the pre-flight one, with its notes', () => {
    const near = table(reportLive, 'vision', 'Near vision test');
    expect(near.columns).toEqual(['Eye', 'This exam', 'Before the flight', 'Change (95 % range)', 'Notes']);
    expect(near.rows[0]).toEqual([
      'Right eye',
      { quantity: { value: 0.24, unit: 'logMAR', origin: 'self-reported' }, digits: 2, signed: false },
      { quantity: { value: 0, unit: 'logMAR', origin: 'self-reported' }, digits: 2, signed: false },
      { quantity: { value: 0.24, unit: 'logMAR', origin: 'derived', interval95: [0.07, 0.41], sources: ['bach2025'] }, digits: 2, signed: true },
      '18 presentations; without near correction',
    ]);
    expect(near.rows[1]).toEqual(['Left eye', 'The test did not reach a result', '—', '—', '18 presentations; with near correction']);
    const floor = record({
      crewId: 'B',
      flightDay: 30,
      eyes: eyesWithChange({ OD: 5, OS: 3 }),
      vision: vision({ acuity: { OD: acuity('OD', 0.3, { atScreenFloor: true }), OS: null } }),
      history: [pre],
    });
    const floorRows = table(buildReport(floor, [pre], 'en'), 'vision', 'Near vision test').rows;
    expect(floorRows).toHaveLength(1);
    expect(floorRows[0]![4]).toBe('18 presentations; with near correction; limited by the screen, not by the eye');
  });

  it('reports the Amsler grid and every symptom, with the grade as the questionnaire defines it', () => {
    const grid = table(reportLive, 'vision', 'Amsler grid');
    expect(grid.rows).toEqual([
      ['Right eye', { quantity: { value: 0.75, unit: '%', origin: 'self-reported' }, digits: 1, signed: false }, 'No', 'Yes'],
      ['Left eye', { quantity: { value: 0, unit: '%', origin: 'self-reported' }, digits: 1, signed: false }, 'No', 'Yes'],
    ]);
    expect(table(reportLive, 'vision', 'Symptoms reported').rows).toEqual([
      ['Distorted vision', 'Mild: did not affect activities', 'Left eye'],
      ['A headache', 'Affected or prevented activities', '—'],
      ['Ringing in the ears', 'Mild: did not affect activities', '—'],
    ]);
    const paragraphs = section(reportLive, 'vision').paragraphs.map(plain);
    expect(paragraphs).toEqual([
      'The Amsler grid shows marks away from its centre (right eye, 0.8 % of the grid).',
      'You reported distorted vision (left eye).',
      'Your near vision test is worse than before the flight: right eye by 0.24 logMAR (range 0.07 to 0.41).',
      'You reported a headache, which is recorded without linking it to the eye findings.',
      'Near glasses in use: reading.',
    ]);
  });

  it('says which tests were not done, and that no symptom was reported', () => {
    const skipped = buildReport(nothingMeasured, [pre], 'en');
    expect(section(skipped, 'vision').tables).toEqual([]);
    expect(section(skipped, 'vision').paragraphs).toEqual([
      'Not done in this exam: the near vision test.',
      'Not done in this exam: the Amsler grid.',
      'Not done in this exam: the questionnaire.',
    ]);
    const quiet = buildReport(getHistory('A', 181)[1]!, getHistory('A', 181), 'es');
    expect(section(quiet, 'vision').paragraphs).toEqual([
      'No se informó ningún síntoma en el cuestionario.',
      'Anteojos de cerca en uso: ninguno.',
    ]);
    expect(section(quiet, 'vision').tables.map((t) => t.caption)).toEqual(['Prueba de visión de cerca', 'Grilla de Amsler']);
  });

  it('lists the next steps with their reason and says which are this tool’s own rules', () => {
    const explanation = explainAssessment(c118.assessment, 'en');
    const steps = section(reportC, 'next-steps').tables[0]!;
    expect(steps.columns).toEqual(['Step', 'Why', 'Basis']);
    expect(steps.rows).toEqual(
      explanation.nextSteps.map((step) => [step.text, step.why, step.basis === 'nasa' ? 'NASA practice' : 'This tool’s own rule']),
    );
    expect(steps.rows.map((cells) => cells[2])).toEqual(['This tool’s own rule', 'This tool’s own rule', 'This tool’s own rule', 'NASA practice']);
  });

  it('states the nine limits of the tool', () => {
    const limits = section(reportC, 'limitations');
    expect(limits.paragraphs).toEqual(explainAssessment(c118.assessment, 'en').limitations.map((l) => l.text));
    expect(limits.paragraphs).toHaveLength(9);
    expect(limits.paragraphs[0]).toMatch(/not a diagnosis/);
  });

  it('gives the versions of the engine, the rules and the error model, and the thresholds with their sources', () => {
    const versions = section(reportC, 'versions');
    expect(versions.tables[0]!.rows).toEqual([
      ['Analysis engine', PROVISIONAL_ENGINE_VERSION],
      ['Rules', RULES_VERSION],
      ['Error model', 'provisional-1 (provisional: not measured yet)'],
    ]);
    const thresholds = versions.tables[1]!;
    expect(thresholds.caption).toBe('Thresholds and their sources');
    expect(thresholds.rows).toHaveLength(5);
    expect(thresholds.rows.map((cells) => cells[2])).toEqual([
      'NASA',
      'NASA',
      'NASA',
      'This tool (an assumption)',
      'This tool (an assumption)',
    ]);
    // NASA's thresholds are published reference values; this tool's own limits are plain text, not "reference".
    expect(thresholds.rows.slice(0, 3).every((cells) => isQuantity(cells[1]) && cells[1].quantity.origin === 'reference')).toBe(true);
    expect(thresholds.rows.slice(3).map((cells) => plain(cells[1] as string))).toEqual(['0.2 logMAR', '5 %']);
    expect(thresholds.rows[0]![3]).toContain('Laurie 2020');
    expect(thresholds.rows[4]![3]).toBe('—');
    const validated = { ...c118, assessment: { ...c118.assessment, errorModelVersion: 'validated-1' } };
    expect(row(section(buildReport(validated, historyC, 'en'), 'versions').tables[0]!, 'Error model')[1]).toBe('validated-1');
  });

  it('carries the questions the crew member wrote, or says there are none', () => {
    expect(section(reportLive, 'questions').paragraphs).toEqual([
      'Can I keep exercising as usual?',
      'What about | pipes\nand new lines?',
      '# is this a heading?',
      '1. is this a list?',
    ]);
    expect(section(reportC, 'questions').paragraphs).toEqual(['No questions written yet.']);
    expect(section(buildReport(c118, historyC, 'es'), 'questions').paragraphs).toEqual(['Todavía no hay preguntas anotadas.']);
  });
});

describe('report: as Markdown', () => {
  const markdown = plain(renderReportMarkdown(reportC));

  it('starts with the title, the simulated-data mark and the purpose, and has one heading per section', () => {
    const lines = markdown.split('\n');
    expect(lines.slice(0, 5)).toEqual([
      `# ${PRODUCT.name}: report for the medical conference`,
      '',
      `> ${PRODUCT.simulatedDataNotice.en}`,
      '',
      'A summary for your conversation with your flight surgeon, who confirms the result and decides.',
    ]);
    expect(lines.filter((line) => line.startsWith('## '))).toEqual(reportC.sections.map((s) => `## ${s.title}`));
    expect(markdown.endsWith('\n')).toBe(true);
    expect(markdown.endsWith('\n\n')).toBe(false);
    expect(markdown).not.toMatch(/\n{3,}/);
  });

  it('writes each quantity with its unit, its range and how it was obtained', () => {
    expect(markdown).toContain('| Retinal thickness, ring from the optic nerve opening to 250 µm (main measure) | 473 µm · measured | 417 µm · measured | +56 µm (+47 to +64) · calculated |');
    expect(markdown).toContain('| First sign: thickness increase larger than | 19.4 µm · reference | Yes | very likely (more than 99 %) |');
    expect(markdown).toContain('| Waviness of the membrane under the retina (folds) | 7.5 µm · measured | 2.9 µm · measured | +4.6 µm (+2.4 to +6.8) · calculated |');
    expect(markdown).toContain('| 1 | Measured | 46 of 48 | 32.9 dB · measured | — |');
    const spanish = plain(renderReportMarkdown(buildReport(c118, historyC, 'es')));
    expect(spanish).toContain('| 473 µm · medido | 417 µm · medido | +56 µm (+47 a +64) · calculado |');
    expect(spanish).toContain('| 19,4 µm · referencia | Sí | muy probable (más de 99 %) |');
    expect(spanish).toContain('+4,6 µm (+2,4 a +6,8) · calculado');
  });

  it('writes a change with its sign, and a value without one', () => {
    const cell = (value: number, signed: boolean, interval95?: [number, number]): ReportQuantity => ({
      quantity: { value, unit: 'µm', origin: 'derived', interval95 },
      digits: 0,
      signed,
    });
    expect(plain(quantityText(cell(24.2, true, [15.9, 32.5]), 'en'))).toBe('+24 µm (+16 to +33) · calculated');
    expect(plain(quantityText(cell(-3.4, true, [-11.7, 4.9]), 'es'))).toBe('−3 µm (−12 a +5) · calculado');
    expect(plain(quantityText(cell(0.2, true), 'en'))).toBe('0 µm · calculated');
    expect(plain(quantityText(cell(-0.2, true), 'en'))).toBe('0 µm · calculated');
    expect(plain(quantityText(cell(24.2, false), 'en'))).toBe('24 µm · calculated');
    expect(plain(quantityText({ quantity: { value: 0.75, unit: '%', origin: 'self-reported' }, digits: 1, signed: false }, 'es'))).toBe('0,8 % · informado por vos');
    expect(plain(quantityText({ quantity: { value: 12, unit: '', origin: 'measured' }, digits: 0, signed: false }, 'en'))).toBe('12 · measured');
  });

  it('keeps every table well formed: one separator row, the same cells in every row', () => {
    for (const { name, record: session, history } of everyRecord()) {
      for (const locale of LOCALES) {
        const lines = renderReportMarkdown(buildReport(session, history, locale)).split('\n');
        lines.forEach((line, index) => {
          if (!line.startsWith('|')) return;
          const cells = (text: string) => text.replace(/\\\|/g, '').split('|').length;
          const isFirst = !lines[index - 1]?.startsWith('|');
          if (isFirst) {
            expect(lines[index + 1], `${name} ${locale} line ${index}`).toMatch(/^\|( --- \|)+$/);
            expect(cells(lines[index + 1]!), `${name} ${locale} line ${index}`).toBe(cells(line));
          } else {
            expect(cells(line), `${name} ${locale} line ${index}`).toBe(cells(lines[index - 1]!));
          }
        });
      }
    }
  });

  it('keeps what the crew member wrote from breaking the document', () => {
    const text = renderReportMarkdown(reportLive);
    const questions = text.slice(text.indexOf('## My questions for the flight surgeon')).split('\n').filter((line) => line.length > 0);
    expect(questions).toEqual([
      '## My questions for the flight surgeon',
      'Can I keep exercising as usual?',
      'What about | pipes and new lines?',
      '\\# is this a heading?',
      '1\\. is this a list?',
    ]);
    // In a table, a vertical bar inside a cell is escaped.
    const withPipe: Report = {
      ...reportLive,
      sections: [{ id: 'questions', title: 'T', paragraphs: [], tables: [{ caption: '', columns: ['a', 'b'], rows: [['x | y', 'line\nbreak']] }] }],
    };
    expect(renderReportMarkdown(withPipe)).toContain('| x \\| y | line break |');
  });

  it('gives the same text for the same report', () => {
    for (const locale of LOCALES) {
      const first = renderReportMarkdown(buildReport(c118, historyC, locale));
      expect(renderReportMarkdown(buildReport(c118, historyC, locale))).toBe(first);
      const stored = JSON.parse(JSON.stringify(c118)) as SessionRecord;
      expect(renderReportMarkdown(buildReport(stored, JSON.parse(JSON.stringify(historyC)) as SessionRecord[], locale))).toBe(first);
    }
  });
});

describe('report: both languages and what it must never contain', () => {
  it('has the same structure and the same numbers in both languages', () => {
    const numbers = (text: string) => (plain(text).match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(',', '.'));
    for (const { name, record: session, history } of everyRecord()) {
      const en = buildReport(session, history, 'en');
      const es = buildReport(session, history, 'es');
      expect(es.sections.map((s) => s.id), name).toEqual(en.sections.map((s) => s.id));
      en.sections.forEach((s, index) => {
        const other = es.sections[index]!;
        expect(other.paragraphs.length, `${name} ${s.id}`).toBe(s.paragraphs.length);
        expect(other.tables.map((t) => [t.columns.length, t.rows.length]), `${name} ${s.id}`).toEqual(
          s.tables.map((t) => [t.columns.length, t.rows.length]),
        );
        s.tables.forEach((t, tableIndex) => {
          t.rows.forEach((cells, rowIndex) => {
            cells.forEach((cell, cellIndex) => {
              const otherCell = other.tables[tableIndex]!.rows[rowIndex]![cellIndex]!;
              // A quantity is the same object in both languages; a text carries the same numbers.
              if (isQuantity(cell)) expect(otherCell, `${name} ${s.id}`).toEqual(cell);
              else if (s.id !== 'versions' && s.id !== 'identification') {
                expect(numbers(otherCell as string), `${name} ${s.id} ${cell}`).toEqual(numbers(cell));
              }
            });
          });
        });
      });
    }
  });

  it('no medication, no alarming words, no leftovers of the code, in any report', () => {
    for (const { name, record: session, history } of everyRecord()) {
      for (const locale of LOCALES) {
        const text = renderReportMarkdown(buildReport(session, history, locale));
        for (const pattern of FORBIDDEN[locale]) expect(text, `${name} ${locale}`).not.toMatch(pattern);
        expect(text, `${name} ${locale}`).toContain(PRODUCT.simulatedDataNotice[locale]);
        // "Diagnosis" only to say that this is not one; the pressure inside the skull only to say it cannot be measured.
        const diagnosis = text.match(locale === 'en' ? /diagnos\w*/gi : /diagn[oó]stic\w*/gi) ?? [];
        const negated = text.match(locale === 'en' ? /not a diagnosis/gi : /no es un diagnóstico/gi) ?? [];
        expect(diagnosis.length, `${name} ${locale}`).toBe(negated.length);
        const pressure = text.split('\n').filter((line) => /pressure|skull|presi[oó]n|cr[aá]neo/i.test(line));
        expect(pressure, `${name} ${locale}`).toEqual([
          locale === 'en' ? 'The pressure inside the skull cannot be measured on board.' : 'La presión dentro del cráneo no se puede medir a bordo.',
        ]);
      }
    }
  });

  it('the product name comes from one place', () => {
    const renamed = renderReportMarkdown(reportC).split(PRODUCT.name);
    expect(renamed).toHaveLength(2);
  });
});

describe('suggested questions for the flight surgeon', () => {
  const base = { crewId: 'B' as const, flightDay: 30, history: [pre] };
  const assess = (change: { OD: number; OS: number }, functional = vision(), roughness: { OD?: number } = {}): SessionAssessment =>
    assessSession({ ...base, eyes: eyesWithChange(change, roughness), vision: functional });

  it('after a first sign, asks how often to repeat the scan', () => {
    const questions = suggestQuestions(assess({ OD: 30, OS: 3 }), 'en');
    expect(questions[0]).toBe('How often should I repeat the scan from now on?');
    expect(questions).toContain('Is there anything I should watch for between scans?');
    expect(suggestQuestions(assess({ OD: 30, OS: 3 }), 'es')[0]).toBe('¿Cada cuánto conviene que repita la tomografía de ahora en adelante?');
  });

  it('follows the findings, most urgent first, one question each before any second one', () => {
    // Clinically concerning in one eye and a first sign in the other, both far from their thresholds.
    expect(suggestQuestions(assess({ OD: 70, OS: 30 }), 'en')).toEqual([
      'What does a change at this level mean for the rest of my mission?',
      'How often should I repeat the scan from now on?',
      'Is there anything I should watch for between scans?',
      'Which eye exams will I have after landing?',
      'Is there anything in this result you would look at more closely?',
    ]);
    // With new folds that are not certain, the folds and the closeness to a threshold come before any second question.
    expect(suggestQuestions(assess({ OD: 70, OS: 30 }, vision(), { OD: 4 }), 'en')).toEqual([
      'What does a change at this level mean for the rest of my mission?',
      'How often should I repeat the scan from now on?',
      'What do the new folds mean, and can they affect my vision?',
      'My result is close to a threshold: would you repeat the scan sooner?',
      'Is there anything I should watch for between scans?',
    ]);
    const acute = suggestQuestions(assess({ OD: 5, OS: 3 }, vision({ symptoms: symptoms({ 'new-dark-spot': {} }) })), 'en');
    expect(acute[0]).toBe('What should I do until we talk, and what should make me call you again?');
    const glasses = suggestQuestions(assess({ OD: 5, OS: 3 }, vision({ symptoms: symptoms({ 'near-vision': {}, headache: {} }) })), 'en');
    expect(glasses.slice(0, 2)).toEqual([
      'Which of my on-board glasses should I use, and when should I tell you if they stop helping?',
      'Should I keep a record of my headaches, and what should I write down?',
    ]);
    const unmeasured = assessSession({ ...base, eyes: { OD: measured('OD', { trt: BASE.OD.trt }), OS: notMeasured('OS') }, vision: vision() });
    expect(suggestQuestions(unmeasured, 'en')[0]).toBe('One scan could not be measured: what can I do differently when I repeat it?');
    const grid = assess({ OD: 5, OS: 3 }, vision({ amsler: { OD: amsler('OD', { marks: [{ col: 1, row: 1, kind: 'wavy' }], markedFraction: 0.01 }), OS: amsler('OS') }, symptoms: symptoms({ distortion: {} }) }));
    expect(suggestQuestions(grid, 'en').slice(0, 2)).toEqual([
      'What should I do if the marks on the Amsler grid change?',
      'Could the change in vision I noticed be related to what the scan shows?',
    ]);
  });

  it('asks about a result that is close to a threshold', () => {
    const borderline = suggestQuestions(assess({ OD: 17, OS: 3 }), 'en');
    expect(borderline[0]).toBe('My result is close to a threshold: would you repeat the scan sooner?');
    expect(suggestQuestions(assess({ OD: 5, OS: 3 }), 'en')).not.toContain(borderline[0]);
  });

  it('without findings, still offers something to ask', () => {
    expect(suggestQuestions(assess({ OD: 5, OS: 3 }), 'en')).toEqual([
      'Is there anything in this result you would look at more closely?',
      'How does this first reading compare with what you see from the ground?',
    ]);
  });

  it('gives at most five, without repeats, the same every time and the same count in both languages', () => {
    const everything = assessSession({
      ...base,
      eyes: { OD: measured('OD', { trt: BASE.OD.trt + 70, roughness: 7 }), OS: notMeasured('OS') },
      vision: vision({
        acuity: { OD: acuity('OD', 0.4), OS: acuity('OS', 0.02) },
        amsler: { OD: amsler('OD', { marks: [{ col: 1, row: 1, kind: 'wavy' }], markedFraction: 0.01 }), OS: amsler('OS', { marks: [{ col: 9, row: 9, kind: 'missing' }], markedFraction: 0.01, centralMarked: true }) },
        symptoms: symptoms({ 'sudden-vision-loss': {}, distortion: {}, 'near-vision': {}, headache: {} }),
      }),
    });
    expect(everything.findings).toHaveLength(10);
    const assessments = [everything, ...everyRecord().map((r) => r.record.assessment)];
    for (const assessment of assessments) {
      const en = suggestQuestions(assessment, 'en');
      const es = suggestQuestions(assessment, 'es');
      expect(en.length).toBeGreaterThan(0);
      expect(en.length).toBeLessThanOrEqual(MAX_SUGGESTED_QUESTIONS);
      expect(MAX_SUGGESTED_QUESTIONS).toBe(5);
      expect(es).toHaveLength(en.length);
      expect(new Set(en).size).toBe(en.length);
      expect(suggestQuestions(assessment, 'en')).toEqual(en);
      for (const question of en) {
        expect(question).toMatch(/\?$/);
        for (const pattern of FORBIDDEN.en) expect(question).not.toMatch(pattern);
      }
      for (const question of es) {
        expect(question).toMatch(/^¿|: ¿|\? ¿/);
        expect(question).toMatch(/\?$/);
        for (const pattern of FORBIDDEN.es) expect(question).not.toMatch(pattern);
      }
    }
    expect(suggestQuestions(everything, 'en')).toHaveLength(5);
  });
});
