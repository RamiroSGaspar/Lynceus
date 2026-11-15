# Cómo comunicar resultados de salud inciertos a alguien que no es médico

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* |
| **Fecha** | 14 de noviembre de 2026 |
| **Para qué es** | Decidir **con respaldo** cómo se le muestra al astronauta el resultado de un análisis automático de su ojo (que no es exacto): cómo se dice la incertidumbre, cuándo se avisa y cómo se evita alarmar de más o tranquilizar de más. |
| **Qué no es** | No diseña pantallas ni propone funcionalidades. Entrega recomendaciones de comunicación, cada una con su respaldo, y los valores de las normas listos para usar. |
| **Fuente** | Normas de la NASA para pantallas, avisos y sistemas automáticos (2026, 2023 y 2014), guías de reguladores y experimentos publicados. Lista en la Parte 3. |

### Cómo leerlo

- **Parte 1:** tabla central "pregunta de diseño → recomendación → respaldo → fuente".
- **Parte 2:** detalle de los seis temas, con los valores de las normas.
- **Parte 3:** lo no verificado y las fuentes.

**Tipo de respaldo** (columna "Respaldo"):
`Norma` = requisito de una norma de la NASA; aclaro si es obligatorio (*shall* / *must*) o recomendado (*should*) ·
`Manual` = orientación del manual de diseño de la NASA; no es requisito ·
`Experimento` = estudio con personas **en Tierra**; digo cuántas y si el escenario era hipotético ·
`Revisión` = revisión sistemática de varios estudios ·
`Guía` = documento de consenso o de un regulador ·
`Opinión mía` = deducción propia, no está en la fuente.

**Ninguno de los experimentos citados se hizo con astronautas.** Son personas comunes o médicos, en Tierra, casi siempre ante resultados hipotéticos. Trasladarlos a una tripulación entrenada es una suposición.

**Términos:** *línea de base* (baseline) = el valor del propio astronauta antes del vuelo · *umbral* (threshold) = valor a partir del cual cambia la conducta · *falso positivo* = el análisis marca un problema que no existe · *falso negativo* = no marca un problema que sí existe · *ángulo visual* (visual angle) = tamaño de una letra medido desde el ojo, en grados; depende de la altura de la letra y de la distancia · *fatiga de alertas* (alert fatigue) = dejar de atender avisos porque son muchos o se repiten · *sesgo de automatización* (automation bias) = tendencia a aceptar lo que dice un sistema automático sin revisarlo · *d* = tamaño de un efecto; 0,2 es chico, 0,5 mediano.

---

## Parte 1 — Tabla central

