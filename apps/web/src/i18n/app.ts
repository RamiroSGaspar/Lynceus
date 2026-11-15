import { defineMessages } from './index';

/** Texts of the frame around every screen: header, footer, assistant panel and error screens. */
export const appMessages = defineMessages(
  {
    'skip': 'Skip to content',
    'header.home': '{product}: start screen',
    'header.context': 'Current control',
    'header.crew': 'Crew member',
    'header.crew.none': 'not chosen yet',
    'header.missionDay': 'Mission day',
    'footer.limits':
      'A first read on board. It is not a diagnosis: the flight surgeon on the ground confirms and decides.',
    'footer.nav': 'About this tool',
    'nav.home': 'Start',
    'nav.brain': 'What is known about the brain',
    'nav.how': 'How it works',
    'notFound.title': 'This page does not exist',
    'notFound.text': 'The address “{path}” does not match any screen.',
    'notFound.record': 'There is no control of {name} on flight day {day} in this browser.',
    'notFound.home': 'Go to the start screen',
    'error.title': 'This screen could not be shown',
    'error.what': 'What happened: the screen stopped with the error “{message}”.',
    'error.cause': 'Likely cause: data saved in this browser by another version, or a defect in this screen.',
    'error.do':
      'What you can do: reload the page. If it happens again, delete what is saved in this browser. The crew history that comes with the application stays.',
    'error.reload': 'Reload the page',
    'error.clear': 'Delete what is saved in this browser',
    'pending.title': 'Screen under construction',
    'pending.text': 'This screen is not built yet.',
  },
  {
    'skip': 'Saltar al contenido',
    'header.home': '{product}: pantalla de inicio',
    'header.context': 'Control actual',
    'header.crew': 'Tripulante',
    'header.crew.none': 'sin elegir',
    'header.missionDay': 'Día de la misión',
    'footer.limits':
      'Una primera lectura a bordo. No es un diagnóstico: el médico de vuelo en Tierra confirma y decide.',
    'footer.nav': 'Sobre esta herramienta',
    'nav.home': 'Inicio',
    'nav.brain': 'Qué se sabe del cerebro',
    'nav.how': 'Cómo funciona',
    'notFound.title': 'Esta página no existe',
    'notFound.text': 'La dirección “{path}” no corresponde a ninguna pantalla.',
    'notFound.record': 'No hay un control de {name} en el día de vuelo {day} en este navegador.',
    'notFound.home': 'Ir a la pantalla de inicio',
    'error.title': 'No se pudo mostrar esta pantalla',
    'error.what': 'Qué pasó: la pantalla se detuvo con el error “{message}”.',
    'error.cause': 'Causa probable: datos guardados en este navegador por otra versión, o un defecto de esta pantalla.',
    'error.do':
      'Qué podés hacer: recargar la página. Si vuelve a pasar, borrá lo guardado en este navegador. La historia de la tripulación que viene con la aplicación queda.',
    'error.reload': 'Recargar la página',
    'error.clear': 'Borrar lo guardado en este navegador',
    'pending.title': 'Pantalla en construcción',
    'pending.text': 'Esta pantalla todavía no está construida.',
  },
);
