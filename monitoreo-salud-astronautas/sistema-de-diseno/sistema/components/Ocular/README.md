# Ocular

El ojo como un disco de luz en el campo: la imagen de donde sale cada número, con lo que el motor midió dibujado encima, el anillo de su nivel alrededor y una guía que une la franja medida con su cifra. Es el protagonista de la pantalla de resultado.

```html
<figure class="co-ocular co-ocular--caution is-elegido">
  <div class="co-ocular__cabeza co-halo">ojo · nivel · otro hallazgo de ese ojo</div>
  <div class="co-ocular__campo">
    <button type="button" class="co-ocular__lente" aria-pressed="true" aria-label="Right eye: …">
      <img class="co-ocular__imagen" src="…" alt="">
      <svg class="co-ocular__marcas" viewBox="0 0 100 100" aria-hidden="true">
        <ellipse class="co-zona" … />                        <!-- la franja que se mide, en el color del nivel -->
        <ellipse class="co-trazo" … />                       <!-- la abertura del nervio -->
        <ellipse class="co-trazo co-trazo--trazos" … />      <!-- el anillo de 250 µm -->
        <ellipse class="co-trazo co-trazo--puntos" … />      <!-- 500, 1000 y 1500 µm -->
      </svg>
      <span class="co-sello">Simulated</span>
    </button>
    <span class="co-ocular__anillo"></span>                  <!-- la órbita del nivel -->
    <svg class="co-ocular__guia" viewBox="0 0 100 100">…</svg>   <!-- de la franja a la cifra -->
  </div>
  <figcaption class="co-ocular__pie co-halo">lectura héroe</figcaption>
</figure>
```

| Estado | Clase | Cómo se ve y cuándo va |
|---|---|---|
| Nivel | `co-ocular--none|advisory|caution|warning` | El anillo y su resplandor toman el color del nivel; la franja medida, también |
| Elegido | `is-elegido` | Cuatro esquinas alrededor del disco. El velo de la derecha muestra ese ojo |
| No se pudo medir | `co-ocular--unmeasured` | Sin imagen ni anillo: disco de trazos gris y la razón en palabras |

- **Ojo derecho a la izquierda**, como en los informes clínicos y en el orden que ya usa la aplicación.
- Arriba, a cuál ojo, su nivel y, si lo hay, otro hallazgo de ese ojo (`co-ocular__hallazgo`: pliegues nuevos). En el medio, la imagen. Abajo, la cifra. **La guía sale del punto más bajo de la franja de 0 a 250 µm y baja hasta la cifra**: el número queda atado al lugar donde se midió.
- La imagen no se toca: sin filtros, sin contraste agregado, sin color. Sólo el recorte circular y un borde fino.
- **El círculo contiene entero el patrón de cortes** (los 48 radios) y el anillo de 1500 µm. La imagen cuadrada completa está en el visor, y se dice al pie.
- El anillo es una órbita de 1,5 px separada del disco, con un resplandor corto. Es el único lugar, con la franja medida, donde un color de nivel sale de su forma.
- Lo que el motor marcó va en blanco con un contorno oscuro debajo, y se distingue por tipo de trazo: continuo (la abertura), de trazos (el límite de 250 µm, que cierra la franja medida), de puntos (los límites de 500, 1000 y 1500 µm). La leyenda muestra la franja como lo que es: una banda entre la línea continua y la de trazos.
- El sello «Simulated» va dentro del disco, arriba, siempre: tiene que salir en cualquier captura de pantalla.
- Las elipses de esta vista previa aproximan los anillos; en la aplicación se dibujan con la geometría del motor.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
