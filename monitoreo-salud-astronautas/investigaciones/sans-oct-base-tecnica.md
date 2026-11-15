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
- **Sección 2:** protocolo de OCT de la NASA.
- **Sección 3:** cómo se ve cada capa, el ruido y los artefactos.
- **Sección 4:** cómo cambia la imagen con cada hallazgo de SANS.
- **Sección 5:** confiabilidad de la medición.
- **Sección 6:** algoritmos para marcar las capas.
- **Sección 7:** análisis automático ya publicado.
- **Sección 8:** imágenes públicas de referencia.
- **Secciones 9 y 10:** lo no verificado y las fuentes.

**Tipo de dato** (columna "Tipo"): `A` = medido en astronautas · `T` = medido en personas en Tierra · `E` = especificación del equipo · `D` = definición del método · `C` = **cálculo mío** a partir de datos de la fuente, no lo dice la fuente.

**"No encontrado"** = lo busqué y no apareció. Un asterisco en la fuente (`P14*`) = **no leí el texto completo**; el dato queda "sin verificar".

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
| La escala en profundidad no depende del ojo | Solo la escala a lo ancho cambia con cada ojo | — | E | P21* |
| Escala a lo ancho, modo alta resolución | ~5,7 | µm/píxel | E | P8 |
| Escala a lo ancho, modo rápido | ~11,5 | µm/píxel | E | P8 |
| Ancho de un corte de 15° en alta resolución | 768 | píxeles (A-scans) | E | P8, D2 |
| Ancho de un corte de 20° en alta resolución | ≈ 1024 (768 × 20/15). **No confirmado** | píxeles | C | — |
| Largo de un corte radial de la NASA | 20 (OCT1) o 15 (OCT2) | grados | A | P1, P4 |
| Equivalencia grados ↔ milímetros | 12° ≈ 3,5 mm · 15° ≈ 4,4 mm · 20° ≈ 6 mm (**≈ 0,29–0,30 mm por grado**) | mm | E / C | P3, P4, P8 |
| Cómo ajusta la escala a cada ojo | Usa un ojo modelo (Gullstrand) con **largo fijo de 24,385 mm**, el enfoque que pone el operador y la curvatura de la córnea (**7,70 mm** si no se carga otra) | — | E | P9 |
| Cuánto varía el largo real de un corte de 20° | 5,7 a 7,3 mm con la curvatura por defecto (50 ojos, largo de 21,4 a 29,0 mm) | mm | T | P9 |
| Largo del ojo en astronautas | 24,1 (rango 22,0 a 25,8) | mm | A | P3 |
| Índice de calidad del Spectralis | Escala de **0 a 40 dB**. Menos de **15** = señal pobre, según el manual | dB | E | P13 |
| Mínimo usado en el estudio de valores normales | 20 | dB | T | P6 |
| Mínimo que exige la NASA | No encontrado | — | — | — |

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
| Sectores del MRW | Cuatro de 40° (arriba-nasal, abajo-nasal, abajo-temporal, arriba-temporal), temporal de 90° y nasal de 110° | grados | D | P6 |
| Copa del nervio | Línea de referencia paralela a la que une los dos puntos de la BMO, **200 µm hacia el interior del ojo**. La copa es lo que queda entre esa línea y la ILM | µm, mm³ | D | P3 |
| Grosor de coroides | Sobre el **corte circular** de 12° (≈3,5 mm de diámetro) centrado en la ONH: de la BM al borde coroides-esclera, **marcado a mano** | µm | D | P1, P2, P3 |
| Capa de fibras (RNFL) | Sobre el mismo corte circular de 3,5 mm | µm | D | P3 |
| Pliegues de coroides | Rugosidad de la BM: raíz del promedio de los cuadrados de la altura (RMS), después de quitar inclinación y curvatura | µm | D | P4 |
| Altura de la BMO (desplazamiento de la BM) | Se midió un corrimiento **hacia atrás** después del vuelo. Definición exacta y valores: **no obtenidos** (artículo de pago) | — | A | P12 (cita a Patel 2018) |

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
| Nervio "apretado" (copa chica) | Nadie con copa **≥ 0,3 mm³** pasó el umbral de 19,4 µm. El área de la BMO **no** se asoció con la hinchazón | mm³ | Los mismos | A | P3 |
| Capa de fibras en el círculo | 104,0 (rango 83,3 a 126,1) | µm | Los mismos | A | P3 |
| **Coroides junto al nervio** | **213,3** (error estándar 11,1; rango 107,0 a 406,4) | µm | Los mismos | A | P3 |
| Coroides junto al nervio, otra serie | 169,2 ± 51,6 (7 astronautas sin vuelos) · 169,3 ± 43,0 (40 personas sanas) | µm | — | A / T | P2 |
| Coroides junto al nervio, por sector | Arriba 225 ± 57 · abajo **183 ± 47** · nasal 220 ± 57 · temporal 233 ± 59 | µm | 57 personas sanas, 30,9 ± 10,6 años | T | P10 |
| Coroides bajo la mácula | 363 ± 84 en el centro; 292 ± 76 a 1,5 mm hacia la nariz y 194 ± 58 a 3 mm. Se afina con la edad | µm | 104 personas sanas, 34,6 ± 9,8 años | T | P11 |
| Diferencia normal entre los dos ojos | Hasta 49 en MRW y hasta 9 en capa de fibras (límite del 95 %). **Sin verificar** | µm | 220 personas sanas | T | P14* |
| Diferencia entre ojos del cambio de TRT en vuelo | 8 ± 13 | µm | 11 astronautas, día 120 | A | N1 |
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

