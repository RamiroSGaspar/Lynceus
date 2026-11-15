# SANS, el lado del cerebro: qué se puede saber durante la misión

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* — [página oficial](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) |
| **Fecha** | 14 de noviembre de 2026 |
| **Para qué es** | Saber **qué señales del lado del cerebro existen de verdad durante la misión** en el síndrome neuro-ocular asociado al vuelo espacial (SANS), para decidir cómo entra el cerebro en el proyecto sin afirmar de más. |
| **Qué no es** | No diseña la solución ni propone qué construir. No repite lo del ojo (tomografía de retina, umbrales), que está en el contexto común. |
| **Fuente** | Los dos informes de la NASA sobre SANS (2022 y 2024) y artículos científicos. Lista con links al final, indicando qué se leyó completo. |

### Cómo leerlo

- **Sección 1:** la tabla central, una fila por señal. **Sección 2:** síntesis en cuatro grupos.
- **Secciones 3 a 6:** resonancia, relación cerebro–ojo, qué nota el astronauta y qué no se puede saber.
- Cada dato lleva su fuente entre corchetes (`[E]`). Un asterisco (`[R17*]`) indica que **no leí ese estudio**: la cifra es la que da el informe de la NASA que lo cita.
- **Respaldo:** *Dato en vuelo* (medido en astronautas, en misión o comparando antes y después) · *Dato en Tierra* (personas en Tierra o en simulaciones) · *Modelo* · *Opinión experta* · *Hipótesis* · *No encontrado*.

**Términos:** **presión dentro del cráneo** (*intracranial pressure*, ICP) · **líquido cefalorraquídeo** (*cerebrospinal fluid*, CSF): el líquido que baña el cerebro · **ventrículos**: cavidades del cerebro llenas de ese líquido · **vaina del nervio óptico** (*optic nerve sheath*): la funda con líquido que rodea al nervio que va del ojo al cerebro; su diámetro se abrevia **ONSD** · **hinchazón del nervio óptico** (*optic disc edema*, ODE), que se gradúa con la escala de Frisén · **grosor total de la retina** (TRT), la medida principal del ojo en SANS · **succión en las piernas** (*lower body negative pressure*, LBNP): aparato que tira los líquidos hacia las piernas.

---

## 1. Tabla central: señales del lado del cerebro

