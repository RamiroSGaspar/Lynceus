# SANS: evolución durante la misión y lógica clínica

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* — [página oficial](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) |
| **Fecha** | 14 de noviembre de 2026 |
| **Para qué es** | Dar (1) números por día de vuelo para armar astronautas ficticios con una evolución creíble del síndrome neuro-ocular asociado al vuelo espacial (SANS) y (2) las reglas de la NASA que dicen qué significa un resultado y qué corresponde hacer. |
| **Qué no es** | No propone soluciones ni qué construir. No repite lo ya verificado en el contexto común (calendario, equipo, definición de la métrica); lo usa de base. No cubre cómo se segmenta la imagen ni el cerebro: están en otros documentos de esta carpeta. |
| **Fuente** | Informes de la NASA y artículos revisados por pares, leídos en texto completo salvo donde se indica. Lista con links al final. |

### Cómo leerlo

- **Tabla A:** evolución por día de vuelo y después de volver. **Tabla B:** niveles de la NASA, criterio numérico y qué se hace.
- **Secciones 2 a 7:** distribución entre personas, frecuencia de hallazgos, factores de riesgo, pruebas de función visual, síntomas y contramedidas.
- Al final: lo no verificado y las fuentes.

**Tipo de dato:** `[A]` medido en astronautas · `[T]` medido en personas en Tierra · `[M]` resultado de modelo o cálculo estadístico · `[O]` regla operativa u opinión experta · `[H]` hipótesis.
**Origen de la cifra:** sin marca = está escrita en el texto de la fuente · **≈** = **leída de un gráfico** de la fuente (midiendo píxeles; error de ±2 µm salvo que se indique) · *derivado* = cuenta hecha acá con cifras de la fuente. **"No encontrado"** = lo busqué y no apareció.

| Sigla | Qué es |
|---|---|
| **TRT** (*total retinal thickness*) | Grosor total de la retina junto al nervio óptico, en el anillo que va de la abertura de la membrana de Bruch (**BMO**) hasta 250 µm. Sube cuando el nervio se hincha. **ΔTRT** = cambio respecto de antes del vuelo, en micrómetros (µm). |
| **MRW** (*minimum rim width*) | Ancho mínimo del anillo neural: distancia más corta entre la BMO y la superficie interna de la retina. |
| **ODE** (*optic disc edema*) | Hinchazón de la cabeza del nervio óptico. **Escala de Frisén:** grados 0 a 5 de esa hinchazón vista en la foto del fondo de ojo. |
| **FD / R+ / R-** | Día de vuelo (*flight day*) / días después de volver / días antes de volver. **OD / OS:** ojo derecho / izquierdo. |
| **Coroides** | Capa de vasos sanguíneos que está debajo de la retina. En vuelo se engrosa. |
| **D** | Dioptría: unidad de graduación de un lente. Corrimiento "hacia la hipermetropía" = se ve peor de cerca. |

---

## Tabla A — Evolución por día de vuelo y después de volver

Todos los valores son **cambios respecto de antes del vuelo**, medidos con el mismo equipo (Spectralis) en Tierra y en la estación. `IC 95 %` = intervalo de confianza del 95 %.

### A1. Misiones de ~6 meses: promedio de 11 astronautas `[A]`

Estudio *Ocular Health* (P1): 11 astronautas, ambos ojos, 170 ± 19 días en la estación, 45 ± 5 años, CO₂ ambiente 2,8 ± 0,2 mmHg. Promedios de un modelo estadístico que **excluye valores atípicos**. Entre paréntesis, IC 95 %.

| Momento | TRT BMO–250 µm | MRW | Coroides junto al nervio | Rango individual de TRT (≈) |
|---|---|---|---|---|
| FD10 | **+11,9** (6,6 a 17,3) | **+12,5** (4,8 a 20,2) | **+24** (15 a 33) ¹ | −3 a +35 |
| FD30 | ≈ +13 (≈ 7 a 18) | ≈ +16 (≈ 9 a 24) | ≈ +38 (≈ 30 a 46) ² | −4 a +40 |
| FD60 | ≈ +16 (≈ 11 a 22) | ≈ +21 (≈ 13 a 29) | ≈ +38 (≈ 29 a 46) | −2 a +46 |
| FD90 | ≈ +22 (≈ 16 a 27) | ≈ +31 (≈ 23 a 39) | ≈ +39 (≈ 31 a 47) | −2 a +77 |
| FD120 | ≈ +24 (≈ 19 a 29) | ≈ +32 (≈ 24 a 40) | ≈ +42 (≈ 34 a 50) | −1 a +59 |
| FD150 | **+27,6** (22,7 a 32,6) | **+35,7** (28,5 a 42,9) | **+43** (35 a 46) | 0 a +67 |
| R+3 a R+7 | ≈ +21 (≈ 16 a 26) | **+20,9** (14,0 a 27,8) | **+20** (13 a 28) | +1 a +60 |
| R+30 | ≈ +12 (≈ 7 a 17) | **+10,3** (3,1 a 17,4) | ≈ +8 (≈ 0 a 17) ² | 0 a +45 |
| R+90 | ≈ +5, sin diferencia significativa | ≈ +2, sin diferencia | ≈ −4, sin diferencia | −3 a +40 |
| R+180 | ≈ +5, sin diferencia | ≈ +1, sin diferencia | ≈ −1, sin diferencia | 0 a +32 |
| R+365 | ≈ +6, sin diferencia | ≈ +2, sin diferencia | ≈ +7, sin diferencia | −2 a +22 |

¹ El texto dice "día de vuelo 7"; la ventana del estudio es FD10 ± 10 días. ² **Contradicción en la fuente:** el texto da +38 µm (30 a 46) para R+30, pero en el gráfico esa caja corresponde a FD30 y la de R+30 está en ≈ +8 µm. Se usa el gráfico.

- TRT 250–500 µm: +4,7 (1,8 a 7,7) en FD10 y +12,9 (10,0 a 15,7) en FD150. Más lejos (500 a 1500 µm) el cambio es menor que el error de medición.
- Coroides: máximo individual ≈ +122 µm (FD150) y mínimo ≈ −8 µm. En otro estudio, hasta +174 µm (contexto común).
- Solo antes y después: largo del ojo (*axial length*) −0,08 mm en R+7 y −0,05 mm al año; cámara anterior −0,09 mm; graduación +0,13 D en R+7 (0,03 a 0,23), persiste 6 meses.
- 2 de los 11 tuvieron hinchazón leve visible en la foto; en uno apareció en FD150 y seguía a R+356; en el otro duró todo el vuelo y se fue 2 días después de volver.