## 2. Protocolo de OCT de la NASA para SANS

| Qué | Dato | Fuente |
|---|---|---|
| **Cortes radiales sobre el nervio** | OCT1: 12 cortes de 20°, alta resolución, promedio de **16** imágenes (ART 16). OCT2: 48 cortes de 15°, ART **25** | P1, P4 |
| **Corte circular** | 12° o 3,5 mm de diámetro, centrado en el nervio, ART **100**. Sirve para coroides y capa de fibras | P1, P4 |
| Círculos más cerca del nervio | El protocolo actualizado agrega círculos concéntricos más chicos. Diámetros: no encontrados | N1 |
| **Barrido de mácula** | 20° × 20° (6 × 6 mm), cortes verticales, centrado en la fóvea: 25 cortes (OCT1) o 193 cortes (OCT2), ART 16 | P4 |
| Modo para ver la coroides (EDI) | Usado en el estudio de reposo en cama (24 cortes, ART 50). En vuelo se sumó como capacidad desde fines de 2018. Si es parte del protocolo de rutina: no encontrado | P2, P12 |
| Alineación con el examen anterior | Los cortes de antes del vuelo se envían a la estación y cada examen nuevo se toma **sobre el mismo lugar** con la función de seguimiento del equipo (*follow-up* / *AutoRescan*), que sigue el movimiento del ojo | P1, P3 |
| Mismo protocolo siempre | Cada persona se escanea con el mismo patrón en todos los controles | P3 |
| Desde cuándo hay cortes más densos | 2019. Desde entonces se detectan más quistes y desprendimientos | N1 |
| Quién opera | Un tripulante examina a otro; un guía en Tierra le habla y un especialista mira las imágenes | N2 |
| Entrenamiento en OCT | 2,5 horas en 2 sesiones antes del vuelo | N2 |
| Duración de la sesión | 15 min de armado, 45 min de examen y 10 min de guardado. **Sin verificar**: sale de un fragmento de un documento de requisitos médicos de la NASA de 2017 que no leí completo | — |
| En el control en Tierra, para comparar | Estudio de valores normales: 24 cortes radiales de 15°, promedio de 25; círculo con promedio de 100 | P6 |

---

## 3. Cómo se ve cada capa, el ruido y los artefactos

### 3.1 Brillo de cada capa (de adentro del ojo hacia afuera)

