# Velo y grupo

Cómo se arma un velo lateral: arriba de quién se trata, después grupos con un ícono y un título, y adentro lecturas. Sin cajas dentro del velo.

```html
<aside class="co-velo co-velo--izq">
  <div class="co-sujeto">
    <p class="co-sujeto__nombre">Ravi Anand</p>
    <p class="co-sujeto__rol">Flight engineer</p>
    <p class="co-sujeto__estado">… Control that comes with the application.</p>
  </div>
  <div class="co-grupo">
    <h2 class="co-grupo__cabeza"><svg class="co-ic">…</svg> Today’s scan</h2>
    <div class="co-lecturas">…lecturas…</div>
    <p class="co-grupo__fuente">Limit for an off-centre scan: 438 µm.</p>
  </div>
</aside>
```

- Ancho `panel-width` (21 rem), relleno `space-6`. Pegado al borde de la pantalla, de arriba abajo.
- **Arriba, el sujeto:** el nombre en 28 px, el rol, y una línea de estado (de dónde sale lo que se muestra).
- **Un grupo responde una sola pregunta**, y su cabeza es esa pregunta o su tema en dos o tres palabras, con un ícono. Entre grupos, aire (`space-6`); sin líneas.
- No más de tres o cuatro grupos por velo ni de cuatro lecturas por grupo. Si no entra, sobra: va al detalle, más abajo.
- En un velo, el texto corrido no pasa de tres líneas por ítem.
- La nota de fuente (`co-grupo__fuente`) cierra el grupo: de dónde sale un umbral, qué es provisorio.
- Por debajo de 1280 px el velo deja de ser lateral: sus grupos pasan a la columna, en orden de lectura.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
