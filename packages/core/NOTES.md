# Notas del núcleo (`packages/core`)

Bitácora de la construcción del núcleo según `monitoreo-salud-astronautas/especificaciones/01-nucleo.md`.
Si la sesión se corta, se sigue desde acá: qué hay, qué se decidió, qué cambió respecto de la
especificación y qué falta.

## Estado

| Paso (sección 10) | Estado |
|---|---|
| 1. Azar, matemática y formato `.vol` | Hecho |
| 2. Ojo virtual, tripulación y valor verdadero | Pendiente |
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

## Cambios respecto de la especificación

(ninguno todavía)

## Supuestos nuevos

`AGENTS.md` pide anotar los supuestos en `docs/assumptions.md` (o, mientras no exista, en la sección 12
de `arquitectura.md`), pero la especificación de esta tarea prohíbe tocar `docs/` y
`monitoreo-salud-astronautas/`. Mientras tanto quedan acá, para pasarlos al lugar único cuando el
coordinador lo indique.

1. Convención de posición de columnas (decisión 1).

## Pendientes

- Todo lo de los pasos 2 a 5.
