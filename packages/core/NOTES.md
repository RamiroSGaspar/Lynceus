# Notas del núcleo (`packages/core`)

Bitácora de la construcción del núcleo según `monitoreo-salud-astronautas/especificaciones/01-nucleo.md`.
Si la sesión se corta, se sigue desde acá: qué hay, qué se decidió, qué cambió respecto de la
especificación y qué falta.

## Estado

| Paso (sección 10) | Estado |
|---|---|
| 1. Azar, matemática y formato `.vol` | Hecho |
| 2. Ojo virtual, tripulación y valor verdadero | Hecho |
| 3. Instrumento virtual y `preview` | Hecho |
| 4. Motor | Hecho |
| 5. `accuracy`, precisión, rechazo y rendimiento | Hecho |
| 6. Historia y referencias medidas por el motor (especificación 07) | Hecho |
| 7. Validación sintética del error y modelo de error (especificación 08) | Hecho; modelo **no activado** |

**Resultados** (`packages/validation/out/accuracy.md`): cambio del anillo 0–250 µm con error ≤ 6 µm en
32 de 32 casos, error máximo 0,7 µm, RMS 0,24 µm; cambio de rugosidad con error máximo 0,36 µm. Sin
ruido (prueba 5), en los 8 ojos: anillo ≤ 0,7 µm, MRW 1,7 a 6 µm, área ≤ 0,6 %, centro ≤ 3 µm. Un examen
completo (dibujo, fondo de ojo y análisis) tarda ~6 s con la máquina tranquila y 8,9 s con carga.
Pruebas: 130 en `packages/core` y 9 en `packages/validation`.

**Cuidado al leer esa precisión:** es el error del motor contra un ojo virtual dibujado por nuestro
propio instrumento, con el mismo modelo de capas que el motor espera. Las imágenes reales tienen
variaciones que acá no existen (anatomía irregular, opacidades, vasos dentro de la copa que tapan la
superficie, artefactos de seguimiento). No es una validación con personas; el margen que vea el
astronauta no puede salir solo de este número.

## Historia medida (especificación 07)

`getHistory` ya no sale de tablas: el examen de antes del vuelo de cada ojo y cada control se generan con
`acquire` y se miden con `analyzeExam` (los mismos pedidos y opciones que la captura en vivo de la web), y
los controles reciben como `baseline` el resumen medido del día 0 del mismo ojo. Se corre a mano:

```
pnpm --filter @app/validation history:generate            # calcula todo y publica el archivo (~2,5 min, 2 hilos)
pnpm --filter @app/validation history:check               # recalcula y compara con el archivo publicado
pnpm --filter @app/validation history:generate -- --crew A,B --concurrency 1   # prueba parcial, no publica
```

- Hasta tres intentos por ojo y sesión, también el día 0; se detiene en el primer examen aceptado y se
  guardan todos los intentos realizados. Un ojo sin ningún intento medido queda sin medida (`accepted: null`);
  si pasa en el día 0 el generador se detiene y no publica.
- El calendario lo deciden las reglas con las medidas (`assessment.nextOct`), con avance estricto y sin
  ciclos (si no, el generador falla). Con las medidas reales salió el mismo calendario que el provisorio:
  A 0, 30, 90, 150; B 0, 30, 90, 118, 150, 178; C 0, 30, 58, 90, 118, 139, 150, 171; D 0, 30, 51, 72, 90, 111, 132, 150, 171.
- El archivo guarda los `SessionRecord` completos (resúmenes, intentos con su pedido, visión ficticia y
  evaluación) y las versiones del motor, las reglas, el modelo de error y los formatos del instrumento. No
  guarda `.vol`, píxeles ni arreglos por corte. Se publica solo cuando todo terminó y pasó
  `checkHistoryDataset`: se escribe en `.tmp/` y se mueve a su lugar.
