# Especificación 01 — Núcleo: formato `.vol`, ojo virtual, instrumento virtual y motor de medición

| | |
|---|---|
| **Proyecto** | NASA Space Apps Challenge 2026 — *Create Health Monitoring Software for Astronauts on Space Missions* |
| **Fecha** | 15 de noviembre de 2026 |
| **Para quién** | La sesión de Claude Code que construye el núcleo (etapas A y B de `arquitectura.md`). |
| **De dónde sale** | `arquitectura.md` (aprobada), `decisiones-y-criterios.md` y las investigaciones `sans-spectralis-datos.md`, `sans-oct-base-tecnica.md` y `sans-evolucion-y-logica-clinica.md`. Los identificadores de fuente (`P1`, `N1`…) son los de la tabla de fuentes de `sans-oct-base-tecnica.md`, salvo `C1` y `D2` (de `sans-spectralis-datos.md`) y donde se nombra otro documento. |
| **Reglas generales** | `AGENTS.md`, en la raíz. Valen todas. |

## 0. Alcance

**Entra en esta tarea**

1. Generador de números al azar con semilla y utilidades matemáticas.
2. Lectura y escritura del formato `.vol`, por bloques.
3. Ojo virtual: modelo paramétrico del nervio óptico y de la retina que lo rodea, con su evolución por día de vuelo, y los cuatro tripulantes.
4. Instrumento virtual: produce el examen (imagen de fondo y 48 cortes radiales) con ruido, sombras de vasos y fallas de captura.
5. Motor de medición: control de calidad, marcado de dos bordes, abertura de la membrana de Bruch, medidas y comparación con el examen de referencia.
6. Herramientas de inspección (imágenes PNG) y tabla de precisión.
7. Pruebas automáticas de todo lo anterior.

**No entra** (tareas siguientes): modelo de calidad entrenado y cálculo de la incertidumbre; niveles, reglas y textos; calendario de la misión y sesiones precalculadas; interfaz; pruebas de visión; asistente.

**Dónde se trabaja:** solo en `packages/core/` y `packages/validation/`. No tocar `apps/web/`, `docs/` ni `monitoreo-salud-astronautas/`. Otras personas construyen la interfaz en paralelo contra `packages/core/src/contract.ts`: ese archivo se puede ampliar con campos opcionales, pero no renombrar ni quitar nada sin preguntar al coordinador.

**Lo que no se negocia:** el instrumento y el motor no comparten información por fuera del examen. El motor recibe un `ExamSource` (cabeceras, imagen de fondo y píxeles) y nada más: no lee el modelo del ojo, ni la semilla, ni el valor verdadero. El valor verdadero solo lo usan las pruebas y la validación.

## 1. Convenciones

| Tema | Convención |
|---|---|
| Unidades | Micrómetros para grosores y distancias chicas, milímetros para posiciones de frente, decibeles para calidad. La unidad va en el nombre (`thicknessUm`, `centerXMm`, `qualityDb`) |
| Marco de frente (imagen de fondo) | Milímetros, x hacia la derecha, y hacia abajo, origen en la esquina superior izquierda de la imagen de fondo |
| Marco anatómico | Origen en el centro de la abertura. Coordenadas polares: radio `r` y ángulo `θ`, con **θ = 0° temporal, 90° superior, 180° nasal, 270° inferior**. `ρ` = distancia hacia afuera desde el borde de la abertura, en micrómetros |
| Lateralidad | En la imagen de fondo, lo temporal queda a la **izquierda en el ojo derecho (OD)** y a la derecha en el izquierdo (OS). Arriba es superior en los dos |
| Corte | Columnas de inicio a fin del corte; filas desde el vítreo (fila 0) hacia adentro del ojo. Los píxeles se guardan por filas, igual que en el archivo |
| Profundidad | `z` en micrómetros, positiva hacia adentro del ojo |
| Semillas | Cada flujo de azar sale de una clave de texto, por ejemplo `eye/B/OD`, `session/B/OD/90`, `attempt/B/OD/90/1`, `scan/B/OD/90/1/17`. Cada corte tiene su propio flujo: se puede generar cualquier corte suelto, en cualquier orden, con el mismo resultado |

**Constantes del equipo** (Spectralis OCT2; fuente `sans-oct-base-tecnica.md` 1.A y `sans-spectralis-datos.md` 1.2):

| Constante | Valor | Fuente |
|---|---|---|
| Columnas por corte | 768 | P8, D2 |
| Filas por corte | 496 | P8 |
| Escala a lo ancho | 0,0057 mm por píxel | P8 |
| Escala en profundidad | 0,00387 mm por píxel | P8 |
| Cortes del examen | 48 radiales de 15°, uno cada 3,75° | P3, P4 |
| Promediado de cada corte (ART) | 25 imágenes | P4 |
| Imagen de fondo | 1536 × 1536 píxeles, 30°, 0,0057 mm por píxel | C1, D2 |
| Escala de calidad | 0 a 40 dB; menos de 15 es señal pobre | P13 |

