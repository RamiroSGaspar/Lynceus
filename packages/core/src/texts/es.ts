/** Oraciones en español rioplatense, de vos. Estructura y reglas de redacción: `phrases.ts`. */
import type { Eye, LikelihoodWord, NotMeasuredReason, SymptomId } from '../contract';
import { capitalize, NBSP, type PercentText, type SignedText } from './format';
import type {
  AcuityWorse,
  AcuteCause,
  AmslerMarks,
  ChangeText,
  EyeSet,
  FunctionalTest,
  Phrases,
  PromptCause,
  ReportedSymptom,
  StepValues,
  ThicknessReference,
} from './phrases';

const UM = `${NBSP}µm`;
const LOGMAR = `${NBSP}logMAR`;

const EYE: Readonly<Record<Eye, string>> = { OD: 'ojo derecho', OS: 'ojo izquierdo' };

const WORD: Readonly<Record<LikelihoodWord, string>> = {
  unlikely: 'improbable',
  possible: 'posible',
  likely: 'probable',
  'very-likely': 'muy probable',
};

const SYMPTOM: Readonly<Record<SymptomId, string>> = {
  'near-vision': 'peor visión de cerca',
  'intermediate-vision': 'peor visión a distancia intermedia',
  'distance-vision': 'peor visión de lejos',
  distortion: 'visión distorsionada',
  'low-light-vision': 'peor visión con poca luz',
  'fluctuating-vision': 'visión que fluctúa',
  'depth-perception': 'dificultad para percibir la profundidad',
  'double-vision': 'visión doble',
  'transient-vision-loss': 'una pérdida pasajera de la visión',
  'sudden-vision-loss': 'una pérdida brusca de visión',
  'new-dark-spot': 'una mancha oscura nueva en tu visión',
  headache: 'dolor de cabeza',
  tinnitus: 'zumbido en los oídos',
  nausea: 'náuseas',
  'difficulty-thinking': 'dificultad para pensar',
};

const TEST: Readonly<Record<FunctionalTest, string>> = {
  symptoms: 'el cuestionario',
  acuity: 'la prueba de visión de cerca',
  amsler: 'la grilla de Amsler',
};

const NOT_MEASURED: Readonly<Record<NotMeasuredReason, string>> = {
  'low-signal': 'La señal de la tomografía fue demasiado débil.',
  'signal-dropout': 'Faltó una parte de la imagen, como pasa con un parpadeo.',
  truncated: 'La retina quedó cortada en el borde de arriba de la imagen.',
  'surface-not-found': 'No se pudo encontrar la superficie de la retina en la imagen.',
  'bmo-not-found': 'No se pudo encontrar el borde de la abertura del nervio óptico en la imagen.',
  motion: 'El ojo se movió durante la tomografía.',
  'too-few-usable-scans': 'Muy pocos cortes de la tomografía sirvieron para medir.',
  'bmo-fit-failed': 'No se pudo trazar de forma confiable el contorno de la abertura del nervio óptico.',
  'bmo-mismatch-with-baseline':
    'La abertura del nervio óptico que se encontró hoy no coincide con la de tu examen de antes del vuelo.',
  'insufficient-ring-coverage': 'Se pudo medir muy poco del anillo que rodea al nervio óptico.',
  decentered: 'La tomografía no quedó centrada en el nervio óptico.',
  'outside-error-model': 'La captura quedó fuera de las condiciones en las que se midió el error de este análisis, así que no se puede dar un número.',
  'not-captured': 'No se tomó una tomografía de este ojo.',
  'no-baseline': 'No hay un examen de antes del vuelo de este ojo para comparar.',
};

function yourEyes(eyes: EyeSet): string {
  return eyes === 'both' ? 'los dos ojos' : `tu ${EYE[eyes]}`;
}

function eyesNote(eyes: EyeSet | null): string {
  return eyes === null ? '' : ` (${eyes === 'both' ? 'los dos ojos' : EYE[eyes]})`;
}

