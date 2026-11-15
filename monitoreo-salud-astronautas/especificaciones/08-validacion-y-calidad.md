# Especificación 08 — Validación sintética, calidad e incertidumbre

## Alcance vigente para cerrar la hackatón

Ramiro pidió reducir el tiempo y la profundidad de pruebas para priorizar el
prototipo de una hackatón de dos días. Esta indicación prevalece sobre los
requisitos de cierre más amplios que figuran abajo y sobre la repetición de la
suite completa antes de cada commit de esta entrega.

- Conservar el experimento ya ejecutado de 621 capturas, su informe y sus
  conclusiones. No ampliar la muestra, repetir el experimento completo ni volver
  a ajustar el modelo para alcanzar los criterios originales.
- Entregar la aplicación funcional y la explicación del trabajo hecho. El
  candidato que no cumplió los criterios queda experimental; el modelo provisorio
  conserva su aviso. No se rebajan los criterios retrospectivamente para
  presentar el candidato como validado.
- Comprobar tipos, compilación, credenciales y pruebas focalizadas de los módulos
  modificados. Reutilizar verificaciones que ya hayan pasado sobre la misma
  versión. No hace falta otro recorrido exhaustivo del navegador.
- No regenerar toda la historia si su comportamiento no cambió. Aprovechar las
  verificaciones que ya estén en curso sin iniciar rondas adicionales.
- Mantener los rechazos de capturas deficientes y el hook de secretos. Corregir
  defectos que impidan usar la demo y documentar las limitaciones restantes.
- Cerrar con commits coherentes e informe de lo verificado y lo postergado.
  Muestras adicionales, mejoras de precisión y optimización quedan para después.

## Problema que se debe resolver

La aplicación completa, incluidas sus referencias e historia, ya usa el motor
de imágenes. Sus rangos y probabilidades aún dependen de `PROVISIONAL_ERROR_MODEL`
en `packages/core/src/rules/errorModel.ts`: errores supuestos de 3 a 6 µm por examen
para el anillo y 0,8 µm para rugosidad. Se necesita medir el error, comprobar cuándo
puede estimarse a partir de la calidad y usar un modelo pequeño y explicable.

La precisión inicial es optimista: el generador y el motor comparten un modelo de
capas. La historia medida comprende ocho ojos de cuatro personajes; muchas
capturas del mismo ojo NO son muchos ojos independientes ni validación humana.
El objetivo es un resultado defendible, no mejorar artificialmente una cifra.

## Lectura dirigida

- `AGENTS.md`, arquitectura §§5, 6, 10–12 y especificaciones 01, 04 y 07.
- `packages/core/NOTES.md`, sobre todo calidad ~25 dB, sesgos y puntos flojos.
- Investigación `sans-oct-base-tecnica.md`, §§5.1 y 5.2 (repetibilidad).
  Los umbrales de NASA y las tolerancias de ingeniería son conceptos distintos.
- `core/src/engine/analyze.ts`, `contract.ts`, `quality.ts`,
  `rules/errorModel.ts`, `rules/assess.ts`, `rules/probability.ts`.
- `validation/src/accuracySuite.ts` si existe, `accuracy.ts`,
  `historySuite.ts`, `history.ts` y pruebas vecinas.
- `core/src/dataset/measuredHistory.ts`, `historyChecks.ts` y el artefacto de historia.
- Pantalla `apps/web/src/screens/HowScreen.tsx`, sus mensajes y las leyendas
  de incertidumbre en resultado e informe.

`VALIDATION_SUMMARY` todavía no existe. No esperar trabajo de otro agente ni
describir una exportación o un experimento que aún no se hayan construido.

## Límites y propiedad

Podés modificar `packages/validation/`, los módulos y pruebas del núcleo necesarios
para el modelo, contratos compartidos mínimos, versiones, historia y textos; además
la pantalla Cómo funciona, los avisos de resultados/informes y los textos y mapeos
de rechazo del visor que requiera la integración. No rediseñar la aplicación.

No cambiar umbrales clínicos, frecuencia de controles, anatomía de la tripulación
ni imágenes de la demo para lograr resultados favorables. No modificar el
segmentador o su índice de calidad para ocultar errores encontrados: informar un
defecto concreto antes de ampliar el trabajo de esa forma.

Usar la calidad de ~25 dB que actualmente produce la captura limpia. Documentar que
este índice es una implementación del simulador, no una calibración validada del
equipo real; no elevarlo artificialmente para llegar al antiguo supuesto de 27 dB.

## Experimento y separación de datos

1. Antes de ajustar el modelo, escribir un protocolo breve y versionado:
   preguntas, matriz de capturas, particiones, métricas, tolerancias y criterio de
   activación. Las tolerancias propias se identifican como ingeniería del proyecto.
2. Generar una muestra determinista que cubra los ocho ojos, días con y sin
   hinchazón/pliegues, cambios próximos a 19,4/20 y 55 µm, capturas limpias y
   deterioradas por señal, movimiento, parpadeo, truncamiento y descentrado.
   Incluir combinaciones nuevas para comprobar robustez. No asumir que la
   frecuencia elegida de fallas representa la frecuencia en astronautas.
