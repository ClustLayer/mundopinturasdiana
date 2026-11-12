# QA — Épica 2 (Usuarios, perfil, fixes UI y sesión)

Precondición: backend con migraciones, frontend `npx pnpm dev`, usuario administrador con permisos sobre usuarios.

## Persistencia al recargar (F5)

- Iniciar sesión con credenciales válidas.
- Navegar a **Usuarios** u otra vista del panel (no Resumen).
- Recargar la página (F5): debe mantenerse la sesión sin volver a `/login`.
- Cerrar pestaña, reabrir la misma URL del panel: debe restaurar sesión si el refresh cookie sigue vigente.

## Navegación SPA

- Cambiar entre **Usuarios**, **Permisos**, **Mi cuenta** y **Resumen**: transición inmediata, sin pantalla congelada.
- Mientras se restaura sesión tras F5, el shell puede mostrar “Restaurando sesión…” brevemente y luego el contenido.

## Usuarios — UI

- Filtros (rol, sede, estado): selects no ocupan ancho fijo excesivo; no hay scroll horizontal innecesario en la barra de filtros.
- Tabla: tipografía, bordes y cabecera alineados con la demo (plum-soft, bordes `border-plum/10`).
- Columna acciones: solo íconos con `aria-label`.
- Cambiar estado: ícono toggle; confirmación si aplica según flujo existente.
- Eliminar/desactivar: ícono basura abre modal de confirmación; cancelar no cambia datos; confirmar ejecuta la acción y muestra toast.

## Permisos efectivos (HU 18 en usuarios)

- Usuario sin permiso **Crear** en módulo usuarios: botón “Nuevo usuario” oculto o deshabilitado según implementación.
- Rol **Administrador** con acceso al módulo: botones visibles aunque `acciones_por_modulo` venga vacío (bypass de módulo visible).

## Mi cuenta (HU 12)

- Perfil editable según reglas existentes; no permite cambio de rol desde perfil.

## Accesibilidad

- Modales de confirmación con título y botones accesibles.
- Toasts con `role="status"` en operaciones exitosas.

## Automatizado

- `npx pnpm run calidad`: eslint, tsc, vitest (incl. `features/usuarios/logic.test.ts`, `features/accesos/logic.test.ts`), build, playwright.