function list(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

function days(count: number): string {
  return count === 1 ? '1 día' : `${count} días`;
}

function likelihood(word: LikelihoodWord, percent: PercentText): string {
  const number =
    percent.kind === 'below' ? `menos de ${percent.text}` : percent.kind === 'above' ? `más de ${percent.text}` : percent.text;
  return `${WORD[word]} (${number})`;
}

function thickness(change: ChangeText, reference: ThicknessReference): string {
  const than = {
    'before-flight': ' que antes del vuelo',
    'own-preflight-exam': ' que en tu propio examen de antes del vuelo',
    none: '',
  }[reference];
  const same = {
    'before-flight': 'igual que antes del vuelo',
    'own-preflight-exam': 'igual que en tu propio examen de antes del vuelo',
    none: 'igual',
  }[reference];
  const { value, range } = change;
  const main = value.sign === 0 ? same : `${value.abs}${UM} más ${value.sign > 0 ? 'gruesa' : 'fina'}${than}`;
  if (!range) return main;
  const [low, high] = range;
  const side = (bound: SignedText) => (bound.sign === 0 ? `0${UM}` : `${bound.abs}${UM} más ${bound.sign > 0 ? 'gruesa' : 'fina'}`);
  let rangeText: string;
  if (value.sign > 0 && low.sign >= 0) rangeText = `rango ${low.abs} a ${high.abs}`;
  else if (value.sign < 0 && high.sign <= 0) rangeText = `rango ${high.abs} a ${low.abs}`;
  else rangeText = `rango: de ${side(low)} a ${side(high)}`;
  return value.sign === 0 ? `${same} (0${UM}; ${rangeText})` : `${main} (${rangeText})`;
}

function signedRange(change: ChangeText): string {
  return change.range ? ` (rango ${change.range[0].signed} a ${change.range[1].signed})` : '';
}

function reported(symptoms: readonly ReportedSymptom[]): string {
  return list(symptoms.map((symptom) => `${SYMPTOM[symptom.id]}${eyesNote(symptom.eye)}`));
}

function amslerMarks(marks: readonly AmslerMarks[], brief = false): string {
  return list(
    marks.map((mark) => {
      const share = brief ? '' : `, ${mark.fraction} de la grilla`;
      return mark.where === 'centre'
        ? `marcas en el centro de tu visión (${EYE[mark.eye]}${share})`
        : mark.where === 'extensive'
          ? `marcas en el ${mark.fraction} de su superficie (${EYE[mark.eye]})`
          : `marcas fuera de su centro (${EYE[mark.eye]}${share})`;
    }),
  );
}

function acuityWorse(eyes: readonly AcuityWorse[], brief = false): string {
  return list(
    eyes.map((item) => `${EYE[item.eye]}, ${item.change.value.abs}${LOGMAR} peor${brief ? '' : signedRange(item.change)}`),
  );
}

function acuteCause(cause: AcuteCause): string {
  switch (cause.kind) {
    case 'symptom':
      return `informaste ${SYMPTOM[cause.id]}${eyesNote(cause.eye)}`;
    case 'amsler-central':
      return `la grilla de Amsler muestra marcas en el centro de tu visión (${EYE[cause.eye]})`;
    case 'amsler-extensive':
      return `la grilla de Amsler muestra marcas en el ${cause.fraction} de su superficie (${EYE[cause.eye]})`;
    case 'unspecified':
      return 'tus respuestas o tus pruebas de visión de hoy muestran un síntoma agudo de visión';
  }
}

function promptCause(cause: PromptCause): string {
  switch (cause.kind) {
    case 'concerning':
      return `El cambio en ${yourEyes(cause.eyes)} está en el nivel clínicamente preocupante de la NASA, en el que la NASA decide caso por caso qué hacer.`;
    case 'amsler':
      return `La grilla de Amsler muestra ${amslerMarks(cause.marks)}: para la NASA, cualquier línea ondulada, borrosa o faltante es un resultado positivo.`;
    case 'symptoms':
      return `Informaste ${reported(cause.symptoms)}.`;
    case 'activities-affected':
      return `Informaste ${reported(cause.symptoms)}, en un grado que afectó o impidió tus actividades.`;
    case 'headache-activities-affected':
      return 'Informaste un dolor de cabeza que afectó o impidió tus actividades.';
  }
}

const OWN_RULE_INTERVAL =
  'Este intervalo es una regla propia de esta herramienta, basada en el único caso publicado';

function step(id: Parameters<Phrases['step']>[0], v: StepValues): { text: string; why: string } {
  const when = `día de vuelo ${v.flightDay}`;
  const inDays = v.inDays === null ? '' : days(v.inDays);
  switch (id) {
    case 'contact-surgeon-now': {
      const causes = v.acuteCauses.map((cause) => `${capitalize(acuteCause(cause))}.`).join(' ');
      return {
        text: 'Contactá a tu médico de vuelo ahora.',
        why: `${causes} Un cambio brusco de la visión no puede esperar al informe de rutina, sin importar lo que muestre la tomografía. La regla de la NASA para este caso no es pública: tratarlo así es una regla propia de esta herramienta.`,
      };
    }
    case 'notify-surgeon-without-delay': {
      const causes =
        v.promptCauses.length > 0
          ? v.promptCauses.map(promptCause).join(' ')
          : 'El resultado de hoy incluye un hallazgo que no debería esperar al informe de rutina.';
      return {
        text: 'Avisale a tu médico de vuelo de este resultado sin esperar al informe de rutina.',
        why: `${causes} Avisar pronto en estos casos es una regla propia de esta herramienta: la de la NASA no es pública.`,
      };
    }
    case 'report-routine':
      return {
        text: 'Este resultado va en el informe de rutina para tu médico de vuelo.',
        why: 'Después de cada examen, la NASA le envía un informe resumen al médico de vuelo de la tripulación, que revisa todos los resultados.',
      };
    case 'oct-routine':
      return {
        text: `Próxima tomografía de los dos ojos: ${when}, tu próximo control de rutina${inDays ? ` (en ${inDays})` : ''}.`,
        why: `El calendario de rutina de la NASA para una misión de este largo tiene exámenes de ojos los días de vuelo ${list(v.routineDays.map(String))}.`,
      };
    case 'oct-in-4-weeks':
    case 'oct-in-3-weeks': {
      const firstSign = id === 'oct-in-4-weeks';
      const lead =
        v.sustainedFromFlightDay !== null
          ? firstSign
            ? `Tu control anterior (día de vuelo ${v.sustainedFromFlightDay}) mostró un primer indicio, así que esta herramienta mantiene el seguimiento cada 4 semanas un control más.`
            : `Tu control anterior (día de vuelo ${v.sustainedFromFlightDay}) estuvo en el nivel clínicamente preocupante, así que esta herramienta mantiene el seguimiento cada 3 semanas un control más.`
          : firstSign
            ? 'Después de un primer indicio, esta herramienta pide la próxima tomografía a las 4 semanas.'
            : 'En el nivel clínicamente preocupante, esta herramienta pide la próxima tomografía a las 3 semanas.';
      const joined =
        v.targetFlightDay !== null && v.targetFlightDay !== v.flightDay
          ? ` Eso sería el día de vuelo ${v.targetFlightDay}; el ${when} es un control de rutina del calendario de la NASA y cae cerca, así que una sola tomografía cubre los dos.`
          : '';
      const closing = firstSign
        ? `La NASA no publica cada cuánto repetir la tomografía después de un primer indicio. ${OWN_RULE_INTERVAL}.`
        : `La NASA no publica cada cuánto repetir la tomografía en este nivel. ${OWN_RULE_INTERVAL}, en el que la tomografía se repitió cada 3 a 6 semanas.`;
      return {
        text: `Repetí la tomografía de los dos ojos el ${when} (en ${inDays}).`,
        why: `${lead}${joined} ${closing}`,
      };
    }
    case 'oct-repeat-soon': {
      const subject =
        v.eyes === 'both' || v.eyes === null
          ? 'Hoy no se pudo medir ninguno de los dos ojos, así que no tienen resultado.'
          : `Hoy no se pudo medir ${yourEyes(v.eyes)}, así que no tiene resultado.`;
      const routine =
        v.inDays !== null && v.maxDays !== null && v.inDays < v.maxDays
          ? ` El ${when} es tu próximo control de rutina, que llega antes.`
          : '';
      return {
        text: `Repetí la tomografía de los dos ojos a más tardar el ${when} (dentro de ${inDays}).`,
        why: `${subject} Esperar como máximo ${days(v.maxDays ?? 0)} es una regla propia de esta herramienta.${routine}`,
      };
    }
    case 'amsler-at-controls':
      return {
        text: 'Hacé la grilla de Amsler en cada control, como hoy.',
        why: 'Los exámenes de ojos de la NASA incluyen la grilla de Amsler en cada sesión.',
      };
    case 'amsler-twice-a-week':
    case 'amsler-three-times-a-week': {
      const kept =
        v.sustainedFromFlightDay !== null
          ? ` Se mantiene un control más por el resultado de tu control anterior (día de vuelo ${v.sustainedFromFlightDay}).`
          : '';
      return {
        text: `Hacé la grilla de Amsler ${id === 'amsler-twice-a-week' ? 'dos' : 'tres'} veces por semana, un ojo por vez.`,
        why: `Entre una tomografía y la siguiente, la grilla puede mostrar una distorsión en el centro de tu visión. En el único caso publicado se usó varias veces por semana; esta frecuencia es una regla propia de esta herramienta.${kept}`,
      };
    }
    case 'try-stronger-glasses': {
      const causes: string[] = [];
      if (v.acuityWorse.length > 0) {
        causes.push(
          `Tu prueba de visión de cerca dio peor que antes del vuelo: ${acuityWorse(v.acuityWorse)}. Esta herramienta toma como cambio real ${v.acuityLimit} o más, unas dos líneas de una cartilla.`,
        );
        if (v.acuityWorse.some((item) => !item.sameCorrection)) {
          causes.push('Parte de la diferencia puede venir de los anteojos: las dos pruebas no se hicieron las dos con tu corrección de cerca, o las dos sin ella.');
        }
      }
      if (v.nearBlurReported) causes.push('Informaste que ves peor de cerca.');
      causes.push(
        'Ver peor de cerca es el cambio más común en los vuelos largos, y la NASA lleva para eso al menos tres pares de anteojos de graduación creciente por tripulante. Los anteojos corrigen lo borroso, no su causa, y un cambio de graduación no se puede medir a bordo: es algo para probar, no una medición.',
      );
      return { text: 'Para ver de cerca, probá el par de mayor graduación de tus anteojos de a bordo.', why: causes.join(' ') };
    }
    case 'post-flight-exams': {
      const reason =
        v.targetFlightDay !== null
          ? `La próxima tomografía caería el día de vuelo ${v.targetFlightDay}, después del final de la misión (día de vuelo ${v.missionDays}).`
          : 'No queda ningún control de rutina en el calendario de la NASA para esta misión.';
      return {
        text: 'No hay otra tomografía prevista en vuelo: tus próximos exámenes de ojos son después de volver.',
        why: `${reason} La NASA examina los ojos entre 1 y 3 días después de volver.`,
      };
    }
  }
}

export const ES: Phrases = {
  yourEyes,
  list,
  likelihood,
  thickness,
  symptom: (id) => SYMPTOM[id],

  headlineReference: (notMeasured) =>
    notMeasured.length === 0
      ? 'Este es tu examen de referencia de antes del vuelo: los exámenes siguientes se comparan con él.'
      : notMeasured.length === 2
        ? 'Este es tu examen de antes del vuelo, pero no se pudo medir ninguno de los dos ojos: todavía no hay referencia.'
        : `Este es tu examen de referencia de antes del vuelo: los exámenes siguientes se comparan con él; ${yourEyes(notMeasured[0]!)} no se pudo medir y no tiene referencia.`,
  headlineAcute: () =>
    'Tus respuestas o tus pruebas de visión de hoy muestran un síntoma agudo de visión: contactá a tu médico de vuelo ahora.',
  headlineLevel: (level, eyes, notMeasured) => {
    const main =
      level === 'clinically-concerning'
        ? `El cambio en ${yourEyes(eyes)} está en el nivel clínicamente preocupante de la NASA`
        : `El cambio en ${yourEyes(eyes)} está en el nivel de primer indicio de la NASA`;
    return notMeasured.length > 0 ? `${main}; ${yourEyes(notMeasured[0]!)} no se pudo medir hoy.` : `${main}.`;
  },
  headlineNoChange: (measured, notMeasured) =>
    notMeasured.length === 0
      ? 'Sin cambio detectable en ninguno de los dos ojos desde antes del vuelo.'
      : `Sin cambio detectable en ${yourEyes(measured[0]!)} desde antes del vuelo; ${yourEyes(notMeasured[0]!)} no se pudo medir hoy.`,
  headlineNothingMeasured: () =>
    'Hoy no se pudo medir ninguno de los dos ojos: este control no tiene resultado de la tomografía.',

  summaryAcute: (causes) =>
    `${capitalize(list(causes.map(acuteCause)))}: contactá a tu médico de vuelo ahora, sin importar lo que muestre la tomografía.`,
  summaryThickness: ({ eye, lead, change, relation, close, firstSign, concerning }) => {
    const opening = {
      'only-eye': `En tu ${EYE[eye]}, la`,
      'larger-increase': `El aumento mayor está en tu ${EYE[eye]}: la`,
      'no-increase': `Ninguno de los dos ojos muestra un aumento: en tu ${EYE[eye]}, la`,
    }[lead];
    const where =
      relation === 'at-or-above-concerning'
        ? `en el umbral clínicamente preocupante de la NASA, de ${concerning}, o por encima`
        : relation === 'above-first-sign'
          ? `por encima del umbral de primer indicio de la NASA, de ${firstSign}`
          : relation === 'at-first-sign'
            ? `justo en el umbral de primer indicio de la NASA, de ${firstSign}, que solo pasa un cambio mayor`
            : `por debajo del umbral de primer indicio de la NASA, de ${firstSign}${close ? ', pero cerca de él' : ''}`;
    return `${opening} retina junto al nervio óptico está ${thickness(change, 'own-preflight-exam')}, ${where}.`;
  },
  summaryNothingMeasured: () =>
    'Hoy no se pudo medir ninguna tomografía, así que este control no tiene resultado para la parte de atrás de tus ojos.',
  summaryFolds: (eyes) =>
    `La tomografía también indica pliegues nuevos en ${yourEyes(eyes)}; para la NASA, cualquier pliegue es un primer indicio.`,
  summaryFunctional: (findings, notDone) => {
    const skipped =
      notDone.length > 0
        ? `; ${notDone.length > 1 ? 'no se hicieron hoy' : 'no se hizo hoy'}: ${list(notDone.map((test) => TEST[test]))}`
        : '';
    return findings.length > 0
      ? `En tus pruebas de visión y tus respuestas de hoy: ${findings.join('; ')}${skipped}.`
      : `Tus pruebas de visión y tus respuestas de hoy no suman ningún hallazgo${skipped}.`;
  },
  summaryFunctionalNotDone: (scanMeasured) =>
    scanMeasured
      ? 'Hoy no se hicieron las pruebas de visión ni el cuestionario, así que este resultado se apoya solo en la tomografía.'
      : 'Hoy tampoco se hicieron las pruebas de visión ni el cuestionario.',
  summaryMeaning: (kind) =>
    kind === 'threshold'
      ? 'Pasar un umbral no es un diagnóstico: en la mayoría de los casos no da síntomas, y tu médico de vuelo, en Tierra, confirma el resultado y decide qué hacer.'
      : kind === 'first-reading'
        ? 'Esta es una primera lectura y no es un diagnóstico: tu médico de vuelo, en Tierra, la confirma y decide qué hacer.'
        : 'No se muestra ningún número de una tomografía que no se pudo medir, y tu médico de vuelo, en Tierra, se entera de que hay que repetirla.',
  summaryReference: () => [
    'Este examen registra cómo mide la parte de atrás de cada ojo antes del vuelo.',
    'Cada examen en vuelo se compara con estos valores tuyos, no con un promedio de otras personas.',
  ],

  eyeHeadline: (eye, state) => {
    const name = capitalize(EYE[eye]);
    switch (state) {
      case 'reference':
        return `${name}: referencia de antes del vuelo.`;
      case 'not-measured':
        return `Hoy no pude medir tu ${EYE[eye]}.`;
      case 'no-detectable-change':
        return `${name}: sin cambio detectable desde antes del vuelo.`;
      case 'first-sign':
        return `${name}: primer indicio de hinchazón del nervio óptico, según el umbral de la NASA.`;
      case 'first-sign-folds':
        return `${name}: primer indicio, por pliegues nuevos.`;
      case 'clinically-concerning':
        return `${name}: cambio clínicamente preocupante, según el umbral de la NASA.`;
    }
  },
  eyeReference: () => 'Esta es la referencia de este ojo: cada examen en vuelo se compara con ella.',
  eyeNotMeasuredReason: (reason) => NOT_MEASURED[reason],
  eyeNoResult: () => 'Hoy no hay resultado para este ojo: no se muestra un número que no se puede sostener.',
  eyeThickness: (eye, change) =>
    `La retina junto al nervio óptico de tu ${EYE[eye]} está ${thickness(change, 'before-flight')}.`,
  eyeRelation: (relation, firstSign, concerning) =>
    relation === 'at-or-above-concerning'
      ? `Eso está en el umbral clínicamente preocupante de la NASA, de ${concerning}, o por encima.`
      : relation === 'above-first-sign'
        ? `Eso está por encima del umbral de primer indicio de la NASA, de ${firstSign}, y por debajo de su umbral clínicamente preocupante, de ${concerning}.`
        : relation === 'at-first-sign'
          ? `Eso es justo el umbral de primer indicio de la NASA, de ${firstSign}, que solo pasa un cambio mayor.`
          : `Eso está por debajo del umbral de primer indicio de la NASA, de ${firstSign}: dentro de la variación normal entre dos exámenes.`,
  eyeProbability: (threshold, chance, close) => {
    const claim =
      threshold === 'first-sign'
        ? `Es ${chance} que el cambio real esté por encima del umbral de primer indicio`
        : `Es ${chance} que el cambio real esté en el umbral clínicamente preocupante o por encima`;
    return close ? `${claim}: el resultado quedó cerca del umbral, y tu próximo control va a mostrar si se mantiene.` : `${claim}.`;
  },
  eyeFolds: (isNew, change, limit) =>
    isNew
      ? `La tomografía indica pliegues nuevos: la ondulación de la membrana que está debajo de la retina aumentó ${change.value.abs}${UM} desde antes del vuelo${signedRange(change)}, por encima del límite de ${limit}.`
      : `Sin pliegues nuevos: la ondulación de la membrana que está debajo de la retina cambió ${change.value.signed}${UM} desde antes del vuelo${signedRange(change)}; el límite es ${limit}.`,
  eyeFoldsProbability: (chance, isNew) =>
    isNew
      ? `Es ${chance} que el cambio real esté por encima de ese límite; para la NASA, cualquier pliegue es un primer indicio.`
      : `Es ${chance} que el cambio real esté por encima de ese límite.`,
  eyeSincePrevious: (flightDay, change) =>
    `Desde tu control anterior (día de vuelo ${flightDay}), está ${thickness(change, 'none')}.`,

  step,

  limitation: (id, provisionalErrorModel) => {
    switch (id) {
      case 'not-a-diagnosis':
        return 'Esto no es un diagnóstico: es una primera lectura de una medición frente a los umbrales publicados por la NASA.';
      case 'simulated-data':
        return 'Los exámenes de esta demostración son simulados; el análisis que los mide es real.';
      case 'not-validated-on-people':
        return provisionalErrorModel
          ? 'Esta herramienta no está validada con personas. Sus rangos y probabilidades salen de un modelo de error provisorio, que todavía no se midió.'
          : 'Esta herramienta no está validada con personas. Sus rangos y probabilidades salen de su error medido sobre ojos simulados, dibujados con el mismo modelo de la retina que espera el análisis; en exámenes reales el error es mayor y no se conoce.';
      case 'ground-confirms':
        return 'Tu médico de vuelo, en Tierra, confirma cada resultado y tiene la última palabra.';
      case 'no-intracranial-pressure':
        return 'La presión dentro del cráneo no se puede medir a bordo.';
      case 'no-choroid':
        return 'No mide la coroides, la capa de vasos sanguíneos que está debajo de la retina.';
      case 'no-macula':
        return 'No mira la mácula, el centro de la retina: la tomografía cubre solo la zona que rodea al nervio óptico.';
      case 'no-globe-flattening':
        return 'No mide el aplanamiento de la parte de atrás del ojo.';
      case 'no-refraction':
        return 'No mide un cambio en la graduación de tus anteojos: no hay una forma confiable de hacerlo a bordo.';
    }
  },

  finding: (finding, brief) => {
    switch (finding.id) {
      case 'swelling-clinically-concerning':
        return `el cambio en ${yourEyes(finding.eyes)} está en el nivel clínicamente preocupante de la NASA`;
      case 'swelling-first-sign':
        return `el cambio en ${yourEyes(finding.eyes)} está en el nivel de primer indicio de la NASA`;
      case 'folds-new':
        return `la tomografía indica pliegues nuevos en ${yourEyes(finding.eyes)}`;
      case 'eye-not-measured':
        return finding.eyes === 'both' ? 'no se pudo medir ninguno de los dos ojos' : `${yourEyes(finding.eyes)} no se pudo medir`;
      case 'symptom-acute':
        return finding.symptoms.length > 0 ? `informaste ${reported(finding.symptoms)}` : 'informaste un síntoma agudo de visión';
      case 'amsler-marked-central':
      case 'amsler-marked':
        return finding.marks.length > 0 ? `la grilla de Amsler muestra ${amslerMarks(finding.marks, brief)}` : 'la grilla de Amsler muestra marcas';
      case 'symptom-other':
        return finding.symptoms.length > 0 ? `informaste ${reported(finding.symptoms)}` : 'informaste un cambio en la visión';
      case 'near-vision-worse':
        return finding.eyes.length === 0
          ? 'tu prueba de visión de cerca dio peor que antes del vuelo'
          : brief
            ? `tu prueba de visión de cerca dio peor que antes del vuelo (${acuityWorse(finding.eyes, true)})`
            : `tu prueba de visión de cerca dio peor que antes del vuelo: ${acuityWorse(finding.eyes)}`;
      case 'symptom-near-blur':
        return 'informaste que ves peor de cerca';
      case 'symptom-headache':
        return brief ? 'informaste dolor de cabeza' : 'informaste dolor de cabeza, que se registra sin relacionarlo con los hallazgos del ojo';
    }
  },
};
