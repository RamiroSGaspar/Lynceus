# Protocolo de validación sintética del error del motor

> **Versión `sim-validation-protocol-1`.** Escrito y guardado en el repositorio antes de generar la
> muestra y de ajustar ningún coeficiente (especificación 08). Un cambio en este documento después
> de ver los resultados de la prueba final se registra como versión nueva y no reemplaza la decisión
> tomada con esta.
>
> **Datos simulados.** Todos los exámenes de este protocolo son ficticios: los dibuja el instrumento
> virtual sobre los ocho ojos virtuales de cuatro tripulantes inventados. Nada de lo que sale de acá
> es una validación con personas ni una medida del tomógrafo real.

## 1. Preguntas

1. ¿Cuánto se equivoca el motor, en µm, al medir el grosor de la retina en el anillo de 0 a 250 µm
   (TRT) y la rugosidad de la membrana de Bruch en un examen, y al medir sus **cambios** contra el
   examen de antes del vuelo? Sesgo, RMSE, error absoluto, por calidad y por familia de falla.
2. ¿Ese error se puede anticipar con características que el motor calcula de una captura real
   (calidad, cortes usados, ajuste de la abertura, descentrado, cobertura del anillo, movimiento)?
3. ¿Son independientes los errores del examen de hoy y del de referencia?
4. Los rangos que la aplicación llama "del 95 %", ¿contienen el cambio verdadero 95 de cada 100
   veces en datos que no se usaron para ajustar? ¿La aproximación normal de `probabilityBeyond`
   describe la cola del error?
5. ¿Qué capturas rechaza el motor y, entre las aceptadas, hay errores fuera de tolerancia?

## 2. Matriz de capturas

Todo es determinista: cada captura es un `CaptureRequest` fijo (tripulante, ojo, día, número de
intento y condiciones). La lista completa la arma `src/quality/protocol.ts`; este documento la
describe.

**Ojos:** los 8 (A, B, C y D; OD y OS).

**Días por ojo.** Los días 0 (repetición del examen previo), 30, 60, 90, 120, 150 y 180, más los días enteros
cuyo cambio verdadero queda más cerca de cada umbral que el ojo llega a cruzar antes del día 180:
19,4 µm y 55 µm de TRT, y 2,8 µm de rugosidad (pliegues). El valor verdadero se usa solo para
elegir esos días; el motor no lo ve.

**Referencias.** Dos exámenes previos al vuelo por ojo, con las condiciones que da la semilla:
R1 es el intento 1 del día 0 (el que usa la aplicación) y R2 el intento 9 del día 0. Si el motor
rechaza una de las dos, ese ojo queda con una sola referencia y sus pares pasan a la otra. Cada
captura de seguimiento se analiza contra una de las dos, alternando, con la forma de la abertura de
esa referencia (como en la aplicación). Así hay hasta 16 errores de referencia distintos y no 8.

**Capturas por ojo y día.** El instrumento acepta intentos del 1 al 9 (el número va en el
identificador del examen) y cada intento tiene su propia semilla: cada captura de un ojo y día
lleva un intento distinto, para que no compartan ruido ni encuadre. Limpias: intentos 2 y 3 (los
eventos guionados de la aplicación son todos del intento 1 y solo valen sin condiciones). Señal,
movimiento, parpadeo, truncamiento, descentrado, borde apagado y combinación: intentos 1, 4, 5, 6,
7, 8 y 9, en ese orden. Una captura con condiciones explícitas apunta a 30 dB sin variación entre
cortes y sin el movimiento leve de la semilla (así está escrito el instrumento). El día 0 los
intentos 1 y 9 son las referencias: las repeticiones usan los intentos 2 a 8, con las dos limpias y
las cinco familias de desarrollo, sin borde apagado ni combinación.

| Familia | Uso | Niveles (uno por ojo y día, rotando) |
|---|---|---|
| Limpia | desarrollo y prueba | 2 capturas con las condiciones de la semilla (calidad objetivo normal(30; 1,5) y movimiento leve) |
| Señal | desarrollo y prueba | pérdida de 3, 6, 9, 12 y 15 dB |
| Movimiento | desarrollo y prueba | 0,1; 0,2; 0,3; 0,45; 0,6 |
| Parpadeo | desarrollo y prueba | banda de 10 a 35 % del ancho sobre 3 a 14 cortes seguidos |
| Truncamiento | desarrollo y prueba | 30 px en todos los cortes; 45 px en 8; 60 px en 4 y en 10; 90 px en 3 |
| Descentrado | desarrollo y prueba | 0,1; 0,2; 0,3; 0,4; 0,5 mm en una dirección de la semilla |
| Borde apagado | **solo prueba** | 6, 12, 20 y 30 % del ancho, de un lado de la semilla |
| Combinación nueva | **solo prueba** | señal 8 dB + movimiento 0,2; parpadeo + descentrado 0,2 mm; truncamiento + borde apagado; señal 10 dB + descentrado 0,3 mm; movimiento 0,3 + parpadeo corto |

