# Correcciones iteración 10 — Épica 5 cierre UX

## Panel catálogo

- Tres páginas dedicadas (categorías, marcas, tipos) alineadas a la demo de categorías de producto.
- Entradas de menú `marcas` y `tipos_producto`; permisos replicados desde `catalogo_productos`.
- `categorias_movimientos` deja de usar la ruta `categorias` del panel (reservada al catálogo).

## Datos

- Comando `seed_catalogo_parametros`: tipos base, categoría Vinilos, marca Diana (idempotente).

## Formularios

- `FormAlert`, `inputInvalid`, `FieldLabel` con `*` en obligatorios.
- Producto: lista de faltantes en el modal; placeholders en todos los campos del formulario.
- Login, sedes, usuarios, permisos: placeholders y asteriscos donde aplica.

## Toast

- Si hay `<dialog open>`, el aviso se inserta dentro del contenido del modal (no queda detrás del backdrop).
