# Lynceus · Campo oscuro: sistema de diseño y vistas

v2.0, 15/11/2026. Identidad visual y sistema de diseño de Lynceus: negro puro, blanco puro, campo de estrellas y lecturas de instrumento. Reemplaza a la v1 («Ocular»), que se descartó. Es una propuesta para aplicar: **la aplicación no se tocó**.

## Qué hay

```
sistema-de-diseno/
├─ LEEME.md
├─ sistema/                     el sistema de diseño
│  ├─ muestrario.html           abrilo en el navegador: la portada y los 29 componentes, dibujados
│  ├─ README.md                 el libro de marca: la idea, las reglas y la anatomía de cada pantalla
│  ├─ tokens.json               las variables, con su uso y cada contraste medido: la fuente de verdad
│  ├─ tokens.css                las mismas variables en CSS
│  ├─ components/bundle.css     los componentes en CSS (Ocular, Lectura, Nivel, Velo…)
│  ├─ components/<Comp>/        guía (README.md) y vista previa (preview.html) de cada uno
│  ├─ fonts/                    Atkinson Hyperlegible Next, peso variable
│  └─ assets/
│     ├─ campo/                 el campo de estrellas: dos teselas SVG, generadas con semilla
│     ├─ marca/                 isotipo, isotipo chico y favicon, en SVG
│     ├─ iconos/                55 íconos en SVG, signos de origen y formas de nivel
│     ├─ img/                   cuatro imágenes simuladas, hechas con el instrumento virtual del proyecto
│     └─ Licencias/             licencias de la fuente y de los íconos
└─ vistas/
   ├─ resultado.html            la pantalla de resultado completa: tocá un ojo y cambia el velo de la derecha
   ├─ inicio.html               inicio: marca, día de misión y tripulación
   ├─ captura.html              la tomografía en curso: los cortes se encienden sobre el ojo
   ├─ historia.html             el gráfico de historia y la tabla de controles
   └─ vistas.css                cómo se arma una pantalla: marco, cabina y secciones
```

## Por dónde empezar

1. Abrí `vistas/resultado.html` con doble clic, a pantalla completa. Es la pantalla que responde al desafío. Desde ahí, la navegación de abajo lleva a Captura e Historia, y la marca a Inicio.
2. Abrí `sistema/muestrario.html`: cada componente, con el enlace a su guía.
3. Leé `sistema/README.md`: las reglas del conjunto y la anatomía de las pantallas que no están dibujadas.

Todo funciona sin internet y sin servidor.

## Cómo usarlo en la aplicación

1. Los valores de `sistema/tokens.css` reemplazan a los de `apps/web/src/styles/tokens.css`. **Los nombres que ya existían se conservan** (`--color-bg`, `--level-caution`, `--text-md`…), así que lo que hoy los usa sigue andando; se suman los de velo, líneas, resplandor y medidas. Los colores de texto, superficie, nivel y serie van en hexadecimal de seis cifras, como los lee `guards.test.ts`; los velos y los resplandores, que llevan transparencia, van en `rgba` y sólo en ese archivo.
2. La fuente y las dos teselas del campo van servidas desde el propio sitio: `sistema/fonts/`, `sistema/assets/campo/` y las rutas de `tokens.css` y de `.co-campo`, ajustadas.
3. Cada componente se arma con el marcado de su guía y las clases de `components/bundle.css`. Las clases llevan el prefijo `co-`; se pueden copiar tal cual o usar como especificación para las clases que ya existen. Ni `bundle.css` ni `vistas.css` tienen un color escrito.
4. Los íconos son archivos SVG de `assets/iconos/`: en la aplicación van como un componente de íconos. `sprite.js` es sólo para que las vistas previas se abran solas.
5. La composición de cada pantalla está en `vistas/vistas.css` y en la sección «Anatomía por pantalla» del libro de marca.
6. Los pocos textos de interfaz que no existían están en la tabla «Textos nuevos» del libro de marca, en inglés y en español.

Nada de lo que el sistema necesita choca con la política de seguridad del sitio: fuentes e imágenes del propio sitio, y las posiciones de los gráficos como variables en el atributo `style`, que la política admite.

## Lo que las pruebas de la aplicación ya exigen

Las pruebas de pantalla (`apps/web/src/screens/*.test.tsx`) leen el HTML y el texto de cada pantalla. Al aplicar el sistema, esto se conserva:

- **La palabra del origen sigue en el texto.** El signo reemplaza a la etiqueta de color, y la palabra queda al lado como texto oculto (`co-oculto`): las pruebas buscan «476 µm Measured» y un lector de pantalla la lee.
- **Un solo `<h1>` por pantalla.** En Resultado es la oración de la respuesta; en las demás, el título.
- **Inicio: el día de misión es un grupo de tres opciones** (`type="radio"`), dibujado como la línea de la misión. La muestra lo dibuja con enlaces.
- **Historia: las dos casillas de «Eyes shown»** (`type="checkbox"`) siguen arriba del gráfico; la muestra no las dibuja. El gráfico sigue siendo el `<svg role="group">` de hoy, con su texto alternativo, y la tabla sigue debajo.
- **Resultado: la escala de cada ojo sigue siendo `<svg role="img" aria-label="…">`**, el dibujo que ya calcula `ChangeScale`; la muestra la arma con cajas.
- Varias pruebas buscan clases de hoy (`steps__item`, `sure`, `how__step`, `brain__column`, `statement`, `questions__suggested`, `screen__section no-print`). Se conservan esas clases y se les suman las nuevas, o se cambia la prueba junto con la clase; lo que la prueba comprueba no se afloja.

## Texto de arranque para quien lo aplique

```
Aplicá el sistema de diseño de monitoreo-salud-astronautas/sistema-de-diseno/ a apps/web.
Leé primero AGENTS.md, después sistema/README.md completo y la guía de cada componente que uses.
Abrí vistas/resultado.html, inicio.html, captura.html e historia.html a 1440×900, a 1280×720
y a 390 px de ancho: son el resultado esperado.

Lo que no cambia:
- packages/core no se toca. Los textos que ve el astronauta salen de ahí y de apps/web/src/i18n
  sin cambios: cambia cuándo aparece cada uno, no qué dice. Los textos nuevos son los de la
  tabla «Textos nuevos» del libro de marca y van al catálogo, en inglés y en español.
- Las rutas, el almacenamiento, el motor y el cálculo de los gráficos quedan como están.
- Las superficies de estímulo de las pruebas de visión (C de Landolt, grilla de Amsler)
  conservan su fondo, su contraste y su tamaño calibrado. En esas pantallas el campo de
  estrellas se apaga.
- El nombre del producto sale de packages/core/src/product.ts y de ningún otro lado: en las
  muestras está escrito a mano; en la aplicación, no.
- pnpm verify tiene que pasar al final, incluido guards.test.ts: ningún color fuera de
  tokens.css y los contrastes de la norma. Si una prueba busca una clase vieja se actualiza
  la prueba; lo que comprueba (un texto, un rol, un contraste) no se afloja.

Orden, para que la aplicación quede coherente en cada corte:
1. Variables, fuente y campo de estrellas.
2. Marco: franja superior, navegación y ficha de datos simulados.
3. Piezas compartidas: nivel, origen, lectura, botón y acción, grupo, aviso.
4. Resultado.  5. Inicio.  6. Sesión y captura.  7. Historia.
8. Informe, cerebro, cómo funciona y asistente.
Commit al cerrar cada punto.
```

## Ojo

- **Las cifras son blancas, no turquesa** como en la referencia. La norma de pantallas de la NASA reserva el cian para dato faltante o viejo; usarlo de adorno contradice la investigación del propio proyecto.
- **La cabina con velos a los lados empieza en 1280 px de ancho.** Por debajo va en una columna, en orden de lectura; por debajo de 640, un ojo por vez.
- El isotipo está **redibujado** a partir de la imagen de referencia: es geométrico y limpio, no un calco del trazo a mano. El nombre va compuesto en Atkinson Hyperlegible Next, así que no es idéntico al de la imagen.
- El campo de estrellas es decorativo: puntos generados con semilla, no un cielo real. Lo dice cada archivo en su primera línea.
- Las elipses de los anillos sobre el ocular son una aproximación para la muestra. En la aplicación se dibujan con la geometría que ya calcula el motor.
- El gráfico de historia de la muestra es un dibujo fijo; en la aplicación se calcula con el ancho de su caja, como hoy.
- Los textos de interfaz de las muestras van en inglés, como la entrega, y son los de la aplicación. Los datos que no salen del motor (el avance de la captura, el estado de cada tripulante en Inicio, la respuesta de ejemplo del asistente) son ilustrativos: ver «Datos de las muestras» en el libro de marca.
- Las vistas previas llevan estilos y programas en línea para abrirse con doble clic. La aplicación no los necesita ni los admite.
- Usa `backdrop-filter`, `:has()`, `mask` y `subgrid`: navegadores actuales. Sin desenfoque el velo funciona igual; sin `subgrid`, las líneas de dos lecturas vecinas pueden quedar a distinta altura.
- La v1 descartada quedó en `.tmp/ds/v1-rechazada/`, fuera de git, por si hace falta comparar.
- Nada de esto está en un commit todavía.

## Licencias

- Atkinson Hyperlegible Next: SIL Open Font License 1.1. Archivos tomados de `@fontsource-variable/atkinson-hyperlegible-next` 5.3.0 (publicado el 19/7/2026).
- Íconos de Lucide v1.68.0 (`lucide-static`, publicado el 4/11/2026): licencia ISC. Copiados como archivos; no se suma ninguna dependencia.
- Textos completos en `sistema/assets/Licencias/`.
