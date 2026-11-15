# Cómo comunicar resultados de salud inciertos a alguien que no es médico

| | |
|---|---|
| **Hackatón** | NASA Space Apps Challenge 2026 — 14 y 15 de noviembre de 2026 |
| **Desafío** | *Create Health Monitoring Software for Astronauts on Space Missions* |
| **Fecha** | 14 de noviembre de 2026 |
| **Para qué es** | Decidir **con respaldo** cómo se le muestra al astronauta el resultado de un análisis automático de su ojo (que no es exacto): cómo se dice la incertidumbre, cuándo se avisa, y cómo se evita alarmar de más o tranquilizar de más. |
| **Qué no es** | No diseña pantallas ni propone funcionalidades. Entrega recomendaciones de comunicación, cada una con su respaldo, y los valores de las normas listos para usar. |
| **Estado** | **Primer commit:** tabla central. Las celdas que dicen *por verificar* se completan en el segundo commit. |

### Cómo leerlo

- **Parte 1:** tabla central "pregunta de diseño → recomendación → respaldo → fuente".
- **Parte 2 (segundo commit):** detalle por tema, con los valores de las normas.
- **Parte 3:** lo no verificado y las fuentes.

**Tipo de respaldo** (columna "Respaldo"):
`Norma` = requisito de una norma de la NASA; aclaro si es obligatorio (*shall* / *must*) o recomendado (*should*) ·
`Experimento` = estudio con personas **en Tierra**; digo cuántas y si el escenario era hipotético ·
`Revisión` = revisión sistemática de varios estudios ·
`Guía` = documento de consenso o de un regulador ·
`Opinión mía` = deducción propia, no está en la fuente.

**Ninguno de los experimentos citados se hizo con astronautas.** Son personas comunes o médicos en Tierra. Trasladarlos a una tripulación entrenada es una suposición.

**Términos:** *línea de base* (baseline) = el valor del propio astronauta antes del vuelo · *umbral* (threshold) = valor a partir del cual cambia la conducta · *falso positivo* = el análisis marca un problema que no existe · *falso negativo* = el análisis no marca un problema que sí existe · *ángulo visual* (visual angle) = tamaño de una letra medido desde el ojo, en grados; depende de la altura de la letra y de la distancia · *fatiga de alertas* (alert fatigue) = dejar de atender avisos porque hay demasiados o se repiten.

---

## Parte 1 — Tabla central

