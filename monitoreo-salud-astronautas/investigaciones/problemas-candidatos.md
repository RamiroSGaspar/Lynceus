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

**Fuentes:** `O` = recurso oficial del desafío · `N` = NASA, fuera de los recursos oficiales · `P` = artículo científico. Un asterisco (`P4*`) indica que no conseguí el texto completo. **"Por verificar"** = todavía no lo confirmé en una fuente leída.

**Términos:** *tripulante* = astronauta o cosmonauta · *misión larga* = alrededor de 6 meses en la estación · *ecografía* = imagen por ultrasonido · *estudio* = investigación con voluntarios, no control médico de rutina.

---

## Parte 1 — Tabla comparativa

| # | Problema | Parte del cuerpo | Por qué cuesta darse cuenta | Por qué es complejo con médicos | Qué se mide en misión | Frecuencia o gravedad | Recurso oficial |
|---|---|---|---|---|---|---|---|
| 1 | **Síndrome neuro-ocular del vuelo espacial (SANS)**: hinchazón del nervio óptico, pliegues en la retina, aplanamiento del ojo | Ojos y cerebro | **Casi no da síntomas.** No hay dolor de cabeza ni visión doble; si se nota algo, es ver peor de cerca (N1) | **Causa desconocida.** La presión dentro del cráneo **nunca se midió en vuelo**. La resonancia es solo en Tierra. No hay tratamiento probado en vuelo (N1) | Tomografía de retina (OCT), foto del fondo de ojo, ecografía del ojo, agudeza visual. *Directa*. Cada cuánto: por verificar (N1) | **~70 %** con signos tempranos de hinchazón; **~15 %** con hinchazón clínica (N1, O4) | **Sí, muy presente:** riesgo propio (O4), peligro "gravedad" (O1) y 5 estudios en curso (O12) |
| 2 | **Sangre estancada y coágulos en la vena yugular** (vena del cuello) | Venas del cuello; sangre | **Sin síntomas.** Los coágulos se encontraron **de casualidad**, durante un estudio (P1) | No se sabe por qué pasa solo en algunos (O13). El diagnóstico lo hicieron radiólogos en Tierra mirando la ecografía (P1). Tratamiento a bordo: por verificar (P4*) | Ecografía de la yugular con medición del flujo. *Directa*. Solo en estudios, días 50 y 150 (P1) | Flujo estancado o invertido en **6 de 11** tripulantes; **1 coágulo** que tapaba la vena y 1 posible (P1, N2) | **Sí:** riesgo cardiovascular nombra "coágulos" (O5) y estudio en curso *Venous Haemostasis* (O13) |
| 3 | **Falta de sueño, reloj biológico desfasado y rendimiento mental** | Cerebro; rendimiento | **La propia percepción falla:** el rendimiento cae y la sensación de sueño casi no cambia (dato de laboratorio en Tierra, N5) | Varias causas mezcladas (trabajo, luz, ruido, horarios). El remedio más usado son pastillas para dormir (N5) | Sensor de muñeca que registra movimiento y luz (*Indirecta*), diario de sueño (*Autorreporte*), pruebas de cognición (O15) | **~6 h** de sueño por noche; **75 %** de tripulantes de la estación usó pastillas para dormir (P3) | **Sí:** riesgo propio (O8), *Standard Measures* (O15). **Ojo:** "horas de sueño" es un indicador que el desafío ya sugiere |
| 4 | **Defensas alteradas y virus dormidos que se reactivan** (incluye erupciones de piel y alergias) | Sistema inmune; piel | El virus se reactiva **sin que la persona lo note**; los síntomas que aparecen (sarpullido, resfrío) son ambiguos (N4) | **Las muestras se analizan en Tierra.** No hay equipo de laboratorio apto para vuelo. "El diagnóstico generalmente no es posible" a bordo (N4) | Saliva, sangre y orina que se guardan y vuelven a Tierra (*Indirecta*, resultado tardío); síntomas (*Autorreporte*) (O6, O15) | Virus en **22 de 23** tripulantes; **46 %** con un evento médico "notable"; 3,4 eventos por año de vuelo (N4) | **Sí:** riesgo propio (O6), microbios (O7), peligro "ambiente cerrado" (O2), *Immune Biomarkers* (O17) |
| 5 | **Pérdida de audición por el ruido de la estación** | Oído | **Uno se acostumbra al ruido** y deja de percibirlo como dañino (N10) | No se entiende la causa de los cambios en tonos graves ni por qué los datos rusos muestran más pérdida que los estadounidenses (N9) | Prueba de audición a bordo (*Directa*) y medidor de ruido que lleva puesto el tripulante (*Directa*). Cada cuánto: por verificar (N9) | Cambio en tonos graves en el **40,4 %** de las pruebas a bordo; agudos, 9,0 %. El ruido superó el nivel de peligro en el **38 %** de las mediciones (N9) | **Poco:** el peligro "ambiente cerrado" solo nombra el ruido (O2). No está entre los 17 riesgos |
| 6 | **Cálculos renales** (piedras en el riñón) | Riñones y vías urinarias | La piedra **no duele mientras está en el riñón**; duele cuando se mueve (N7) | No se puede predecir quién va a formar una. No hay forma de tratarla en misiones lejanas. La química de la orina se analiza en Tierra (N6, N7) | Ecografía a bordo, guiada desde Tierra, **si hay síntomas** (*Directa*). Control de rutina en vuelo: no encontrado (N6) | **1 caso** en vuelo (un cosmonauta); **37** eventos en astronautas de EE. UU. hasta 2016, antes o después de volar (N6) | **Sí, breve:** el peligro "gravedad" nombra los cálculos (O1). No tiene página entre los 17 riesgos |
| 7 | **Comer de menos, bajar de peso y deshidratarse** | Nutrición; todo el cuerpo | Por verificar (posible: menos apetito y cambios lentos) | Los nutrientes en sangre se analizan en Tierra (por verificar). La comida debe gustar, durar y variar (O9) | Registro de comidas en una aplicación (*Autorreporte*) y masa corporal (*Directa*, instrumento por verificar) (N11) | **25 %** de los tripulantes perdió más del 5 % de su masa en vuelo (N11) | **Sí:** riesgo propio (O9), *Standard Measures* (O15) |
| 8 | **Dióxido de carbono (CO2) en el aire de la cabina** | Aire; cabeza y rendimiento | El síntoma típico es **dolor de cabeza**, que tiene muchas otras causas (N8) | Se mide el promedio de la cabina, **no lo que respira cada persona**; algunos son más sensibles que otros (N8) | Monitores de CO2 de la cabina y portátiles (*Directa*, del aire); síntomas (*Autorreporte*) (N8) | Síntomas "limitados a algunos tripulantes sensibles" y reversibles (N8). Cifras: por verificar | **No directo.** Está en la lista ampliada de riesgos de la NASA (N8) |
| 9 | **Destrucción de glóbulos rojos** ("anemia espacial") | Sangre | Por verificar (el estudio no describe síntomas en vuelo) | Las muestras de aire y sangre **se analizaron en Tierra** (P2) | Aire exhalado en bolsa y sangre congelada, solo en un estudio (*Indirecta*, resultado tardío) (P2) | **54 %** más destrucción de glóbulos rojos en vuelo (14 astronautas); 5 de 13 con anemia al aterrizar (P2) | **No encontrado** |
| 10 | **Radiación recibida** | Todo el cuerpo | **No se ve ni se siente** (O3) | El riesgo de cáncer **se estima con modelos**, con mucha incertidumbre, y aparece años después (N12) | Medidores de radiación en la estación (*Directa*, de la dosis; el efecto es *Estimación*) (O11) | Por verificar | **Sí:** peligro (O3) y riesgo propio (O11) |
| 11 | **Pérdida de hueso** | Huesos | Por verificar (ya relevado en parte en los documentos de columna) | No hay escáner de hueso para personas a bordo: se mide **antes y después** del vuelo (O10) | No se mide en misión; solo marcadores en muestras que vuelven a Tierra (ver `herramientas-medicion-columna-v2.md`) | **1 a 1,5 % por mes** en huesos que cargan peso (O1, O10) | **Sí** (O10). **Tema ya explorado y descartado como central** |
| 12 | **Corazón y vasos** (arritmias, presión baja al volver) | Corazón y vasos | Por verificar | Por verificar | Ecografía, presión arterial (por verificar) | El riesgo principal en misión es el desmayo al volver a la gravedad (N15), o sea **fuera del momento elegido** | **Sí** (O5). **Probablemente lo elija la mayoría de los equipos** |

