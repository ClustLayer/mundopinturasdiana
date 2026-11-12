# QA — Épica 4 (Sedes y contacto)

## Panel Sedes (admin con permiso)

- Listado: orden, nombre, dirección, WhatsApp, activa; filtros búsqueda y estado.
- **Nueva sede:** campos obligatorios → "Todos los campos obligatorios deben ser diligenciados."
- Teléfono/WhatsApp formato e.164 inválido → mensajes HU 19.
- Horarios: por día L–D, cerrado, apertura/cierre; cierre ≤ apertura → error de horario.
- Éxito crear: "Sede creada correctamente."; editar: "Sede actualizada correctamente."
- Desactivar con jornada abierta → mensaje de jornada (cuando aplique en BD).

## Sitio público `/sedes`

- Muestra sedes activas desde API; layout igual demo (featured + grid).
- Sin sedes: recuadro en desarrollo.

## Permisos

- Usuario sin permiso sedes no ve menú ni accede a ruta.
- Administrador sin Total en sedes (matriz) no debe pasar guards API.

## Automatizado

- Backend: `tests/unit/test_epic4_sedes.py`, `test_epic4_sedes_views.py`
- Frontend: `pnpm run calidad`
