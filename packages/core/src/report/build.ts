/**
 * The report for the medical conference: what the astronaut takes to the flight
 * surgeon. Everything in it comes from the session record and the sessions
 * before it; the sentences about the result are the same ones the result screen
 * shows (`explainAssessment`).
 */
import type {
  CaptureAttemptRecord,
  Eye,
  ExamSummary,
  FindingId,
  Level,
  Quantity,
  SessionRecord,
} from '../contract';
import { CREW, MISSION } from '../mission';
import { PRODUCT, type Locale } from '../product';
import { isProvisionalErrorModel } from '../rules/errorModel';
import { RULE_SOURCES } from '../rules/sources';
import {
  BM_ROUGHNESS_FOLDS_UM,
  THRESHOLDS,
  TRT_CLINICALLY_CONCERNING_UM,
  TRT_FIRST_SIGN_UM,
} from '../rules/thresholds';
import { explainAssessment, phrasesFor, type Explanation } from '../texts/explain';
import { capitalize, decimalsFor, formatNumber, NBSP, percentText } from '../texts/format';
import type { Phrases } from '../texts/phrases';
import { REPORT_LABELS, type ReportLabels } from './labels';
import type { Report, ReportCell, ReportQuantity, ReportSection, ReportTable } from './types';

const EYES: readonly Eye[] = ['OD', 'OS'];
const DAY_MS = 86_400_000;

/** Findings that come from the vision tests and the questionnaire. */
const FUNCTIONAL_FINDINGS: readonly FindingId[] = [
  'symptom-acute',
  'amsler-marked-central',
  'amsler-marked',
  'symptom-other',
  'near-vision-worse',
  'symptom-near-blur',
  'symptom-headache',
];

interface Context {
  record: SessionRecord;
  /** Sessions of the same crew member before this one, oldest first. */
  earlier: readonly SessionRecord[];
  /** The pre-flight session, when it is among them. */
  preflight: SessionRecord | null;
  explanation: Explanation;
  locale: Locale;
  L: ReportLabels;
  p: Phrases;
}

function quantity(value: Quantity, digits: number, signed = false): ReportQuantity {
  return { quantity: value, digits, signed };
}

/** Decimals a published value is written with: 19.4 has one, 55 has none. */
function decimalsOf(value: number): number {
  const text = String(value);
  const point = text.indexOf('.');
  return point < 0 ? 0 : text.length - point - 1;
}

/** Calendar date of a flight day: flight day 1 is the launch date. Never read from the clock. */
function flightDate(flightDay: number): string {
  const launchMs = Date.parse(`${MISSION.launchDateIso}T00:00:00Z`);
  return new Date(launchMs + (flightDay - 1) * DAY_MS).toISOString().slice(0, 10);
}

function measuredExam(record: SessionRecord | null, eye: Eye): ExamSummary | null {
  const exam = record?.eyes[eye].accepted;
  return exam && exam.status === 'measured' ? exam : null;
}

function levelLabel(level: Level | null, L: ReportLabels): string {
  return level === null ? L.notMeasured : L.level[level];
}

function keyValueTable(L: ReportLabels, rows: ReportCell[][], caption = ''): ReportTable {
  return { caption, columns: [L.item, L.value], rows };
}

// ------------------------------------------------------------- Sections

function identification({ record, locale, L }: Context): ReportSection {
  const crew = CREW.find((member) => member.id === record.crewId);
  const routine = MISSION.routineControlDays.includes(record.flightDay);
  return {
    id: 'identification',
    title: L.section.identification,
    paragraphs: [],
    tables: [
      keyValueTable(L, [
        [L.crewMember, crew ? `${crew.name}, ${crew.role[locale]}` : record.crewId],
        [L.identifier, crew?.patientId ?? L.none],
        [L.mission, L.missionValue(MISSION.name, MISSION.durationDays, MISSION.launchDateIso)],
        [
          L.exam,
          record.flightDay > 0 ? L.flightDayExam(record.flightDay, flightDate(record.flightDay), routine) : L.preflightExam,
        ],
        [L.session, L.sessionOrigin[record.origin]],
        [L.data, PRODUCT.simulatedDataNotice[locale]],
      ]),
    ],
  };
}