3. Evitar fuga entre ajuste, calibración y evaluación: agrupar por anatomía o
   tripulante y por familias de perturbación, documentando los límites de tener
   solo cuatro personas ficticias. No repartir al azar capturas casi iguales entre
   entrenamiento y prueba, ni usar la prueba final para escoger coeficientes.
4. Usar el valor verdadero exclusivamente en las herramientas de validación,
   para etiquetas y errores. El motor y la inferencia del modelo solo reciben
   imágenes, metadatos y características calculables de una captura real.
5. Acotar la ejecución: dos trabajos simultáneos por defecto, conservar resúmenes
   y errores, no volúmenes completos. Versionar cualquier caché por pedido,
   instrumento, motor y protocolo. La muestra y su tamaño se justifican en el
   informe, contando ojos y capturas por separado. Nada de servicios externos.
6. Los experimentos costosos son comandos explícitos; no se ejecutan en cada
   compilación ni en `pnpm verify`.

## Modelo y reglas de uso

- Elegir el modelo más sencillo que explique los datos: pocas características
  observables, fórmula y coeficientes publicados. No hacen falta librerías de ML
  ni un clasificador grande. Un modelo de error con regla explícita de aceptación
  puede satisfacer el objetivo sin agregar otro clasificador.
- Medir error de TRT y rugosidad, y error de sus cambios contra referencia. No
  asumir independencia de los errores de ambos exámenes sin comprobarla o
  declararla. Las variables/coeficientes deben tener unidades o transformaciones
  definidas; manejar valores no finitos y condiciones fuera del dominio entrenado.
- Los rechazos geométricos o de señal del motor siguen siendo obligatorios.
  Un modelo entrenado no puede convertir un rechazo en una medida válida.
  Cuando el modelo no respalde una captura, retornar «no puedo medir», con motivo;
  nunca un número con certeza aparente.
- Si se entrena una decisión de calidad, su etiqueta no debe ser solamente una
  copia de los rechazos actuales presentada como validación independiente.
  Si no hay ejemplos suficientes de error entre las capturas aceptadas, informarlo;
  no inventar clases ni dar una AUC cuando solo existe una clase.
- Los rangos que la aplicación llama del 95 % necesitan evaluación de cobertura
  en datos apartados. Informar cobertura observada y tamaño de muestra, sesgo,
  RMSE y error absoluto por calidad; no convertir automáticamente RMSE en
  desviación estándar ni tomar 1,96 veces RMSE como garantía de cobertura.
- `probabilityBeyond` supone una distribución del error: validar o declarar esa
  aproximación. Sus probabilidades se refieren a mediciones del simulador; no son
  probabilidades clínicas de SANS.
- El modelo puede activarse por defecto solo si cumple el criterio fijado antes
  de la prueba final. Si la evidencia no alcanza, conservar la alternativa honesta,
  entregar el experimento y el impedimento concreto; no quitar «provisorio» por
  haber ajustado coeficientes.

## Integración, trazabilidad y comunicación

- Mantener la interfaz `ErrorModel` o hacer un cambio mínimo y compatible.
  Versionar instrumento, motor si cambia su comportamiento, modelo y protocolo;
  el formato `.vol` por sí solo no identifica una versión del simulador.
- Publicar un resumen estructurado pequeño y realmente generado para Cómo funciona:
  muestra, particiones, errores, cobertura, rechazos, fórmula y pesos, límites y
  versiones. Mostrarlo en español e inglés, sin tablas inventadas en la interfaz.
  El informe técnico completo queda en `packages/validation/out/`.
- Los números calculados desde imágenes simuladas se identifican como tales.
  No anunciar validación sobre personas, rendimiento del dispositivo real ni
  diagnóstico, y no inferir presión intracraneal.
- Si se activa un modelo nuevo, regenerar referencias/historia con el mismo
  comportamiento que la captura en vivo y ejecutar `history:check`. No hardcodear
  los calendarios antiguos. Conservar procedencia de sesiones antiguas guardadas
  en el navegador; no reescribirlas silenciosamente ni borrar datos.
- Anotar todos los supuestos nuevos en el registro central: sección 12 de
  `arquitectura.md`, salvo que ya exista `docs/assumptions.md`.
- Actualizar los avisos de error provisorio solo donde corresponda; un modelo
  calibrado sobre datos ficticios sigue necesitando un límite visible.

## Verificación y entrega

Reutilizar los tests adecuados. Comprobar inferencia determinista, no uso del
valor verdadero en producción, entradas fuera de dominio, rechazos sin medidas,
coherencia entre intervalos y probabilidades, compatibilidad de versiones y
correspondencia entre artefactos y el comando que los genera. El conjunto de
prueba final debe producir métricas reproducibles, incluso si son desfavorables.

Ejecutar una vez la validación completa según el protocolo; repetir solo para
resolver un fallo concreto o verificar reproducibilidad. Medir tiempos y tamaños.
Antes de cada commit: `pnpm verify`; al entregar: `pnpm build`. Comprobar en navegador
una captura aceptada, una rechazada y la pantalla de explicación del modelo.

Entrega final por Orca con commits, comandos, resultados de evaluación, decisión
de activar o no, y límites pendientes. Commits chicos con rutas explícitas, sin
push ni despliegue, sin claves ni lectura de `.env`, sin API del asistente, sin
otros agentes. No enviar actualizaciones rutinarias; sí bloqueos que requieran
una decisión del coordinador.
