# SANS — Qué entrega el Spectralis OCT2: estructura de sus datos

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* — [página oficial](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) |
| **Fecha** | 14 de noviembre de 2026 |
| **Para qué es** | Saber **qué devuelve el tomógrafo de retina (OCT) que está en la estación**, el Heidelberg Spectralis OCT2, campo por campo, para que los datos ficticios del proyecto copien esa estructura y no un formato inventado. |
| **Qué no es** | No diseña la solución. No repite la base técnica de la medición: eso está en `sans-oct-base-tecnica.md`. |
| **Fuente** | Código de lectores abiertos del formato (eyepy, heyexReader, OCT-Converter), material de Heidelberg Engineering y artículos. Lista al final. |

### Cómo leerlo

- **Sección 1:** tabla central: cabecera del examen y cabecera de cada corte del formato de exportación `.vol`.
- **Sección 2:** los formatos de exportación y qué trae cada uno.
- **Sección 3:** el marcado de capas que hace el equipo.
- **Sección 4:** la imagen de fondo.
- **Sección 5:** seguimiento del ojo y controles posteriores.
- **Sección 6:** números e informes del programa para el nervio óptico.
- **Sección 7:** patrones de escaneo y cuál usa la NASA.
- **Sección 8:** tamaño de archivo y tiempo de adquisición.
- **Sección 9:** qué pasa con los datos en la estación.
- **Secciones 10 y 11:** lo no verificado y las fuentes.

**Aviso sobre el origen:** la estructura sale del **código de programas abiertos que leen el formato**, no del manual del fabricante, que no conseguí. Los textos de cada campo son los que esos programas documentan.

**Columna "Ejemplo":** `(F)` = valor que aparece en la fuente · `(I)` = **valor ilustrativo armado por mí**, coherente con un examen del nervio óptico de 48 cortes radiales de 15°; no sale de un archivo real.

**"No encontrado"** = lo busqué y no apareció. Un asterisco en la fuente (`H2*`) = **solo leí un fragmento o el resumen**; el dato queda "sin verificar".

**Términos:** *B-scan* = un corte (imagen en dos dimensiones) · *A-scan* = una columna de ese corte · *SLO* = imagen de frente del fondo del ojo, tomada con láser infrarrojo, sobre la que se ubican los cortes · *OD / OS* = ojo derecho / ojo izquierdo · *ART* = promediado automático: cuántas imágenes del mismo corte se promedian · *HEYEX* = el programa de Heidelberg que maneja el equipo y guarda los exámenes.

---

## 1. Tabla central: el archivo `.vol` (exportación VOL de HEYEX)

### 1.1 Orden de las partes del archivo

| Parte | Tamaño | Fuente |
|---|---|---|
| 1. Cabecera del examen | **2048 bytes** | C1, C2 |
| 2. Imagen de fondo (SLO) | `SizeXSlo × SizeYSlo` bytes, 1 byte por píxel | C1, C2 |
| 3. Por cada corte: cabecera del corte + marcado de capas | `BScanHdrSize` bytes (los primeros 256 son la cabecera) | C1, C2 |
| 4. Por cada corte: la imagen | `SizeX × SizeZ × 4` bytes | C1, C2 |

Las partes 3 y 4 se repiten `NumBScans` veces. Todos los números van en orden *little-endian*.

### 1.2 Cabecera del examen (2048 bytes)

