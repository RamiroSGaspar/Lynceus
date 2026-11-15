/**
 * Fixed words of the report, in both languages. The sentences about the result
 * itself come from the texts module, so the report and the result screen always
 * say the same thing.
 */
import type {
  ContactUrgency,
  Eye,
  Level,
  Origin,
  SymptomAnswers,
  SymptomSeverity,
  ThresholdAssessment,
} from '../contract';
import type { Locale } from '../product';
import type { ReportSectionId } from './types';

export interface ReportLabels {
  title(productName: string): string;
  purpose: string;
  section: Record<ReportSectionId, string>;
  level: Record<Level, string>;
  notMeasured: string;
  reference: string;
  none: string;
  yes: string;
  no: string;
  eye: Record<Eye, string>;
  bothEyes: string;
  origin: Record<Origin, string>;
  range(low: string, high: string): string;
  item: string;
  value: string;

  // Identification
  crewMember: string;
  identifier: string;
  mission: string;
  missionValue(name: string, days: number, launchDate: string): string;
  exam: string;
  preflightExam: string;
  flightDayExam(flightDay: number, date: string, routine: boolean): string;
  session: string;
  sessionOrigin: Record<'live' | 'precomputed', string>;
  data: string;

  // Summary
  sessionLevel: string;
  contact: string;
  contactValue: Record<ContactUrgency, string>;
  nextScan: string;
  nextScanValue(flightDay: number): string;
  noNextScan: string;
  amslerGrid: string;
  amslerAtExams: string;
  amslerPerWeek(times: number): string;

  // Eyes
  attempts: string;
  attempt: string;
  result: string;
  measured: string;
  rejected: string;
  usableScans: string;
  usableOf(usable: number, total: number): string;
  meanQuality: string;
  whyRejected: string;
  measures: string;
  measure: string;
  thisExam: string;
  beforeFlight: string;
  change: string;
  mainRing: string;
  ring(innerUm: number, outerUm: number): string;
  rimWidth: string;
  waviness: string;
  openingArea: string;
  thresholds: string;
  threshold: string;
  thresholdName: Record<ThresholdAssessment['thresholdId'], string>;
  passed: string;
  probability: string;
  evolution: string;
  thicknessChange: string;
  levelColumn: string;
  flightDay(flightDay: number): string;
  thisExamMark: string;

  // Vision tests and symptoms
  nearVisionTest: string;
  eyeColumn: string;
  notes: string;
  notDoneToday(test: string): string;
  didNotConverge: string;
  limitedByScreen: string;
  withCorrection: string;
  withoutCorrection: string;
  presentations(count: number): string;
  amslerMarkedPart: string;
  amslerCentre: string;
  amslerCorners: string;
  symptoms: string;
  symptom: string;
  grade: string;
  gradeValue: Record<SymptomSeverity, string>;
  noSymptoms: string;
  glasses: string;
  glassesValue: Record<SymptomAnswers['glasses'], string>;
  functionalTest: Record<'symptoms' | 'acuity' | 'amsler', string>;

  // Steps, versions, questions
  step: string;
  why: string;
  basis: string;
  basisValue: Record<'nasa' | 'assumption', string>;
  engine: string;
  noEngine: string;
  rules: string;
  errorModel: string;
  provisional: string;
  simulatedModel: string;
  thresholdsAndSources: string;
  whose: string;
  whoseValue: Record<'nasa' | 'assumption', string>;
  sources: string;
  thresholdDefinition: Record<
    'TRT_FIRST_SIGN_UM' | 'TRT_CLINICALLY_CONCERNING_UM' | 'BM_ROUGHNESS_FOLDS_UM' | 'ACUITY_REAL_CHANGE_LOGMAR' | 'AMSLER_EXTENSIVE_FRACTION',
    string
  >;
  noQuestions: string;
}