| Señal | Qué mide | Cómo | ¿Rutina, estudio o solo antes y después? | Qué mostró en astronautas | Respaldo | Fuente |
|---|---|---|---|---|---|---|
| **Presión dentro del cráneo, directa** | La presión real del líquido que rodea al cerebro | Punción lumbar (aguja entre dos vértebras) | **Nunca en vuelo.** Solo después, y solo si hubo hinchazón clara del nervio óptico | Menos de 10 tripulantes, todos con hinchazón: **18 a 28,5 cm H2O** después del vuelo (normal: 6 a 25). Sin dato previo al vuelo ni de tripulantes sin SANS | Dato en vuelo (solo después) | [E] |
| **Presión en ingravidez breve** | Lo mismo, durante ~20 segundos de ingravidez en avión | Sensor en pacientes que ya tenían un acceso al cráneo | Estudio en Tierra; **no son astronautas** | Sentados 4 mmHg, acostados 15 mmHg; en ingravidez bajó 3,8 mmHg respecto de acostados. No llega a niveles patológicos | Dato en Tierra | [E], [L17*] |
| **Presión del oído interno** (*cerebral and cochlear fluid pressure*, CCFP) | Cuánto se mueve el tímpano ante un sonido; cambia con la presión del líquido del cráneo | Sonda en el oído (estudio *Fluid Shifts*) | **Estudio en vuelo:** días ~45 y ~150, **13 tripulantes** | Día 45: **menor** que acostado en Tierra (−98,5 nL) y sin diferencia con sentado | Dato en vuelo | [J] |
| **Emisiones otoacústicas** (*otoacoustic emissions*, OAE) | Sonidos que devuelve el oído interno; su fase cambia con la presión | Sonda en el oído (mismo estudio) | **Estudio en vuelo**, mismos días y tripulantes | Día 45: **menor** que acostado (−19,7°) y sin diferencia con sentado | Dato en vuelo | [J] |
| **Diámetro de la vaina del nervio óptico** (ONSD) | Ancho de la funda del nervio, 3 mm detrás del ojo. En Tierra se ensancha cuando sube la presión | Ecografía del ojo: la toma la tripulación con guía en tiempo real; la miden dos ecografistas en Tierra | **Estudio en vuelo** (13 tripulantes). La ecografía del ojo sí es rutina | **Sin diferencia** con ninguna postura en Tierra (−0,026 cm contra sentado; +0,012 cm contra acostado). Por resonancia, sin cambio en 10 astronautas. En reportes de casos sí apareció ensanchada, y en 3 astronautas ya lo estaba antes de volar | Dato en vuelo, resultados contradictorios | [J], [E] |
| **Aplanamiento del ojo y protrusión de la cabeza del nervio** | Deformación de la parte de atrás del ojo | Ecografía del ojo, hecha por la tripulación (1 hora de entrenamiento previo) | **Rutina:** días 30 y 90, cada 90, y 30 antes de volver | Aplanamiento en ~25 % de los tripulantes de misiones largas. En vuelo es "menos confiable" que la resonancia | Dato en vuelo | [M] |
| **Vena yugular: presión y tamaño** | Si la sangre se acumula en las venas del cuello | Ecografía del cuello | **Estudio en vuelo:** días ~50 y ~150, **11 tripulantes** | Área: 9,8 → **70,3 mm²**. Presión: 5,1 → **21,1 mmHg** (respecto de sentado). Igual que acostado en Tierra | Dato en vuelo | [V], [J] |
| **Vena yugular: flujo** | Si la sangre drena o queda detenida | Ecografía Doppler del cuello | Mismo estudio | Flujo **detenido o invertido en 6 de 11** hacia el día 50. Un coágulo que tapaba la vena en 1 tripulante y un posible coágulo parcial en otro | Dato en vuelo | [V] |
| **Arterias del cerebro** | Velocidad de la sangre y una presión **estimada** | Doppler a través del cráneo + modelo | **Solo antes y después** (0 a 3 días tras volver), 11 astronautas | La velocidad aumentó. La presión estimada **bajó** en los 9 sin hinchazón; en los 2 con hinchazón, subió en uno y bajó en otro | Dato en vuelo (antes y después) + Modelo | [I] |
| **Rendimiento mental** | Memoria, atención, velocidad y otras | Batería *Cognition*: 10 pruebas en computadora, 30 min | **Rutina de un estudio estándar:** cerca del día 30 y unos 30 días antes de volver | En 25 astronautas: más lentos al inicio del vuelo en velocidad de procesamiento, memoria visual y atención sostenida; **sin deterioro sistemático**. Relación con SANS: no encontrada | Dato en vuelo (la prueba); No encontrado (relación) | [D], [S], [E] |
| **Dolor de cabeza** | Síntoma | Cuestionario: diario los primeros 7 días y después semanal (estudio); en la práctica, reporte al médico | **Estudio en vuelo**, 24 astronautas, 3.596 días | **22 de 24 (91,7 %)** tuvieron al menos un episodio; 378 episodios. 90 % de tipo tensional. Ninguno en los 3 meses tras volver | Dato en vuelo | [H] |
| **Síntomas visuales** | Qué nota el astronauta | Cuestionario ocular en cada control | **Rutina** | La queja habitual es de visión cercana: 48 % en misiones largas. No aparecen los síntomas típicos de presión alta en Tierra | Dato en vuelo | [E], [M] |
| **Dióxido de carbono de la cabina** | Gas que dilata las arterias del cerebro | Monitores fijos en las paredes | **Rutina**, ambiental, no por persona | Límite: 3 mmHg de promedio en 24 h. No se relacionó con las semanas con dolor de cabeza. En reposo en cama la hinchazón apareció con y sin dióxido de carbono agregado | Dato en vuelo; Dato en Tierra | [E], [H] |
| **Sueño** | Posible efecto sobre la limpieza de líquidos del cerebro | Sensor de muñeca y cuestionarios | Rutina de un estudio estándar | Relación con SANS: sin datos en astronautas | Hipótesis | [E], [M] |
| **Estructura del cerebro** | Ventrículos, posición del cerebro, espacios de líquido | Resonancia | **Solo antes** (18 a 21 meses) **y después** (~3 días) | Ver sección 3 | Dato en vuelo (antes y después) | [E] |

