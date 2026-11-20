# QA — Épica 5 (Catálogo + parámetros + formularios)

## Precondiciones

- Rol administrador con permiso `catalogo_productos` (Total o equivalente).
- Comando `python manage.py seed_catalogo_parametros` ejecutado (tipos base, Vinilos, Diana).
- Al menos una categoría, marca y tipo activos en listados.

## Parámetros (páginas separadas)

- Menú: Productos, Categorías de producto, Marcas, Tipos de producto.
- Cada página: buscador, Nuevo, tabla, editar.
- Tipos base (`Producto Terminado`, `Materia Prima`, `Insumo`, `Combo/Promoción`, `Servicio`) no desactivables.
- Crear categoría/marca/tipo no base y verificar en selects de producto.

## Productos (HU 22–30)

- Crear producto con todos los obligatorios: éxito y mensaje HU.
- Validación: banner dentro del modal + campos en rojo; mensaje literal si faltan obligatorios.
- Editar precio: motivo obligatorio.
- Listado, filtros, import/export, historial según HU previa.

## UX formularios

- Asterisco `text-brand` en obligatorios (producto, sedes, usuarios, login, parámetros).
- Placeholders en campos de texto y selects (`Seleccione…`).
- Toast visible sobre modal (inserción en `dialog` abierto).

## Automatizado

- Backend: `tests/unit/test_epic5_catalogo*.py`, `test_epic5_catalogo_parametros.py`
- Frontend: `npm exec -- pnpm@10.15.0 run calidad`
