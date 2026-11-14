# Recursos del desafío: Monitoreo de salud para astronautas

> **Etapa:** documento de una etapa muy inicial del trabajo en la hackatón (relevamiento previo a definir la idea).

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío elegido** | *Create Health Monitoring Software for Astronauts on Space Missions* (nivel Intermedio) — [página oficial](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) |
| **Fecha de relevamiento** | 14 de noviembre de 2026 |
| **Para qué es este documento** | Reunir en un solo lugar todo lo que el desafío ofrece o se relaciona directamente con él (recursos oficiales, material que se desprende de ellos, desafíos y proyectos de años anteriores, reglas de evaluación y entrega), como base para planificar qué usar e investigar una vez definida la idea. |
| **Qué no es** | No contiene ideas ni soluciones propuestas. Es un inventario de insumos. |
| **Fuente** | Páginas oficiales de spaceappschallenge.org (ediciones 2017–2026), NASA y CSA, revisadas el día del relevamiento. |

### Cómo leerlo

- **Secciones 1 y 2:** lo que el desafío da de forma oficial (enunciado y pestaña *Resources*). Es el punto de partida obligado.
- **Sección 3:** material que no figura en la página del desafío pero se llega a él desde los recursos oficiales. Es lo más útil para fundamentar con evidencia.
- **Sección 4:** desafíos de años anteriores con temática similar y proyectos premiados, como referencia de enfoques previos.
- **Sección 5:** estado de la competencia en 2026.
- **Sección 6:** reglas de evaluación y entrega, a tener presentes al planificar.
- Los ítems marcados como **tangencial** o **no alineado** se dejan solo como referencia; no son prioritarios.
- Todos los enlaces llevan a la fuente original.

---

## 1. Lo que da el propio desafío

- **Objetivo literal:** una herramienta visual para que el astronauta evalúe su propia salud durante la misión y reciba orientación sobre tratamientos y mejoras.
- **Entrada de datos permitida:** cualquiera (texto, clics, imágenes de cámara), siempre que represente un indicador de salud. Ejemplos que dan: glucosa en mg/dL, imágenes de ecografía.
- **Indicadores que sugieren:** presión arterial, frecuencia cardíaca, glucosa, temperatura corporal, horas de sueño y estado de ánimo.
- **Las 5 preguntas guía:**
  1. ¿Qué mediciones se pueden hacer en el espacio?
  2. ¿Por qué hace falta cada examen?
  3. ¿Cómo afectan los peligros del vuelo espacial a cada indicador?
  4. ¿Cuándo un resultado requiere atención de la tripulación o de los médicos en Tierra?
  5. ¿Qué acciones previenen una condición crítica?
- **Sobre la interfaz:** la UI tiene mucho peso. Sugieren animaciones, interactividad y una figura humana con partes del cuerpo clickeables.
- **Consideraciones opcionales:**
  - Distintos entornos: nave, estación, rover, base planetaria.
  - Que la herramienta pida mediciones o tareas como parte de la rutina.
  - Gamificación.
  - Gráficos que muestren la evolución en el tiempo.
  - Código de colores por estado.
  - Instrucciones simples: no asumir que el astronauta sabe evaluar su salud.

## 2. Recursos oficiales (pestaña Resources)

