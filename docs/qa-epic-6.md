# QA — Épica 6 Inventario y kardex

Ver también `mpdw-backend/docs/qa-epic-6.md`.

## Panel

- Ruta inventario: pestañas Existencias, Kardex, Entrada, Ajuste, Traslado (escritura según permiso Crear).
- Placeholders y asteriscos en el formulario de movimiento.
- Errores dentro del recuadro (`FormAlert`), no detrás de un overlay.

## Modales globales

- Crear producto cierra y refresca cuando el API responde 201 (el cuerpo ya no se consume dos veces).
- Un solo scroll vertical en modales del kit.

## Entrada (demo)

- Pills Manual / Detector / Carga rápida.
- Costo unitario y proveedor condicional.
- Badges tipo y origen en existencias/kardex.

## Automatizado

- `src/features/inventory/inventory-bulk.test.ts`
