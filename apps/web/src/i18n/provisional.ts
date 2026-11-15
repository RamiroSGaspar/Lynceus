import { defineMessages } from './index';

/**
 * Texts of the provisional pieces: what stands in for the vision tests, the
 * tomography capture and the assistant until the real ones are plugged in.
 */
export const provisionalMessages = defineMessages(
  {
    'tag': 'Provisional piece',
    'assistant.what':
      'The assistant goes here. It will explain the result and its terms, answer questions about the syndrome from a fixed set of cited facts, and help you write questions for the flight surgeon. It is being built separately.',
    'assistant.record': 'It would receive the result on screen: {name}, flight day {day}.',
    'assistant.noRecord': 'No result is on screen, so it would only answer general questions.',
  },
  {
    'tag': 'Pieza provisoria',
    'assistant.what':
      'Acá va el asistente. Va a explicar el resultado y sus términos, responder preguntas sobre el síndrome con una base fija de datos citados y ayudarte a escribir preguntas para el médico de vuelo. Se está construyendo aparte.',
    'assistant.record': 'Recibiría el resultado que está en pantalla: {name}, día de vuelo {day}.',
    'assistant.noRecord': 'No hay un resultado en pantalla, así que solo respondería preguntas generales.',
  },
);