| # | Pregunta de diseño | Recomendación | Respaldo | Fuente |
|---|---|---|---|---|
| 1 | **¿Cómo decir la incertidumbre?** | Dar el valor **con su rango en números** y, además, **dibujar** el rango (una barra). No usar sola una frase vaga ("puede ser algo mayor o menor"). **Es la recomendación con respaldo más débil de la tabla: no hay un método óptimo demostrado.** | `Experimento` (5 experimentos, 5.780 personas, cifras de noticias, **no de salud**): el rango numérico hizo percibir la incertidumbre y bajó poco la confianza en la cifra (d = −0,15); la frase verbal la bajó más (d = −0,55). `Experimento` (240 adultos, riesgo hipotético de cáncer de colon): el rango **escrito** aumentó la preocupación; el rango **dibujado** no. `Guía`: la guía internacional para ayudas de decisión de pacientes pide cautela con los rangos y dice que el mejor método está por determinarse; una revisión de 316 artículos encontró evidencia insuficiente. | F1, F8, G1 |
| 2 | **¿Palabras, números o ambos?** | **Número siempre.** Si se usa una palabra ("probable", "leve"), el número va **pegado a la palabra, en el mismo texto, cada vez**; no en una leyenda aparte. | `Revisión` (10 ensayos, escenarios hipotéticos): las palabras solas ("frecuente", "raro") llevan a sobrestimar la probabilidad más que los números. `Revisión` (316 artículos): evidencia "fuerte" en el mismo sentido. `Experimento` (924 personas): con el rango numérico entre paréntesis junto a la palabra, la interpretación coincidió con la escala oficial en 66 %; sin guía, 32 %; con la tabla en otra ventana, 39 %; con un cartel emergente, 40 %. | F2, G1, F9 |
| 3 | **¿Cómo mostrar un valor frente a un rango o un umbral?** | Sobre una **línea numérica** con el rango marcado, no en una tabla de números. Agregar una **segunda referencia**: el punto a partir del cual el valor preocupa de verdad. Mantener **fija la escala** del gráfico. | `Experimento` (1.620 adultos, EE. UU., resultados de laboratorio hipotéticos): con tabla, el **56 %** calificó igual de urgente una enzima del hígado (ALT) apenas elevada (80 U/L) y una muy elevada (360 U/L); con línea numérica la mayoría las distinguió. `Experimento` (1.618 adultos): al marcar además el punto de preocupación ("muchos médicos no se preocupan hasta acá"), quiso consultar de urgencia por la ALT apenas elevada el **34,7 %**, contra 48,2 a 58,1 % con los otros tres formatos de línea; la reacción ante valores extremos **no** cambió. Los autores advierten que la gente no se adapta bien a escalas que cambian. | F3, F4 |
| 4 | **¿Y frente a la línea de base propia?** | Usar como referencia **el valor u objetivo propio** de la persona y **quitar** el rango poblacional que no le corresponde (no sumar los dos). Rotular qué dato es histórico y cuál es el actual. | `Experimento` (6.776 adultos, hemoglobina glicosilada hipotética): **reemplazar** el rango estándar por el rango objetivo personal mejoró la comprensión y redujo las reacciones negativas; **agregarlo** al rango estándar ayudó menos. `Norma` obligatoria: en un gráfico, los datos históricos se distinguen de los actuales con un rótulo (F.5.8 b). Experimento sobre cómo mostrar el **cambio respecto del valor anterior**: **no encontrado**. | F5, N1 |
| 5 | **¿Qué clases de aviso y qué colores?** | Las cuatro clases de la NASA, cada una con su color fijo: **Emergencia** = rojo intermitente · **Advertencia** (*Warning*, requiere acción inmediata) = rojo · **Precaución** (*Caution*, requiere atención pero no acción inmediata) = amarillo · **Aviso** (*Advisory*, información de rutina o fuera de lo normal que no llega a precaución) = azul. Gris = no disponible. Cian = dato faltante o viejo. | `Norma` obligatoria. `Opinión mía`: un hallazgo de SANS **no** es emergencia ni advertencia en el sentido de la norma, porque el protocolo de la NASA responde al umbral temprano (más de 19,4 µm) con más controles, no con una acción inmediata; le corresponden precaución o aviso. | N1 (tabla 10.3-1; F.5.10; F.6.4) |
| 6 | **¿Alcanza con el color?** | No. Todo significado dado por color lleva **otra señal** (texto, ícono, flecha). El color se usa solo para dar significado, nunca para decorar. | `Norma` obligatoria cuando la información es crítica ([V2 10045]; F.5.10 a y e). Fuera de rango: flecha amarilla o roja hacia arriba o abajo **después** del valor (F.4.3.1 d); en gráficos, color **y** indicador de texto o línea de límite (F.5.8 f). `Manual`: visión anómala del color en hasta 8 % de los varones y menos de 0,5 % de las mujeres. | N1, N2 (5.4.10.6) |
| 7 | **¿Tamaño mínimo de letra?** | Altura de la letra mayúscula ≥ **0,25°** de ángulo visual (mínimo); **0,4° o más** (preferido). Con visión de cerca deteriorada, ir al preferido (criterio mío): a 50 cm son **3,5 mm** de altura de mayúscula (ver tabla en 2.3). | `Norma`: mínimo obligatorio, preferido recomendado (F.5.1 g); rótulos ≥ 0,4° o 12 puntos ([V2 10066]). `Revisión` de estudios de lectura: se lee a velocidad máxima con letras de 0,2° a 2° (medido en la altura de la "x" minúscula); por debajo de 0,15° a 0,3° la velocidad cae en picada. `Opinión mía`: en una letra tipo Arial (supuesto), 0,25° de mayúscula equivale a cerca de 0,18° de "x", en el borde de esa caída. | N1, F10 |
| 8 | **¿Contraste y forma del texto?** | Contraste letra/fondo ≥ **6:1** (mínimo), **10:1** preferido. Letra sin serifa, mayúsculas y minúsculas, ancho fijo en números y tablas, **unidad junto a cada número**, cero antes de la coma decimal. | `Norma` obligatoria (F.5.10 f; F.5.1 d y h; F.5.6 b y f; [V2 10046]), salvo la letra sin serifa, que es recomendada (F.5.1 b). La norma web WCAG 2.2 pide menos: 4,5:1. | N1, G5 |
| 9 | **¿Cuándo avisar y cuándo no?** | Avisar solo al cruzar un **umbral definido de antemano**. **No repetir** un aviso sin información nueva. Un aviso repetido que se sabe falso se silencia, pero queda registrado y visible como texto. | `Manual`: un umbral bajo da muchas falsas alarmas, que desvían la atención y bajan la confianza en el sistema; uno alto deja pasar casos. `Experimento` (112 médicos y enfermeros de atención primaria, 1,6 millones de avisos reales): por cada recordatorio adicional en la misma consulta, la probabilidad de aceptarlo bajó 30 %; por cada 5 puntos porcentuales más de recordatorios repetidos, bajó 10 %. `Norma` obligatoria: suprimir un aviso apaga la señal pero mantiene el mensaje y el registro ([V2 10177]). | N2 (5.7.6.2), F6, N1 |
| 10 | **¿Qué decir siempre sobre los límites del análisis?** | (a) Para qué sirve y **para qué no**. (b) **Por qué** dice lo que dice. (c) **Cuándo no puede ayudar** (imagen mala, caso fuera de lo previsto). (d) Cuánto acierta y en quiénes se probó; si no se sabe, decirlo. (e) Sin frases que lo hagan parecer una persona. (f) Decide el tripulante con su médico. | `Norma` obligatoria: las ayudas a la decisión dan explicación, fundamento y consecuencias ([V2 10170]); avisan cuando el problema supera su capacidad ([V2 10171]); evitan el lenguaje antropomórfico (F.6.2 e). `Guía` de FDA, Health Canada y MHRA (2024): comunicar uso previsto, desempeño, modos de falla conocidos, intervalos de confianza de los resultados, poblaciones mal representadas en los datos y casos en que la entrada no se parece a los datos de desarrollo. | N1 (10.6; F.6.2), G3 |
| 11 | **¿Cómo comunicar un posible falso positivo?** | Con **frecuencias naturales**: "de cada 100 personas con este resultado, tantas tienen el problema", no con porcentajes de sensibilidad. Si ese número **no se conoce** para este análisis, decirlo con esas palabras. | `Experimento` (48 médicos): con probabilidades condicionales estimaron entre 1 % y 90 % la probabilidad de cáncer tras una mamografía positiva (lo correcto era cerca de 8 %); con frecuencias naturales la mayoría acertó o se acercó. Valor predictivo de un análisis automático de SANS: **no relevado** en este documento. | F11 |
| 12 | **¿Cómo mostrar la confianza del algoritmo sin inducir confianza ciega?** | Confianza **de cada resultado** (no una cifra global del sistema). Presentarlo como **información**, no como orden. No darle más protagonismo que al dato medido. | `Experimento` (265 médicos, radiografías de tórax): con consejo correcto acertaron cerca de 40 % más que con consejo equivocado, viniera rotulado como IA o como persona; el 27,5 % de los radiólogos y el 41,7 % de los otros médicos dieron **siempre** el diagnóstico equivocado cuando el consejo era equivocado. `Revisión` (74 estudios): un consejo erróneo del sistema aumentó 26 % el riesgo de decidir mal; lo reducen la confianza actualizada caso por caso, menos protagonismo en pantalla y dar información en vez de órdenes. `Experimento` (72 personas, tarea no médica): mostrar la confianza de cada caso ajustó cuánto se confiaba, pero **no** mejoró el acierto final. | F7, F12, F13 |
| 13 | **¿Quién decide y cuándo se deriva?** | El sistema **informa y sugiere**; decide la persona. Hoy, en la estación, la atención médica la conduce el médico de vuelo desde Tierra. | `Norma` obligatoria: el operador humano tiene la autoridad final y decide cuándo usar la ayuda (10.6; [V2 10169]). La atención médica en misión la conduce el médico de vuelo (N3, 3.1.5). Regla de la NASA sobre qué hallazgos de SANS puede manejar la tripulación sola: **no encontrada**. | N1, N3 |

