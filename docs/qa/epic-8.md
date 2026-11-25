# QA Épica 8 — Punto de venta y facturación (frontend)

## Punto de venta (`panel-pos-page.tsx`)

- Búsqueda debounce 300 ms, sede/tipo obligatorios, carrito, cliente opcional, cobro mixto, emitir con spinner.
- Atajo Ctrl+K en buscador.

## Facturas (`panel-ventas-page.tsx`)

- Listado, detalle, reimpresión, anulación con confirmación.

## Pruebas

- `src/features/ventas/logic.test.ts`
- `pnpm run calidad`