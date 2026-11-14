# Problemas de salud candidatos para el proyecto

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* — [página oficial](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) |
| **Fecha** | 14 de noviembre de 2026 |
| **Para qué es** | Comparar los problemas de salud documentados **durante la misión, en una estación espacial**, para elegir uno como centro del proyecto. Se busca un caso donde **al astronauta le cuesta saber cómo está una parte de su cuerpo** y donde **incluso con médicos es complejo**. |
| **Qué no es** | No propone soluciones ni qué construir, y no elige. Ordena los candidatos según cinco criterios y explica por qué. |
| **Fuente** | Recursos oficiales del desafío (NASA HRP), informes de evidencia y registros de riesgo de la NASA, y artículos científicos. Lista en la Parte 3. |

### Cómo leerlo

- **Parte 1:** tabla comparativa de 12 candidatos, ordenados del que mejor cumple los criterios al que menos.
- **Parte 2:** ficha de los 5 más fuertes.
- **Parte 3:** lo no verificado y las fuentes.

**Los cinco criterios de "más fuerte"** (los de la consigna): (a) el problema es real y está documentado en la estación; (b) al astronauta le cuesta de verdad conocer su estado; (c) es complejo incluso con médicos; (d) hay algo medible en misión con qué trabajar; (e) está en los recursos oficiales del desafío. **El orden es un criterio mío**, no de las fuentes.

**Tipo de medición:** *Directa* = el instrumento mide la magnitud misma · *Indirecta* = mide otra cosa de la que se infiere el estado · *Estimación* = valor calculado con un modelo · *Autorreporte* = lo declara el astronauta.

**Fuentes:** `O` = recurso oficial del desafío · `N` = NASA, fuera de los recursos oficiales · `P` = artículo científico. Un asterisco (`P4*`) indica que **no conseguí el texto completo**. **"No encontrado"** = lo busqué y no apareció. **"No relevado"** = no lo busqué a fondo.

**Términos:** *tripulante* = astronauta o cosmonauta · *misión larga* = alrededor de 6 meses en la estación · *ecografía* = imagen por ultrasonido · *estudio* = investigación con voluntarios, no control médico de rutina.

---

## Parte 1 — Tabla comparativa

