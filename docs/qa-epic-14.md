# QA Épica 14 — Proveedores e inventario (frontend)

## Panel Proveedores (`panel-proveedores-page.tsx`)

- Rutas: `/panel/proveedores` con RBAC `proveedores`.
- Listado, búsqueda, filtro de estado, paginación y modales crear/editar (mensajes HU).
- Confirmación al desactivar proveedor.

## Inventario (`panel-inventario-page.tsx`)

- `SearchCombobox` de proveedores activos en entrada manual, detector USB y carga rápida.
- Payload `id_proveedor`; columna proveedor en kardex desde API.

## Pruebas automatizadas

- `src/features/proveedores/logic.test.ts` (formato de correo).
- Vitest y Playwright en pipeline `pnpm run calidad` (vía `corepack pnpm` si `pnpm` no está en PATH).