- Determinista: el mismo código da los mismos bytes (comprobado con una segunda corrida completa). Entre
  motores de JavaScript distintos las normales podrían diferir en el último bit (decisión 6). Si cambian el
  motor, el instrumento, las reglas o la versión del modelo de error hay que volver a generarlo:
  `checkHistoryDataset` falla si las evaluaciones guardadas ya no son las que dan las reglas, y la prueba de
  versiones falla si cambia `ENGINE_VERSION`, `RULES_VERSION` o la versión del modelo de error.
- No hay caché de capturas: cada corrida genera y analiza todo.
- **Límites:** esto no es una validación. El modelo de error sigue siendo el provisorio
  (`provisional-1`) y cada resultado lo sigue diciendo. La calidad media de cada examen sale ~25 dB (cambio 1
  abajo), por debajo de los 27 dB del modelo provisorio, así que sus rangos son algo más anchos que los de
  la tabla provisoria de antes. El instrumento no tiene una versión propia (supuesto 14 de `arquitectura.md`).
  La visión de cada control es un escenario ficticio, no sale de la tomografía.
- Los registros viejos guardados en un navegador por la versión provisoria llevan `PROVISIONAL_ENGINE_VERSION`
  y la pantalla de resultado sigue avisando que sus números no se midieron sobre una imagen; no se renombran
  ni se borran.

## Validación sintética del error (especificación 08)

Protocolo versionado `sim-validation-protocol-1` en `packages/validation/protocol.md`, escrito y
guardado antes de generar la muestra. Se corre a mano:

```
pnpm --filter @app/validation quality:run            # mide la matriz (621 capturas, ~28 min con 2 hilos)
pnpm --filter @app/validation quality:fit            # elige, ajusta, calibra y evalúa la prueba final (~1 s)
pnpm --filter @app/validation quality:fit -- --check # compara con lo publicado
```

- `quality:run` escribe `out/quality-rows.json` (una fila por captura: pedido, estado, motivos,
  características del motor, medidas y, aparte, el valor verdadero; sin píxeles; ~770 KB) y
  `out/quality-run.md` (tiempos). Caché por captura en `.tmp/quality-cache/<protocolo>/<motor>/<instrumento>/`,
  con clave por pedido y referencia. El motor se corre con el modelo provisorio, que no rechaza nada
  propio: las filas guardan solo los rechazos del motor.
- `quality:fit` escribe `out/quality-validation.md` (informe completo) y
  `src/dataset/validation-summary.json` (`VALIDATION_SUMMARY`, lo que muestra "Cómo funciona", con los
  coeficientes). Una prueba de `packages/validation` comprueba que los dos son lo que da el comando.
- La segunda corrida sin caché se interrumpió al pausar el trabajo. El archivo conservado
  coincide byte a byte con la primera corrida (SHA-256 `44510818ce6e49bc9545a7bc551faa3abb5d36e76c7e8a616ef1cbc26970b394`);
  esto comprueba que se preservó el resultado, no que terminara la segunda corrida ni su
  reproducibilidad. El cierre usa la primera corrida, sin repetir el experimento.
- **Resultado:** 8 ojos, 16 referencias, 621 capturas. Prueba P1 (tripulante C): 78 pares, cobertura
  del rango del 95 % de 98,7 % en TRT y 97,4 % en rugosidad, pero error máximo 8,9 µm y 3,0 µm (tolerancias
  6 y 1,5) y 21 % de capturas limpias de C fuera del dominio (residuo de la elipse mayor que el visto en
  desarrollo). Prueba P2 (fallas nuevas): solo 24 pares (el borde apagado sale entero del dominio por
  columnas sin borde), cobertura 79 % en rugosidad. **No se activa**: `ACTIVE_ERROR_MODEL` sigue siendo el
  provisorio, la historia no cambia y el texto "provisorio" se mantiene.
- **Defectos del motor encontrados (no se tocaron, especificación 08):** capturas que el motor acepta con
  errores grandes del cambio de TRT, hasta 7,9 µm en desarrollo y 11,5 µm en P2: parpadeos de 6 a 10
  cortes, truncamiento en un subconjunto de cortes y movimiento. El movimiento leve (0,1–0,3) que el motor
  acepta suma en promedio +1,2 a +1,6 µm de rugosidad (máximo 3,45 µm, más que el umbral de pliegues de
  2,8 µm): puede dar "pliegues nuevos" falsos. El índice de calidad no anticipa el error (su coeficiente
  sale negativo solo): los peores errores están en capturas de ≥ 24 dB. Hay 15 pares aceptados fuera de
  tolerancia en TRT y 20 en rugosidad.
