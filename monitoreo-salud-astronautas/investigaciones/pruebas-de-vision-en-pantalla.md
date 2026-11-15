# Pruebas de visión en pantalla: normas y umbrales

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* |
| **Fecha** | 14 y 15 de noviembre de 2026 |
| **Para qué es** | Dar los parámetros, fórmulas y umbrales para programar tres pruebas que el astronauta hace en la pantalla (agudeza visual de cerca, grilla de Amsler y cuestionario de síntomas) y para decidir con respaldo cuándo un cambio es real. |
| **Qué no es** | No diseña la solución ni propone qué construir. No repite lo ya verificado sobre SANS (está en los otros documentos de esta carpeta). |
| **Fuente** | Manual de un programa de agudeza validado (FrACT), artículo original de Amsler (1953), informes de la NASA y artículos revisados por pares. Lista al final. |

### Cómo leerlo

- **Tipo de dato:** `[N]` norma o manual · `[T]` medido en personas en Tierra · `[A]` dato de astronautas o de la NASA · *derivado* = cuenta hecha acá con la fórmula indicada (no está en la fuente).
- **logMAR:** escala de agudeza visual; más alto es peor; 0,0 = 20/20. **0,1 logMAR = 1 línea de la cartilla = 5 letras** (B2, P1); 0,02 logMAR = 1 letra (BL1).
- **Límites de acuerdo** (*limits of agreement*, LoA): rango donde cae el 95 % de las diferencias entre dos mediciones de la misma persona sin que haya pasado nada (diferencia media ± 1,96 × desvío estándar de las diferencias). Es la "variación normal entre una prueba y otra".
- **"No encontrado"** = lo busqué y no apareció. **"Sin verificar"** = no pude leer la fuente completa.
- **Secciones:** 1 tabla central · 2 variación entre pruebas · 3 pruebas de pantalla validadas · 4 grilla de Amsler · 5 graduación y visión de cerca · 6 cuestionarios · 7 lo no verificado · 8 fuentes.

---

## 1. Tabla central: parámetro → valor o fórmula → fuente

### 1.A Agudeza visual de cerca en pantalla

| Parámetro | Valor o fórmula | Fuente |
|---|---|---|
| Escala | **logMAR** = log₁₀(MAR). MAR (*minimum angle of resolution*) = ancho del trazo o de la abertura más chica que se distingue, en minutos de arco (1′ = 1/60 de grado). 20/20 ⇔ MAR 1′ ⇔ logMAR 0,0. Snellen 20/X con X = 20 × MAR; decimal = 1 / MAR. Ejemplo del manual: letra de 30′ → trazo de 6′ → decimal 0,17 = 20/120 = 0,78 logMAR | F1 `[N]`. Norma ISO 8596: no leída (es de pago) |
| Forma de la figura | La figura (optotipo) mide **5 × trazo** de alto (grilla de 5 × 5); la abertura de la C y el trazo de la E miden 1/5 del alto | P1; F1 `[N]` |
| Alto de la figura | **alto_mm = 2 × d_mm × tan( (5 × 10^logMAR / 60)° / 2 )**; trazo_mm = alto_mm / 5 | *derivado* de la definición |
| Ejemplos a 40 cm | logMAR −0,1 → 0,46 mm · **0,0 (20/20) → 0,582 mm (trazo 0,116 mm)** · 0,3 → 1,16 mm · 0,5 → 1,84 mm · 1,0 → 5,82 mm | *derivado* |
| Píxeles necesarios a 40 cm | Trazo de 20/20 en 1 píxel: paso de píxel ≤ 0,116 mm ⇒ **≥ 218 píxeles por pulgada (ppi)**. Para llegar a 1,2 decimal (−0,08 logMAR): ≥ 262 ppi. Con 141 ppi (portátil de 15,6″ y 1920 × 1080), 1 píxel = 1,55′ ⇒ lo más fino con píxeles enteros es logMAR +0,19 (≈ 20/31) | *derivado* |
| Regla de FrACT sobre píxeles | Trazo mínimo: 1 píxel; con suavizado de bordes (*anti-aliasing*) acepta 0,5 píxel (los ppi de la fila anterior bajan a la mitad). Para medir bien una agudeza normal, la "mejor agudeza posible" de la pantalla debe ser al menos 1,2 decimal. El tamaño del píxel "puede ser un límite para medir de cerca" | F1 `[N]` |
| Calibrar el tamaño real | Método de la tarjeta: se apoya una tarjeta de tamaño estándar (ancho **85,60 mm**) sobre la pantalla y se ajusta un dibujo hasta que coincida. píxeles_por_mm = ancho_del_dibujo_en_píxeles / 85,60. No cambiar el zoom después | L1 `[T]`; F1 `[N]` |
| Distancia | Se mide de la pantalla al ojo y se mantiene toda la prueba (F1). Estimarla por el punto ciego del ojo (*virtual chinrest*): error promedio de 3,25 cm (desvío 2,40); a 43 cm, 3,46 cm (L1). Un error de distancia de 10 % mueve el resultado 0,04 logMAR (*derivado*: log₁₀ 1,1) | F1 `[N]`; L1 `[T]` |
| Brillo de la pantalla | **80 a 320 cd/m²**, recomendado 200 (normas DIN e ISO citadas por FrACT). Ambiente no oscuro; nada más brillante que la pantalla en el campo visual; 10 a 300 lux le parece bien al autor (opinión). En un iPad, los reflejos empeoraron la agudeza unas 2 líneas (56 personas); con filtro antirreflejo y sin fuentes de reflejo igualó a la cartilla (29 personas) | F1 `[N]`; BL1 `[T]` |
| Contraste | Figura oscura sobre fondo claro, contraste cercano a 100 % (fórmula de Weber) | F1 `[N]` |
| Figuras | **C de Landolt:** figura de referencia de la norma ISO 8596; 8 orientaciones (azar 12,5 %); no exige leer. **E giratoria:** 4 orientaciones (azar 25 %). **Letras de Sloan** (C D H K N O R S V Z): 10 opciones (azar 10 %); hay que nombrar o teclear la letra | F1 `[N]` |
| Para una prueba que se hace solo (lo que dicen las fuentes) | Con la C se responde la dirección de la abertura, sin leer. Con solo 4 opciones (E) hacen falta más presentaciones: 24 contra 18. En la aplicación V@home la prueba de cerca la hace la persona sola: desliza el dedo hacia donde apunta la E | F1 `[N]`; B3, H1 `[T]` |
| Puntaje adaptativo (FrACT) | Método *Best PEST*: cada figura se presenta en el umbral estimado hasta ese momento; las 4 primeras van de 0,1 a 0,8 decimal mientras acierte. Respuesta obligada aunque no vea. Umbral = punto medio entre el azar y 100 % (56,25 % con 8 orientaciones). Presentaciones por defecto: 18 (8 opciones), 24 (4), 32 (2). Para igualar a las cartillas se suma 0,05 logMAR | F1 `[N]` |
| Precisión según la cantidad de presentaciones | Límites de acuerdo: ±0,46 logMAR con 6 · **±0,17 con 18** · ±0,12 con 48 (26 personas) | B3 `[T]` |
| Puntaje letra por letra (cartillas) | 0,02 logMAR por letra, 5 letras por línea, pasos de 0,1 logMAR. Criterio de la norma para dar por vista una línea: 3 de 5 o 6 de 10 (60 %). Puntuar por línea entera da más variación que letra por letra (Snellen: ±0,33 contra ±0,24) | BL1, P1 `[T]`; F1 `[N]`; R1 (solo resumen) |
| En la estación (referencia) | De cerca: cartilla de papel a 16 pulgadas (≈ 40 cm), en la pared del módulo laboratorio; cada ojo, con y sin corrección | N2 pág. 26 `[A]` |