### A2. Promedios simples: mismo grupo y grupo de 31 `[A]`

| Grupo y momento | TRT BMO–250 µm | MRW | Coroides | Fuente |
|---|---|---|---|---|
| 11 astronautas, FD150: cambio promedio (desvío estándar) | **+34 (19)**; valor absoluto 415 (50) | **+53 (24)**; absoluto 395 (82) | — | P2 |
| 31 astronautas (25 varones, 6 mujeres; 46,9 ± 6,0 años; misión 200 ± 55 días), antes del vuelo: promedio (error estándar) [rango] | 392,0 (5,8) [299 a 484] | 366,4 (9,1) [225 a 494] | 213,3 (11,1) [107 a 406] | P4 |
| Los mismos, ~FD150 (116 a 183) | 430,2 (9,6) [305 a 593] → *derivado* **+38** | 416,3 (12,6) [238 a 572] → *derivado* +50 | 245,6 (11,9) [134 a 489] → *derivado* +32 | P4 |
| Los mismos, R+1 a R+7 | 419,3 (7,9) [303 a 541] → *derivado* **+27** | 400,8 (11,4) → *derivado* +34 | 229,0 (11,5) → *derivado* +16 | P4 |
| Registro anterior de la NASA, solo antes y después de vuelos de 4 a 6 meses (primera semana tras volver) | 362 → 393 µm (**+31**; +8,5 %) | — | 253 → 260 µm (+2,8 %) | Citado en P1 |

En la primera semana tras volver queda cerca del 70 % del aumento de TRT y la mitad del de coroides (*derivado*). En ese grupo de 31: graduación de −0,41 a −0,21 D (+0,20 D); largo del ojo de 24,1 a 23,9 mm.

### A3. Misión de 1 año: 2 astronautas `[A]`

Ambos varones, con un vuelo largo previo (180 y 176 días). Valores ≈ leídos del gráfico de P2 (un punto por ojo; donde hay uno solo, el otro no se ve). Los máximos coinciden con el texto: TRT +135 (FD90) y +45 (FD210); MRW +149 y +56 (FD270).

| Día | P1 · ΔTRT | P1 · ΔMRW | P2 · ΔTRT | P2 · ΔMRW |
|---|---|---|---|---|
| FD10 | ≈ +32 / +36 | ≈ +44 / +51 | ≈ +6 / +13 | ≈ 0 / +19 |
| FD30 | ≈ +82 / +85 | ≈ +91 / +104 | ≈ +11 / +17 | ≈ +2 / +33 |
| FD90 | ≈ +120 / **+135** | ≈ +126 / +151 | ≈ +25 / +31 | ≈ +17 / +43 |
| FD150 | ≈ +127 / +136 | ≈ +130 / +149 | no se ve | no se ve |
| FD210 | ≈ +124 / +130 | ≈ +133 / +146 | ≈ +35 / **+45** | ≈ +24 / +51 |
| FD270 | ≈ +112 / +128 | ≈ +123 / **+149** | ≈ +27 / +40 | ≈ +16 / **+56** |
| FD320 | ≈ +115 | ≈ +128 | ≈ +13 / +32 | ≈ +10 / +44 |
| R+3 | ≈ +80 / +83 | ≈ +80 / +86 | no se ve | no se ve |
| R+30 | ≈ +26 | ≈ +42 | ≈ +7 | ≈ +10 / +17 |
| R+90 | ≈ +23 | ≈ +18 / +31 | ≈ −9 / 0 | ≈ +6 |
| R+180 | ≈ +19 | ≈ +20 | ≈ −17 / 0 | ≈ +9 / +14 |
| R+365 | ≈ +7 (el texto dice que el OD seguía alto) | ≈ +5 / +19 | ≈ −21 / +5 | ≈ −7 / +1 |

| | Participante 1 | Participante 2 |
|---|---|---|
| Valor antes del vuelo, OD | 412 µm ³ | 483 µm ³ |
| Hinchazón en la foto | **Frisén grado 1 desde FD30** hasta R+90 | Hinchazón leve recién en **FD319**, sin llegar a grado 1; se fue antes de R+30 |
| Pliegues de coroides (ondulaciones de la capa bajo la retina) | Ya tenía de un vuelo previo. OS: 15 pliegues → 18 (FD150) → 21 (FD270); altura máxima 32 → 50 µm. A R+365: 14 pliegues y 45 µm | No informados |
| Otros | Graduación +0,25 D (OD) y +0,50 D (OS) al volver; normal a los 90 y 180 días | Hemorragia en llama en FD83, resuelta entre FD144 y FD208. Sin cambio de graduación |

³ El artículo da 412 y 483 µm como MRW previo; restando, el TRT previo da el mismo número. Coincidencia llamativa; tomar como aproximado.

Forma de la curva: P1 llega al máximo en FD90 y queda en **meseta**; P2 sube lento y recién muestra hinchazón visible **después del día 300**. Al volver, **caída rápida en los primeros días (≈ 30 % en P1, *derivado*) y después lenta** (N1 pág. 12).

### A4. El caso más grave publicado: mujer, misión de ~6 meses `[A]`

Caso de 2024 (P5). Controles extra de OCT en FD27, 63, 84, 126, 154 y 183. Vitaminas B del FD153 al FD169. CO₂ de la cabina: 2,6 mmHg hasta que bajó la tripulación a mitad de misión, después 1,3 mmHg.

| | Antes | FD27 | FD63 | FD84 | FD126 | FD154 | FD183 | 1.º tras volver | 2.º | ~15 meses |
|---|---|---|---|---|---|---|---|---|---|---|
| ΔTRT OD | 401 µm | ≈ +120 | ≈ +189 | **+212** | ≈ +188 | ≈ +170 | ≈ +132 | ≈ +104 | ≈ +59 | +45 |
| ΔTRT OS | 404 µm | ≈ +110 | ≈ +201 | ≈ +226 | **+232** | ≈ +201 | ≈ +178 | ≈ +143 | ≈ +75 | +60 |
| Δ coroides OD | — | ≈ +7 | ≈ +38 | ≈ +56 | ≈ +59 | ≈ +70 | ≈ +74 | ≈ +23 | ≈ 0 | ≈ −18 |
| Δ coroides OS | — | ≈ +15 | ≈ +48 | ≈ +56 | ≈ +66 | ≈ +73 | ≈ +62 | ≈ +59 | ≈ +44 | ≈ +17 |

