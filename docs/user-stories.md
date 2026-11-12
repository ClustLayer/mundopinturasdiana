# User stories

Las seis historias de la epica 1 quedaron implementadas en este portal el 2026-11-04. El texto de negocio y los mensajes literales estan en `src/features/auth/logic.ts` y se corresponden con el backend.

**Status:** COMPLETED

- HU_MPDW_01_01 Iniciar sesion
- HU_MPDW_01_02 Cerrar sesion
- HU_MPDW_01_03 Recuperar contraseña
- HU_MPDW_01_04 Cambiar contraseña
- HU_MPDW_01_05 Continuidad de sesion
- HU_MPDW_01_06 Verificacion en dos pasos

La demo `MundoPinturasDiana-Demo` no forma parte de este repositorio y no se modifica.

## Epica 2 (2026-11-05) — **Status:** COMPLETED

- HU_MPDW_01_07 Crear usuario — `src/pages/panel-usuarios-page.tsx`, `src/features/usuarios/`
- HU_MPDW_01_08 Listado de usuarios — mismos archivos
- HU_MPDW_01_09 Editar usuario — modal de edicion y confirmacion de cambio de rol
- HU_MPDW_01_10 Cambiar estado — acciones activar, desactivar, bloquear
- HU_MPDW_01_11 Contraseña temporal — resultado de un solo uso con copiar
- HU_MPDW_01_12 Mi perfil — `src/pages/panel-cuenta-page.tsx`

## Epica 3 (2026-11-05) — **Status:** COMPLETED

- HU_MPDW_01_13–14 Roles — pestaña Roles en `src/pages/panel-permisos-page.tsx`
- HU_MPDW_01_15–16 Catálogo de permisos — misma página, pestaña Catálogo
- HU_MPDW_01_17 Matriz — pestaña Matriz (rol / usuario)
- HU_MPDW_01_18 Menú y rutas — `useAccesosPanel`, `PanelAccesoDenegadoPage`, filtro en `shell.tsx`
- Deuda UI Ep.2 — filtros de usuarios en una fila y cabecera alineada con la demo en `panel-usuarios-page.tsx`

### Iteración 7 (ajustes, integrados vía PR épica 3 #3 + rama épica 4)

- Persistencia de sesión al recargar (F5) — `session-storage.ts`, bootstrap en `providers.tsx`
- Navegación panel — `AccesosProvider` + caché; guards en usuarios y rutas secundarias
- UI usuarios — comboboxes compactos, acciones por ícono, confirmación eliminar/desactivar
- Épica 3 — eliminar rol custom (`DELETE`), catálogo Sin acceso/Total, refresco accesos tras matriz
- QA: `docs/qa-epic-2.md`, `docs/qa-epic-3.md`, `docs/correcciones-iteracion-7.md`

## Epica 4 (2026-11-05) — **Status:** COMPLETED (rama `epica-4-sedes-y-contacto`)

- HU_MPDW_01_19 Crear sede — `panel-sedes-page.tsx`, API `POST /api/v1/sedes/gestion/`
- HU_MPDW_01_20 Editar / desactivar sede — `PATCH /api/v1/sedes/gestion/{id}/`
- HU_MPDW_01_21 Consolidado — `GET /api/v1/sedes/consolidado/` (estructura; totales cuando existan datos operativos)
- HU pública sedes y contacto — `sedes-page.tsx` + `GET /api/v1/branches/`
- Iteraciones 8–9: matriz por módulo, tooltips, sedes demo — `docs/correcciones-iteracion-8.md`, `docs/correcciones-iteracion-9.md`, `docs/qa-epic-4.md`

## Épica 13 — Auditoría (2026-11-06) — **v1.1.5** — **Status:** COMPLETED

- HU_MPDW_01_82 — `src/pages/panel-auditoria-page.tsx`, ruta en `auth-secondary-pages.tsx` / `pages.tsx`; filtros con debounce 300 ms en búsqueda de usuario; mensajes literales del backend.

## Épica 18 — Comportamientos transversales (2026-11-06) — **v1.1.5** — **Status:** COMPLETED

- HU_MPDW_01_96 — `ConfirmDestructiveDialog` en `components/panel/kit.tsx` (foco atrapado vía `Modal`); motivo máx. 255 cuando aplica; integrado en `panel-usuarios-page.tsx`.
- HU_MPDW_01_97 — `ConflictDialog`, manejo HTTP 409 y borrador en `sessionStorage` en flujo de edición de usuario.
- Mensajes transversales — `src/features/transversal/messages.ts`.

## Épica 5 — Catálogo de productos (2026-11-11) — **Status:** COMPLETED

- HU 22–26 y 29–30 — `src/pages/panel-productos-page.tsx` (listado, alta, edición, estado, historial, importación y exportación).
- HU 27–28 — `PanelParametrosPage` en la ruta de categorías.
- Ruta inexistente — `NoEncontrada` con animación de marca.