| Estructura | Cómo se ve | Fuente |
|---|---|---|
| Vítreo (el gel que llena el ojo) | Negro | P7 |
| Borde vítreo–retina (ILM) | Paso de **oscuro a claro**: el borde más marcado de la imagen | P7 |
| Capa de fibras (RNFL) | Brillante. Junto al nervio es la capa más gruesa | P7 |
| Borde fibras–capa siguiente | Paso de claro a oscuro | P7 |
| Capas internas (células ganglionares, plexiformes, nucleares) | Franjas alternadas, claras las plexiformes y oscuras las nucleares | Conocimiento general de OCT; **sin fuente leída** |
| Retina externa | **Cuatro franjas brillantes** finas: membrana limitante externa, zona elipsoide, zona de interdigitación y epitelio pigmentario con la BM | P22 |
| Epitelio pigmentario (RPE) | Una de las capas **más brillantes** de la imagen | P7 |
| Membrana de Bruch | 2 a 4 µm de grosor: no se separa del epitelio pigmentario en un equipo clínico. **Termina en la BMO** | P22 |
| Coroides | Brillo intermedio y manchado por los vasos; pierde señal hacia abajo | Conocimiento general de OCT; **sin fuente leída** |
| Borde coroides–esclera | Línea oscura y tenue; en modo normal muchas veces no se distingue. En vuelo solo se pudo marcar en **14 de 20** astronautas | P2, P11, P20* |
| Vasos de la retina | Bulto brillante en la capa de fibras y **sombra vertical oscura** debajo | P7 |

### 3.2 Caída de señal con la profundidad

- En este tipo de OCT la sensibilidad baja al alejarse de la línea de referencia ("línea de retardo cero"). En modo normal esa línea queda del lado del vítreo, así que **la coroides y la esclera salen más oscuras** (P20*).
- El modo EDI acerca esa línea a la coroides: la coroides se ve mejor y el vítreo peor (P20*).
- Curva de caída en decibeles por milímetro del Spectralis: **no encontrada**.

### 3.3 Ruido granulado (speckle)

| Aspecto | Dato | Fuente |
|---|---|---|
| Naturaleza | Ruido **multiplicativo**: el grano es más fuerte donde la imagen es más brillante | P17 |
| Modelos usados para la intensidad | Rayleigh, exponencial negativa y gamma. La distribución de Weibull incluye a la exponencial (forma = 1) y a la Rayleigh (forma = 2) | P17 |
| Truco habitual | Aplicar logaritmo convierte el ruido en aditivo y aproximadamente gaussiano | P17 |
| Por capas | Cada capa tiene su propia distribución; la imagen entera se modela como mezcla | P17 |
| Promediado | Promediar más imágenes del mismo corte (ART 16, 25 o 100) reduce el grano. Cuánto exactamente: no encontrado en una fuente leída | — |

### 3.4 Artefactos comunes

Frecuencias medidas en 2.313 exámenes clínicos de Spectralis sobre el nervio, en pacientes de glaucoma (P13); **no son datos de astronautas**.

| Artefacto | Cómo se ve | Frecuencia |
|---|---|---|
| Descentrado | El centro del nervio queda a más del 10 % del centro del barrido | 27,8 % (el más común) |
| Señal pobre | Índice de calidad menor a 15 | Sin cifra leída |
| Borde cortado | La imagen se corta de golpe en un costado | Sin cifra leída |
| Movimiento | Bordes borrosos o parte de la retina fuera del cuadro | Sin cifra leída |
| Imagen incompleta o fuera de cuadro | La retina se sale por arriba o por abajo y faltan capas | Sin cifra leída |
| Parpadeo, imagen espejada, sombra del iris | Descritos en revisiones generales | P23* |
| Algún artefacto | — | 46,3 % de los exámenes |

---

## 4. Cómo cambia la imagen con cada hallazgo de SANS