### Por qué este orden

1. **SANS:** cumple los cinco criterios con el mayor respaldo. Es el único con riesgo propio, peligro y cinco estudios en curso en los recursos oficiales.
2. **Yugular y coágulos:** es el caso más claro de "no me doy cuenta" (hallazgo de casualidad) y se mide con ecografía. Baja al segundo lugar porque la evidencia es de 11 personas.
3. **Sueño y rendimiento mental:** bien medido y oficial; la percepción propia falla. Baja porque no es "una parte del cuerpo" y porque el desafío ya lo sugiere como indicador.
4. **Defensas y virus:** muy documentado y oficial, pero en misión casi no hay resultado disponible: la muestra viaja a Tierra.
5. **Audición:** la percepción falla y hay prueba directa a bordo con cifras altas. Baja porque casi no aparece en los recursos oficiales.
6. **Cálculos renales:** silencioso y difícil de tratar, pero con un solo caso en vuelo y sin control de rutina encontrado.
7. **Nutrición y peso:** oficial y medible, pero no encontré que al astronauta le cueste notarlo.
8. **CO2:** lo que falla es la medición individual, pero no está en los recursos oficiales.
9. **Anemia espacial:** hallazgo fuerte, pero de un solo estudio y sin presencia en los recursos oficiales.
10. **Radiación:** oficial e imperceptible, pero el efecto en el cuerpo no se mide en misión: se calcula.
11. **Hueso:** cumple casi todo, pero no hay nada que medir en misión y el tema ya se descartó.
12. **Corazón:** oficial y medible, pero su riesgo principal es al volver y es la opción más común.

