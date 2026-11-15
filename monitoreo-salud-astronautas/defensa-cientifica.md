# Cómo defender el proyecto científicamente

**Lectura breve para presentar. Todos los exámenes y tripulantes de la demo son
simulados. El prototipo no está validado con personas.**

## La idea que tenés que poder explicar

> «Durante un vuelo largo pueden aparecer cambios oculares sin síntomas claros.
> Usamos mediciones publicadas para comparar cada ojo con su propio examen anterior
> al vuelo. La herramienta organiza una primera lectura y prepara el seguimiento
> con el médico».

## En qué nos apoyamos

Elegimos dos medidas relacionadas con SANS:

- **Grosor retinal cerca del nervio:** cuánto aumentó respecto de la referencia.
  Usamos **> 19,4 µm** como primer indicio y **≥ 55 µm** como cambio clínicamente
  preocupante. NASA presenta el primero redondeado como ≥ 20 µm.
- **Rugosidad de la membrana de Bruch:** cuánto aumentó su ondulación.
  Un cambio **> 2,8 µm** se usa como indicador de pliegues nuevos.

Compararse con uno mismo ayuda a separar un cambio de las diferencias naturales
entre ojos y personas. Las fuentes respaldan las medidas y los criterios; no
certifican nuestro programa.

## Qué comprobamos nosotros

Generamos imágenes con valores conocidos y comparamos lo que mide el algoritmo
con esos valores. Evaluamos **621 capturas de ocho ojos virtuales de cuatro
personajes**, incluidas las referencias.

Esto permite encontrar errores del motor. No equivale a estudiar 621 astronautas.
Además, el simulador y el motor comparten simplificaciones, así que el resultado
puede ser más favorable que con imágenes reales.

El modelo ajustado para estimar el error no cumplió todos los criterios.
Por ejemplo, en una prueba el error máximo de grosor fue **8,94 µm**, frente a
nuestra tolerancia de ingeniería de **6 µm**. Por eso sigue activo el margen
**provisorio**, identificado en pantalla.

## Dónde termina nuestra evidencia

Los controles adicionales son supuestos del proyecto inspirados en publicaciones.
El rango no tiene precisión clínica demostrada. La probabilidad de superar un
umbral no es la probabilidad de tener SANS.

No inferimos presión intracraneal ni diagnosticamos. El próximo paso científico
es evaluar imágenes reales independientes, revisadas por expertos, y calibrar
el error antes de proponer uso clínico.

## Si te preguntan «¿entonces qué aportan?»

> «Unimos medición, comparación personal, incertidumbre e informe en un recorrido
> que se puede inspeccionar. Demostramos ese flujo con simulación y publicamos
> los errores encontrados. El aporte actual es un prototipo trazable para estudiar
> una primera lectura a bordo».

**Para respaldarlo:** [NASA, criterios SANS](https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf),
[Laurie 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC6990717/),
[Ferguson 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC9857718/),
[nuestra evidencia](../docs/es/evidence.md) y [supuestos](../docs/assumptions.md).
