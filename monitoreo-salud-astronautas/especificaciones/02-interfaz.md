# Especificación 02 — Interfaz: el recorrido del astronauta

| | |
|---|---|
| **Fecha** | 15 de noviembre de 2026 |
| **Para quién** | El agente que construye la aplicación web. |
| **De dónde sale** | `arquitectura.md` (secciones 1, 2, 6, 7 y 11), `decisiones-y-criterios.md` e `investigaciones/comunicar-resultados-de-salud.md`. |
| **Reglas generales** | `AGENTS.md`. Valen todas. |

## 0. Qué es y qué no

El producto le responde al astronauta, después de cada examen: **si la parte de atrás de su ojo cambió respecto de antes del vuelo, cuánto, qué tan seguro es ese resultado y qué corresponde hacer.** Cada pantalla existe porque un paso del proceso la produce. No es un panel de indicadores ni un documento: es una sesión guiada que termina en un resultado, una historia y un informe para el médico.

**Carpetas propias:** todo `apps/web/src/`, salvo `features/vision/` (pruebas de visión), `features/oct/` (captura y visor de la tomografía) y `features/assistant/` (asistente), que construyen otros. Para esas tres se deja un componente provisorio con las propiedades de la sección 6. No tocar `packages/`.

Ya existen y se usan tal cual: los textos en dos idiomas (`src/i18n`), las piezas compartidas (`src/ui`: nivel, número con unidad y rango, etiqueta de origen, botón, tarjeta, aviso de datos simulados, selector de idioma) y las variables de diseño (`src/styles/tokens.css`). El diseño es genérico a propósito: la identidad visual viene después y solo debería tocar `tokens.css`. No usar colores ni tamaños fuera de esas variables. Sin librerías nuevas de interfaz ni de gráficos: los gráficos son SVG propios.

## 1. Principios de comunicación

Vienen de `comunicar-resultados-de-salud.md` y son requisitos:

1. **Número siempre**, con unidad y rango; la palabra ("probable") va pegada al número, nunca sola.
2. **Línea numérica**, no tabla, para mostrar dónde cae un valor respecto de los umbrales.
3. **La referencia es el examen propio** de antes del vuelo.
4. **Color, forma y palabra juntos** en cada nivel; nunca el color solo.
5. **Cada dato dice cómo se obtuvo**: medido, calculado, estimado, informado por vos, referencia o no se puede medir a bordo.
6. **Los límites a la vista**: qué no mide, que no es un diagnóstico, que el médico en Tierra confirma y decide.
7. **Textos fijos**: los textos de un resultado salen de `explainAssessment` (núcleo). Los componentes no redactan resultados.
8. **Datos simulados**: el aviso se ve en toda pantalla con resultados o imágenes.

## 2. Pantallas

Navegación por *hash* (`#/…`), sin librería. Encabezado fijo: nombre del producto (de `PRODUCT`), tripulante elegido, día de la misión, idioma y aviso de datos simulados.

| Ruta | Pantalla | Qué responde |
|---|---|---|
| `#/` | Inicio | ¿Quién sos y qué control te toca hoy? |
| `#/session/:crew` | Sesión guiada | Los pasos del control de hoy, de a uno |
| `#/result/:crew/:day` | Resultado | Si cambió, cuánto, qué tan seguro y qué hacer |
| `#/history/:crew` | Historia | Cómo vino evolucionando cada ojo |
| `#/report/:crew/:day` | Conferencia médica | Qué le llevo al médico y qué le pregunto |
| `#/brain` | Qué se sabe del cerebro | Qué se sabe, qué solo se ve con resonancia y qué no se puede saber en misión |
| `#/how` | Cómo funciona | El proceso paso a paso, con sus fuentes, supuestos y validación |

### 2.1 Inicio

- **Día de la misión:** selector con los tres días del calendario de la NASA (30, 90 y 150; por defecto 150). Cambiarlo es "viajar" a ese control: la historia muestra solo lo anterior a ese día.
- **Cuatro tarjetas**, una por tripulante: nombre, función, nivel del último control (pieza de nivel) con su día, y el control de hoy. Botón principal: empezar el control de hoy. Si ya lo hizo en este navegador: ver el resultado.
- Accesos a "Qué se sabe del cerebro" y "Cómo funciona", y una acción para borrar lo guardado en este navegador.

### 2.2 Sesión guiada

Siete pasos con un indicador de avance. El orden es el de la serie de la NASA: primero lo funcional, después la imagen.