function summary({ record, explanation, L }: Context): ReportSection {
  const { assessment } = record;
  // The pre-flight exam is the reference: it is not compared, so it has no level to state.
  const isReference = record.flightDay <= 0;
  const label = (level: Level | null) => (isReference && level !== null ? L.reference : levelLabel(level, L));
  return {
    id: 'summary',
    title: L.section.summary,
    paragraphs: [explanation.headline, ...explanation.summary],
    tables: [
      keyValueTable(L, [
        // A session without a level is one where no eye could be measured.
        [L.sessionLevel, label(assessment.level)],
        [L.eye.OD, label(assessment.eyes.OD.level)],
        [L.eye.OS, label(assessment.eyes.OS.level)],
        [L.contact, L.contactValue[assessment.contact]],
        [L.nextScan, assessment.nextOct ? L.nextScanValue(assessment.nextOct.flightDay) : L.noNextScan],
        [L.amslerGrid, assessment.amslerPerWeek > 0 ? L.amslerPerWeek(assessment.amslerPerWeek) : L.amslerAtExams],
      ]),
    ],
  };
}

function attemptReasons(attempt: CaptureAttemptRecord, p: Phrases): string {
  const reasons: string[] = [];
  const mainScanReason = attempt.scanRejections[0];
  for (const reason of [...attempt.rejections, ...(mainScanReason ? [mainScanReason] : [])]) {
    const text = p.eyeNotMeasuredReason(reason);
    if (!reasons.includes(text)) reasons.push(text);
  }
  return reasons.join(' ');
}

function attemptsTable(eye: Eye, { record, L, p }: Context): ReportTable | null {
  const capture = record.eyes[eye];
  if (capture.attempts.length === 0) return null;
  const total = capture.accepted?.quality.totalScans;
  return {
    caption: L.attempts,
    columns: [L.attempt, L.result, L.usableScans, L.meanQuality, L.whyRejected],
    rows: capture.attempts.map((attempt) => [
      String(attempt.attempt),
      attempt.status === 'measured' ? L.measured : L.rejected,
      total !== undefined ? L.usableOf(attempt.usableScans, total) : String(attempt.usableScans),
      quantity({ value: attempt.meanQualityDb, unit: 'dB', origin: 'measured' }, 1),
      attempt.status === 'measured' ? L.none : attemptReasons(attempt, p) || L.none,
    ]),
  };
}

function measuresTable(eye: Eye, { record, preflight, L }: Context): ReportTable | null {
  const exam = measuredExam(record, eye);
  if (!exam) return null;
  // Before the flight there is nothing to compare with: the reference columns stay empty.
  const baseline = record.flightDay > 0 ? measuredExam(preflight, eye) : null;
  const change = record.assessment.eyes[eye].change;
  const cell = (value: Quantity | null | undefined, digits: number, signed = false): ReportCell =>
    value ? quantity(value, digits, signed) : L.none;
  // The rules give one change per ring, in the order of the exam, when every ring had its reference.
  const ringChanges = change && change.rings.length === exam.rings.length ? change.rings : null;

  const rows: ReportCell[][] = [];
  for (const [index, ring] of exam.rings.entries()) {
    const isMain = ring.innerUm === 0 && ring.outerUm === 250;
    const reference = baseline?.rings.find((r) => r.innerUm === ring.innerUm && r.outerUm === ring.outerUm);
    const ringChange = isMain ? change?.trtRingUm : ringChanges?.[index];
    rows.push([
      isMain ? L.mainRing : L.ring(ring.innerUm, ring.outerUm),
      cell(ring.thickness, 0),
      cell(reference?.thickness, 0),
      cell(
        ringChange,
        ringChange && isMain ? decimalsFor(ringChange.value, [TRT_FIRST_SIGN_UM, TRT_CLINICALLY_CONCERNING_UM], 0) : 0,
        true,
      ),
    ]);
  }
  rows.push([L.rimWidth, cell(exam.mrwUm, 0), cell(baseline?.mrwUm, 0), cell(change?.mrwUm, 0, true)]);
  rows.push([
    L.waviness,
    cell(exam.bmRoughnessUm, 1),
    cell(baseline?.bmRoughnessUm, 1),
    cell(change?.bmRoughnessUm, change ? decimalsFor(change.bmRoughnessUm.value, [BM_ROUGHNESS_FOLDS_UM], 1) : 1, true),
  ]);
  if (exam.bmo) {
    const area = (areaMm2: number): Quantity => ({ value: areaMm2, unit: 'mm²', origin: 'measured' });
    rows.push([
      L.openingArea,
      quantity(area(exam.bmo.areaMm2), 2),
      baseline?.bmo ? quantity(area(baseline.bmo.areaMm2), 2) : L.none,
      change ? quantity({ value: change.bmoAreaChangePct, unit: '%', origin: 'derived' }, 1, true) : L.none,
    ]);
  }
  return { caption: L.measures, columns: [L.measure, L.thisExam, L.beforeFlight, L.change], rows };
}