(Valores ≈ con error de ±3 µm; el artículo no da los días exactos de los controles posteriores al vuelo.)

- MRW: OD 372 → 530 µm (FD84); OS 381 → 550 µm (FD126). A los 15 meses: 392 y 402 µm.
- **Frisén grado 0 en los dos ojos todo el tiempo**, pese a +232 µm: la escala de la foto no la detectó.
- Pliegues alrededor del nervio desde FD30; llegaron al centro de la visión (fóvea) en FD63 (OD) y FD84 (OS). Rugosidad máxima 12,7 µm (OD, FD154) y 15,0 µm (OS, FD126).
- Graduación: de −1,00 D a +0,50 D (OD) y +1,00 D (OS) a R+3; corrimiento confirmado de **+1,50 D y +2,00 D**. Largo del ojo −0,56 y −0,67 mm. Aplanamiento grave en la resonancia.
- Punción lumbar una semana después: 19,4 cm H₂O (normal).
- Tenía antes del vuelo: copa del nervio pequeña (el hueco central de la cabeza del nervio; 0,126 y 0,032 mm³), coroides gruesa (percentil 80 del cuerpo de astronautas), un desprendimiento pequeño del epitelio pigmentario (la capa que sostiene a la retina) y 4 de 4 variantes genéticas de riesgo.

### A5. Caso de Mader 2017: un ojo que tardó 20 meses `[A]`

Artículo no leído (de pago, sin copia abierta); datos del informe de evidencia (N1 págs. 10 y 15). Misión de 6 meses en 2014. La OCT mostró signos en **FD21 (OD)** y **FD90 (OS)**; la foto recién mostró hinchazón leve del OD en FD90 y nunca en el OS. La hinchazón del OD, vista en la foto, **no se fue hasta 20 meses después de volver**. Largo del ojo −0,53 mm (OD) y −0,29 mm (OS), sin recuperar a los 5 años; aplanamiento todavía visible a los 7 años. Valores de TRT por día: no encontrados.

### A6. Alrededor del día 30: 20 astronautas `[A]` y reposo en cama `[T]`

| Grupo | Cuándo | ΔTRT | Δ coroides | Frisén ≥ 1 |
|---|---|---|---|---|
| 20 astronautas (17 varones, 3 mujeres; 46 ± 6 años) | Mediana FD37 (22 a 47) | Promedio ≈ **+16**; máximo ≈ +84; ≈ 5 o 6 de 20 por encima de 19,4. Fue 37 µm menor que en cama (IC 95 %: 13 a 61) | Promedio ≈ +29 (≈ −11 a +70; medible en 14 de 20). 27 µm más que en cama (14 a 41) | 1 de 20 (5 %), grado 1 |
| 11 personas en cama con la cabeza 6° hacia abajo y 0,5 % de CO₂ | Día 1 / 15 / 30 | +8,1 / +36,1 / **+53,9** | +0,7 / +3,6 / +2,7 (sin cambio) | 5 de 11 (45 %), grados 1 o 2 |
| Los mismos, ya levantados | Día 6 / 13 | +41,2 / +33,4 | −9,5 / −9,9 | A los 6 meses, todos los ojos menos uno dentro del margen normal |

Fuente: P3. No hubo relación entre cuánto se engrosó la coroides y cuánto subió el TRT (astronautas: r² = 0,002; cama: r² = 0,015).

### A7. Margen de variación normal de la medición `[M]`

| Medida | 1 desvío | Umbral (2 desvíos) | Cómo se obtuvo |
|---|---|---|---|
| TRT BMO–250 µm | 9,7 µm | **19,4 µm** | 7 astronautas sin vuelos, 2 sesiones separadas ~4 meses, 3 posturas, 2 lectores (P3) |
| Grosor de coroides | *derivado* 11,1 µm | **22,2 µm** | Igual |
| Coroides normal, sentado | — | — | 169,2 ± 51,6 µm (n = 7) |

---

## Tabla B — Niveles de la NASA, criterio numérico y acción

La guía de práctica clínica (*SANS Overview & Clinical Practice Guideline*, 2020) es un **documento interno de la NASA: no es público**. Lo que sigue sale de las fuentes públicas que la reproducen: el informe técnico médico (N2, con sus dos diagramas), el informe de evidencia (N1), el caso de 2024 (P5) y una revisión de 2025 firmada por médicos de la NASA (P7), que copia la tabla de umbrales de una presentación de la NASA de 2024.

### B1. Los cuatro niveles y sus umbrales `[O]`

Vale para **cualquiera de los dos ojos**, durante el vuelo o apenas después. El porcentaje es la proporción de tripulantes de vuelos largos en cada casillero (P7; no dice sobre cuántas personas).

| Hallazgo | 1. Primer indicio (*earliest indication*) — 71 % | 2. Clínicamente preocupante (*clinically concerning*) — 16 % | 3. Patológico con efecto funcional agudo — 5 % | 4. Patológico con efecto a largo plazo — 0 % |
|---|---|---|---|---|
| **Hinchazón del nervio** | **ΔTRT ≥ 20 µm** y/o hinchazón leve que no llega a Frisén 1 — 61 % | **ΔTRT ≥ 55 µm y/o Frisén ≥ 1** — 15 % | Pérdida de campo visual (por ejemplo, mancha ciega agrandada) — 3 % | Pérdida permanente de campo visual y/o capa de fibras nerviosas más fina — 0 % |
| **Pliegues** de coroides, de retina o arrugas junto al nervio | Cualquier pliegue — 16 % | Pliegues marcados cerca de la mácula (centro de la retina) — 4 % | Visión central distorsionada — 0 % | Distorsión permanente, atrofia o vasos nuevos anormales — 0 % |
| **Aplanamiento del ojo** | Cualquier aplanamiento y/o largo del ojo menor — 23 % | Cambio moderado — 12 % | Cambio de graduación mayor que el de los anteojos de a bordo | Todavía no se sabe |
| **Cambio de graduación** | **≥ +0,75 D** — 14 % | **≥ +1,50 D** (cerca del límite de los anteojos de a bordo) — 5 % | Ídem — 2 % | Todavía no se sabe |

- Los artículos escriben el primer umbral como "**mayor a 19,4 µm**"; la tabla de la NASA lo redondea a "≥ 20 µm".
- P5 da la misma definición del nivel 2 con otras palabras: ΔTRT ≥ 55 µm y/o Frisén ≥ 1; pliegues marcados en la mácula; aplanamiento moderado o mayor; corrimiento ≥ 1,50 D.
- N2 dice **18 %** de "clínicamente preocupante" y **70 %** con algún signo; P7, 16 % y 71 %.