## 2. Formato `.vol`

Implementar **exactamente** las tablas 1.1 a 1.4 de `sans-spectralis-datos.md`: posiciones, tipos, orden *little-endian*, cabecera de 2048 bytes, cabecera de corte de 256 bytes dentro de un bloque de `BScanHdrSize` bytes, imagen como reales de 32 bits por filas, y el valor "inválido" (el real de 32 bits más grande).

| Decisión | Valor |
|---|---|
| `Version` | `HSF-OCT-103` en el examen y `HSF-BS-103` en cada corte |
| `BScanHdrSize` | 61440 |
| `ScanPattern` | 5 (radial) |
| `Distance` | 0 (el valor real en cortes radiales no se encontró) |
| `NumSeg` al salir del instrumento | 0: el instrumento virtual no marca capas. El lector y el escritor sí deben manejar `NumSeg` > 0, para poder exportar un examen con los bordes que marcó el motor |
| Textos | ASCII, completados con ceros hasta el largo del campo |
| `PatientID` | `SIM-CREW-A` a `SIM-CREW-D`. El prefijo `SIM-` marca el archivo como simulado |
| `VisitID` | `PRE` para el examen de referencia y `FD030`, `FD090`… para los de vuelo |
| `ID` y `ReferenceID` | Enteros en texto, únicos por examen. En el examen de referencia son iguales; en los de vuelo, `ReferenceID` es el `ID` del de referencia del mismo ojo |
| `ProgID` | `SIM-SANS-<tripulante>-<ojo>`, igual en toda la serie del ojo |
| Fechas | Salen de la fecha de lanzamiento de la misión (sección 4) y del día de vuelo; nunca del reloj |
| Zonas de reserva | Ceros |

Funciones: codificar y decodificar la cabecera del examen y el bloque de un corte; `writeVolBlocks(exam)` (generador: cabecera, imagen de fondo y un bloque por corte), `writeVol(exam)` (archivo completo), `readVol(bytes)` (devuelve un `ExamSource` que decodifica cada corte cuando se lo piden) y `toDisplayGray(pixels)` con la transformación de eyepy de la tabla 1.4. Errores con tipo propio (`VolFormatError`) para archivo cortado, versión desconocida o tamaños incoherentes.

## 3. Ojo virtual

Un ojo es un conjunto de parámetros de anatomía (fijos) más un estado que depende del día de vuelo. Todo lo que sigue se define en el marco anatómico. Las formas son la propuesta de partida: se pueden cambiar si hace falta para cumplir los objetivos de la sección 3.9, dejando anotado el motivo.

### 3.1 Abertura de la membrana de Bruch (BMO)

- Elipse centrada en el origen, más alta que ancha (relación de ejes entre 1,05 y 1,18), girada hasta ±12°, con el área de la tabla de la sección 4.
- Borde real = elipse con una perturbación suave de hasta ±3 % del radio (armónicos 3 a 5), para que el ajuste de una elipse tenga residuo, como en un ojo.
- La abertura está en un plano (el "plano de la BMO"), con una inclinación propia de cada ojo de hasta ±2°.

### 3.2 Membrana de Bruch (BM) fuera de la abertura

`z_BM(ρ, θ)` = plano de la BMO, más una subida suave hacia el vítreo al alejarse (unos 20 µm por milímetro), más una irregularidad natural suave (RMS de 2 a 3 µm, con detalle de unos 300 µm), más los pliegues (3.6). La BM termina en el borde de la abertura.

### 3.3 Grosor de la retina y superficie interna (ILM) fuera de la abertura

- `TRT(ρ, θ, d) = O(ρ) + RNFL(ρ, θ) + ΔTRT(ρ, θ, d)`, y la ILM queda en `z_ILM = z_BM − TRT`.
- `O(ρ)`: todas las capas menos la de fibras. 215 µm desde ρ = 600 µm; baja de forma suave hasta 150 µm en ρ = 0.
- `RNFL(ρ, θ) = RNFL_m(ρ) · m(θ)`, con `m(θ) = 1 + 0,22·cos(2(θ − 90°)) − 0,08·cos θ` (más gruesa arriba y abajo, más fina del lado temporal; su promedio es 1).
- `RNFL_m(ρ)` se elige para que el grosor total promedio sea `TRT_lejos + (TRT_borde − TRT_lejos)·exp(−ρ / 700 µm)`, con `TRT_lejos` = 290 µm y `TRT_borde` ajustado para que el promedio del anillo de 0 a 250 µm dé el valor del ojo (sección 4). Referencia: con 392 µm en el anillo, quedan unos 319 µm de grosor total y 104 µm de capa de fibras a ρ = 1000 µm (P3).

### 3.4 Hinchazón

`ΔTRT(ρ, θ, d) = E(d) · g(ρ) · h(θ)`