| Byte | Campo | Tipo | Unidad | Ejemplo | Qué es | Fuente |
|---|---|---|---|---|---|---|
| 0 | `Version` | texto, 12 | — | `HSF-OCT-103` (I) | Identificador de versión, con forma `HSF-OCT-xxx` | C1 |
| 12 | `SizeX` | entero 32 | píxeles | 768 (I) | Columnas (A-scans) de cada corte: el ancho | C1, C2 |
| 16 | `NumBScans` | entero 32 | — | 48 (I) | Cantidad de cortes del examen | C1, C2 |
| 20 | `SizeZ` | entero 32 | píxeles | 496 (F) | Muestras por columna: el alto del corte | C1, C2, P8 |
| 24 | `ScaleX` | real 64 | mm/píxel | 0,0057 (F) | Ancho de un píxel del corte | C1, P8 |
| 32 | `Distance` | real 64 | mm | 0,012 (F, en un barrido de volumen) | Distancia entre dos cortes vecinos. Valor en cortes radiales: no encontrado | C1, P8 |
| 40 | `ScaleZ` | real 64 | mm/píxel | 0,00387 (F) | Alto de un píxel del corte | C1, P8 |
| 48 | `SizeXSlo` | entero 32 | píxeles | 1536 (F) | Ancho de la imagen de fondo | C1, D2 |
| 52 | `SizeYSlo` | entero 32 | píxeles | 1536 (F) | Alto de la imagen de fondo | C1, D2 |
| 56 | `ScaleXSlo` | real 64 | mm/píxel | 0,0057 (I) | Ancho de un píxel de la imagen de fondo | C1 |
| 64 | `ScaleYSlo` | real 64 | mm/píxel | 0,0057 (I) | Alto de un píxel de la imagen de fondo | C1 |
| 72 | `FieldSizeSlo` | entero 32 | grados | 30 (I) | Campo horizontal de la imagen de fondo | C1, C2 |
| 76 | `ScanFocus` | real 64 | dioptrías | −0,41 (I) | Enfoque usado en el examen | C1 |
| 84 | `ScanPosition` | texto, 4 | — | `OD` (F) | Ojo examinado: `OD` derecho, `OS` izquierdo | C1 |
| 88 | `ExamTime` | entero 64 | 100 nanosegundos desde el 1/1/1601 | 2026-11-14 10:32 (I) | Fecha y hora del examen | C1, C2 |
| 96 | `ScanPattern` | entero 32 | código | **5** (F) | Patrón: 0 desconocido · 1 una línea · 2 círculo · 3 volumen con promediado · 4 volumen rápido · **5 radial (estrella)** | C1 |
| 100 | `BScanHdrSize` | entero 32 | bytes | 61440 (F, valor por defecto del lector) | Tamaño de la cabecera que precede a cada corte | C1 |
| 104 | `ID` | texto, 16 | — | `2390` (F) | Identificador único del examen; coincide con el número del nombre del archivo. Forma `n` o `n.m` | C1 |
| 120 | `ReferenceID` | texto, 16 | — | `2390` (F) | Identificador del **examen de referencia**. Vacío si el examen no es parte de un seguimiento. En el examen de referencia, igual a `ID` | C1 |
| 136 | `PID` | entero 32 | — | 1021 (I) | Número interno del paciente en HEYEX | C1 |
| 140 | `PatientID` | texto, 24 | — | `CREW-07` (I) | Identificador del paciente definido por el usuario | C1 |
| 164 | `DOB` | real 64 | días (fecha) | 1980-03-02 (I) | Fecha de nacimiento | C1, C2 |
| 172 | `VID` | entero 32 | — | 3310 (I) | Número interno de la visita en HEYEX | C1 |
| 176 | `VisitID` | texto, 24 | — | `FD090` (I) | Identificador de la visita definido por el usuario. Se escribe en la primera línea del comentario del examen, empezando con `#`; hasta 23 caracteres | C1 |
| 200 | `VisitDate` | real 64 | días (fecha) | 2026-11-14 (I) | Fecha de la visita | C1, C2 |
| 208 | `GridType` | entero 32 | código | 0 (F) | Tipo de grilla de grosor. 0 = sin datos. **Solo hay datos de grosor en los patrones 3 y 4** (volumen), no en el radial | C1 |
| 212 | `GridOffset` | entero 32 | bytes | 0 (F) | Posición de los datos de grosor en el archivo; 0 si no hay | C1 |
| 216 | `GridType1` | entero 32 | código | 0 (I) | Tipo de una segunda grilla | C1 |
| 220 | `GridOffset1` | entero 32 | bytes | 0 (I) | Posición de la segunda grilla | C1 |
| 224 | `ProgID` | texto, 34 | — | (I) | Identificador interno del seguimiento. **Todos los exámenes del mismo seguimiento lo comparten** | C1 |
| 258 | (reserva) | 1790 bytes | — | ceros | Sin uso | C1 |

### 1.3 Cabecera de cada corte (256 bytes) y lo que sigue