### 1.B Grilla de Amsler

| Parámetro | Valor o fórmula | Fuente |
|---|---|---|
| Medidas originales | Fondo negro y líneas blancas. **Cuadrado de 10 cm dividido cada 5 mm** (20 × 20 cuadros), con un punto de fijación en el centro. Distancia de lectura: **28 a 30 cm**. Cada cuadro cubre **1°**; la grilla, **20° × 20°** (10° a cada lado del centro). El punto ciego queda fuera. Sobre la retina, 20° = 5,36 mm | A1 pág. 525 y 526 `[N]` |
| Serie completa | 7 cartillas: blanca sobre negro (la usual), con diagonales, roja sobre negro, de puntos, de líneas paralelas, negra sobre blanco y una con cuadros de 0,5° en el centro | A1 pág. 527; C1 |
| En la estación | En la computadora del tomógrafo, con el mismo programa de la agudeza de lejos; un ojo por vez, en cada sesión. Distancia de 16 pulgadas (≈ 40 cm): ver `sans-evolucion-y-logica-clinica.md`, sección 5.1 | N2 pág. 26 `[A]` |
| Ángulo a 40 cm | Una grilla de 10 cm cubre 2 × atan(50/400) = **14,25°**; cada cuadro de 5 mm, **0,72°**. Para mantener 1° por cuadro a 40 cm: lado = 2 × 400 × tan(0,5°) = **6,98 mm** (20 cuadros ≈ 14 cm) | *derivado* |
| Procedimiento | Buena luz y con la graduación corregida. Un ojo por vez. Mirar fijo el punto central, sin recorrer la grilla. Comparar con el otro ojo ayuda. Preguntas: **(1)** ¿Las líneas son rectas y paralelas de punta a punta, sobre todo cerca del centro? ¿Todos los cuadros son regulares e iguales? **(2)** ¿Ve toda la grilla nítida y sin manchas? ¿La zona del centro se ve tan nítida como el borde? Si hay una mancha: ¿las líneas faltan del todo o están veladas o cortadas? | A1 pág. 527 a 529 `[N]` |
| Resultado positivo (NASA) | **Cualquier cambio en el aspecto de la grilla: líneas onduladas, borrosas o faltantes** | N2 pág. 26 `[A]` |
| Cómo lo describe Amsler | Cada hallazgo por su **lugar** (respecto del punto central), su **tamaño en cuadros** y su **tipo**: distorsión (líneas onduladas o quebradas; curvadas hacia el centro o hacia afuera; solo las horizontales o solo las verticales; grilla que "se mueve") o mancha velada (escotoma). Tamaños que da: de 1 o 2 cuadros a 10 líneas o más; la mancha central típica mide 10 a 12 cuadros de ancho. El paciente señala las manchas con el dedo | A1 pág. 527 a 529 `[N]` |
| Cuánto detecta | Degeneración macular con vasos nuevos: sensibilidad **0,78** y especificidad 0,97 (F2); **67 %** y 99 % frente a sanos, 71 % y 63 % frente a la forma sin vasos nuevos (B1). Se le escapa entre el 22 % y el 33 % de los casos. Detalle en 4.1. **En SANS: no encontrado** | F2, B1 `[T]` |

