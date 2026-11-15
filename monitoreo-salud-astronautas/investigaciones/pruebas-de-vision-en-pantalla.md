# Pruebas de visión en pantalla: normas y umbrales

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* |
| **Fecha** | 14 de noviembre de 2026 |
| **Para qué es** | Dar los parámetros, fórmulas y umbrales para programar tres pruebas que el astronauta hace en la pantalla (agudeza visual de cerca, grilla de Amsler y cuestionario de síntomas) y para decidir con respaldo cuándo un cambio es real. |
| **Qué no es** | No diseña la solución ni propone qué construir. No repite lo ya verificado sobre SANS (está en los otros documentos de esta carpeta). |
| **Estado** | **En curso (15/11): tabla central con las celdas de variación y de cambio real ya leídas en la fuente.** Las celdas que siguen marcadas "por verificar" todavía no fueron leídas en la fuente completa. Faltan: grilla de Amsler (medidas y registro), cambio de graduación y cuestionarios. |

**Tipo de dato:** `[N]` norma o manual · `[T]` medido en personas en Tierra · `[A]` dato de astronautas o de la NASA · *derivado* = cuenta hecha acá con la fórmula indicada (no está en la fuente).

---

## Tabla central: parámetro → valor o fórmula → fuente

### A. Agudeza visual de cerca en pantalla

| Parámetro | Valor o fórmula | Fuente |
|---|---|---|
| Escala | **logMAR** = log₁₀(MAR). MAR (*minimum angle of resolution*) = ángulo del detalle más chico que se distingue, en minutos de arco (1′ = 1/60 de grado). 20/20 ⇔ MAR 1′ ⇔ logMAR 0,0. Equivalencias: Snellen 20/X con X = 20 × 10^logMAR; decimal = 1 / MAR | Definición estándar; por verificar en norma |
| Forma de la figura | La figura (optotipo) mide **5 × MAR** de alto y el trazo o la abertura mide **1 × MAR** (grilla de 5 × 5) | FrACT (F1); por verificar en norma |
| Alto de la figura | **alto_mm = 2 × d_mm × tan( (5 × 10^logMAR / 60)° / 2 )**; trazo_mm = alto_mm / 5 | *derivado* de la definición |
| Ejemplo a 40 cm, 20/20 | alto = 2 × 400 × tan(0,04167°) = **0,582 mm**; trazo = **0,116 mm** | *derivado* |
| Píxeles necesarios a 40 cm | Para que el trazo de 20/20 ocupe 1 píxel: paso de píxel ≤ 0,116 mm ⇒ **≥ 218 píxeles por pulgada**. Con una pantalla de 141 ppi (portátil de 15,6″ y 1920 × 1080), 1 píxel = 1,55′ ⇒ lo más fino que se puede dibujar con píxeles enteros es logMAR +0,19 (≈ 20/31) | *derivado* |
| Regla de FrACT sobre píxeles | Trazo mínimo: 1 píxel; con suavizado de bordes (*anti-aliasing*) acepta 0,5 píxel. Para medir agudeza normal, la "mejor agudeza posible" de la pantalla debe ser al menos 1,2 decimal (−0,08 logMAR) | F1 `[N]` |
| Calibrar el tamaño real | Método de la tarjeta: se apoya una tarjeta de tamaño estándar (ancho **85,60 mm**) sobre la pantalla y se ajusta un dibujo hasta que coincida. píxeles_por_mm = ancho_del_dibujo_en_píxeles / 85,60. No cambiar el zoom después | F1 `[N]`; L1 `[T]` |
| Brillo de la pantalla | **80 a 320 cd/m²**, recomendado 200 cd/m² (normas DIN e ISO, citadas por FrACT). Ambiente no oscuro; nada más brillante que la pantalla en el campo visual | F1 `[N]`; norma original por verificar |
| Contraste | Figura oscura sobre fondo claro, contraste cercano a 100 % (Weber) | F1 `[N]`; norma original por verificar |
| Figuras | **C de Landolt**: figura de referencia de la norma ISO 8596; 8 orientaciones (azar 12,5 %); no requiere leer. **E giratoria**: 4 orientaciones (azar 25 %). **Letras de Sloan** (C D H K N O R S V Z): 10 opciones (azar 10 %); hay que nombrar o teclear la letra | F1 `[N]` |
| Puntaje adaptativo (FrACT) | Método *Best PEST*: cada figura se presenta en el umbral estimado hasta ese momento. Respuesta obligada aunque no se vea. Umbral = punto medio entre el azar y 100 % (56,25 % con 8 orientaciones). Cantidad de presentaciones por defecto: 18 (8 opciones), 24 (4 opciones). Para igualar a las cartillas se suma 0,05 logMAR | F1 `[N]` |
| Puntaje letra por letra | 0,02 logMAR por letra en cartillas de 5 letras por línea y pasos de 0,1 logMAR | por verificar |
| Variación entre prueba y repetición (límites de acuerdo del 95 % = diferencia media ± 1,96 × desvío estándar de las diferencias) | **FrACT** (C de Landolt, 24 presentaciones, 40 personas sanas, misma sesión): **±0,095 a ±0,100 logMAR** (≈ ±1 línea); la segunda vez sale 0,012 logMAR mejor (aprendizaje) (B2). **COMPlog** (programa en computadora, 20 adultos, dos visitas separadas 4 días en promedio): **±0,123 logMAR** con visión normal y ±0,125 a ±0,218 con visión empeorada a propósito (K1). **Cartilla ETDRS** en pacientes de consultorio: ±0,18 logMAR; cartilla de Snellen: ±0,24 puntuando letra por letra y ±0,33 puntuando por línea (R1, solo el resumen). **Peek Acuity** (teléfono a 2 m, 233 personas en Kenia, en la casa y al día siguiente en la clínica): diferencia media −0,054 logMAR y límites de acuerdo de **−0,498 a +0,390 logMAR** (tabla 1 del artículo); el "±0,033" del resumen no coincide con esos límites | B2, K1, P1 `[T]`; R1 `[T]` sin verificar en el texto completo |
| Cuándo un cambio es real | Criterio de las fuentes: la variación entre prueba y repetición es la diferencia que aparece "sin que haya un cambio genuino" (K1); un cambio se toma como real cuando **supera los límites de acuerdo de la misma prueba**. Con los valores de la fila anterior: más de **0,10 logMAR (1 línea = 5 letras)** con FrACT en personas sanas; más de 0,12 logMAR con COMPlog entre dos visitas; más de 0,18 logMAR (≈ 2 líneas) con cartilla ETDRS en pacientes. Agudeza de **cerca** en pantalla: por verificar | B2, K1 `[T]`; R1 sin verificar |