- El motor ya acepta `AnalyzeOptions.errorModel` y rechaza con `outside-error-model` lo que el modelo no
  respalda; con el provisorio activo no cambia nada (misma historia, `history:check` pasa), por eso no
  cambió `ENGINE_VERSION` ni `RULES_VERSION`.

## Mapa del código

| Archivo | Qué tiene |
|---|---|
| `src/rng.ts` | Azar con semilla: hash cyrb128 de una clave de texto → generador sfc32. Normal (Box–Muller), gamma (Marsaglia–Tsang) y una tabla de 65 536 cuantiles normales para el granulado |
| `src/constants.ts` | Constantes del equipo y del protocolo, cada una con su fuente |
| `src/sources.ts` | Identificador de fuente → cita corta y link |
| `src/math/` | Interpolación cúbica monótona, bisección, mínimos cuadrados, residuos de un polinomio de grado 2, filtros gaussianos, estadística, elipses (ajuste algebraico, geométrico y robusto; distancia punto–elipse de Eberly) |
| `src/vol/format.ts` | Bytes de la cabecera del examen y de cada corte (tablas 1.2 y 1.3), fechas, valor inválido, `VolFormatError` |
| `src/vol/io.ts` | `readVol` (decodifica cada corte cuando se lo piden), `writeVolBlocks`, `writeVol` |
| `src/vol/display.ts` | Transformación de visualización de eyepy (tabla 1.4) |
| `src/eye/crew.ts` | `MISSION`, `CREW`, tablas de anatomía y evolución de la sección 4, fechas |
| `src/eye/model.ts` | `EyeModel` (anatomía fija y calibración) y `EyeState` (el ojo en un día de vuelo: `profile(x, y)` dice qué hay a lo largo de una columna) |
| `src/eye/vessels.ts` | Árbol de vasos en el plano de frente, con grilla para consultas rápidas |
| `src/eye/groundTruth.ts` | `groundTruth(crew, eye, day)`: valor verdadero por integración densa |
| `src/sectors.ts` | Sectores del borde de la abertura (compartido por el valor verdadero y el motor) |
| `src/quality.ts` | Índice de calidad de la sección 5.4 (lo usan el instrumento y el motor) |
| `src/instrument/acquire.ts` | `acquire(request, {speckle})`: cabecera, fondo de ojo perezoso y cada corte cuando se pide |
| `src/instrument/capture.ts` | Ubicación del patrón, fallas (de la semilla, del pedido o guionadas) y variaciones de cada corte |
| `src/instrument/geometry.ts` | Marco de frente ↔ marco anatómico; extremos de cada corte radial |
| `src/instrument/optics.ts` | Tejidos: retrodispersión calibrada a los grises de 3.7, atenuación, caída con la profundidad, granulado, desenfoque |
| `src/instrument/bscan.ts` | Dibujo de un corte: capas por columna integradas por píxel, vasos y sombras, coroides, cabeza del nervio, fallas, granulado y piso de ruido |
| `src/instrument/slo.ts`, `font.ts`, `texture.ts` | Fondo de ojo, tipografía de mapa de bits propia, ruido suave determinista |
| `../validation/src/preview.ts` | Programa `preview` (imágenes en `.tmp/preview/`) |
| `src/engine/path.ts` | Camino de menor costo columna por columna (equivalente al grafo de Chiu) |
| `src/engine/segment.ts` | Un corte: calidad, ILM, BM, puntos de la abertura, movimiento y controles (6.1 a 6.3) |
| `src/engine/measure.ts` | Elipse, anillos, MRW y rugosidad (6.4, 6.5) |
| `src/engine/analyze.ts` | `analyzeExamSteps`, `analyzeExam`, `summarize`, `compareWithBaseline`, límites del examen (6.4, 6.6, 6.7) |
| `src/dataset/measuredHistory.ts` | `getHistory` y `getHistoryInfo`: leen `measured-history.json` y entregan copias (especificación 07) |
| `src/dataset/measured-history.json` | La historia de los cuatro tripulantes medida por el motor, generada por `history:generate`. Sin fechas de generación ni tiempos |
| `src/dataset/historyChecks.ts` | `checkHistoryDataset`: comprobaciones de integridad del archivo (rápidas, sin píxeles). Las usan el generador y las pruebas |
| `src/dataset/visionScenarios.ts` | `visionScenario(crewId, día)`: cuestionario, agudeza y Amsler ficticios de cada sesión (no salen de una tomografía) |
| `src/dataset/provisional.ts` | Solo `PROVISIONAL_ENGINE_VERSION`, para reconocer registros viejos guardados en un navegador |
| `../validation/src/historySuite.ts`, `history.ts` | Generador de la historia (`simulateCrew`, `captureEye`) y su programa |

