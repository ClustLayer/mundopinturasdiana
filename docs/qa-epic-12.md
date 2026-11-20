# QA Épica 12 — Eventos y novedades (frontend)

## Panel (`panel-eventos-page.tsx`)

- Rutas: `/panel/eventos` con RBAC `eventos`.
- Filtros: tipo, sede, rango de fechas, estado activo/inactivo.
- Modales: placeholders, `FieldLabel` con obligatorios en `text-brand`, `FormAlert` en dialog, spinner al guardar, cierre al éxito.
- Extras demo: `visible_sitio`, `imagen_url`, `importancia_clave`.

## Sitio público

- `fetchPublicEvents()` → `GET /api/v1/eventos/publicos/`; `home-page.tsx` e `events-section.tsx`.

## Pruebas automatizadas

- `src/features/eventos/logic.test.ts` (coherencia de fechas y badge de estado).
- `pnpm test`, `pnpm run test:e2e` (smoke).
