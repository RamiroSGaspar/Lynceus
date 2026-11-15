# Íconos

Íconos de línea fina, uno por grupo de lecturas o por acción. Acompañan a una palabra; nunca la reemplazan.

```html
<svg class="co-ic" aria-hidden="true"><use href="#i-scan-eye"/></svg>
```

- 51 íconos son de Lucide v1.68.0 (licencia ISC), copiados como archivos a `assets/iconos/`: no se suma ninguna dependencia. Cuatro son propios, con la misma grilla: `anillo`, `corte`, `ojo-derecho` y `ojo-izquierdo`.
- Grilla de 24 px, extremos redondos, sin relleno. **En pantalla el trazo es de 1,5 px** (lo fija `.co-ic`); los archivos de Lucide traen 2.
- Toman `currentColor`. Nunca llevan color de nivel: las formas de nivel son otras (ver Nivel).
- Tamaño: 1,25 em junto a texto; 22 px en cabeza de grupo; 20 px dentro de un disco de acción.
- Un ícono solo, sin palabra al lado, lleva su nombre en texto oculto o en `aria-label`. Con palabra al lado, `aria-hidden`.
- En la aplicación es un componente de íconos que devuelve el SVG; `sprite.js` existe sólo para que estas vistas previas se abran con doble clic.

Los valores de los ejemplos son datos simulados: tripulante ficticio C, día de vuelo 118.
