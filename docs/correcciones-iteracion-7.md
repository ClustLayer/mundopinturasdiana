# Correcciones iteración 7 — Épica 2 y Épica 3

**Fecha:** 2026-11-05  
**Rama:** `epica-3-ajustes-y-fixes`  
**Tipo:** targeted-fix-and-feature (full-stack)

## Épica 2 — UI, navegación y sesión

- Comboboxes de filtros en Usuarios y catálogo de permisos: `w-auto max-w-[12rem]` para ancho proporcional al texto.
- Tabla de usuarios: acciones con íconos (editar, cambiar estado, eliminar/desactivar) y `Confirm` con variante `danger`.
- Persistencia de sesión: token y snapshot de sesión en `sessionStorage`; bootstrap en `providers.tsx` (refresh + `GET /api/v1/auth/profile`).
- Navegación del panel: `AccesosProvider` con caché de 60 s en `sessionStorage`; una sola petición a `/api/v1/auth/accesos-panel`.
- Guards en usuarios y rutas secundarias según `acciones_por_modulo` (incluye bypass amplio cuando el módulo está visible sin lista de acciones).

## Épica 3 — Roles, permisos y guards

- Catálogo backend: acciones **Sin acceso** y **Total** en `permiso_eval.py`; evaluación en `PermissionRepository` y `accesos_panel`.
- `DELETE /api/v1/roles-permisos/roles/{id_rol}` para roles personalizados sin usuarios; roles base protegidos.
- UI Roles: solo íconos (lápiz / basurera + confirmación); roles base sin acciones.
- Matriz: tras guardar se llama `refrescar()` del contexto de accesos.

## Documentación QA

- `docs/qa-epic-2.md`, `docs/qa-epic-3.md`.

## Evidencia

- Backend: `make calidad` (ruff, mypy, import-linter, pytest unit, bandit).
- Frontend: `npx pnpm run calidad` (eslint, tsc, vitest, build, playwright).

## Pruebas nuevas

- Backend: `test_permiso_eval.py`, `test_permiso_repository.py`, eliminar rol en `test_epic3_roles_permisos.py` / vistas.
- Frontend: `src/features/accesos/logic.test.ts`.