## Decisiones

1. **Posición de cada columna del corte.** La especificación del formato no dice si `StartX/Y` y
   `EndX/Y` son el borde o el centro de la primera y la última columna. Convención nuestra: son los
   centros, así que la columna `j` está en `start + j/(SizeX − 1)·(end − start)` y el corte mide
   767 × 5,7 µm = 4,372 mm. La usan el instrumento y el motor (`SCAN_LENGTH_MM`).
2. **Versión aceptada por el lector:** `HSF-OCT-1xx` en el examen y `HSF-BS-1xx` en cada corte. Otra
   cosa es `unknown-version`.
3. **`VolFormatError` tiene un cuarto código, `invalid-field`,** para un `ScanPosition` que no es `OD`
   ni `OS` (no es un problema de tamaño ni de versión).
4. **Fechas con decimales de milisegundo:** `ExamTime` se guarda en unidades de 100 ns. Los exámenes
   nuestros tienen milisegundos enteros, que vuelven exactos. Un archivo ajeno con fracciones de
   milisegundo puede perder un tic al leerlo y reescribirlo.
5. **Archivos más largos que lo que dice la cabecera** se aceptan (puede haber datos de grosor
   agregados al final, `GridOffset`); los más cortos son `truncated`.
6. **Funciones matemáticas y reproducibilidad.** Las uniformes usan solo aritmética entera. Las
   normales y gammas usan `Math.log`, `Math.sqrt`, `Math.sin` y `Math.cos`, que dan los mismos bits
   dentro de un mismo motor de JavaScript (V8 en Node y en Chrome); entre motores distintos podrían
   diferir en el último bit.

7. **ρ (distancia desde el borde) es radial en el ojo virtual:** `ρ = r − r_BMO(θ)`, sobre el radio desde
   el centro de la abertura. Es barato y suave; la diferencia con la distancia perpendicular al borde es
   chica porque la abertura es casi circular.
8. **Valor verdadero de los anillos:** promedio ponderado por área de la zona entre la elipse ajustada al
   borde verdadero y la curva a esa distancia de la elipse (parametrización `E(t) + d·n(t)`, elemento de
   área `|E'(t)|·(1 + κd)`), excluyendo los puntos que caen dentro de la abertura verdadera (donde no hay
   membrana de Bruch). Es lo mismo que puede medir el motor: usa su elipse y descarta columnas sin BM.
9. **Valor verdadero de la rugosidad:** 96 medios radios desde el centro de la abertura, con el paso de
   las columnas de un corte (5,7 µm) y hasta el largo de medio corte; muestras con distancia a la elipse
   entre 300 y 1700 µm; polinomio de grado 2 por medio radio; RMS de todas las muestras juntas.
   La altura es lineal en la amplitud de los pliegues, así que la amplitud de cada día de la tabla se
   resuelve exacta con una ecuación cuadrática; entre días se interpola la amplitud (cúbica monótona).
