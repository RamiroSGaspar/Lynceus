# Franja superior

Arriba, sin barra: la marca a la izquierda, cuándo y con qué datos al centro, el idioma a la derecha. Igual en todas las pantallas.

```html
<header class="co-hud">
  <a class="co-marca" href="/">…</a>
  <div class="co-hud__centro">
    <span class="co-hud__fecha">… Sep 14, 2026</span>
    <span class="co-ficha">FD118</span>
    <span class="co-ficha co-ficha--simulado">… Simulated data</span>
  </div>
  <div class="co-hud__lado"><div class="co-segmento" role="group" aria-label="Language">…</div></div>
</header>
```

- No es una barra: son tres grupos sueltos, fijos arriba, sobre un degradado negro. Lo que se desplaza por debajo se pierde en negro.
- **La ficha de datos simulados vive acá y no se va nunca.** Reemplaza a la franja fija de hoy.
- De quién es la pantalla no va acá: va en el velo de la izquierda (ver Velo y grupo).
- Sin navegación: la navegación va abajo. La marca lleva al inicio.
- Por debajo de 768 px quedan el isotipo, las dos fichas y el idioma.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