El nivel de cada familia en cada ojo y día rota con el índice del ojo y del día, así todos los
niveles aparecen en ojos distintos. Muchos niveles están cerca o más allá del límite de rechazo a
propósito: se quiere ver el error de las capturas deterioradas que el motor todavía acepta. **La
frecuencia de cada falla en esta matriz es una elección del experimento y no representa la
frecuencia de fallas en astronautas.**

Tamaño esperado: 69 ojos-día (8 de ellos el día 0, con 7 capturas; 61 con 9) y 16 referencias:
621 capturas: 362 de desarrollo (6 ojos), 171 de P1 (2 ojos) y 88 de P2 (los mismos 6 ojos de
desarrollo). El tamaño sale de pedir al menos 50 pares aceptados en cada partición de prueba (sección
6) con familias que el motor a veces rechaza: con 50 pares, una cobertura real del 95 % deja el
límite inferior de Wilson cerca del 86 %. Con ~5 s
por captura y dos trabajos simultáneos, unos 25 minutos.

## 3. Particiones

Con cuatro personas ficticias no hay muchos ojos independientes: 8 ojos, 16 referencias. Las
capturas de un mismo ojo comparten anatomía y no cuentan como ojos nuevos. Por eso las particiones
se hacen por tripulante y por familia de falla, nunca al azar entre capturas.

| Partición | Qué contiene | Para qué |
|---|---|---|
| **Desarrollo** | Tripulantes A, B y D; familias limpia, señal, movimiento, parpadeo, truncamiento y descentrado | Elegir variables, ajustar coeficientes y calibrar (validación cruzada dejando un tripulante afuera) |
| **Prueba P1: anatomía nueva** | Tripulante C, todas las familias | Prueba final principal. C es el único cuyos dos ojos cruzan 19,4 y 55 µm y tienen pliegues |
| **Prueba P2: falla nueva** | Tripulantes A, B y D con borde apagado y combinaciones nuevas | Prueba final de familias no vistas. Comparte ojos y referencias con desarrollo: no prueba anatomía |

La prueba final se calcula **una sola vez**, después de fijar la fórmula, las variables, los
coeficientes, el factor de calibración y el dominio. Ninguna cifra de P1 ni de P2 se usa para
elegir nada.

## 4. Modelo (familia fijada de antemano)

Para cada medida (TRT y rugosidad), el error del cambio entre el examen de hoy (`c`) y el de
referencia (`r`) se modela como normal de media cero y desvío

    σ = k · √( s(x_c)² + s(x_r)² ),   s(x) = exp(β₀ + Σ βⱼ · zⱼ(x))   [µm]

Los dos términos son una parametrización ajustada directamente sobre errores de cambios, no un
supuesto de independencia; la pregunta 3 se contesta aparte con los errores de cada examen.

**Variables candidatas** (todas de `ExamQuality.features`, calculadas por el motor sobre la imagen;
orientadas para que más sea peor):

| Variable | Transformación |
|---|---|
| Calidad media | `z_q = (25 − meanQualityDb) / 5` (5 dB por unidad) |
| Cortes no usados | `z_u = 1 − usableFraction` |
| Ajuste de la abertura | `z_fit = bmoFitRmsUm / 10` (10 µm por unidad) |
| Descentrado | `z_dec = decentrationUm / 100` (100 µm por unidad) |
| Cobertura del anillo | `z_cov = 1 − ringCoverageMin` |
| Movimiento | `z_mot = meanMotionSteps` |
| Columnas sin borde | `z_vc = 1 − meanValidColumnFraction` |

**Ajuste:** máxima verosimilitud normal (Nelder–Mead determinista). Sin corrección de sesgo: el
sesgo se informa y queda dentro de σ.

**Selección:** hacia adelante, desde la constante sola. Se agrega la variable que más mejora la
log-verosimilitud fuera de muestra (validación cruzada dejando afuera a A, a B y a D, sumada) si la
mejora es de al menos 2 unidades; como máximo 3 variables. Un coeficiente βⱼ < 0 (error menor con
peor captura) descarta esa variable.

**Calibración:** con los errores fuera de muestra de la validación cruzada, `k = max(1, q95(|z|) / 1,96)`,
donde `z` es el error dividido por el σ de ese pliegue con `k = 1`. Nunca se achica el rango.
Después se reajusta con todo el desarrollo y se aplica ese `k`.