| # | Problema | Parte del cuerpo | Por qué cuesta darse cuenta | Por qué es complejo con médicos | Qué se mide en misión | Frecuencia o gravedad | Recurso oficial |
|---|---|---|---|---|---|---|---|
| 1 | **Síndrome neuro-ocular del vuelo espacial (SANS)**: hinchazón del nervio óptico, pliegues en la retina, aplanamiento del ojo | Ojos y cerebro | **Casi no da síntomas.** No hay dolor de cabeza ni visión doble; si se nota algo, es ver peor de cerca (N1) | **Causa desconocida.** La presión dentro del cráneo **nunca se midió en vuelo**. La resonancia es solo en Tierra. No hay tratamiento probado en vuelo (N1, N18) | Tomografía de retina (OCT), foto del fondo de ojo, ecografía del ojo, agudeza visual. *Directa*. Días 30 y 90 y 30 días antes de volver; un tripulante examina a otro, guiado desde Tierra (N18) | **~70 %** con signos tempranos de hinchazón; **~15 %** con hinchazón clínica (N1, O4) | **Sí, muy presente:** riesgo propio (O4), peligro "gravedad" (O1) y 5 estudios en curso (O12) |
| 2 | **Sangre estancada y coágulos en la vena yugular** (vena del cuello) | Venas del cuello; sangre | **Sin síntomas.** Los coágulos se encontraron **de casualidad**, durante un estudio (P1) | No se sabe por qué pasa solo en algunos (O13). El diagnóstico lo hicieron radiólogos en Tierra mirando la ecografía (P1) | Ecografía de la yugular con medición del flujo, guiada desde Tierra. *Directa*. **Solo en estudios**, días 50 y 150 (P1) | Flujo estancado o invertido en **6 de 11** tripulantes; **1 coágulo** que tapaba la vena y 1 posible (P1, N2) | **Sí:** el riesgo cardiovascular nombra los coágulos (O5) y hay un estudio en curso, *Venous Haemostasis* (O13) |
| 3 | **Falta de sueño, reloj biológico desfasado y rendimiento mental** | Cerebro; rendimiento | **La propia percepción falla:** el rendimiento cae y la sensación de sueño casi no cambia (dato de laboratorio en Tierra, N5) | Varias causas mezcladas (trabajo, luz, horarios). El remedio más usado son pastillas, que hacen dormirse antes pero no dormir más (N5) | Sensor de muñeca que registra movimiento y luz (*Indirecta*), 14 días seguidos cada 60 días; diario de sueño (*Autorreporte*); 10 pruebas de cognición (*Directa*) (P5, O15) | **6,1 h** de sueño por noche en la estación; **75 %** usó pastillas para dormir (P3) | **Sí:** riesgo propio (O8), *Standard Measures* (O15). **Ojo:** "horas de sueño" es un indicador que el desafío ya sugiere |
| 4 | **Defensas alteradas y virus dormidos que se reactivan** (incluye erupciones de piel y alergias) | Sistema inmune; piel | El virus aparece en la saliva de casi todos, pero pocos tienen una enfermedad visible. Los síntomas que sí aparecen (sarpullido, resfrío) son ambiguos (N4) | **Las muestras se analizan en Tierra.** No hay equipo de laboratorio apto para vuelo. A bordo "el diagnóstico generalmente no es posible" (N4) | Saliva y sangre que se congelan y vuelven a Tierra (*Indirecta*, resultado tardío); síntomas (*Autorreporte*) (P5, O6) | Virus en **22 de 23** tripulantes; **46 %** con un evento médico "notable"; 3,4 eventos por año de vuelo (N4) | **Sí:** riesgo propio (O6), microbios (O7), peligro "ambiente cerrado" (O2), *Immune Biomarkers* (O17) |
| 5 | **Pérdida de audición por el ruido de la estación** | Oído | **Uno se acostumbra al ruido** y deja de percibirlo como dañino (N10) | No se entiende la causa de los cambios en tonos graves, ni por qué los datos rusos muestran más pérdida que los estadounidenses (N9) | Prueba de audición a bordo, en los primeros 14 días y luego cada 60 (*Directa*); medidor de ruido que lleva puesto el tripulante (*Directa*, del ambiente) (N16, N9) | Cambio en tonos graves en el **40,4 %** de las pruebas a bordo; en agudos, 9,0 %. El ruido superó el nivel de peligro en el **38 %** de las mediciones (N9) | **Poco:** el peligro "ambiente cerrado" solo nombra el ruido (O2). No está entre los 17 riesgos |
| 6 | **Cálculos renales** (piedras en el riñón) | Riñones y vías urinarias | La piedra **no duele mientras está en el riñón**; duele cuando se mueve (N7) | No se puede predecir quién va a formar una. La orina no se recolecta en vuelo dentro del conjunto estándar de mediciones (N6, P5) | Ecografía a bordo, guiada desde Tierra, **si hay síntomas** (*Directa*). Control de rutina en vuelo: no encontrado (N6) | **1 caso** en vuelo (un cosmonauta); **37** eventos en astronautas de EE. UU. hasta 2016, antes o después de volar (N6) | **Sí, breve:** el peligro "gravedad" nombra los cálculos (O1). No tiene página entre los 17 riesgos |
| 7 | **Comer de menos, bajar de peso y deshidratarse** | Nutrición; todo el cuerpo | No encontrado | Los nutrientes en sangre se analizan en Tierra (P5). La comida debe gustar, durar y variar (O9) | Registro de comidas en una aplicación (*Autorreporte*) y peso en vuelo (*Directa*; instrumento no encontrado) (N11) | **25 %** de los tripulantes perdió más del 5 % de su masa en vuelo (N11) | **Sí:** riesgo propio (O9), *Standard Measures* (O15) |
| 8 | **Dióxido de carbono (CO2) en el aire de la cabina** | Aire; cabeza y rendimiento | El síntoma típico es **dolor de cabeza**, que tiene muchas otras causas (N8) | Se mide el promedio de la cabina, **no lo que respira cada persona**; algunos son más sensibles que otros (N8) | Monitores de CO2 de la cabina y portátiles (*Directa*, del aire); síntomas (*Autorreporte*) (N8) | Síntomas "limitados a algunos tripulantes sensibles" y reversibles. Límite: 3 mmHg en promedio de una hora (N8) | **No directo.** Está en la lista ampliada de riesgos de la NASA (N8) |
| 9 | **Destrucción de glóbulos rojos** ("anemia espacial") | Sangre | No encontrado (el estudio no describe síntomas en vuelo) | Las muestras de aire y sangre **se analizaron en Tierra** (P2) | Aire exhalado en bolsa y sangre congelada, **solo en un estudio** (*Indirecta*, resultado tardío) (P2) | **54 %** más destrucción de glóbulos rojos en vuelo (14 astronautas); 5 de 13 con anemia al aterrizar (P2) | **No encontrado** |
| 10 | **Radiación recibida** | Todo el cuerpo | **No se ve ni se siente** (O3) | El riesgo de cáncer **se estima con modelos**, con mucha incertidumbre (N12) | Medidores de radiación en la estación (*Directa*, de la dosis; el efecto en el cuerpo es *Estimación*) (O11, O21) | Dosis de 50 a 2.000 mSv según la misión (estación, Luna o Marte) (N12). Cifra propia de la estación: no encontrada | **Sí:** peligro (O3), riesgo propio (O11) y página de la agencia canadiense (O21) |
| 11 | **Pérdida de hueso** | Huesos | No relevado aquí (tema ya tratado en los documentos de columna) | No hay escáner de hueso para personas a bordo: se mide **antes y después** del vuelo (O10) | No se mide en misión; solo marcadores en muestras que vuelven a Tierra (ver `herramientas-medicion-columna-v2.md`) | **1 a 1,5 % por mes** en huesos que cargan peso (O1, O10) | **Sí** (O10). **Tema ya explorado y descartado como central** |
| 12 | **Corazón y vasos** (arritmias, presión baja al volver) | Corazón y vasos | No relevado | No relevado | Ecografía del corazón (O5). Resto: no relevado | El riesgo principal en misión es el desmayo al volver a la gravedad (N15), o sea **fuera del momento elegido** | **Sí** (O5). **Probablemente lo elija la mayoría de los equipos** (supuesto de la consigna) |

