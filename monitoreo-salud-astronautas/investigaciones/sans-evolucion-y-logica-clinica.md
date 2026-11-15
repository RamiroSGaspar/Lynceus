# SANS: evolución durante la misión y lógica clínica

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* — [página oficial](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) |
| **Fecha** | 14 de noviembre de 2026 |
| **Para qué es** | Dar (1) números por día de vuelo para armar astronautas ficticios con una evolución creíble del síndrome neuro-ocular asociado al vuelo espacial (SANS) y (2) las reglas de la NASA que dicen qué significa un resultado y qué corresponde hacer. |
| **Qué no es** | No propone soluciones ni qué construir. No repite lo ya verificado en el contexto común (calendario de controles, equipo, definición de la métrica); lo usa de base. No cubre cómo se segmenta la imagen ni el cerebro: eso está en otros documentos de esta carpeta. |
| **Fuente** | Informes de la NASA y artículos revisados por pares, leídos en texto completo salvo donde se indica. Lista con links al final. |

### Cómo leerlo

- **Tablas centrales:** A (evolución por día de vuelo) y B (niveles de la NASA y qué se hace en cada uno).
- Después: distribución entre personas, frecuencia de hallazgos, factores de riesgo, pruebas de función visual, síntomas y contramedidas.
- Al final: lo no verificado y las fuentes.

**Etiquetas de tipo de dato:** `[A]` medido en astronautas · `[T]` medido en personas en Tierra (reposo en cama u otro) · `[M]` resultado de modelo o cálculo estadístico · `[O]` opinión experta o regla operativa · `[H]` hipótesis. **"No encontrado"** = lo busqué y no apareció.

**Siglas que se usan (en inglés, como se programan):**

| Sigla | Qué es |
|---|---|
| **TRT** (*total retinal thickness*) | Grosor total de la retina junto al nervio óptico, en el anillo que va de la abertura de la membrana de Bruch (**BMO**) hasta 250 µm. Sube cuando el nervio se hincha. |
| **ΔTRT** | Cambio de TRT respecto del valor de antes del vuelo, en micrómetros (µm). |
| **MRW** (*minimum rim width*) | Ancho mínimo del anillo neural: la distancia más corta entre la BMO y la superficie interna de la retina. Mide el tejido del nervio dentro de la cabeza del nervio. |
| **ODE** (*optic disc edema*) | Hinchazón de la cabeza del nervio óptico. |
| **Escala de Frisén** | Grados 0 a 5 de hinchazón del nervio vista en la foto del fondo de ojo. |
| **FD** / **R+** / **R-** | Día de vuelo (*flight day*) / días después de volver / días antes de volver. |
| **OD** / **OS** | Ojo derecho / ojo izquierdo. |

---

## Tabla A — Evolución por día de vuelo y después de volver

Todos los valores son **cambios respecto de antes del vuelo**. Equipo: Spectralis (Heidelberg), el mismo modelo en Tierra y en la estación. `IC 95 %` = intervalo de confianza del 95 %.

### A1. Misiones de ~6 meses: promedio de 11 astronautas `[A]`

Estudio *Ocular Health* (Macias 2020): 11 astronautas, ambos ojos, 170 ± 19 días en la estación, 45 ± 5 años. Los promedios salen de un modelo estadístico que **excluye valores atípicos** (por eso son más bajos que el promedio simple, ver A2).

| Momento | TRT BMO–250 µm | TRT 250–500 µm | MRW | Coroides junto al nervio |
|---|---|---|---|---|
| FD10 | **+11,9 µm** (IC 95 %: 6,6 a 17,3) | +4,7 µm (1,8 a 7,7) | **+12,5 µm** (4,8 a 20,2); +4 % | **+24 µm** (15 a 33) ¹ |
| FD30, FD60, FD90, FD120 | Sube de forma progresiva; el valor de cada día está en el suplemento: **por verificar** | ídem | ídem | "Se engrosa de forma progresiva" |
| FD150 | **+27,6 µm** (22,7 a 32,6) | +12,9 µm (10,0 a 15,7) | **+35,7 µm** (28,5 a 42,9); +10 % | **+43 µm** (35 a 46); +18 % |
| R+7 (ventana de 7 días tras volver) | Sigue alto; valor en el suplemento: **por verificar**. Un estudio anterior con datos de antes y después (Patel 2018) da **+31 µm** en la primera semana | por verificar | +20,9 µm (14,0 a 27,8) | +20 µm (13 a 28) |
| R+30 | por verificar | por verificar | +10,3 µm (3,1 a 17,4) | +38 µm (30 a 46) ² |
| R+90 | Sin diferencia con antes del vuelo | Sin diferencia | Sin diferencia | Sin diferencia |
| R+180, R+365 | Sin diferencia en el promedio (algún ojo sigue alto, ver A3) | — | — | — |