### B2. Qué se hace en cada nivel

| Nivel | Durante el vuelo | Al volver | Fuente |
|---|---|---|---|
| **Sin hallazgos** (ΔTRT dentro de ±19,4 µm) | Calendario normal: FD30, FD90, cada 90 días y R-30 (misión de un año: FD30, 90, 180, 270 y R-30). Informe resumen con recomendaciones al médico de la tripulación (*crew surgeon*) tras cada serie | Exámenes de R+1 a R+3, resonancia incluida | N2 pág. 9 y 10; P8 |
| **1. Primer indicio** | "Requiere más controles" (*increased monitoring*). **Frecuencia: no encontrada** en documentos públicos; N2 solo dice "pruebas adicionales según indicación clínica en cualquier momento". Presión del ojo y foto en color real: solo si hay indicación | Igual | N1 pág. 10 y 11; N2 pág. 8 |
| **2. Clínicamente preocupante** | Sin tratamiento probado; decisión caso por caso. **Único ejemplo publicado** (P5): signos en FD30 → OCT cada 3 a 6 semanas (6 sesiones en vez de 3), **grilla de Amsler varias veces por semana desde ~FD50** para vigilar distorsión, y envío de vitaminas B, que llegaron en FD153 | **Punción lumbar recomendada** para medir la presión del líquido que rodea al cerebro (en P5, una semana después de volver) | N2 pág. 4 y 13; P5; P7 |
| **3 y 4. Patológico** | Acción en vuelo: **no encontrada** | Evaluación de especialistas | P7 |

N2 es inconsistente: en la pág. 4 une los dos criterios de punción con "y" y en la pág. 13 con "y/o". P5 y P7 usan "y/o".

### B3. Después del vuelo: presión del líquido en la punción lumbar `[O]`

| Presión de apertura | Qué se hace | Fuente |
|---|---|---|
| Menos de 25 cm H₂O (más de 18 se considera "normal alto") | Sin cambio en la aptitud para volar. Sin más estudios si las demás pruebas de SANS son normales | N2 pág. 7 y 11 |
| 25 cm H₂O o más | Consulta externa obligatoria: como mínimo neurólogo y equipo de SANS (especialistas base: oftalmólogo aeroespacial, especialista en retina, neuro-oftalmólogo, neurocirujano, neurorradiólogo). Se considera tratar, sobre todo con hinchazón nueva o mancha ciega (*scotoma*). La junta médica decide la aptitud; la dispensa final la firma el jefe médico de la NASA | N2 pág. 11 a 13 |

Datos reales `[A]`: menos de 10 tripulantes tuvieron punción tras el vuelo, todos por hinchazón Frisén; **rango 18 a 28,5 cm H₂O** (N1 pág. 32). No hay mediciones antes del vuelo ni en vuelo.

### B4. Quién interviene y qué recibe el médico `[O]`

| Pieza | Qué dice la fuente |
|---|---|
| Informe resumen de SANS (*SANS Summary Report*) | "Informe resumen y recomendaciones" al médico de la tripulación: uno con los datos de base antes del vuelo, uno tras cada serie en vuelo y uno al volver. El último del vuelo llega a tiempo para armar el plan posterior. **Contenido detallado: no encontrado** (N2 pág. 10) |
| Quién revisa | El equipo de SANS de la NASA y el médico de la tripulación revisan todas las pruebas (N2 pág. 11) |
| Apoyo desde Tierra durante la prueba | Guía remoto (el único que habla con la tripulación), experto en la materia (mira la cabina y los datos para verificar que sirvan) e ingeniero biomédico (N2 pág. 8) |
| Entrenamiento | Fondo de ojo 2,5 h; OCT 2,5 h; ecografía 1 h; tonometría 1,5 h para un tripulante. Pueden pasar meses entre el entrenamiento y el uso (N2 pág. 8) |

### B5. Qué hay a bordo para tratar y con qué reparos

| Recurso | Estado | Reparos | Fuente |
|---|---|---|---|
| Anteojos de distinta graduación (*Space Anticipation Glasses*) | Estándar: al menos 3 pares por tripulante | Corrigen el síntoma, no la causa. Un corrimiento ≥ +1,50 D se acerca a su límite | N2 pág. 12; P7 |
| Acetazolamida (Diamox) | Es el único de los medicamentos candidatos que está a bordo | "Los efectos adversos limitan cuándo considerarla": náuseas, fatiga, diarrea, hormigueo; además baja la presión del ojo, lo que podría empeorar la hinchazón. N1: "no se la considera hoy como tratamiento". Usada una sola vez, después del vuelo: 500 mg/día 6 semanas y 250 mg/día 2 semanas; la presión bajó de 28 a 19 cm H₂O | N2 pág. 13; N1 pág. 45 |
| Vitaminas B | "Se pueden dar en vuelo"; en estudio | En P5 (B6 100 mg, L-metilfolato 5 mg, B12 1000 µg, riboflavina 400 mg por día) se suspendieron a los 16 días por malestar digestivo | N2 pág. 12; P5 |
| Volver a la gravedad | Lo único que revirtió el cuadro en todos los casos | No siempre por completo: pliegues, aplanamiento y graduación pueden durar años | N1 pág. 41 |

---

## 2. Distribución entre personas

### 2.1 Gráfico de 36 ojos derechos del informe técnico `[A]`

N2 pág. 3. Valores ≈ medidos sobre la imagen original (750 × 299 píxeles; ±2 µm). **El gráfico no dice en qué día de vuelo.** Barras oscuras = Frisén ≥ 1 en la foto.

| Ojos (de mayor a menor) | ΔTRT ≈ (µm) |
|---|---|
| 1 a 6 | 191 · **138** · 80 · **78** · 63 · **62** (en negrita, los tres con Frisén ≥ 1) |
| 7 a 12 | 54 · 52 · 51 · 51 · 44 · 44 |
| 13 a 18 | 43 · 42 · 42 · 39 · 38 · 36 |
| 19 a 24 | 35 · 34 · 27 · 22 · 20 · 20 |
| 25 a 30 | 19 · 16 · 16 · 15 · 15 · 12 |
| 31 a 36 | 10 · 10 · 6 · 4 · 4 · −5 |

