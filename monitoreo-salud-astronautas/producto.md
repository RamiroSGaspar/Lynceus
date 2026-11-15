# Lynceus — Qué es el producto

| | |
|---|---|
| **Proyecto** | NASA Space Apps Challenge 2026 — *Create Health Monitoring Software for Astronauts on Space Missions* |
| **Fecha** | Domingo 15 de noviembre de 2026, 06:10. La entrega cierra hoy a las 23:59 |
| **Para qué es** | Decir en lenguaje llano qué es el producto, para el equipo y como base de la descripción del formulario y de las diapositivas. |
| **Qué no es** | No explica código ni arquitectura: eso está en [arquitectura.md](arquitectura.md) y en [especificaciones/](especificaciones/). |
| **Nombre** | *Lynceus* es provisorio: el argonauta de vista más aguda, vigía de la nave Argo. |

## 1. Qué es

**En una frase:** después de cada examen de ojos, Lynceus le dice al astronauta si la parte de atrás de su ojo cambió respecto de antes del vuelo, cuánto, qué tan seguro es ese resultado y qué corresponde hacer.

**En un párrafo:** es una aplicación web que guía al astronauta por un control completo del síndrome neuro-ocular del vuelo espacial. Le toma tres pruebas de visión, analiza la tomografía de retina de cada ojo, compara el resultado con su propio examen de antes del vuelo y aplica los umbrales que publica la NASA. Explica el resultado con el número, su rango y un nivel, propone el paso siguiente y deja armado el informe para el médico en Tierra, que confirma y tiene la última palabra. Es una primera lectura a bordo, no un diagnóstico.

## 2. El problema

El síndrome neuro-ocular del vuelo espacial (SANS, por su sigla en inglés) es un conjunto de cambios en el ojo durante los vuelos largos: se hincha la zona donde el nervio óptico entra al ojo, aparecen pliegues en el fondo del ojo, el ojo se aplana y cambia la graduación.

| Por qué es un problema difícil | Dato |
|---|---|
| Es frecuente | Cerca del 70 % de los tripulantes de vuelos largos muestra algún signo, y entre 16 y 18 % llega al nivel que la NASA llama clínicamente preocupante |
| No se siente | Lo habitual es que no dé síntomas. En el caso más grave publicado, la retina llegó a estar 232 micrómetros más gruesa el día 126 de vuelo, sin síntomas y con el examen común de fondo de ojo normal |
| Solo se ve con una imagen y una cuenta | El primer indicio es un aumento de más de 19,4 micrómetros en el grosor de la retina junto al nervio, comparado con el examen de antes del vuelo de esa misma persona |
| Hoy la lectura depende de Tierra | En la estación, un tripulante examina a otro guiado desde Tierra; las imágenes bajan, las analizan especialistas y el informe va al médico de la tripulación. No encontramos qué ve el astronauta de sus propios resultados |
| Más lejos no va a alcanzar | La demora de las comunicaciones es de segundos hacia la Luna y de 10 a 40 minutos hacia Marte. Una presentación de la NASA dice que eso "va a exigir más autonomía de la tripulación" |
| Hay cosas que no se pueden saber en misión | La presión dentro del cráneo nunca se midió en vuelo, y el cerebro se estudia con resonancia solo antes y después. La relación entre lo que se ve en el ojo y lo que pasa en el cerebro es débil y contradictoria |
| No hay tratamiento probado en vuelo | Lo que se hace es controlar más seguido, usar anteojos de otra graduación y avisar al médico |

## 3. Para quién es y cuándo se usa

- **Quién:** el astronauta examinado, solo. No necesita saber medicina.
- **Cuándo:** en cada control de ojos de la misión. El calendario de la NASA para una misión de 180 días es los días 30, 90 y 150; el producto agrega controles cuando aparece un indicio.
- **El médico en Tierra** recibe el mismo resultado como informe, lo confirma y decide. El producto nunca lo reemplaza.

## 4. El recorrido de un control