### B. Grilla de Amsler

| Parámetro | Valor o fórmula | Fuente |
|---|---|---|
| Medidas originales | Cuadrado de 10 cm × 10 cm, 20 × 20 cuadros de 5 mm, punto de fijación en el centro; a ~30 cm cada cuadro cubre 1° y la grilla 20° (10° a cada lado) | por verificar en Amsler 1953 |
| Distancia en la estación | 16 pulgadas (≈ 40 cm), en la computadora, un ojo por vez | Ver `sans-evolucion-y-logica-clinica.md`, sección 5.1 `[A]` |
| Ángulo a 40 cm | Una grilla de 10 cm cubre 2 × atan(50/400) = **14,25°**; cada cuadro de 5 mm, **0,72°**. Para mantener 1° por cuadro a 40 cm: lado del cuadro = 2 × 400 × tan(0,5°) = **6,98 mm** (grilla de 20 cuadros ≈ 14 cm) | *derivado* |
| Resultado positivo | Líneas onduladas, borrosas o faltantes; zonas que no se ven | por verificar |
| Cuánto detecta | Degeneración macular con vasos nuevos: sensibilidad 0,78 (IC 95 %: 0,64 a 0,87) y especificidad 0,97 (0,91 a 0,99), 12 estudios, 903 pacientes en total (F2). Otra revisión: 67 % y 99 % frente a personas sanas; 71 % y 63 % frente a personas con la forma sin vasos nuevos (B1) | F2, B1 `[T]`; detalle por verificar |

---

### C. Cambio de graduación y anteojos a bordo (provisorio)

| Parámetro | Valor | Fuente |
|---|---|---|
| Anteojos a bordo (*Space Anticipation Glasses*) | Toda la tripulación vuela con **al menos 3 pares** de anteojos recetados de distinta graduación, para compensar el corrimiento hacia la hipermetropía | N1 `[A]` |
| Caso publicado | Un astronauta, a los 3 o 4 meses de una misión de 6, dejó de ver bien de cerca con sus anteojos de siempre y pasó a los de reserva, **+1,25 D más fuertes** | N2 `[A]` |
| Visión de cerca que se pierde con +0,75 D y +1,50 D | por verificar | — |

---

## Fuentes (provisorio)

| Id | Fuente | ¿Texto completo leído? |
|---|---|---|
| F1 | [Manual](https://michaelbach.de/fract/manual.html) y [lista de control](https://michaelbach.de/fract/checklist.html) de FrACT₁₀ (Freiburg Vision Test, M. Bach) | Sí |
| P1 | [Bastawrous 2015, Peek Acuity, JAMA Ophthalmology](https://pmc.ncbi.nlm.nih.gov/articles/PMC5321502/) | Parcial (en curso) |
| L1 | [Li 2020, "apoyamentón virtual", Scientific Reports](https://pmc.ncbi.nlm.nih.gov/articles/PMC6976612/) | Parcial (en curso) |
| F2 | [Faes 2014, revisión de la grilla de Amsler, Eye](https://pmc.ncbi.nlm.nih.gov/articles/PMC4094801/) | Parcial (en curso) |
| B1 | [Bjerager 2023, revisión de la grilla de Amsler, JAMA Ophthalmology](https://pmc.ncbi.nlm.nih.gov/articles/PMC12278824/) | Parcial (en curso) |
| B2 | [Bach 2016, FrACT con y sin aviso de acierto, PLoS One](https://pmc.ncbi.nlm.nih.gov/articles/PMC4732607/) | Parcial (método y resultados de repetición) |
| K1 | [Kan 2019, variación del programa COMPlog, Br Ir Orthopt J](https://pmc.ncbi.nlm.nih.gov/articles/PMC7510395/) | Parcial (método, tabla de variación y discusión) |
| R1 | [Rosser 2001, cartilla logMAR reducida, Br J Ophthalmol](https://pmc.ncbi.nlm.nih.gov/articles/PMC1723918/) | No: solo el resumen |
| N1 | [NASA OCHMO-MTB-001, 2024](https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf) | Parcial (tabla de contramedidas) |
| N2 | Informe de evidencia de la NASA sobre SANS (edición anterior a 2022; link por verificar), caso 7 | Parcial (descripción del caso) |