### Por qué este orden

1. **SANS:** cumple los cinco criterios con el mayor respaldo. Es el único con riesgo propio, peligro y cinco estudios en curso en los recursos oficiales.
2. **Yugular y coágulos:** es el caso más claro de "no me doy cuenta" (hallazgo de casualidad) y se mide con ecografía. Queda segundo porque la evidencia es de 11 personas y la medición hoy es solo de investigación.
3. **Sueño y rendimiento mental:** bien medido y oficial; la percepción propia falla. Baja porque no es "una parte del cuerpo" y porque el desafío ya lo sugiere como indicador.
4. **Defensas y virus:** muy documentado y oficial, pero en misión casi no hay resultado disponible: la muestra viaja a Tierra.
5. **Audición:** la percepción falla y hay una prueba directa a bordo con cifras altas. Baja porque casi no aparece en los recursos oficiales.
6. **Cálculos renales:** silencioso y grave si ocurre, pero con un solo caso en vuelo y sin control de rutina encontrado.
7. **Nutrición y peso:** oficial y medible, pero no encontré que al astronauta le cueste notarlo.
8. **CO2:** lo que falla es la medición individual, pero no está en los recursos oficiales.
9. **Anemia espacial:** hallazgo fuerte, pero de un solo estudio y sin presencia en los recursos oficiales.
10. **Radiación:** oficial e imperceptible, pero el efecto en el cuerpo no se mide en misión: se calcula.
11. **Hueso:** cumple casi todo, pero no hay nada que medir en misión y el tema ya se descartó.
12. **Corazón:** oficial y medible, pero su riesgo principal es al volver y es la opción más común.

### Problemas mirados y dejados fuera de la tabla