| Byte | Campo | Tipo | Unidad | Ejemplo | Qué es | Fuente |
|---|---|---|---|---|---|---|
| 0 | `Version` | texto, 12 | — | `HSF-BS-103` (I) | Identificador de versión | C1 |
| 12 | `BScanHdrSize` | entero 32 | bytes | 61440 (F) | Igual al de la cabecera del examen | C1 |
| 16 | `StartX` | real 64 | mm | 2,2 (I) | Punto de inicio del corte sobre la imagen de fondo, eje X | C1, C2 |
| 24 | `StartY` | real 64 | mm | 4,4 (I) | Punto de inicio, eje Y | C1, C2 |
| 32 | `EndX` | real 64 | mm | 6,6 (I) | Punto final, eje X. **En un corte circular es el centro del círculo** | C1, C2 |
| 40 | `EndY` | real 64 | mm | 4,4 (I) | Punto final, eje Y (o centro del círculo) | C1, C2 |
| 48 | `NumSeg` | entero 32 | — | 3 (I) | Cantidad de líneas de capas marcadas en este corte | C1, C2 |
| 52 | `OffSeg` | entero 32 | bytes | 256 (F) | Dónde empiezan las líneas de capas, contado desde el inicio de esta cabecera | C1 |
| 56 | `Quality` | real 32 | dB (la escala del equipo va de 0 a 40; el lector no indica unidad) | 28,5 (I) | Índice de calidad de la imagen. Si no existe, vale "inválido" | C1, C2, P13 |
| 60 | `Shift` | entero 32 | columnas | 0 (I) | Corrimiento horizontal de la banda de clasificación; solo en cortes circulares | C1 |
| 64 | `IVTrafo` | 6 reales 32 | — | ceros (F) | Matriz de transformación dentro del volumen. Solo en volumen y radial **con la alineación apagada**; si no, ceros | C1 |
| 88 | (reserva) | 168 bytes | — | ceros | Sin uso | C1 |
| 256 | Líneas de capas | `NumSeg × SizeX` reales 32 | píxeles: fila de la imagen, con decimales (así lo usa el lector) | 131,6 (I) | **Un valor por columna** para cada capa marcada. Donde no hay marca: "inválido" | C1, C2 |
| … | (relleno) | hasta `BScanHdrSize` | — | — | — | C1 |
| `BScanHdrSize` | Imagen del corte | `SizeZ × SizeX` reales 32 | reflectividad, de 0 a 1 | 0,0031 (I) | La imagen, por filas | C1, C2, C4 |

### 1.4 Valores especiales y cómo se muestra la imagen

| Tema | Dato | Fuente |
|---|---|---|
| Valor "inválido" | El real de 32 bits más grande posible (≈ 3,4 × 10³⁸; en hexadecimal `FFFF7F7F`). Marca píxeles fuera de la imagen y columnas donde no hay línea de capa | C2, C3 |
| Tipo de la imagen del corte | Real de 32 bits, **sin logaritmo aplicado**: casi todos los valores son muy chicos | C1, C4 |
| Tipo de la imagen de fondo | Entero de 8 bits (0 a 255) | C2, C4 |
| Para mostrarla como en el equipo (eyepy) | `gris = (ln(valor + 0,000244) + 8,3) / 8,285`, recortado entre 0 y 1; los "inválidos" pasan a 0 | C3 |
| Otra transformación usada (heyexReader) | `gris = ln(10000 × valor + 1)`, dividido por su máximo | C2 |
| Fechas | `ExamTime`: unidades de 100 ns desde 1601. `DOB` y `VisitDate`: días, con 25569 = 1/1/1970 | C1, C2 |

### 1.5 Tamaño que resulta para un examen radial de 48 cortes (cálculo mío)

| Parte | Cuenta | Tamaño |
|---|---|---|
| Cabecera | — | 2.048 bytes |
| Imagen de fondo | 1536 × 1536 | 2,4 MB |
| Cada corte | 61.440 + 768 × 496 × 4 | 1,59 MB |
| **Total, 48 cortes** | — | **≈ 78,5 MB** |

Supone `BScanHdrSize` = 61.440 y cortes de 768 columnas; el tamaño real de un archivo de la estación no lo encontré.

---

## 2. Formatos de exportación