| # | Pregunta de diseño | Recomendación | Respaldo | Fuente |
|---|---|---|---|---|
| 1 | **¿Cómo decir la incertidumbre?** | Dar el **número con su rango** (formato: "+22 µm, rango de +3 a +41 µm"; las cifras de este ejemplo son inventadas), no solo una frase del tipo "podría ser algo mayor o menor". | `Experimento` (4 experimentos en línea y 1 en el sitio de BBC News, sobre cifras de noticias, **no de salud**): el rango numérico junto al valor hizo percibir la incertidumbre **sin** bajar de forma significativa la confianza en la cifra; la frase verbal explícita sí la bajó. | F1 |
| 2 | **¿Palabras, números o ambos?** | Números siempre; la palabra acompaña, no reemplaza. | `Revisión` (10 ensayos): las palabras solas ("frecuente", "raro") hacen sobrestimar la probabilidad más que los números. *Cifras por verificar en el texto completo.* | F2 |
| 3 | **¿Cómo mostrar un valor frente a un rango o un umbral?** | Sobre una **línea numérica** con el rango marcado, no en una tabla de números. Agregar una **segunda referencia**: el punto a partir del cual el valor preocupa de verdad. | `Experimento` (1.620 adultos, EE. UU., resultados de laboratorio hipotéticos): con tabla, el **56 %** calificó igual de urgente una enzima del hígado (ALT) apenas elevada (80 U/L) y una muy elevada (360 U/L); con línea numérica la mayoría las distinguió. `Experimento` (1.618 adultos): marcar además el punto de preocupación ("muchos médicos no se preocupan hasta acá") ante la ALT apenas elevada, quiso consultar de urgencia el **34,7 %**, contra 48,2 a 58,1 % con los otros tres formatos de línea; la reacción ante valores extremos **no** cambió. | F3, F4 |
| 4 | **¿Y frente a la línea de base propia?** | Mostrar como referencia el **objetivo o valor propio** de la persona, no un rango poblacional que no le corresponde. *Evidencia directa sobre "cambio respecto del valor anterior": por verificar.* | `Experimento` (6.776 adultos, hemoglobina glicosilada hipotética): reemplazar el rango estándar por el rango objetivo personal mejoró la comprensión y redujo las reacciones negativas; **agregarlo** al rango estándar no ayudó. | F5 |
| 5 | **¿Qué clases de aviso y qué colores?** | Usar las cuatro clases de la NASA con su color fijo: **Emergencia** = rojo intermitente · **Advertencia** (*Warning*, requiere acción inmediata) = rojo · **Precaución** (*Caution*, requiere atención pero no acción inmediata) = amarillo · **Aviso** (*Advisory*, información de rutina) = azul. Gris = no disponible. Cian = dato faltante o viejo. | `Norma` obligatoria. Un resultado de SANS **no es** una emergencia ni una advertencia en el sentido de la norma: el propio protocolo de la NASA responde al umbral temprano con "más controles", no con acción inmediata (`Opinión mía`, apoyada en el contexto verificado del proyecto). | N1 (tabla 10.3-1; apéndice F.5.10 y F.6.4) |
| 6 | **¿Alcanza con el color?** | No. Todo significado dado por color lleva **otra señal** (texto, ícono, flecha). El color se usa solo para dar significado, no para decorar. | `Norma` obligatoria ([V2 10045]; F.5.10 a y e). Fuera de rango: flecha amarilla o roja hacia arriba o abajo **después** del valor (F.4.3.1 d); en gráficos, color **y** indicador de texto o línea de límite (F.5.8 f). | N1 |
| 7 | **¿Tamaño mínimo de letra?** | Altura de la letra mayúscula ≥ **0,25°** de ángulo visual (mínimo); **0,4° o más** (preferido). Rótulos: ≥ 0,4° o 12 puntos. | `Norma`: mínimo obligatorio, preferido recomendado. Ejemplo de la norma: 0,25° = letra de 10 puntos a 81 cm (32 pulgadas). El manual de la NASA da 0,4° = 10 puntos a 48 cm (19 pulgadas). | N1 (F.5.1 g; [V2 10066]); N2 (5.3.4.4) |
| 8 | **¿Contraste y tipo de letra?** | Contraste letra/fondo ≥ **6:1** (mínimo); **10:1** preferido. Letra sin serifa; mayúsculas y minúsculas; ancho fijo para números y tablas; unidad junto a cada número. | `Norma` obligatoria (F.5.10 f; F.5.1 d y h; F.5.6 b; [V2 10046]), salvo la letra sin serifa, que es recomendada (F.5.1 b). | N1 |
| 9 | **¿Cuándo avisar y cuándo no?** | Avisar cuando el valor cruza un umbral definido; **no repetir** el mismo aviso sin información nueva. | `Norma`: el sistema avisa cuando un parámetro sale de tolerancia ([V2 10115]) y permite suprimir avisos repetidos que se sabe que son falsos ([V2 10177]). `Experimento` sobre fatiga de alertas en médicos: *por verificar en el texto completo.* | N1; F6 |
| 10 | **¿Qué decir siempre sobre los límites del análisis?** | (a) **Por qué** el sistema dice lo que dice. (b) **Cuándo no puede ayudar** (imagen mala, caso fuera de lo previsto). (c) Sin frases que lo hagan parecer una persona. (d) La decisión es del tripulante. | `Norma` obligatoria: las ayudas a la decisión dan explicación, fundamento y consecuencias ([V2 10170]); avisan cuando el problema supera su capacidad ([V2 10171]); la información de un sistema automático evita el lenguaje antropomórfico (F.6.2 e); el operador decide cuándo usar la ayuda ([V2 10169]). | N1 (10.6.9 a 10.6.11; F.6.2) |
| 11 | **¿Cómo comunicar un posible falso positivo?** | *Por verificar.* | *Por verificar.* | — |
| 12 | **¿Cómo mostrar la confianza del algoritmo sin inducir confianza ciega?** | *Por verificar.* | `Experimento` (médicos leyendo radiografías con consejo, parte de él equivocado): el consejo equivocado empeoró el diagnóstico sin importar si venía rotulado como de una IA o de una persona. *Cifras por verificar.* | F7 |

---

## Parte 3 — Fuentes (provisorio)

| Código | Fuente | ¿Leí el texto completo? |
|---|---|---|
| N1 | [NASA-STD-3001, volumen 2, revisión F (aprobada el 14/7/2026)](https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf) — [ficha](https://standards.nasa.gov/standard/NASA/NASA-STD-3001_VOL_2) | Sí: secciones 5.1.7, 10.3, 10.4.2, 10.4.3, 10.6 y apéndice F completo |
| N2 | [Human Integration Design Handbook, NASA/SP-2010-3407 rev. 1 (2014)](https://www.nasa.gov/wp-content/uploads/2023/03/human-integration-design-handbook-revision-1.pdf) | Parcial: 5.3.4.4 y 10.3.2.7. Falta el resto (segundo commit) |
| F1 | [van der Bles y otros 2020, PNAS](https://pmc.ncbi.nlm.nih.gov/articles/PMC7149229/) | Parcial: resumen y experimentos 1 a 3 |
| F2 | [Büchter y otros 2014, BMC Med Inform Decis Mak](https://pmc.ncbi.nlm.nih.gov/articles/PMC4153005/) | No todavía: solo el resumen |
| F3 | [Zikmund-Fisher y otros 2017, J Am Med Inform Assoc](https://pmc.ncbi.nlm.nih.gov/articles/PMC5565988/) | Sí |
| F4 | [Zikmund-Fisher y otros 2018, J Med Internet Res](https://pmc.ncbi.nlm.nih.gov/articles/PMC5891666/) | Sí |
| F5 | [Scherer y otros 2018, J Med Internet Res](https://pmc.ncbi.nlm.nih.gov/articles/PMC6231727/) | No todavía: solo el resumen |
| F6 | [Ancker y otros 2017, BMC Med Inform Decis Mak](https://pmc.ncbi.nlm.nih.gov/articles/PMC5387195/) | No todavía: solo el resumen |
| F7 | [Gaube y otros 2021, npj Digital Medicine](https://pmc.ncbi.nlm.nih.gov/articles/PMC7896064/) | No todavía: solo el resumen |