---

## Parte 2 — Detalle por tema

### 2.1 Comunicación de riesgo e incertidumbre

| Estudio | Quiénes | Qué compararon | Resultado | Límite |
|---|---|---|---|---|
| F1 | 5.780 personas en 5 experimentos (uno en el sitio de BBC News) | Cifra sola, con rango numérico, o con frase de incertidumbre | Metaanálisis de los 4 experimentos en línea. Efecto sobre la confianza en la cifra: rango numérico d = −0,15; frase verbal d = −0,55. Sobre la confianza en la fuente: numérico d = −0,03 (no significativo); verbal d = −0,21 | Cifras de noticias (desempleo, migración, temperatura global, tigres en India); no resultados médicos propios |
| F8 | 240 adultos de 40 a 74 años, EE. UU. | Riesgo de cáncer como valor único o como rango; en texto o en gráfico | Rango en texto: más preocupación. Rango en gráfico de barra: menos riesgo percibido y menos preocupación que con el valor único | Hipotético. En un segundo experimento, con formatos mejorados, texto y gráfico no difirieron |
| F2 | 10 ensayos, Reino Unido; casi todos con público general | Frecuencia de efectos adversos en palabras o en números | Sobrestimación con palabras: promedios de 3 a 54 %; con números: de 2 a 20 %. Solo entre 9 y 50 % de quienes vieron números dio la probabilidad correcta | Hipotético. Las palabras eran las de los prospectos europeos |
| F9 | 924 personas, sobre todo de Australia | Palabras de probabilidad con el rango numérico al lado, en tabla aparte, en cartel emergente o sin guía | Coincidencia con la escala oficial: 66 % con el número al lado; 39 % con tabla aparte; 40 % con cartel emergente; 32 % sin guía | Informes de inteligencia, no salud |
| F3 | 1.620 adultos, EE. UU. | Resultado de laboratorio en tabla o en tres tipos de línea numérica | Con tabla, 56 % no distinguió urgencia entre ALT 80 y 360 U/L (44 % para creatinina). Dispuestos a esperar ante la ALT apenas elevada: 26,9 % con tabla; 42,0 a 51,8 % con línea | Hipotético. Los valores extremos se percibieron urgentes con todos los formatos |
| F4 | 1.618 adultos, EE. UU. | Línea numérica con y sin "punto de preocupación" | Querían consultar de urgencia por ALT apenas elevada: 34,7 % con el punto; 55,8 %, 58,1 % y 48,2 % sin él. Creatinina: 35,2 % contra 52,3 a 56,7 % | Hipotético. Sin efecto claro en plaquetas. El punto de preocupación es un juicio clínico y puede discutirse |
| F5 | 6.776 adultos | Rango estándar, rango objetivo personal, o ambos | Solo el rango objetivo: mejor comprensión y menos reacción negativa ante un valor entre ambos rangos | Hipotético. Con bloques de colores ayudó menos |
| F11 | 48 médicos con 14 años de experiencia en promedio | Probabilidades condicionales o frecuencias naturales | Con probabilidades, respuestas de 1 a 90 %; con frecuencias, la mayoría cerca de lo correcto | Es un artículo educativo que resume estudios previos de los autores |
| F6 | 112 médicos y enfermeros, Nueva York, 2010 a 2013 | Aceptación de avisos según cantidad y repetición | −30 % por cada recordatorio adicional por consulta; −10 % por cada 5 puntos más de repetidos. Un cuarto a un tercio de los avisos eran repetidos | Observacional. No halló "acostumbramiento" con el tiempo a un aviso nuevo |

