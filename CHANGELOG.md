# Changelog

Versionado del portal: **MAJOR.SPRINT.EPIC_IN_SPRINT** (`1` = major, `2` = Sprint 2, tercer dígito = épica secuencial del sprint).

| Versión | Alcance |
|---------|---------|
| **1.0.0** | Línea base del portal (Vite, layout, rutas) |
| **1.1.1** | Sprint 1 · Épica 1 (autenticación) |
| **1.1.2** | Sprint 1 · Épica 2 (usuarios y perfil) |
| **1.1.3** | Sprint 1 · Épica 3 (roles y permisos) |
| **1.1.4** | Sprint 1 · Épica 4 (sedes públicas/admin) |
| **1.1.5** | Sprint 1 · Cierre (Épicas 13 y 18 + vínculo sede principal) |
| **1.2.1** | Sprint 2 · Épica 5 (catálogo de productos) |
| **1.2.2** | Sprint 2 · Épica 6 (inventario y kardex) + cierre de modales |
| **1.2.3** | Sprint 2 · Épica 7 (directorio de clientes y Habeas Data) |

---

## 2026-11-12 — v1.2.3 Épica 7 (directorio de clientes y Habeas Data)

- Panel Clientes con fidelidad demo: listado, filtros, WhatsApp, modales crear/editar.
- Tipos de cliente y detalle con historial/métricas (gerente/admin).
- Habeas Data: consentimiento, texto legal y fecha automática.
- QA: `docs/qa-epic-7.md`; pruebas de validación e.164/correo.

## 2026-11-11 — v1.2.2 Épica 6 (inventario demo)

- Entrada Manual, Detector USB y Carga rápida; badges y kardex con costo.
- Origen comprado/fabricado en formulario de productos.

## 2026-11-06 — v1.1.5 Cierre Sprint 1 (Épicas 13 y 18)

### Auditoría y UI transversal
- Panel **Auditoría**: buscador general, combobox de acción, tabla, detalle con diff, estados y toasts CA.
- `ConfirmDestructiveDialog` y `ConflictDialog` (HU 96–97); mensajes literales en `features/transversal`.

### Sedes y sitio público
- Desactivar/activar sede desde Acciones con modal de confirmación (fuera del formulario de edición).
- Checkbox **Sede principal** en crear/editar; footer e inicio consumen la sede `es_principal` (dirección, WhatsApp, cómo llegar).
- Sedes inactivas ocultas en `/sedes` vía API pública.

### Calidad
- Suite `pnpm run calidad` (ESLint, tsc, Vitest, build, Playwright) en verde para esta entrega.

---

## 2026-11-05 — v1.1.4 Épica 4 (sedes)

- Panel de sedes, vista pública de contacto y rediseño de matriz de permisos.

## 2026-11-05 — v1.1.3 Épica 3 (roles y permisos)

- Control de acceso en panel, gestión de roles y fixes de navegación UI.

## 2026-11-05 — v1.1.2 Épica 2 (usuarios y perfil)

- Panel de usuarios, confirmaciones de estado/rol y Mi perfil.

## 2026-11-04 — v1.1.1 Épica 1 (autenticación)

- Flujos de login, recuperación, 2FA y sesión en el portal.

## 2026-10 — v1.0.0 Línea base

- Scaffold Vite/React, layout del sitio y enrutado inicial del panel.
