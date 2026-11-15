# Demo guiada

[English](../en/demo.md) · [Inicio](../../README.es.md) · [Guía personal](../../monitoreo-salud-astronautas/guia-para-defender-el-proyecto.md)

**Todo el recorrido usa datos simulados.** Esta es una guía para mostrar el
prototipo, no un procedimiento médico.

## Preparación

Abrí **https://lynceus-sans.vercel.app**. No requiere iniciar sesión.

Para ejecutarla localmente, usá `pnpm dev` desde la raíz y abrí la dirección que indica la terminal.
La sesión local del equipo puede usar http://127.0.0.1:5178/; una instalación nueva
usa normalmente http://localhost:5173/. Usá siempre la misma dirección y navegador
para conservar los controles: cambiar de puerto, host o perfil cambia el almacenamiento.
Los controles que hiciste en la demo local no aparecen automáticamente en la pública.

Elegí **Español**, **día de vuelo 150** y **Elena Voss (B)**.
El asistente es opcional para esta presentación.

## Recorrido breve

| Paso | Qué hacer | Qué mostrar o decir |
|---|---|---|
| 1. Inicio | Empezar el control de Elena | Se compara cada ojo con su propio examen de antes del vuelo |
| 2. Pruebas | Saltear síntomas, agudeza y Amsler para el recorrido corto | Quedarán como no hechos; no se simulan respuestas del visitante |
| 3. Ojo derecho | Capturar y esperar a que termine | Se generan 48 cortes y se analizan sus píxeles; aceptar con «Continuar» |
| 4. Ojo izquierdo | Capturar | El primer intento falla por un parpadeo simulado; no se presenta una medida |
| 5. Repetición | Elegir repetir y volver a pulsar «Capturar» | El segundo intento se acepta; continuar al resultado |
| 6. Resultado | Leer resumen, rango, nivel y próximos pasos | Un primer indicio es un umbral cruzado, no un diagnóstico |
| 7. Historia | Abrir «Ver la historia» | Los puntos anteriores vienen del conjunto simulado; el control nuevo se distingue |
| 8. Informe | Volver al resultado y preparar la conferencia médica | Agregar una pregunta y bajar el informe como texto |

Con estas condiciones se observaron, redondeados, **+31 µm en el ojo derecho
(rango +22 a +40)** y **+23 µm en el izquierdo (+13 a +33)** el 15 de noviembre de
2026. Son cambios medidos en imágenes ficticias. Los rangos vienen del modelo
provisorio; no son márgenes clínicamente validados.

Una respuesta distinta en síntomas o Amsler puede cambiar el nivel de la sesión.
La carga de la computadora afecta el tiempo de captura; esperá el resultado,
no un cronómetro fijo.

## Dos ampliaciones opcionales

- **Visor:** abrirlo desde la captura aceptada o el resultado; elegir un corte,
  mostrar capas y comparación con antes del vuelo. El gráfico de perfil usa la
  posición dentro del corte, no el tiempo.
- **Asistente:** revisar el consentimiento y el resumen que se enviará; preguntar
  «¿Qué significa mi resultado del ojo derecho?». Requiere clave y conexión.
  Si aparece «no disponible», la medición local y el informe siguen funcionando.

La pantalla «Cómo funciona» muestra el resumen de la evaluación y explica por
qué no se activó el modelo ajustado. «Qué se sabe del cerebro» separa lo conocido
de lo que no puede saberse a bordo.

## Volver a mostrarlo

Al elegir el mismo control terminado, la sesión ofrece ver el resultado o repetirlo.
La repetición reemplaza ese control guardado al completarse. Durante una sesión
también existe «Empezar este control de nuevo».

Para una demostración limpia puede borrarse lo guardado desde el inicio, con su
confirmación; eso elimina controles y preguntas locales. No hace falta borrar
datos para consultar la historia incluida.

## Control de presentación realizado

Se comprobó este flujo con pruebas de visión salteadas, rechazo y repetición,
resultado, historia, descarga del informe y textos principales en ambos idiomas.
La explicación de validación también se comprobó en español e inglés. La
impresión física y una respuesta real del proveedor de IA no forman parte de ese
control. Un enlace local solo funciona mientras su servidor esté encendido.
Después se comprobó la API real con seis preguntas y una consulta desde la
interfaz sobre Elena, día 118; ver [resultados](development.md).