**Qué dice la guía internacional (G1, que resume las recomendaciones IPDAS de 2021 y las contrasta con 316 artículos):**

| Recomendación | Evidencia según la revisión |
|---|---|
| Usar números y no solo palabras de probabilidad | Fuerte |
| Gráficos que muestran la parte **y** el todo (por ejemplo, matriz de íconos), no solo los casos | Fuerte |
| Evitar el formato "1 de cada X" y usar el mismo denominador siempre | Fuerte |
| Rótulos, símbolos o colores que den el sentido general ("alto", "límite") | Débil; advierten que pueden sesgar |
| Comunicar la incertidumbre con rangos | Insuficiente; se recuerda mejor un valor único que un rango (evidencia débil) |

**Escala fija de palabras ligada a probabilidades.** El ejemplo más usado es el del panel de clima de la ONU (IPCC) (G2): *virtually certain* 99–100 % · *very likely* 90–100 % · *likely* 66–100 % · *about as likely as not* 33–66 % · *unlikely* 0–33 % · *very unlikely* 0–10 % · *exceptionally unlikely* 0–1 %. Está pensada para informes científicos, no para resultados médicos de una persona. Una escala equivalente validada para resultados médicos individuales: **no encontrada**.

**Falsa tranquilidad.** La única revisión sistemática que encontré (X2, 9 estudios) concluye que hay **poca evidencia** de que un resultado negativo de cribado cambie conductas o percepción de riesgo, con estudios de baja calidad. **Sin verificar:** solo leí el resumen.

### 2.2 Resultados de algoritmos frente al usuario

| Qué debe decirse | Quién lo pide | Fuente |
|---|---|---|
| Propósito médico, enfermedad a la que apunta, usuarios y ambiente de uso previstos, entradas y salidas | FDA, Health Canada y MHRA, 2024 (principios, no ley) | G3 |
| Si el resultado está pensado para **informar** o para **reemplazar** el juicio de un profesional | Ídem | G3 |
| Desempeño, beneficios y riesgos; "lógica" del resultado cuando se pueda explicar | Ídem | G3 |
| Límites: sesgos o modos de falla conocidos; **intervalos de confianza** de los resultados; poblaciones poco representadas en los datos; casos en que la entrada no se parece a los datos de desarrollo | Ídem | G3 |
| Avisos en pantalla en pasos de alto riesgo o cuando aparecen ciertas entradas o salidas | Ídem | G3 |
| Que quien supervisa entienda capacidades y límites, **tenga presente el sesgo de automatización**, pueda interpretar la salida y pueda **no usarla o descartarla** | Reglamento europeo de inteligencia artificial, artículo 14.4 (sistemas de alto riesgo) | G4 |
| Estado del sistema, su "salud" y la **incertidumbre** de sus proyecciones, para que el operador ajuste cuánto confiar | NASA, obligatorio ([V2 10161]) | N1 |
| Explicación, fundamento y consecuencias de cada recomendación; aviso cuando el caso supera a la herramienta | NASA, obligatorio ([V2 10170], [V2 10171]; F.6.2 g e i) | N1 |
| Posibilidad de revisar la información que usó el sistema automático | NASA, obligatorio (F.6.2 f) | N1 |

| Estudio | Quiénes | Resultado | Límite |
|---|---|---|---|
| F7 | 138 radiólogos y 127 médicos clínicos o de urgencias; 8 radiografías cada uno, 2 con consejo equivocado | Con consejo correcto acertaron 40,1 % más (radiólogos) y 37,5 % más (no expertos) que con consejo equivocado. El rótulo "IA" o "radiólogo" no cambió el acierto | El consejo lo escribieron personas; solo cambió el rótulo |
| F12 | Revisión de 74 estudios, salud y aviación | En 4 estudios de salud: riesgo relativo 1,26 (intervalo de 1,11 a 1,44) de decidir mal con consejo erróneo. En 6 a 11 % de los casos, una decisión correcta se cambió por una incorrecta tras el consejo | Los autores llaman "indicativo" a ese metaanálisis |
| F13 | 72 personas en línea; predecir ingresos, no medicina | Con la confianza visible, siguieron más al sistema cuando la confianza era alta y menos cuando era baja. El acierto final **no** mejoró | Humano y sistema acertaban parecido (65 y 75 %) |

### 2.3 Normas de la NASA para pantallas y avisos

Todo sale de **NASA-STD-3001 volumen 2, revisión F (julio de 2026)** (N1), salvo donde dice N2. El **apéndice F** ("Display Standard") aplica a pantallas de vuelo, incluidas computadoras portátiles y tabletas. *Must* = obligatorio y se verifica; *should* = meta esperada.

