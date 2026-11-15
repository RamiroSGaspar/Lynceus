# SANS — Base técnica de la tomografía de retina (OCT)

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* — [página oficial](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) |
| **Fecha** | 14 de noviembre de 2026 |
| **Para qué es** | Dar los **números y las definiciones exactas** para (1) dibujar imágenes ficticias de OCT que sean plausibles y (2) programar la medición tal como la define la NASA para el síndrome neuro-ocular del vuelo espacial (SANS). |
| **Qué no es** | No diseña la solución ni propone qué construir. No repite lo ya verificado en el contexto común (controles, umbrales, frecuencias). |
| **Fuente** | Artículos del grupo de la NASA leídos completos, informes de la NASA y artículos técnicos de OCT. Lista al final. |

### Cómo leerlo

- **Sección 1:** tabla central, con lo necesario para dibujar un corte radial y medirlo.
- **Secciones siguientes:** se agregan en el segundo commit (protocolo, capas y ruido, hallazgos, confiabilidad, algoritmos, análisis automático, imágenes públicas).
- **Al final:** lo no verificado y las fuentes.

**Tipo de dato** (columna "Tipo"): `A` = medido en astronautas · `T` = medido en personas en Tierra · `E` = especificación del equipo · `D` = definición del método · `C` = **cálculo mío** a partir de datos de la fuente, no lo dice la fuente.

**"Por verificar"** = todavía no lo confirmé en una fuente leída completa.

**Términos y siglas** (se programa con los nombres en inglés):

| Sigla | Significado |
|---|---|
| OCT | Tomografía de coherencia óptica: imagen en corte de la retina, hecha con luz |
| B-scan | Un corte (una imagen en dos dimensiones). A-scan = una columna de ese corte |
| ONH | Cabeza del nervio óptico (*optic nerve head*): donde el nervio entra al ojo |
| ILM | Membrana limitante interna: el borde de la retina del lado del interior del ojo |
| BM | Membrana de Bruch: lámina fina debajo de la retina, sobre la coroides |
| BMO | Abertura de la membrana de Bruch: el agujero de esa lámina por donde pasa el nervio. En un corte se ve como **dos puntos**, uno a cada lado |
| TRT | Grosor total de la retina (*total retinal thickness*): de la ILM a la BM |
| MRW | Ancho mínimo del anillo neural (*minimum rim width*) |
| RNFL | Capa de fibras nerviosas de la retina |
| Coroides | Capa de vasos sanguíneos entre la retina y la esclera (la pared blanca del ojo) |
| ART | Promediado automático del Spectralis: cuántas imágenes del mismo corte se promedian |
| FD | Día de vuelo (*flight day*) |

---

## 1. Tabla central: parámetro → valor → unidad → fuente

### 1.A Geometría de la imagen (Spectralis)

| Parámetro | Valor | Unidad | Tipo | Fuente |
|---|---|---|---|---|
| Alto de la imagen (profundidad) | 496 | píxeles | E | P8 |
| Profundidad del barrido | 1,9 | mm | E | P8 |
| Escala en profundidad | 3,87 | µm/píxel | E | P8 |
| Escala a lo ancho, modo alta resolución | ~5,7 | µm/píxel | E | P8 |
| Escala a lo ancho, modo rápido | ~11,5 | µm/píxel | E | P8 |
| Ancho de un corte de 15° en alta resolución | 768 | píxeles (A-scans) | E | P8 |
| Ancho de un corte de 20° en alta resolución | por verificar (≈1024 por regla de tres) | píxeles | C | — |
| Largo de un corte radial de la NASA | 20 (OCT1) o 15 (OCT2) | grados | A | P1, P4 |
| Equivalencia grados ↔ milímetros en la retina | 12° ≈ 3,5 mm · 15° ≈ 4,4 mm · 20° ≈ 6 mm (**≈ 0,29–0,30 mm por grado**) | mm | E / C | P3, P4, P8 |
| Cómo ajusta la escala a cada ojo | El equipo usa la curvatura de la córnea y el largo del ojo que se le cargan | — | D | P6. Fórmula: por verificar |
| Largo del ojo en astronautas | 24,1 (rango 22,0 a 25,8) | mm | A | P3 |
| Índice de calidad mínimo usado en un estudio de referencia | 20 (se descartan imágenes por debajo) | dB | T | P6 |
| Índice de calidad mínimo que exige la NASA | no encontrado | — | — | — |

### 1.B Definición de cada medida