const EN: ReportLabels = {
  title: (productName) => `${productName}: report for the medical conference`,
  purpose: 'A summary for your conversation with your flight surgeon, who confirms the result and decides.',
  section: {
    identification: 'Identification',
    summary: 'Summary of this exam',
    'eye-OD': 'Right eye',
    'eye-OS': 'Left eye',
    vision: 'Vision tests and symptoms',
    'next-steps': 'Next steps',
    limitations: 'What this tool does not tell you',
    versions: 'Versions and sources',
    questions: 'My questions for the flight surgeon',
  },
  level: {
    'no-detectable-change': 'No detectable change',
    'first-sign': 'First sign',
    'clinically-concerning': 'Clinically concerning',
    'acute-visual-symptom': 'Acute visual symptom',
  },
  notMeasured: 'Could not be measured',
  reference: 'Reference',
  none: '—',
  yes: 'Yes',
  no: 'No',
  eye: { OD: 'Right eye', OS: 'Left eye' },
  bothEyes: 'Both eyes',
  origin: {
    measured: 'measured',
    derived: 'calculated',
    estimated: 'estimated',
    'self-reported': 'reported by you',
    reference: 'reference',
    'not-measurable': 'cannot be measured on board',
  },
  range: (low, high) => `${low} to ${high}`,
  item: 'Item',
  value: 'Value',

  crewMember: 'Crew member',
  identifier: 'Identifier',
  mission: 'Mission',
  missionValue: (name, days, launchDate) => `${name}, ${days} days, launched on ${launchDate}`,
  exam: 'Exam',
  preflightExam: 'Before the flight (reference exam)',
  flightDayExam: (flightDay, date, routine) => `Flight day ${flightDay} (${date}), ${routine ? 'routine exam' : 'additional exam'}`,
  session: 'Session',
  sessionOrigin: { live: 'Done in this application', precomputed: 'Supplied with the application (simulated history)' },
  data: 'Data',

  sessionLevel: 'Level of this exam',
  contact: 'Contact with the flight surgeon',
  contactValue: {
    'routine-report': 'In the routine report',
    'without-delay': 'Without waiting for the routine report',
    now: 'Now',
  },
  nextScan: 'Next scan',
  nextScanValue: (flightDay) => `Flight day ${flightDay}`,
  noNextScan: 'None planned in flight',
  amslerGrid: 'Amsler grid',
  amslerAtExams: 'At each exam',
  amslerPerWeek: (times) => `${times} times a week`,

  attempts: 'Capture attempts',
  attempt: 'Attempt',
  result: 'Result',
  measured: 'Measured',
  rejected: 'Rejected',
  usableScans: 'Usable scan lines',
  usableOf: (usable, total) => `${usable} of ${total}`,
  meanQuality: 'Mean quality',
  whyRejected: 'Why it was rejected',
  measures: 'Measures',
  measure: 'Measure',
  thisExam: 'This exam',
  beforeFlight: 'Before the flight',
  change: 'Change (95 % range)',
  mainRing: 'Retinal thickness, ring from the optic nerve opening to 250 µm (main measure)',
  ring: (innerUm, outerUm) => `Retinal thickness, ring from ${innerUm} to ${outerUm} µm`,
  rimWidth: 'Minimum rim width',
  waviness: 'Waviness of the membrane under the retina (folds)',
  openingArea: 'Area of the optic nerve opening (check of the alignment between exams)',
  thresholds: 'Thresholds',
  threshold: 'Threshold',
  thresholdName: {
    'trt-first-sign': 'First sign: thickness increase larger than',
    'trt-clinically-concerning': 'Clinically concerning: thickness increase of at least',
    'folds-new': 'New folds: waviness increase larger than',
  },
  passed: 'Passed by the measured value',
  probability: 'Probability that the real change is beyond it',
  evolution: 'Evolution',
  thicknessChange: 'Thickness change (95 % range)',
  levelColumn: 'Level',
  flightDay: (flightDay) => `Flight day ${flightDay}`,
  thisExamMark: 'this exam',

  nearVisionTest: 'Near vision test',
  eyeColumn: 'Eye',
  notes: 'Notes',
  notDoneToday: (test) => `Not done in this exam: ${test}.`,
  didNotConverge: 'The test did not reach a result',
  limitedByScreen: 'limited by the screen, not by the eye',
  withCorrection: 'with near correction',
  withoutCorrection: 'without near correction',
  presentations: (count) => `${count} presentations`,
  amslerMarkedPart: 'Marked part of the grid',
  amslerCentre: 'Marks in the central 2 degrees',
  amslerCorners: 'Saw the four corners',
  symptoms: 'Symptoms reported',
  symptom: 'Symptom',
  grade: 'Grade',
  gradeValue: {
    mild: 'Mild: did not affect activities',
    moderate: 'Moderate: had to adapt, completed everything',
    severe: 'Affected or prevented activities',
  },
  noSymptoms: 'No symptom was reported in the questionnaire.',
  glasses: 'Near glasses in use',
  glassesValue: { none: 'None', reading: 'Reading', bifocal: 'Bifocal', progressive: 'Progressive', adjustable: 'Adjustable' },
  functionalTest: { symptoms: 'the questionnaire', acuity: 'the near vision test', amsler: 'the Amsler grid' },

  step: 'Step',
  why: 'Why',
  basis: 'Basis',
  basisValue: { nasa: 'NASA practice', assumption: 'This tool’s own rule' },
  engine: 'Analysis engine',
  noEngine: 'No exam was measured',
  rules: 'Rules',
  errorModel: 'Error model',
  provisional: 'provisional: not measured yet',
  simulatedModel: 'measured on simulated exams only, not on people',
  thresholdsAndSources: 'Thresholds and their sources',
  whose: 'Set by',
  whoseValue: { nasa: 'NASA', assumption: 'This tool (an assumption)' },
  sources: 'Sources',
  thresholdDefinition: {
    TRT_FIRST_SIGN_UM: 'First sign: thickness increase larger than',
    TRT_CLINICALLY_CONCERNING_UM: 'Clinically concerning: thickness increase of at least',
    BM_ROUGHNESS_FOLDS_UM: 'New folds: waviness increase larger than',
    ACUITY_REAL_CHANGE_LOGMAR: 'Near vision: worsening taken as real, at least',
    AMSLER_EXTENSIVE_FRACTION: 'Amsler grid: marked part that counts as an acute symptom, at least',
  },
  noQuestions: 'No questions written yet.',
};