| Tema | Valor | Carácter | Dónde |
|---|---|---|---|
| Clases de aviso y prioridad | 1 Emergencia por fuego · 2 Emergencia de otro tipo · 3 Advertencia · 4 Precaución · 5 Aviso | Obligatorio | Tabla 10.3-1 |
| Definiciones | Emergencia: crítica en el tiempo, para evitar la pérdida de la tripulación o de la misión. Advertencia: requiere acción inmediata. Precaución: requiere atención, no acción inmediata. Aviso: configuración u operación normal, o información de rutina | — | Apéndice de definiciones |
| Color por clase | Emergencia y advertencia: rojo (emergencia, intermitente). Precaución, fuera de lo normal o "requiere atención": amarillo. Aviso: azul | Obligatorio | F.5.10; F.6.4 |
| Otros colores | Gris: no disponible. Cian: dato faltante o viejo. Verde, solo en luces indicadoras: encendido, habilitado, buen estado. **La tabla de colores de pantallas no asigna un color a "normal"** | Obligatorio | Tablas F.5-1 y 10.4-3 |
| Señal doble | Emergencia, advertencia y precaución se ven **y** se oyen; el aviso puede no tener sonido | Obligatorio | [V2 10114] |
| Color con otra señal | Siempre que el color dé significado en información crítica | Obligatorio | [V2 10045] |
| Intermitencia y video inverso | Reservados para lo que requiere atención o acción inmediata. 0,8 Hz (baja prioridad) y 3 Hz (alta). La tripulación puede cortar la intermitencia que dure más de 10 s | Obligatorio | F.5.10 g; F.5.11 |
| Altura de letra | Mínimo 0,25°; preferido 0,4° o más (altura de la mayúscula). Ejemplo de la norma: 0,25° = 10 puntos a 81 cm | Obligatorio / preferido | F.5.1 g |
| Rótulos | Mínimo 12 puntos o 0,4° | Obligatorio | [V2 10066] |
| Tipo de letra | Sin serifa (recomendado). Distinguir l de 1 y O de 0. Ancho fijo para números y tablas; proporcional para texto corrido. Mayúsculas y minúsculas | Obligatorio salvo lo indicado | F.5.1 |
| Zoom | Poder ampliar temporalmente una zona de la pantalla | Recomendado | F.5.1 f |
| Contraste letra/fondo | 6:1 o más; 10:1 preferido | Obligatorio | F.5.10 f |
| Pantalla | Luminancia del blanco mayor a 100 cd/m² (400 preferido); contraste de 100:1 con luz ambiente (1000:1 preferido); 32 píxeles por grado en pantallas de imagen (64 preferido) | Obligatorio | Tabla 10.4-2 |
| Números | Unidad en cada valor. Los decimales que la tarea necesita. Cero antes de la coma (0,25). Signo menos siempre; signo más solo si la tarea lo requiere | Obligatorio | F.5.6 |
| Gráficos | Título arriba; rótulo y unidad en cada eje; leyenda; lo histórico distinguido de lo actual; fuera de rango resaltado con color **y** texto o línea de límite | Obligatorio | F.5.8 |
| Valor fuera de umbral | Flecha amarilla o roja, hacia arriba o abajo, después del valor. Indicar cuando el dato es viejo | Obligatorio | F.4.3.1 c y d |
| Carga mental | Información en forma directamente usable, sin cálculos mentales. Solo lo necesario para la tarea | Obligatorio / recomendado | F.4.1 a y e |
| Mensajes de error | Qué está mal, qué se puede hacer y qué lo causó | Recomendado | F.4.3.3 c |
| Avisos repetidos | Suprimir apaga luz y sonido, pero el texto se muestra y el evento se registra. El sistema recuerda qué avisos están inhibidos | Obligatorio | [V2 10177], [V2 10156] |
| Distancia de lectura | 50 cm por defecto (norma HFES 2007); no menos de 40 cm (ISO 13406-2); la vieja norma de la NASA sugería 33 cm mínimo y 51 cm preferido | Referencia | N2, 10.3.2.1 |
| Daltonismo en rótulos | No usar rojo y verde en el mismo conjunto; elegir colores que distingan quienes ven mal el color | Recomendado | N2, 10.6.19 y 10.11.5.5 |

**Altura de la letra mayúscula según la distancia** (cálculo mío: altura = 2 × distancia × tangente de medio ángulo; el tamaño de fuente supone una letra tipo Arial, cuya mayúscula mide cerca de 0,72 del cuerpo: **supuesto no verificado en fuente**):

| Distancia | 0,25° (mínimo) | 0,4° (preferido) |
|---|---|---|
| 40 cm | 1,7 mm (fuente de ~7 puntos) | 2,8 mm (~11 puntos) |
| 50 cm | 2,2 mm (~9 puntos) | 3,5 mm (~14 puntos) |
| 60 cm | 2,6 mm (~10 puntos) | 4,2 mm (~17 puntos) |
| 70 cm | 3,1 mm (~12 puntos) | 4,9 mm (~19 puntos) |

Los puntos de esta tabla dan más que el ejemplo de la norma (10 puntos a 81 cm para 0,25°) porque la norma, en ese ejemplo, toma el tamaño en puntos como si fuera la altura de la letra. Para programar conviene fijar la **altura en milímetros** y medirla en la pantalla real.