*Derivado:* promedio ≈ 40 µm, mediana ≈ 36 µm. Por encima de 19,4 µm: **24 de 36 (67 %)**. Con 55 µm o más: **6 de 36 (17 %)**; el séptimo queda justo debajo. Frisén ≥ 1: **3 de 36 (8 %)**. El ojo con más hinchazón (191 µm) **no** figura como Frisén ≥ 1. La línea naranja de "55 µm" está dibujada en ≈ 56 µm.

### 2.2 Los dos ojos de 31 astronautas en ~FD150 `[A]`

P4, figura 2. Valores ≈ (±1 µm), OD / OS, ordenados por el ojo derecho. Validación: el conteo de 23 personas y 40 ojos sobre el umbral coincide con el texto, y el promedio medido (37,6) con el publicado (+38).

| Persona | OD / OS (µm) | Persona | OD / OS | Persona | OD / OS | Persona | OD / OS |
|---|---|---|---|---|---|---|---|
| 1 (mujer) | 163 / 189 | 9 | 56 / 36 | 17 | 29 / 6 | 25 (mujer) | 10 / −2 |
| 2 | 142 / 118 | 10 | 56 / 27 | 18 | 27 / 15 | 26 (mujer) | 10 / 17 |
| 3 | 72 / 67 | 11 (mujer) | 51 / 22 | 19 | 26 / 11 | 27 | 10 / 5 |
| 4 | 68 / 48 | 12 | 47 / ≈ 0 ⁴ | 20 | 24 / 21 | 28 | 10 / 11 |
| 5 | 64 / 27 | 13 | 46 / 40 | 21 | 22 / 24 | 29 | 6 / 4 |
| 6 | 62 / 41 | 14 | 44 / 36 | 22 | 17 / 26 | 30 | 2 / 5 |
| 7 | 59 / 47 | 15 (mujer) | 38 / 24 | 23 | 15 / 12 | 31 (mujer) | ≈ 0 ⁴ / 16 |
| 8 | 59 / 54 | 16 | 37 / 71 | 24 | 15 / 32 | | |

⁴ Barra no visible: se toma como ≈ 0.

| Medida (*derivada* de la tabla) | Valor |
|---|---|
| Los 62 ojos | Promedio 37,6 µm; **mediana 26,7 µm**; percentiles 10 / 25 / 75 / 90: 5 / 12 / 51 / 68 µm. Distribución asimétrica, con cola larga hacia arriba |
| Ojo más afectado de cada persona | ≤ 19,4 µm: 8 personas (26 %) · 19,4 a 40: 8 (26 %) · 40 a 55: 4 (13 %) · 55 a 100: 9 (29 %) · más de 100: 2 (6 %) |
| Pasan 19,4 µm | **23 de 31 personas (74 %)**, 40 de 62 ojos (65 %). En los dos ojos: 17 personas; en uno solo: 6 |
| Llegan a 55 µm | ≈ 11 de 31 personas (35 %), 14 ojos; en los dos ojos: 3 personas. Hay dos ojos a ±1 µm del umbral |
| Diferencia entre los dos ojos | **Mediana 13 µm**, promedio 15 µm, máximo ≈ 47 µm. Hasta 10 µm: 13 personas; más de 20 µm: 11 personas. Correlación entre ojos: r ≈ 0,89 |
| Qué ojo sube más | El derecho en 22 de 31. El artículo no lo analiza; N1 dice que con OCT no hay preferencia clara de lado |

Dato publicado `[A]`: en FD120 la diferencia entre ojos fue de **8 ± 13 µm** (11 pares; no significativa) (N1 pág. 32). P5: "los dos ojos suelen afectarse, uno un poco más que el otro".

### 2.3 Cuándo se cruza cada umbral `[A]`

| Momento | Primer indicio (ΔTRT > 19,4 µm) | Nivel clínico (≥ 55 µm o Frisén ≥ 1) | Fuente |
|---|---|---|---|
| FD10 | Promedio +11,9; ya hay ojos sueltos por encima (hasta ≈ +35) | Ninguno | P1 |
| FD22 a FD47 | ≈ 5 o 6 de 20 personas | 1 de 20 (≈ +84 µm, Frisén 1). En A3 y A4: Frisén 1 en FD30 y ≈ +120 µm en FD27 | P3, P2, P5 |
| FD90 | El promedio del grupo pasa el umbral (≈ +22) | Un ojo de 11 personas (≈ +77) | P1 |
| ~FD150 | 74 % de las personas (P4). En el estudio *Ocular Health*: 15 de 21 ojos (71 %), sin aclarar el día (N1) | ≈ 35 % (≥ 55 µm, P4) frente a 15 a 18 % en los registros de la NASA | P4; N1 pág. 12; N2; P7 |
| Después de FD200 | Puede aparecer por primera vez (A3: +45 en FD210, hinchazón visible en FD319) | — | P2 |

---

## 3. Frecuencia de cada hallazgo y cuáles aparecen juntos

Proporción de tripulantes de vuelos largos del segmento estadounidense con datos.

| Hallazgo | Frecuencia | Detalle | Fuente |
|---|---|---|---|
| Algún signo de SANS | ~70 %; 71 % | | N2 pág. 3; P7 |
| Hinchazón temprana (ΔTRT ≥ 20 µm) | ≈ 66 %; 67 %; 61 % | Tres cifras de registros de la NASA en distintas fechas | N2 gráfico; N1 pág. 12; P7 |
| Hinchazón clínica, Frisén ≥ 1 | ~15 % (12 a 19 %) | ~90 % de esos casos son grado 1 (borde borroso en forma de C, empieza del lado de la nariz). Un solo ojo llegó a grado 3; ninguno más. En los 7 primeros casos descritos (2011), 5 tuvieron hinchazón: 2 en un solo ojo y 3 en los dos | N1 pág. 10; P7 |
| Pliegues de coroides o de retina | ~20 % (N1); 16 % cualquier pliegue y 4 % marcados cerca de la mácula (P7); "~25 % pliegues de coroides" (N2) | Solo 4 astronautas con pliegues hasta la fóvea; pueden durar años | N1 pág. 13; N2 pág. 4; P5 |
| Arrugas junto al nervio (*peripapillary wrinkles*) | **No encontrada** por separado | La NASA las cuenta dentro de "pliegues" | N2 pág. 4 |
| Aplanamiento del ojo | ≈ 21 % por resonancia; "~25 %"; 23 % cualquiera y 12 % moderado | En 10 astronautas, el nervio se desplazó 200 ± 110 µm hacia adelante a R+1 y 140 ± 100 µm al año | N2; P7; N1 pág. 15 |
| Cambio de graduación | ≥ +0,75 D: ~15 %. ≥ +1,50 D: 5 %. Más que los anteojos: 2 % | Máximo en una misión: +2,00 D | N1 pág. 16; P7; P5 |
| Quistes dentro de la retina | **No encontrada**: "varios tripulantes" | Junto al nervio o dentro; aislados; sin efecto en la visión; se van al volver (en el ejemplo, en 2 meses) | N1 pág. 19 |
| Desprendimientos del epitelio pigmentario (PED) | **No encontrada** | Fuera de la mácula, sobre coroides engrosada, en zonas alteradas desde antes; crecen en altura durante el vuelo; ninguno afectó la visión; uno derivó en una acumulación de líquido que se resolvió sola | N1 pág. 20 |
| Manchas algodonosas (*cotton wool spots*) | 8 personas en total | 6 en OS y 2 en OD; la mayoría detectadas **después** del vuelo (un mes o años) | N1 pág. 19 |
| Hemorragias en llama | Menos de 5 tripulantes | En 2 casos, junto con manchas algodonosas | N1 pág. 21 |
| Defectos del campo visual | 3 casos | 2 manchas ciegas agrandadas tras el vuelo y 1 mancha notada en vuelo que se resolvió antes de volver; **los 3 con hinchazón del nervio** | N1 págs. 31 y 32 |