10. **Irregularidad natural de la BM:** suma de 24 ondas planas de 220 a 520 µm, escalada para que la
    rugosidad del examen de referencia sea un valor al azar entre 2 y 3 µm (sección 3.2).
11. **Copa:** con `p = 6` se encontró en los 8 ojos un ancho `w₀` que da exactos el volumen y el MRW;
    no hizo falta resignar el MRW. El fondo queda entre −381 µm (A OD, copa grande) y +66 µm (D OD,
    copa chica y poco profunda).
12. **Coroides:** se afina hasta cero en los 400 µm junto al borde (**supuesto nuestro**; la especificación
    pide que llegue a cero pero no dice en cuánto).
13. **Fecha del día 0** (examen de referencia): un día antes del lanzamiento, con la misma fórmula que los
    días de vuelo (`fecha = lanzamiento + (día − 1)`).

### Valores calibrados (examen de referencia)

| Ojo | Grosor en el borde `TRT_borde` (µm) | `w₀` | Fondo de la copa (µm) | Rugosidad natural (µm) |
|---|---|---|---|---|
| A OD / OS | 386,2 / 380,0 | 0,634 / 0,640 | −381 / −350 | 2,53 / 2,21 |
| B OD / OS | 415,3 / 409,7 | 0,532 / 0,572 | −276 / −176 | 2,38 / 2,91 |
| C OD / OS | 441,7 / 432,3 | 0,547 / 0,559 | −65 / −88 | 2,89 / 2,47 |
| D OD / OS | 425,0 / 430,0 | 0,614 / 0,607 | +66 / +25 | 2,72 / 2,46 |

Con la hinchazón, el MRW verdadero sube de forma parecida a lo publicado: B OD +58 µm con +31 µm de
anillo el día 150 (P3: +50 con +38 en promedio); D OD +186 µm con +203 µm el día 90 (P5: +158 con +212).

14. **Instrumento, ubicación (5.1):** el centro del patrón cae en el centro de la imagen de fondo más un
    corrimiento de encuadre normal de 0,12 mm por eje (cada captura encuadra distinto; el motor tiene que
    leer las coordenadas de la cabecera). Error de centrado del operador: normal 70 µm por eje, fijo por
    ojo. Exámenes de seguimiento (vuelo, o un segundo intento del día 0): registro normal 12 µm y giro
    0,3°. El corte `k` va a `k·3,75°` del eje x, medido en sentido antihorario tal como se ve en pantalla.
15. **`ReferenceID`** es siempre el `ID` del intento 1 del día 0; un segundo examen previo al vuelo
    también lo apunta (así se puede comparar una repetición del día 0 con la referencia).
16. **Inclinación de cada corte:** pendiente física `dz/dx` normal con desvío 0,015; curvatura: 15 µm
    de desvío en los extremos; posición vertical: el punto más alto de la ILM en la fila 60 ± 12, corrida
    hacia arriba si hace falta para que entren la lámina y la coroides.
17. **Cabeza del nervio en el dibujo** (la especificación no la detalla): las fibras del anillo continúan
    las de afuera y se afinan hacia la copa; debajo, tejido prelaminar; la lámina cribosa se curva hacia
    atrás en el medio y se apaga donde toca la pared del canal escleral, que se inclina hacia adentro con
    la profundidad. Las capas internas se funden con el anillo en los últimos 150 µm antes del borde; la
    franja del epitelio y la BM sigue brillante hasta el borde (es lo que marca la abertura).
18. **Coroides:** luces de vasos con ruido celular (Worley): chicas arriba (celdas de 50 µm), grandes
    abajo (120 µm); la coriocapilar (7 % superior) sin luces.
19. **Árbol de vasos:** las arcadas salen cerca de los polos superior e inferior del nervio y se curvan
    hacia su dirección (45° ± 12° de los ejes, como pide 3.8); así se ve como un fondo de ojo y no como
    una "X". Ramifican 2 o 3 veces.
20. **Copa:** el calibrado prueba primero `p = 4` (paredes más suaves, más parecidas a un nervio real)
    y sube hasta 8 solo si hace falta. Con `p = 4` o 5 se cumplen volumen y MRW exactos en los 8 ojos
    (A OD quedó con `p = 6`).
