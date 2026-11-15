# Entrega y pitch: qué se presenta y cómo

> **Estado:** guion de trabajo actualizado el 15 de noviembre de 2026. El repositorio
> y la demo ya están publicados; faltan las diapositivas finales y el formulario.
> Para cifras y límites, usar [evidencia](../docs/es/evidence.md) y
> [supuestos](../docs/assumptions.md).

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — entrega hasta el domingo 15 de noviembre, 23:59 hora del evento local |
| **Para qué es** | Explicar qué pide la entrega, cómo es la demo, si hay que hablar, cómo se evalúa, y proponer el guion de las 7 diapositivas. |
| **Fuente** | Guías oficiales de Space Apps 2026 (*Project Submission Guide* y *Judging & Awards Guide*), leídas el 14 de noviembre. Lo que es propuesta nuestra está marcado como **propuesta**. |

---

## 1. Qué se carga en la página del proyecto

Todo va en la pestaña **Project** del equipo, **en inglés**. La guía dice que la mayor parte de la evaluación se basa en esta página; la demo suma sobre todo en el criterio de presentación.

| Campo | Qué pide |
|---|---|
| Project Name | Nombre del proyecto |
| High-Level Project Summary | Qué desarrollaron, cómo responde al desafío y por qué importa |
| Link to Project Demo | **Una** demo: diapositivas o video (ver sección 2) |
| Link to Final Project | Link público al proyecto: sitio, repositorio u otro. Sin contraseña ni registro |
| Detailed Project Description | Qué hace, cómo funciona, qué beneficios tiene, qué herramientas y lenguajes se usaron |
| Use of Super Intelligence (SI) | Si se usó IA y cómo. La guía dice que esta respuesta no la ven los jueces |
| NASA Data | Qué datos y recursos de la NASA se usaron (mínimo uno para premios globales) |
| Space Agency Partner Data and Other References | Todo lo demás que se usó: código, textos, imágenes, herramientas |

Para enviar hay que tildar dos casillas: que se leyeron los requisitos, y que el trabajo es original del equipo con todo lo externo listado en las referencias.

## 2. La demo: una sola, a elección

| | Diapositivas | Video |
|---|---|---|
| Límite | **7 diapositivas**, contando la de título y la de introducción | **30 segundos** |
| Idioma | Inglés obligatorio | Se puede hablar en otro idioma, con subtítulos en inglés |
| Dónde se sube | En un sitio externo (Google Drive, GitHub, YouTube, etc.), con link público sin contraseña ni registro. No se sube al sitio de Space Apps | Igual |
| Si se pasa del límite | El proyecto **no es elegible** para la evaluación global | Igual |

**Decisión del equipo:** diapositivas.

Contenido que la guía pide para las diapositivas:

- nombre del equipo, nombres de los integrantes y desafío elegido;
- una imagen del proyecto;
- la experiencia del usuario;
- cómo los datos y la tecnología de la NASA hacen posible la solución;
- letra legible, pocas palabras y buenas imágenes.

## 3. ¿Hay que hablar?

- **Con diapositivas, no.** No hay exposición en vivo en la evaluación global: los jueces leen la página del proyecto y abren la demo por su cuenta. Las diapositivas tienen que entenderse solas.
- **Con video, sí se puede** (en 30 segundos), con subtítulos en inglés si no se habla en inglés.
- **El evento local puede tener reglas propias**, por ejemplo una presentación en vivo o un horario distinto para la evaluación local. La guía pide consultarlo con el organizador del evento (*Local Lead*). **Pendiente de averiguar.**

## 4. Cómo se evalúa

Cinco criterios, de 1 a 5 cada uno, en todas las etapas:

| Criterio | Qué mira | Cómo lo cubre este proyecto (**propuesta**) |
|---|---|---|
| Impact | Qué problema ataca y a cuántos ayuda | En las fuentes revisadas, cerca del 70 % de tripulantes de vuelos largos presenta algún signo de SANS; pueden aparecer cambios sin síntomas notorios |
| Creativity | Originalidad | Comparar medidas inspiradas en métodos publicados con la referencia del astronauta y explicar el resultado y su incertidumbre provisoria |
| Validity | Base científica y factibilidad; usabilidad | Definiciones y umbrales de la NASA; motor probado contra datos de valor conocido |
| Relevance | Responde al desafío y usa datos de la NASA como parte central | Usa umbrales y calendario publicados por NASA; las adaptaciones de pruebas y seguimiento se identifican como supuestos |
| Presentation | Claridad de la historia; evalúa la demo y la página completa | Diapositivas más aplicación funcionando |

Etapas y fechas:

1. **Evaluación local.** Los jueces del evento local eligen los proyectos que pasan (*Global Nominees*). Se anuncian el 3 de diciembre de 2026. El evento local puede dar premios propios.
2. **Evaluación global.** Salen los finalistas y las menciones honoríficas, el 17 de diciembre de 2026.
3. **Evaluación ejecutiva.** Directivos de la NASA y agencias socias eligen los ganadores de diez premios: Best Use of Science, Best Use of Data, Best Use of Technology, Galactic Impact, Best Mission Concept, Most Inspirational, Best Storytelling, Global Connection, Art & Technology y Local Impact.

## 5. Guion de las 7 diapositivas (**propuesta**)

| # | Diapositiva | Contenido |
|---|---|---|
| 1 | Título | Nombre del proyecto y frase. Nombre del equipo, integrantes y desafío |
| 2 | El problema | En vuelos largos pueden aparecer cambios oculares sin síntomas notorios. La interpretación depende de especialistas y las misiones lejanas necesitan más autonomía para una primera lectura |
| 3 | Qué es | La promesa en una frase y una captura del resultado que ve el astronauta |
| 4 | Cómo funciona | El proceso completo en un diagrama: captura, control de calidad, marcado de capas, medición, comparación con la imagen de antes del vuelo, incertidumbre, nivel y próximo paso |
| 5 | La experiencia | Capturas de la sesión guiada: captura, pruebas de visión, resultado e informe para el médico |
| 6 | Ciencia y datos de la NASA | Qué definiciones, umbrales y calendario de la NASA se usan; cuánto se equivoca el motor; qué no se puede saber; los datos son simulados |
| 7 | Lo que sigue | Por qué importa para la Luna y Marte, y los links a la aplicación y al repositorio |

## 6. Lista de control de la entrega

- [ ] Equipo creado en la web, con todos los integrantes en el mismo evento local.
- [ ] Averiguar con el organizador local si hay presentación en vivo u horarios propios.
- [ ] Nombre del proyecto definido.
- [x] [Aplicación publicada](https://lynceus-sans.vercel.app) y comprobada sin iniciar sesión.
- [x] [Repositorio público](https://github.com/RamiroSGaspar/Lynceus).
- [ ] Diapositivas en inglés, 7 como máximo, con link público probado.
- [ ] Textos del formulario en inglés.
- [ ] Lista de datos y recursos de la NASA.
- [ ] Referencias de todo lo externo.
- [ ] Botón **Submit for Judging** antes del domingo 15 de noviembre a las 23:59.