| Hallazgo | Qué se ve en el corte | Números | Fuente |
|---|---|---|---|
| **Hinchazón del nervio** | La retina se engrosa pegada al nervio; el anillo neural se ensancha y la copa se achica | Ver tabla 1.D. Empieza del lado nasal y avanza rodeando el nervio (examen de fondo de ojo) | P1, P3, N1 |
| Evolución en el tiempo | Sube desde los primeros días y sigue subiendo | TRT +11,9 µm (día 10) y +27,6 (día 150); vuelve a lo normal ~90 días después de volver | P1 |
| **Coroides más gruesa** | La franja entre la BM y la esclera se ensancha | +24 µm en el primer control, **+43 µm** el día 150 (+18 %); hasta +174 en un caso. +20 a los 7 días de volver | P1, N1 |
| **Pliegues de coroides** | La BM y el epitelio pigmentario se ven **ondulados** | Altura máxima 29 a 50 µm; ancho de cada pliegue 0,8 a 1,4 mm; 15 a 23 pliegues en la mácula (un tripulante, misión de un año) | P5 |
| Dónde aparecen | Junto al nervio: arriba, del lado nasal y abajo; casi nunca del lado temporal. En la mácula: avanzan desde el nervio hacia la fóvea | Rugosidad: +2,8 a +13,4 µm junto al nervio | P4 |
| Frecuencia | 6 de 36 tripulantes (17 %), siempre en los dos ojos | En ojos con hinchazón: 24 % | P4 |
| **Pliegues de la retina interna** | Ondulación de la superficie de la retina, lejos del borde del nervio | En ojos con hinchazón: 10 %. Amplitud y separación: no encontradas | P4 |
| **Arrugas junto al nervio** | Ondas finas de la superficie pegadas al nervio | En ojos con hinchazón: 5 %. Amplitud y separación: no encontradas | P4 |
| Pliegues de la retina externa | — | **No se observaron** en tripulantes | P4 |
| Quien tiene pliegues se hincha más | — | Cambio de TRT 54,6 µm mayor que en quienes no tienen pliegues | P4 |
| **Quistes dentro de la retina** | Huecos oscuros, aislados, junto al nervio o dentro de él | Tamaño y frecuencia: no encontrados. Se van solos en ~2 meses tras volver | N1 |
| **Desprendimiento del epitelio pigmentario** | El epitelio se separa de la BM y forma una cúpula | Fuera de la mácula, sobre coroides engrosada; crecen **en alto, no en ancho**. Tamaño y frecuencia: no encontrados | N1 |
| Corrimiento de la BMO hacia atrás | — | Medido después del vuelo; valores no obtenidos | P12 |

---

## 5. Confiabilidad de la medición

### 5.1 De dónde sale el umbral de 19,4 µm (P2)

| Aspecto | Dato |
|---|---|
| Quiénes | **7 astronautas que nunca volaron** (3 hombres, 4 mujeres) |
| Cuándo | 2 sesiones separadas por unos 4 meses (112 a 147 días) |
| Condiciones | Sentado, acostado y con la cabeza inclinada 15° hacia abajo |
| Lectores | 2 lectores independientes revisaron el marcado |
| Estadística | Modelo jerárquico bayesiano con un efecto por lector, postura, sesión y persona. Se suma toda la variación **menos la que hay entre personas** |
| Resultado | 1 desvío estándar = **9,7 µm**. Dos desvíos = **19,4 µm**: un cambio mayor tiene menos de 5 % de probabilidad de ser error o variación normal |
| Cómo lo describen | "Estimación conservadora" del cambio entre dos momentos que marca el primer signo de hinchazón |

### 5.2 Otros márgenes

| Medida | Margen (2 desvíos) | Quiénes | Fuente |
|---|---|---|---|
| Grosor de coroides | **22,2 µm** | Los mismos 7 | P2 |
| Rugosidad de la BM junto al nervio | 2,8 µm | Los mismos | P4 |
| Rugosidad de la BM en la mácula | 2,3 µm | Los mismos | P4 |
| MRW | No encontrado | — | — |
| TRT en los anillos de 500 a 1500 µm | Los cambios medidos en vuelo fueron **menores** que la repetibilidad | 11 astronautas | P1 |

### 5.3 Entre lectores y entre equipos

| Aspecto | Dato | Fuente |
|---|---|---|
| Control de calidad de la NASA | Si dos lectores difieren en **10 % o más**, la medición no pasa; se usa el promedio de los dos | P2 |
| Dos expertos marcando la retina a mano | Difieren 2,22 píxeles en el grosor total (≈ 7 µm), en mácula sana | P7 |
| Dos observadores midiendo coroides | Difieren 2,0 ± 10 µm (máximo 20) | P11 |
| Entre equipos | Los datos anteriores a 2013 son de otro equipo (Cirrus) y dieron otro valor de base: 362 µm contra 392 µm, **en personas distintas**. Comparación directa entre equipos: no encontrada | P1, P3 |
| Entre OCT1 y OCT2 | Diferencia medida: no encontrada. Para misiones lejanas la NASA pide un equipo más chico cuyos datos se puedan comparar con los de OCT1 y OCT2 | N1 |

---

## 6. Algoritmos clásicos para marcar las capas

### 6.1 Teoría de grafos y camino mínimo (Chiu y otros, 2010 — P7)

Cada píxel es un nodo. Un borde entre capas es el **camino más barato** que cruza la imagen de izquierda a derecha.

