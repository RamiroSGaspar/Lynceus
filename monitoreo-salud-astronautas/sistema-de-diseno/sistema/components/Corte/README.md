# Corte

Un corte de la tomografía con los bordes que marcó el motor. Es la segunda evidencia: de acá sale el grosor.

```html
<figure class="co-corte">
  <div class="co-corte__marco co-marco">
    <img class="co-corte__imagen" src="…" width="768" height="496" alt="…">
    <svg class="co-corte__marcas" viewBox="0 0 768 496" preserveAspectRatio="none" aria-hidden="true">
      <path class="co-trazo" d="…"/>                    <!-- superficie de la retina -->
      <path class="co-trazo co-trazo--trazos" d="…"/>   <!-- membrana de base -->
      <circle class="co-punto" … />                     <!-- borde de la abertura -->
    </svg>
  </div>
  <ul class="co-leyenda">…</ul>
</figure>
```

- Mismas reglas que el ocular: imagen sin tocar, marcas blancas con contorno oscuro, cada borde con su tipo de trazo.
- Sin borde: cuatro esquinas (`co-marco`), como el visor de un instrumento.
- Cada marca que se dibuja tiene su entrada en la leyenda, con una muestra del trazo. Las capas se pueden apagar de a una.
- Proporción fija de 768 × 496: nunca se estira.
- En el velo de la derecha va un solo corte, chico, con la acción que abre el visor. En el visor va grande, con el control para recorrer los 48.
- El archivo de imagen trae grabada la marca «SIMULATED DATA» abajo a la izquierda: no se recorta.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
