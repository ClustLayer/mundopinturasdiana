# Correcciones iteración 8 — Épica 3 (deuda) + Épica 4 Sedes

**Rama:** `epica-4-sedes-y-contacto`

## Épica 3 — Copilot y permisos

- Eliminado bypass de administrador en `PermissionService` (acceso real por matriz).
- Migración `0009_demo_permisos_matriz`: permisos alineados a la demo (Total/Consultar/Sin acceso).
- Fixes: paginación 400, matriz `id_destino`, auditoría `antes.cambios`, serializers `max_length=200`, OpenAPI matriz, catálogo usuarios paginado, activar usuario valida rol activo.
- UI matriz: carriles por módulo con tags (sin columna Habilitado); panel Permisos solo para rol Administrador.

## Épica 4 — Sedes (HU 19–21)

- Backend: `AdminSedesService`, horarios semanales, API `/api/v1/sedes/gestion/`, público `/api/v1/branches/`, consolidado stub.
- Frontend: `PanelSedesPage` (CRUD + horarios por día), `SedesPage` consume API pública.

## Calidad

- `make calidad` / `npx pnpm run calidad` en verde.
