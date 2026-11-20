# QA Épica 7 — Panel de clientes

## Rutas

- `/panel/:rol/clientes` — directorio, tipos, detalle.

## Checks

- Placeholders y `FieldLabel` en obligatorios.
- `FormAlert` en modales; toast tras guardar.
- Duplicado de teléfono con «Crear de todas formas».
- Habeas Data: texto legal al marcar consentimiento.
- Vitest: `src/features/clientes/logic.test.ts`.