| # | Paso | Quién lo construye |
|---|---|---|
| 1 | Presentación del control: qué se va a hacer, cuánto lleva y contra qué se compara | Esta especificación |
| 2 | Cuestionario de síntomas | `features/vision` |
| 3 | Agudeza visual de cerca | `features/vision` |
| 4 | Grilla de Amsler | `features/vision` |
| 5 | Tomografía del ojo derecho | `features/oct` |
| 6 | Tomografía del ojo izquierdo | `features/oct` |
| 7 | Evaluación y paso al resultado | Esta especificación |

- Los pasos 2 a 4 se pueden saltear; queda registrado como "no hecho" y el resultado lo dice.
- Al terminar el paso 6 se llama a `assessSession`, se guarda el `SessionRecord` y se va al resultado.
- Si se recarga la página en medio de una sesión, se retoma desde el paso en que estaba.

### 2.3 Resultado

La pantalla más importante. De arriba hacia abajo:

1. **Titular** de la sesión (`Explanation.headline`) con la pieza de nivel en tamaño grande, y el resumen (`summary`).
2. **Una tarjeta por ojo:**
   - nivel y titular del ojo;
   - **la línea numérica del cambio** (sección 3.1), que es el centro de la tarjeta;
   - las líneas explicativas (`eyes[eye].lines`);
   - "Qué tan seguro": probabilidad de haber pasado cada umbral, con su palabra, y la calidad de la captura;
   - detalle desplegable: grosor de hoy y de antes del vuelo, otros anillos, ancho mínimo del anillo neural, rugosidad (pliegues), cada uno con su etiqueta de origen; y los intentos de captura con el motivo de cada rechazo;
   - si el ojo no se pudo medir: se dice arriba de todo, con el motivo, sin números.
3. **Pruebas de visión y síntomas** de hoy, comparadas con las de antes del vuelo; lo que no se hizo figura como "no hecho hoy".
4. **Qué hacer ahora:** los pasos (`nextSteps`), cada uno con su porqué y con una marca visible cuando es un supuesto de esta herramienta y no una regla de la NASA.
5. **Lo que esta herramienta no te dice** (`limitations`), con acceso a "Qué se sabe del cerebro".
6. Acciones: preparar la conferencia médica, ver la historia, volver al inicio.

### 2.4 Historia

- **Gráfico por ojo** (sección 3.2): cambio del grosor contra día de vuelo, con todos los controles, sus rangos y las franjas de los umbrales.
- **Lista de controles**, del más nuevo al más viejo: día, nivel de cada ojo, cambio con rango, calidad, intentos. Cada uno abre su resultado.
- Los controles hechos en este navegador se distinguen de los que vienen con la aplicación.

### 2.5 Conferencia médica

- El informe (`buildReport`), dibujado por secciones.
- **Mis preguntas para el médico:** lista editable; se pueden agregar las sugeridas (`suggestQuestions`). Se guardan en el `SessionRecord`.
- Bajar el informe como texto (`renderReportMarkdown`) e imprimirlo (estilos de impresión: fondo blanco, sin navegación).
- Arriba de todo: que es un resumen para la conversación con el médico, que confirma y decide.

### 2.6 Qué se sabe del cerebro y Cómo funciona

- **Cerebro:** tres columnas con lo que entrega `BRAIN_KNOWLEDGE` (núcleo): qué se sabe, qué solo se ve con resonancia antes y después del vuelo, y qué no se puede saber en misión, cada afirmación con su fuente. El contenido lo escribe el coordinador; acá va la pantalla.
- **Cómo funciona:** el proceso en ocho pasos (leer el examen, controlar la calidad, marcar dos bordes, ubicar la abertura del nervio, medir, comparar, calcular la incertidumbre, clasificar y decidir), cada uno con su método y su respaldo, tomados de la sección 5 de `arquitectura.md`; la lista de supuestos nuestros (sección 12); y un lugar para los resultados de validación, que llegan después. Tiene que quedar claro qué es real (el proceso) y qué es ficticio (los datos y el instrumento).

## 3. Dos gráficos propios

### 3.1 Línea numérica del cambio (`ChangeScale`)

Eje horizontal en micrómetros: "cambio respecto de tu examen de antes del vuelo".

- **Rango del eje:** de −20 a +80 por defecto; si el valor o su rango no entran, se extiende a +140 o a +260. El eje siempre empieza en un valor redondo y muestra el 0.
- **Franjas de fondo**, con su nombre escrito: variación normal (hasta 19,4), primer indicio (de 19,4 a 55) y clínicamente preocupante (55 o más). Las dos líneas de umbral llevan su valor y la palabra "NASA".
- **Valor de hoy:** marca grande con el número, y su rango como una barra horizontal.
- **Controles anteriores:** marcas chicas y tenues con su día.
- **El 0** va rotulado "antes del vuelo".
- Texto alternativo que diga lo mismo en una oración. Nada depende solo del color: las franjas tienen nombre y borde.