**Cuáles aparecen juntos** `[A]`:

| Combinación | Qué se sabe | Fuente |
|---|---|---|
| Hinchazón + aplanamiento | "Mayor aplanamiento se asoció con hinchazón". El astronauta con más desplazamiento de volumen (39 y 22 mm³) también tuvo Frisén ≥ 1 | N2 pág. 5; N1 pág. 15 |
| Hinchazón + pliegues + aplanamiento + graduación | Los cuatro juntos en A4 y en A5. En A3 (P1): hinchazón + pliegues + graduación | P5; P2; N1 |
| Coroides engrosada + hinchazón | Sin relación en cantidad (r² = 0,002). El grosor previo de la coroides tampoco predice el ΔTRT (P = 0,38) | P3; P4 |
| Coroides engrosada + desprendimientos y quistes | Los desprendimientos aparecen sobre coroides engrosada; uno de los ejemplos tuvo además pliegues | N1 pág. 20 |
| Hinchazón por OCT sin Frisén | Lo habitual. Extremos: 191 µm (2.1) y 232 µm (A4) con grado menor a 1 | N2; P5 |

---

## 4. Factores que cambian el riesgo

| Factor | Dirección y tamaño | Respaldo | Fuente |
|---|---|---|---|
| **Copa del nervio pequeña** (hueco central de la cabeza del nervio; *optic cup*) | **Más hinchazón.** Volumen: −62,8 µm de ΔTRT por cada mm³ (ordenada 48,7 µm; P = 0,002). Profundidad: −0,11 µm por µm (60,8; P < 0,001). Ancho: −0,03 µm por µm (55,6; P = 0,03). **Nadie con copa ≥ 0,3 mm³ pasó de 19,4 µm.** La relación copa/disco no predice (P = 0,31) | `[A]` 31 astronautas, 62 ojos. El más sólido | P4 |
| **Duración de la misión** | Probablemente más y más persistente, sin cifra. El promedio sube de FD10 a FD150; en un año, un caso hizo meseta y otro apareció tarde. Quejas de visión: 60 % en vuelos largos frente a 29 % en cortos | `[A]` solo 2 personas de un año. N1: "cualquier interpretación es prematura" | P1; P2; N1 pág. 42 |
| **Vuelos previos** | Sin relación con el ΔTRT (pendiente −0,01 µm por día; P = 0,86). N2 lista "repetir vuelo" como posible factor; un caso tuvo hinchazón en su segundo vuelo largo y no en el primero | `[A]` contradictorio | P4; N2 pág. 2; N1 pág. 10 |
| **Sexo** | Sin diferencia (P = 0,73). El mayor aumento medido fue en una mujer | `[A]` 6 mujeres de 31 | P4; P5 |
| **Peso corporal** | Con hinchazón por foto o pliegues: más peso previo (Buckey 2018). Con ΔTRT: sin relación (peso P = 0,97; índice de masa corporal P = 0,19) | `[A]` contradictorio según cómo se defina el caso | N1 pág. 37; P4 |
| **Edad** | Sin relación con el ΔTRT (P = 0,86). Sí influye en lo que se nota: después de los 40 años se compensa peor el corrimiento | `[A]` | P4; N1 pág. 15 |
| **Genética y vitaminas B** | Más riesgo con variantes (alelos) de dos genes del metabolismo de las vitaminas B: MTRR 66 (alelo G: pliegues y manchas algodonosas) y SHMT1 1420 (alelo C: hinchazón). Homocisteína y sustancias afines de la sangre 25 a 45 % más altas en afectados (5 frente a 15). En cama: 3 o 4 alelos de riesgo → más ΔTRT que 0 a 2 | `[A]` 49 astronautas; `[T]`. No leídos directamente | N1 pág. 35; P7 |
| **Dióxido de carbono** | No resuelto. En contra: la hinchazón aparece en cama con y sin CO₂ agregado. A favor: en A4 la mejoría coincidió con la baja de 2,6 a 1,3 mmHg. Pueden formarse bolsones (modelo: más de 9 mmHg en 10 minutos junto a la boca al dormir sin ventilación). Límite: 3 mmHg promedio en una hora | `[T]`, `[A]` un caso, `[M]` | N1 pág. 37 y 38; P5; N2 pág. 17 |
| **Ejercicio de fuerza** | Sin diferencia en la cantidad de ejercicio de fuerza o aeróbico entre quienes tuvieron SANS y quienes no. La presión dentro del cráneo sube un momento si se hace fuerza conteniendo el aire | `[A]` revisión retrospectiva; `[H]` | N1 pág. 39 |
| **Sueño** | Menos horas de sueño → más probabilidad de hinchazón, en reposo en cama | `[T]` Christian 2024, no leído directamente | P7 |
| **Coroides gruesa o con alteraciones previas** | Posible factor en A4 | `[H]` | P5 |

---

## 5. Pruebas de función visual en vuelo

### 5.1 Las que se hacen hoy

