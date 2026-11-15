# Especificación 06 — Captura de la tomografía y visor del examen

| | |
|---|---|
| **Fecha** | 15 de noviembre de 2026 |
| **Para quién** | El agente que construye el paso de la tomografía y el visor de imágenes. |
| **De dónde sale** | `arquitectura.md` (secciones 2 a 5), `especificaciones/01-nucleo.md` (qué entrega el núcleo), `especificaciones/02-interfaz.md` (dónde se monta) y `packages/core/NOTES.md`. |
| **Reglas generales** | `AGENTS.md`. Valen todas. |

## 0. Qué es

Es el paso donde se ve trabajar al producto. El astronauta pide la tomografía de un ojo; el instrumento virtual toma los 48 cortes; el análisis marca los bordes de la retina, ubica la abertura del nervio y mide, **a la vista**; y el sistema decide si la captura sirve o hay que repetirla. Nada de esto es una animación: cada imagen y cada línea que aparece es lo que el instrumento y el motor produjeron en ese momento.

**Carpeta propia:** `apps/web/src/features/oct/`. No tocar el resto. El resto de la aplicación lo construye otro agente y monta lo que exportes.

**Qué exporta** (`features/oct/index.ts`):

```ts
// Paso de la sesión guiada: captura y análisis de un ojo, con hasta tres intentos.
function OctCaptureStep(props: {
  crewId: CrewId;
  eye: Eye;
  flightDay: number;
  baseline: ExamSummary;                       // examen de antes del vuelo de ese ojo
  onComplete(result: EyeCaptureResult): void;  // tipos en packages/core/src/contract.ts
}): JSX.Element;

// Visor de un examen ya hecho, para el resultado y la historia. Lo vuelve a generar desde su pedido.
function ExamViewer(props: { request: CaptureRequest; baseline?: ExamSummary }): JSX.Element;

// Página de desarrollo, para probar las dos piezas sin el resto: #/dev/oct
function DevOctPage(): JSX.Element;
```

## 1. Qué da el núcleo

Desde `@app/core`: `acquire(request)` devuelve un `ExamSource` (cabecera, imagen de fondo y cada corte cuando se pide); `toDisplayGray(pixels)` convierte un corte a grises para mostrarlo; `writeVolBlocks(exam)` entrega el archivo `.vol` por bloques; `groundTruth(crewId, eye, flightDay)` da el valor verdadero del ojo ficticio. Todo es determinístico: el mismo pedido da la misma imagen, y un corte suelto es igual al del examen completo.

**El motor todavía no está en `master`** (lo termina otra sesión dentro de la hora). Va a exportar, con los tipos que ya están en `contract.ts`:

```ts
function analyzeExamSteps(exam: ExamSource, options?: { baseline?: ExamSummary; onScan?: (scan: ScanAnalysis) => void }): Generator<AnalysisProgress, ExamAnalysis>;
function summarize(analysis: ExamAnalysis): ExamSummary;
```

Hasta que llegue, se trabaja contra esa firma con un sustituto propio, aislado en un solo archivo y marcado como provisorio, que devuelva resultados con la forma del contrato. El coordinador avisa cuando el motor real esté en `master`; el cambio tiene que ser de una línea.

## 2. Hilo de trabajo

Generar y analizar un examen lleva varios segundos y mueve unos 78 MB: va en un *Web Worker*, nunca en el hilo de la pantalla.

- El hilo recibe el pedido y el examen de referencia, y devuelve mensajes a medida que avanza: la imagen de fondo; cada corte ya convertido a grises con lo que marcó el motor (bordes, puntos de la abertura, calidad, si sirve y por qué no); y al final el análisis completo.
- Los cortes se pasan sin copiar (*transferable*). En pantalla se guardan como grises de un byte por píxel (unos 18 MB por examen), no como imágenes a color.
- Se puede cancelar: al salir del paso o al pedir otro intento, el hilo se termina.
- Si el navegador no puede crear el hilo, el paso lo dice y ofrece continuar sin imagen; el ojo queda como no medido.

## 3. El paso de captura

| Estado | Qué se ve |
|---|---|
| Listo | Qué ojo, qué se va a hacer y cuánto tarda. Botón para capturar. Si no es el primer intento: cuál es y por qué se repite |
| Capturando y analizando | A la izquierda, la imagen de fondo con el patrón en estrella: el corte que se está tomando resaltado y los ya tomados marcados según si sirven. A la derecha, el corte actual, con los bordes que marcó el motor dibujados encima apenas están. Abajo, 48 barras de calidad en decibeles con la línea de 15 dB. Y el paso del proceso en palabras: tomando cortes, marcando bordes, ubicando la abertura del nervio, midiendo |
| Captura aceptada | Cuántos cortes sirvieron, calidad media, la elipse de la abertura sobre la imagen de fondo y los anillos de medición. Botón para seguir y acceso al visor |
| Captura rechazada | **Por qué**, en palabras simples, y qué hacer distinto. Botón para repetir, con el número de intento (de 3) |
| Tres intentos sin éxito | "No puedo medir este ojo hoy", con el motivo. Queda registrado y se sigue |