| Formato | Qué es | Qué trae | ¿Documentado públicamente? | Fuente |
|---|---|---|---|---|
| **`.vol`** (exportación VOL de HEYEX) | Un archivo binario por examen | Cabecera, imagen de fondo, cada corte con su cabecera, las líneas de capas y la imagen como números reales. **Con escalas en milímetros** | No por el fabricante, que yo haya encontrado. Sí por lectores abiertos, campo por campo (sección 1) | C1, C2 |
| **`.e2e`** | Archivo contenedor del programa HEYEX | Jerarquía paciente → estudio → serie → corte, con imágenes, imagen de fondo, capas y metadatos. Puede traer varios exámenes | **No.** Descifrado en parte por ingeniería inversa. El lector eyepy declara que no logra leer la escala a lo ancho de los cortes ni la de la imagen de fondo | C5, C7 |
| **XML con imágenes** | Un archivo XML más una imagen por corte | Los mismos datos de cabecera en etiquetas, las líneas de capas como texto y las imágenes ya convertidas a grises de 8 bits | Estructura legible a simple vista; lectores abiertos | C6 |
| Otros (DICOM, informes en PDF, imágenes sueltas) | — | No relevado | — | — |

**Qué formato se usa para bajar los datos de la estación:** no encontrado.

### 2.1 Qué agrega cada formato respecto del `.vol`

| Dato | `.vol` | `.e2e` | XML | Fuente |
|---|---|---|---|---|
| Cantidad de imágenes promediadas (ART) por corte | **No está** | Sí (`art_mode`, `numAve`) | No encontrado en el lector | C1, C5, C6 |
| Hora de adquisición de cada corte | No (solo la del examen) | Sí (`acquisitionTime`) | — | C1, C5 |
| Índice de calidad por corte | Sí (`Quality`) | Sí (`quality_ui`) | Sí (`ImageQuality`) | C1, C5, C6 |
| Nombre y apellido del paciente | No (solo identificadores) | Sí | Sí (`FirstNames`, `LastName`) | C1, C6 |
| Nombre de cada capa marcada | No: solo el orden | — | Sí (`SegLine/Name`) | C1, C6 |
| Si una capa fue **corregida a mano** | No | — | Sí (`SegLine/Manual`) | C6 |
| Tipo de dato de la imagen | Real de 32 bits | Entero de 16 bits con codificación propia, que el lector convierte con una tabla | Imagen de 8 bits | C4, C7, C6 |
| Aparato, estructura examinada y nombre del patrón en texto | No (solo el código 0 a 5) | Sí (por ejemplo "Retina", "OCT ART Volume") | — | C5 |

### 2.2 Etiquetas del XML que corresponden a la cabecera (C6)

| Dato | Ruta en el XML |
|---|---|
| Versión del programa | `SWVersion/Version` |
| Ojo | `Patient/Study/Series/Laterality` (`R` o `L`) |
| Identificador del examen | `Patient/Study/Series/ID` |
| Examen de referencia | `Patient/Study/Series/ReferenceSeries/ID` |
| Identificador del seguimiento | `Patient/Study/Series/ProgID` |
| Paciente | `Patient/ID`, `Patient/PatientID`, `Patient/Birthdate/Date` |
| Fecha de la visita | `Patient/Study/StudyDate/Date` |
| Inicio y fin de cada corte | `OphthalmicAcquisitionContext/Start/Coord/X` e `Y`; `…/End/Coord/X` e `Y` |
| Calidad de cada corte | `OphthalmicAcquisitionContext/ImageQuality` |
| Archivo de imagen de cada corte | `ImageData/ExamURL` |
| Capas | `Segmentation/NumSegmentations`; cada `SegLine` con `Name`, `Array` y `Manual` |

---

## 3. Marcado de capas que hace el equipo

| Aspecto | Dato | Fuente |
|---|---|---|
| Cómo se entrega | Por cada corte, `NumSeg` líneas. Cada línea tiene **un número por columna** | C1, C2 |
| Unidad | Posición vertical en píxeles (fila de la imagen, con decimales). Es como lo usa el lector; la definición del fabricante no la encontré | C1 |
| Donde no pudo marcar | El valor "inválido" (≥ 3,0 × 10³⁸). Los lectores lo convierten en "sin dato" | C1, C2, C6 |
| Si un corte tiene menos líneas que otro | El lector rellena las que faltan con "sin dato" | C1 |
| Correcciones manuales | El operador puede corregir; el XML lo indica capa por capa | C6 |

**Orden de las líneas** (posición en el archivo → nombre que le da el lector eyepy, C1):