### Problemas mirados y dejados fuera de la tabla

| Problema | Motivo |
|---|---|
| Mareo y desorientación (sensoriomotor) | Los síntomas son evidentes y se concentran en los cambios de gravedad (O: [riesgo sensoriomotor](https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/)) |
| Enfermedad por descompresión, falta de oxígeno, lesiones en caminatas espaciales | Ligados a la caminata espacial, no a la vida diaria en la estación |
| Salud mental y trabajo en equipo | Oficiales y relevantes, pero no son "una parte del cuerpo"; el ánimo es un indicador que el desafío ya sugiere |
| Retención de orina | Problema agudo de los primeros días, con síntomas claros (16 casos en 908 vuelos-persona, [registro de riesgo](https://www.nasa.gov/wp-content/uploads/2025/09/hsrb-urinary-retention-risk-risk-record-web.pdf)) |
| Lesiones por cargas dinámicas | Ocurren en el despegue y el aterrizaje |

### Fuentes usadas en la tabla (lista provisoria; la definitiva va en la Parte 3)

- O1 [Peligro: gravedad](https://www.nasa.gov/hrp/hazard-gravity-fields/) · O2 [Peligro: ambiente cerrado](https://www.nasa.gov/hrp/hazard-hostile-closed-environments/) · O3 [Peligro: radiación](https://www.nasa.gov/hrp/hazard-space-radiation/)
- O4 [Riesgo SANS](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/) · O5 [Riesgo cardiovascular](https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/) · O6 [Riesgo inmune](https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/) · O7 [Riesgo microbios](https://www.nasa.gov/reference/risk-of-host-microorganism-interactions/) · O8 [Riesgo sueño](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/) · O9 [Riesgo nutrición](https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/) · O10 [Riesgo hueso](https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/) · O11 [Riesgo cáncer por radiación](https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/)
- O12 [Estudios en curso](https://www.nasa.gov/hrp/ongoing-hrp-research/) · O13 [Venous Haemostasis](https://www.nasa.gov/reference/venous-haemostasis/) · O15 [Standard Measures](https://www.nasa.gov/reference/standard-measures/) · O17 [Immune Biomarkers](https://www.nasa.gov/reference/immune-biomarkers/)
- N1 [Informe de evidencia SANS, 2022](https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf) · N2 [Preocupación por tromboembolismo venoso](https://www.nasa.gov/directorates/esdmd/hhp/concern-of-venous-thromboembolism/) · N4 [Informe de evidencia inmune, 2022](https://humanresearchroadmap.nasa.gov/evidence/reports/IMMUNE%20EB%20Update%202021%20v02%20FINAL_6-15-22.pdf) · N5 [Informe de evidencia sueño, 2016](https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf) · N6 [Informe de evidencia cálculos renales, 2017](https://humanresearchroadmap.nasa.gov/evidence/reports/Renal.pdf) · N7 [Diagrama causal de cálculos renales](https://www.nasa.gov/wp-content/uploads/2025/09/renal-stone-risk-dag-narrative.pdf)
- N8 [Registro de riesgo CO2](https://www.nasa.gov/wp-content/uploads/2025/09/hsrb-co2-risk-risk-record-rev-d-1-web.pdf) · N9 [Registro de riesgo de pérdida de audición](https://www.nasa.gov/wp-content/uploads/2025/11/hsrb-hearing-loss-risk-record-rev-b-1-web.pdf) · N10 [Riesgo de pérdida de audición](https://www.nasa.gov/directorates/esdmd/hhp/risk-of-hearing-loss-and-performance-decrements-due-to-acoustics-issues-in-space/) · N11 [Registro de riesgo de alimentación y nutrición](https://www.nasa.gov/wp-content/uploads/2025/08/food-risk-record-rev-d-web-final.pdf) · N12 [Informe de evidencia cáncer por radiación, 2016](https://humanresearchroadmap.nasa.gov/evidence/reports/Cancer.pdf) · N15 [Riesgo cardiovascular, lista ampliada](https://www.nasa.gov/directorates/esdmd/hhp/cv-risk/)
- P1 [Marshall-Goebel 2019, flujo y trombosis en la yugular](https://pmc.ncbi.nlm.nih.gov/articles/PMC6902784/) · P2 [Trudel 2022, hemólisis en vuelo](https://www.nature.com/articles/s41591-021-01637-7) · P3 [Barger 2014, sueño y pastillas para dormir](https://pmc.ncbi.nlm.nih.gov/articles/PMC4188436/) · P4* [Auñón-Chancellor 2020, trombosis venosa en vuelo](https://www.nejm.org/doi/full/10.1056/NEJMc1905875) (no conseguido)