### 1.C Cuándo un cambio de agudeza es real

| Regla | Valor | Fuente |
|---|---|---|
| Criterio | La variación entre prueba y repetición es la diferencia que aparece "sin que haya un cambio genuino". Un cambio se toma como real cuando **supera los límites de acuerdo de la misma prueba**, hecha en las mismas condiciones | K1; F1 |
| Agudeza de cerca en pantalla a 40 cm (el caso más parecido) | Teléfono, E, la persona sola, con los dos ojos a la vez: límites de **−0,134 a +0,126 logMAR** en 50 adultos de 50 a 79 años ⇒ real si cambia más de ~0,13 logMAR (**más de 1 línea; 7 letras o más**). En 50 jóvenes: −0,235 a +0,199 (más de 2 líneas) | H1 `[T]` |
| Prueba adaptativa en pantalla (FrACT) | **±0,17 logMAR con 18 presentaciones** (casi 2 líneas); ±0,12 con 48. Resumen del autor sobre sus estudios: "≲ ±0,2 logMAR" | B3 `[T]`; F1 |
| Lectura conjunta de la sección 2 | Un cambio de **0,1 logMAR (1 línea) queda dentro de la variación** de todas las pruebas de pantalla medidas. Con 18 presentaciones o más, los límites van de ±0,12 a ±0,29 según la prueba y el grupo; Peek, en la casa contra la clínica, llegó a −0,50 | *derivado* de la tabla de la sección 2 |
| Sentido del sesgo | La segunda medición suele salir un poco mejor (0,008 a 0,03 logMAR): aprendizaje | B2, B3, K1 `[T]` |
| Qué baja la variación | Más presentaciones (mejora cerca de 1/√n) o repetir la prueba y promediar | F1; B3 |
| Umbral de la NASA para un cambio de agudeza | **No encontrado.** Para la graduación sí: ≥ +0,75 D en 6 meses es "excesivo"; 0,5 D ya se toma como cambio | N3 pág. 16; S1 `[A]` |

---

## 2. Variación normal entre una prueba y otra `[T]`

| Prueba | Personas y condición | Límites de acuerdo del 95 % (logMAR) | Fuente |
|---|---|---|---|
| **V@home, de cerca** (teléfono, E, 40 cm, dos ojos, la persona sola) | 50 adultos de 50 a 79 años · 50 jóvenes de 13 a 26; repetición el mismo día | **−0,134 a +0,126** · −0,235 a +0,199 | H1 |
| Cartilla ETDRS de cerca (E, 40 cm) | Los mismos grupos | −0,138 a +0,150 · −0,081 a +0,105 | H1 |
| V@home, de lejos (2 m, un ojo, con ayuda) | Los dos grupos y 63 personas en Australia | −0,175 a +0,195 · −0,254 a +0,258 · −0,289 a +0,257 | H1 |
| Cartilla ETDRS de lejos | Los mismos tres grupos | −0,125 a +0,177 · −0,063 a +0,071 · −0,129 a +0,123 | H1 |
| **FrACT** (C de Landolt de 8 orientaciones, a 4 m) | 26 personas de 20 a 59 años; agudeza de 1,22 a −0,59 logMAR (en parte empeorada a propósito) | ±0,46 (6 presentaciones) · **±0,17 (18)** · ±0,12 (48). No depende del nivel de agudeza | B3 |
| FrACT, 24 presentaciones | 40 personas (19 a 29 años y una de 64), los dos ojos | El artículo da ≈ ±0,10 con una fórmula propia; el autor lo recalculó después con el método habitual: **±0,19** (24) y ±0,22 (18) | B2; F1 |
| COMPlog (programa en computadora, letras) | 20 adultos, dos visitas separadas 4 días en promedio | **±0,123** con visión normal; ±0,193, ±0,197, ±0,218 y ±0,125 con cuatro filtros que empeoran la visión | K1 |
| HAT (cartilla impresa en casa, a 150 cm) | 50 adultos sanos (36 años en promedio) | −0,13 a +0,10; letra por letra, diferencias de −2 a +1 letras | C2 |
| Peek Acuity (teléfono, E, 2 m, con examinador) | 233 personas en Kenia: en la casa y al día siguiente en la clínica | −0,498 a +0,390. El "±0,033" del resumen del artículo no coincide con estos límites de su tabla 1 | P1 |
| Cartillas en consultorio | Pacientes con agudezas variadas | ETDRS ±0,18 · Snellen ±0,24 (letra por letra) y ±0,33 (por línea) | R1 (solo resumen) |