> **Dato clave:** los cuatro indicadores no invasivos coinciden en que la presión en vuelo **no supera la de estar sentado en Tierra**, o a lo sumo la de estar acostado. Pero son indirectos y **no dan un valor de presión**; los autores dicen que harían falta mediciones invasivas [J].

> **Posición de la NASA (2024):** es razonable suponer que la presión está algo elevada en SANS, pero "no se midió durante el vuelo, así que no se puede sacar ninguna conclusión definitiva en vuelo" [M].

**Otros datos del estudio de indicadores no invasivos [J]:**

- La succión en las piernas (25 mmHg, ~60 min) **no cambió** ninguno de los indicadores.
- No hubo diferencia entre el día 45 y el día 150.
- De los 13 tripulantes, **uno** tuvo hinchazón grado 1; su presión por punción lumbar 7 días después de volver fue 16,2 mmHg (22 cm H2O), por debajo del umbral de presión alta.

---

## 2. Síntesis en cuatro grupos

| Grupo | Señales |
|---|---|
| **Se mide de rutina en misión** | Ecografía del ojo (aplanamiento, protrusión de la cabeza del nervio) · cuestionario ocular · dióxido de carbono de la cabina (ambiental) · batería de rendimiento mental y sueño, dentro de un estudio estándar y sin relación establecida con SANS |
| **Se midió en estudios en misión** | Presión del oído interno · emisiones otoacústicas · diámetro de la vaina del nervio óptico · presión, tamaño y flujo de la vena yugular · dolor de cabeza con cuestionario |
| **Solo antes y después** | Resonancia del cerebro · Doppler de las arterias del cerebro con presión estimada · punción lumbar (solo después, y solo con hinchazón clara) |
| **No se puede saber en misión** | La presión real dentro del cráneo · el tamaño de los ventrículos y la posición del cerebro · si los cambios del cerebro afectan el rendimiento mental · si lo del cerebro causa lo del ojo |

---

## 3. Qué se sabe por resonancia (antes y después)

| Hallazgo | Cuánto | En quiénes | Fuente |
|---|---|---|---|
| **Ventrículos más grandes** | +10 a 16 % (~1 a 3 ml) según el informe de la NASA. En un estudio: +17 ± 12 % el izquierdo y +24 ± 6 % el derecho | Varios grupos; 10 astronautas de 6 meses en el estudio citado | [E], [U20] |
| **Cerebro desplazado hacia arriba** y espacios de líquido más angostos en la parte alta | Se vio en todos los astronautas del estudio; solo 3 tenían hinchazón del nervio óptico. Sin cifra en milímetros en lo leído | 34 astronautas (18 de misiones largas) | [E], [R17*] |
| **Hipófisis deformada** (glándula en la base del cerebro) | 6 de 11 tripulantes | 11 | [E], [K20*] |
| **Espacios alrededor de los vasos** (*perivascular spaces*) | Aumentaron en quienes volaban por primera vez, no en los que ya habían volado. Sin diferencia entre quienes tuvieron SANS y quienes no (6 y 6) | 15 astronautas | [P22] |
| **Recuperación** | La mayoría de los cambios vuelve en 6 meses; los ventrículos se recuperan poco a los 6 meses y seguían agrandados **un año** después | 12 y 11 | [U20], [E], [K20*] |
| **Vuelos repetidos** | Con menos de 3 años entre un vuelo y otro, los ventrículos casi no se agrandan más: no habrían tenido tiempo de recuperarse | 30 astronautas | [G23] |
| **Misiones de un año** | De 2 astronautas, uno tuvo +25 % y +23 %; el otro, 2 a 3 %. Tres tripulantes de 9 a 12 meses no tuvieron más agrandamiento que los de 6 meses | 2 y 3 | [U20], [E] |
| **Comparación con lo normal** | El volumen de los ventrículos después del vuelo es parecido al de personas sanas de la misma edad | 19 astronautas y 41 personas de control | [E], [C21] |

La NASA dice que todavía no se sabe si estos cambios pequeños tienen consecuencias para la salud [E].

---

## 4. Relación entre lo del cerebro y lo del ojo

