# El producto

[English](../en/product.md) · [Inicio](../../README.es.md) · [Demo](demo.md)

## La necesidad

En vuelos largos pueden aparecer cambios en la región del nervio óptico sin que el
astronauta note síntomas. SANS comprende varios hallazgos oculares; este prototipo
se concentra en **engrosamiento retinal junto al nervio y pliegues**.

Una lectura comprensible a bordo cobra valor cuando la comunicación con Tierra se
demora. El propósito es organizar la información para el tripulante y su médico:
qué cambió, cuánto, con qué incertidumbre y qué control propone la herramienta.
La justificación científica y sus fuentes están en [evidencia](evidence.md).

## Qué hace una persona

1. Elige un tripulante ficticio y un día de misión.
2. Responde síntomas y realiza agudeza de cerca y Amsler, o los saltea explícitamente.
3. Pide una captura OCT de cada ojo. El instrumento simula la imagen y el motor la mide.
4. Repite una captura rechazada, hasta tres intentos por ojo.
5. Lee la comparación con el examen del mismo ojo antes del vuelo.
6. Consulta la historia y prepara un informe y preguntas para el médico.

Se puede cambiar entre español e inglés. El análisis se ejecuta en el navegador;
el visor permite ver cortes, bordes encontrados, zonas medidas y referencia.

## Cómo interpretar la respuesta

| Parte | Qué representa |
|---|---|
| Cambio de grosor, µm | Medición de hoy menos la referencia del mismo ojo |
| Cambio de rugosidad, µm | Cambio de ondulación de la membrana de Bruch, usado como indicador de pliegues |
| Rango y probabilidad | Estimaciones del modelo de error **provisorio**, con cobertura sin validar |
| Nivel | Aplicación de umbrales publicados y reglas de seguimiento del proyecto |
| Próximo paso | Propuesta de monitoreo y contacto con el médico; sus frecuencias extra son supuestos |
| «No se pudo medir» | Falta una medición utilizable; no equivale a «sin cambio» |

Un aumento **mayor a 19,4 µm** cruza el umbral de primer indicio utilizado por el
prototipo; **55 µm o más** cruza el clínicamente preocupante. Los pliegues y síntomas
pueden influir también en el nivel. El nombre del nivel no constituye un diagnóstico.
La [tabla de evidencia](evidence.md) distingue la cifra publicada de las decisiones
propias y explica por qué NASA también presenta el primer umbral redondeado a 20 µm.

Si ningún ojo se puede medir y no hay un síntoma agudo que determine el nivel, la
sesión queda sin nivel. Un síntoma agudo puede exigir contacto inmediato aunque
la tomografía no muestre cambios.

## Qué es ficticio y qué se ejecuta realmente

| Elemento | Naturaleza |
|---|---|
| Tripulantes, misión y evolución | Escenarios inventados con referencias científicas |
| Imágenes y fallos de captura | Simulados por un instrumento virtual |
| Lectura y análisis de imágenes | Cálculos ejecutados sobre los píxeles simulados |
| Historia incluida | Exámenes simulados ya procesados con el motor |
| Visión y síntomas de la historia | Escenarios inventados; no se deducen del OCT |
| Pruebas realizadas por el visitante | Respuestas reales de esa interacción, dentro de una demo ficticia |
| Incertidumbre actual | Estimación provisoria; no precisión clínica demostrada |

«Medido» indica cómo se obtuvo un número. Una medición puede provenir de una imagen
simulada; no convierte al tripulante en una persona real.

## Cuatro casos para explorar

| ID / nombre | Intención del escenario |
|---|---|
| A / Kofi Mensah | Cambios pequeños, sin progresión del escenario |
| B / Elena Voss | Aumento gradual que cruza el primer umbral |
| C / Ravi Anand | Cambio clínicamente preocupante, asimetría y pliegues |
| D / Lucía Ferreyra | Cambio extremo, inspirado en un caso publicado sin síntomas |

Las curvas exactas y los nombres son propios. El caso D no reproduce el historial
de un astronauta identificable.

## Asistente y privacidad

El asistente explica términos, resultados, conocimiento sobre SANS y preguntas
para el médico. Usa una base fija con fuentes. No toma decisiones sobre el nivel,
no prescribe ni estima presión intracraneal.

La consulta requiere consentimiento y transmite pregunta y resumen numérico sin
identidad a Anthropic. Las imágenes quedan en el dispositivo. Los controles y
preguntas para el médico se conservan en el navegador y pueden borrarse desde el
inicio. La aplicación no sincroniza historias entre dispositivos.

## Alcance actual

La demo local permite completar el recorrido y descargar el informe. La evaluación
de 621 capturas está publicada; el modelo ajustado quedó experimental y el modelo
provisorio sigue activo. La comprobación con la API real del asistente está pendiente
en este cierre documental.

No mide presión intracraneal, cambios cerebrales, graduación, quistes ni grosor de
coroides. No está validado con pacientes, astronautas reales ni el tomógrafo físico.
Los [supuestos centrales](../assumptions.md) y el [informe de evaluación](../../packages/validation/out/quality-validation.md)
permiten examinar esas limitaciones.
