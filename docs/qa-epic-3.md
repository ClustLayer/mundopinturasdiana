# QA — Épica 3 (Roles, permisos, control de acceso)

Precondición: administrador autenticado; roles base **Administrador**, **Gerente**, **Empleado** en BD.

## Roles base inmutables

- En pestaña **Roles**, filas con “Rol base = Sí” no muestran editar ni eliminar.
- `PATCH` sobre rol Administrador cambiando `estado: false` → error de negocio (API o UI).
- `DELETE` sobre id de rol base → 400/409 con mensaje de rol protegido.

## Roles personalizados

- **Nuevo rol**: crear rol custom; aparece en listado con “Rol base = No”.
- **Editar**: solo ícono lápiz; modal guarda descripción/estado.
- **Eliminar**: ícono basurera → confirmación → `DELETE` exitoso si no hay usuarios asignados.
- Rol custom con usuario asignado: eliminar debe fallar con mensaje de usuarios asignados.

## Catálogo de permisos

- Filtros módulo/acción con ancho responsive.
- Crear permiso: acciones incluyen **Sin acceso** y **Total** además de Crear, Consultar, Editar, etc.
- Editar permiso: solo ícono lápiz.

## Matriz

- Asignar permisos a rol o usuario; **Guardar permisos** persiste y muestra toast.
- Tras guardar, navegar a otro módulo: menú lateral refleja accesos actualizados (refresco de accesos-panel).

## Sin acceso y Total (guards reales)

- Asignar permiso **Sin acceso** sobre un módulo (p. ej. eventos) a un rol de prueba.
- Usuario con ese rol: el ítem de menú del módulo no debe mostrarse o debe mostrar acceso denegado al entrar.
- API protegida del módulo: peticiones deben responder 403 si el backend exige permiso.
- Asignar **Total** o **T** en matriz: usuario puede consultar y mutar según reglas de alias (crear/editar/consultar).

## Accesos panel (HU 18)

- `GET /api/v1/auth/accesos-panel`: módulos sin solo “Sin acceso” aparecen en `modulos`; `acciones_por_modulo` coherente.
- Usuario no administrador: solo ve entradas de menú permitidas.

## Automatizado

- Backend: `make calidad`; tests `test_epic3_roles_permisos.py`, `test_permiso_eval.py`, `test_permiso_repository.py`, `test_openapi_contract.py`.
- Frontend: `npx pnpm run calidad`; `features/accesos/logic.test.ts`.