21. **Rendimiento:** un corte tarda ~60 ms en dibujarse y ~60 ms en analizarse, y el fondo de ojo
    ~0,7 s en esta máquina (Node 22, un hilo, máquina compartida con otros agentes). Para eso: filtros
    binomiales desenrollados en vez de gaussianos genéricos ([1 4 6 4 1] a lo ancho, σ = 1 px ≈ 13 µm;
    [1 2 1] en profundidad que, con la integración por píxel, da σ = 0,77 px = 7 µm), atenuación
    acumulada por multiplicación, `exp` del granulado y `ln` del motor por tabla. El movimiento leve
    (< 0,2) corre bloques de columnas pero no agrega desenfoque.

### Motor

22. **Camino de menor costo** (6.2): se resuelve columna por columna (programación dinámica), que da
    el mismo óptimo que el grafo de 8 vecinos de Chiu para un borde que cruza cada columna una vez.
    Paso de ±1 fila entre columnas y, para la ILM, movimiento vertical libre dentro de la columna
    pagando cada píxel: así baja por las paredes de la copa. Imagen: logaritmo, suavizado binomial
    σ = 1 px. Las columnas sin señal se cruzan con el peso mínimo (paso 8 de Chiu).
23. **ILM:** primero una estimación gruesa del techo del tejido (cruce de la mitad, en escala log, entre
    el piso de ruido y el máximo de la columna) y el camino se busca ±12 filas alrededor (paso 7).
24. **BM:** camino global sobre "caída de brillo × brillo relativo" (el epitelio es la franja más
    brillante y termina en una caída). Junto al nervio ese camino abandonaba la franja ~15 columnas
    antes del borde, para bajar hacia estructuras de adentro; por eso, desde cada extremo del corte la
    franja se sigue columna por columna (±1 fila) y la BM final sale de ese seguimiento.
25. **Refinamiento sub-píxel en escala lineal:** el máximo del gradiente del logaritmo se corre hacia el
    lado oscuro (1,5 a 2 píxeles en la ILM): el TRT salía ~10 µm alto. Cada borde se ubica donde la
    intensidad lineal (promedio de ±3 columnas, 0 en paredes empinadas) cruza la mitad entre los niveles
    de cada lado. Con un desenfoque simétrico, ese cruce cae sobre el borde verdadero.
26. **Puntos de la abertura (6.3):** contraste de la franja (logaritmo arriba menos logaritmo abajo de la
    BM). Una sombra de vaso oscurece toda la columna y el contraste en logaritmos sobrevive; el final de
    la membrana lo mata. El punto es donde el contraste suavizado cae a la mitad del de afuera, si sigue
    bajo las 25 columnas siguientes (~140 µm). Fila: recta por las últimas 12 columnas de BM,
    evaluada en el punto. Confianza: caída relativa del contraste.
27. **Movimiento:** desplazamiento que mejor alinea dos columnas separadas por 12 (el movimiento también
    desenfoca a lo ancho y reparte el escalón en varias columnas) en la retina externa y la franja, a más
    de 60 columnas del borde de la abertura. Es escalón si el desplazamiento es de 8 filas o más y supera
    en 6 al promedio de los tramos vecinos (un pliegue sigue subiendo o bajando a los lados; un escalón
    tiene tramos planos). 2 escalones rechazan el corte. La ILM no sirve: en las paredes de la copa
    salta varias filas por columna. Umbrales elegidos para que los pliegues más fuertes (D) no disparen
    y el movimiento fuerte sí.
33. **Contraste de la franja:** en cada columna se usa el mejor de los dos caminos de la BM (el global,
    fiable lejos del nervio, o el seguimiento local, fiable junto al borde): con pliegues fuertes el
    seguimiento de ±1 fila a veces perdía la franja lejos del nervio y aparecían finales falsos.