| Prueba | Con qué | Cómo | Fuente |
|---|---|---|---|
| Agudeza visual de lejos | Programa **Acuity Pro** en una computadora portátil | A **10 pies (≈ 3 m)** de la pantalla; cada ojo por separado, con y sin corrección | N3; O2 |
| Agudeza visual de cerca | **Cartilla de mano** | A **16 pulgadas (≈ 40 cm)**; cada ojo, con y sin corrección | N3; O2 |
| Grilla de Amsler (cuadrícula con un punto central) | En la computadora portátil | A 16 pulgadas, un ojo por vez, mirando el punto central. **Positivo: líneas onduladas, borrosas o faltantes.** En A4, varias veces por semana | N3; O2; P5 |
| Cuestionario ocular | Formulario electrónico | El tripulante anota sus puntajes de agudeza y cómo percibe su visión; busca detectar pronto síntomas visuales (visión borrosa) y no visuales (dolor de cabeza). **Lista de preguntas: no encontrada** | N5 |
| Sensibilidad al contraste | Disponible a bordo | Solo si hay indicación clínica | P8 |
| Presión del ojo | Tonómetro de mano, con 2 gotas de anestésico | Solo si hay indicación; no se puede hacer a uno mismo | N2; O2 |
| Graduación | **No hay método confiable a bordo** | Se mide antes y después | N1 pág. 16 |
| Campo visual | No disponible hasta 2024 | Un perímetro portátil (Smartfield) viajó a la estación según su fabricante (16/10/2025); resultados no encontrados | N2 pág. 9; O1 |

Tiempo: en el estudio *Ocular Health*, la parte de pruebas visuales llevaba unos 50 minutos por sesión (dato de un resumen, N6).

### 5.2 Pruebas nuevas en desarrollo

| Herramienta | Qué mide | Estado | Fuente |
|---|---|---|---|
| Sistema montado en la cabeza, de realidad virtual, financiado por la NASA (Universidad de Nevada) | Agudeza, sensibilidad al contraste, campo visual, distorsión (Amsler adaptada) y agudeza con la cabeza en movimiento | Tarea de laboratorio **completada**; validación inicial con 5 personas (correlación 0,91 con la prueba en portátil). Sin datos en vuelo | N7; P8 |
| Herramienta de mano basada en movimientos del ojo (*Oculometric Tools*, NASA Ames) | Medidas de movimientos oculares para detectar deterioro funcional leve; prototipo en teléfono o tableta, con pruebas de equilibrio | **Activa**; sin resultados publicados encontrados | N8 |
| Antiparras de campo visual (instituto TRISH) | Campo visual en formato pequeño | Prototipo de fase 1 (terminó en 2020) | N9 |

---

## 6. Qué nota el astronauta y cuándo

| Qué nota | Cuántos y cuándo | Fuente |
|---|---|---|
| **Ver peor de cerca** (lo más común) | 48 % en vuelos largos frente a 23 % en cortos; puede empezar **a las 3 semanas**. En cuestionarios de 1989 a 2011: 60 % y 29 % notaron que su visión (lejos o cerca) empeoró | P7; N1 pág. 16 y 32 |
| Ver peor de lejos, o una mancha en el campo visual | Raro. Una sola mancha notada en vuelo, resuelta antes de volver | P7; N1 pág. 32 |
| Nada | "Los casos normalmente no dan síntomas" | P5 |
| Dolor de cabeza fuerte, visión doble, oscurecimientos pasajeros, zumbido pulsátil | **No** en los primeros casos descritos, a diferencia de la presión alta dentro del cráneo en Tierra | N3 |
| Pérdida que no se corrige con anteojos | Ningún caso: todos corrigieron a 20/20 o mejor | N1 pág. 16 |

**Relación entre la imagen y lo que se nota** `[A]`:

- Es **débil**. En A4 (+232 µm, pliegues hasta la fóvea) la astronauta **no notó distorsión** y de lejos sin anteojos **vio mejor** (de 20/30 a 20/16 en FD90): el corrimiento compensó su miopía previa.
- Los pliegues en la fóvea de "un número pequeño" de tripulantes no cambiaron su visión (N1 pág. 14).
- Lo que se nota es el cambio de graduación, no la hinchazón. Pesa más en quien ya compensa mal de cerca: 80 % de los astronautas activos usa corrección, edad promedio 47 años (N3).

---

## 7. Contramedidas en estudio

| Contramedida | Último resultado | Estado | Fuente |
|---|---|---|---|
| **Succión en las piernas** (*lower body negative pressure*, LBNP) | `[A]` 14 tripulantes, 10 a 30 minutos a 25 mmHg: baja la presión del ojo y el volumen de la vena yugular, pero **no reduce la coroides ni cambia el nervio o el TRT**. `[T]` 10 personas acostadas 3 días: 8 horas de succión por noche redujeron el aumento de la coroides (74 % en área, 53 % en volumen); efecto inconsistente sobre el MRW | Sin prueba de que prevenga la hinchazón. Se estudian usos largos y un traje móvil | P7; P6; N1 pág. 43 |
| **Manguitos en los muslos** (*venoconstrictive thigh cuffs*) | `[T]` reducen la presión del ojo y el área de la yugular en cambios de postura; 10 horas por día en inmersión seca (flotar en agua sin mojarse, otro modo de imitar la falta de peso) frenaron el ensanchamiento de la vaina del nervio pero no el engrosamiento de fibras. `[A]` 3 tripulantes, 4 horas: yugular ≈ 35 % menor (preimpresión sin revisión por pares, P10*) | Estudio en la estación **activo**: 10 personas; 30 minutos, 3 y 6 horas. **Sin resultados oculares publicados** | N10; N11; P7; N1 pág. 43 |
| **Vitaminas B** | `[A]` un caso (A4): tras el máximo de +232 µm, el TRT bajó a ≈ +178 µm; coincidió con la baja de CO₂, así que no se puede atribuir | Estudio de suplemento diario en vuelo "en marcha"; sin resultados | P5; P7 |
| **Gravedad artificial** (centrífuga de brazo corto) | `[T]` 60 días en cama, 30 minutos por día (~0,3 g en el ojo): ΔTRT al día 58 de +35,9 (control), +36,5 (continua) y +27,6 µm (intermitente). **Sin diferencia significativa**; hubo pliegues en los tres grupos | No alcanzó con esa dosis | N1 pág. 44; P7 |
| **Medicación** | Ninguna probada. Acetazolamida: un uso tras el vuelo (B5). Agonistas de GLP-1: bajan la presión dentro del cráneo en pacientes en Tierra | No se usa: no se sabe si esa presión está alta en vuelo | N1 pág. 45; P7 |
| Antiparras de natación, respirar contra resistencia | `[T]` efectos agudos de laboratorio | Solo propuestas | N1 pág. 44; P7 |