**Convenciones de las pantallas de la estación.** Las computadoras de comando (PCS) siguen la norma SSP 50313 (*Display and Graphics Commonality Standard*); las pantallas de experimentos se revisan contra el apéndice T de SSP 57000 y metas de uso derivadas de ISO 9241, a cargo de un panel conjunto con los socios internacionales (IDAGS). En la estación se usan tabletas y teléfonos comerciales para experimentos y encuestas (N7). **El contenido de SSP 50313 y de SSP 57000 no lo leí.**

### 2.4 Lectura con visión de cerca deteriorada

| Dato | Valor | Tipo | Fuente |
|---|---|---|---|
| Quejas de visión de cerca en misiones largas | 48 % de los astronautas | Medido en astronautas (cuestionario) | N8, cita a Mader 2011 |
| Empeoramiento de la agudeza de lejos o de cerca | 29 % tras misiones cortas; 60 % tras misiones largas | Medido en astronautas (cuestionario) | N8, N2 |
| Cambio de graduación hacia hipermetropía | Promedio 0,84 D en 7 astronautas; hasta +2,00 D en una misión | Medido en astronautas, después del vuelo | N2 (5.4.12.1), N8 |
| ¿Se corrige? | Todos los casos conocidos llegaron a 20/20 con anteojos nuevos. Cada tripulante lleva al menos 3 pares de distinta graduación | Medido / práctica actual | N8, N9; requisito [V1 3004 g] en N3 |
| Capacidad de enfocar de cerca | Baja con la edad; "esencialmente ausente" después de los 50 años | Personas en Tierra | N2 (5.4.5) |
| Agudeza y sensibilidad al contraste | Bajan 0,07 a 0,11 unidades logarítmicas por década en adultos | Personas en Tierra | N2 (5.4.8.6) |
| Distancia que alivia el enfoque | Más de 49 cm (valor "a revisar", dado para pantallas usadas con vibración o aceleración) | Recomendación de manual | N2 (5.3.4.4) |
| Esfuerzo de enfoque según distancia | 40 cm = 2,5 D · 50 cm = 2,0 D · 70 cm = 1,4 D | **Cálculo mío** (1 dividido la distancia en metros) | — |
| Tamaño para leer a velocidad máxima | "x" minúscula entre 0,2° y 2°. Tamaño crítico (debajo del cual la velocidad cae): 0,15° a 0,3° según la persona. Leer letra de 0,2° exige imagen bien enfocada | Personas en Tierra con visión normal | F10 |
| Contraste | NASA 6:1 mínimo y 10:1 preferido; WCAG 2.2: 4,5:1 (3:1 en letra grande, de 18 puntos o 14 en negrita) | Norma | N1, G5 |
| Daltonismo y contraste | No distinguir tonos no afecta la percepción del contraste claro-oscuro | Afirmación de la guía WCAG | G5 |
| Daltonismo, frecuencia | Hasta 8 % de varones (la forma más común, 4,6 %); menos de 0,5 % de mujeres | Población general | N2 (5.4.10.6) |
| ¿Hay astronautas daltónicos? | **No encontrado.** El manual solo dice "si esto se permite" | — | N2 |
| Tamaño de letra recomendado para hipermetropía sin corregir | **No encontrado** con cifra | — | — |

`Opinión mía`: un astronauta mayor de 40 años con +0,75 D o más de cambio y sin el par de anteojos adecuado es el lector más exigido. Para ese caso, los valores **preferidos** de la norma (0,4°, 10:1) y una distancia de 50 cm o más son la opción prudente; no encontré un estudio que lo mida.

### 2.5 Autonomía médica en misiones lejanas

| Punto | Qué dice | Fuente |
|---|---|---|
| Situación actual en órbita baja | La tripulación descarga en Tierra muchas decisiones médicas, el monitoreo y otras tareas (médicos de vuelo, especialistas, ingenieros biomédicos) | N4 |
| Definición de operaciones médicas independientes de la Tierra (EIMO) | "Transición gradual de la atención y de la decisión médica de recursos en Tierra a recursos en el espacio…" | N4 |
| Es un espectro | Se acordó entenderla "menos como un punto final y más como un espectro" | N4 (taller de directivos, opinión experta) |
| Papel de un sistema de apoyo a la decisión | Inventario, historia clínica, **resaltar tendencias en los datos**, recordatorios y hasta sugerencias de diagnóstico y tratamiento. Debe ser fácil, intuitivo, confiable y rápido | N4 (propuesta, no requisito) |
| Riesgo | Más tareas y más cambio de tarea para el oficial médico de a bordo; eso deteriora las decisiones | N4 |
| Demora de comunicaciones | Tierra–Luna: unos 3 s. Tierra–Marte: unos 10,5 a 21 minutos | N2 (10.13.1.4) |
| Sin tiempo real | Las conferencias médicas privadas pueden pasar a mensajes diferidos | N3 ([V1 6002]) |
| Autoridad | El operador humano tiene la autoridad final y puede anular o apagar el sistema | N1 (10.6; [V2 10165]) |
| Cuándo usar la ayuda | Lo decide el operador, y también qué estrategia de ayuda usar | N1 ([V2 10169]) |
| Cuándo derivar | La ayuda avisa cuando el problema la supera, para buscar otra vía "por ejemplo, llamar a Tierra" | N1 ([V2 10171]) |
| Reparto de tareas | Indicar el nivel de automatización vigente y quién hace cada tarea, la persona o el sistema | N1 ([V2 10164]; F.6.2 a y b) |