¹ El texto dice "día de vuelo 7"; la ventana del estudio es FD10 ± 10 días. ² Así figura en el texto del artículo; llama la atención porque es mayor que el de R+7. Tomarlo con reserva.

Otros cambios del mismo estudio, medidos solo antes y después: largo del ojo (*axial length*) −0,08 mm en R+7 y −0,05 mm al año; profundidad de la cámara anterior −0,09 mm; graduación +0,13 dioptrías (D) hacia la hipermetropía en R+7 (IC 95 %: 0,03 a 0,23), que persiste hasta los 6 meses.

### A2. El mismo grupo, promedio simple en FD150 `[A]`

| Medida | Cambio promedio (desvío estándar) | Valor absoluto promedio (desvío) | Fuente |
|---|---|---|---|
| TRT BMO–250 µm | **+34 (19) µm** | 415 (50) µm | Macias 2021 |
| MRW | **+53 (24) µm** | 395 (82) µm | Macias 2021 |

### A3. Misión de 1 año: 2 astronautas, casos individuales `[A]`

Ambos varones, con un vuelo largo previo (180 y 176 días). Controles en FD10, 30, 90, 150, 210, 270 y 320 (Macias 2021). Ojo derecho.

| | Participante 1 | Participante 2 |
|---|---|---|
| TRT antes del vuelo | 412 µm | 483 µm |
| TRT máximo | **547 µm (+135 µm) en FD90**; después se mantuvo alto todo el vuelo | **528 µm (+45 µm) en FD210**; después se mantuvo alto |
| MRW máximo | 561 µm (**+149 µm**) en FD270 | 539 µm (**+56 µm**) en FD270 |
| Hinchazón en la foto | **Frisén grado 1 desde FD30** hasta R+90 | Hinchazón leve recién en **FD319**, sin llegar a grado 1; se fue antes de R+30 |
| Pliegues de coroides | Ya tenía (de un vuelo previo). OS: 15 pliegues antes → 18 en FD150 → 21 en FD270; altura máxima 32 → 50 µm. A R+365: 14 pliegues, 45 µm (no volvió al valor previo) | No informados |
| Otros | Graduación +0,25 D (OD) y +0,50 D (OS) al volver; normal a los 90 y 180 días | Hemorragia en llama en la retina en FD83, resuelta entre FD144 y FD208. Sin cambio de graduación |
| Después de volver | TRT del OD **todavía alto a R+365** | Normal |

Lectura de las fuentes: el máximo puede llegar temprano (FD90) y quedarse en meseta, o aparecer tarde (después de FD200). Tras volver hay una **recuperación parcial rápida en los primeros días y después una lenta** (informe de evidencia 2022, pág. 12).

### A4. Alrededor del día 30: 20 astronautas `[A]` y reposo en cama `[T]`

| Grupo | Cuándo | TRT BMO–250 µm | Coroides | Frisén ≥ 1 | Fuente |
|---|---|---|---|---|---|
| 20 astronautas (17 varones, 3 mujeres; 46 ± 6 años) | Mediana FD37 (rango 22 a 47) | Promedio exacto: por verificar. Fue **37 µm menor** que en reposo en cama (IC 95 %: 13 a 61) | Aumentó; **27 µm más** que en reposo en cama (14 a 41). Medible en 14 de 20 | 1 de 20 (5 %), grado 1 | Laurie 2020 |
| 11 personas en reposo en cama con la cabeza 6° hacia abajo y aire con algo más de CO₂ | Día 1 / 15 / 30 | +8,1 / +36,1 / **+53,9 µm** | Sin cambio (+0,7 / +3,6 / +2,7 µm) | 5 de 11 (45 %), grados 1 o 2 | Laurie 2020 |
| Los mismos, después de levantarse | Día 6 / 13 | +41,2 / +33,4 µm | −9,5 / −9,9 µm | Vuelve al margen normal a los 6 meses en todos los ojos menos uno | Laurie 2020 |

No hubo relación entre cuánto se engrosó la coroides y cuánto subió el TRT (astronautas: r² = 0,002).

### A5. Margen de variación normal de la medición `[M]`