| # | Paso | Qué pasa |
|---|---|---|
| 1 | Inicio | El astronauta elige su perfil y ve qué control le toca hoy y cómo viene su historia |
| 2 | Cuestionario de síntomas | Cambios en la visión y otros síntomas, con los temas que la NASA describe para su cuestionario. El dolor de cabeza se registra sin afirmar que tenga relación con el ojo |
| 3 | Agudeza visual de cerca | A 40 cm, con una figura en forma de C en ocho posiciones, después de calibrar el tamaño real de la pantalla con una tarjeta |
| 4 | Grilla de Amsler | Una cuadrícula con un punto central; el astronauta marca dónde ve las líneas onduladas, borrosas o faltantes |
| 5 | Tomografía de cada ojo | El instrumento toma 48 cortes del nervio óptico. Si la imagen no alcanza, el sistema pide repetirla, hasta tres veces; si sigue sin alcanzar, dice "no puedo medir este ojo hoy" |
| 6 | Resultado | Por cada ojo: si cambió, cuánto, qué tan seguro y qué hacer |
| 7 | Historia | La evolución de cada ojo a lo largo de la misión |
| 8 | Conferencia médica | El informe para el médico y las preguntas que el astronauta quiere hacerle |

Los pasos 2 a 4 los hace la persona de verdad, frente a la pantalla. Durante el paso 5 se ve trabajar al análisis sobre la imagen: qué marcó, dónde midió y con qué calidad.

## 5. Qué le responde al astronauta

Cuatro cosas, siempre en este orden: **si cambió, cuánto, qué tan seguro y qué hacer.**

Ejemplo de un resultado (los valores son ilustrativos):

> **Ojo derecho: primer indicio.** La retina junto al nervio óptico de tu ojo derecho está 24 micrómetros más gruesa que antes del vuelo (rango de 16 a 32). Supera el umbral de primer indicio de la NASA, de 19,4 micrómetros. Es probable (86 %) que el cambio sea real. Esto no es un diagnóstico: en la mayoría de los casos no da síntomas, y tu médico en Tierra lo confirma.
>
> **Qué hacer ahora:** repetir la tomografía en 4 semanas y hacer la grilla de Amsler dos veces por semana. Va en el informe de rutina. *La NASA no publica cada cuánto repetir el examen después de un primer indicio: este intervalo es una regla de esta herramienta, basada en el único caso publicado.*

## 6. Niveles y qué se hace en cada uno

| Nivel | Cuándo | Aviso | Qué hacer |
|---|---|---|---|
| Sin cambio detectable | Aumento de hasta 19,4 micrómetros y sin pliegues nuevos | Ninguno | Seguir el calendario normal |
| Primer indicio | Aumento mayor a 19,4 micrómetros, o pliegues nuevos | Aviso (azul) | Tomografía a las 4 semanas y grilla de Amsler dos veces por semana; va en el informe de rutina |
| Clínicamente preocupante | Aumento de 55 micrómetros o más | Precaución (amarillo) | Avisar al médico sin esperar el informe de rutina; tomografía a las 3 semanas y grilla tres veces por semana |
| Síntoma agudo de visión | Pérdida brusca de visión, mancha nueva o grilla muy deformada | Advertencia (rojo) | Contactar al médico ya, diga lo que diga la imagen |

- **Los niveles y los umbrales son de la NASA.** Cada cuánto repetir los controles y qué clase de aviso lleva cada nivel son reglas nuestras, y el producto lo dice cada vez.
- Si un ojo no se pudo medir, no recibe nivel: se repite la tomografía dentro de la semana y queda anotado en el informe.
- Nunca indica medicación.

## 7. Cómo comunica

1. **El número siempre**, con su unidad y su rango. La palabra de probabilidad va pegada al número: improbable (menos de 10 %), posible (10 a 50 %), probable (50 a 90 %) y muy probable (90 % o más).
2. **Una línea numérica**, no una tabla: muestra dónde cae el valor respecto de los dos umbrales.
3. **La comparación es con uno mismo:** el examen de antes del vuelo, no un valor de la población.
4. **Color, forma y palabra juntos** en cada nivel, con letra grande y contraste alto. El síndrome empeora la visión de cerca, así que nada depende solo del color ni de letra chica.
5. **Cada dato dice cómo se obtuvo:** medido, calculado, estimado, informado por la persona, valor de referencia o no se puede medir a bordo.
6. **Los límites a la vista:** qué no mide, que no es un diagnóstico y que el médico confirma.
7. **El mismo resultado da siempre el mismo texto.** Los textos de un resultado salen de reglas escritas y revisadas, no de un modelo de lenguaje.

