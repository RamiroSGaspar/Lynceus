# Evidencia y límites

[English](../en/evidence.md) · [Inicio](../../README.es.md) · [Supuestos](../assumptions.md)

## Qué respalda cada cifra

| Dato usado | Procedencia y alcance |
|---|---|
| Cambio de grosor **> 19,4 µm** | Laurie 2020: dos desvíos de la variación entre exámenes (2 × 9,7 µm) en siete astronautas antes de volar. El brief NASA presenta el criterio redondeado como ≥ 20 µm. El prototipo conserva > 19,4 |
| Cambio de grosor **≥ 55 µm** | Criterio clínicamente preocupante del brief NASA y su tabla de seguimiento |
| Cambio de rugosidad **> 2,8 µm** | Repetibilidad publicada para la membrana de Bruch; el prototipo la usa como indicador de pliegues nuevos. No es un umbral de presión intracraneal |
| Controles de rutina en días **30, 90 y 150** | Adaptación del calendario descrito por NASA a la misión ficticia de 180 días |
| OCT a **4 semanas**, Amsler **2 veces por semana** tras un primer indicio | Supuesto del proyecto inspirado en un caso publicado; no protocolo NASA universal |
| Caso extremo inspirado en **+232 µm** | Un caso publicado. La tripulante D y su curva son ficticias; no representan prevalencia ni un paciente reproducido |

Fuentes principales:

- [NASA, OCHMO-MTB-001, SANS (2024)](https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf).
- [Laurie y colaboradores (2020)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6990717/).
- [Ferguson y colaboradores (2023), pliegues](https://pmc.ncbi.nlm.nih.gov/articles/PMC9857718/).
- [Brunstetter y colaboradores (2024), caso con seguimiento adicional](https://pmc.ncbi.nlm.nih.gov/articles/PMC11273286/).
- [Nguyen y colaboradores (2025), revisión](https://pmc.ncbi.nlm.nih.gov/articles/PMC12103276/).
- [NASA, informe de evidencia SANS (2022)](https://humanresearchroadmap.nasa.gov/evidence/reports/SANS%20EB%202022%20FINAL_8-15-22.pdf).

La trazabilidad de medidas y constantes está en
[`thresholds.ts`](../../packages/core/src/rules/thresholds.ts),
[`sources.ts`](../../packages/core/src/rules/sources.ts) y las investigaciones de
[OCT](../../monitoreo-salud-astronautas/investigaciones/sans-oct-base-tecnica.md),
[evolución](../../monitoreo-salud-astronautas/investigaciones/sans-evolucion-y-logica-clinica.md)
y [cerebro](../../monitoreo-salud-astronautas/investigaciones/sans-cerebro-en-mision.md).
Las fuentes sostienen fenómenos y medidas; no certifican este software.

## Qué evaluamos

El instrumento virtual genera imágenes cuyo valor de referencia se conoce.
El motor analiza los píxeles y se compara su resultado con ese valor. El experimento
guardado contiene **621 capturas de cuatro personajes y ocho ojos virtuales**;
las **16 referencias están incluidas** en esas 621 capturas.

Se separaron desarrollo, evaluación con anatomía apartada (C) y evaluación con
familias de fallos apartadas (A, B y D). Muchas capturas del mismo ojo no son
muchas personas independientes. El protocolo se guardó antes del ajuste.

El modelo candidato estima el error a partir de variables de calidad observables.
Sus coeficientes se ajustan con desarrollo; la prueba final evalúa, no elige los
coeficientes. Se inspeccionan sesgo, RMSE, error máximo y cobertura de intervalos.

## Resultado: el modelo ajustado no se activa

| Evaluación del candidato | Resultado que importa |
|---|---|
| Anatomía apartada, cambio de grosor | 78 pares; RMSE 2,45 µm, error máximo 8,94 µm frente a la tolerancia propia de 6 µm |
| Anatomía apartada, rugosidad | Error máximo 2,96 µm frente a la tolerancia propia de 1,5 µm |
| Fallos apartados, rugosidad | 24 pares; cobertura observada del intervalo nominal del 95 %: 79,2 % |
| Anatomía apartada, capturas limpias | Aproximadamente 21 % fuera del dominio del candidato |

Estas cifras se refieren a las particiones y filtros del experimento, no a la
precisión de todos los resultados de la demo ni a personas. Las tolerancias de
6 y 1,5 µm son de ingeniería del proyecto, distintas de los umbrales publicados.

La aplicación mantiene `provisional-1`: márgenes y probabilidades basados en
supuestos. **No se ha demostrado que sus intervalos contengan el valor verdadero
el 95 % de las veces.** El resultado nominal no es una probabilidad de tener SANS.
La distinción queda visible en resultado, informe y «Cómo funciona».

También se observaron errores en capturas aceptadas, por ejemplo movimiento leve
que eleva artificialmente la rugosidad. Rechazar capturas malas reduce un riesgo;
no garantiza que toda captura aceptada sea correcta.

## Material reproducible

- [Protocolo](../../packages/validation/protocol.md).
- [Filas de las capturas](../../packages/validation/out/quality-rows.json).
- [Informe completo](../../packages/validation/out/quality-validation.md).
- [Resumen que alimenta la interfaz](../../packages/core/src/dataset/validation-summary.json).
- [Tiempos y hash del archivo conservado](../../packages/validation/out/quality-run.md).

`pnpm --filter @app/validation quality:fit -- --check` comprueba que el resumen y
el informe se derivan de las filas guardadas. No vuelve a generar las capturas.
La segunda corrida larga se interrumpió: la coincidencia del archivo conservado
con la primera no demuestra que esa segunda corrida terminara.

## Qué falta demostrar

El generador y el motor comparten simplificaciones anatómicas; eso puede favorecer
el resultado sintético. Falta evaluar imágenes independientes, variabilidad real,
corrección por expertos, intervalos calibrados y utilidad con usuarios reales.
Ni la cantidad de pruebas de software ni el uso de un formato `.vol` demuestran
validación clínica o interoperabilidad completa con el equipo físico.

Las fuentes revisadas no permiten inferir presión intracraneal a partir del OCT.
Los hallazgos cerebrales por resonancia antes/después del vuelo no son mediciones
disponibles aquí. El dolor de cabeza se registra sin atribuirlo causalmente a SANS.
