# Especificación 04 — Reglas, textos, historia provisoria e informe

| | |
|---|---|
| **Fecha** | 15 de noviembre de 2026 |
| **Para quién** | El agente que construye las reglas del producto. |
| **De dónde sale** | `arquitectura.md` (secciones 6, 7 y 12), `decisiones-y-criterios.md`, `investigaciones/sans-evolucion-y-logica-clinica.md` (Tabla B y secciones 5 y 6), `investigaciones/pruebas-de-vision-en-pantalla.md` e `investigaciones/comunicar-resultados-de-salud.md`. |
| **Reglas generales** | `AGENTS.md`. Valen todas. |

## 0. Alcance

Todo es lógica pura en `packages/core`, sin interfaz. **Carpetas propias:** `packages/core/src/rules/`, `texts/`, `report/`, `dataset/`, el archivo `mission.ts` y sus pruebas en `packages/core/test/`. No tocar `vol/`, `eye/`, `instrument/`, `engine/` (los construye otra sesión), ni `apps/`. Los tipos ya están en `packages/core/src/contract.ts`: se pueden agregar campos opcionales; cambiar o quitar algo, solo preguntando al coordinador.

La interfaz se está construyendo en paralelo y espera estas funciones. **Lo primero que se entrega (con commit) son `mission.ts`, `assessSession`, la historia provisoria y `explainAssessment`**; el informe va después.

## 1. Misión y tripulación (`mission.ts`)

Exporta `MISSION` y `CREW` con los datos de la sección 4 de `01-nucleo.md` (nombres, función en inglés y español, edad, sexo, `patientId`, misión de 180 días, lanzamiento 2026-05-20, controles de rutina en los días 30, 90 y 150). Es provisorio: el núcleo va a exportar los mismos nombres y este archivo se retira al unir.

## 2. Umbrales (`rules/thresholds.ts`)

| Constante | Valor | Qué es | Fuente |
|---|---|---|---|
| `TRT_FIRST_SIGN_UM` | 19,4 | Un aumento **mayor** a este valor es el primer indicio de hinchazón. Es dos desvíos de la variación normal entre sesiones (un desvío: 9,7 µm) | Laurie 2020 (`laurie2020`); la tabla de la NASA lo redondea a "≥ 20" |
| `TRT_CLINICALLY_CONCERNING_UM` | 55 | Un aumento **igual o mayor** es clínicamente preocupante | Informe técnico de la NASA 2024 (`nasa-mtb-2024`), Brunstetter 2024, Nguyen 2025 |
| `BM_ROUGHNESS_FOLDS_UM` | 2,8 | Un aumento de rugosidad **mayor** indica pliegues nuevos. Es dos desvíos de la repetibilidad junto al nervio | Ferguson 2023 (`ferguson2023`) |
| `ACUITY_REAL_CHANGE_LOGMAR` | 0,2 | Un empeoramiento **mayor o igual** respecto del valor de antes del vuelo se toma como real. La variación entre una prueba y su repetición es de ±0,17 con 18 presentaciones | `pruebas-de-vision-en-pantalla.md`, 1.C y 2. El umbral es **supuesto nuestro**: la NASA no publica uno |
| `AMSLER_EXTENSIVE_FRACTION` | 0,05 | Fracción marcada de la grilla desde la cual se trata como síntoma agudo | **Supuesto nuestro** |

Cada constante lleva su fuente en un comentario y su identificador en `sources`.

## 3. Modelo de error (`rules/errorModel.ts`)

La probabilidad de haber pasado un umbral sale del error de medición del motor, que la etapa de validación va a medir. Hasta entonces se usa un modelo provisorio, claramente marcado:

```ts
interface ErrorModel {
  version: string;
  /** Standard error of the change of the 0–250 µm ring between two exams. */
  trtChangeSeUm(current: ExamQuality, baseline: ExamQuality): number;
  roughnessChangeSeUm(current: ExamQuality, baseline: ExamQuality): number;
}
const PROVISIONAL_ERROR_MODEL: ErrorModel;
```

Provisorio: error de un examen = 3 µm con calidad media de 27 dB o más, y sube en línea recta hasta 6 µm en 15 dB; el del cambio es la raíz de la suma de los cuadrados de los dos exámenes. Rugosidad: 0,8 µm por examen. `assessSession` recibe el modelo como parámetro opcional (por defecto, el provisorio), para cambiarlo sin tocar las reglas.

## 4. Evaluación (`rules/assess.ts`)

```ts
interface AssessmentInput {
  crewId: CrewId;
  flightDay: number;
  eyes: { OD: EyeCaptureResult; OS: EyeCaptureResult };
  vision: VisionSession | null;
  /** Earlier sessions of this crew member, oldest first. The first one is the pre-flight session (flight day 0). */
  history: readonly SessionRecord[];
}
function assessSession(input: AssessmentInput, errorModel?: ErrorModel): SessionAssessment;
```

### 4.1 Cada ojo