const ES: ReportLabels = {
  title: (productName) => `${productName}: informe para la conferencia médica`,
  purpose: 'Un resumen para tu conversación con tu médico de vuelo, que confirma el resultado y decide.',
  section: {
    identification: 'Identificación',
    summary: 'Resumen de este control',
    'eye-OD': 'Ojo derecho',
    'eye-OS': 'Ojo izquierdo',
    vision: 'Pruebas de visión y síntomas',
    'next-steps': 'Próximos pasos',
    limitations: 'Lo que esta herramienta no te dice',
    versions: 'Versiones y fuentes',
    questions: 'Mis preguntas para el médico de vuelo',
  },
  level: {
    'no-detectable-change': 'Sin cambio detectable',
    'first-sign': 'Primer indicio',
    'clinically-concerning': 'Clínicamente preocupante',
    'acute-visual-symptom': 'Síntoma agudo de visión',
  },
  notMeasured: 'No se pudo medir',
  reference: 'Referencia',
  none: '—',
  yes: 'Sí',
  no: 'No',
  eye: { OD: 'Ojo derecho', OS: 'Ojo izquierdo' },
  bothEyes: 'Los dos ojos',
  origin: {
    measured: 'medido',
    derived: 'calculado',
    estimated: 'estimado',
    'self-reported': 'informado por vos',
    reference: 'referencia',
    'not-measurable': 'no se puede medir a bordo',
  },
  range: (low, high) => `${low} a ${high}`,
  item: 'Dato',
  value: 'Valor',

  crewMember: 'Tripulante',
  identifier: 'Identificador',
  mission: 'Misión',
  missionValue: (name, days, launchDate) => `${name}, ${days} días, lanzamiento el ${launchDate}`,
  exam: 'Control',
  preflightExam: 'Antes del vuelo (examen de referencia)',
  flightDayExam: (flightDay, date, routine) => `Día de vuelo ${flightDay} (${date}), ${routine ? 'control de rutina' : 'control adicional'}`,
  session: 'Sesión',
  sessionOrigin: { live: 'Hecha en esta aplicación', precomputed: 'Viene con la aplicación (historia simulada)' },
  data: 'Datos',

  sessionLevel: 'Nivel de este control',
  contact: 'Contacto con el médico de vuelo',
  contactValue: {
    'routine-report': 'En el informe de rutina',
    'without-delay': 'Sin esperar al informe de rutina',
    now: 'Ahora',
  },
  nextScan: 'Próxima tomografía',
  nextScanValue: (flightDay) => `Día de vuelo ${flightDay}`,
  noNextScan: 'Ninguna prevista en vuelo',
  amslerGrid: 'Grilla de Amsler',
  amslerAtExams: 'En cada control',
  amslerPerWeek: (times) => `${times} veces por semana`,

  attempts: 'Intentos de captura',
  attempt: 'Intento',
  result: 'Resultado',
  measured: 'Medido',
  rejected: 'Rechazado',
  usableScans: 'Cortes usables',
  usableOf: (usable, total) => `${usable} de ${total}`,
  meanQuality: 'Calidad media',
  whyRejected: 'Motivo del rechazo',
  measures: 'Medidas',
  measure: 'Medida',
  thisExam: 'Este control',
  beforeFlight: 'Antes del vuelo',
  change: 'Cambio (rango de 95 %)',
  mainRing: 'Grosor de la retina, anillo de la abertura del nervio óptico hasta 250 µm (medida principal)',
  ring: (innerUm, outerUm) => `Grosor de la retina, anillo de ${innerUm} a ${outerUm} µm`,
  rimWidth: 'Ancho mínimo del anillo neural',
  waviness: 'Ondulación de la membrana que está debajo de la retina (pliegues)',
  openingArea: 'Área de la abertura del nervio óptico (control de la alineación entre exámenes)',
  thresholds: 'Umbrales',
  threshold: 'Umbral',
  thresholdName: {
    'trt-first-sign': 'Primer indicio: aumento del grosor mayor a',
    'trt-clinically-concerning': 'Clínicamente preocupante: aumento del grosor de al menos',
    'folds-new': 'Pliegues nuevos: aumento de la ondulación mayor a',
  },
  passed: 'Lo pasa el valor medido',
  probability: 'Probabilidad de que el cambio real lo supere',
  evolution: 'Evolución',
  thicknessChange: 'Cambio del grosor (rango de 95 %)',
  levelColumn: 'Nivel',
  flightDay: (flightDay) => `Día de vuelo ${flightDay}`,
  thisExamMark: 'este control',

  nearVisionTest: 'Prueba de visión de cerca',
  eyeColumn: 'Ojo',
  notes: 'Notas',
  notDoneToday: (test) => `No se hizo en este control: ${test}.`,
  didNotConverge: 'La prueba no llegó a un resultado',
  limitedByScreen: 'limitado por la pantalla, no por el ojo',
  withCorrection: 'con corrección de cerca',
  withoutCorrection: 'sin corrección de cerca',
  presentations: (count) => `${count} presentaciones`,
  amslerMarkedPart: 'Parte marcada de la grilla',
  amslerCentre: 'Marcas en los 2 grados centrales',
  amslerCorners: 'Vio las cuatro esquinas',
  symptoms: 'Síntomas informados',
  symptom: 'Síntoma',
  grade: 'Grado',
  gradeValue: {
    mild: 'Leve: no afectó las actividades',
    moderate: 'Moderado: hubo que adaptarse, se completó todo',
    severe: 'Afectó o impidió actividades',
  },
  noSymptoms: 'No se informó ningún síntoma en el cuestionario.',
  glasses: 'Anteojos de cerca en uso',
  glassesValue: { none: 'Ninguno', reading: 'De lectura', bifocal: 'Bifocales', progressive: 'Progresivos', adjustable: 'Ajustables' },
  functionalTest: { symptoms: 'el cuestionario', acuity: 'la prueba de visión de cerca', amsler: 'la grilla de Amsler' },

  step: 'Paso',
  why: 'Por qué',
  basis: 'Base',
  basisValue: { nasa: 'Práctica de la NASA', assumption: 'Regla propia de esta herramienta' },
  engine: 'Motor de análisis',
  noEngine: 'No se midió ningún examen',
  rules: 'Reglas',
  errorModel: 'Modelo de error',
  provisional: 'provisorio: todavía no se midió',
  simulatedModel: 'medido solo sobre exámenes simulados, no con personas',
  thresholdsAndSources: 'Umbrales y sus fuentes',
  whose: 'Lo define',
  whoseValue: { nasa: 'NASA', assumption: 'Esta herramienta (un supuesto)' },
  sources: 'Fuentes',
  thresholdDefinition: {
    TRT_FIRST_SIGN_UM: 'Primer indicio: aumento del grosor mayor a',
    TRT_CLINICALLY_CONCERNING_UM: 'Clínicamente preocupante: aumento del grosor de al menos',
    BM_ROUGHNESS_FOLDS_UM: 'Pliegues nuevos: aumento de la ondulación mayor a',
    ACUITY_REAL_CHANGE_LOGMAR: 'Visión de cerca: empeoramiento que se toma como real, al menos',
    AMSLER_EXTENSIVE_FRACTION: 'Grilla de Amsler: parte marcada que cuenta como síntoma agudo, al menos',
  },
  noQuestions: 'Todavía no hay preguntas anotadas.',
};

export const REPORT_LABELS: Readonly<Record<Locale, ReportLabels>> = { en: EN, es: ES };