## 8. Qué es real y qué es ficticio

| Ficticio, y declarado en cada pantalla | Real |
|---|---|
| Los cuatro tripulantes y sus historias | Las tres pruebas de visión: las hace la persona y se puntúan de verdad |
| El instrumento: es un programa que imita al tomógrafo de retina que la NASA usa en la estación (Heidelberg Spectralis OCT2) | El análisis de la imagen: control de calidad, marcado de los bordes de la retina, medición con las definiciones de la NASA y comparación con antes del vuelo |
| Las imágenes: las dibuja ese programa a partir de un ojo descrito con medidas de astronautas publicadas, y las guarda en el formato de archivo del equipo real | El cálculo de la incertidumbre, los niveles, los próximos pasos, los textos y el informe |

El análisis no conoce el valor verdadero de cada ojo ficticio; nosotros sí, y con eso se mide cuánto se equivoca. Ese error medido es el rango que ve el astronauta. Es precisión sobre datos ficticios: **el producto no está validado con personas y no es un dispositivo médico.**

## 9. La tripulación ficticia

Misión de 180 días. Nombres inventados.

| Tripulante | Qué le pasa | En qué se basa |
|---|---|---|
| Kofi Mensah, 43, ingeniero de vuelo | Sin cambio detectable en toda la misión | El 26 % de un grupo de 31 astronautas que no pasó el umbral |
| Elena Voss, 47, comandante | Primer indicio típico: cruza el umbral cerca del día 90 | La curva promedio de 11 astronautas (27,6 micrómetros de aumento el día 150) |
| Ravi Anand, 51, ingeniero de vuelo | Nivel clínico en un ojo y bastante menos en el otro, con pliegues en los dos | Casos del grupo de 31: la diferencia entre ojos llega a 47 micrómetros, y los pliegues aparecen siempre en los dos |
| Lucía Ferreyra, 39, especialista de misión | Caso extremo, sin síntomas: más de 200 micrómetros de aumento | La forma de la curva del caso publicado en 2024. Los valores son parecidos, no copiados |

La aplicación se abre en el día 150 de vuelo y permite ir a los días 30 y 90, para ver cómo cambia cada historia.

## 10. Qué no hace

- No diagnostica ni dice si un resultado "es grave" o "está bien".
- No indica ni cambia medicación.
- No mide la presión dentro del cráneo ni saca conclusiones sobre el cerebro a partir del ojo. Tiene una pantalla que dice qué se sabe, qué solo se ve con resonancia antes y después del vuelo y qué no se puede saber en misión.
- No mide el grosor de la coroides (la capa de vasos debajo de la retina), el centro de la retina, el aplanamiento del ojo ni la graduación.
- No reemplaza al especialista: adelanta una primera lectura.

## 11. El asistente

Es opcional: un panel para hacer preguntas, que responde con un modelo de lenguaje (Claude Haiku 5.5).

| Hace | No hace |
|---|---|
| Explica el resultado y los términos | Diagnosticar o discutir el nivel que calculó el análisis |
| Responde sobre el síndrome con una base fija de afirmaciones, cada una con su fuente | Recomendar medicación o tratamientos |
| Ayuda a armar preguntas para el médico | Responder cualquier cosa ajena, como escribir código: ahí da una negativa fija |

- **Privacidad:** es lo único que sale del dispositivo. Al preguntar se envían la pregunta y un resumen numérico del resultado, sin nombre, y se avisa antes del primer uso. El resto de la aplicación no envía nada.
- **Sin conexión**, el control funciona igual; solo falta el asistente.

## 12. En qué se apoya