function thresholdsTable(eye: Eye, { record, locale, L, p }: Context): ReportTable | null {
  const { thresholds } = record.assessment.eyes[eye];
  if (thresholds.length === 0) return null;
  return {
    caption: L.thresholds,
    columns: [L.threshold, L.value, L.passed, L.probability],
    rows: thresholds.map((threshold) => [
      L.thresholdName[threshold.thresholdId],
      quantity(threshold.threshold, decimalsOf(threshold.threshold.value)),
      threshold.exceeded ? L.yes : L.no,
      p.likelihood(threshold.word, percentText(threshold.probabilityExceeded, threshold.word, locale)),
    ]),
  };
}

function evolutionTable(eye: Eye, { record, earlier, L }: Context): ReportTable | null {
  if (earlier.length === 0) return null;
  const row = (session: SessionRecord, isThisExam: boolean): ReportCell[] => {
    const assessed = session.assessment.eyes[eye];
    const exam = session.eyes[eye].accepted;
    const label = session.flightDay > 0 ? L.flightDay(session.flightDay) : L.beforeFlight;
    const isReference = session.flightDay <= 0;
    const change = assessed.change?.trtRingUm;
    return [
      isThisExam ? `${label} (${L.thisExamMark})` : label,
      isReference && assessed.measured
        ? L.reference
        : change
          ? quantity(change, decimalsFor(change.value, [TRT_FIRST_SIGN_UM, TRT_CLINICALLY_CONCERNING_UM], 0), true)
          : L.notMeasured,
      isReference && assessed.measured ? L.none : levelLabel(assessed.level, L),
      exam ? quantity({ value: exam.quality.meanQualityDb, unit: 'dB', origin: 'measured' }, 1) : L.none,
      String(session.eyes[eye].attempts.length),
    ];
  };
  return {
    caption: L.evolution,
    columns: [L.exam, L.thicknessChange, L.levelColumn, L.meanQuality, L.attempts],
    rows: [...earlier.map((session) => row(session, false)), row(record, true)],
  };
}

function eyeSection(eye: Eye, context: Context): ReportSection {
  const { record, explanation, L } = context;
  const explained = explanation.eyes[eye];
  const tables = [
    attemptsTable(eye, context),
    measuresTable(eye, context),
    thresholdsTable(eye, context),
    evolutionTable(eye, context),
  ].filter((table) => table !== null);
  return {
    id: eye === 'OD' ? 'eye-OD' : 'eye-OS',
    title: L.section[eye === 'OD' ? 'eye-OD' : 'eye-OS'],
    // The numbers of a measured eye are in the tables; an eye without a result says why in words.
    paragraphs: record.assessment.eyes[eye].measured ? [explained.headline] : [explained.headline, ...explained.lines],
    tables,
  };
}

function visionSection({ record, explanation, locale, L, p }: Context): ReportSection {
  const { vision } = record;
  const functional = record.assessment.functional;
  const paragraphs = explanation.findings
    .filter((finding) => FUNCTIONAL_FINDINGS.includes(finding.id))
    .map((finding) => finding.text);
  const tables: ReportTable[] = [];

  const acuityRows: ReportCell[][] = [];
  const amslerRows: ReportCell[][] = [];
  for (const eye of EYES) {
    const result = vision?.acuity[eye];
    if (result) {
      const compared = functional?.acuity[eye];
      const notes = [
        L.presentations(result.trials),
        result.withCorrection ? L.withCorrection : L.withoutCorrection,
        ...(result.atScreenFloor ? [L.limitedByScreen] : []),
      ];
      acuityRows.push([
        L.eye[eye],
        result.logMar !== null
          ? quantity({ value: result.logMar, unit: 'logMAR', origin: 'self-reported' }, 2)
          : L.didNotConverge,
        compared?.baselineLogMar ? quantity(compared.baselineLogMar, 2) : L.none,
        compared?.change ? quantity(compared.change, 2, true) : L.none,
        notes.join('; '),
      ]);
    }
    const grid = vision?.amsler[eye];
    if (grid) {
      amslerRows.push([
        L.eye[eye],
        quantity({ value: grid.markedFraction * 100, unit: '%', origin: 'self-reported' }, 1),
        grid.centralMarked ? L.yes : L.no,
        grid.cornersSeen ? L.yes : L.no,
      ]);
    }
  }
  if (acuityRows.length > 0) {
    tables.push({
      caption: L.nearVisionTest,
      columns: [L.eyeColumn, L.thisExam, L.beforeFlight, L.change, L.notes],
      rows: acuityRows,
    });
  } else {
    paragraphs.push(L.notDoneToday(L.functionalTest.acuity));
  }
  if (amslerRows.length > 0) {
    tables.push({
      caption: L.amslerGrid,
      columns: [L.eyeColumn, L.amslerMarkedPart, L.amslerCentre, L.amslerCorners],
      rows: amslerRows,
    });
  } else {
    paragraphs.push(L.notDoneToday(L.functionalTest.amsler));
  }

  if (vision?.symptoms) {
    const present = functional?.symptoms ?? [];
    if (present.length > 0) {
      tables.push({
        caption: L.symptoms,
        columns: [L.symptom, L.grade, L.eyeColumn],
        rows: present.map((symptom) => [
          capitalize(p.symptom(symptom.id)),
          symptom.severity ? L.gradeValue[symptom.severity] : L.none,
          symptom.eye === null ? L.none : symptom.eye === 'both' ? L.bothEyes : L.eye[symptom.eye],
        ]),
      });
    } else {
      paragraphs.push(L.noSymptoms);
    }
    paragraphs.push(`${L.glasses}: ${L.glassesValue[vision.symptoms.glasses].toLowerCase()}.`);
  } else {
    paragraphs.push(L.notDoneToday(L.functionalTest.symptoms));
  }
  return { id: 'vision', title: L.section.vision, paragraphs, tables };
}