| Medida | Definición | Unidad | Tipo | Fuente |
|---|---|---|---|---|
| Patrón de cortes | Cortes radiales (en estrella) centrados en la ONH: **12 cortes de 20°** (OCT1) o **48 cortes de 15°** (OCT2). En algunos casos, 24 cortes de 20° | — | D | P1, P2, P3, P4 |
| Bordes que se marcan | ILM y BM en cada corte, con marcado automático **corregido a mano** por expertos | — | D | P1, P3 |
| BMO | En cada corte radial se marcan los **dos puntos** donde termina la BM. Con todos los puntos se ajusta una **elipse** | — | D | P1, P3 |
| Área de la BMO | Área de esa elipse | mm² | D | P3 |
| TRT | Distancia de la ILM a la BM. Con los cortes radiales se arma un **mapa de grosor por interpolación** | µm | D | P1 |
| TRT del anillo principal | **Promedio del mapa** en el anillo que va de la elipse de la BMO hasta 250 µm hacia afuera | µm | D | P1, P2, P3 |
| Otros anillos | 250–500, 500–1000 y 1000–1500 µm desde la BMO | µm | D | P1 |
| MRW | **Distancia mínima** desde cada punto de la BMO hasta la ILM. Un valor por punto (2 por corte); se promedian | µm | D | P1, P3, P6 |
| Copa del nervio | Línea de referencia paralela a la que une los dos puntos de la BMO, **200 µm hacia el interior del ojo**. La copa es lo que queda entre esa línea y la ILM | µm, mm³ | D | P3 |
| Grosor de coroides | Sobre el **corte circular** de 12° (≈3,5 mm de diámetro) centrado en la ONH: de la BM al borde coroides-esclera, **marcado a mano** | µm | D | P1, P2, P3 |
| Capa de fibras (RNFL) | Sobre el mismo corte circular de 3,5 mm | µm | D | P3 |
| Pliegues de coroides | Rugosidad de la BM: raíz del promedio de los cuadrados de la altura (RMS), después de quitar inclinación y curvatura | µm | D | P4 |
| Desplazamiento de la BM o protrusión del nervio | por verificar | — | — | — |

### 1.C Valores antes del vuelo y valores normales

| Parámetro | Valor | Unidad | Quiénes | Tipo | Fuente |
|---|---|---|---|---|---|
| **TRT, anillo BMO–250 µm** | **392,0** (error estándar 5,8; rango 299,3 a 483,9) | µm | 31 astronautas, 46,9 ± 6,0 años | A | P3 |
| Desvío estándar del TRT entre personas | ≈ 32 | µm | Los mismos | C (5,8 × √31) | P3 |
| **MRW** | **366,4** (error estándar 9,1; rango 225,1 a 493,8) | µm | Los mismos | A | P3 |
| MRW, población general | ≈ 335 de mediana; baja 1,34 por año de edad | µm | 246 personas sanas blancas, 20 a 87 años | C / T | P6 |
| MRW por sector | Más angosto del lado temporal; más ancho arriba-nasal, nasal y abajo-nasal | — | Los mismos | T | P6 |
| **Área de la BMO** | **2,02** (error estándar 0,07; rango 1,33 a 4,11) | mm² | 31 astronautas | A | P3 |
| Área de la BMO, población general | 1,74 de mediana (rango 1,05 a 3,40) | mm² | 246 personas sanas | T | P6 |
| Diámetro equivalente de la BMO | ≈ 1,6 (astronautas) · ≈ 1,5 (población) | mm | — | C (círculo de igual área) | P3, P6 |
| Forma de la BMO | Ovalada, más alta que ancha | — | 246 personas sanas | T | P6 |
| Volumen de la copa | 0,167 (rango 0 a 0,841) | mm³ | 31 astronautas | A | P3 |
| Profundidad media de la copa | 201,2 (rango 0 a 486,3) | µm | Los mismos | A | P3 |
| Ancho medio de la copa | 570,0 (rango 0 a 1431,5) | µm | Los mismos | A | P3 |
| Nervio "apretado" (copa chica) | Nadie con copa **≥ 0,3 mm³** pasó el umbral de 19,4 µm | mm³ | Los mismos | A | P3 |
| Capa de fibras en el círculo | 104,0 (rango 83,3 a 126,1) | µm | Los mismos | A | P3 |
| **Coroides junto al nervio** | **213,3** (error estándar 11,1; rango 107,0 a 406,4) | µm | Los mismos | A | P3 |
| Coroides junto al nervio, otra serie | 169,2 ± 51,6 (7 astronautas sin vuelos) · 169,3 ± 43,0 (40 personas sanas) | µm | — | A / T | P2 |
| Coroides bajo la mácula | por verificar | µm | — | — | — |
| Diferencia normal entre los dos ojos | por verificar | — | — | — | — |
| Ángulo entre la mácula y el centro de la BMO | −6,7 de mediana (rango +2,5 a −17,5) | grados | 246 personas sanas | T | P6 |