**Niveles de automatización que usa el manual de la NASA** (Sheridan 2002; N2, tabla 10.13-1): 1 la persona hace todo · 2 el sistema sugiere alternativas · 3 sugiere una sola · 4 la ejecuta si la persona aprueba · 5 da un tiempo limitado para vetar · 6 ejecuta y luego informa · 7 ejecuta e informa solo si se le pregunta · 8 ejecuta e ignora a la persona. `Opinión mía`: informar un resultado y sugerir un paso corresponde a los niveles 2 o 3.

Niveles de autonomía definidos por la NASA **específicamente para decisiones médicas**: **no encontrados**.

### 2.6 Cómo se le comunican hoy los resultados médicos a un astronauta

| Punto | Qué se sabe | Fuente |
|---|---|---|
| Conferencia médica privada (*private medical conference*, PMC) | Semanal, entre cada astronauta y su médico de vuelo, que la hace desde un lugar con privacidad visual y auditiva | N6, N5 |
| Quién la programa | El médico de vuelo, con frecuencia según la duración de la misión | N3 ([V1 6002]) |
| Confidencialidad | El médico no informa los detalles al control de misión; si algo puede afectar la misión, avisa al director de vuelo (y al comandante) | N6, N5 |
| Marco legal | Ley de privacidad de EE. UU. de 1974. Los registros médicos se guardan y transmiten de forma segura. Las agencias socias acceden a la información de salud de la tripulación | N3 ([V1 6003], [V1 7003]), N5 |
| Datos médicos hacia Tierra | Transmisión privada, incluidas las imágenes | N3 ([V1 3004 s]) |
| Durante el examen de ojos | Desde Tierra participan un guía remoto (la única persona que le habla a la tripulación), un especialista que mira la cabina y los datos, y un ingeniero biomédico | N9 |
| Después del examen | Un informe resumen va al médico de la tripulación | Contexto común del proyecto. **No lo encontré en el texto de N8 ni de N9: sin verificar por mí** |
| ¿El astronauta ve a bordo su propio resultado numérico? ¿En qué formato se lo devuelven? | **No encontrado** | — |

---

## Parte 3 — Lo no verificado y las fuentes

### Lo no verificado

- **Ningún experimento es con astronautas** ni con resultados de ojos. Todo traslado es una suposición.
- **Cómo comunicar la incertidumbre** no tiene método óptimo demostrado (G1). La fila 1 de la tabla combina evidencia parcial con criterio propio.
- **Guía internacional IPDAS 2021** (Bonner y otros): no pude descargar el texto completo (el sitio bloqueó la descarga y no hay copia abierta). La conozco por G1, que cita sus recomendaciones una por una.
- **Falsa tranquilidad** (X2): solo el resumen; el artículo es de pago.
- **Reglamento europeo, artículo 14** (G4): el sitio oficial bloqueó la descarga; leí el texto del artículo en un sitio no oficial que lo reproduce.
- **Tamaños de fuente en puntos** de la tabla de 2.3: cálculo mío con un supuesto sobre la letra. Las alturas en milímetros son geometría pura.
- **No encontrado:** experimento sobre cómo mostrar el cambio respecto del valor anterior · escala de palabras validada para resultados médicos individuales · tamaño de letra con cifra para hipermetropía sin corregir · si hay astronautas daltónicos · niveles de autonomía médica definidos por la NASA · regla sobre qué hallazgos de SANS maneja la tripulación sola · si el astronauta ve a bordo su propio resultado.
- **No relevado:** valor predictivo o tasa de falsos positivos de un análisis automático de SANS (corresponde a otro documento) · contenido de SSP 50313 y de SSP 57000 apéndice T · guía de la OMS sobre inteligencia artificial en salud · consecuencias psicológicas de los falsos positivos.
- **Informe resumen al médico de la tripulación tras cada examen** (2.6): viene del contexto común del proyecto; no lo encontré en el texto de los dos informes de la NASA sobre SANS.

### Fuentes