**NASA – Human Research Program (HRP):**
- **[5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/):** los 5 peligros, cada uno con su página y su video. Dato clave: los peligros se potencian entre sí.
  - [Radiación](https://www.nasa.gov/hrp/hazard-space-radiation/)
  - [Aislamiento](https://www.nasa.gov/hrp/hazard-isolation-and-confinement/)
  - [Distancia a la Tierra](https://www.nasa.gov/hrp/hazard-distance-from-earth/)
  - [Gravedad](https://www.nasa.gov/hrp/hazard-gravity-fields/)
  - [Ambiente cerrado/hostil](https://www.nasa.gov/hrp/hazard-hostile-closed-environments/)
- **[Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/):** 17 riesgos concretos. Cada página explica los riesgos principales y qué se puede hacer (contramedidas).
  - **Fisiología:**
    - [Sistema inmune](https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/)
    - [Sensoriomotor/vestibular](https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/)
    - [Cardiovascular](https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/)
    - [Descompresión](https://www.nasa.gov/reference/risk-of-decompression-sickness/)
    - [Microorganismos](https://www.nasa.gov/reference/risk-of-host-microorganism-interactions/)
    - [Hipoxia](https://www.nasa.gov/reference/risk-of-hypoxia/)
    - [Nutrición](https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/)
    - [Caminatas espaciales (EVA)](https://www.nasa.gov/reference/risk-of-injury-and-compromised-performance-from-extravehicular-activity-eva/)
    - [Estado físico](https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/)
    - [Ojos/cerebro (SANS)](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/)
    - [Huesos](https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/)
  - **Conducta:**
    - [Salud mental](https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/)
    - [Trabajo en equipo](https://www.nasa.gov/reference/risk-of-inadequate-teamwork/)
    - [Sueño y horarios](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/)
    - [Soporte de operaciones](https://www.nasa.gov/reference/risk-of-inadequate-systems-operations-support/)
    - [Cargas dinámicas](https://www.nasa.gov/reference/risk-of-injury-from-dynamic-loads/)
  - **Radiación:** [cáncer por radiación](https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/)
- **[Ongoing HRP Research](https://www.nasa.gov/hrp/ongoing-hrp-research/):** estudios en curso. Los más alineados son:
  - [Standard Measures](https://www.nasa.gov/reference/standard-measures/) y [Artemis II Standard Measures](https://www.nasa.gov/reference/artemis-ii-standard-measures/): el set estándar de mediciones físicas y psicológicas que la NASA toma a cada tripulante. Muy útil para responder "qué se mide".
  - [ARCHeR](https://www.nasa.gov/reference/archer/): bienestar, actividad y sueño en Artemis II.
  - [Tempus Pro](https://www.nasa.gov/reference/tempus-pro/): dispositivo de telemedicina que integra datos de salud.
  - [CIPHER](https://www.nasa.gov/reference/cipher/): cambios en múltiples sistemas del cuerpo.
  - [Immune Biomarkers](https://www.nasa.gov/reference/immune-biomarkers/): marcadores inmunes.
  - El resto (B-Complex, Thigh Cuff, Zero T2, etc.) es más específico. Sirve si se elige un sistema del cuerpo en particular.

**CSA (Agencia Espacial Canadiense):**
- [Monitoring Radiation for Astronaut Health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp): el detector CANS mide radiación de neutrones de forma continua y autónoma. Los neutrones son cerca del 30% de la radiación en la ISS.
- [Why Do We Conduct Science Experiments in Space?](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp): lista los riesgos de las misiones profundas, incluido depender menos de la Tierra para asistencia médica de emergencia. Es de contexto general.

## 3. Lo que hay "un nivel abajo" (sale de los recursos oficiales)

Para un enfoque de investigación es lo más valioso:
- **[Evidence Reports del Human Research Roadmap](https://humanresearchroadmap.nasa.gov/evidence/):** un informe científico por cada riesgo, escrito para lectores con formación científica que no son especialistas. Es la base para justificar indicadores y umbrales. El más alineado es **"Risk of Adverse Health Outcomes… Due to Medical Conditions that occur in Mission"** (Exploration Medical Capability), que trata justamente la atención médica durante la misión.
- **Diagramas causales (DAG) de cada riesgo:** cada riesgo tiene un diagrama que muestra qué factores llevan a qué consecuencias, en PDF y en código. Ejemplo: [riesgo cardiovascular](https://www.nasa.gov/directorates/esdmd/hhp/cv-risk/). Sirven para armar la lógica "si pasa X, entonces Y".
- [Lista completa de Human System Risks](https://www.nasa.gov/hhp/human-system-risks/).

## 4. Desafíos anteriores relacionados

Se revisaron las ediciones 2017 a 2025. No hay un antecesor directo de este desafío, pero sí dos parecidos:

**2020 – [Sleep Shift Scheduling Tool](https://2020.spaceappschallenge.org/challenges/sustain/sleep-shift-scheduling-tool/details/)** (muy alineado en el tema del sueño)
- Pedía una herramienta que organice sueño, ejercicio y nutrición de astronautas para manejar la fatiga.
- Detalla qué mide la NASA en la realidad:
  - **Actigrafía de sueño:** tiempo total, latencia, eficiencia, despertares, exposición a la luz.
  - **ISS FIT:** registro de comidas con calorías, sodio, proteína, etc.
  - **Ejercicio:** cicloergómetro y cinta.
- Proyectos premiados:
  - **aaion**: finalista global, open source → [GitHub](https://github.com/hyperrixel/aaion)
  - **Sleepronize** (Ethioprogrammers): finalista global → [GitHub](https://github.com/Sleelpronize/Team-project)
  - **SleepWell** (SleepyMedix): aparece en menciones honoríficas, con algoritmos basados en cronotipo y en el modelo de cambio de conducta COM-B → [GitHub](https://github.com/thelukethorpe/sleepy_medix_alpha)

**2021 – [The Trail to Mars: Can You Keep Your Crew Alive](https://2021.spaceappschallenge.org/challenges/statements/the-trail-to-mars-can-you-keep-your-crew-alive/details/)** (alineado en el tema, no en el público)
- Era un juego educativo para chicos de 10 a 14 años sobre mantener sano a un astronauta en un viaje a Marte.
- Sirve para ver cómo otros equipos tradujeron los 5 peligros a "estados de salud".
- Proyectos premiados:
  - **Space Travelers** (Guayaquil): ganador global, Best Storytelling. Convirtió cada peligro en una estadística: salud, comida, estado físico, felicidad.
  - **The Edge of Phobos** (LMC, Ottawa): finalista global.
- Recursos útiles: el [Twins Study](https://www.nasa.gov/twins-study/research), con datos humanos reales de Scott Kelly. Los datos de GeneLab que listaba son de ratones, así que **no se alinean** con este desafío.

**2025 – Build a Space Biology Knowledge Engine** (**tangencial**, solo como bibliografía)
- [608 publicaciones de biología espacial](https://github.com/jgalazka/SB_publications/tree/main)
- [NASA OSDR](https://www.nasa.gov/osdr/)
- [Space Life Sciences Library](https://public.ksc.nasa.gov/nslsl/)
- [NASA Task Book](https://taskbook.nasaprs.com/tbp/welcome.cfm): proyectos financiados por el HRP, con sus informes.

## 5. Equipos 2026 en este desafío

Hay **3.023 equipos** anotados. Solo se ven el nombre y la ciudad; los proyectos no son públicos hasta después de la evaluación. Es un desafío muy competido, así que lo que los diferencie va a importar.

## 6. Reglas de evaluación y entrega (para la planificación)

- **Criterios** (cada uno se puntúa de 1 a 5):
  - **Impacto.**
  - **Creatividad.**
  - **Validez:** base científica y factibilidad. Acepta explícitamente proyectos que "todavía requieren refinamiento significativo".
  - **Relevancia:** pide que los datos o recursos de la NASA sean centrales, no decorativos. Acá serían los recursos del HRP.
  - **Presentación:** pesa igual que los demás, y la guía insiste en no descuidarla.
- **Entrega:**
  - Resumen y descripción detallada.
  - Demo de **7 diapositivas como máximo o video de 30 segundos como máximo**. Todo en inglés; el video puede ser en otro idioma con subtítulos en inglés.
  - Link público al proyecto.
  - Lista de datos de la NASA usados (mínimo uno).
  - Referencias de todo lo externo.
  - Fecha límite: **15 de noviembre, 23:59** hora del evento local.
- **Ojo con la IA:** se puede usar para acelerar el desarrollo, pero las reglas dicen que **no debe usarse para generar la idea de cómo resolver el desafío**. Además, hay que declarar dónde se usó, y las imágenes generadas llevan marca de agua.

Guías oficiales: [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/) · [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/) · [Team Formation Guide](https://www.spaceappschallenge.org/resources/team-formation-guide/)
