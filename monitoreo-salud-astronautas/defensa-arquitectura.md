# Cómo defender la arquitectura y el flujo del programa

**Lectura breve para presentar. La demo usa imágenes y tripulantes simulados.**

## El recorrido, explicado en voz alta

> «El instrumento virtual genera una imagen. El motor la mide, las reglas comparan
> el resultado con la referencia y la aplicación lo explica. El asistente de IA
> puede ayudar a entender después».

```text
Tripulante + día + intento
          ↓
Instrumento virtual → examen OCT con 48 cortes
          ↓
Motor: encuentra bordes y comprueba calidad
          ├─ No alcanza: pide repetir o registra «no se pudo medir»
          └─ Alcanza: calcula grosor y rugosidad
                              ↓
       Compara con antes del vuelo y estima un margen provisorio
                              ↓
               Reglas + síntomas + pruebas de visión
                              ↓
                 Resultado → historia → informe
```

## Por qué separamos esas piezas

| Pieza | Responsabilidad | Ventaja concreta |
|---|---|---|
| Instrumento virtual | Crear imágenes y fallos controlados | Podemos repetir un caso y conocer el valor de referencia |
| Motor de imágenes | Medir los píxeles | Podemos revisar los bordes y rastrear el origen del número |
| Reglas | Aplicar umbrales y proponer seguimiento | Se puede revisar qué regla produjo cada nivel |
| Interfaz | Guiar, dibujar gráficos y preparar el informe | Presenta la misma información en cada paso |
| Asistente | Explicar resultados con fuentes | Puede fallar o estar desconectado sin impedir la medición |

El núcleo ejecuta cálculos locales. Un **Web Worker**, una tarea aparte del
navegador, realiza el trabajo pesado para que la interfaz siga respondiendo.
Los controles se guardan en ese navegador; no se sincronizan entre dispositivos.

Con las mismas entradas y versiones, el motor reproduce el resultado. Las
respuestas del asistente pueden variar.

## Dónde entra Haiku 5.5

Solo cuando la persona acepta consultar al asistente:

```text
Pregunta + resumen numérico sin identidad
          ↓
Servidor, donde está la clave
          ↓
Haiku 5.5 + instrucciones fijas + conocimiento citado
          ↓
Revisión de formato, números, fuentes y contenido
          ↓
Respuesta con fuentes o negativa de la aplicación
```

La imagen OCT no se envía. El texto libre que escriba la persona sí sale.
La clave no llega al navegador. Haiku explica; el nivel ya fue calculado por las
reglas. Las comprobaciones reducen respuestas indebidas, sin garantizar que
el modelo nunca se equivoque.

## Si te preguntan «¿por qué hacerlo así?»

> «Porque la medición tiene que poder funcionar y revisarse aunque no haya una
> respuesta de IA. Separar captura, cálculo, reglas y explicación permite encontrar
> dónde ocurrió un error y mejorar una pieza sin rehacer todo el recorrido».

La limitación actual es que probamos el flujo sobre simulación. Ejecutar localmente
no demuestra precisión clínica ni garantiza que la aplicación se pueda recargar
sin acceso al servidor.

**Para ampliar:** [guía de desarrollo](../docs/es/development.md) y
[guía personal con gráficos](guia-para-defender-el-proyecto.md).