| Paso | Detalle |
|---|---|
| 1. Aplanar | Suavizar con filtro gaussiano; tomar el píxel más brillante de cada columna como estimación del epitelio pigmentario; descartar saltos de más de 50 píxeles; ajustar un polinomio de grado 2 y desplazar cada columna para que esa curva quede recta |
| 2. Gradientes | Calcular el gradiente vertical y normalizarlo entre 0 y 1. Se arman **dos** imágenes: una para bordes de oscuro a claro y otra para bordes de claro a oscuro |
| 3. Pesos | Cada nodo se une con sus 8 vecinos. Peso de la unión entre *a* y *b*: **w = 2 − (g_a + g_b) + w_min**, con w_min = 0,00001. Gradiente fuerte = peso bajo |
| 4. Extremos automáticos | Agregar una columna a cada lado con peso vertical w_min. Así el camino puede empezar y terminar a cualquier altura |
| 5. Camino mínimo | Algoritmo de Dijkstra entre la esquina superior izquierda y la inferior derecha |
| 6. Orden | Primero el borde vítreo–retina (el más marcado); después el borde de la zona elipsoide. El resto se busca de a uno |
| 7. Limitar la zona de búsqueda | Para cada borde nuevo se quitan del grafo los nodos fuera de la franja donde puede estar (por ejemplo, 20 píxeles por encima de un borde ya encontrado) |
| 8. Vasos | Las columnas con poca señal total se marcan como sombra de vaso y se les pone peso w_min, para que el camino las cruce sin desviarse |

| Resultado publicado | Dato |
|---|---|
| Datos | 10 adultos sanos, **mácula**, otro equipo (3,23 µm por píxel) |
| Error en el grosor total de la retina | 0,94 ± 0,82 píxeles contra un experto (≈ 3 µm). Entre dos expertos: 2,22 ± 1,00 píxeles |
| Error en la capa de fibras | 0,88 ± 0,68 píxeles |
| Tiempo | 9,74 segundos por imagen (computadora de 2010) |
| **Límite declarado** | Supone imágenes centradas en la mácula, **sin el nervio óptico** |

### 6.2 Cómo se detecta la BMO

| Método | Dato | Fuente |
|---|---|---|
| Programa del Spectralis | Marca solo el final de la BM en cada uno de 24 cortes radiales (48 puntos); el operador confirma o corrige | P16 |
| Acierto sin corrección | **87,6 %** de los ojos sanos sin miopía alta; 1,7 % con BMO imposible de ver | P16 |
| Centrado | El fabricante pide que el centro del barrido quede a menos de 100 µm del centro de la BMO | P16 |
| Red neuronal (U-Net) | Error medio de 42,38 µm. **Sin verificar** | P19* |
| Lo que hace la NASA | Marcado automático **revisado y corregido a mano**, verificando que coincida con el de antes del vuelo | P3 |

### 6.3 Dificultades cerca del nervio

- La capa de fibras es difícil de separar cerca del nervio; por eso la NASA usa el grosor total (N1).
- La BM y el epitelio pigmentario **se cortan** en la BMO: un método que busca un camino de lado a lado no tiene borde que seguir dentro del nervio (consecuencia del supuesto de P7; **deducción mía**).
- Los vasos grandes salen por el nervio y dejan sombras anchas (P7 describe el problema en general).
- La BMO es más difícil de ubicar en ojos largos, inclinados o muy ovalados (P16).

---

## 7. Análisis automático ya publicado para SANS: SANS-CNN (P15)

| Aspecto | Dato |
|---|---|
| Qué recibe | Un corte de OCT, llevado a 512 × 512 píxeles y con valores entre 0 y 1 |
| Qué entrega | Una clase: **"SANS" o "Normal"**. No mide ni localiza; muestra mapas de calor de qué zona pesó |
| Modelo | Red convolucional con codificador EfficientNet-v2 preentrenado |
| Datos | Cortes de astronautas rotulados por la NASA. Entrenamiento: 2.506 SANS y 3.797 normales. Validación: 627 y 950. Prueba: 467 y 478. Separados por astronauta |
| Precisión | Exactitud **84,2 %**, especificidad 85,6 %, sensibilidad 82,8 % |
| Límites que declara | Rótulos hechos por distintos expertos a lo largo de años; pocas imágenes; algunos cortes de un ojo con SANS no muestran ningún signo |
| Disponibilidad | **Datos no disponibles.** Código a pedido |