**Dominio.** Una captura que el motor aceptó está respaldada por el modelo si todas las variables
candidatas son números finitos y ninguna supera el máximo visto en las capturas aceptadas de
desarrollo (del lado "peor"). Del lado "mejor" no se rechaza: la variable se recorta al mínimo
visto, para no extrapolar un error menor que el medido. Si no está respaldada, el resultado es
"no puedo medir" con su motivo, nunca un número.

**Rechazos del motor:** siguen igual. El modelo no convierte un rechazo en una medida. No se
entrena ningún clasificador de calidad; si entre las aceptadas no hay errores fuera de tolerancia,
se informa que no hay clase positiva y no se da AUC.

## 5. Métricas

En cada partición, y en P1 también por ojo:

- Por examen: error de TRT y de rugosidad contra el valor verdadero del ojo virtual ese día.
- Por par (hoy contra referencia): error del cambio de TRT y de rugosidad. Sesgo, desvío, RMSE,
  error absoluto medio y máximo, por banda de calidad del examen de hoy (< 18, 18–21, 21–24,
  ≥ 24 dB) y por familia.
- Entre controles (dos seguimientos limpios del mismo ojo contra la misma referencia): lo mismo,
  como dato secundario (la aplicación muestra el cambio desde el control anterior).
- Cobertura del rango ±1,96 σ con su intervalo de Wilson al 95 % y el tamaño de muestra, contando
  pares y ojos por separado.
- Colas: fracción de |z| > 1, > 1,96, > 2,58 y > 3 contra lo esperado de una normal; |z| máximo.
- Umbrales 19,4 µm (>), 55 µm (≥) y 2,8 µm de rugosidad (>): pares donde la decisión sobre el valor
  medido difiere de la decisión sobre el verdadero; puntaje de Brier de `probabilityBeyond`; pares
  con probabilidad entre 10 y 90 % y cuántos pasaron de verdad el umbral.
- Independencia: correlación entre el error del examen de hoy y el de su referencia.
- Rechazos del motor y del dominio, por familia y nivel.
- Tiempos y tamaño de los artefactos.

## 6. Tolerancias (ingeniería del proyecto, no umbrales de la NASA)

Los umbrales de 19,4 µm, 55 µm y 2,8 µm son de la NASA y describen el cambio del ojo. Las
tolerancias de abajo son de este proyecto y describen al motor:

| Tolerancia | Valor | De dónde |
|---|---|---|
| Error del cambio de TRT en una captura aceptada | ≤ 6 µm | Especificación 01, prueba 6 |
| Error del cambio de rugosidad en una captura aceptada | ≤ 1,5 µm | Especificación 01, prueba 6 |
| Cobertura observada del rango del 95 % | ≥ 90 %, con límite inferior de Wilson ≥ 85 % | Este protocolo |
| Pares con \|z\| > 3 | ≤ 2 % | Este protocolo (una normal da 0,27 %) |
| Pares aceptados por el modelo en cada partición de prueba | ≥ 50 | Este protocolo |
| Capturas limpias aceptadas por el motor que el dominio rechaza, en P1 | ≤ 10 % | Este protocolo |

## 7. Criterio de activación

El modelo nuevo reemplaza al provisorio por defecto solo si, **en P1 y en P2 por separado y para
TRT y rugosidad**, se cumplen todas las tolerancias de la sección 6, todos los coeficientes son
finitos y las pruebas de determinismo pasan. Es todo o nada: si una parte falla, la aplicación
sigue con el modelo provisorio, se publican el experimento y el motivo concreto, y el texto
"provisorio" se mantiene.

Aunque se active, el modelo describe el error del motor **sobre imágenes simuladas** con el mismo
modelo de capas que el motor espera; el error en exámenes reales es mayor y no se conoce. La
aplicación lo dice junto a cada rango. Sus probabilidades se refieren a la medición del simulador,
no son probabilidades clínicas del síndrome.

## 8. Ejecución

- `pnpm --filter @app/validation quality:run`: genera y mide la muestra (dos trabajos por defecto) y
  escribe las filas en `out/quality-rows.json`. Guarda resúmenes y errores, no volúmenes. Usa una
  caché en `.tmp/` cuya clave incluye el pedido, la referencia, el instrumento, el motor y este
  protocolo.
- `pnpm --filter @app/validation quality:fit`: con esas filas elige, ajusta, calibra, evalúa la
  prueba final una vez y escribe el informe `out/quality-validation.md`, los coeficientes y el
  resumen que muestra la aplicación.
- Ninguno de los dos corre en `pnpm test`, `pnpm verify` ni en la compilación.