**De la NASA y de artículos con datos de astronautas:** qué se mide y cómo (el grosor de la retina en un anillo pegado al nervio óptico), los dos umbrales, los cuatro niveles, el calendario de controles, el aparato y su formato de archivo, las medidas de los ojos antes del vuelo y las curvas de evolución. Las fuentes principales son el informe de evidencia sobre el síndrome (2022), el informe técnico médico de la NASA (2024) y seis artículos con datos de entre 2 y 36 astronautas. Cada número del producto lleva su fuente; el detalle está en [investigaciones/](investigaciones/).

**Supuestos nuestros, declarados en el producto:**

1. Cada cuánto repetir los controles en cada nivel.
2. Qué clase de aviso lleva cada nivel.
3. La escala de palabras para la probabilidad.
4. Que el marcado de los bordes sea automático: la NASA lo corrige a mano.
5. Desde cuánto un cambio de agudeza de cerca se toma como real.
6. La redacción del cuestionario: el de la NASA no es público, solo sus temas.
7. Los cuatro tripulantes y la forma exacta de sus curvas.
8. El ruido y las fallas de las imágenes ficticias.
9. Tres intentos de captura antes de decir "no puedo medir".

## 13. Cómo responde al desafío

| El desafío pide | Dónde está en el producto |
|---|---|
| Un programa visual | La línea numérica de cada resultado, el gráfico de evolución y la imagen del ojo con lo que midió el análisis |
| Reunir indicadores de salud, entre ellos imágenes | Tomografía de retina, agudeza visual, grilla de Amsler y síntomas, incluido el dolor de cabeza |
| Que el astronauta pueda evaluarse solo | La sesión guiada, que no supone conocimientos médicos |
| Explicar qué significa cada indicador | El resultado en palabras simples, la etiqueta de cómo se obtuvo cada dato, el glosario y el asistente |
| Orientar sobre qué hacer | Los próximos pasos de cada nivel y el informe para el médico |

Elegimos un solo problema y lo llevamos hasta el final, en lugar de un panel con muchos indicadores sin lógica detrás.

## 14. Estado actual

Al domingo 15 de noviembre, 06:10:

| Parte | Estado |
|---|---|
| Investigación (ocho documentos) | Terminada |
| Arquitectura y cinco especificaciones | Terminadas |
| Estructura del proyecto y piezas comunes de la interfaz | Terminadas |
| Formato de archivo del tomógrafo y ojo virtual con la tripulación | Hechos, con pruebas |
| Instrumento virtual y análisis de la imagen | En construcción |
| Reglas, niveles, próximos pasos y textos | En construcción |
| Aplicación: inicio, sesión guiada, resultado, historia e informe | En construcción |
| Pruebas de visión | En construcción |
| Base de conocimiento y asistente | En construcción |
| Pantalla de captura de la tomografía | Falta; espera al instrumento virtual |
| Medición del error del análisis | Falta; espera al análisis |
| Documentación en inglés y español, publicación, diapositivas y formulario | Falta |

**Falta decidir o hacer por parte del equipo:** crear el equipo en la web de Space Apps, crear el repositorio y el proyecto en Vercel, cargar la clave del asistente con su tope de gasto, y confirmar el nombre.

## 15. Glosario

| Término | Qué es |
|---|---|
| Síndrome neuro-ocular del vuelo espacial (SANS) | Los cambios en el ojo que aparecen en vuelos largos |
| Tomografía de retina (OCT) | Una imagen en corte del fondo del ojo, hecha con luz |
| Nervio óptico | El cable que lleva la imagen del ojo al cerebro. El examen mira el lugar donde entra al ojo |
| Retina | La capa del fondo del ojo que recibe la luz |
| Micrómetro (µm) | La milésima parte de un milímetro |
| Examen de antes del vuelo | El examen de cada astronauta en Tierra, contra el que se compara todo lo demás |
| Umbral | El valor a partir del cual un cambio cuenta como hallazgo |
| Rango | Entre qué valores está el resultado, dado el error de la medición |
| Pliegues | Ondulaciones del fondo del ojo |
| Grilla de Amsler | Cuadrícula para detectar zonas donde la visión se deforma |
| Agudeza visual | Qué tan chico es el detalle que se llega a distinguir |
| Médico de la tripulación | El médico en Tierra asignado a cada tripulación |
| Día de vuelo | Los días contados desde el lanzamiento |