| Posición | Nombre | Qué borde es |
|---|---|---|
| 0 | `ILM` | Membrana limitante interna: superficie de la retina |
| 1 | `BM` | Membrana de Bruch: base de la retina |
| 2 | `RNFL` | Borde externo de la capa de fibras nerviosas |
| 3 a 7 | `GCL`, `IPL`, `INL`, `OPL`, `ONL` | Bordes de las capas internas |
| 8 | `ELM` | Membrana limitante externa |
| 9, 10 | `IOS`, `OPT` | Bordes de la zona de los fotorreceptores |
| 11 | `CHO` | Coroides |
| 12, 13 | `VIT`, `ANT` | Vítreo y segmento anterior |
| 14, 15 | `PR1` (o `EZ`), `PR2` (o `IZ`) | Franjas de los fotorreceptores |
| 16 | `RPE` | Epitelio pigmentario |
| 17, 18 | `IPL+`, `IPL-` | Subdivisiones para el estudio de vasos |

- La columna "Qué borde es" es **mi lectura de las siglas**; el lector solo da los nombres.
- **Para SANS alcanzan las posiciones 0 y 1** (ILM y BM): el grosor total de la retina es la distancia entre ambas.
- Cuántas líneas trae un examen del nervio óptico de la estación: no encontrado. Depende de la versión del programa.
- **Los puntos de la abertura de la membrana de Bruch (BMO) no figuran entre los campos del `.vol`.** Dónde los guarda el programa: no encontrado.
- **La NASA no usa el marcado tal cual:** lo corrige a mano y calcula las medidas con programas propios (P3).

---

## 4. Imagen de fondo (SLO infrarroja)

| Aspecto | Dato | Fuente |
|---|---|---|
| Qué es | Imagen de frente del fondo del ojo, tomada con un segundo haz láser **al mismo tiempo** que el corte | P24* |
| Tamaño | `SizeXSlo × SizeYSlo`. Ejemplo real: **1536 × 1536** píxeles | C1, D2 |
| Campo | `FieldSizeSlo`, en grados. Valor habitual 30° (≈ 9 mm): **sin verificar** en un archivo real | C1 |
| Tipo de dato | Un byte por píxel (0 a 255) | C2, C4 |
| Escala | `ScaleXSlo`, `ScaleYSlo`, en milímetros por píxel | C1 |
| Para qué sirve | (1) Ubicar cada corte: `StartX/Y` y `EndX/Y` son posiciones sobre esta imagen. (2) Seguir el movimiento del ojo. (3) Repetir el examen en el mismo lugar en el control siguiente | C1, H2*, P24* |

---

## 5. Seguimiento del ojo y controles posteriores

| Aspecto | Dato | Fuente |
|---|---|---|
| Seguimiento en vivo (*TruTrack*) | Un segundo haz láser sigue el fondo del ojo mientras se toma el corte y compensa el movimiento | H2* |
| Promediado (ART) | Gracias al seguimiento se promedian varias imágenes del mismo corte, hasta 100 | P6, P4 |
| Control posterior (*AutoRescan*, modo *follow-up*) | Usa la imagen de fondo "como un mapa" y coloca los cortes nuevos **en la misma posición** que en el examen de referencia | H2* |
| Cómo queda registrado en el archivo | `ReferenceID` = identificador del examen de referencia. `ProgID` = identificador común a todos los exámenes del seguimiento. En el examen de referencia, `ID` = `ReferenceID` | C1 |
| Qué hace la NASA | Envía a la estación los exámenes de antes del vuelo y toma cada control alineado con ellos | P1, P3 |
| Qué afirma el fabricante | Reproducibilidad del grosor de retina "de hasta 1 micrómetro". **Es una afirmación comercial, sin verificar** | H2* |
| Qué midió un estudio independiente | Con seguimiento y repetición, la variación de la capa de fibras fue de 1,3 a 3,5 %; sin ellos, de 2,7 a 10,5 % (ojos con glaucoma). **Sin verificar** | P24* |
| Qué **no** garantiza | No corrige errores del marcado de capas. El margen real de la medición de la NASA, con seguimiento incluido, es 19,4 µm | P2 |
| Matriz `IVTrafo` | Solo trae datos si la alineación entre cortes está **apagada**; si no, ceros | C1 |

---

## 6. Números e informes que da el programa para el nervio óptico

Corresponden al módulo de glaucoma del fabricante (*Glaucoma Module Premium Edition*, GMPE). **No encontré que la NASA use estos informes para SANS**: calcula sus medidas aparte (P3).