### 1.D Cuánto cambia con la hinchazón del nervio

| Parámetro | Valor | Unidad | Quiénes y cuándo | Tipo | Fuente |
|---|---|---|---|---|---|
| TRT promedio en vuelo | 392,0 → **430,2** (rango 305,1 a 593,4) | µm | 31 astronautas, día ~150 | A | P3 |
| TRT, casos extremos | 547 (+135 sobre antes del vuelo) y 528 (+45) | µm | 2 tripulantes de misión de un año | A | P5 |
| MRW promedio en vuelo | 366,4 → **416,3** (rango 237,8 a 572,4) | µm | 31 astronautas, día ~150 | A | P3 |
| MRW, casos extremos | 561 (+149) y 539 (+56) | µm | 2 tripulantes, día 270 | A | P5 |
| Dónde es mayor el cambio | Cuanto más cerca del nervio, mayor. Anillo 250–500 µm: menos de la mitad que el anillo BMO–250 | — | 11 astronautas | A | P1 |
| Hasta dónde llega | TRT aumentado hasta 1000 µm del nervio; la capa de fibras, solo hasta 500 µm | µm | 15 astronautas, después del vuelo | A | N1 (cita a Patel 2018) |
| Qué sectores | Superior, inferior y nasal. El temporal, menos | — | Los mismos | A | N1 |
| La copa se achica | Volumen 0,167 → 0,134; profundidad 201,2 → 178,0; ancho 570 → 480 | mm³, µm | 31 astronautas, día ~150 | A | P3 |
| El área de la BMO casi no cambia | 2,02 → 2,06 | mm² | Los mismos | A | P3 |
| Capa de fibras en el círculo | 104,0 → 106,7 | µm | Los mismos | A | P3 |
| Coroides junto al nervio | 213,3 → 245,6 (rango 134,4 a 488,5) | µm | Los mismos | A | P3 |
| Hinchazón y coroides no van juntas | Sin relación entre el cambio de coroides y el de TRT (r² = 0,002) | — | 20 astronautas, ~37 días | A | P2 |
| Reposo en cama, para comparar | TRT +8,1 (día 1), +36,1 (día 15), +53,9 (día 30) | µm | 11 voluntarios, cabeza inclinada 6° hacia abajo | T | P2 |

---

## Lo no verificado (provisorio)

- Las celdas marcadas "por verificar" en la tabla.
- **Los valores `C` son cálculos míos**: el desvío estándar del TRT (supone que el error estándar es por persona), la mediana del MRW en la población (sale de dividir la baja anual por el porcentaje por década) y el diámetro equivalente de la BMO.
- **Ancho en píxeles del corte:** un estudio (P6) dice 1536 columnas para cortes de 15°, y la tabla de especificaciones (P8) dice 768. No lo resolví.
- **Patel 2018**, el artículo que define los anillos: es de pago; lo cito a través del informe de la NASA (N1) y de los artículos posteriores del mismo grupo.

## Fuentes (provisorio)

| ID | Fuente | Texto completo |
|---|---|---|
| N1 | [Informe de evidencia de la NASA sobre SANS, 2022](https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf) | Sí |
| P1 | [Macias 2020, cambios oculares en 11 astronautas](https://pmc.ncbi.nlm.nih.gov/articles/PMC7118682/) | Sí |
| P2 | [Laurie 2020, hinchazón y coroides en vuelo y en reposo en cama](https://pmc.ncbi.nlm.nih.gov/articles/PMC6990717/) | Sí |
| P3 | [Pardon 2022, factores asociados a la hinchazón, 31 tripulantes](https://pmc.ncbi.nlm.nih.gov/articles/PMC9614681/) | Sí |
| P4 | [Ferguson 2023, pliegues en 36 tripulantes](https://pmc.ncbi.nlm.nih.gov/articles/PMC9857718/) | Sí |
| P5 | [Macias 2021, dos tripulantes de misión de un año](https://pmc.ncbi.nlm.nih.gov/articles/PMC8085766/) | Sí |
| P6 | [Chauhan 2015, MRW y capa de fibras en 246 personas sanas](https://pmc.ncbi.nlm.nih.gov/articles/PMC4698808/) | Sí (sin las figuras suplementarias) |
| P8 | [Tabla de parámetros del Spectralis en un estudio de repetibilidad, 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7533739/) | No: solo la sección de adquisición |