Otros análisis automáticos de OCT específicos para SANS: no encontrados.

---

## 8. Imágenes públicas de referencia

Solo como referencia visual. **No abrí ni descargué los conjuntos de datos**; los datos salen de sus páginas o artículos.

### 8.1 Conjuntos de datos

| Nombre | Qué tiene | Tamaño | Licencia | Link |
|---|---|---|---|---|
| D1 — ODTiD | Cortes horizontales y verticales del nervio óptico, otro equipo (Cirrus). 20 ojos normales y 101 miopes, con marcado manual | 242 imágenes | La del artículo es CC BY-NC 3.0; la del conjunto: no verificada | [ICPSR](https://doi.org/10.3886/E137701V3) · [artículo](https://pmc.ncbi.nlm.nih.gov/articles/PMC8544271/) |
| D2 — Nervio óptico con Spectralis (Rabbani) | 7 ojos sanos y 7 con glaucoma: **24 cortes radiales de 496 × 768** más la imagen de frente | 14 ojos | No indicada en la página | [página](https://hrabbani.site123.me/available-datasets/onh-based-oct-of-7-healthy-and-7-glaucoma-data-captured-by-heidelberg-spectralis) |
| D3 — OCT de hinchazón del nervio (papiledema) | Carpetas: hinchazón (4 grados), falsa hinchazón y normal | No verificado | No verificada (la página no cargó) | [Figshare](https://doi.org/10.6084/m9.figshare.31136554) |

### 8.2 Artículos con figuras de OCT de astronautas

| Fuente | Qué muestra | Acceso |
|---|---|---|
| N1 | Anillos de medición (fig. 2), pliegues (fig. 4), quistes (fig. 7), desprendimientos (fig. 8) | Público, NASA |
| P12 | BMO y su altura (fig. 1), pliegues de coroides (fig. 2) | Abierto, CC BY |
| P15 | Cortes de astronautas con mapas de calor | Abierto, CC BY |
| P3 | Corte radial con ILM, BM, puntos de la BMO, línea de la copa, MRW y anillo de 250 µm (fig. 1) | Gratis en PMC, con derechos de autor |
| P4 | Arrugas, pliegues de retina y de coroides (fig. 2); mapas de altura de la BM (fig. 1) | Gratis en PMC, con derechos de autor |
| P5 | Pliegues de coroides en la mácula a lo largo de un año (fig. 1) | Gratis en PMC, con derechos de autor |

---

## 9. Lo no verificado

**Fuentes no leídas completas**

- **Patel 2018**, el artículo que define los anillos y la altura de la BMO: de pago. Lo cito a través de N1, P12 y los artículos posteriores del mismo grupo.
- **P14\*, P19\*, P20\*, P21\*, P23\*:** solo el resumen o un fragmento. Sus cifras quedan sin verificar.
- **Duración de la sesión de OCT:** fragmento de un documento de la NASA que no abrí.
- **P8 y P13:** leí solo las secciones de método.

**Cálculos míos (marcados `C`)**

- Desvío estándar del TRT entre personas (supone que el error estándar es por persona; el estudio usa los dos ojos).
- Mediana del MRW en la población (baja anual dividida por el porcentaje por década).
- Diámetro equivalente de la BMO, ancho de 1024 píxeles para 20° y milímetros por grado.
- Conversión de píxeles a micrómetros en los errores de P7.

**Contradicciones sin resolver**

- **Ancho del corte en píxeles:** P6 dice 1536 columnas para cortes de 15°; P8 y D2 dicen 768.
- **Coroides junto al nervio antes del vuelo:** 213 µm en una serie (P3) y 169 µm en otra (P2). Son grupos distintos.
- **Primer control de coroides:** P1 escribe "día 7" en el texto, aunque sus controles empiezan el día 10 (con una ventana de 10 días).

**No encontrado**

- Índice de calidad mínimo que exige la NASA.
- Curva de caída de señal con la profundidad del Spectralis.
- Amplitud y separación de las arrugas y de los pliegues de la retina interna.
- Tamaño y frecuencia de quistes y desprendimientos.
- Repetibilidad del MRW con el método de la NASA.
- Comparación directa entre equipos, y entre OCT1 y OCT2.
- Valor normal del TRT del anillo BMO–250 µm en personas que no son astronautas.
- Si el modo EDI es parte del protocolo de rutina en vuelo.

**Otros límites**

- El brillo de las capas internas de la retina es conocimiento general, sin fuente leída.
- Los valores normales de coroides vienen de poblaciones de Turquía e Irán, más jóvenes que los astronautas.
- Las frecuencias de artefactos son de pacientes de glaucoma en Tierra.

## 10. Fuentes

**Texto completo:** *Sí* = conseguido y leído · *Parcial* = leí las secciones de donde salen los datos · *No* = con el motivo.

| ID | Fuente | Texto completo |
|---|---|---|
| N1 | [Informe de evidencia de la NASA sobre SANS, 2022](https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf) | Parcial (secciones de OCT, coroides, pliegues, quistes y monitoreo) |
| N2 | [Informe técnico médico de la NASA OCHMO-MTB-001, 2024](https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf) | Parcial (monitoreo y entrenamiento) |
| P1 | [Macias 2020, cambios oculares en 11 astronautas](https://pmc.ncbi.nlm.nih.gov/articles/PMC7118682/) | Sí (sin el suplemento) |
| P2 | [Laurie 2020, hinchazón y coroides en vuelo y en reposo en cama](https://pmc.ncbi.nlm.nih.gov/articles/PMC6990717/) | Sí |
| P3 | [Pardon 2022, factores asociados a la hinchazón, 31 tripulantes](https://pmc.ncbi.nlm.nih.gov/articles/PMC9614681/) | Sí |
| P4 | [Ferguson 2023, pliegues en 36 tripulantes](https://pmc.ncbi.nlm.nih.gov/articles/PMC9857718/) | Sí (sin el suplemento) |
| P5 | [Macias 2021, dos tripulantes de misión de un año](https://pmc.ncbi.nlm.nih.gov/articles/PMC8085766/) | Sí (sin el suplemento) |
| P6 | [Chauhan 2015, MRW y capa de fibras en 246 personas sanas](https://pmc.ncbi.nlm.nih.gov/articles/PMC4698808/) | Sí (sin las figuras suplementarias) |
| P7 | [Chiu 2010, marcado automático de siete capas](https://pmc.ncbi.nlm.nih.gov/articles/PMC3408910/) | Sí |
| P8 | [Tabla de parámetros del Spectralis en un estudio de repetibilidad, 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7533739/) | Parcial (adquisición) |
| P9 | [Ctori 2015, magnificación ocular en el Spectralis](https://openaccess.city.ac.uk/id/eprint/5850/3/Final%20Manuscript%20-%20for%20repository.pdf) | Parcial (resumen, introducción y discusión; manuscrito aceptado) |
| P10 | [Coroides junto al nervio en 57 personas sanas, 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4525789/) | Parcial (resultados) |
| P11 | [Coroides bajo la mácula en 104 personas sanas, 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5782455/) | Parcial (resultados) |
| P12 | [Lee 2020, revisión de SANS](https://www.nature.com/articles/s41526-020-0097-9) | Parcial (sección de OCT) |
| P13 | [Artefactos en exámenes de Spectralis del nervio, 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4423408/) | Parcial (método y resultado general) |
| P14* | [Asimetría entre ojos de MRW y capa de fibras, 2018](https://doi.org/10.1097/ijg.0000000000001078) | No: solo el resumen |
| P15 | [SANS-CNN, 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC10978911/) | Sí |
| P16 | [Exactitud de la detección de la BMO, 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9754118/) | Parcial (resumen y método) |
| P17 | [Modelo estadístico de imágenes de OCT con mezcla de Weibull, 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8515962/) | Parcial (introducción y modelo) |
| P19* | [Chen 2019, detección de la BMO con U-Net](https://pdfs.semanticscholar.org/0e14/2858e2565c37b3f66ba3326edc05cdeba436.pdf) | No: solo el resumen |
| P20* | [Imagen de la coroides, revisión](https://pmc.ncbi.nlm.nih.gov/articles/PMC4023115/) | No: solo un fragmento |
| P21* | [La escala en profundidad no depende de la magnificación del ojo, 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6005622/) | No: solo un fragmento |
| P22 | [Franjas de la retina externa en OCT, 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8718257/) | Parcial (introducción) |
| P23* | [Artefactos en OCT, revisión de 2014](https://doi.org/10.1016/j.sjopt.2014.02.010) | No: solo un fragmento |