---

## 3. Pruebas de pantalla ya validadas `[T]`

| Prueba | Qué es | Contra qué | Resultado | Fuente |
|---|---|---|---|---|
| FrACT (Freiburg Vision Test) | Programa que corre en el navegador; C, E o letras; método adaptativo | Repetición de la misma prueba | Sección 2. Comparaciones con cartillas en otros laboratorios: citadas por el autor, no leídas | F1; B3 |
| Peek Acuity | Teléfono; E de 5 × 5 en 4 orientaciones; a 2 m | Cartilla ETDRS y cartilla de Snellen; 272 personas en clínica y 233 en la casa | Diferencia media con ETDRS: 0,011 logMAR en clínica (límites −0,396 a +0,417) y 0,055 en la casa (−0,438 a +0,549). Tiempo: 77 s contra 82 s de Snellen | P1 |
| V@home | Teléfono; E; escalera adaptativa; brillo al máximo; de lejos a 2 m y **de cerca a 40 cm** | Cartillas ETDRS de lejos y de cerca; 163 personas en 3 grupos | Diferencia media de cerca: −0,042 a −0,092 logMAR; límites contra ETDRS de cerca: −0,264 a +0,180 (adultos mayores), −0,372 a +0,188 (jóvenes), −0,299 a +0,163 (Australia) | H1 |
| Eye Handbook | Teléfono (iPhone 5), cartilla de cerca en pantalla a 36 cm | Tarjeta de cerca de Rosenbaum; 100 personas de 18 a 89 años | La aplicación dio en promedio 0,11 logMAR mejor que la tarjeta | T1 |
| iPad con letras de Sloan (lejos) | Tableta | Cartilla ETDRS y sistema computarizado; 85 personas | Con reflejos, ~2 líneas peor; sin reflejos, equivalente | BL1 |
| HAT | Cartilla para imprimir en casa | Cartilla convencional; 50 controles | −0,14 logMAR (límites −0,41 a +0,12) | C2 |

---

## 4. Grilla de Amsler: cuánto detecta y versiones digitales `[T]`

### 4.1 Cuánto detecta y cuánto se le escapa (enfermedad de la mácula, en Tierra)

| Estudio | Qué reunió | Sensibilidad (detecta) | Especificidad | Fuente |
|---|---|---|---|---|
| Faes 2014, revisión | 12 estudios, 903 pacientes; casi todos comparan enfermos con sanos | **0,78** (IC 95 %: 0,64 a 0,87); entre estudios, de 0,34 a 1,0 | 0,97 (0,91 a 0,99); de 0,85 a 1,0 | F2 |
| Bjerager 2023, revisión | 10 estudios, 1890 ojos; degeneración macular con vasos nuevos | **67 %** (51 a 79) frente a sanos · 71 % (60 a 80) frente a la forma sin vasos nuevos | 99 % (85 a 100) · 63 % | B1 |
| Crossland y Rubin 2007, comentario | Estudios sueltos | 56 % frente a un examen fino del campo central; **se le escapa el 77 % de las manchas de menos de 6°**; 9 % en degeneración macular temprana y 34 % en la tardía | ~2 % de sanos marcan una mancha que no existe | C1 |

- **Por qué se le escapa:** el cerebro "rellena" la zona que falta (*filling-in*), igual que con el punto ciego (C1); además la persona tiende a mover la mirada del punto central hacia donde ve el defecto (SC1).
- La versión de **líneas blancas sobre fondo negro** mostró distorsiones y manchas más evidentes que la negra sobre blanco en 182 pacientes (C1).
- **En SANS** (pliegues, hinchazón del nervio): sensibilidad de la grilla **no encontrada**. En los casos 4 y 5 de la NASA se imprimió una grilla a bordo; el informe no dice qué dio (N2 pág. 13).

### 4.2 Versiones digitales y pruebas emparentadas

| Versión | Cómo es | Dato | Fuente |
|---|---|---|---|
| Programa de la estación | Grilla en la computadora del tomógrafo | Sin datos de exactitud publicados: no encontrado | N2 `[A]` |
| Alleye (aplicación) | Alinear un punto entre otros dos; obliga a mirar el centro. Cubre 12,7° (la grilla, 20° a 30 cm) | Distingue degeneración macular con vasos nuevos de sanos de la misma edad: área bajo la curva 0,845 (63 y 19 ojos) | SC1 |
| ForeseeHome (equipo para la casa; perimetría de hiperagudeza, PHP) | Detectar un desvío en una línea de puntos que aparece un instante | 1520 personas: al detectar los vasos nuevos habían perdido 4 letras (mediana) contra 9 con el cuidado habitual. La técnica PHP, en la revisión: sensibilidad 0,85 y especificidad 0,87 | CH1*; C1; F2 |
| Prueba de discriminación de formas (hSDH) en iPhone | Distinguir un círculo deformado de uno perfecto | 100 personas; correlación 0,88 con la versión de escritorio | W1* |
| Amsler adaptada en realidad virtual (NASA) | Ver `sans-evolucion-y-logica-clinica.md`, sección 5.2 | — | — |

