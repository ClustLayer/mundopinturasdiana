# HU extras — Épica 5 (parámetros y UX)

## HU_EXTRA_MPDW_01_27B — Marcas (página dedicada)

Yo como administrador quiero gestionar marcas en una página igual a «Categorías de producto» para clasificar productos.

**CA:** menú Marcas, CRUD con nombre obligatorio, estado con confirmación HU 98, permisos de `catalogo_productos`.

## HU_EXTRA_MPDW_01_27C — Tipos de producto (página dedicada)

Yo como administrador quiero gestionar tipos en una página al estilo categorías, con tipos base precargados.

**CA:** menú Tipos de producto; cinco tipos base no desactivables; casilla «Afecta venta diaria».

## HU_EXTRA_MPDW_UX_FORMS — Convenciones de formularios

**CA:** `*` brand en obligatorios; placeholder en cada campo; errores de validación visibles dentro del formulario/modal (no solo toast tras overlay).

## Cambios extras a HU 22–30 (sin reescribir originales)

- Pantalla de categorías de producto separada (antes pestañas).
- Seed mínimo Vinilos/Diana + tipos base en entornos vacíos.
- Formulario producto bloqueado con catálogos vacíos y mensaje orientativo.