| Medida | 1 desvío | Umbral (2 desvíos, 95 %) | Cómo se obtuvo |
|---|---|---|---|
| TRT BMO–250 µm | 9,7 µm | **19,4 µm** | 7 astronautas sin vuelos, 2 sesiones separadas ~4 meses, 3 posturas, 2 lectores (Laurie 2020) |
| Grosor de coroides | 11,1 µm | **22,2 µm** | Igual |
| Coroides normal, sentado | — | — | 169,2 ± 51,6 µm (n = 7) |

---

## Tabla B — Niveles que usa la NASA, criterio numérico y acción

La guía de práctica clínica de SANS (*SANS Overview & Clinical Practice Guideline*, Thompson, Brunstetter, Hart y Tarver, 2020) es un **documento interno de la NASA: no es público**. Lo que sigue sale de los dos documentos públicos que la reproducen (informe técnico médico 2024, con sus dos diagramas, e informe de evidencia 2022). La NASA **no publica una escala con nombres de niveles**; los nombres de la primera columna son descriptivos, puestos acá para ordenar.

| Nivel (nombre descriptivo) | Criterio numérico | Qué se hace | Fuente |
|---|---|---|---|
| **0. Dentro de la variación normal** | ΔTRT entre −19,4 y +19,4 µm, sin hinchazón en la foto | Seguir el calendario normal: FD30, FD90, cada 90 días y R-30. Tras cada serie, informe resumen con recomendaciones al médico de la tripulación | MTB pág. 3 y 10 |
| **1. Primer signo de hinchazón** (*earliest sign of ODE*) | **ΔTRT > 19,4 µm** en el anillo BMO–250 µm, en cualquier ojo | "Requiere más controles" (*increased monitoring*). **Con qué frecuencia: no encontrado** en documentos públicos; el informe técnico solo dice que se pueden hacer pruebas adicionales "según indicación clínica en cualquier momento de la misión" | EB pág. 11; MTB pág. 8 |
| **2. Hinchazón clínica** | **Frisén ≥ 1** en la foto del fondo de ojo, en cualquier ojo, **y/o ΔTRT promedio ≥ 55 µm** en cualquier ojo | En vuelo: seguimiento y decisión caso por caso del médico de la tripulación (no hay tratamiento probado). **Al volver: indicación de punción lumbar** para medir la presión del líquido que rodea al cerebro | MTB pág. 4 y 13 |
| **3. Después del vuelo: presión del líquido < 25 cm H₂O** | Presión de apertura en la punción lumbar menor a 25 cm de agua (más de 18 se considera "normal alto") | Sin cambio en la aptitud para volar. Sin más estudios si las demás pruebas de SANS son normales | MTB pág. 7 y 11 |
| **4. Después del vuelo: presión ≥ 25 cm H₂O** | Presión de apertura de 25 cm de agua o más | Consulta externa obligatoria (como mínimo neurólogo y equipo de SANS). Se considera tratar, sobre todo si hay hinchazón nueva del nervio o una mancha ciega (*scotoma*). La junta médica de astronautas decide si sigue apto; la dispensa final la firma el jefe médico de la NASA | MTB pág. 11, 12 y 13 |

Notas:

- El informe técnico es inconsistente en un punto: en la pág. 4 une los dos criterios del nivel 2 con "y", y en la pág. 13 con "y/o". El contexto común y la pág. 13 usan "o".
- "Clínicamente preocupante": el informe técnico dice que el **18 %** de los tripulantes recibe ese diagnóstico en vuelos largos, y que el **70 %** tiene uno o más signos.
- Todos los umbrales se aplican **por ojo** ("en cualquiera de los dos ojos").

*(Secciones siguientes: en preparación para el segundo commit.)*

---

## Fuentes (provisorio)

| Id | Fuente | ¿Texto completo leído? |
|---|---|---|
| N1 | [Informe de evidencia de la NASA sobre SANS, 2022 (EB)](https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf) | Sí, las secciones citadas |
| N2 | [Informe técnico médico OCHMO-MTB-001, 2024 (MTB)](https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf) | Sí, completo, incluidas las figuras |
| P1 | [Macias 2020, JAMA Ophthalmology](https://pmc.ncbi.nlm.nih.gov/articles/PMC7118682/) | Sí (sin el suplemento) |
| P2 | [Macias 2021, JAMA Ophthalmology](https://pmc.ncbi.nlm.nih.gov/articles/PMC8085766/) | Sí (sin el suplemento) |
| P3 | [Laurie 2020, JAMA Ophthalmology](https://pmc.ncbi.nlm.nih.gov/articles/PMC6990717/) | Sí |