| Aspecto | Dato | Fuente |
|---|---|---|
| Alineación anatómica (APS) | El programa ubica dos puntos fijos, el centro de la BMO y la fóvea, y orienta todos los cortes según ese eje | H1 |
| Ancho mínimo del anillo neural (BMO-MRW) | Sobre **24 cortes radiales** centrados en la BMO: la distancia más corta de la BMO a la ILM. Promedio por sector | H1 |
| Capa de fibras (RNFL) | Sobre cortes circulares centrados en la BMO, "desenrollados" en el orden temporal → superior → nasal → inferior → temporal | H1 |
| Diámetros de los círculos | Tres círculos: 3,5, 4,1 y 4,7 mm | P6, P16 |
| Sectores | Seis (grilla de Garway-Heath): temporal, temporal superior, temporal inferior, nasal, nasal superior, nasal inferior; más el valor global | H1 |
| Qué entrega por sector | Grosor medio en µm, **percentil** respecto de la base de referencia y un color | H1 |
| Colores | Verde = dentro de lo normal · amarillo = límite · rojo = fuera de lo normal | H1 |
| Base de referencia | Ajustada por **edad** y por **área de la BMO**. Composición: está en el manual del módulo, que no leí | H1 |
| Mapas de grosor | Para la mácula: grosor total, capa de fibras y células ganglionares, con mapa de desvío por percentiles (menos de 1, menos de 5, 5 a 95, más de 95, más de 99) | H1 |
| Límite para SANS | Esta base está pensada para detectar **adelgazamiento** (glaucoma). El fabricante advierte que el color puede fallar si hay errores de marcado u otra enfermedad | H1 |
| Datos de grosor dentro del `.vol` | Solo en barridos de volumen (`GridType`), no en cortes radiales | C1 |

---

## 7. Patrones de escaneo

| Patrón | Qué toma | Código en el `.vol` | Fuente |
|---|---|---|---|
| Línea única | Un corte | 1 | C1 |
| Círculo | Un corte circular | 2 | C1 |
| Volumen con promediado | Cortes paralelos | 3 | C1 |
| Volumen rápido | Cortes paralelos, modo rápido | 4 | C1 |
| **Radial (estrella)** | Cortes que se cruzan en un centro | **5** | C1 |
| **ONH-RC** (nervio óptico, radial y círculos; módulo de glaucoma) | **24 cortes radiales de 15°** (promedio de 25) y **3 círculos** | No encontrado | P6, P16 |
| RNFL clásico | Un círculo de 12° (≈ 3,5 mm) | 2 | P1, C1 |

**Cuál coincide con el protocolo de la NASA:**

| Protocolo de la NASA | Patrón del equipo | Fuente |
|---|---|---|
| OCT1: 12 cortes radiales de 20°, promedio de 16, más círculo de 12° con promedio de 100 | Radial estándar más círculo estándar | P1, P4 |
| OCT2: **48 cortes radiales de 15°**, promedio de 25, más círculo de 3,5 mm | Los autores lo llaman **"barrido compuesto a medida"**. Se parece al ONH-RC pero con el doble de cortes: **no es un patrón de fábrica** | P3, P4 |
| Mácula: 20° × 20°, 25 cortes (OCT1) o 193 cortes (OCT2), promedio de 16 | Volumen | P4 |

- Nombre exacto del patrón en el equipo de la estación: no encontrado.
- **Si el patrón compuesto se exporta como un archivo o como varios:** no encontrado. Los lectores abiertos tratan radial (5) y círculo (2) como patrones distintos (C1).

---

## 8. Tamaño de archivo y tiempo de adquisición

