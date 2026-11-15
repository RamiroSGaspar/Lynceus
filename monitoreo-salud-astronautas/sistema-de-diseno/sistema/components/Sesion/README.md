# Pasos de la sesión

En qué paso del control de hoy está la persona, y cuántos faltan: una lista de verificación sobre una línea.

```html
<ol class="co-sesion" aria-label="Steps of today’s control">
  <li class="co-sesion__paso is-hecho"><span class="co-sesion__nodo"></span>Symptoms</li>
  <li class="co-sesion__paso" aria-current="step"><span class="co-sesion__nodo"></span>Left eye scan</li>
  <li class="co-sesion__paso"><span class="co-sesion__nodo"></span>Evaluation</li>
</ol>
```

- Siete pasos, los que ya tiene la sesión. Hecho: disco lleno y texto en blanco. Actual: disco con anillo y negrita. Lo que falta: disco hueco y texto gris.
- Va en el velo de la izquierda, debajo del sujeto. No es navegación: no se toca.
- Un solo paso lleva `aria-current="step"`. Cuando dos etapas corren a la vez (en el avance del análisis: tomar cortes y marcar bordes), las dos llevan `is-en-curso`, con el mismo dibujo, y su estado en texto oculto.
- Por debajo de 1280 px la lista se oculta y queda la línea del sujeto, «Step 6 of 7: Left eye scan». El mismo dibujo sirve para el avance del análisis.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