34. **Fallas en el instrumento:** el movimiento corre bloques de 30 a 100 columnas con desvío de
    14·movimiento filas (54 µm en el peor caso) y desenfoca de más desde 0,2; el movimiento "leve" que sale
    de la semilla es de 0 a 0,06 (escalones de menos de una fila). El borde que se apaga pierde señal en
    dB linealmente hasta 40 dB en la última columna (antes era un factor cuadrático: la señal recién se
    perdía en el último 3 % y el motor medía igual, con razón, porque el contraste en logaritmos no
    depende de la ganancia).
28. **Señal:** una columna tiene señal si su máximo supera el piso de ruido en 1,5 (logaritmo natural,
    ~6,5 dB). `validColumnFraction` se cuenta sobre las columnas fuera de la abertura (adentro no hay BM
    por definición).
29. **Radios usados:** un medio corte cuenta para un anillo si tiene válidas al menos la mitad de sus
    columnas en ese anillo. La cobertura por cuadrante se mide en el anillo 0–250.
30. **Rugosidad:** la BM se suaviza ±2 columnas antes de restar el polinomio (saca ruido de píxel sin
    tocar pliegues de 420 µm); la posición a lo largo del medio corte es la distancia al centro del
    patrón.
31. **Elipse:** ajuste geométrico (Levenberg–Marquardt) a partir del algebraico; se descartan los puntos
    a más de máx(3 desvíos robustos, 20 µm) y se repite.
32. **`bmo` informado** es la elipse de este examen aunque los anillos usen la forma de referencia
    (`bmoSource`), así `compareWithBaseline` puede dar el cambio de área como control. Con
    `cannot-measure`, `bmo`, `trtRingUm`, `mrwUm` y `bmRoughnessUm` son `null` y `rings` y
    `mrwSectors` quedan vacíos.

## Cambios respecto de la especificación

1. **Índice de calidad de una captura limpia: ~25 dB, no 27–33 (sección 5.4).** Con los grises de la
   tabla 3.7 (que el instrumento cumple: fibras 0,66–0,70, epitelio 0,86–0,90, nuclear externa 0,33,
   zona elipsoide 0,72) y el vítreo en 0,10, la definición `Q = 10·log10((p99 − N)/N)` da unos 25 dB:
   el percentil 99 cae en el brillo del epitelio y de la capa de fibras (~0,1), y el piso de ruido es
   3,2·10⁻⁴. Para llegar a 30 dB habría que subir todos los tejidos ~5 dB (≈ +0,14 de gris: el epitelio
   se saturaría). Los dos son supuestos nuestros y no se pueden cumplir juntos; elegí los grises (lo que
   se ve). Consecuencias: la calidad "objetivo" que sale de la semilla sigue siendo normal(30; 1,5) como
   pide la especificación, pero funciona como ganancia relativa (30 dB = grises de la tabla) y el valor
   medido que se escribe en `Quality` queda unos 5 dB más bajo; la falla guionada de 18 dB deja ~7 dB en
   vez de ~12 (igual es "señal pobre"). La prueba lo marca en vez de ajustarse. **Hay que decidir** si
   se prefiere cambiar la definición de Q o los grises.
2. **Peso de cada muestra en los anillos (6.5):** la especificación dice "según su distancia al centro
   de la elipse". Uso la distancia al punto donde se cruzan los cortes (el centro del patrón): es el
   jacobiano del muestreo radial, y con el error de centrado (~100 µm) los dos centros no coinciden.
3. **MRW (6.5):** "la distancia más corta dentro del plano del corte" se mide con la escala lateral
   multiplicada por cos β (β: ángulo entre el corte y la normal de la elipse en el punto). Sin esa
   corrección, un patrón descentrado (normal: 70 µm por eje) ve el anillo neural estirado y el MRW salía
   5 a 11 µm alto; sin ruido, D OS daba 11,2 µm de error (límite de la prueba 5: 10 µm). Con la
   corrección, 1,7 a 6 µm.

## Supuestos nuevos

`AGENTS.md` pide anotar los supuestos en `docs/assumptions.md` (o, mientras no exista, en la sección 12
de `arquitectura.md`), pero la especificación de esta tarea prohíbe tocar `docs/` y
`monitoreo-salud-astronautas/`. Mientras tanto quedan acá, para pasarlos al lugar único cuando el
coordinador lo indique.