| Parte | Definición | Respaldo |
|---|---|---|
| `E(d)` | Cambio promedio del anillo de 0 a 250 µm el día `d`: la curva de cada ojo (sección 4) | — |
| `g(ρ) = 1,481 · exp(−ρ / 296 µm)` | Promedio 1 entre 0 y 250 µm y 0,43 entre 250 y 500 µm | P1: el anillo de 250 a 500 µm cambia menos de la mitad (4,7 contra 11,9 µm el día 10; 12,9 contra 27,6 el día 150) |
| `h(θ) = 1 − 0,28·cos θ − 0,17·cos 2θ` | Temporal 0,55; nasal 1,11; arriba y abajo 1,17; promedio 1 | N1: más en los sectores superior, inferior y nasal |

El grosor que se agrega va a la capa de fibras. La forma de `g` y de `h` es **supuesto nuestro**, ajustado a esos datos.

**Normalización:** `g · h` se reescala en cada ojo para que el cambio verdadero del anillo de 0 a 250 µm, con la definición de la sección 3.9 (ponderado por área), sea exactamente `E(d)`. El 1,481 es el valor para un promedio simple a lo largo de `ρ`; el definitivo sale de esa calibración.

### 3.5 Dentro de la abertura: anillo neural y copa

Con `u = r / r_BMO(θ)` entre 0 (centro) y 1 (borde), la altura de la ILM sobre el plano de la BMO es

`H(u, θ, d) = H_borde(θ, d) · (1 − s(u)) + H_fondo(d) · s(u)`, con `s(u) = (q(u) − q(1)) / (1 − q(1))` y `q(u) = 1 / (1 + (u / w)^p)`.

- `H_borde` = el grosor total en ρ = 0: la ILM es continua al cruzar el borde.
- `w` (ancho relativo de la copa), `p` (pendiente de la pared, entre 4 y 8) y `H_fondo` (altura del fondo; negativa si queda detrás del plano) son parámetros del ojo, elegidos para dar el volumen de copa y el ancho mínimo del anillo neural (MRW) de la sección 4.
- **Volumen de la copa**, con la definición de la NASA (P3): volumen entre la ILM y un plano paralelo al de la BMO, 200 µm hacia el vítreo.
- Con la hinchazón la copa se achica (P3: ancho 570 → 480 µm y profundidad 201 → 178 µm con +38 µm de promedio): `w(d) = w₀ · (1 − 0,004·E)`, sin bajar de `0,4·w₀`, y `H_fondo(d) = H_fondo₀ + 0,6·E`. **Supuesto nuestro**, ajustado a esos dos datos.
- Debajo de la ILM, dentro de la abertura: tejido prelaminar (sin epitelio pigmentario ni BM) y, más atrás, la lámina cribosa como una franja de brillo medio de unos 250 µm, a partir de unos 350 µm por detrás del plano de la BMO.

### 3.6 Pliegues

`F(ρ, θ, d) = A(d) · m_f(θ) · env(ρ) · sin(2π·ρ / Λ + φ(θ))`, sumado a `z_BM`. Como la ILM se define desde la BM, toda la retina se ondula junta y el grosor no cambia.

| Parte | Valor | Respaldo |
|---|---|---|
| `Λ` | 420 µm | **Supuesto nuestro.** P5 da 15 a 23 pliegues en 6 mm de mácula (260 a 400 µm entre pliegues); junto al nervio no hay dato |
| `m_f(θ)` | 1 arriba, abajo y del lado nasal; 0,25 del lado temporal, con transición suave | P4: casi nunca del lado temporal |
| `env(ρ)` | 0 hasta 100 µm, sube hasta 1 en 300 µm, se mantiene y baja a 0 entre 1600 y 2000 µm | **Supuesto nuestro** |
| `φ(θ)` | Fase que cambia de forma suave con el ángulo, para que no sean círculos perfectos | — |
| `A(d)` | Se calibra para que el **aumento de rugosidad** medido sobre el modelo sin ruido sea el de la sección 4 | P4, P5 |

### 3.7 Capas, para dibujar

Debajo de la capa de fibras, el resto del grosor se reparte así: células ganglionares y plexiforme interna 27 %, nuclear interna 14 %, plexiforme externa 10 %, nuclear externa 24 %, segmentos de fotorreceptores 16 % (con tres líneas finas adentro: membrana limitante externa, zona elipsoide y zona de interdigitación) y epitelio pigmentario con BM 9 %.

Niveles de gris que tiene que mostrar un corte limpio, después de la transformación de visualización (0 negro, 1 blanco). Son **supuesto nuestro**, basado en la descripción cualitativa de la sección 3.1 de `sans-oct-base-tecnica.md`:

| Estructura | Gris | Estructura | Gris |
|---|---|---|---|
| Vítreo (solo ruido) | 0,10 a 0,16 | Zona elipsoide | 0,68 a 0,75 |
| Capa de fibras | 0,62 a 0,70 | Zona de interdigitación | 0,55 a 0,65 |
| Ganglionares y plexiforme interna | 0,48 a 0,55 | Epitelio pigmentario y BM | 0,80 a 0,90 |
| Nuclear interna | 0,36 a 0,42 | Coroides: tejido / luz de los vasos | 0,45 a 0,55 / 0,25 a 0,35 |
| Plexiforme externa | 0,48 a 0,54 | Esclera | 0,45 junto a la coroides, baja a 0,25 |
| Nuclear externa | 0,28 a 0,34 | Tejido prelaminar | 0,50 a 0,60, baja con la profundidad |
| Membrana limitante externa | 0,42 a 0,48 | Lámina cribosa | 0,40 a 0,50 |

**Coroides:** grosor junto al nervio según la sección 4, más fina abajo (arriba 225, abajo 183, nasal 220, temporal 233 µm en personas sanas, P10) y se afina hasta cero en el borde de la abertura. Aumenta en vuelo según la sección 4. El borde con la esclera es tenue. No se mide: solo se dibuja.

### 3.8 Vasos

Un árbol por ojo, generado con su semilla, en el plano de frente: cuatro arcadas principales que salen del centro del nervio (hacia arriba-temporal, abajo-temporal, arriba-nasal y abajo-nasal, con variación de ±12°), cada una con una arteria (90 a 110 µm de calibre en el borde) y una vena (120 a 140 µm), que se afinan y se ramifican una o dos veces, más dos o tres vasos chicos. Dentro de la abertura convergen en un tronco central, corrido hacia el lado nasal.

- En el corte: el vaso está en la capa de fibras y deja una **sombra vertical** debajo (transmite cerca del 25 % en los vasos grandes y del 55 % en los chicos).
- En la imagen de fondo: líneas oscuras de borde suave.
- El mismo árbol alimenta las dos imágenes: la sombra de un corte tiene que caer donde ese corte cruza el vaso en la imagen de fondo.

### 3.9 Valor verdadero y objetivos

`groundTruth(crewId, eye, flightDay)` devuelve, calculado sobre el modelo sin ruido con integración numérica densa: elipse de la abertura, grosor en los cuatro anillos (**promedio ponderado por área** de la zona entre el borde de la abertura y la curva a esa distancia), MRW (por punto del borde y promedio), rugosidad de la BM (definición de la sección 6.5), volumen de la copa y grosor de coroides. Solo lo usan las pruebas, la validación y una vista de transparencia de la interfaz.

Objetivos que debe cumplir el modelo (hay una prueba para cada uno):

| Objetivo | Tolerancia |
|---|---|
| Grosor del anillo de 0 a 250 µm en el examen de referencia (sección 4) | ± 2 µm |
| `E(d)` en cada punto de las curvas de la sección 4 | ± 1 µm |
| Aumento de rugosidad de la sección 4 | ± 0,5 µm |
| Área de la abertura | ± 2 % |
| Volumen de la copa y MRW de referencia | ± 10 %. Si chocan entre sí por geometría, mandan el anillo, el área y la copa, en ese orden; se informa el MRW que quedó |
| Todos los ojos dentro de los rangos medidos en astronautas (tabla 1.C de `sans-oct-base-tecnica.md`) | Estricto |

## 4. Tripulación y evolución

Misión ficticia de 180 días. Fecha de lanzamiento (día de vuelo 1): 2026-05-20. Calendario de rutina de la NASA para ese largo: días 30, 90 y 150. Nombres inventados.

| Id | Nombre | Función | Edad | Sexo | Evolución | En qué se basa |
|---|---|---|---|---|---|---|
| A | Kofi Mensah | Ingeniero de vuelo | 43 | M | Sin cambio detectable | El 26 % que no pasa el umbral (P4 en `sans-evolucion…`); nadie con copa de 0,3 mm³ o más lo pasó |
| B | Elena Voss | Comandante | 47 | F | Primer indicio típico: cruza 19,4 µm cerca del día 90 | Curva promedio de 11 astronautas (P1): el promedio de sus dos ojos la sigue |
| C | Ravi Anand | Ingeniero de vuelo | 51 | M | Nivel clínico en un ojo, el otro bastante menos, con pliegues en los dos | Casos del grupo de 31 (P4): diferencia entre ojos de hasta 47 µm; los pliegues aparecen siempre en los dos ojos (P4 en `sans-oct…`) |
| D | Lucía Ferreyra | Especialista de misión | 39 | F | Caso extremo, sin síntomas | Forma de la curva del caso publicado en 2024 (P5 en `sans-evolucion…`). Los valores son ficticios: parecidos, no copiados |

**Anatomía de referencia** (antes del vuelo; OD / OS):