| Problema | Motivo |
|---|---|
| Mareo y desorientación | Los síntomas son evidentes y se concentran en los cambios de gravedad ([riesgo sensoriomotor](https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/)) |
| Enfermedad por descompresión, falta de oxígeno, lesiones en caminatas espaciales | Ligados a la caminata espacial, no a la vida diaria en la estación |
| Salud mental y trabajo en equipo | Oficiales y relevantes, pero no son "una parte del cuerpo"; el ánimo es un indicador que el desafío ya sugiere |
| Retención de orina | Problema agudo, con síntomas claros: 16 casos en 908 vuelos-persona ([registro de riesgo](https://www.nasa.gov/wp-content/uploads/2025/09/hsrb-urinary-retention-risk-risk-record-web.pdf)) |
| Lesiones por cargas dinámicas | Ocurren en el despegue y el aterrizaje |

---

## Parte 2 — Fichas de los 5 más fuertes

### Ficha 1 — SANS (ojos y cerebro)

| Punto | Dato |
|---|---|
| **1. Qué es** | En ingravidez los líquidos del cuerpo se van hacia la cabeza. Eso puede hinchar el nervio óptico (el "cable" que une el ojo con el cerebro), plegar la retina, aplanar la parte de atrás del ojo e hinchar el cerebro (O4). No existe una enfermedad equivalente en Tierra (N13). |
| **2. Por qué cuesta darse cuenta** | Los astronautas **no tienen** los síntomas de la enfermedad terrestre más parecida: ni dolor de cabeza crónico, ni visión doble, ni zumbidos. Si reportan algo, es que ven peor de cerca (N1). En un caso, la OCT mostró la hinchazón el día 21 y la foto del fondo de ojo recién el día 90; en el otro ojo, la foto nunca la mostró (N1). |
| **3. Por qué es complejo con médicos** | **La causa de la hinchazón no se conoce** (N18). La presión dentro del cráneo **nunca se midió en vuelo**: medirla exige una punción en la espalda o un sensor dentro del cerebro (N1, N18). La escala clínica para graduar la hinchazón es subjetiva y varía mucho entre evaluadores (N1). La resonancia es solo antes y después del vuelo (N1). **No hay tratamiento probado en vuelo**; lo único disponible son anteojos (N1). El resultado a largo plazo se desconoce (O4). |
| **4. Qué se mide en misión** | OCT (tomografía de la retina, en la estación desde 2013), foto del fondo de ojo, ecografía del ojo, presión del ojo, agudeza visual y una grilla para detectar distorsiones. *Directa*. **"Semanas del ojo":** días 30 y 90 de vuelo y 30 días antes de volver, o cuando haga falta. Un tripulante opera el equipo sobre otro; desde Tierra lo guía un instructor y un especialista mira las imágenes (N1, N18). **Umbral de la NASA:** un aumento del grosor de la retina junto al nervio óptico mayor a 19,4 micrómetros es el primer signo de hinchazón (N1). |
| **5. Frecuencia o gravedad** | **~70 %** de los astronautas tiene signos tempranos de hinchazón por OCT; **~15 %** tiene hinchazón clínica (N1; el informe técnico N18 dice 18 %). Pliegues y aplanamiento: cerca del 25 % cada uno (N18). **60 %** reportó ver peor en misiones largas (N1). Hasta ahora la visión siempre se pudo corregir con anteojos (N1). Un caso tardó 20 meses en resolverse después de volver (N1). |
| **6. Qué hace la NASA** | Cinco estudios en curso: vitaminas B (O18), manguitos en los muslos para retener líquido en las piernas (O19), presión del líquido del cerebro medida al volver (O14), marcadores en el líquido de la columna (O20) y estructura y función del ojo dentro de CIPHER (O16). También estudia reposo en cama con la cabeza inclinada hacia abajo (O4). El equipo de OCT actual es demasiado grande para misiones lejanas (N1). |
| **7. Recurso oficial** | **Sí.** Riesgo propio (O4), peligro "gravedad" (O1) y los cinco estudios listados en la página oficial de estudios en curso (O12). |

### Ficha 2 — Sangre estancada y coágulos en la vena yugular

| Punto | Dato |
|---|---|
| **1. Qué es** | La vena yugular interna lleva la sangre de la cabeza al corazón. En ingravidez, en algunos tripulantes la sangre de esa vena se frena, queda quieta o va al revés. La sangre quieta puede formar un coágulo (P1). |
| **2. Por qué cuesta darse cuenta** | Los coágulos encontrados **no daban síntomas** y aparecieron **de casualidad** al revisar la vena para un estudio. Los autores dicen que es plausible que haya habido coágulos sin detectar en misiones anteriores (P1). |
| **3. Por qué es complejo con médicos** | Fue el primer coágulo reportado en más de 50 años de vuelos (P1). No se sabe por qué pasa solo en algunos (O13). El diagnóstico lo hicieron dos radiólogos en Tierra, y el segundo caso se encontró recién al revisar todas las imágenes con un panel de expertos (P1). A los candidatos a astronauta no se les estudia de rutina la tendencia a formar coágulos (P1). El tratamiento usa anticoagulantes, cuya estabilidad en el espacio es otro riesgo abierto (N3). |
| **4. Qué se mide en misión** | Ecografía de la yugular: tamaño de la vena, presión y dirección del flujo, con una escala de 4 grados (1 = normal, 3 = quieta, 4 = al revés). *Directa*. La hace el tripulante guiado en tiempo real desde Tierra. **Solo en estudios**, alrededor de los días 50 y 150 (P1). El estudio en curso suma extracciones de sangre y presión arterial antes y durante el vuelo (O13). Control médico de rutina: no encontrado. |
| **5. Frecuencia o gravedad** | Flujo quieto o invertido en **6 de 11** tripulantes (55 %) hacia el día 50. **1 coágulo** que tapaba la vena, tratado con anticoagulantes el resto del vuelo, y **1 coágulo parcial** hallado después (P1, N2). Hubo casos en tripulantes de ambos sexos (P1). Un coágulo puede terminar en embolia pulmonar y, en casos graves, en muerte (N3). |
| **6. Qué hace la NASA** | Estudio *Venous Haemostasis* con la agencia europea, para saber quién tiene más riesgo (O13). Una cámara que aplica succión a las piernas mejoró el flujo en 10 de 17 sesiones (P1). También se prueban los manguitos en los muslos (O13, O19). La NASA lo sumó al riesgo cardiovascular (N2). |
| **7. Recurso oficial** | **Sí.** El riesgo cardiovascular nombra los coágulos (O5) y *Venous Haemostasis* está en la página oficial de estudios en curso (O13). No tiene página propia entre los 17 riesgos. |

### Ficha 3 — Falta de sueño, reloj biológico y rendimiento mental

| Punto | Dato |
|---|---|
| **1. Qué es** | Dormir poco, tener el reloj biológico desfasado y trabajar de más bajan el rendimiento y afectan la salud (O8). En la estación hay 16 amaneceres por día (O8). |
| **2. Por qué cuesta darse cuenta** | En estudios de laboratorio en Tierra, con sueño restringido el rendimiento empeora día a día, pero la sensación de sueño sube poco y se estanca: "la mayoría no puede medir cuánto la afecta la falta de sueño" (N5). El informe plantea que los astronautas pueden acostumbrarse a dormir mal (N5). **Es dato de laboratorio, no de astronautas.** |
| **3. Por qué es complejo con médicos** | Las causas se mezclan: carga de trabajo, luz, horarios cambiantes (O8, N5). El remedio más usado son las pastillas para dormir, que acortan el tiempo en dormirse pero **no alargan el sueño** (N5). |
| **4. Qué se mide en misión** | **Sensor de muñeca** que registra movimiento y luz, las 24 horas, durante 14 días seguidos cada 60 días (*Indirecta*: estima el sueño por el movimiento). **Diario de sueño** (*Autorreporte*). **Batería de cognición** de 10 pruebas cortas en computadora, que mide rapidez y aciertos (*Directa*, del rendimiento). Todo dentro de *Standard Measures* (P5, O15). |
| **5. Frecuencia o gravedad** | En la estación: **6,09 horas** de sueño por noche; menos de 6 horas en el **43,8 %** de las noches; **75 %** (12 de 16) usó pastillas para dormir (P3). |
| **6. Qué hace la NASA** | Luces LED que imitan el día y la noche, estudios sobre luz y cafeína, y tiempo de descanso programado (O8). Mediciones de sueño y actividad en Artemis II ([ARCHeR](https://www.nasa.gov/reference/archer/)). |
| **7. Recurso oficial** | **Sí.** Riesgo propio (O8), *Standard Measures* (O15) y [peligro "aislamiento"](https://www.nasa.gov/hrp/hazard-isolation-and-confinement/), que nombra la falta de sueño. **Ojo:** el desafío ya sugiere "horas de sueño" como indicador, así que es probable que muchos equipos lo usen. |

### Ficha 4 — Defensas alteradas y virus dormidos que se reactivan

| Punto | Dato |
|---|---|
| **1. Qué es** | La radiación, la ingravidez, el estrés y el mal sueño alteran las defensas. Pueden despertar virus que el cuerpo tenía dormidos (herpes labial, culebrilla) y provocar alergias y sarpullidos (O6). |
| **2. Por qué cuesta darse cuenta** | El virus aparece en la saliva de casi todos, pero las enfermedades visibles son muchas menos. La NASA dice que **no se sabe** si esa reactivación ocurre siempre sin síntomas (N4). Los síntomas reportados (sarpullido, resfrío, alergia) son comunes y ambiguos (N4). |
| **3. Por qué es complejo con médicos** | **No se sabe si los cambios en las defensas enferman más** (N14). A bordo "el diagnóstico generalmente no es posible" y falta equipo de laboratorio apto para vuelo (N4). La sangre se congela a −96 °C y se analiza al volver (P5). Un sarpullido documentado duró casi toda una misión de 191 días y respondió poco a tres tratamientos (N4). |
| **4. Qué se mide en misión** | Saliva y sangre tomadas en vuelo y analizadas en Tierra: virus, hormonas del estrés y células de defensa (*Indirecta*, **resultado tardío**) (P5, O6). Síntomas que el tripulante cuenta al médico (*Autorreporte*). Medición con resultado a bordo: no encontrada. |
| **5. Frecuencia o gravedad** | **22 de 23** astronautas de misión larga eliminaron al menos un virus, contra 2 de 20 personas de control. En 46 tripulantes de la estación: **3,4 eventos por año de vuelo** y **46 %** con un evento "notable" (más de una semana, repetido o sin respuesta al tratamiento). Los más comunes: sarpullidos, síntomas respiratorios e infecciones (N4, que cita a Mehta 2017 y Crucian 2016). |
| **6. Qué hace la NASA** | Limitar el contacto con grupos grandes en las dos semanas previas al despegue (O7). Muestras en vuelo que vuelven a Tierra (O6). Saliva seca recogida en papel especial durante Artemis II (O17). |
| **7. Recurso oficial** | **Sí.** Riesgo inmune (O6), riesgo de microbios (O7), peligro "ambiente cerrado" (O2) e *Immune Biomarkers* (O17). |

### Ficha 5 — Pérdida de audición por el ruido

| Punto | Dato |
|---|---|
| **1. Qué es** | La estación es ruidosa de forma permanente. El ruido puede bajar la audición de forma temporal o permanente, y además da dolor de cabeza y empeora el sueño (N10). |
| **2. Por qué cuesta darse cuenta** | "Incluso el ruido que la tripulación no percibe como dañino" puede bajar la audición, porque uno **se acostumbra** o no lo siente molesto (N10). |
| **3. Por qué es complejo con médicos** | Los cambios en tonos graves no son típicos del ruido y **su causa no se entiende**; al principio se atribuyeron a interferencia del ambiente, y desde 2021 los datos sugieren que no es eso (N9, N17). Los datos rusos muestran más pérdida que los estadounidenses, sin explicación (N9). |
| **4. Qué se mide en misión** | **Prueba de audición a bordo:** auriculares y un programa en la computadora de la estación; la hace el tripulante en los primeros 14 días y luego cada 60 días; la revisan los médicos en Tierra (*Directa*) (N16, N17). **Medidor de ruido** que el tripulante lleva puesto (*Directa*, del ambiente) (N9). |
| **5. Frecuencia o gravedad** | Cambio en tonos graves en el **40,4 %** de las pruebas a bordo y en el **62,7 %** de los tripulantes estadounidenses al menos una vez. En agudos: 9,0 % de las pruebas y 21,3 % de los tripulantes. El ruido superó el nivel de peligro (85 decibeles) en el **38 %** de unas 461 mediciones. Después del vuelo, los cambios en agudos se recuperan (N9). |
| **6. Qué hace la NASA** | Tapones a medida y auriculares, límites de ruido para los equipos, y un programa nuevo de prueba (desde 2021) para entender los cambios en graves (N9, N17). |
| **7. Recurso oficial** | **Poco.** El peligro "ambiente cerrado" nombra el ruido entre los factores a controlar (O2). No está entre los 17 riesgos; está en la lista ampliada de la NASA (N10). |

**El sexto, cálculos renales**, quedó fuera de las fichas por tener un solo caso en vuelo (N6) y ningún control de rutina encontrado. A favor: está nombrado en un peligro oficial (O1) y la ecografía permite ver la piedra antes de que duela (N7).

---

## Parte 3 — Lo no verificado y las fuentes

### Lo no verificado

**Fuentes no leídas**

- **P4\* (coágulo, carta en NEJM):** el sitio no dejó descargarla. Los detalles del tratamiento a bordo no están verificados; solo consta que se trató con anticoagulantes (P1).
- **Mehta 2017, Crucian 2016, Mader 2011, Law 2014, Belenky 2003 y Van Dongen 2003:** sus cifras están tomadas de los informes de la NASA que los citan (N1, N4, N5, N8), no de los artículos originales.
- **N17:** leí solo el resumen; el documento completo es un póster.

**Cifras con salvedades**

- **SANS, "~70 %":** depende del umbral de OCT que eligió la NASA. La hinchazón clínica figura como ~15 % en N1 y 18 % en N18.
- **Yugular, "6 de 11":** es un solo estudio chico. Contando el día 150, fueron 7 los tripulantes con flujo quieto o invertido (P1).
- **Sueño:** el informe N5 es de 2016 y los datos de P3 son de misiones hasta 2011. La falla de la autopercepción es de laboratorio en Tierra.
- **Audición:** el calendario de la prueba sale de un parte diario de la estación de 2023 (N16); no verifiqué que siga igual.
- **Radiación:** el rango de 50 a 2.000 mSv mezcla estación, Luna y Marte.

**No encontrado**

- Control médico de rutina de la yugular en vuelo.
- Control de rutina de cálculos renales en vuelo.
- Instrumento con que se pesa a la tripulación.
- Dosis de radiación propia de una misión en la estación.
- Síntomas de la anemia durante el vuelo.
- Motivo por el que al astronauta le costaría notar que come de menos.
- Cifras de los datos rusos de audición.

**Supuestos míos o de la consigna**

- **El orden de los candidatos** es mi criterio.
- **"El corazón lo elige la mayoría"** viene de la consigna; no se puede comprobar porque los proyectos no son públicos.
- **Hueso y corazón** no se relevaron a fondo: uno ya estaba descartado y el otro apenas mirado.
- **Qué cuenta como recurso oficial** lo tomé de `recursos-del-desafio.md`; no volví a abrir la página del desafío.

### Fuentes

**Texto completo:** *Sí* = conseguido y leído (en los informes largos, leí las secciones de las que salen los datos) · *No* = con el motivo.

| ID | Fuente | Texto completo |
|---|---|---|
| O1 | [Peligro: gravedad](https://www.nasa.gov/hrp/hazard-gravity-fields/) | Sí |
| O2 | [Peligro: ambiente cerrado y hostil](https://www.nasa.gov/hrp/hazard-hostile-closed-environments/) | Sí |
| O3 | [Peligro: radiación](https://www.nasa.gov/hrp/hazard-space-radiation/) | Sí |
| O4 | [Riesgo SANS](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/) | Sí |
| O5 | [Riesgo cardiovascular](https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/) | Sí |
| O6 | [Riesgo inmune](https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/) | Sí |
| O7 | [Riesgo de microbios](https://www.nasa.gov/reference/risk-of-host-microorganism-interactions/) | Sí |
| O8 | [Riesgo de sueño y horarios](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/) | Sí |
| O9 | [Riesgo de nutrición](https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/) | Sí |
| O10 | [Riesgo de hueso](https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/) | Sí |
| O11 | [Riesgo de cáncer por radiación](https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/) | Sí |
| O12 | [Estudios en curso del HRP](https://www.nasa.gov/hrp/ongoing-hrp-research/) | Sí |
| O13 | [Venous Haemostasis](https://www.nasa.gov/reference/venous-haemostasis/) | Sí |
| O14 | [Brain Fluid Pressure](https://www.nasa.gov/reference/brain-fluid-pressure/) | Sí |
| O15 | [Standard Measures](https://www.nasa.gov/reference/standard-measures/) | Sí |
| O16 | [CIPHER](https://www.nasa.gov/reference/cipher/) | Sí |
| O17 | [Immune Biomarkers](https://www.nasa.gov/reference/immune-biomarkers/) | Sí |
| O18 | [B-Complex](https://www.nasa.gov/reference/b-complex/) | Sí |
| O19 | [Thigh Cuff](https://www.nasa.gov/reference/thigh-cuff/) | Sí |
| O20 | [Spinal Fluid Biomarkers](https://www.nasa.gov/reference/spinal-fluid-biomarkers/) | Sí |
| O21 | [CSA: Monitoring radiation for astronaut health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) | Sí |
| N1 | [Informe de evidencia: SANS, 2022](https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf) | Sí (secciones de evidencia en vuelo, presión del cráneo, monitoreo y diagrama causal) |
| N2 | [Preocupación por tromboembolismo venoso](https://www.nasa.gov/directorates/esdmd/hhp/concern-of-venous-thromboembolism/) | Sí |
| N3 | [Diagrama causal de tromboembolismo venoso](https://www3.nasa.gov/sites/default/files/atoms/files/concern_of_venous_thromboembolism_dag.pdf) | Sí |
| N4 | [Informe de evidencia: respuesta inmune, 2022](https://humanresearchroadmap.nasa.gov/evidence/reports/IMMUNE%20EB%20Update%202021%20v02%20FINAL_6-15-22.pdf) | Sí (resumen, evidencia en vuelo, incidencia y vacíos de conocimiento) |
| N5 | [Informe de evidencia: sueño, 2016](https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf) | Sí (pérdida de sueño, evidencia en vuelo y medicación) |
| N6 | [Informe de evidencia: cálculos renales, 2017](https://humanresearchroadmap.nasa.gov/evidence/reports/Renal.pdf) | Sí (resumen, casos, diagnóstico en vuelo y conclusiones) |
| N7 | [Diagrama causal de cálculos renales](https://www.nasa.gov/wp-content/uploads/2025/09/renal-stone-risk-dag-narrative.pdf) | Sí |
| N8 | [Registro de riesgo: CO2](https://www.nasa.gov/wp-content/uploads/2025/09/hsrb-co2-risk-risk-record-rev-d-1-web.pdf) | Sí (resumen, diagrama causal y evidencia de dolores de cabeza) |
| N9 | [Registro de riesgo: pérdida de audición](https://www.nasa.gov/wp-content/uploads/2025/11/hsrb-hearing-loss-risk-record-rev-b-1-web.pdf) | Sí (resumen y cifras de pruebas y de ruido) |
| N10 | [Riesgo de pérdida de audición](https://www.nasa.gov/directorates/esdmd/hhp/risk-of-hearing-loss-and-performance-decrements-due-to-acoustics-issues-in-space/) | Sí |
| N11 | [Registro de riesgo: alimentación y nutrición](https://www.nasa.gov/wp-content/uploads/2025/08/food-risk-record-rev-d-web-final.pdf) | Sí (resumen y cifras de masa corporal) |
| N12 | [Informe de evidencia: cáncer por radiación, 2016](https://humanresearchroadmap.nasa.gov/evidence/reports/Cancer.pdf) | Sí (solo el resumen ejecutivo) |
| N13 | [Riesgo SANS, lista ampliada](https://www.nasa.gov/directorates/esdmd/hhp/risk-of-spaceflight-associated-neuro-ocular-syndrome/) | Sí |
| N14 | [Riesgo inmune, lista ampliada](https://www.nasa.gov/directorates/esdmd/hhp/immune-risk/) | Sí |
| N15 | [Riesgo cardiovascular, lista ampliada](https://www.nasa.gov/directorates/esdmd/hhp/cv-risk/) | Sí |
| N16 | [Parte diario de la estación, 7/9/2023](https://www.nasa.gov/blogs/stationreport/2023/09/07/iss-daily-summary-report-9-07-2023/) (prueba de audición) | Sí |
| N17 | [Effects of Long Duration Space Flight on Low Frequency Hearing, 2024](https://ntrs.nasa.gov/citations/20240009887) | No: solo el resumen; el documento es un póster |
| N18 | [Informe técnico médico de la NASA sobre SANS, 2024](https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf) | Sí |
| P1 | [Marshall-Goebel 2019, flujo y trombosis en la yugular](https://pmc.ncbi.nlm.nih.gov/articles/PMC6902784/) | Sí |
| P2 | [Trudel 2022, destrucción de glóbulos rojos en vuelo](https://www.nature.com/articles/s41591-021-01637-7) | Sí |
| P3 | [Barger 2014, sueño y pastillas para dormir](https://pmc.ncbi.nlm.nih.gov/articles/PMC4188436/) | Sí |
| P4* | [Auñón-Chancellor 2020, trombosis venosa en vuelo](https://www.nejm.org/doi/full/10.1056/NEJMc1905875) | No: el sitio bloqueó la descarga y no hay copia abierta |
| P5 | [Spaceflight Standard Measures, 2025](https://www.nature.com/articles/s41526-025-00532-6) | Sí |