---

## 5. Cambio de graduación y visión de cerca

**Términos:** dioptría (D) = unidad de la graduación. Corrimiento hacia la hipermetropía (*hyperopic shift*) = el ojo pasa a necesitar más graduación positiva; para ver nítido tiene que enfocar más (acomodar), y esa capacidad se pierde con la edad, sobre todo después de los 40 (N3 pág. 15).

### 5.1 En astronautas `[A]`

| Dato | Valor | Fuente |
|---|---|---|
| Tamaño del cambio | Promedio +0,12 D (IC 95 %: +0,02 a +0,22) en 56 ojos; 48,2 % se corrió hacia la hipermetropía. Hasta +2,00 D en una misión. ≥ +0,75 D en ~15 % | S1; N3 pág. 16 |
| Casos con peor visión de cerca | 5 de 7 astronautas tenían un cambio ≥ +0,50 D (de +0,50 a +1,50 D) | N3 pág. 16 |
| Medición a bordo | No hay método confiable para medir la graduación en la estación; todos quedaron corregibles a 20/20 con anteojos nuevos | N3 pág. 16 |

### 5.2 Agudeza según el esfuerzo de enfoque y la edad `[T]`

60 personas sanas con visión corregida de 20/20, con los dos ojos, mirando una cartilla lejana a través de lentes negativas (SH1). Cada lente de −X D obliga a enfocar X dioptrías: **−1,5 D equivale a mirar a 66 cm y −2,5 D a 40 cm**. Valores en logMAR (promedio; el desvío llega a ±0,21).

| Edad | 0 D (lejos) | −1,0 | −1,5 (66 cm) | −2,0 | −2,5 (40 cm) | −3,0 |
|---|---|---|---|---|---|---|
| 37 a 39 | −0,129 | −0,099 | −0,079 | −0,049 | −0,036 | −0,013 |
| 40 a 42 | −0,131 | −0,099 | −0,028 | 0,018 | 0,106 | 0,233 |
| 43 a 45 | −0,114 | −0,089 | 0,023 | 0,124 | 0,211 | 0,367 |
| 46 a 48 | −0,155 | −0,009 | 0,123 | 0,319 | 0,456 | 0,533 |

### 5.3 Qué se pierde con +0,75 D y +1,50 D (*derivado* de 5.2)

Supuesto: un corrimiento de +X D sin corregir obliga a enfocar X dioptrías más a cualquier distancia, igual que una lente de −X D. Es óptica estándar, **no una medición en astronautas**. Pérdida en logMAR respecto del valor propio de cada edad (0,1 = 1 línea).

| Tarea | Corrimiento | 40 a 42 años | 43 a 45 | 46 a 48 | Cómo sale |
|---|---|---|---|---|---|
| Pantalla a 66 cm | +0,75 D | 0,09 | 0,14 | 0,26 | Entre las columnas −2,0 y −2,5 |
| Pantalla a 66 cm | **+1,50 D** | **0,26** | **0,34** | **0,41** | Columna −3,0 |
| Lectura a 40 cm | +0,50 D | 0,13 | 0,16 | 0,08 | Columna −3,0 |
| Lectura a 40 cm | +0,75 D | ≈ 0,16 | ≈ 0,18 | ≈ 0,16 | **Fuera del rango medido** (haría falta −3,25 D). Extrapola la pendiente entre −2,0 y −3,0 D: 0,21 a 0,24 logMAR por dioptría. Sin verificar |
| Lectura a 40 cm | +1,50 D | ≈ 0,32 | ≈ 0,36 | ≈ 0,32 | Ídem (haría falta −4,0 D). Sin verificar |
| De lejos | +1,50 D | 0,10 | 0,14 | 0,28 | Columna −1,5 |

Dos datos más para ubicar el rango:

- **Desenfoque que el ojo no puede compensar** (19 jóvenes de 22 a 29 años, con la pupila dilatada y lentes positivas, CG1): de 0 a 3 D de desenfoque la agudeza pasó de −0,19 a **0,64 logMAR** y la letra más chica legible de −0,16 a 0,58. En promedio 0,28 logMAR por dioptría (*derivado*) ⇒ ≈ 0,2 con 0,75 D y ≈ 0,4 con 1,50 D. La velocidad de lectura casi no cambió hasta 2 D y bajó 23 % con 3 D.
- **Capacidad de enfoque por edad** (medida con instrumento, datos de 5 estudios, AN1): capacidad (D) = 7,083 / (1 + e^(0,2031 × (edad − 36,2) − 0,6109)). Da 3,3 D a los 40 años, 1,7 D a los 45 y 0,7 D a los 50 (*derivado* de la fórmula). Leer a 40 cm pide 2,5 D; con +0,75 D pide 3,25 D y con +1,50 D, 4,0 D (*derivado*).

### 5.4 Anteojos a bordo (*Space Anticipation Glasses*) `[A]`