| Id | Grosor del anillo 0–250 µm | MRW | Área de la abertura (mm²) | Volumen de la copa (mm³) | Coroides (µm) |
|---|---|---|---|---|---|
| A | 371 / 366 | 295 / 290 | 2,31 / 2,24 | 0,44 / 0,41 | 198 / 205 |
| B | 396 / 391 | 372 / 364 | 1,98 / 2,05 | 0,21 / 0,19 | 221 / 214 |
| C | 418 / 409 | 398 / 386 | 1,86 / 1,91 | 0,10 / 0,12 | 248 / 239 |
| D | 404 / 408 | 381 / 377 | 1,72 / 1,77 | 0,05 / 0,07 | 281 / 274 |

**Hinchazón `E(d)`**, en micrómetros (OD / OS). Día 0 = 0. Entre puntos, interpolación cúbica monótona:

| Id | Día 10 | 30 | 60 | 90 | 120 | 150 | 180 |
|---|---|---|---|---|---|---|---|
| A | 4 / 3 | 6 / 4 | 7 / 5 | 8 / 5 | 9 / 6 | 9 / 6 | 10 / 7 |
| B | 12 / 8 | 15 / 10 | 19 / 13 | 24 / 17 | 27 / 20 | 31 / 23 | 32 / 24 |
| C | 16 / 9 | 27 / 15 | 38 / 21 | 48 / 27 | 58 / 33 | 66 / 38 | 68 / 39 |
| D | 46 / 42 | 118 / 110 | 176 / 186 | 203 / 214 | 190 / 222 | 168 / 200 | 138 / 176 |

**Aumento de la rugosidad de la BM** respecto del examen de referencia, en micrómetros (OD / OS). A y B: 0 siempre.

| Id | Día 10 | 30 | 60 | 90 | 120 | 150 | 180 |
|---|---|---|---|---|---|---|---|
| C | 0 / 0 | 0 / 0 | 1,6 / 1,0 | 3,8 / 3,1 | 5,6 / 4,0 | 7,0 / 4,6 | 7,2 / 4,8 |
| D | 1,5 / 1,2 | 4,0 / 3,6 | 8,0 / 8,6 | 10,5 / 11,6 | 11,8 / 14,2 | 12,4 / 13,4 | 11,5 / 12,2 |

**Aumento del grosor de coroides** (solo se dibuja), en micrómetros, igual en los dos ojos: A 6, 8, 9, 10, 10, 10, 10 · B 20, 32, 34, 36, 37, 38, 38 · C 24, 38, 40, 42, 44, 45, 45 · D 12, 30, 50, 58, 64, 70, 72.

## 5. Instrumento virtual

`acquire(request)` devuelve un `ExamSource`. La imagen de fondo y cada corte se calculan cuando se piden.

### 5.1 Patrón y ubicación

- 48 cortes radiales; el corte `k` forma un ángulo de `k · 3,75°` con el eje x de la imagen de fondo y pasa por el centro del patrón. `StartX/Y` y `EndX/Y` de cada corte se escriben en su cabecera, y **el motor usa esas coordenadas**, no supone el patrón.
- La imagen de fondo se centra cerca del nervio. En el examen de referencia, el centro del patrón queda corrido del centro real de la abertura por un error de centrado del operador (normal, desvío de 70 µm por eje), fijo para ese ojo.
- Los exámenes de vuelo se toman **sobre el de referencia**, como hace el equipo real con su función de seguimiento (P1, P3): mismo centro de patrón respecto de la anatomía, con un error de registro chico (normal, 12 µm por eje, y un giro de 0,3°).

### 5.2 Señal

Modelo de dispersión simple, columna por columna: `señal(z) = retrodispersión(z) · exp(−2 · ∫₀ᶻ atenuación)`. Cada capa tiene su retrodispersión y su atenuación; los vasos atenúan fuerte. Encima se aplica: caída de sensibilidad con la profundidad de 4 dB por milímetro desde la fila 0 (**supuesto nuestro**: la curva real no se encontró), y el desenfoque del sistema (unos 7 µm en profundidad y 14 µm a lo ancho). Los coeficientes se calibran para dar los grises de la sección 3.7.

Cada captura tiene además, sacados de su semilla: inclinación del corte (pendiente normal con desvío 0,015), una curvatura leve, y la posición vertical de la retina en el cuadro (desvío de 12 filas alrededor de una posición que deje toda la retina, la copa y la coroides dentro del cuadro).

### 5.3 Ruido

- **Granulado (speckle):** multiplicativo. La intensidad promediada de `N` imágenes sigue una distribución gamma de forma `N_ef`; usar `N_ef = 12,5` para ART 25 (**supuesto nuestro**: las imágenes promediadas no son del todo independientes). El grano tiene que tener tamaño, no ser ruido píxel a píxel: correlación de unos 2 píxeles en profundidad y 2 a 3 a lo ancho.
- **Piso de ruido** del detector: aditivo, visible en el vítreo.

### 5.4 Índice de calidad

