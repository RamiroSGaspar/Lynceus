import { defineMessages } from './index';

/**
 * Frame of the screen "What is known about the brain". The statements themselves
 * are not here: they come from the cited knowledge base of the core.
 */
export const brainMessages = defineMessages(
  {
    'title': 'What is known about the brain',
    'lead':
      'What is known, what only an MRI before and after the flight shows, and what cannot be known during a mission. Every statement says how firm it is and where it comes from.',
    'tool':
      'This tool measures the back of the eye. It measures nothing of the brain, and it never reads the pressure inside the skull from the eye.',
    'column.known': 'What is known',
    'column.mriOnly': 'What only an MRI before and after the flight shows',
    'column.notKnowableOnBoard': 'What cannot be known during a mission',
    'certainty.heading': 'How firm each statement is',
    'certainty.established': 'Established',
    'certainty.limited-evidence': 'Limited evidence',
    'certainty.unknown': 'Not known',
    'certainty.not-measurable-on-board': 'Cannot be measured on board',
    'certainty.established.help': 'Stated by the sources read, with data from astronauts.',
    'certainty.limited-evidence.help': 'Few people, indirect measurements or results that disagree.',
    'certainty.unknown.help': 'The sources say it is not known.',
    'certainty.not-measurable-on-board.help': 'There is no way to obtain it during the mission.',
    'sources': 'Sources',
    'source': '{title}. {publisher}, {year}.',
    'source.missing': 'Source “{id}” is not in the reference list.',
    'actions.heading': 'From here',
    'actions.how': 'How this tool works',
    'actions.home': 'Back to the start screen',
  },
  {
    'title': 'Qué se sabe del cerebro',
    'lead':
      'Qué se sabe, qué solo muestra una resonancia antes y después del vuelo, y qué no se puede saber en misión. Cada afirmación dice qué tan firme es y de dónde sale.',
    'tool':
      'Esta herramienta mide la parte de atrás del ojo. No mide nada del cerebro, y nunca lee en el ojo la presión dentro del cráneo.',
    'column.known': 'Qué se sabe',
    'column.mriOnly': 'Qué solo muestra una resonancia antes y después del vuelo',
    'column.notKnowableOnBoard': 'Qué no se puede saber en misión',
    'certainty.heading': 'Qué tan firme es cada afirmación',
    'certainty.established': 'Establecido',
    'certainty.limited-evidence': 'Evidencia limitada',
    'certainty.unknown': 'No se sabe',
    'certainty.not-measurable-on-board': 'No se puede medir a bordo',
    'certainty.established.help': 'Lo afirman las fuentes leídas, con datos de astronautas.',
    'certainty.limited-evidence.help': 'Pocas personas, mediciones indirectas o resultados que no coinciden.',
    'certainty.unknown.help': 'Las fuentes dicen que no se sabe.',
    'certainty.not-measurable-on-board.help': 'No hay forma de obtenerlo durante la misión.',
    'sources': 'Fuentes',
    'source': '{title}. {publisher}, {year}.',
    'source.missing': 'La fuente “{id}” no está en la lista de referencias.',
    'actions.heading': 'Desde acá',
    'actions.how': 'Cómo funciona esta herramienta',
    'actions.home': 'Volver a la pantalla de inicio',
  },
);