1. Si no hay examen aceptado: `measured: false`, `level: null`, hallazgo `eye-not-measured`.
2. Cambio respecto del examen de antes del vuelo del mismo ojo (`history[0]`): diferencia del anillo de 0 a 250 µm, de los otros anillos, del MRW y de la rugosidad, como `Quantity` con `origin: 'derived'`, `standardError` del modelo de error e `interval95` = valor ± 1,96 × error.
3. Umbrales (`ThresholdAssessment`): `exceeded` se decide **sobre el valor medido**, tal como está escrito el criterio de la NASA. `probabilityExceeded` = Φ((cambio − umbral) / error), con Φ la normal acumulada. Palabra: menos de 10 % `unlikely`; de 10 a 50 % `possible`; de 50 a 90 % `likely`; 90 % o más `very-likely`.
4. Nivel: `clinically-concerning` si el cambio del anillo es ≥ 55; si no, `first-sign` si es > 19,4 o si hay pliegues nuevos; si no, `no-detectable-change`.
5. `borderline`: algún umbral con probabilidad entre 10 y 90 %.
6. `sincePrevious`: diferencia con el control anterior de ese ojo, si lo hay.

### 4.2 Pruebas de visión y síntomas

| Condición | Hallazgo | Efecto |
|---|---|---|
| `sudden-vision-loss` o `new-dark-spot` presentes | `symptom-acute` | Nivel `acute-visual-symptom`, contacto `now` |
| Grilla de Amsler con marcas en los 2° centrales, o fracción marcada ≥ 0,05 | `amsler-marked-central` | Nivel `acute-visual-symptom`, contacto `now` |
| Grilla de Amsler con otras marcas | `amsler-marked` | Contacto `without-delay` |
| Cualquier síntoma de visión con grado `severe`, o `distortion`, `double-vision` o `transient-vision-loss` presentes | `symptom-other` | Contacto `without-delay` |
| Agudeza de cerca que empeora 0,2 logMAR o más contra la de antes del vuelo (y el resultado no está limitado por la pantalla), o `near-vision` presente | `near-vision-worse` / `symptom-near-blur` | Paso `try-stronger-glasses`; va en el informe |
| `headache` presente | `symptom-headache` | Se registra. No cambia el nivel ni se afirma relación con el ojo. Si es `severe`: contacto `without-delay` |

Todo lo de esta tabla, salvo el significado de un positivo en la grilla (NASA), es **supuesto nuestro**.

### 4.3 Sesión

- `level`: el mayor de los dos ojos, o `acute-visual-symptom` si lo pide 4.2. `alert` = `alertForLevel(level)`.
- `contact`: `now` si hay nivel agudo; `without-delay` si algún ojo es `clinically-concerning` o lo pide 4.2; si no, `routine-report`.
- **Próxima tomografía** (`nextOct`), con el nivel de imagen más alto entre **este control y el anterior** (una vez que aparece un indicio, se sostiene la vigilancia un control más; supuesto nuestro):

| Nivel | Próxima tomografía | Grilla de Amsler | Base |
|---|---|---|---|
| Sin cambio detectable | Próximo día de rutina (30, 90, 150) | En cada control | NASA |
| Primer indicio | A los 28 días | 2 veces por semana | Supuesto nuestro, basado en el único caso publicado (Brunstetter 2024: tomografía cada 3 a 6 semanas, grilla varias veces por semana) |
| Clínicamente preocupante | A los 21 días | 3 veces por semana | Ídem |
| Algún ojo sin medir | A los 7 días como máximo | La que corresponda | Supuesto nuestro |

  Si un día de rutina cae hasta 7 días después de la fecha calculada, se toma el día de rutina. Si la fecha supera el día 180, `nextOct` es `null` y se agrega el paso `post-flight-exams` (la NASA examina entre 1 y 3 días después de volver).
- `nextSteps`: los pasos que resultan, en orden de urgencia, cada uno con `basis` (`nasa` o `assumption`) y fuentes. **Nunca** un paso de medicación.
- `limitations`: siempre `not-a-diagnosis`, `simulated-data`, `not-validated-on-people`, `ground-confirms`, `no-intracranial-pressure`, `no-choroid`, `no-macula`, `no-globe-flattening` y `no-refraction`.
- `rulesVersion`: cadena fija, que cambia cuando cambian las reglas.

La función es pura: la misma entrada da la misma salida.

## 5. Textos (`texts/`)

```ts
interface Explanation {
  headline: string;                 // una oración: el resultado de la sesión
  summary: string[];                // dos a cuatro oraciones
  eyes: Record<Eye, { headline: string; lines: string[] }>;
  nextSteps: { id: NextStepId; text: string; why: string; basis: 'nasa' | 'assumption' }[];
  limitations: { id: LimitationId; text: string }[];
}
function explainAssessment(assessment: SessionAssessment, locale: Locale): Explanation;
```

Los textos salen de plantillas fijas en inglés y en español: el mismo resultado da siempre el mismo texto. Reglas de redacción, de `comunicar-resultados-de-salud.md`:

- El número va siempre con su unidad y su rango, y la palabra de probabilidad va **pegada** al número, nunca sola: *"Your right eye's retina next to the optic nerve is 24 µm thicker than before the flight (range 18 to 30). That is above NASA's first-sign threshold of 19.4 µm. It is likely (87 %) that the change is real."*
- La referencia es el examen propio de antes del vuelo, no un valor de población.
- Segunda persona, oraciones cortas, sin siglas sin explicar. En español, rioplatense de vos. "Hinchazón del nervio óptico", no "edema de papila".
- Decir qué significa y qué no: que pasar un umbral **no es un diagnóstico**; que en la mayoría de los casos no da síntomas; que el médico en Tierra confirma y decide.
- Sin alarmar ni tranquilizar de más: nada de "no te preocupes", nada de "grave". En `no-detectable-change` con `borderline`, decir que quedó cerca del umbral y que el próximo control lo va a mostrar.
- Cuando un ojo no se pudo medir, decirlo así: *"I could not measure your left eye today"*, con el motivo en palabras simples.
- Cada paso lleva su porqué, y si es supuesto nuestro lo dice: *"NASA does not publish how often to repeat the scan after a first sign. This interval is this tool's own rule, based on the one published case."*
- Prohibido: nombres de medicamentos, dosis, "diagnóstico" como afirmación, y cualquier frase sobre la presión dentro del cráneo que no sea que no se puede medir a bordo.

## 6. Historia provisoria (`dataset/provisional.ts`)

Mientras no exista la historia calculada por el motor real:

```ts
function getHistory(crewId: CrewId, beforeFlightDay: number): SessionRecord[]; // incluye la sesión de antes del vuelo (día 0)
```

- Arma los `ExamSummary` de cada control con las tablas de la sección 4 de `01-nucleo.md` (anatomía de referencia, `E(d)`, rugosidad), más un error de medición chico y determinístico (semilla por tripulante, ojo y día; desvío de 2,5 µm en el anillo). Calidad media entre 27 y 33 dB.
- Los controles salen de **simular el calendario con las propias reglas**: se empieza por los días de rutina y cada evaluación decide el control siguiente. Resultado esperado, aproximado: A en 30, 90 y 150; B en 30, 90, 118 y 150; C en 30, 58, 90, 118, 139 y 150; D en 30, 51, 72, 90, 111, 132 y 150.
- Agudeza de cerca de antes del vuelo, ficticia: A 0,00 / 0,02 · B 0,06 / 0,04 · C 0,10 / 0,12 · D −0,04 / −0,02 logMAR (OD / OS). Sesiones anteriores: sin síntomas y con la grilla sin marcas, salvo `near-vision` leve en B y C desde el día 90 (lo más común en vuelos largos).
- Cada registro lleva `origin: 'precomputed'` y todo va marcado como provisorio en el código, para reemplazarlo sin tocar a quien lo usa.

## 7. Informe para la conferencia médica (`report/`)

```ts
function buildReport(record: SessionRecord, history: readonly SessionRecord[], locale: Locale): Report;
function renderReportMarkdown(report: Report): string;
function suggestQuestions(assessment: SessionAssessment, locale: Locale): string[];
```

`Report` es una estructura de secciones (título, párrafos y tablas con celdas `Quantity` o texto), para que la interfaz la dibuje y también se pueda bajar como texto. Secciones: identificación (con la marca de datos simulados); resumen del control; por ojo: intentos de captura y calidad, medidas de hoy, cambio contra antes del vuelo con su rango, umbrales y probabilidad, y evolución de los controles anteriores; pruebas de visión y síntomas; próximos pasos, con cuáles son supuesto nuestro; límites de la herramienta; versiones del motor y de las reglas; preguntas del tripulante.

`suggestQuestions` propone hasta cinco preguntas para el médico, por plantilla, según los hallazgos (por ejemplo, ante un primer indicio: *"How often should I repeat the scan from now on?"*).

## 8. Pruebas

| Qué | Criterio |
|---|---|
| Bordes de umbral | 19,4 no pasa y 19,5 sí; 54,9 es primer indicio y 55,0 es clínico; 2,8 no es pliegue y 2,9 sí |
| Probabilidad y palabra | Valores conocidos de Φ; los cuatro tramos y sus bordes |
| Calendario | Los cuatro niveles, la unión con el día de rutina, el fin de la misión y la vigilancia sostenida un control más |
| Pruebas de visión | Cada fila de la tabla 4.2 |
| Ojo sin medir | Un ojo y los dos |
| Textos | Para cada nivel y cada idioma: aparecen el número, la unidad y el rango; ningún texto contiene palabras prohibidas; los dos idiomas tienen la misma estructura; la misma evaluación da el mismo texto |
| Historia provisoria | Determinística; el calendario simulado da los controles esperados; A nunca pasa el umbral y D es clínico desde el día 30 |
| Todo junto | `pnpm verify` |

## 9. Entrega

Commits chicos con rutas explícitas. Informe final corto: commits, cantidad de pruebas, decisiones tomadas fuera de esta especificación, supuestos nuevos y dudas sobre la redacción. Los textos los revisa el coordinador: dejar en el informe los tres o cuatro que más dudas generaron.