El del fabricante no es público. Definición propia (**supuesto nuestro**), en `quality.ts`, usada por el instrumento para escribir `Quality` y por el motor para recalcularlo: `Q = 10 · log10(S / N)`, recortado entre 0 y 40, con `N` = piso de ruido estimado en las filas más oscuras del corte y `S` = percentil 99 de la imagen menos `N`. La señal se calibra para que una captura limpia dé entre 27 y 33 dB.

### 5.5 Fallas de captura

`CaptureConditions` (en `contract.ts`). Cada una tiene que verse en la imagen como la describe la sección 3.4 de `sans-oct-base-tecnica.md`:

| Falla | Efecto en la imagen |
|---|---|
| `signalLossDb` | Baja toda la señal respecto del piso de ruido; baja `Q` |
| `blink` | Una franja de columnas sin señal, en los cortes de `affectedScans` |
| `truncationPx` | La retina se sale por arriba del cuadro: esa cantidad de filas, contadas desde el punto más alto de la ILM, queda afuera |
| `decentrationMm` | El centro del patrón se aleja del nervio |
| `motion` | Bordes borrosos y escalones verticales entre bloques de columnas |
| `edgeFade` | La señal se apaga hacia un extremo del corte |

Cuando el pedido no trae `conditions`, salen de la semilla del intento: calidad media del examen normal(30; 1,5) recortada entre 26 y 34 dB, variación por corte de 0,8 dB y movimiento leve. Además hay una tabla corta de **eventos guionados** del escenario ficticio, que pisa lo anterior:

| Tripulante, ojo, día, intento | Falla | Para qué |
|---|---|---|
| B, OS, 150, 1 | Parpadeo en los cortes 18 a 31 (franja de 35 % del ancho) | Que el sistema pida repetir la captura y el intento 2 salga bien |
| C, OD, 90, 1 | Pérdida de señal de 18 dB (la calidad queda cerca de 12 dB) | Señal pobre: repetir |
| A, OD, 30, 1 | Retina 60 filas fuera de cuadro | Imagen cortada: repetir |

### 5.6 Imagen de fondo

1536 × 1536, un byte por píxel: fondo gris medio con variación suave y textura fina, nervio más claro con la copa más clara todavía, vasos oscuros y viñeteo leve. En la esquina inferior izquierda lleva escrito `SIMULATED DATA` con una tipografía de mapa de bits propia: la marca viaja dentro del archivo.

### 5.7 Rendimiento

Generar y analizar un examen completo de un ojo tiene que tardar menos de 10 segundos en un solo hilo en esta máquina (objetivo: menos de 6). Sin guardar los 48 cortes en memoria a la vez.

## 6. Motor de medición

`analyzeExam(exam, options)` recorre los cortes de a uno y devuelve un `ExamAnalysis`. Tiene que existir además como generador (`analyzeExamSteps`), que entregue un `AnalysisProgress` por paso y por corte, para que la interfaz muestre el proceso mientras ocurre.

### 6.1 Control de calidad de cada corte

Recalcula `Q` (5.4). Mide la fracción de columnas con señal, si la retina toca el borde superior del cuadro y si hay escalones de movimiento. Un corte no se usa si: `Q` < 15 dB (`low-signal`, P13); más de 15 % de las columnas de la zona de medición sin borde (`signal-dropout`); la ILM a menos de 8 filas del borde superior en esa zona (`truncated`); no se encuentran los bordes (`surface-not-found`) o los dos puntos de la abertura (`bmo-not-found`); o hay escalones (`motion`). Salvo el de 15 dB, estos límites son **supuesto nuestro**.

### 6.2 Bordes: ILM y BM

Camino de menor costo sobre el gradiente vertical de la imagen suavizada, en escala logarítmica: el método de grafos de Chiu y otros (2010), sección 6.1 de `sans-oct-base-tecnica.md`. Adaptaciones necesarias junto al nervio, a resolver acá:

- La ILM baja a la copa con paredes empinadas: el camino tiene que poder moverse varias filas por columna.
- La BM se corta en la abertura: adentro no hay borde que seguir. `bmPx` queda en `NaN` dentro de la abertura.
- Las columnas bajo un vaso tienen poca señal: se cruzan sin desviarse (paso 8 de Chiu).
- Si un examen trae líneas de capas en el archivo (`NumSeg` > 0), el motor **no** las usa: marca siempre desde la imagen.

### 6.3 Puntos de la abertura

En cada corte, los dos puntos donde termina la franja brillante del epitelio pigmentario y la BM, a cada lado del nervio, con precisión menor a un píxel y una confianza entre 0 y 1. Hay que distinguir el final real de la membrana de una sombra de vaso (que es angosta y oscurece toda la columna). Cada punto se pasa a milímetros del marco de frente con las coordenadas de la cabecera del corte.

### 6.4 Elipse de la abertura

Ajuste robusto de una elipse a los puntos de todos los cortes usables (hasta 96), descartando los que se alejan. Se informa centro, ejes, giro, área, residuo y cuántos puntos se usaron y se descartaron.