| Código | Fuente | ¿Leí el texto completo? |
|---|---|---|
| N1 | [NASA-STD-3001, volumen 2, revisión F, aprobada el 14/7/2026](https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf) — [ficha](https://standards.nasa.gov/standard/NASA/NASA-STD-3001_VOL_2) | Sí: 5.1.7, 10.3, 10.4.2, 10.4.3, 10.6, definiciones y apéndice F completo |
| N2 | [Human Integration Design Handbook, NASA/SP-2010-3407 revisión 1, 2014](https://www.nasa.gov/wp-content/uploads/2023/03/human-integration-design-handbook-revision-1.pdf) | Sí, las secciones citadas: 5.3.4.4, 5.4 (óptica, edad, color, agudeza en vuelo), 5.7.6.2, 10.3.2.1, 10.3.2.7, 10.13.1. La figura 10.3-16 (tamaños según otras normas) es una imagen y no la pude leer |
| N3 | [NASA-STD-3001, volumen 1, revisión C, 2023 (vigente según la ficha oficial)](https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf) | Sí: 3.1.5, 3.1.6, 6.2, 6.3.2, 7.2 y 7.3 |
| N4 | [Earth Independent Medical Operations (EIMO) Definition Workshop, NASA/TM-20240002454, 2024](https://ntrs.nasa.gov/citations/20240002454) | Sí |
| N5 | [OCHMO-TB-044, Medical Operations (informe técnico de la NASA)](https://www.nasa.gov/wp-content/uploads/2025/08/ochmo-tb-044-medical-operations.pdf) | Parcial: funciones, conferencias privadas y manejo de información médica |
| N6 | [NASA: Flight Surgeons](https://www.nasa.gov/directorates/esdmd/hhp/flight-surgeons/) | Sí |
| N7 | [Introduction to ISS Crew Displays, NASA, 2020](https://ntrs.nasa.gov/citations/20205011808) | Parcial: las tres primeras páginas |
| N8 | [Informe de evidencia de la NASA sobre SANS, 2022](https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf) | Sí, la sección de error de refracción y la tabla comparativa (copia local) |
| N9 | [OCHMO-MTB-001, SANS, 2024](https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf) | Sí, las secciones de asistencia desde Tierra y de anteojos (copia local) |
| F1 | [van der Bles y otros 2020, PNAS: comunicar incertidumbre y confianza](https://pmc.ncbi.nlm.nih.gov/articles/PMC7149229/) | Parcial: resumen, experimentos 1 a 3 y metaanálisis interno. No leí el detalle del experimento en BBC News ni el apéndice |
| F2 | [Büchter y otros 2014: palabras o números](https://pmc.ncbi.nlm.nih.gov/articles/PMC4153005/) | Sí, salvo los archivos adicionales. Los rangos 3–54 % y 2–20 % figuran en el resumen del artículo; el detalle por estudio está en un archivo adicional que no abrí |
| F3 | [Zikmund-Fisher y otros 2017: gráficos para resultados de laboratorio](https://pmc.ncbi.nlm.nih.gov/articles/PMC5565988/) | Sí |
| F4 | [Zikmund-Fisher y otros 2018: punto de preocupación](https://pmc.ncbi.nlm.nih.gov/articles/PMC5891666/) | Sí |
| F5 | [Scherer y otros 2018: rangos objetivo](https://pmc.ncbi.nlm.nih.gov/articles/PMC6231727/) | Parcial: resumen, métodos y resultados principales |
| F6 | [Ancker y otros 2017: fatiga de alertas](https://pmc.ncbi.nlm.nih.gov/articles/PMC5387195/) | Parcial: resumen, métodos y primeros resultados |
| F7 | [Gaube y otros 2021: consejo de IA a médicos](https://pmc.ncbi.nlm.nih.gov/articles/PMC7896064/) | Parcial: resumen, diseño y resultados |
| F8 | [Han y otros 2011: incertidumbre en riesgo de cáncer](https://pmc.ncbi.nlm.nih.gov/articles/PMC3086475/) | Parcial: resumen, métodos y resultados |
| F9 | [Wintle y otros 2019: probabilidades verbales](https://pmc.ncbi.nlm.nih.gov/articles/PMC6469752/) | Parcial: resumen, métodos y resultado principal |
| F10 | [Legge y Bigelow 2011: tamaño de letra y lectura](https://pmc.ncbi.nlm.nih.gov/articles/PMC3428264/) | Parcial: definiciones, rango fluido y tamaño crítico |
| F11 | [Gigerenzer y Edwards 2003, BMJ: frecuencias naturales](https://pmc.ncbi.nlm.nih.gov/articles/PMC200816/) | Parcial: tabla de recomendaciones, sección de probabilidades condicionales y conclusiones |
| F12 | [Goddard y otros 2012: sesgo de automatización, revisión](https://pmc.ncbi.nlm.nih.gov/articles/PMC3240751/) | Parcial: resultados, causas, mitigación y conclusión |
| F13 | [Zhang y otros 2020: confianza y explicación en decisiones con IA](https://arxiv.org/abs/2001.02114) | Parcial: experimento 1 |
| G1 | [Zikmund-Fisher, Benda y Ancker 2025: evidencia frente a las recomendaciones IPDAS](https://pmc.ncbi.nlm.nih.gov/articles/PMC12236432/) | Parcial: resumen y las secciones de principios, rótulos, incertidumbre y formatos visuales |
| G2 | [IPCC, nota de orientación sobre incertidumbre, 2010](https://www.ipcc.ch/site/assets/uploads/2017/08/AR5_Uncertainty_Guidance_Note.pdf) | Solo la tabla 1 |
| G3 | [FDA, Health Canada y MHRA 2024: transparencia en dispositivos médicos con aprendizaje automático](https://www.fda.gov/medical-devices/software-medical-device-samd/transparency-machine-learning-enabled-medical-devices-guiding-principles) | Sí |
| G4 | [Reglamento (UE) 2024/1689, artículo 14](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) — leído en [artificialintelligenceact.eu](https://artificialintelligenceact.eu/article/14/) | Solo el artículo 14.4, en sitio no oficial |
| G5 | [WCAG 2.2, criterio 1.4.3, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | Sí, el criterio y su intención |
| X1* | [Bonner y otros 2021, guía IPDAS](https://journals.sagepub.com/doi/full/10.1177/0272989X21996328) | No: descarga bloqueada, sin copia abierta |
| X2* | [Cooper, Harvie y French 2017: falsa tranquilidad](https://pubmed.ncbi.nlm.nih.gov/28895257/) | No: solo el resumen; es de pago |
