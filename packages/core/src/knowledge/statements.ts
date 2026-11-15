import type { KnowledgeStatement } from './types';

/**
 * The cited knowledge base. Each statement comes from a research document in
 * `monitoreo-salud-astronautas/investigaciones/` (named in `basis`) and from a
 * source that document marks as read. Nothing marked there as unverified enters;
 * "not found" enters only as such. One statement, one fact, with its number, unit
 * and how many people it comes from.
 *
 * Statements about this tool (`limits`) come from `arquitectura.md` sections 5, 6,
 * 10 and 12, where the project's own assumptions are listed.
 */
export const KNOWLEDGE: readonly KnowledgeStatement[] = [
  // ------------------------------------------------------------------ SANS
  {
    id: 'sans.what-it-is',
    topic: 'sans',
    certainty: 'established',
    text: {
      en: 'Spaceflight-associated neuro-ocular syndrome (SANS) is a set of changes at the back of the eye in astronauts on long missions: swelling of the optic nerve head, folds under the retina, flattening of the eye and a shift toward farsightedness.',
      es: 'El síndrome neuro-ocular asociado al vuelo espacial (SANS) es un conjunto de cambios en el fondo del ojo de astronautas en misiones largas: hinchazón de la cabeza del nervio óptico, pliegues bajo la retina, aplanamiento del ojo y corrimiento hacia la hipermetropía.',
    },
    sources: ['nasa-sans-evidence-2022', 'nguyen-2025'],
    basis: 'sans-evolucion-y-logica-clinica.md §B1 and §3',
  },
  {
    id: 'sans.how-common',
    topic: 'sans',
    certainty: 'established',
    text: {
      en: 'About 70 % of crew members on long missions show at least one sign of SANS (NASA brief, 2024; a 2025 review by NASA physicians gives 71 %). The sources do not state how many people these percentages cover.',
      es: 'Cerca del 70 % de los tripulantes de misiones largas tiene al menos un signo de SANS (informe de la NASA, 2024; una revisión de 2025 de médicos de la NASA da 71 %). No dicen sobre cuántas personas se calcula.',
    },
    sources: ['nasa-ochmo-sans-2024', 'nguyen-2025'],
    basis: 'sans-evolucion-y-logica-clinica.md §3 and §B1',
  },
  {
    id: 'sans.clinically-concerning-share',
    topic: 'sans',
    certainty: 'established',
    text: {
      en: 'NASA reports that 16 to 18 % of crew members on long missions reach the level it calls "clinically concerning".',
      es: 'La NASA informa que entre 16 y 18 % de los tripulantes de misiones largas llega al nivel que llama "clínicamente preocupante".',
    },
    sources: ['nasa-ochmo-sans-2024', 'nguyen-2025'],
    basis: 'sans-evolucion-y-logica-clinica.md §B1',
  },
  {
    id: 'sans.first-sign-at-day-150',
    topic: 'sans',
    certainty: 'established',
    text: {
      en: 'Around flight day 150, 23 of 31 astronauts (74 %) had a retinal thickening next to the optic nerve above 19.4 µm in at least one eye.',
      es: 'Cerca del día de vuelo 150, 23 de 31 astronautas (74 %) tenían un engrosamiento de la retina junto al nervio óptico mayor a 19,4 µm en al menos un ojo.',
    },
    sources: ['pardon-2022'],
    basis: 'sans-evolucion-y-logica-clinica.md §2.2 and §2.3',
  },
  {
    id: 'sans.average-course',
    topic: 'sans',
    certainty: 'established',
    text: {
      en: 'In 11 astronauts on missions of about 6 months, the retina next to the nerve thickened on average by 11.9 µm on flight day 10 and by 27.6 µm on flight day 150.',
      es: 'En 11 astronautas con misiones de unos 6 meses, la retina junto al nervio se engrosó en promedio 11,9 µm el día de vuelo 10 y 27,6 µm el día de vuelo 150.',
    },
    sources: ['macias-2020'],
    basis: 'sans-evolucion-y-logica-clinica.md §A1',
  },
  {
    id: 'sans.recovery-after-return',
    topic: 'sans',
    certainty: 'established',
    text: {
      en: 'After landing the thickening goes down: in those 11 astronauts it was no longer significantly different from pre-flight 90 days after return.',
      es: 'Después del aterrizaje el engrosamiento baja: en esos 11 astronautas ya no era significativamente distinto del de antes del vuelo 90 días después de volver.',
    },
    sources: ['macias-2020'],
    basis: 'sans-evolucion-y-logica-clinica.md §A1; sans-oct-base-tecnica.md §4',
  },
  {
    id: 'sans.gravity-reverses',
    topic: 'sans',
    certainty: 'established',
    text: {
      en: 'Returning to gravity is the only thing that has reversed SANS in every case, though not always completely: folds, flattening and the change in glasses can last for years.',
      es: 'Volver a la gravedad es lo único que revirtió el SANS en todos los casos, aunque no siempre por completo: los pliegues, el aplanamiento y el cambio de graduación pueden durar años.',
    },
    sources: ['nasa-sans-evidence-2022'],
    basis: 'sans-evolucion-y-logica-clinica.md §B5',
  },
  {
    id: 'sans.both-eyes',
    topic: 'sans',
    certainty: 'established',
    text: {
      en: 'Both eyes are usually affected, one a little more than the other. On flight day 120 the difference between the two eyes was 8 ± 13 µm in 11 astronauts.',
      es: 'Los dos ojos suelen afectarse, uno un poco más que el otro. El día de vuelo 120 la diferencia entre ambos ojos fue de 8 ± 13 µm en 11 astronautas.',
    },
    sources: ['brunstetter-2024', 'nasa-sans-evidence-2022'],
    basis: 'sans-evolucion-y-logica-clinica.md §2.2',
  },
  {
    id: 'sans.most-severe-case',
    topic: 'sans',
    certainty: 'established',
    text: {
      en: 'The most severe published case, a woman on a mission of about 6 months, reached +232 µm in one eye on flight day 126. She noticed no distortion.',
      es: 'El caso más grave publicado, una mujer en una misión de unos 6 meses, llegó a +232 µm en un ojo el día de vuelo 126. No notó distorsión.',
    },
    sources: ['brunstetter-2024'],
    basis: 'sans-evolucion-y-logica-clinica.md §A4 and §6',
  },
  {
    id: 'sans.risk-factors',
    topic: 'sans',
    certainty: 'limited-evidence',
    text: {
      en: 'In 31 astronauts, sex, age, body weight and previous flights showed no relation with the thickening. A small optic cup did: nobody with a cup of 0.3 mm³ or more passed 19.4 µm.',
      es: 'En 31 astronautas, el sexo, la edad, el peso y los vuelos previos no se relacionaron con el engrosamiento. Una copa del nervio chica sí: nadie con una copa de 0,3 mm³ o más pasó de 19,4 µm.',
    },
    sources: ['pardon-2022'],
    basis: 'sans-evolucion-y-logica-clinica.md §4',
  },

  // ----------------------------------------------------------- Measurement
  {
    id: 'measurement.radial-oct',
    topic: 'measurement',
    certainty: 'established',
    text: {
      en: 'NASA images the optic nerve with optical coherence tomography (OCT): 48 scans of 15° arranged as a star centred on the nerve, each the average of 25 images.',
      es: 'La NASA toma imágenes del nervio óptico con tomografía de coherencia óptica (OCT): 48 cortes de 15° en forma de estrella centrados en el nervio, cada uno promedio de 25 imágenes.',
    },
    sources: ['macias-2020', 'ferguson-2023'],
    basis: 'sans-oct-base-tecnica.md §1.B and §2',
  },
  {
    id: 'measurement.main-measure',
    topic: 'measurement',
    certainty: 'established',
    text: {
      en: "The main measure is total retinal thickness in the ring that runs from the edge of Bruch's membrane opening to 250 µm outwards, compared with the astronaut's own pre-flight exam.",
      es: 'La medida principal es el grosor total de la retina en el anillo que va desde el borde de la abertura de la membrana de Bruch hasta 250 µm hacia afuera, comparado con el examen de antes del vuelo del mismo astronauta.',
    },
    sources: ['macias-2020', 'pardon-2022'],
    basis: 'sans-oct-base-tecnica.md §1.B',
  },
  {
    id: 'measurement.own-baseline',
    topic: 'measurement',
    certainty: 'established',
    text: {
      en: 'Before flight that thickness averaged 392 µm in 31 astronauts, ranging from 299 to 484 µm. Because people differ this much, each eye is compared with its own pre-flight exam.',
      es: 'Antes del vuelo ese grosor promedió 392 µm en 31 astronautas, con un rango de 299 a 484 µm. Como las personas difieren tanto, cada ojo se compara con su propio examen de antes del vuelo.',
    },
    sources: ['pardon-2022', 'macias-2020'],
    basis: 'sans-oct-base-tecnica.md §1.C and §2',
  },
  {
    id: 'measurement.normal-variation',
    topic: 'measurement',
    certainty: 'established',
    text: {
      en: 'The normal variation of the measurement is 9.7 µm (one standard deviation). It was measured in 7 astronauts who had never flown, in 2 sessions about 4 months apart; 19.4 µm is twice that value.',
      es: 'La variación normal de la medición es 9,7 µm (un desvío estándar). Se midió en 7 astronautas que nunca habían volado, en 2 sesiones separadas unos 4 meses; 19,4 µm es el doble de ese valor.',
    },
    sources: ['laurie-2020'],
    basis: 'sans-oct-base-tecnica.md §5.1; sans-evolucion-y-logica-clinica.md §A7',
  },
  {
    id: 'measurement.oct-sees-more-than-photo',
    topic: 'measurement',
    certainty: 'established',
    text: {
      en: 'Tomography detects swelling that a fundus photo can miss: in the most severe published case, +232 µm, the photo grade (Frisén scale) stayed at 0 in both eyes.',
      es: 'La tomografía detecta hinchazón que la foto del fondo de ojo puede no ver: en el caso más grave publicado, +232 µm, el grado de la foto (escala de Frisén) quedó en 0 en los dos ojos.',
    },
    sources: ['brunstetter-2024'],
    basis: 'sans-evolucion-y-logica-clinica.md §A4 and §3',
  },
  {
    id: 'measurement.folds-roughness',
    topic: 'measurement',
    certainty: 'established',
    text: {
      en: "Folds are measured as the roughness of Bruch's membrane after removing tilt and curvature. Its normal variation next to the nerve is 2.8 µm.",
      es: 'Los pliegues se miden como la rugosidad de la membrana de Bruch, después de quitar inclinación y curvatura. Su variación normal junto al nervio es 2,8 µm.',
    },
    sources: ['ferguson-2023'],
    basis: 'sans-oct-base-tecnica.md §1.B and §5.2',
  },
  {
    id: 'measurement.quality-index',
    topic: 'measurement',
    certainty: 'established',
    text: {
      en: "The instrument's quality index runs from 0 to 40 dB, and its manual calls less than 15 dB poor signal. No minimum required by NASA was found in public sources.",
      es: 'El índice de calidad del equipo va de 0 a 40 dB, y su manual llama señal pobre a menos de 15 dB. No se encontró en fuentes públicas un mínimo exigido por la NASA.',
    },
    sources: ['spectralis-artifacts-2015'],
    basis: 'sans-oct-base-tecnica.md §1.A',
  },
  {
    id: 'measurement.choroid',
    topic: 'measurement',
    certainty: 'established',
    text: {
      en: 'The choroid, the layer of vessels under the retina, also thickens in flight: by 43 µm on average on flight day 150 in 11 astronauts. NASA marks it by hand.',
      es: 'La coroides, la capa de vasos bajo la retina, también se engrosa en vuelo: 43 µm en promedio el día de vuelo 150 en 11 astronautas. La NASA la marca a mano.',
    },
    sources: ['macias-2020'],
    basis: 'sans-oct-base-tecnica.md §1.B and §4',
  },

  // ------------------------------------------------------------ Thresholds
  {
    id: 'thresholds.first-sign',
    topic: 'thresholds',
    certainty: 'established',
    text: {
      en: 'NASA\u2019s first level, "earliest indication", is an increase of total retinal thickness above 19.4 µm (NASA\u2019s table rounds it to 20 µm) or any fold, in either eye.',
      es: 'El primer nivel de la NASA, "primer indicio", es un aumento del grosor total de la retina mayor a 19,4 µm (la tabla de la NASA lo redondea a 20 µm) o cualquier pliegue, en cualquiera de los dos ojos.',
    },
    sources: ['nguyen-2025', 'brunstetter-2024'],
    basis: 'sans-evolucion-y-logica-clinica.md §B1',
  },
  {
    id: 'thresholds.clinically-concerning',
    topic: 'thresholds',
    certainty: 'established',
    text: {
      en: 'NASA\u2019s second level, "clinically concerning", is an increase of 55 µm or more, swelling of Frisén grade 1 or higher in a fundus photo, or marked folds near the centre of the retina.',
      es: 'El segundo nivel de la NASA, "clínicamente preocupante", es un aumento de 55 µm o más, una hinchazón de grado 1 o más en la escala de Frisén en la foto, o pliegues marcados cerca del centro de la retina.',
    },
    sources: ['nguyen-2025', 'brunstetter-2024'],
    basis: 'sans-evolucion-y-logica-clinica.md §B1',
  },
  {
    id: 'thresholds.refraction',
    topic: 'thresholds',
    certainty: 'established',
    text: {
      en: 'For glasses, NASA\u2019s levels start at a shift of +0.75 D toward farsightedness; +1.50 D is clinically concerning, close to the limit of the glasses carried on board.',
      es: 'Para la graduación, los niveles de la NASA empiezan en un corrimiento de +0,75 D hacia la hipermetropía; +1,50 D es clínicamente preocupante, cerca del límite de los anteojos de a bordo.',
    },
    sources: ['nguyen-2025', 'nasa-ochmo-sans-2024'],
    basis: 'sans-evolucion-y-logica-clinica.md §B1 and §B5',
  },
  {
    id: 'thresholds.routine-calendar',
    topic: 'thresholds',
    certainty: 'established',
    text: {
      en: 'Without findings, NASA\u2019s in-flight eye exams are on flight days 30 and 90, then every 90 days, and 30 days before return.',
      es: 'Sin hallazgos, los exámenes de ojos en vuelo de la NASA son los días de vuelo 30 y 90, después cada 90 días, y 30 días antes de volver.',
    },
    sources: ['nasa-ochmo-sans-2024'],
    basis: 'sans-evolucion-y-logica-clinica.md §B2',
  },
  {
    id: 'thresholds.first-sign-frequency-not-public',
    topic: 'thresholds',
    certainty: 'unknown',
    text: {
      en: 'At the first level NASA calls for "increased monitoring". How often is not stated in NASA\u2019s public documents; its clinical guideline is internal.',
      es: 'En el primer nivel la NASA pide "más controles". Con qué frecuencia no figura en los documentos públicos de la NASA; su guía clínica es interna.',
    },
    sources: ['nasa-sans-evidence-2022', 'nasa-ochmo-sans-2024'],
    basis: 'sans-evolucion-y-logica-clinica.md §B2',
  },
  {
    id: 'thresholds.published-follow-up-example',
    topic: 'thresholds',
    certainty: 'limited-evidence',
    text: {
      en: 'The only published example of in-flight follow-up at the clinically concerning level, one astronaut: tomography every 3 to 6 weeks and the Amsler grid several times a week.',
      es: 'El único ejemplo publicado de seguimiento en vuelo en el nivel clínicamente preocupante, una astronauta: tomografía cada 3 a 6 semanas y grilla de Amsler varias veces por semana.',
    },
    sources: ['brunstetter-2024'],
    basis: 'sans-evolucion-y-logica-clinica.md §B2',
  },

  // ----------------------------------------------- Brain: what is known
  {
    id: 'brain.noninvasive-indicators',
    topic: 'brain',
    certainty: 'limited-evidence',
    text: {
      en: 'In 13 crew members, four indirect in-flight measures agreed that pressure inside the skull was not above that of sitting on Earth, at most that of lying down. None of them gives a pressure value.',
      es: 'En 13 tripulantes, cuatro mediciones indirectas en vuelo coincidieron en que la presión dentro del cráneo no superaba la de estar sentado en Tierra, a lo sumo la de estar acostado. Ninguna da un valor de presión.',
    },
    sources: ['jasien-2022'],
    basis: 'sans-cerebro-en-mision.md §1',
  },
  {
    id: 'brain.nasa-position-on-pressure',
    topic: 'brain',
    certainty: 'unknown',
    text: {
      en: 'NASA (2024) considers it reasonable that pressure inside the skull is somewhat elevated in SANS, but says it was not measured in flight, so no definitive conclusion can be drawn.',
      es: 'La NASA (2024) considera razonable que la presión dentro del cráneo esté algo elevada en el SANS, pero dice que no se midió en vuelo, así que no se puede sacar una conclusión definitiva.',
    },
    sources: ['nasa-ochmo-sans-2024'],
    basis: 'sans-cerebro-en-mision.md §1',
  },
  {
    id: 'brain.jugular-flow',
    topic: 'brain',
    certainty: 'established',
    text: {
      en: 'Around flight day 50, blood flow in the jugular vein of the neck was stopped or reversed in 6 of 11 crew members; one had a clot blocking the vein.',
      es: 'Cerca del día de vuelo 50, el flujo de sangre en la vena yugular del cuello estaba detenido o invertido en 6 de 11 tripulantes; uno tenía un coágulo que tapaba la vena.',
    },
    sources: ['marshall-goebel-2019'],
    basis: 'sans-cerebro-en-mision.md §1',
  },
  {
    id: 'brain.eye-brain-link-weak',
    topic: 'brain',
    certainty: 'limited-evidence',
    text: {
      en: 'The link between brain and eye changes is weak and inconclusive: in 19 astronauts, +4.7 µm of retina per ml of ventricle growth, with an interval from −1.5 to 10.8 µm.',
      es: 'La relación entre los cambios del cerebro y los del ojo es débil y no concluyente: en 19 astronautas, +4,7 µm de retina por cada ml de agrandamiento de los ventrículos, con un intervalo de −1,5 a 10,8 µm.',
    },
    sources: ['marshall-goebel-2021'],
    basis: 'sans-cerebro-en-mision.md §4',
  },
  {
    id: 'brain.swelling-appears-decoupled',
    topic: 'brain',
    certainty: 'limited-evidence',
    text: {
      en: 'The study with the most objective measurement concludes that optic disc swelling "appears decoupled" from changes inside the skull. NASA calls the literature "mixed".',
      es: 'El estudio con la medición más objetiva concluye que la hinchazón del nervio óptico "parece desacoplada" de los cambios dentro del cráneo. La NASA dice que la literatura "sigue siendo mixta".',
    },
    sources: ['marshall-goebel-2021', 'nasa-sans-evidence-2022'],
    basis: 'sans-cerebro-en-mision.md §4',
  },
  {
    id: 'brain.cognition-in-flight',
    topic: 'brain',
    certainty: 'limited-evidence',
    text: {
      en: 'In 25 astronauts, processing speed, visual memory and sustained attention were slower early in flight, with no systematic decline. No study linking these tests to SANS was found.',
      es: 'En 25 astronautas, la velocidad de procesamiento, la memoria visual y la atención sostenida fueron más lentas al inicio del vuelo, sin deterioro sistemático. No se encontró un estudio que relacione estas pruebas con el SANS.',
    },
    sources: ['dev-2024'],
    basis: 'sans-cerebro-en-mision.md §1 and §2',
  },

  // ------------------------------------- Brain: seen only with MRI on Earth
  {
    id: 'brain.mri-only-before-and-after',
    topic: 'brain',
    certainty: 'established',
    text: {
      en: 'Brain MRI is done only before flight (18 to 21 months before) and after it (about 3 days after landing).',
      es: 'La resonancia del cerebro se hace solo antes del vuelo (18 a 21 meses antes) y después (unos 3 días tras el aterrizaje).',
    },
    sources: ['nasa-sans-evidence-2022'],
    basis: 'sans-cerebro-en-mision.md §1',
  },
  {
    id: 'brain.ventricles-enlarge',
    topic: 'brain',
    certainty: 'established',
    text: {
      en: 'After flight, MRI shows larger brain ventricles, the cavities filled with fluid: +10 to 16 % (about 1 to 3 ml), according to NASA\u2019s 2022 report.',
      es: 'Después del vuelo, la resonancia muestra ventrículos del cerebro más grandes, las cavidades llenas de líquido: +10 a 16 % (cerca de 1 a 3 ml), según el informe de la NASA de 2022.',
    },
    sources: ['nasa-sans-evidence-2022'],
    basis: 'sans-cerebro-en-mision.md §3',
  },
  {
    id: 'brain.upward-shift',
    topic: 'brain',
    certainty: 'established',
    text: {
      en: 'After flight, MRI shows the brain shifted upward, with narrower fluid spaces at the top. NASA reports it in all 34 astronauts of one study, of whom only 3 had optic disc swelling.',
      es: 'Después del vuelo, la resonancia muestra el cerebro desplazado hacia arriba, con espacios de líquido más angostos arriba. La NASA lo informa en los 34 astronautas de un estudio; solo 3 tenían hinchazón del nervio óptico.',
    },
    sources: ['nasa-sans-evidence-2022'],
    basis: 'sans-cerebro-en-mision.md §3 and §4',
  },
  {
    id: 'brain.recovery',
    topic: 'brain',
    certainty: 'established',
    text: {
      en: 'Most brain changes recover within 6 months of landing; the ventricles recover little and were still enlarged one year after flight.',
      es: 'La mayoría de los cambios del cerebro se recupera dentro de los 6 meses del aterrizaje; los ventrículos se recuperan poco y seguían agrandados un año después del vuelo.',
    },
    sources: ['hupfeld-2020', 'nasa-sans-evidence-2022'],
    basis: 'sans-cerebro-en-mision.md §3',
  },
  {
    id: 'brain.perivascular-spaces',
    topic: 'brain',
    certainty: 'limited-evidence',
    text: {
      en: 'The spaces around brain vessels grew in first-time flyers but not in experienced ones, with no difference between those with and without SANS (6 and 6 astronauts).',
      es: 'Los espacios alrededor de los vasos del cerebro aumentaron en quienes volaban por primera vez y no en los que ya habían volado, sin diferencia entre quienes tuvieron SANS y quienes no (6 y 6 astronautas).',
    },
    sources: ['hupfeld-2022'],
    basis: 'sans-cerebro-en-mision.md §3 and §4',
  },
  {
    id: 'brain.consequences-unknown',
    topic: 'brain',
    certainty: 'unknown',
    text: {
      en: 'NASA says it is not yet known whether these small brain changes have consequences for health.',
      es: 'La NASA dice que todavía no se sabe si estos cambios pequeños del cerebro tienen consecuencias para la salud.',
    },
    sources: ['nasa-sans-evidence-2022'],
    basis: 'sans-cerebro-en-mision.md §3',
  },

  // ------------------------------ Brain: what cannot be known during the mission
  {
    id: 'brain.icp-never-measured-in-flight',
    topic: 'brain',
    certainty: 'not-measurable-on-board',
    text: {
      en: 'Pressure inside the skull has never been measured directly in flight: it needs a lumbar puncture or a sensor inside the skull.',
      es: 'La presión dentro del cráneo nunca se midió directamente en vuelo: hace falta una punción lumbar o un sensor dentro del cráneo.',
    },
    sources: ['nasa-sans-evidence-2022', 'jasien-2022'],
    basis: 'sans-cerebro-en-mision.md §6',
  },
  {
    id: 'brain.eye-is-not-a-pressure-gauge',
    topic: 'brain',
    certainty: 'not-measurable-on-board',
    text: {
      en: 'An eye measurement does not tell the pressure inside the skull: in the most severe published case (+232 µm), the lumbar puncture a week after landing gave a normal 19.4 cm H₂O.',
      es: 'Una medida del ojo no dice la presión dentro del cráneo: en el caso más grave publicado (+232 µm), la punción lumbar una semana después del aterrizaje dio un valor normal, 19,4 cm H₂O.',
    },
    sources: ['brunstetter-2024'],
    basis: 'sans-evolucion-y-logica-clinica.md §A4; sans-cerebro-en-mision.md §4 and §6',
  },
  {
    id: 'brain.no-preflight-pressure',
    topic: 'brain',
    certainty: 'not-measurable-on-board',
    text: {
      en: 'Whether an astronaut\u2019s pressure inside the skull rose compared with before flight cannot be known: there are no direct pre-flight measurements, nor any from crew without SANS.',
      es: 'No se puede saber si la presión dentro del cráneo de un astronauta subió respecto de antes del vuelo: no hay mediciones directas previas al vuelo, ni de tripulantes sin SANS.',
    },
    sources: ['nasa-sans-evidence-2022'],
    basis: 'sans-cerebro-en-mision.md §6',
  },
  {
    id: 'brain.cause-of-eye-changes-unknown',
    topic: 'brain',
    certainty: 'unknown',
    text: {
      en: 'Whether the brain changes cause the eye changes is not known: the studies disagree.',
      es: 'No se sabe si los cambios del cerebro causan los del ojo: los estudios no coinciden.',
    },
    sources: ['nasa-sans-evidence-2022', 'marshall-goebel-2021'],
    basis: 'sans-cerebro-en-mision.md §4 and §6',
  },
  {
    id: 'brain.effect-on-thinking-unknown',
    topic: 'brain',
    certainty: 'unknown',
    text: {
      en: 'Whether the brain changes affect mental performance is unknown, according to NASA.',
      es: 'Según la NASA, se desconoce si los cambios del cerebro afectan el rendimiento mental.',
    },
    sources: ['nasa-sans-evidence-2022'],
    basis: 'sans-cerebro-en-mision.md §6',
  },
  {
    id: 'brain.personal-carbon-dioxide',
    topic: 'brain',
    certainty: 'not-measurable-on-board',
    text: {
      en: 'How much carbon dioxide each person breathes is not known: the monitors are on the walls, and pockets of gas can form near the face, especially during sleep.',
      es: 'No se sabe cuánto dióxido de carbono respira cada persona: los monitores están en las paredes y pueden formarse bolsones de gas cerca de la cara, sobre todo al dormir.',
    },
    sources: ['nasa-sans-evidence-2022'],
    basis: 'sans-cerebro-en-mision.md §6',
  },

  // -------------------------------------------------------------- Symptoms
  {
    id: 'symptoms.near-vision',
    topic: 'symptoms',
    certainty: 'established',
    text: {
      en: 'Blurred near vision is the most common complaint: 48 % of astronauts on long missions against 23 % on short ones. It can start at 3 weeks.',
      es: 'Ver peor de cerca es la queja más común: 48 % de los astronautas en misiones largas frente a 23 % en las cortas. Puede empezar a las 3 semanas.',
    },
    sources: ['nguyen-2025', 'nasa-sans-evidence-2022'],
    basis: 'sans-evolucion-y-logica-clinica.md §6',
  },
  {
    id: 'symptoms.usually-silent',
    topic: 'symptoms',
    certainty: 'established',
    text: {
      en: 'SANS usually causes no symptoms. What astronauts notice is the change in their glasses, not the swelling, so the link between the image and what is felt is weak.',
      es: 'El SANS normalmente no da síntomas. Lo que se nota es el cambio de graduación, no la hinchazón, así que la relación entre la imagen y lo que se siente es débil.',
    },
    sources: ['brunstetter-2024', 'nasa-sans-evidence-2022'],
    basis: 'sans-evolucion-y-logica-clinica.md §6',
  },
  {
    id: 'symptoms.not-like-high-pressure-on-earth',
    topic: 'symptoms',
    certainty: 'established',
    text: {
      en: 'Astronauts do not show the typical symptoms of high pressure inside the skull on Earth: chronic headache, double vision, brief blackouts of vision or a ringing in the ears that beats with the pulse.',
      es: 'Los astronautas no presentan los síntomas típicos de la presión alta dentro del cráneo en Tierra: dolor de cabeza crónico, visión doble, oscurecimientos pasajeros de la visión o un zumbido que late con el pulso.',
    },
    sources: ['nasa-sans-evidence-2022', 'brunstetter-2017'],
    basis: 'sans-cerebro-en-mision.md §5; sans-evolucion-y-logica-clinica.md §6',
  },
  {
    id: 'symptoms.corrected-with-glasses',
    topic: 'symptoms',
    certainty: 'established',
    text: {
      en: 'In every known case, vision was corrected to 20/20 or better with glasses. Each crew member carries at least 3 pairs of glasses of different strengths.',
      es: 'En todos los casos conocidos la visión se corrigió a 20/20 o mejor con anteojos. Cada tripulante lleva al menos 3 pares de anteojos de distinta graduación.',
    },
    sources: ['nasa-sans-evidence-2022', 'nasa-ochmo-sans-2024'],
    basis: 'sans-evolucion-y-logica-clinica.md §6 and §B5',
  },
  {
    id: 'symptoms.headache-common',
    topic: 'symptoms',
    certainty: 'established',
    text: {
      en: '22 of 24 astronauts (91.7 %) had at least one headache in flight, 90 % of them of tension type. None had headaches in the 3 months after return.',
      es: '22 de 24 astronautas (91,7 %) tuvieron al menos un dolor de cabeza en vuelo, el 90 % de tipo tensional. Ninguno tuvo en los 3 meses después de volver.',
    },
    sources: ['van-oosterhout-2024'],
    basis: 'sans-cerebro-en-mision.md §1 and §5',
  },
  {
    id: 'symptoms.headache-not-linked',
    topic: 'symptoms',
    certainty: 'unknown',
    text: {
      en: 'No study linking headache to SANS was found. Headache is recorded in the questionnaire without claiming a relation with the eye findings.',
      es: 'No se encontró ningún estudio que relacione el dolor de cabeza con el SANS. Se registra en el cuestionario sin afirmar relación con los hallazgos del ojo.',
    },
    sources: ['van-oosterhout-2024', 'nasa-sans-evidence-2022'],
    basis: 'sans-cerebro-en-mision.md §5',
  },

  // ------------------------------------------------------- Countermeasures
  {
    id: 'countermeasures.none-proven',
    topic: 'countermeasures',
    certainty: 'established',
    text: {
      en: 'No countermeasure has been shown to prevent SANS. The ones being studied are research, not treatments.',
      es: 'Ninguna contramedida demostró que previene el SANS. Las que se estudian son investigación, no tratamientos.',
    },
    sources: ['nasa-sans-evidence-2022', 'nguyen-2025'],
    basis: 'sans-evolucion-y-logica-clinica.md §7',
  },
  {
    id: 'countermeasures.leg-suction',
    topic: 'countermeasures',
    certainty: 'limited-evidence',
    text: {
      en: 'Study: suction on the lower body (25 mmHg, 10 to 30 minutes) in 14 crew members lowered eye pressure and jugular volume, but did not change the optic nerve or the retinal thickness.',
      es: 'Estudio: la succión en la parte baja del cuerpo (25 mmHg, 10 a 30 minutos) en 14 tripulantes bajó la presión del ojo y el volumen de la yugular, pero no cambió el nervio óptico ni el grosor de la retina.',
    },
    sources: ['hearon-2022', 'nguyen-2025'],
    basis: 'sans-evolucion-y-logica-clinica.md §7',
  },
  {
    id: 'countermeasures.centrifuge',
    topic: 'countermeasures',
    certainty: 'limited-evidence',
    text: {
      en: 'Study: artificial gravity on a short-arm centrifuge, 30 minutes a day during 60 days of bed rest on Earth, did not significantly reduce the retinal thickening.',
      es: 'Estudio: la gravedad artificial en una centrífuga de brazo corto, 30 minutos por día durante 60 días de reposo en cama en Tierra, no redujo de forma significativa el engrosamiento de la retina.',
    },
    sources: ['nasa-sans-evidence-2022', 'nguyen-2025'],
    basis: 'sans-evolucion-y-logica-clinica.md §7',
  },
  {
    id: 'countermeasures.b-vitamins-study',
    topic: 'countermeasures',
    certainty: 'unknown',
    text: {
      en: 'Study: a daily B-vitamin supplement is being studied in flight, without published results. In the one published case where it was given, the improvement coincided with lower cabin carbon dioxide, so it cannot be attributed.',
      es: 'Estudio: se estudia en vuelo un suplemento diario de vitaminas B, sin resultados publicados. En el único caso publicado en que se dio, la mejoría coincidió con menos dióxido de carbono en la cabina, así que no se le puede atribuir.',
    },
    sources: ['brunstetter-2024', 'nguyen-2025'],
    basis: 'sans-evolucion-y-logica-clinica.md §7',
  },
  {
    id: 'countermeasures.no-medication',
    topic: 'countermeasures',
    certainty: 'established',
    text: {
      en: 'No medication has been proven for SANS, and none is used for it in flight: it is not known whether pressure inside the skull is high in flight.',
      es: 'Ningún medicamento está probado para el SANS y no se usa ninguno en vuelo: no se sabe si la presión dentro del cráneo está alta en vuelo.',
    },
    sources: ['nasa-sans-evidence-2022', 'nguyen-2025'],
    basis: 'sans-evolucion-y-logica-clinica.md §7',
  },

  // ------------------------------------------------------ Limits of this tool
  {
    id: 'limits.not-a-diagnosis',
    topic: 'limits',
    certainty: 'established',
    text: {
      en: 'This tool gives a first read to prepare the conversation with the flight surgeon. It does not diagnose: the surgeon confirms and decides.',
      es: 'Esta herramienta da una primera lectura para preparar la conversación con el médico de vuelo. No diagnostica: el médico confirma y decide.',
    },
    sources: ['nasa-std-3001-vol2-2026', 'nasa-std-3001-vol1-2023'],
    basis: 'arquitectura.md §1; comunicar-resultados-de-salud.md Part 1 rows 10 and 13',
  },
  {
    id: 'limits.simulated-data',
    topic: 'limits',
    certainty: 'established',
    text: {
      en: 'The exams in this demonstration are simulated. The analysis is real, but its error was measured only on simulated eyes of known value, not on people.',
      es: 'Los exámenes de esta demostración son simulados. El análisis es real, pero su error se midió solo en ojos simulados de valor conocido, no en personas.',
    },
    sources: ['fda-ml-transparency-2024'],
    basis: 'arquitectura.md §4 and §10; comunicar-resultados-de-salud.md §2.2',
  },
  {
    id: 'limits.automatic-marking',
    topic: 'limits',
    certainty: 'established',
    text: {
      en: 'NASA\u2019s experts correct the automatic marking of the retinal layers by hand. This tool\u2019s marking is automatic and nobody corrects it.',
      es: 'Los expertos de la NASA corrigen a mano el marcado automático de las capas de la retina. El marcado de esta herramienta es automático y nadie lo corrige.',
    },
    sources: ['macias-2020', 'pardon-2022'],
    basis: 'arquitectura.md §12.5; sans-oct-base-tecnica.md §1.B',
  },
  {
    id: 'limits.not-measured-here',
    topic: 'limits',
    certainty: 'not-measurable-on-board',
    text: {
      en: 'This tool does not measure choroid thickness, cysts, flattening of the eye or the change in glasses; NASA uses manual marking, ultrasound and post-flight exams for those.',
      es: 'Esta herramienta no mide el grosor de la coroides, quistes, el aplanamiento del ojo ni el cambio de graduación; para eso la NASA usa marcado a mano, ecografía y exámenes después del vuelo.',
    },
    sources: ['macias-2020', 'nasa-ochmo-sans-2024', 'nasa-sans-evidence-2022'],
    basis: 'arquitectura.md §5; sans-oct-base-tecnica.md §1.B; sans-evolucion-y-logica-clinica.md §5.1',
  },
  {
    id: 'limits.cannot-measure',
    topic: 'limits',
    certainty: 'established',
    text: {
      en: 'If a capture is not good enough, the tool asks to repeat it, up to three times, and then says it cannot measure that eye today instead of giving a number.',
      es: 'Si una captura no alcanza, la herramienta pide repetirla, hasta tres veces, y después dice que no puede medir ese ojo hoy en lugar de dar un número.',
    },
    sources: ['nasa-std-3001-vol2-2026'],
    basis: 'arquitectura.md §5 and §12.10; comunicar-resultados-de-salud.md Part 1 row 10',
  },
  {
    id: 'limits.own-assumptions',
    topic: 'limits',
    certainty: 'established',
    text: {
      en: 'The extra exam frequencies, the alert class of each level and the words tied to probabilities (possible, likely, very likely) are assumptions of this project; NASA does not publish equivalents.',
      es: 'Las frecuencias de los controles extra, la clase de aviso de cada nivel y las palabras ligadas a probabilidades (posible, probable, muy probable) son supuestos de este proyecto; la NASA no publica equivalentes.',
    },
    sources: ['nasa-ochmo-sans-2024', 'zikmund-fisher-2025'],
    basis: 'arquitectura.md §6 and §12.1–3; comunicar-resultados-de-salud.md §2.1',
  },

  // -------------------------------------------------------------- Glossary
  {
    id: 'glossary.oct',
    topic: 'glossary',
    certainty: 'established',
    text: {
      en: 'Optical coherence tomography (OCT): an image of the retina in cross-section, made with light.',
      es: 'Tomografía de coherencia óptica (OCT): una imagen en corte de la retina, hecha con luz.',
    },
    sources: ['macias-2020'],
    basis: 'sans-oct-base-tecnica.md, terms',
  },
  {
    id: 'glossary.total-retinal-thickness',
    topic: 'glossary',
    certainty: 'established',
    text: {
      en: "Total retinal thickness (TRT): the distance from the inner surface of the retina to Bruch's membrane, in micrometres (µm, thousandths of a millimetre).",
      es: 'Grosor total de la retina (TRT): la distancia desde la superficie interna de la retina hasta la membrana de Bruch, en micrómetros (µm, milésimas de milímetro).',
    },
    sources: ['macias-2020'],
    basis: 'sans-oct-base-tecnica.md §1.B',
  },
  {
    id: 'glossary.bmo',
    topic: 'glossary',
    certainty: 'established',
    text: {
      en: "Bruch's membrane opening (BMO): the hole in the thin layer under the retina through which the optic nerve leaves the eye; the measuring rings start at its edge.",
      es: 'Abertura de la membrana de Bruch (BMO): el agujero de la lámina fina bajo la retina por donde el nervio óptico sale del ojo; los anillos de medición empiezan en su borde.',
    },
    sources: ['macias-2020', 'pardon-2022'],
    basis: 'sans-oct-base-tecnica.md, terms and §1.B',
  },
  {
    id: 'glossary.mrw',
    topic: 'glossary',
    certainty: 'established',
    text: {
      en: "Minimum rim width (MRW): the shortest distance from the edge of Bruch's membrane opening to the inner surface of the retina.",
      es: 'Ancho mínimo del anillo neural (MRW): la distancia más corta desde el borde de la abertura de la membrana de Bruch hasta la superficie interna de la retina.',
    },
    sources: ['macias-2020', 'pardon-2022'],
    basis: 'sans-oct-base-tecnica.md §1.B',
  },
  {
    id: 'glossary.frisen-scale',
    topic: 'glossary',
    certainty: 'established',
    text: {
      en: 'Frisén scale: grades 0 to 5 of optic nerve swelling as seen in a photo of the back of the eye.',
      es: 'Escala de Frisén: grados 0 a 5 de la hinchazón del nervio óptico vista en una foto del fondo de ojo.',
    },
    sources: ['nasa-sans-evidence-2022'],
    basis: 'sans-evolucion-y-logica-clinica.md, terms',
  },
  {
    id: 'glossary.baseline',
    topic: 'glossary',
    certainty: 'established',
    text: {
      en: 'Baseline: your own pre-flight exam of the same eye, against which every change is measured.',
      es: 'Línea de base: tu propio examen de antes del vuelo del mismo ojo, contra el que se mide cada cambio.',
    },
    sources: ['macias-2020', 'pardon-2022'],
    basis: 'comunicar-resultados-de-salud.md, terms; sans-oct-base-tecnica.md §2',
  },
  {
    id: 'glossary.amsler-grid',
    topic: 'glossary',
    certainty: 'established',
    text: {
      en: 'Amsler grid: a square grid with a central dot, looked at with one eye at a time; wavy, blurred or missing lines are a positive result.',
      es: 'Grilla de Amsler: una cuadrícula con un punto central que se mira con un ojo por vez; las líneas onduladas, borrosas o faltantes son un resultado positivo.',
    },
    sources: ['brunstetter-2017'],
    basis: 'sans-evolucion-y-logica-clinica.md §5.1',
  },
  {
    id: 'glossary.diopter',
    topic: 'glossary',
    certainty: 'established',
    text: {
      en: 'Diopter (D): the unit of lens power. A shift toward farsightedness makes near vision worse.',
      es: 'Dioptría (D): la unidad de potencia de una lente. Un corrimiento hacia la hipermetropía hace ver peor de cerca.',
    },
    sources: ['nasa-sans-evidence-2022'],
    basis: 'sans-evolucion-y-logica-clinica.md, terms',
  },
  {
    id: 'glossary.intracranial-pressure',
    topic: 'glossary',
    certainty: 'not-measurable-on-board',
    text: {
      en: 'Intracranial pressure: the pressure of the fluid that surrounds the brain. It cannot be measured on board.',
      es: 'Presión intracraneal: la presión del líquido que rodea al cerebro. No se puede medir a bordo.',
    },
    sources: ['nasa-sans-evidence-2022'],
    basis: 'sans-cerebro-en-mision.md, terms and §6',
  },
  {
    id: 'glossary.flight-surgeon',
    topic: 'glossary',
    certainty: 'established',
    text: {
      en: 'Flight surgeon: the physician on Earth who leads each astronaut\u2019s medical care during the mission.',
      es: 'Médico de vuelo: el médico en Tierra que conduce la atención médica de cada astronauta durante la misión.',
    },
    sources: ['nasa-std-3001-vol1-2023'],
    basis: 'comunicar-resultados-de-salud.md Part 1 row 13',
  },
];