### 3.2 Evolución (`HistoryChart`)

Eje horizontal: día de vuelo, de 0 a 180, con los días de rutina marcados. Eje vertical: cambio en micrómetros, con las mismas franjas. Una serie por ojo (distinta forma de marca y de línea, además del color), cada punto con su barra de rango; los controles sin medición se marcan aparte. Al pasar o enfocar un punto: día, valor, rango y nivel. Tabla equivalente accesible debajo.

## 4. Estado y datos

- **Del núcleo** (`@app/core`): `MISSION`, `CREW`, `getHistory(crewId, beforeFlightDay)`, `assessSession`, `explainAssessment`, `buildReport`, `renderReportMarkdown`, `suggestQuestions`, `BRAIN_KNOWLEDGE` y los tipos de `contract.ts`. Las funciones de reglas y la historia las está construyendo otro agente en paralelo, con las firmas de `especificaciones/04-reglas-y-textos.md`: el coordinador avisa cuando están en `master` para unirlas. **Hasta entonces, empezar por lo que no depende de ellas**: estructura, navegación, inicio, indicador de pasos, los dos gráficos (con valores de ejemplo de los tipos del contrato) y el guardado.
- **Guardado local:** los `SessionRecord` hechos en este navegador, la sesión en curso y el día de misión elegido, en `localStorage`, con versión de formato. Los datos de salud no salen del dispositivo: ningún pedido de red los lleva.
- **Historia que se muestra** = la del núcleo anterior al día elegido, más las sesiones locales.

## 5. Accesibilidad y pantalla

Requisitos, tomados de la norma de pantallas de la NASA citada en `comunicar-resultados-de-salud.md`, y porque el síndrome empeora la visión de cerca:

- Contraste del texto de 10:1 o más contra su fondo; nunca menos de 6:1. Texto de lectura de 18 px o más.
- Todo se opera con teclado, con el foco siempre visible y en orden. Zonas de toque de 44 px o más.
- Nivel = color + forma + palabra. Gráficos con texto alternativo y tabla equivalente.
- Respetar `prefers-reduced-motion`.
- Pensado para una computadora portátil; tiene que poder usarse en una tableta y en un teléfono (una columna).
- `lang` correcto en cada idioma; títulos en orden; regiones con nombre.

## 6. Contratos con las piezas de otros

Componentes provisorios hasta que llegue el real; el provisorio muestra qué va ahí y devuelve un resultado de ejemplo con un botón.

```ts
// features/vision — cuestionario, agudeza y grilla de Amsler
function SymptomsStep(props: { onComplete(answers: SymptomAnswers): void; onSkip(): void }): JSX.Element;
function AcuityStep(props: {
  onComplete(result: { calibration: ScreenCalibration; OD: AcuityResult; OS: AcuityResult }): void;
  onSkip(): void;
}): JSX.Element;
function AmslerStep(props: {
  calibration: ScreenCalibration | null;
  onComplete(result: { OD: AmslerResult; OS: AmslerResult }): void;
  onSkip(): void;
}): JSX.Element;

// features/oct — captura y análisis de un ojo, con hasta tres intentos
function OctCaptureStep(props: {
  crewId: CrewId;
  eye: Eye;
  flightDay: number;
  baseline: ExamSummary;          // examen de antes del vuelo de ese ojo
  onComplete(result: EyeCaptureResult): void;
}): JSX.Element;

// features/assistant — panel lateral de preguntas, opcional
function AssistantPanel(props: { record: SessionRecord | null }): JSX.Element;
```

## 7. Pruebas

- Lógica sin interfaz (rutas, guardado con versión, armado de la historia, escalas de los gráficos): pruebas unitarias con Vitest.
- Cada pantalla se abre sin errores en los dos idiomas con datos de ejemplo.
- `pnpm verify` y `pnpm build` en verde.
- Recorrer la aplicación en el navegador integrado, en inglés y en español, y a 390 px de ancho.

## 8. Orden y entrega

1. Estructura, navegación, encabezado e inicio. Commit.
2. Los dos gráficos, con pruebas de sus escalas. Commit.
3. Sesión guiada con los componentes provisorios, y guardado. Commit.
4. Resultado, historia, conferencia médica, cerebro y cómo funciona, a medida que lleguen las funciones del núcleo. Commit por pantalla.

Commits chicos con rutas explícitas y `pnpm verify` en verde. Informe final corto: commits, qué quedó funcionando de punta a punta, qué quedó provisorio y por qué, y lo que se vea flojo.