| Estudio | Qué comparó | Resultado | Fuente |
|---|---|---|---|
| Roberts 2017 | Resonancia del cerebro y hinchazón del nervio óptico, 34 astronautas | Todos con desplazamiento del cerebro, solo 3 con hinchazón: relación "inconsistente" | [E], [R17*] |
| Roberts 2021 | Cambio de ventrículos (en %) en astronautas con SANS (7) y sin SANS (11) | Los que tenían SANS tuvieron **menos** cambio de ventrículos | [E], [R21*] |
| Marshall-Goebel 2021 | Cambio de ventrículos (en ml) y de grosor de la retina, 19 astronautas | Relación positiva **débil y no concluyente**: +4,7 µm de retina por cada ml de ventrículo (intervalo de −1,5 a 10,8). Sin relación con el volumen de sustancia blanca ni con el volumen total | [C21] |
| Hupfeld 2022 | Espacios alrededor de los vasos, con y sin SANS (6 y 6) | Sin diferencia | [P22] |
| Iwasaki 2021 | Presión estimada, con y sin hinchazón (2 y 9) | Sin patrón: argumenta contra una relación causal directa | [I] |
| Jasien 2022 | Indicadores no invasivos en vuelo; 1 de 13 con hinchazón | El caso con hinchazón no se apartó del grupo en los gráficos | [J] |

- **Qué dice la NASA hoy:** la literatura "sigue siendo mixta" [E]. El estudio con la medición más objetiva concluye que la hinchazón del nervio óptico "parece desacoplada" de los cambios dentro del cráneo [C21].
- **En Tierra:** en reposo en cama con la cabeza hacia abajo sí se vio un cambio distinto de los espacios alrededor de los vasos en quienes desarrollaron signos de SANS (5 contra 6) [P24]. Es dato en Tierra, no en astronautas.

---

## 5. Qué puede notar el astronauta

| Síntoma | Qué se sabe | Respaldo | Fuente |
|---|---|---|---|
| **Visión cercana borrosa** | La queja más común: 48 % en misiones largas | Dato en vuelo | [E] |
| **Dolor de cabeza** | Muy frecuente (91,7 %), sobre todo de tipo tensional; en la primera semana, más episodios de tipo migraña y con congestión nasal e hinchazón de la cara. La mitad de los episodios se trató con analgésicos. No se relacionó con el dióxido de carbono | Dato en vuelo | [H] |
| **Dolor de cabeza crónico, visión doble, oscurecimientos pasajeros de la visión, zumbido que late con el pulso** | Son los síntomas típicos de la presión alta dentro del cráneo en Tierra. Los astronautas **no los presentan** | Dato en vuelo | [E] |
| **Dolor de cabeza como señal de SANS** | No encontré ningún estudio que lo relacione | No encontrado | — |

- **Cuestionario ocular de la NASA:** se aplica en cada control [M]. **No encontré el texto de sus preguntas** en ninguna de las fuentes leídas.
- La tripulación está entrenada para reconocer síntomas de SANS [M]; el informe no los enumera más allá de los cambios de visión.

---

## 6. Qué no se puede saber en misión, y por qué

| Qué | Por qué |
|---|---|
| **La presión real dentro del cráneo** | Exige una punción lumbar o un sensor dentro del cráneo. Nunca se hizo en vuelo. Los indicadores no invasivos siguen cambios pero no dan un valor [E], [J] |
| **El tamaño de los ventrículos y la posición del cerebro** | Solo se ven con resonancia, que la NASA hace antes y después del vuelo [E] |
| **Si la presión de un astronauta subió respecto de antes del vuelo** | No hay mediciones directas previas al vuelo, ni de tripulantes sin SANS [E] |
| **Cuánto dióxido de carbono respira cada uno** | Los monitores están en las paredes; pueden formarse bolsones de gas cerca de la cara, sobre todo al dormir [E] |
| **Si los cambios del cerebro afectan el rendimiento mental** | "Se desconoce" [E] |
| **Si lo del cerebro causa lo del ojo** | Los estudios no coinciden (sección 4) |

**Límites de los indicadores que sí existen en vuelo [J]:** cada uno depende de un mecanismo distinto, dan un valor de un solo momento, y las mediciones con y sin succión en las piernas no se pudieron hacer el mismo día. La presión de la yugular medida por ecografía puede sobrestimar la real.

---

## Lo no verificado