| Dato | Valor | Fuente |
|---|---|---|
| Cuántos | Toda la tripulación vuela con **al menos 3 pares** de anteojos recetados de distinta graduación. Es un requisito de la norma NASA-STD-3001: corrección óptica "con niveles crecientes de potencia" | N1 |
| Cómo se usan | Varios pares (o lentes de contacto) de potencia variada; en órbita el tripulante elige el que le devuelve la mejor visión | PT1 |
| Graduaciones publicadas | Caso 7: sus anteojos de reserva eran **+1,25 D más fuertes** que los de siempre; los empezó a usar a los 3 o 4 meses. Casos 4 y 5: se subieron anteojos de lectura de **2,5 D y 3,25 D**; a uno le sirvieron más los de 3,25 D | N2 pág. 14 y 21 |
| Anteojos de foco ajustable | Los hay a bordo según una revisión de 2024 que cita una nota de prensa; el cuestionario de la NASA pregunta por "anteojos ajustables" | V1 (fuente secundaria); N2 pág. 27 |
| Graduación de cada uno de los 3 pares | **No encontrado** | — |

---

## 6. Cuestionarios de síntomas visuales y de dolor de cabeza

### 6.1 Qué pregunta el cuestionario de la NASA (el formulario no es público; su contenido sí está descrito) `[A]`

| Parte | Contenido | Fuente |
|---|---|---|
| Pregunta de entrada | ¿Notó algún cambio en la visión desde el lanzamiento o desde el último examen? | N2 pág. 27 |
| Grado del cambio | **Leve:** no afecta las actividades · **Moderado:** tuvo que adaptarse, pero completó todo · **Grave:** afectó o impidió actividades | N2 pág. 27 |
| Temas | Distorsión · visión con poca luz · agudeza que fluctúa · percepción de profundidad · visión doble · pérdida pasajera de la visión · cambio de cerca, a distancia intermedia y de lejos | N2 pág. 27 |
| Anteojos | Tipo que usa: progresivos, bifocales, de lectura o ajustables | N2 pág. 27 |
| Otros síntomas | Dolor de cabeza · zumbido en los oídos · náuseas · dificultad para pensar; cada uno leve, moderado o grave | N2 pág. 27 |
| Origen | Formulario electrónico hecho en 2010 a partir de uno de papel de una página del transbordador; el tripulante también anota sus puntajes de agudeza | N4 |

### 6.2 Cuestionarios públicos o publicados `[T]`

| Cuestionario | Qué mide | Tamaño y puntaje | ¿Se puede usar libremente? | Fuente |
|---|---|---|---|---|
| **CVS-Q** (*Computer Vision Syndrome Questionnaire*) | **16 síntomas** de ojos y visión: ardor, picazón, cuerpo extraño, lagrimeo, parpadeo excesivo, ojo rojo, dolor de ojo, párpados pesados, sequedad, **visión borrosa, visión doble, dificultad para enfocar de cerca**, molestia con la luz, halos de colores, sensación de ver peor y **dolor de cabeza** | Por síntoma: frecuencia (nunca, a veces, seguido o siempre) × intensidad (moderada, intensa); el producto se recodifica 0 → 0, 1 o 2 → 1, 4 → 2. Suma ≥ 6 = positivo. Sensibilidad 75,0 % y especificidad 70,2 % (para molestias por pantallas, no para SANS) | Publicado completo en artículos de acceso abierto; lleva © de sus autores: **condiciones de uso no verificadas** | Q2 |
| **NEI VFQ-25** | Función visual en la vida diaria; incluye dolor o molestia ocular (2 ítems) y tareas de cerca (3 ítems: leer letra de diario, trabajos de cerca, encontrar algo en un estante) | 25 ítems más un anexo opcional (A1 a A13) | **Sí:** documento público y gratuito; no pide permiso para uso no comercial, solo citarlo | Q1 |
| CISS (*Convergence Insufficiency Symptom Survey*) | Molestias al leer o trabajar de cerca por dificultad para converger los ojos | 15 ítems de 0 (nunca) a 4 (siempre); en adultos, ≥ 21 = con síntomas | Lista de ítems y condiciones: no leídas | Q3 |
| Cuestionario de dolor de cabeza usado en la estación | Episodios de dolor de cabeza según los criterios de la clasificación internacional (ICHD-3) | Diario los primeros 7 días y después semanal; intensidad de 0 a 10; el resto, sí o no; se describe el episodio más fuerte | Texto completo en un anexo de la revista: no leído | Q4 `[A]` |
| HIT-6 (*Headache Impact Test*) | Impacto del dolor de cabeza | 6 ítems; puntaje de 36 a 78; período de 4 semanas | **No:** requiere licencia del titular (IQVIA) | Q5; Q6* |

### 6.3 Con qué frecuencia aparece cada síntoma (para interpretar respuestas)

