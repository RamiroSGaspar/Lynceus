# Desarrollo y ejecución

[English](../en/development.md) · [Inicio](../../README.es.md) · [Demo](demo.md)

## Preparar y ejecutar

Requisitos: Node.js ≥ 22 y pnpm 10.18.3, indicado en `package.json`.
Desde la raíz:

```sh
pnpm install
pnpm dev
```

Vite imprime la URL; normalmente usa el puerto 5173. Para el puerto de la demo:

```sh
pnpm dev --host 127.0.0.1 --port 5178 --strictPort
```

Usar un solo servidor por puerto. Para detenerlo, Ctrl+C en su terminal.
Las dependencias se instalan dentro del repositorio. `minimumReleaseAge` exige
al menos siete días desde su publicación; no reducir esa restricción.

## Mapa de las piezas

```text
Ojo virtual → instrumento virtual → examen .vol → motor de imágenes
                                                   ↓
Pruebas de visión + referencia → reglas → resultado / historia / informe
                                               ↓ consentimiento
                         pregunta + resumen → servidor → API de Anthropic
```

| Carpeta | Responsabilidad |
|---|---|
| `packages/core` | Código TypeScript puro: simulación, formato, medición, reglas y textos |
| `packages/validation` | Herramientas locales de evaluación y artefactos guardados |
| `apps/web/src` | React, UI, almacenamiento local y Web Worker para OCT |
| `apps/web/api` | Función del asistente y comprobaciones de entrada/salida |
| `docs` | Documentación pública y registro central de supuestos |
| `monitoreo-salud-astronautas` | Investigación, especificaciones y material del equipo |

La aleatoriedad del núcleo tiene semilla. La reproducibilidad exige conservar
pedido, referencia, versiones y reglas, no solo el nombre del tripulante.
Las imágenes del visor se reconstruyen cuando hace falta; no se guarda cada
volumen completo en el almacenamiento persistente del navegador.

Los controles, borradores y preguntas se guardan localmente. Una aplicación ya
cargada puede ejecutar el análisis sin llamar a una API. Esto no implica que exista
un instalador offline o que una recarga funcione sin acceso al servidor.

## Configurar el asistente

1. Crear o editar localmente `apps/web/.env.local` y asignar
   `ANTHROPIC_API_KEY`. No usar el prefijo `VITE_`.
2. Configurar el tope de gasto de la cuenta de Anthropic.
3. Reiniciar el servidor de desarrollo después de cargar o cambiar la clave.
4. Comprobar presencia y configuración, sin mostrar el valor ni llamar al proveedor:

```sh
pnpm --filter @app/web assistant:smoke -- --check
```

Con la clave y el gasto autorizados, ejecutar la prueba de seis casos:

```sh
pnpm --filter @app/web assistant:smoke
```

Usa un resumen numérico ficticio y pregunta por resultados, presión intracraneal,
preguntas para el médico, medicación e intentos de desvío. Se detiene ante un fallo
del proveedor. `NO KEY` significa **no probado**, aunque el proceso termine con
código 0. Revisar también las respuestas y sus fuentes, no solo el código de salida.
La batería extensa de 30 casos sigue disponible en `assistant:redteam`; no es parte
de `verify` ni hace falta ejecutarla para cada cambio.

La clave se carga solo en el servidor. El navegador llama a `/api/assistant`;
el agregado de Vite monta el mismo manejador que la función de Vercel. Los registros
del servidor muestran categorías de fallo sanitizadas, no la clave ni el cuerpo
crudo del error del proveedor. Un rechazo del revisor se distingue de un fallo de API.

La configuración del modelo del producto está en
[`anthropic.ts`](../../apps/web/api/_lib/anthropic.ts); el modelo usado por un agente
para desarrollar el proyecto es independiente.

## Comprobaciones

| Comando | Alcance |
|---|---|
| `pnpm verify` | Tipos, pruebas y control de credenciales; requerido antes de commit |
| `pnpm build` | Compilación de producción |
| `pnpm preview` | Sirve el resultado estático de la compilación; no monta la función del asistente |
| `pnpm --filter @app/validation quality:fit -- --check` | Comprueba informe/resumen contra las filas guardadas |

`quality:run` y `history:generate` son operaciones explícitas de generación.
No son necesarias para abrir la demo ni deben confundirse con pruebas breves.
Los artefactos actuales ya están versionados.

## Publicación y mantenimiento

La estructura contempla Vercel con raíz `apps/web`, compilación Vite y función
`api/assistant.ts`. La clave se configuraría como secreto del servidor. La publicación
requiere elegir destino y autorización; estos comandos locales no despliegan nada.

Seguir [AGENTS.md](../../AGENTS.md): pnpm, rutas explícitas al guardar cambios,
ningún secreto versionado y nuevas decisiones en [supuestos](../assumptions.md).
La base citada y los umbrales requieren trazabilidad; no modificarlos para lograr
un resultado favorable en una demo.