**Con examen de referencia** (`options.baseline`): la abertura es anatomía que no cambia en vuelo (área de 2,02 a 2,06 mm² en 31 astronautas, P3), y la NASA verifica a mano que el marcado coincida con el de antes del vuelo. El motor hace lo equivalente: si la elipse de este examen coincide con la de referencia (diferencia de área menor a 8 %), **coloca la forma de la elipse de referencia en el centro encontrado hoy** y mide con ella (`bmoSource: 'reference-shape'`). Entre 8 y 15 % mide con la elipse de hoy y lo deja anotado en `quality.features`. Con más de 15 % no mide (`bmo-mismatch-with-baseline`). Límites: **supuesto nuestro**.

### 6.5 Medidas

| Medida | Definición | Fuente |
|---|---|---|
| Grosor total de la retina (TRT) en un anillo | En cada columna, distancia en profundidad entre la ILM y la BM. Cada columna tiene una posición de frente; su distancia a la elipse decide a qué anillo pertenece. Promedio de las columnas del anillo, **ponderado por área** (cada muestra pesa según su distancia al centro de la elipse). Anillos: 0–250 (la medida principal), 250–500, 500–1000 y 1000–1500 µm | P1, P2, P3. La NASA interpola un mapa y promedia la zona; muestrear los 96 radios con peso por área es nuestra aproximación (**supuesto**) |
| Ancho mínimo del anillo neural (MRW) | Para cada punto de la abertura, la distancia más corta a la ILM dentro del plano del corte, con la escala de cada eje. Promedio de todos los puntos y promedio por sector | P1, P3, P6 |
| Sectores | Seis, respecto del eje temporal-nasal: temporal 90° (centrado en θ = 0°), temporal-superior 40°, nasal-superior 40°, nasal 110° (centrado en 180°), nasal-inferior 40° y temporal-inferior 40° | P6. La orientación respecto de la fóvea no se usa: **supuesto nuestro** |
| Rugosidad de la BM | En cada medio corte, la altura de la BM entre ρ = 300 y 1700 µm; se le resta un polinomio de grado 2 (inclinación y curvatura) y se calcula la raíz del promedio de los cuadrados de lo que queda, juntando todos los medios cortes usables | P4. La zona y el grado del polinomio son **supuesto nuestro** |
| Área de la abertura | Área de la elipse | P3 |

Cada medida es un `Quantity` con `origin: 'measured'`, su unidad y las fuentes de su definición. `standardError` e `interval95` quedan sin completar: los llena la etapa de validación.

### 6.6 Cuándo no se mide

El examen queda en `status: 'cannot-measure'`, con las medidas en `null` y el motivo en `rejections`, si: hay menos de 40 cortes usables de 48 (`too-few-usable-scans`); el ajuste de la elipse usa menos de 60 puntos o deja un residuo mayor a 60 µm (`bmo-fit-failed`); algún cuadrante tiene menos del 70 % de sus radios (`insufficient-ring-coverage`); el centro del patrón queda a más de 0,44 mm del centro de la abertura, el 10 % del largo del corte (`decentered`, criterio de P13); o no coincide con la referencia (6.4). Los límites sin fuente son **supuesto nuestro**. El motor nunca devuelve un número que no puede sostener.

### 6.7 Comparación con el examen de referencia

`compareWithBaseline(current, baseline)`: diferencia de cada medida (`origin: 'derived'`), más el cambio de área de la abertura como control de registro. Los dos exámenes tienen que ser del mismo ojo y de la misma serie (`ReferenceID`); si no, error.

## 7. Funciones públicas y archivos

Exportadas desde `packages/core/src/index.ts`, con los tipos de `contract.ts`:

```ts
// Tripulación y misión
const MISSION: Mission;
const CREW: readonly CrewMember[];

// Instrumento virtual y formato
function acquire(request: CaptureRequest): ExamSource;
function writeVol(exam: ExamSource): Uint8Array;
function writeVolBlocks(exam: ExamSource): Generator<Uint8Array>;
function readVol(bytes: Uint8Array): ExamSource;
function toDisplayGray(pixels: Float32Array): Uint8ClampedArray;

// Motor
function analyzeExam(exam: ExamSource, options?: AnalyzeOptions): ExamAnalysis;
function analyzeExamSteps(exam: ExamSource, options?: AnalyzeOptions): Generator<AnalysisProgress, ExamAnalysis>;
function summarize(analysis: ExamAnalysis): ExamSummary;
function compareWithBaseline(current: ExamSummary, baseline: ExamSummary): ChangeFromBaseline;

// Valor verdadero: solo pruebas, validación y vista de transparencia
function groundTruth(crewId: CrewId, eye: Eye, flightDay: number): EyeGroundTruth;
```

`AnalyzeOptions` lleva `baseline?: ExamSummary` y `onScan?: (scan: ScanAnalysis) => void`. `EyeGroundTruth` se agrega a `contract.ts`.

