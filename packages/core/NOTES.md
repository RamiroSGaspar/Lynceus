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
| 5. `accuracy`, precisión, rechazo y rendimiento | Pendiente |

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
27. **Movimiento:** desplazamiento que mejor alinea dos columnas vecinas en la retina externa y la franja
    (horizontales fuera de la abertura); un salto de 3 filas o más es un escalón; 3 escalones rechazan
    el corte. La ILM no sirve para esto: en las paredes de la copa salta varias filas por columna.
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

## Pendientes

- Todo lo de los pasos 2 a 5.