| Grupo | Dato | Fuente |
|---|---|---|
| 24 astronautas en la estación, 3596 días `[A]` | 22 (91,7 %) tuvieron al menos un dolor de cabeza; 378 episodios (mediana 9 por persona). De 189 descritos: 89,9 % de tipo tensional y 10,1 % migraña; la migraña fue más frecuente la primera semana (23,5 % contra 5,1 %) | Q4 |
| 165 pacientes en Tierra con presión alta dentro del cráneo sin causa conocida `[T]` | Dolor de cabeza 84 % (intensidad media 6,3 de 10) · pérdidas pasajeras de la visión 68 % · zumbido que late 52 % · pérdida de visión 32 % · visión doble 18 % | Q5 |
| Caso 7 de la NASA `[A]` | Con hinchazón del nervio, nunca tuvo pérdidas pasajeras de la visión, dolor de cabeza, visión doble ni zumbido | N2 pág. 21 |

---

## 7. Lo no verificado

**Sin verificar (no leí la fuente completa)**

- Norma ISO 8596 (de pago): la definición de la escala y la forma de las figuras salen del manual de FrACT y de los artículos.
- R1 (cartillas en consultorio: ±0,18, ±0,24 y ±0,33): solo el resumen.
- CH1 y W1 (pruebas de hiperagudeza): solo el resumen. Q6 (licencia del HIT-6): solo la ficha del titular.
- Pérdida de visión a 40 cm con +0,75 D y +1,50 D: es una extrapolación (5.3); la medición llega al equivalente de +0,50 D.
- A1: leí las páginas 522 a 529 (el artículo va de la 521 a la 537).
- El "±0,033 logMAR" del resumen de Peek no coincide con su tabla 1; no pude aclarar a qué corresponde.
- Distancia de la prueba de lejos en la estación: el informe de 2017 dice 15 pies (N2 pág. 26); según `sans-evolucion-y-logica-clinica.md`, las diapositivas de 2022 dicen 10 pies.

**No encontrado**

- Variación entre prueba y repetición medida en astronautas o en microgravedad, y umbral de la NASA para decir que la agudeza cambió.
- Variación de la agudeza de cerca en pantalla medida con un ojo por vez (H1 la midió con los dos ojos).
- Sensibilidad de la grilla de Amsler para los hallazgos de SANS, y medidas de la grilla que muestra el programa de la estación.
- Graduación de cada par de anteojos del juego estándar de la NASA.
- Formulario completo del cuestionario ocular de la NASA.
- Un cuestionario corto, validado y de uso libre que cubra a la vez síntomas visuales y dolor de cabeza: el CVS-Q los cubre, pero no verifiqué sus condiciones de uso.

## 8. Fuentes

**Texto completo:** *Sí* = leído · *Parcial* = leí las partes de donde salen los datos · *No* = con el motivo. Un asterisco (`W1*`) = solo resumen o fragmento.

