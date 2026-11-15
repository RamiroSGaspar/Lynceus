# Tripulante

Un tripulante en Inicio: quién es, cómo están sus dos ojos según su último control y qué le toca hoy. Una columna con una línea arriba, no una tarjeta.

```html
<article class="co-tripulante">
  <div class="co-sujeto"><h3 class="co-sujeto__nombre">Ravi Anand</h3><p class="co-sujeto__rol">Flight engineer</p></div>
  <div class="co-tripulante__estado">
    <span class="co-par" …>…</span>
    <span class="co-nivel co-nivel--caution">…</span>
    <p class="co-rotulo">Last control · FD139</p>
  </div>
  <div class="co-lectura co-lectura--palabras">… Not started · Today’s control</div>
  <a class="co-boton co-boton--principal" href="…">Start today’s control</a>
</article>
```

- Los dos ojos se ven sin leer (Par de ojos), y al lado el nivel del control con su forma y su palabra.
- Un solo botón principal por tripulante: empezar, retomar o ver el resultado, según el estado.
- Las cuatro columnas van en una fila en pantalla ancha, dos por fila en tableta y una en teléfono. Las separa el aire; arriba de cada una, una línea.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
