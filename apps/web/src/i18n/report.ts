import { defineMessages } from './index';

/**
 * Frame of the medical conference screen. The report itself (titles, sentences,
 * tables) comes from the core (`buildReport`); these are the labels of the
 * question list and of the actions around it.
 */
export const reportMessages = defineMessages(
  {
    'title': 'Medical conference: {name}, flight day {day}',
    'eyebrow': 'Medical conference · {name} · flight day {day}',
    'questions.lead':
      'Write what you want to ask your flight surgeon. The questions are saved in this browser with this control, and they go into the report you download or print.',
    'questions.empty': 'No questions written yet.',
    'question.label': 'Question {n}',
    'question.remove': 'Remove',
    'question.remove.label': 'Remove question {n}',
    'add.label': 'New question',
    'add.button': 'Add the question',
    'suggested.heading': 'Suggested questions',
    'suggested.lead': 'Chosen by fixed rules from what this control found. Add the ones you want; you can edit them afterwards.',
    'suggested.add': 'Add',
    'suggested.add.label': 'Add the suggested question: {question}',
    'suggested.none': 'All the suggested questions are already in your list.',
    'export.heading': 'Take the report with you',
    'export.download': 'Download the report as text',
    'export.print': 'Print the report',
    'export.local': 'The file is made in this browser. Nothing is sent over the network.',
    'actions.heading': 'From here',
    'actions.result': 'Back to the result',
    'actions.history': 'See the history',
    'actions.home': 'Back to the start screen',
  },
  {
    'title': 'Conferencia médica: {name}, día de vuelo {day}',
    'eyebrow': 'Conferencia médica · {name} · día de vuelo {day}',
    'questions.lead':
      'Anotá lo que querés preguntarle a tu médico de vuelo. Las preguntas se guardan en este navegador junto con este control, y van en el informe que bajás o imprimís.',
    'questions.empty': 'Todavía no hay preguntas anotadas.',
    'question.label': 'Pregunta {n}',
    'question.remove': 'Quitar',
    'question.remove.label': 'Quitar la pregunta {n}',
    'add.label': 'Pregunta nueva',
    'add.button': 'Agregar la pregunta',
    'suggested.heading': 'Preguntas sugeridas',
    'suggested.lead': 'Elegidas con reglas fijas según lo que encontró este control. Agregá las que quieras; después las podés editar.',
    'suggested.add': 'Agregar',
    'suggested.add.label': 'Agregar la pregunta sugerida: {question}',
    'suggested.none': 'Todas las preguntas sugeridas ya están en tu lista.',
    'export.heading': 'Llevate el informe',
    'export.download': 'Bajar el informe como texto',
    'export.print': 'Imprimir el informe',
    'export.local': 'El archivo se arma en este navegador. No se envía nada por la red.',
    'actions.heading': 'Desde acá',
    'actions.result': 'Volver al resultado',
    'actions.history': 'Ver la historia',
    'actions.home': 'Volver a la pantalla de inicio',
  },
);