function nextSteps({ explanation, L }: Context): ReportSection {
  return {
    id: 'next-steps',
    title: L.section['next-steps'],
    paragraphs: [],
    tables: [
      {
        caption: '',
        columns: [L.step, L.why, L.basis],
        rows: explanation.nextSteps.map((step) => [step.text, step.why, L.basisValue[step.basis]]),
      },
    ],
  };
}

function limitations({ explanation, L }: Context): ReportSection {
  return {
    id: 'limitations',
    title: L.section.limitations,
    paragraphs: explanation.limitations.map((limitation) => limitation.text),
    tables: [],
  };
}

function versions({ record, locale, L }: Context): ReportSection {
  const { assessment } = record;
  const engines: string[] = [];
  for (const eye of EYES) {
    const version = record.eyes[eye].accepted?.engineVersion;
    if (version && !engines.includes(version)) engines.push(version);
  }
  const errorModel = assessment.errorModelVersion ?? L.none;
  const rows: ReportCell[][] = Object.entries(THRESHOLDS).map(([key, definition]) => {
    const name = L.thresholdDefinition[key as keyof typeof THRESHOLDS];
    const sources = definition.sources.map((id) => RULE_SOURCES[id].citation).join('; ') || L.none;
    // NASA's thresholds are published reference values; this tool's own limits are not, and must not look like it.
    const value: ReportCell =
      definition.basis === 'nasa'
        ? quantity({ value: definition.value, unit: definition.unit, origin: 'reference', sources: definition.sources }, decimalsOf(definition.value))
        : definition.unit === ''
          ? `${formatNumber(definition.value * 100, 0, locale)}${NBSP}%`
          : `${formatNumber(definition.value, decimalsOf(definition.value), locale)}${NBSP}${definition.unit}`;
    return [name, value, L.whoseValue[definition.basis], sources];
  });
  return {
    id: 'versions',
    title: L.section.versions,
    paragraphs: [],
    tables: [
      keyValueTable(L, [
        [L.engine, engines.length > 0 ? engines.join(', ') : L.noEngine],
        [L.rules, assessment.rulesVersion],
        [
          L.errorModel,
          isProvisionalErrorModel(assessment.errorModelVersion) ? `${errorModel} (${L.provisional})` : errorModel,
        ],
      ]),
      { caption: L.thresholdsAndSources, columns: [L.threshold, L.value, L.whose, L.sources], rows },
    ],
  };
}

function questions({ record, L }: Context): ReportSection {
  const written = record.questions.map((question) => question.trim()).filter((question) => question.length > 0);
  return {
    id: 'questions',
    title: L.section.questions,
    paragraphs: written.length > 0 ? written : [L.noQuestions],
    tables: [],
  };
}

/**
 * Builds the report of one session. `history` holds the sessions of the crew
 * member; only those before this one are used, and the pre-flight one (flight
 * day 0) gives the reference values.
 */
export function buildReport(record: SessionRecord, history: readonly SessionRecord[], locale: Locale): Report {
  const earlier = history
    .filter((session) => session.crewId === record.crewId && session.flightDay < record.flightDay)
    .sort((a, b) => a.flightDay - b.flightDay);
  const L = REPORT_LABELS[locale];
  const context: Context = {
    record,
    earlier,
    preflight: earlier.find((session) => session.flightDay === 0) ?? null,
    explanation: explainAssessment(record.assessment, locale),
    locale,
    L,
    p: phrasesFor(locale),
  };
  return {
    locale,
    title: L.title(PRODUCT.name),
    simulatedDataNotice: PRODUCT.simulatedDataNotice[locale],
    purpose: L.purpose,
    sections: [
      identification(context),
      summary(context),
      eyeSection('OD', context),
      eyeSection('OS', context),
      visionSection(context),
      nextSteps(context),
      limitations(context),
      versions(context),
      questions(context),
    ],
  };
}