| Aspecto | Dato | Tipo | Fuente |
|---|---|---|---|
| Tamaño de un `.vol` radial de 48 cortes | ≈ 78,5 MB | **Cálculo mío** (tabla 1.5) | C1 |
| Tamaño de un `.vol` de mácula de 193 cortes | ≈ 300 MB con 768 columnas | **Cálculo mío**, misma cuenta | C1 |
| Tamaño real de un examen de la estación, o de un `.e2e` | No encontrado | — | — |
| Velocidad del OCT2 | **85.000** columnas (A-scans) por segundo | Especificación | H3* |
| Velocidad del OCT1 | 40.000 por segundo | Especificación | H4* |
| Tiempo de barrido, radial OCT2 | 48 × 768 × 25 ÷ 85.000 ≈ **11 segundos** | **Cálculo mío**; mínimo teórico, sin contar repeticiones por parpadeo o movimiento | — |
| Tiempo de barrido, círculo con promedio de 100 | 768 × 100 ÷ 85.000 ≈ 1 segundo | **Cálculo mío** | — |
| Tiempo real de adquisición de un patrón | No encontrado | — | — |
| Examen completo en una clínica | 5 min 18 s con OCT2 contra 6 min 56 s con OCT1, de sentarse a levantarse. **Sin verificar**; otro protocolo | Medido en Tierra | H4* |
| Sesión en la estación | 15 a 60 minutos por sesión de datos oculares, contando cortes de comunicación | Dato de la NASA | N3 |

---

## 9. Qué pasa con los datos en la estación (N3)

| Paso | Dato |
|---|---|
| Agenda | Las "semanas del ojo" se cargan en el cronograma de la tripulación: reservan al tripulante examinado, al operador y las tareas (armado, gotas, toma de datos, guardado) |
| Durante la sesión | Comunicación privada con Tierra. En Tierra: guía remoto, especialista si hace falta, ingeniero biomédico, intérprete si hace falta y, opcional, el médico de la tripulación |
| Enlace | Por satélites de retransmisión hacia antenas en Nuevo México y Guam. Velocidad: 600 megabits por segundo. Demora: ~1 segundo ida y vuelta |
| Cortes de señal | Frecuentes, de segundos a más de 15 minutos; se pueden prever |
| Dónde queda el dato | **Las imágenes de OCT se guardan en una computadora portátil de la estación** (igual que ecografía y fondo de ojo). Agudeza visual y presión del ojo las anota el guía remoto |
| Cómo baja | Un ingeniero biomédico de datos **descarga los archivos desde esa portátil** |
| Quién lo analiza | Los datos se pasan a equipos de diagnóstico en Tierra y a especialistas |
| Resultado | Se generan informes, se cargan en la historia clínica y se comunican a los médicos de la tripulación. Si hace falta, se coordinan tareas de seguimiento |
| **Plazo** entre el examen y el informe | **No encontrado** |
| Qué ve el astronauta | No encontrado |
| A futuro | Fuera de la órbita baja la demora sube (~5 segundos a la Luna, 10 a 40 minutos a Marte): "va a exigir más autonomía de la tripulación y automatización del aparato" |

---

## 10. Lo no verificado

**Origen de la estructura**

- **No conseguí el documento del fabricante** que define el `.vol`. Todo sale de lectores abiertos (C1, C2), que coinciden entre sí en tipos y posiciones. Si interpretan mal un campo, el error está acá también.
- El `.e2e` no tiene documentación oficial; los propios lectores marcan campos como "desconocido" o "provisional" (C5).

**Ejemplos y cálculos**

- **Los ejemplos `(I)` son ilustrativos**, incluidas las cadenas de versión, los identificadores y las coordenadas.
- Tamaños de archivo y tiempos de barrido son **cálculos míos**; suponen `BScanHdrSize` = 61.440 y cortes de 768 columnas.
- El campo de 30° de la imagen de fondo no lo vi en un archivo real.

**Fuentes leídas solo en fragmento (`*`)**

- H2*, H3*, H4* (material del fabricante) y P24* (estudio de reproducibilidad): sus cifras quedan sin verificar. "1 micrómetro" es una afirmación comercial.

**No encontrado**

- Qué formato baja de la estación y cuánto pesa un examen real.
- Si el patrón compuesto de la NASA se guarda en un archivo o en varios, y su nombre en el equipo.
- Valor de `Distance` en cortes radiales.
- Cuántas líneas de capas trae un examen del nervio óptico y dónde guarda el programa los puntos de la BMO.
- Composición de la base de referencia del módulo de glaucoma.
- Tiempo real de adquisición de cada patrón.
- Plazo entre el examen y el informe, y qué ve el astronauta de sus propios resultados.
- Índice de calidad mínimo que exige la NASA (ya figuraba como no encontrado en `sans-oct-base-tecnica.md`).

## 11. Fuentes

**Texto completo:** *Sí* = conseguido y leído · *Parcial* = leí las partes de donde salen los datos · *No* = con el motivo.