Dato de base `[A]`: en vuelos parabólicos, la congestión de las venas del cerebro no bajó hasta superar **0,5 g** de la cabeza a los pies (N1 pág. 41).

---

## Lo no verificado

| Tema | Qué falta |
|---|---|
| Guía de práctica clínica de la NASA (2020) | Es interna. No se encontró: frecuencia de los controles extra en el nivel 1, acciones en vuelo de los niveles 3 y 4, ni contenido detallado del informe resumen |
| Porcentajes por nivel (B1) | Vienen de una tabla de P7 que cita una presentación de la NASA de 2024 que no pude leer; no dan el total de personas |
| Valores marcados con ≈ | Leídos de gráficos. Los suplementos de P1, P2 y P5 (tablas por día) no se pudieron bajar: el sitio bloqueó la descarga automática |
| Coroides en R+30 (A1) | El texto y el gráfico de P1 no coinciden |
| Gráfico de 36 ojos (2.1) | No indica día de vuelo ni duración de las misiones |
| Caso de Mader 2017 (A5) | Artículo de pago sin copia abierta; datos tomados del informe de evidencia |
| Distancias de las pruebas de visión (5.1) | De un blog (O2) que reproduce la descripción del experimento *Ocular Health* de la NASA; no pude abrir la página original ni el documento de requisitos MEDB 1.10 |
| Preguntas del cuestionario ocular | No encontradas |
| Estudios citados a través de N1 o P7 | Zwart 2012, 2016 y 2019; Buckey 2018; Christian 2024; Greenwald 2021; Laurie 2021; Sater 2021: no leídos directamente |
| Manguitos en la estación; antiparras de campo visual; duración de la sesión visual (N6, N9) | Solo leí resúmenes o el fragmento del buscador |
| Frecuencia de quistes, desprendimientos y arrugas junto al nervio | No publicada por separado |

## Fuentes

| Id | Fuente | ¿Texto completo leído? |
|---|---|---|
| N1 | [Informe de evidencia de la NASA sobre SANS, 2022](https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf) | Sí, las secciones citadas (págs. 7 a 21, 31 a 45) |
| N2 | [Informe técnico médico OCHMO-MTB-001, 2024](https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf) | Sí, completo, con sus figuras |
| N3 | [Brunstetter 2017, introducción a SANS (presentación, NTRS)](https://ntrs.nasa.gov/citations/20170009173) | Sí |
| N4 | [Brunstetter 2018, equipos y datos de SANS en la estación (presentación, NTRS)](https://ntrs.nasa.gov/citations/20180004916) | Sí; usada para confirmar el calendario |
| N5 | [Cuestionario de autoevaluación de la visión en vuelo, 2010 (NTRS)](https://ntrs.nasa.gov/citations/20100039152) | No: solo el resumen |
| N6 | [Presentación del estudio Ocular Health, 2015 (NTRS)](http://hdl.handle.net/2060/20150003006) | No: solo el fragmento del buscador |
| N7 | [Tarea de la NASA: sistema de monitoreo ocular (Tavakkoli)](https://humanresearchroadmap.nasa.gov/Tasks/?i=2480) | Sí (ficha) |
| N8 | [Tarea de la NASA: herramientas oculométricas (Stone)](https://humanresearchroadmap.nasa.gov/Tasks/?i=2433) | Sí (ficha) |
| N9 | [Tarea TRISH: antiparras de campo visual](https://taskbook.nasaprs.com/tbp/index.cfm?TASKID=11983&action=public_query_taskbook_content) | No: solo el fragmento del buscador |
| N10 | [Tarea de la NASA: manguitos en los muslos en la estación](https://humanresearchroadmap.nasa.gov/Tasks/?i=2506) | Sí (ficha) |
| N11 | [Página de la NASA del estudio Thigh Cuff](https://www.nasa.gov/reference/thigh-cuff/) | Sí |
| P1 | [Macias 2020, JAMA Ophthalmology](https://pmc.ncbi.nlm.nih.gov/articles/PMC7118682/) | Sí, texto y figuras; sin el suplemento |
| P2 | [Macias 2021, JAMA Ophthalmology](https://pmc.ncbi.nlm.nih.gov/articles/PMC8085766/) | Sí, texto y figuras; sin el suplemento |
| P3 | [Laurie 2020, JAMA Ophthalmology](https://pmc.ncbi.nlm.nih.gov/articles/PMC6990717/) | Sí |
| P4 | [Pardon 2022, JAMA Ophthalmology](https://pmc.ncbi.nlm.nih.gov/articles/PMC9614681/) | Sí |
| P5 | [Brunstetter 2024, JAMA Ophthalmology](https://pmc.ncbi.nlm.nih.gov/articles/PMC11273286/) | Sí, texto y figuras; sin el suplemento |
| P6 | [Hearon 2022, JAMA Ophthalmology](https://pmc.ncbi.nlm.nih.gov/articles/PMC8662537/) | Parcial: resultados del resumen |
| P7 | [Nguyen y otros 2025, Progress in Retinal and Eye Research](https://pmc.ncbi.nlm.nih.gov/articles/PMC12103276/) | Parcial: secciones 4.1, 4.8, 6.6 y 7 |
| P8 | [Waisberg y otros 2023, Prehospital and Disaster Medicine](https://pmc.ncbi.nlm.nih.gov/articles/PMC10445111/) | Parcial: resumen e introducción |
| P9* | [Mader 2017, Journal of Neuro-Ophthalmology](https://pubmed.ncbi.nlm.nih.gov/27930421/) | No: de pago, sin copia abierta |
| P10* | [Preimpresión: ecografía 3D de la yugular con manguitos en la estación, 2022](https://doi.org/10.21203/rs.3.rs-1854807/v1) | No: solo el fragmento del buscador; sin revisión por pares |
| O1 | [Comunicado de OCULUS sobre el perímetro Smartfield, 2025](https://www.oculus.de/us/news/2025/oculus-smartfield-heads-to-the-international-space-station-to-support-vision-research/) | Sí (comunicado del fabricante) |
| O2 | [Blog que reproduce la descripción de la NASA del experimento Ocular Health](https://occupymars.wordpress.com/2017/03/) | Sí (fuente secundaria) |
