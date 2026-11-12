# Integration report

## Epica 1
**Date:** 2026-11-04
**Status:** PARTIALLY_VERIFIED

El cliente llama los caminos publicados por el backend (`/api/v1/auth/login`, `refresh`, `logout`, `recuperar`, `restablecer`, `cambiar-contrasena`, `verificar-2fa`, `reenviar-2fa`, `politica-sesion`) y muestra el campo `mensaje` sin reformularlo.

La compilacion y las pruebas de reglas de pantalla pasaron. El recorrido manual con la API y la base de Supabase no se ejecuto en esta sesion: queda descrito en `docs/qa-epic1.md`.

## Epica 2
**Date:** 2026-11-05
**Status:** VERIFIED (cliente + contrato)

El frontend consume `/api/v1/usuarios/*` y `PATCH /api/v1/auth/profile` mostrando los `mensaje` del backend. Filtros con debounce de 300 ms. Confirmaciones de rol, estado y contraseña temporal alineadas con HU 98.

## Epica 3
**Date:** 2026-11-05  
**Status:** VERIFIED (cliente + contrato)

Consumo de `/api/v1/roles-permisos/*` y `/api/v1/auth/accesos-panel`. Mensajes de error y exito sin reformular. Toasts accesibles (`role="status"`).

## Iteración 7 (2026-11-05)
**Status:** VERIFIED (pipelines locales)

- Sesión: refresh cookie + token/`profile` en bootstrap; accesos-panel cacheado 60 s en cliente.
- `DELETE /api/v1/roles-permisos/roles/{id}` integrado en UI con confirmación.
- Guards front alineados con `acciones_por_modulo` (Sin acceso, Total, alias T/L).
- Planes QA: `docs/qa-epic-2.md`, `docs/qa-epic-3.md`.

## Cierre Sprint 1 — Épicas 13 y 18 (2026-11-06)
**Status:** VERIFIED (pipelines locales)

- Bitácora: consumo de `GET /api/v1/auditoria/bitacora/` y `.../usuarios/`; debounce 300 ms en búsqueda de usuario.
- HU 96–97: diálogos modales accesibles; manejo 403/404/409 según mensajes del backend.
- QA: `docs/qa-sprint1-closing.md`.
