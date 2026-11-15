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
- **Secciones siguientes:** se agregan en el segundo commit (otros formatos, marcado del equipo, imagen de fondo, seguimiento, informes, patrones, tamaños, datos en la estación).
- **Al final:** lo no verificado y las fuentes.

**Aviso sobre el origen:** la estructura sale del **código de programas abiertos que leen el formato**, no del manual del fabricante, que no conseguí. Los textos de cada campo son los que esos programas documentan.

**Columna "Ejemplo":** `(F)` = valor que aparece en la fuente · `(I)` = **valor ilustrativo armado por mí**, coherente con un examen del nervio óptico de 48 cortes radiales de 15°; no sale de un archivo real.

**"Por verificar"** = todavía no lo confirmé en una fuente leída.

**Términos:** *B-scan* = un corte (imagen en dos dimensiones) · *A-scan* = una columna de ese corte · *SLO* = imagen de frente del fondo del ojo, tomada con láser infrarrojo, sobre la que se ubican los cortes · *OD / OS* = ojo derecho / ojo izquierdo · *ART* = promediado automático: cuántas imágenes del mismo corte se promedian · *HEYEX* = el programa de Heidelberg que maneja el equipo y guarda los exámenes.

---

## 1. Tabla central: el archivo `.vol` (exportación de datos crudos)

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
| 32 | `Distance` | real 64 | mm | 0,012 (F, en un barrido de volumen) | Distancia entre dos cortes vecinos. En cortes radiales: por verificar | C1, P8 |
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
| 56 | `Quality` | real 32 | dB (por verificar) | 28,5 (I) | Índice de calidad de la imagen. Si no existe, vale "inválido" | C1, C2 |
| 60 | `Shift` | entero 32 | columnas | 0 (I) | Corrimiento horizontal de la banda de clasificación; solo en cortes circulares | C1 |
| 64 | `IVTrafo` | 6 reales 32 | — | ceros (F) | Matriz de transformación dentro del volumen. Solo en volumen y radial **con la alineación apagada**; si no, ceros | C1 |
| 88 | (reserva) | 168 bytes | — | ceros | Sin uso | C1 |
| 256 | Líneas de capas | `NumSeg × SizeX` reales 32 | por verificar | 131,6 (I) | **Un valor por columna** para cada capa marcada | C1, C2 |
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

## Lo no verificado (provisorio)

- **No leí el documento del fabricante** que define el formato; todo sale de lectores abiertos. Si esos lectores interpretan mal un campo, el error está acá también.
- Las celdas "por verificar": unidad de las líneas de capas, unidad del índice de calidad dentro del archivo y valor de `Distance` en cortes radiales.
- **Los ejemplos `(I)` son ilustrativos**, incluidas las cadenas de versión.
- No verifiqué que el patrón combinado de la NASA (48 cortes radiales más círculos) se exporte como **un solo** archivo `.vol`.

## Fuentes (provisorio)

| ID | Fuente | Texto completo |
|---|---|---|
| C1 | [eyepy, lector de `.vol`](https://github.com/MedVisBonn/eyepy/blob/master/src/eyepy/io/he/vol_reader.py) (código abierto) | Sí |
| C2 | [heyexReader, lector de `.vol`](https://github.com/ayl/heyexReader/blob/master/heyexReader/volReader.py) (código abierto) | Sí |
| C3 | [eyepy, transformación de intensidades](https://github.com/MedVisBonn/eyepy/blob/master/src/eyepy/core/utils.py) | Sí (las funciones citadas) |
| C4 | [eyepy, tipos de dato de imagen y capas](https://github.com/MedVisBonn/eyepy/blob/master/src/eyepy/io/utils.py) | Sí (las clases citadas) |
| P8 | [Tabla de parámetros del Spectralis en un estudio de repetibilidad, 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7533739/) | Parcial (adquisición) |
| D2 | [Conjunto de datos de nervio óptico con Spectralis (Rabbani)](https://hrabbani.site123.me/available-datasets/onh-based-oct-of-7-healthy-and-7-glaucoma-data-captured-by-heidelberg-spectralis) | Sí (la página) |
