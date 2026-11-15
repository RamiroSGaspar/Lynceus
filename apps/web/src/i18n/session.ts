import { defineMessages } from './index';

/** The guided session: its frame, its presentation, its evaluation and the provisional capture step. */
export const sessionMessages = defineMessages(
  {
    'context': 'Today’s control',
    'steps.label': 'Steps of today’s control',
    'steps.position': 'Step {step} of {total}: {name}',
    'step.intro': 'Presentation',
    'step.symptoms': 'Symptoms',
    'step.acuity': 'Near vision',
    'step.amsler': 'Amsler grid',
    'step.oct-od': 'Right eye scan',
    'step.oct-os': 'Left eye scan',
    'step.evaluation': 'Evaluation',
    'status.done': 'done',
    'status.skipped': 'not done',
    'status.current': 'current step',
    'status.upcoming': 'pending',
    'nav.label': 'Moving through the control',
    'nav.previous': 'Previous step',
    'nav.leave': 'Leave: what you did is saved',
    'nav.restart': 'Start this control over',
    'nav.restart.confirm': 'This discards what you did in this control so far.',
    'nav.restart.yes': 'Start over',
    'nav.restart.no': 'Keep going',

    'intro.title': 'Today’s control: {name}, flight day {day}',
    'intro.what': 'What you will do',
    'intro.what.lead':
      'Seven steps, in the order of NASA’s in-flight eye series: first how you see, then the image of each eye.',
    'intro.item.symptoms': 'Symptoms questionnaire: what you have noticed since the last exam.',
    'intro.item.acuity': 'Near visual acuity, one eye at a time, at 40 cm from the screen.',
    'intro.item.amsler': 'Amsler grid, one eye at a time.',
    'intro.item.oct': 'A tomography of each eye, measured right away.',
    'intro.item.result': 'The evaluation, and your result.',
    'intro.time': 'How long it takes',
    'intro.time.text':
      'About {minutes} minutes in total. The times are estimates of this tool. The result appears as soon as the second tomography is measured.',
    'intro.skip':
      'You can skip any of the three vision tests. A skipped test is recorded as not done, and the result says so.',
    'intro.reference': 'What it is compared with',
    'intro.reference.text':
      'With your own pre-flight exam, taken on {date}. The reference is your own eye before the flight, not an average of other people.',
    'intro.reference.missing':
      'Your pre-flight exam is missing, so today’s tomography cannot be compared. The control cannot start.',
    'intro.limits':
      'This is a first read on board, not a diagnosis. The flight surgeon on the ground confirms it and decides.',
    'intro.begin': 'Start',

    'already.title': 'You already did today’s control',
    'already.text': '{name}, flight day {day}: the control is saved in this browser.',
    'already.result': 'See the result',
    'already.repeat': 'Repeat the control',
    'already.repeat.note': 'Repeating it replaces the saved control when you finish the new one.',

    'redo.title.done': 'You already did this step',
    'redo.title.skipped': 'You skipped this step',
    'redo.text.done': 'What you did is kept. You can continue with it or do the step again.',
    'redo.text.skipped': 'It is recorded as not done. You can continue or do it now.',
    'redo.continue': 'Continue',
    'redo.again': 'Do this step again',
    'redo.now': 'Do this step now',
    'missing.title': 'Tomography of the {eye}',
    'missing.text':
      'The pre-flight exam of this eye is missing, so a tomography taken today could not be compared with anything. The eye is recorded as not measured.',
    'missing.continue': 'Continue without this eye',

    'evaluation.title': 'Evaluating your control',
    'evaluation.text':
      'Comparing each eye with your pre-flight exam, working out how sure the result is, and applying NASA’s thresholds.',
    'evaluation.done': 'The evaluation is ready.',
    'evaluation.open': 'See the result',
    'evaluation.error.title': 'The control could not be evaluated',
    'evaluation.error.what': 'What happened: the evaluation stopped with the error “{message}”.',
    'evaluation.error.cause':
      'Likely cause: a step of this control did not hand over what the evaluation needs.',
    'evaluation.error.do':
      'What you can do: try again. If it fails again, go back to the previous step and repeat it. What you did is still saved.',
    'evaluation.retry': 'Try again',

    'oct.title': 'Tomography of the {eye}',
    'oct.what':
      'The capture goes here: the instrument takes the tomography, the analysis measures it against your pre-flight exam, and a capture that is not good enough is repeated, up to three times. This step is being built separately.',
    'oct.examples': 'Until it is plugged in, choose an example result to continue. These numbers are chosen by hand: nothing is measured.',
    'oct.baseline': 'Pre-flight thickness of this eye next to the optic nerve:',
    'oct.example.none': 'Example: measured, about {value} µm of change',
    'oct.example.retry': 'Example: measured on the second attempt',
    'oct.example.unmeasured': 'Example: could not be measured after three attempts',
  },
  {
    'context': 'El control de hoy',
    'steps.label': 'Pasos del control de hoy',
    'steps.position': 'Paso {step} de {total}: {name}',
    'step.intro': 'Presentación',
    'step.symptoms': 'Síntomas',
    'step.acuity': 'Visión de cerca',
    'step.amsler': 'Grilla de Amsler',
    'step.oct-od': 'Tomografía del ojo derecho',
    'step.oct-os': 'Tomografía del ojo izquierdo',
    'step.evaluation': 'Evaluación',
    'status.done': 'hecho',
    'status.skipped': 'no hecho',
    'status.current': 'paso actual',
    'status.upcoming': 'pendiente',
    'nav.label': 'Moverse por el control',
    'nav.previous': 'Paso anterior',
    'nav.leave': 'Salir: lo que hiciste queda guardado',
    'nav.restart': 'Empezar este control de nuevo',
    'nav.restart.confirm': 'Esto descarta lo que hiciste hasta ahora en este control.',
    'nav.restart.yes': 'Empezar de nuevo',
    'nav.restart.no': 'Seguir',

    'intro.title': 'El control de hoy: {name}, día de vuelo {day}',
    'intro.what': 'Qué vas a hacer',
    'intro.what.lead':
      'Siete pasos, en el orden de la serie de ojos de la NASA en vuelo: primero cómo ves, después la imagen de cada ojo.',
    'intro.item.symptoms': 'Cuestionario de síntomas: qué notaste desde el último examen.',
    'intro.item.acuity': 'Agudeza visual de cerca, un ojo por vez, a 40 cm de la pantalla.',
    'intro.item.amsler': 'Grilla de Amsler, un ojo por vez.',
    'intro.item.oct': 'Una tomografía de cada ojo, que se mide en el momento.',
    'intro.item.result': 'La evaluación y tu resultado.',
    'intro.time': 'Cuánto lleva',
    'intro.time.text':
      'Unos {minutes} minutos en total. Los tiempos son una estimación de esta herramienta. El resultado aparece apenas se mide la segunda tomografía.',
    'intro.skip':
      'Podés saltear cualquiera de las tres pruebas de visión. Una prueba salteada queda registrada como no hecha, y el resultado lo dice.',
    'intro.reference': 'Contra qué se compara',
    'intro.reference.text':
      'Contra tu propio examen de antes del vuelo, tomado el {date}. La referencia es tu propio ojo antes del vuelo, no un promedio de otras personas.',
    'intro.reference.missing':
      'Falta tu examen de antes del vuelo, así que la tomografía de hoy no se puede comparar. El control no puede empezar.',
    'intro.limits':
      'Esto es una primera lectura a bordo, no un diagnóstico. El médico de vuelo en Tierra la confirma y decide.',
    'intro.begin': 'Empezar',

    'already.title': 'Ya hiciste el control de hoy',
    'already.text': '{name}, día de vuelo {day}: el control está guardado en este navegador.',
    'already.result': 'Ver el resultado',
    'already.repeat': 'Repetir el control',
    'already.repeat.note': 'Al repetirlo, el nuevo reemplaza al guardado cuando lo termines.',

    'redo.title.done': 'Ya hiciste este paso',
    'redo.title.skipped': 'Salteaste este paso',
    'redo.text.done': 'Lo que hiciste se conserva. Podés seguir con eso o hacer el paso de nuevo.',
    'redo.text.skipped': 'Quedó registrado como no hecho. Podés seguir o hacerlo ahora.',
    'redo.continue': 'Continuar',
    'redo.again': 'Hacer este paso de nuevo',
    'redo.now': 'Hacer este paso ahora',
    'missing.title': 'Tomografía del {eye}',
    'missing.text':
      'Falta el examen de antes del vuelo de este ojo, así que una tomografía de hoy no se podría comparar con nada. El ojo queda registrado como no medido.',
    'missing.continue': 'Continuar sin este ojo',

    'evaluation.title': 'Evaluando tu control',
    'evaluation.text':
      'Se compara cada ojo con tu examen de antes del vuelo, se calcula qué tan seguro es el resultado y se aplican los umbrales de la NASA.',
    'evaluation.done': 'La evaluación está lista.',
    'evaluation.open': 'Ver el resultado',
    'evaluation.error.title': 'No se pudo evaluar el control',
    'evaluation.error.what': 'Qué pasó: la evaluación se detuvo con el error “{message}”.',
    'evaluation.error.cause':
      'Causa probable: un paso de este control no entregó lo que la evaluación necesita.',
    'evaluation.error.do':
      'Qué podés hacer: probar de nuevo. Si vuelve a fallar, volvé al paso anterior y repetilo. Lo que hiciste sigue guardado.',
    'evaluation.retry': 'Probar de nuevo',

    'oct.title': 'Tomografía del {eye}',
    'oct.what':
      'Acá va la captura: el instrumento toma la tomografía, el análisis la mide contra tu examen de antes del vuelo, y una captura que no alcanza se repite, hasta tres veces. Este paso se está construyendo aparte.',
    'oct.examples': 'Hasta que se enchufe, elegí un resultado de ejemplo para seguir. Estos números están elegidos a mano: no se mide nada.',
    'oct.baseline': 'Grosor de este ojo junto al nervio óptico antes del vuelo:',
    'oct.example.none': 'Ejemplo: medido, unos {value} µm de cambio',
    'oct.example.retry': 'Ejemplo: medido en el segundo intento',
    'oct.example.unmeasured': 'Ejemplo: no se pudo medir después de tres intentos',
  },
);