| ID | Fuente | Texto completo |
|---|---|---|
| C1 | [eyepy, lector de `.vol`](https://github.com/MedVisBonn/eyepy/blob/master/src/eyepy/io/he/vol_reader.py) (código abierto) | Sí |
| C2 | [heyexReader, lector de `.vol`](https://github.com/ayl/heyexReader/blob/master/heyexReader/volReader.py) (código abierto) | Sí (la función de lectura) |
| C3 | [eyepy, transformación de intensidades](https://github.com/MedVisBonn/eyepy/blob/master/src/eyepy/core/utils.py) | Parcial (las funciones citadas) |
| C4 | [eyepy, tipos de dato de imagen y capas](https://github.com/MedVisBonn/eyepy/blob/master/src/eyepy/io/utils.py) | Parcial (las clases citadas) |
| C5 | [eyepy, estructura del `.e2e`](https://github.com/MedVisBonn/eyepy/blob/master/src/eyepy/io/he/e2e_format.py) y su [documentación](https://github.com/MedVisBonn/eyepy/blob/master/docs/formats/he_e2e.md) | Parcial (metadatos de corte y limitaciones) |
| C6 | [eyepy, lector del XML](https://github.com/MedVisBonn/eyepy/blob/master/src/eyepy/io/he/xml_reader.py) | Parcial (rutas de etiquetas y lectura de capas) |
| C7 | [OCT-Converter, lector de `.e2e`](https://github.com/marksgraham/OCT-Converter/blob/main/oct_converter/readers/e2e.py) | Parcial (lectura de la imagen) |
| H1 | [Heidelberg, guía del módulo de glaucoma](https://media.heidelbergengineering.com/uploads/Products-Downloads/210159-001_SPECTRALIS_PDF-Tutorial_Glaucoma-Toolkit_EN.pdf) | Parcial (alineación, anillo neural, capa de fibras, base de referencia) |
| H2* | [Heidelberg, página del Spectralis](https://www.heidelbergengineering.com/en/products/spectralis) | No: solo un fragmento |
| H3* | [Heidelberg, folleto del módulo OCT2](https://www.heidelbergengineering.com/globalassets/media/marketing/brochures/303059-001_spectralis-brochure-oct2-insert_us.pdf) | No: solo un fragmento |
| H4* | [Heidelberg, estudio de tiempos con OCT2](https://www.heidelbergengineering.com/globalassets/media/marketing/journal-articles/200272-001_new-oct-technology-shortens-examination-time-without-sacrificing-quality_kellogg-study.pdf) | No: solo un fragmento |
| N3 | [Brunstetter 2022, SANS y telemedicina (diapositivas de la NASA)](https://ntrs.nasa.gov/citations/20220018416) | Parcial (la parte de toma de datos en órbita) |
| P1 | [Macias 2020, cambios oculares en 11 astronautas](https://pmc.ncbi.nlm.nih.gov/articles/PMC7118682/) | Sí |
| P2 | [Laurie 2020, hinchazón y coroides en vuelo y en reposo en cama](https://pmc.ncbi.nlm.nih.gov/articles/PMC6990717/) | Sí |
| P3 | [Pardon 2022, factores asociados a la hinchazón, 31 tripulantes](https://pmc.ncbi.nlm.nih.gov/articles/PMC9614681/) | Sí |
| P4 | [Ferguson 2023, pliegues en 36 tripulantes](https://pmc.ncbi.nlm.nih.gov/articles/PMC9857718/) | Sí |
| P6 | [Chauhan 2015, MRW y capa de fibras en 246 personas sanas](https://pmc.ncbi.nlm.nih.gov/articles/PMC4698808/) | Sí |
| P8 | [Tabla de parámetros del Spectralis en un estudio de repetibilidad, 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7533739/) | Parcial (adquisición) |
| P13 | [Artefactos en exámenes de Spectralis del nervio, 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4423408/) | Parcial (método) |
| P16 | [Exactitud de la detección de la BMO, 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9754118/) | Parcial (método) |
| P24* | [Reproducibilidad con seguimiento del ojo, IOVS](https://iovs.arvojournals.org/article.aspx?articleid=2165761) | No: solo el resumen |
| D2 | [Conjunto de datos de nervio óptico con Spectralis (Rabbani)](https://hrabbani.site123.me/available-datasets/onh-based-oct-of-7-healthy-and-7-glaucoma-data-captured-by-heidelberg-spectralis) | Sí (la página) |