- **Estudios citados a través del informe de la NASA, sin leer el original** (con asterisco): Roberts 2017 y 2021, Kramer 2020, Lawley 2017. También las referencias del informe sobre la vaina del nervio óptico por resonancia y por reportes de casos, y la relación entre dióxido de carbono y dolor de cabeza de 2014 (artículo de pago).
- **Cuestionario ocular:** no conseguí sus preguntas.
- **Desplazamiento del cerebro:** sin cifra en milímetros en lo leído.
- **Rango "+10 a 16 %" de los ventrículos:** es el resumen del informe de la NASA; los estudios individuales dan valores algo distintos según el método.
- **Presión de punción lumbar:** el informe de la NASA da 18 a 28,5 cm H2O [E] y el artículo de indicadores no invasivos da 16 a 29 cm H2O [J], sobre el mismo grupo reducido.
- **Presión estimada por Doppler:** el informe de la NASA dice que "no cambió" [E]; el artículo dice que bajó en los 9 astronautas sin hinchazón [I]. Usé el artículo.
- **Frecuencia con que se mide el diámetro de la vaina del nervio óptico en los controles de rutina:** no encontrada; el informe médico menciona la ecografía para aplanamiento y protrusión.
- **Batería de rendimiento mental y SANS:** no encontré ningún estudio que las relacione; no es lo mismo que haber verificado que no existe.
- En los artículos largos leí las secciones de métodos y resultados de donde salen las cifras, no cada página.

## Fuentes

| ID | Fuente | Texto completo |
|---|---|---|
| E | [NASA, Evidence Report: Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS), 2022](https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf) | Sí (secciones de presión, estructura del cerebro, dióxido de carbono y comparación con la presión alta en Tierra) |
| M | [NASA, OCHMO-MTB-001: SANS, 2024](https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf) | Sí |
| J | [Jasien 2022, Noninvasive indicators of intracranial pressure before, during, and after long-duration spaceflight](https://pmc.ncbi.nlm.nih.gov/articles/PMC9484990/) | Sí |
| V | [Marshall-Goebel 2019, Assessment of Jugular Venous Blood Flow Stasis and Thrombosis During Spaceflight](https://pmc.ncbi.nlm.nih.gov/articles/PMC6902784/) | Sí |
| C21 | [Marshall-Goebel 2021, Association of Structural Changes in the Brain and Retina After Long-Duration Spaceflight](https://pmc.ncbi.nlm.nih.gov/articles/PMC8138750/) | Sí |
| I | [Iwasaki 2021, Long-duration spaceflight alters estimated intracranial pressure and cerebral blood velocity](https://pmc.ncbi.nlm.nih.gov/articles/PMC7894300/) | Sí |
| H | [van Oosterhout 2024, Frequency and Clinical Features of Space Headache](https://pmc.ncbi.nlm.nih.gov/articles/PMC11033988/) | Sí |
| D | [Dev 2024, Cognitive performance in ISS astronauts on 6-month low earth orbit missions](https://pmc.ncbi.nlm.nih.gov/articles/PMC11614644/) | Sí |
| S | [Spaceflight Standard Measures, npj Microgravity 2025](https://www.nature.com/articles/s41526-025-00532-6) y su material suplementario | Sí |
| U20 | [Hupfeld 2020, The Impact of 6 and 12 Months in Space on Human Brain Structure and Intracranial Fluid Shifts](https://pmc.ncbi.nlm.nih.gov/articles/PMC7446230/) | Sí |
| P22 | [Hupfeld 2022, Longitudinal MRI-visible perivascular space changes with long-duration spaceflight](https://pmc.ncbi.nlm.nih.gov/articles/PMC9072425/) | Sí |
| G23 | [McGregor 2023, Impacts of spaceflight experience on human brain structure](https://pmc.ncbi.nlm.nih.gov/articles/PMC10250370/) | Sí |
| P24 | [Richmond 2024, Dynamic changes in perivascular space morphology predict signs of SANS in bed rest](https://pmc.ncbi.nlm.nih.gov/articles/PMC10907584/) | Sí |
| R17* | [Roberts 2017, Effects of Spaceflight on Astronaut Brain Structure as Indicated on MRI](https://doi.org/10.1056/nejmoa1705129) | No: de pago. Citado según [E] |
| K20* | [Kramer 2020, Intracranial Effects of Microgravity](https://doi.org/10.1148/radiol.2020191413) | No: de pago. Citado según [E] |
| R21* | Roberts 2021, Longitudinal change in ventricular volume is accelerated in astronauts undergoing long-duration spaceflight | No: no lo busqué. Citado según [E] |
| L17* | Lawley 2017, medición directa de la presión en vuelo parabólico | No: no lo busqué. Citado según [E] |
