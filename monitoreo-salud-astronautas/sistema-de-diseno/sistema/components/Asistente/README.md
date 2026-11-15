# Hoja del asistente

El asistente, como un velo que entra desde la derecha: la pregunta, la respuesta con sus fuentes y el aviso de qué sale del dispositivo. Sin globos.

```html
<aside class="co-hoja co-velo co-velo--der" aria-label="Assistant">
  <p class="co-mensaje co-mensaje--propio">What does “first sign” mean?</p>
  <div class="co-mensaje">…<p class="co-mensaje__fuentes">Sources: …</p></div>
  <input class="co-entrada" type="text" maxlength="500">
</aside>
```

- Se abre desde la navegación y entra desde la derecha en `duration-normal`; en teléfono ocupa la pantalla.
- La pregunta va a la derecha, en gris claro; la respuesta, a la izquierda, en blanco, con una línea al costado. Sin globos ni fondos.
- La respuesta siempre termina con sus fuentes.
- El aviso de qué se envía queda a la vista debajo del renglón, no sólo la primera vez.
- Mientras responde, la marca en `is-barriendo`, chica, en el lugar de la respuesta. Sin puntos que saltan.
- La negativa fija y el estado sin conexión usan el Aviso neutro, dentro de la hoja.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
