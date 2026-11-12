# Implementation report

## Epica 1
**Status:** COMPLETED
**Date:** 2026-11-04

### Analysis
- Modo: MOCKUP_PRODUCTIONIZATION. La demo queda como referencia visual y este portal es el frontend de produccion.
- Alcance de esta epica: autenticacion. El resto de modulos del panel existe como entrada inerte.

### Evidencia
- `pnpm test`: 3 pruebas de validacion, mensajes, politica y temporizador, en verde.
- `pnpm run build`: compilacion de TypeScript y build de Vite correctos.

### Decisiones
- El access token no se escribe en `localStorage`. Se conserva en memoria y el refresh viaja en la cookie del backend.
- El token de recuperacion se lee del fragmento de la URL, no de la consulta.
- Los avisos usan el toast del portal. No hay `alert()`.

## Epica 2
**Status:** COMPLETED
**Date:** 2026-11-05

### Alcance
- Panel administrador: modulo Usuarios (HU 07–11) y Mi cuenta (HU 12).
- UI basada en la demo `MundoPinturasDiana-Demo`; demas modulos del panel sin cambios funcionales.

### Evidencia
- `npm exec pnpm@10.15.0 run calidad`: lint 0 errores, vitest, build y playwright en verde.
- `src/features/usuarios/logic.test.ts`: validacion de campos obligatorios.

## Iteración 7 — Ajustes Épica 2 y 3
**Status:** COMPLETED  
**Date:** 2026-11-05  
**Rama:** `epica-3-ajustes-y-fixes`

### Alcance
- Sesión persistente (`sessionStorage`), `AccesosProvider`, guards `puedeAccion` / `puedeModulo`.
- UI usuarios y permisos (íconos, confirmaciones, filtros).
- Matriz refresca accesos tras guardar.

### Evidencia
- `docs/correcciones-iteracion-7.md`, `docs/qa-epic-2.md`, `docs/qa-epic-3.md`.
- `npx pnpm run calidad` en verde.

## Epica 3
**Status:** COMPLETED  
**Date:** 2026-11-05

### Alcance
- Modulo Permisos (roles, catalogo, matriz) para administrador.
- Menu filtrado por `GET /api/v1/auth/accesos-panel`; pantalla acceso denegado.
- Correccion UI usuarios: filtros en una fila y cabecera tipo demo.

### Evidencia
- `npx pnpm run calidad`: lint, tsc, vitest, build, e2e en verde.

## Cierre Sprint 1 — Épicas 13 y 18 (v1.1.5)
**Status:** COMPLETED  
**Date:** 2026-11-06  
**Branch:** `epica-13-18-cierre-sprint1`

### Alcance
- **Épica 13:** pantalla `panel-auditoria-page.tsx` consumiendo `/api/v1/auditoria/bitacora/` y opciones de usuario; filtros en URL; mensajes y estados CA.
- **Épica 18:** `ConfirmDestructiveDialog` y `ConflictDialog` en `kit.tsx`; mensajes `features/transversal/messages.ts`; flujos en `panel-usuarios-page.tsx` con `cuerpoError` en `shared/api.ts`.

### Evidencia
- `pnpm run calidad` (o `npx pnpm@10.15.0 run calidad`): lint sin errores, tsc, vitest, build, Playwright.
- Primera instalación de navegadores: `npx playwright install chromium`.

## Épica 5 — Catálogo
**Status:** COMPLETED
**Date:** 2026-11-11

- Pantallas de productos y parámetros alineadas a los mensajes de las HU 22–30.
- Matriz de permisos memorizada para no re-renderizar filas sin cambio de datos.
- 404 de marca en `NoEncontrada`.

## Épica 6 — Inventario y kardex
**Status:** COMPLETED
**Date:** 2026-11-11
**Branch:** `epica-6-inventario-kardex`

- Pantalla de inventario alineada al módulo demo (existencias por sede, kardex, entrada, ajuste y traslado).
- El cliente HTTP clona el cuerpo antes de leer el mensaje de error, para que un 201 cierre el modal.
- El diálogo del kit no suma un segundo scroll.

## Épica 7 — Directorio de clientes y Habeas Data
**Status:** COMPLETED  
**Date:** 2026-11-12  
**Branch:** `epica-7-directorio-clientes-habeas-data`  
**Version:** v1.2.3

- Panel demo-first: listado, filtros, WhatsApp, modales, tipos y detalle con métricas.
- Validaciones cliente: `features/clientes/logic.ts` + tests Vitest.
- `pnpm run calidad` en verde.