Carpetas sugeridas dentro de `packages/core/src/`: `rng.ts`, `constants.ts` (cada constante con su fuente), `sources.ts` (identificador → cita y link, tomados de las tablas de fuentes de las investigaciones), `math/`, `vol/`, `eye/`, `instrument/`, `engine/`. En `packages/validation/src/`: codificador PNG propio con `node:zlib`, y los dos programas de la sección 9.

Sin dependencias nuevas.

## 8. Pruebas y criterios de aceptación

| # | Qué se prueba | Criterio |
|---|---|---|
| 1 | Formato | Cada campo cae en el byte de la tabla (pruebas a nivel de byte sobre una cabecera generada). Escribir, leer y volver a escribir da los mismos bytes. El tamaño del archivo es el de la fórmula de la tabla 1.5. Fechas y valor "inválido" correctos |
| 2 | Lector | Rechaza con `VolFormatError` un archivo cortado, una versión desconocida y tamaños incoherentes. Lee exámenes con `NumSeg` > 0 |
| 3 | Reproducible | El mismo pedido da los mismos bytes; otro intento da otros. Un corte suelto es igual al mismo corte dentro del examen completo |
| 4 | Ojo virtual | Los objetivos de la sección 3.9, para los 8 ojos |
| 5 | Motor sin ruido (sin granulado ni fallas) | Error del anillo de 0 a 250 µm ≤ 3 µm; MRW ≤ 10 µm; área de la abertura ≤ 3 %; centro ≤ 25 µm |
| 6 | Motor con captura normal | Para los 8 ojos en los días 0, 30, 90 y 150: error del **cambio** del anillo ≤ 6 µm en al menos el 95 % de los casos y nunca mayor a 10 µm. Error del cambio de rugosidad ≤ 1,5 µm |
| 7 | Rechazo | Cada falla, fuerte, termina en `cannot-measure` con el motivo que corresponde; leve, se mide. Los tres eventos guionados de 5.5 se rechazan y su intento 2 se mide |
| 8 | Independencia | El motor no importa nada de `eye/` ni de `instrument/` (prueba sobre los imports) |
| 9 | Rendimiento | El de la sección 5.7 |
| 10 | Todo junto | `pnpm verify` pasa |

Si un criterio de precisión no se alcanza después de un esfuerzo razonable, **no se ajusta la prueba para que pase**: se deja la prueba con el valor logrado, marcada, y se informa. Ese error es el que después ve el astronauta como margen; tiene que ser el real.

## 9. Inspección visual y tabla de precisión

Dos programas en `packages/validation`, con su script en `package.json`:

1. **`preview`**: escribe en `.tmp/preview/` (carpeta ignorada) imágenes PNG con la transformación de visualización:
   - por cada tripulante, ojo derecho, días 0 y 150: los cortes 0, 12 y 24, limpios y con lo que marcó el motor encima (ILM, BM, puntos de la abertura y límites de los anillos);
   - la imagen de fondo de cada ojo, sola y con los 48 cortes y la elipse dibujados;
   - una imagen por cada falla de captura;
   - una imagen del tripulante D en el día 120 al lado de su examen de referencia.
2. **`accuracy`**: imprime y guarda en `packages/validation/out/accuracy.md` la tabla de la prueba 6: valor verdadero, valor medido y error de cada ojo y día, con el resumen.

**Mirar las imágenes es parte de la tarea.** Tienen que parecer cortes de tomografía del nervio óptico: retina en capas, copa, franja brillante del epitelio que se corta en la abertura, coroides, sombras de vasos y grano. Si algo se ve artificial o roto, se corrige antes de seguir con el motor.

## 10. Orden de trabajo y entrega

1. Azar, matemática y formato `.vol`, con sus pruebas. Commit.
2. Ojo virtual, tripulación y valor verdadero, con sus pruebas. Commit.
3. Instrumento virtual y programa `preview`. Mirar las imágenes. Commit.
4. Motor, de a un paso, mirando cada resultado dibujado sobre la imagen. Commit por paso.
5. Programa `accuracy`, pruebas de precisión, de rechazo y de rendimiento. Commit.

- Un commit por paso como mínimo, con rutas explícitas, y `pnpm verify` en verde antes de cada uno.
- Llevar `packages/core/NOTES.md` al día en cada commit: decisiones tomadas, cambios respecto de esta especificación con su motivo, supuestos nuevos y pendientes. Si la sesión se corta, otra persona tiene que poder seguir desde ahí.
- Sin subagentes.
- Ante una duda que cambie el resultado, preguntar al coordinador; ante una duda menor, decidir, anotarlo y seguir.

**Informe final**, corto: commits; cantidad de pruebas; la tabla de precisión resumida; tiempo de un examen; cambios respecto de la especificación; supuestos nuevos; y lo que quedó pendiente o flojo, dicho sin suavizar.
