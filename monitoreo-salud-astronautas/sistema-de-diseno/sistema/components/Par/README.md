# Par de ojos

El estado de los dos ojos de una persona, de un vistazo: dos discos chicos, cada uno con el anillo de su nivel. Es el ocular vuelto signo.

```html
<span class="co-par" role="img" aria-label="Right eye: Clinically concerning. Left eye: First sign.">
  <span class="co-par__ojo co-par__ojo--caution"><span class="co-par__disco"></span>OD</span>
  <span class="co-par__ojo co-par__ojo--advisory"><span class="co-par__disco"></span>OS</span>
</span>
```

- Va donde hay varias personas o varios controles y no entra una imagen: tripulación en Inicio, tabla de controles.
- Derecho a la izquierda, con sus siglas debajo.
- Nunca solo: al lado va el Nivel con su forma y su palabra. El par muestra que un ojo puede estar peor que el otro; el nivel dice cuál es el del control.
- El `aria-label` nombra los dos niveles.
- Sin medir: disco de trazos, vacío.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
