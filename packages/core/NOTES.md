# Notas del núcleo (`packages/core`)

Bitácora de la construcción del núcleo según `monitoreo-salud-astronautas/especificaciones/01-nucleo.md`.
Si la sesión se corta, se sigue desde acá: qué hay, qué se decidió, qué cambió respecto de la
especificación y qué falta.

## Estado

| Paso (sección 10) | Estado |
|---|---|
| 1. Azar, matemática y formato `.vol` | Hecho |
| 2. Ojo virtual, tripulación y valor verdadero | Hecho |
| 3. Instrumento virtual y `preview` | Pendiente |
| 4. Motor | Pendiente |
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

## Cambios respecto de la especificación

(ninguno todavía)

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
6. Forma del árbol de vasos: arcadas que salen a 45° ± 12° de los ejes, las temporales se curvan
   hacia el eje temporal; se afinan 0,7 % cada 60 µm y se ramifican con hijos de 0,72 del calibre.

## Pendientes

- Todo lo de los pasos 2 a 5.