1. Convención de posición de columnas (decisión 1).
2. ρ radial en el ojo virtual (decisión 7).
3. Irregularidad natural de la BM con ondas de 220 a 520 µm (decisión 10).
4. Afinamiento de la coroides en 400 µm junto al borde (decisión 12).
5. Fecha del examen de referencia: el día anterior al lanzamiento (decisión 13).
6. Forma del árbol de vasos (decisión 19): salen cerca de los polos y se curvan hacia su dirección; se
   afinan 0,5 % cada 60 µm y se ramifican con hijos de 0,7 del calibre.
7. Encuadre de cada captura, convención del ángulo de los cortes y posición vertical (decisiones 14 y 16).
8. Aspecto de la cabeza del nervio, de la coroides y de la esclera en el dibujo (decisiones 17 y 18), y
   los grises no listados en 3.7: huecos entre las franjas externas 0,37 y 0,42, tejido retrolaminar
   0,22, pared del vaso 0,70.
9. Coeficientes de atenuación por tejido (`optics.ts`).
10. Límites internos del motor sin fuente: señal 1,5 sobre el ruido, escalón de movimiento de 3 filas y 3
    escalones por corte, contraste mínimo de la franja 0,8, confirmación de 25 columnas, rechazo de
    puntos de la elipse a 20 µm, mitad de columnas para contar un radio (decisiones 26 a 31).
11. Corrección de oblicuidad del MRW (cambio 3) y peso por distancia al centro del patrón (cambio 2).
12. Modelo de las fallas en el dibujo: tamaño de los escalones de movimiento, movimiento leve de la
    semilla entre 0 y 0,06, borde apagado hasta 40 dB, parpadeo de los eventos guionados desde el 40 %
    del ancho (decisión 34).
13. Umbrales del detector de movimiento (decisión 27).

## Pendientes y puntos flojos

1. **Calidad de una captura limpia ~25 dB** (cambio 1): hay que decidir entre cambiar la definición de Q
   o los grises. Afecta lo que verá la interfaz y el modelo de calidad de la etapa siguiente.
2. **Rendimiento:** 6 s en promedio, 8,9 s con la máquina cargada: cumple los 10 s con poco margen y no
   el objetivo de 6 s. La prueba de rendimiento corre sola al final de `pnpm test` para no competir por
   el procesador; en una máquina más cargada podría fallar. Lo más caro: granulado (~15 ms por corte),
   dibujo de capas (~16 ms), filtros (~10 ms), segmentación (~19 ms), calidad (2 × 5 ms), fondo de ojo
   (0,7 s, se calcula solo si se pide).
3. **La precisión es demasiado buena para ser un margen real:** el motor y el instrumento comparten el
   modelo de capas (por diseño de la tarea). La etapa de validación tendría que agregar variabilidad que
   el motor no conozca (otras formas de copa, vasos en la copa, opacidades, error de registro mayor)
   antes de usar este error como incertidumbre del astronauta.
4. **MRW:** queda un sesgo positivo de 2 a 6 µm sin explicar del todo (inclinación del corte, polilínea).
   La ILM tiene un pequeño zigzag en el fondo de copas muy angostas (D hinchado).
5. **Detección de movimiento:** depende de umbrales elegidos sobre nuestros propios pliegues; un pliegue
   real más empinado podría dar un falso "movimiento" (el corte se descarta, no se mide mal).
6. **Supuestos en un solo lugar:** quedaron en este archivo; falta pasarlos a `docs/assumptions.md` o a
   la sección 12 de `arquitectura.md` (la especificación no me deja tocar esas carpetas).
7. **Fondo de ojo:** plausible pero simple (sin mácula, sin reflejos de vasos, disco sin bordes finos).
8. **Un perfil de CPU** (`*.cpuprofile`) quedó escrito por error en `/home/ramiro/orca/workspaces/.tmp/prof`,
   fuera del proyecto; no tengo permiso para borrarlo.
