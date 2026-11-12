# QA manual — Cierre Sprint 1 (Épicas 13 y 18)

**Versión:** 1.1.5  
**Fecha:** 2026-11-06  

Véase el mismo plan en `mpdw-backend/docs/qa-sprint1-closing.md` para criterios de API y base de datos. Aquí se enfatiza la capa UI.

## Épica 13 — Bitácora (pixel-perfect vs demo)

- Tabla, filtros, tipografía y espaciado alineados con `MundoPinturasDiana-Demo` (referencia visual única).
- Estados: carga (spinner), vacío (mensaje CA 6.1), error (CA 6.2), éxito con contador CA 5.
- Debounce 300 ms en búsqueda de usuario del combo.
- Detalle: diff legible; WCAG: foco visible, `role` en diálogos.

## Épica 18 — HU 96 / 97

- `ConfirmDestructiveDialog`: motivo obligatorio cuando la operación lo exige; etiquetas legibles.
- `ConflictDialog`: textos literales; botones Recargar / Cancelar.
- Toasts accesibles (`role="status"` en implementación de `toast`).

## Comando de calidad

```bash
pnpm install
pnpm run calidad
```

Si `pnpm` no está instalado globalmente: `corepack enable` (requiere permisos) o `npx pnpm@10.15.0 run calidad`. Navegadores E2E: `npx playwright install chromium`.
