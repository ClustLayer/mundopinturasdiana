# Code structure

## Frontend

### Pages
- `/login` (HU_MPDW_01_01)
- `/recuperar` y `/nueva-contrasena` (HU_MPDW_01_03)
- `/cambiar-contrasena` (HU_MPDW_01_04)
- `/verificacion` (HU_MPDW_01_06)
- `/panel/administrador`, `/panel/gerente`, `/panel/empleado` con aviso de inactividad (HU_MPDW_01_05) y cierre de sesion (HU_MPDW_01_02)
- `/registro` redirige a `/login`. No hay alta publica.

### Modules
- `src/features/auth/logic.ts` — validaciones y mensajes literales
- `src/shared/api.ts` — cliente HTTP, token en `sessionStorage`, una sola renovacion ante 401
- `src/features/auth/session-storage.ts` — persistencia token/sesion para F5
- `src/features/accesos/` — `AccesosProvider`, `logic.ts` (Total / Sin acceso), cache accesos-panel
- `src/app/providers.tsx` — bootstrap de sesion, toasts accesibles
- `src/app/shell.tsx` — navegacion, cierre de sesion y dialogo de inactividad
- `src/shared` aviso "Funcionalidad en desarrollo" para modulos de otras historias

### Epica 2 — Usuarios y perfil
- `src/pages/panel-usuarios-page.tsx` — HU 07–11 (listado, formularios, estado, contraseña temporal)
- `src/pages/panel-permisos-page.tsx` — HU 13–17; `src/features/accesos/` y `panel-acceso-denegado-page.tsx` — HU 18
- `src/pages/panel-cuenta-page.tsx` — HU 12
- `src/features/usuarios/messages.ts` y `logic.ts` — mensajes literales y validacion de formulario
- `src/components/panel/kit.tsx` — Confirm, `ConfirmDestructiveDialog`, `ConflictDialog`, Modal con foco atrapado opcional, Pager, useDebounced, Badge
- `src/pages/panel-auditoria-page.tsx` — HU 82 (bitácora, filtros, detalle)
- `src/features/transversal/messages.ts` — textos HU 96–97 / auditoría
- Rutas en `auth-secondary-pages.tsx`: segmentos `usuarios`, `auditoria` (admin/gerente con permiso), `cuenta`