| Id | Fuente | Texto completo |
|---|---|---|
| F1 | FrACT₁₀ (Freiburg Vision Test, M. Bach): [manual](https://michaelbach.de/fract/manual.html), [lista de control](https://michaelbach.de/fract/checklist.html) y [página principal](https://michaelbach.de/fract/) con la tabla de variación | Parcial (calibración, figuras, método, tabla de variación) |
| B2 | [Bach y Schäfer 2016, FrACT con y sin aviso de acierto, PLoS One](https://pmc.ncbi.nlm.nih.gov/articles/PMC4732607/) | Parcial (método y resultados) |
| B3 | [Bach 2025, cantidad óptima de presentaciones en FrACT, Graefes Arch](https://pmc.ncbi.nlm.nih.gov/articles/PMC11868300/) | Parcial (resumen, método y resultados) |
| K1 | [Kan 2019, variación del programa COMPlog, Br Ir Orthopt J](https://pmc.ncbi.nlm.nih.gov/articles/PMC7510395/) | Parcial (método, tabla y discusión) |
| H1 | [Han 2019, V@home, Transl Vis Sci Technol](https://pmc.ncbi.nlm.nih.gov/articles/PMC6701871/) | Parcial (método, tabla 1 y resultados) |
| P1 | [Bastawrous 2015, Peek Acuity, JAMA Ophthalmol](https://pmc.ncbi.nlm.nih.gov/articles/PMC5321502/) | Parcial (método, tabla 1 y resultados) |
| C2 | [Crossland 2021, cartilla para imprimir en casa (HAT), JAMA Ophthalmol](https://pmc.ncbi.nlm.nih.gov/articles/PMC7791401/) | Parcial (resumen y resultados) |
| T1 | [Tofigh 2015, agudeza de cerca con una aplicación, Eye](https://pmc.ncbi.nlm.nih.gov/articles/PMC4815669/) | Parcial (resumen y método) |
| BL1 | [Black 2013, iPad para agudeza de lejos, BMJ Open](https://pmc.ncbi.nlm.nih.gov/articles/PMC3693417/) | Parcial (resumen y método) |
| R1* | [Rosser 2001, cartilla logMAR reducida, Br J Ophthalmol](https://pmc.ncbi.nlm.nih.gov/articles/PMC1723918/) | No: solo el resumen |
| L1 | [Li 2020, "apoyamentón virtual", Sci Rep](https://pmc.ncbi.nlm.nih.gov/articles/PMC6976612/) | Parcial (método y resultados de distancia) |
| A1 | [Amsler 1953, primeros síntomas de las enfermedades de la mácula, Br J Ophthalmol](https://pmc.ncbi.nlm.nih.gov/articles/PMC1324189/) | Parcial (páginas 522 a 529, escaneadas) |
| C1 | [Crossland y Rubin 2007, la grilla de Amsler, Br J Ophthalmol](https://pmc.ncbi.nlm.nih.gov/articles/PMC1857645/) | Parcial (medidas, sensibilidad y causas de los fallos) |
| F2 | [Faes 2014, revisión de la grilla de Amsler, Eye](https://pmc.ncbi.nlm.nih.gov/articles/PMC4094801/) | Parcial (resumen, método y resultados) |
| B1 | [Bjerager 2023, revisión de la grilla de Amsler, JAMA Ophthalmol](https://pmc.ncbi.nlm.nih.gov/articles/PMC12278824/) | Parcial (resumen y resultados) |
| SC1 | [Schmid 2019, aplicación Alleye, Eye](https://pmc.ncbi.nlm.nih.gov/articles/PMC7002442/) | Parcial (resumen e introducción) |
| CH1* | [Chew 2014, estudio HOME con ForeseeHome, Ophthalmology](https://pmc.ncbi.nlm.nih.gov/articles/PMC3918479/) | No: solo el resumen |
| W1* | [Wang 2013, prueba de formas en teléfono, Invest Ophthalmol Vis Sci](https://pmc.ncbi.nlm.nih.gov/articles/PMC3743459/) | No: solo el resumen |
| SH1 | [Shafer 2023, curva de desenfoque de 37 a 48 años, Clin Ophthalmol](https://pmc.ncbi.nlm.nih.gov/articles/PMC10022518/) | Parcial (método, tabla 1 y discusión) |
| CG1 | [Chung 2007, desenfoque y lectura, Vision Res](https://pmc.ncbi.nlm.nih.gov/articles/PMC3572218/) | Parcial (resumen, método y resultados) |
| AN1 | [Anderson 2008, capacidad de enfoque por edad, Invest Ophthalmol Vis Sci](https://pmc.ncbi.nlm.nih.gov/articles/PMC2730890/) | Parcial (resumen, método y fórmula) |
| S1 | [Svoronos 2025, cambios de graduación en astronautas, Am J Ophthalmol](https://pmc.ncbi.nlm.nih.gov/articles/PMC12629133/) | Parcial (resumen y definiciones) |
| V1 | [Vineyard 2024, cambios de graduación en vuelo, Eye](https://pmc.ncbi.nlm.nih.gov/articles/PMC11427682/) | Parcial (introducción) |
| PT1 | [Patel 2020, riesgos de salud para Marte, npj Microgravity](https://pmc.ncbi.nlm.nih.gov/articles/PMC7645687/) | Parcial (párrafo sobre SANS) |
| N1 | [NASA OCHMO-MTB-001, 2024](https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf) | Parcial (contramedidas y requisito de la norma) |
| N2 | [NASA, informe de evidencia sobre SANS, 2017](https://humanresearchroadmap.nasa.gov/evidence/reports/SANS.pdf) | Parcial (casos 4, 5 y 7; pruebas en vuelo: pág. 13, 14, 21, 26 y 27) |
| N3 | [NASA, informe de evidencia sobre SANS, 2022](https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf) | Parcial (sección de graduación, pág. 15 y 16) |
| N4 | [Byrne 2010, cuestionario de visión en vuelo (NASA NTRS)](https://ntrs.nasa.gov/citations/20100039152) | Sí (es un resumen de una página) |
| Q1 | RAND, NEI VFQ-25: [página](https://www.rand.org/health-care/surveys_tools/vfq.html) y [cuestionario](https://www.rand.org/content/dam/rand/www/external/health/surveys_tools/vfq/vfq25survey_intadmin.pdf) | Parcial (permisos e ítems) |
| Q2 | CVS-Q: [Cantó-Sancho 2022, versión italiana](https://pmc.ncbi.nlm.nih.gov/articles/PMC9028942/) y [2023, versión china con la inglesa](https://pmc.ncbi.nlm.nih.gov/articles/PMC10318657/) | Parcial (descripción, ítems y puntaje) |
| Q3 | [Darko-Takyi 2022, CISS en adultos jóvenes, J Optom](https://pmc.ncbi.nlm.nih.gov/articles/PMC9237593/) | Parcial (método) |
| Q4 | [van Oosterhout 2024, dolor de cabeza en astronautas, Neurology](https://pmc.ncbi.nlm.nih.gov/articles/PMC11033988/) | Parcial (resumen, método y resultados) |
| Q5 | [Wall 2014, perfil inicial del ensayo de hipertensión intracraneal, JAMA Neurol](https://pmc.ncbi.nlm.nih.gov/articles/PMC4351808/) | Parcial (cuestionarios y síntomas) |
| Q6* | [IQVIA, ficha del HIT-6](https://coas.iqvia.com/COAs/headache-impact-test-standard) | No: solo un fragmento de la ficha, visto en el buscador (la página no abrió desde esta máquina) |
