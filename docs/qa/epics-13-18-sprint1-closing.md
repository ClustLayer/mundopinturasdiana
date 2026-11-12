# QA UI — Épicas 13 y 18 (Cierre Sprint 1) · v1.1.5

**Fecha:** 2026-11-06  
**Rama:** `epica-13-18-cierre-sprint1`

Ver criterios de API en `mpdw-backend/docs/qa/epics-13-18-sprint1-closing.md`.

## Épica 13 — Visor de auditoría

- Buscador general + combobox de Acción (sin campos sueltos de entidad/ID).
- Tabla, detalle con resaltado, estados carga/vacío/error, debounce 300 ms.
- Pixel-perfect respecto a la demo del panel.

## Épica 18 — Diálogos transversales

- Confirmación destructiva (foco atrapado, motivo cuando aplica).
- Conflicto de edición: textos literales, recargar / cancelar, draft en sessionStorage.

## Sedes y sitio público

- Ícono Power en Acciones → modal «¿Está seguro de que desea desactivar esta sede?».
- Checkbox sede principal en el formulario.
- Footer e Inicio («Visítanos») con datos de la sede principal.
- Sedes inactivas ocultas en «Sedes y contacto».

## Automatizado

```bash
pnpm run calidad
```