- Cada intento es un pedido con `attempt` 1, 2 o 3 y sin `conditions`: las condiciones salen del escenario. Hay tres capturas guionadas que fallan en el primer intento (tabla 5.5 de `01-nucleo.md`), para que el pedido de repetir se vea de verdad.
- **Motivos en palabras simples**, en los dos idiomas, para cada `ExamRejection` y `ScanRejection` del contrato. Por ejemplo, muchos cortes con `signal-dropout`: "Several scans lost the signal across a band of the image, which is what a blink does. Keep the eye open and capture again." Si el núcleo ya trae textos para estos motivos (`packages/core/src/texts`), usar esos.
- `onComplete` recibe el `EyeCaptureResult`: todos los intentos (`CaptureAttemptRecord`) y el examen aceptado resumido con `summarize`, o `null`.
- El paso no decide niveles ni muestra el resultado clínico: eso lo hacen las reglas, después.

## 4. El visor

Se abre desde la captura aceptada, y `ExamViewer` lo ofrece suelto.

- **Recorrer los 48 cortes** con un control deslizante, las flechas del teclado y tocando un radio del patrón en la imagen de fondo.
- **Capas que se prenden y se apagan:** superficie de la retina, membrana de base, puntos de la abertura, límites de los cuatro anillos y la zona del anillo principal resaltada. Con todo apagado se ve la imagen sola.
- **Imagen de fondo** con el patrón, el corte elegido, los puntos de la abertura de todos los cortes y la elipse ajustada.
- **Comparar con antes del vuelo:** el mismo corte del examen de referencia al lado, con sus bordes; y la diferencia de grosor a la vista.
- **De dónde sale el número:** al elegir una medida (por ejemplo, el grosor del anillo principal), el visor muestra qué columnas de qué cortes entraron en ese promedio.
- **Control de la simulación**, plegado y rotulado como tal: el valor verdadero del ojo ficticio (`groundTruth`) al lado del medido, con la diferencia. Explica que solo existe porque el ojo es simulado y que así se mide el error del análisis.
- **Bajar el examen** en el formato `.vol` del equipo real, armado con `writeVolBlocks`, avisando el tamaño (unos 78 MB).
- Toda imagen lleva la marca de datos simulados y un texto alternativo que diga qué muestra.

## 5. Requisitos

- Lienzos (*canvas*) nítidos en pantallas de alta densidad; el corte mantiene su proporción y se puede ver a tamaño real.
- Todo con teclado, foco visible, y sin depender del color: cada capa tiene nombre y trazo distinto.
- Respeta `prefers-reduced-motion`: sin él, el avance se ve corte a corte; con él, por tramos.
- Funciona en una computadora portátil común; en teléfono puede tardar más, pero no tiene que romperse ni quedarse sin memoria.
- Textos con `src/i18n`, piezas de `src/ui`, variables de `styles/tokens.css`. Sin librerías nuevas.

## 6. Pruebas

- Lógica sin interfaz, con Vitest: la máquina de estados de los intentos; el paso de coordenadas entre el corte, la pantalla y la imagen de fondo; el armado de `CaptureAttemptRecord` y `EyeCaptureResult`; la elección del motivo principal de un rechazo.
- El protocolo del hilo de trabajo, con tipos compartidos por los dos lados.
- `pnpm verify` y `pnpm build` en verde.
- En el navegador integrado de Orca, en los dos idiomas: una captura que sale bien (por ejemplo B, ojo derecho, día 90), una guionada que falla y se repite (B, ojo izquierdo, día 150), el visor completo, y el recorrido con teclado solo. Medir cuánto tarda un examen y cuánta memoria usa, y ponerlo en el informe.

## 7. Orden y entrega

1. Hilo de trabajo y página de desarrollo con un corte en pantalla. Commit.
2. Paso de captura con sus estados y el sustituto del motor. Commit.
3. Visor. Commit.
4. Cuando llegue el motor real: reemplazo del sustituto y ajuste. Commit.

Commits chicos con rutas explícitas. Informe final corto: commits, pruebas, tiempos y memoria medidos, qué quedó con el sustituto y lo que se vea flojo.
