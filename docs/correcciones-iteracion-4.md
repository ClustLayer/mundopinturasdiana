# Correcciones iteración 4 (HU MPDW 01)

## Autenticación y recuperación

- Flujo de recuperación alineado con enlace `#rt` (sin código de 6 dígitos en login).
- Manejo de errores de red en solicitud y reenvío de recuperación.
- Sincronización del correo en login tras completar la solicitud de enlace.

## Sesión e inactividad

- Timers de inactividad cargados desde `/api/v1/auth/politica-sesion` con fallback local.
- Temporizador de cierre independiente del modal de advertencia.
- Enlace «Mi cuenta» apunta a `/cambiar-contrasena`.

## Accesibilidad y resiliencia

- Skip link «Saltar al contenido» y foco en `#contenido`.
- Carrito tolerante a fallos de `localStorage`.
- Cierre del menú móvil al pasar a viewport desktop.
- Toasts sin apilamiento en acciones rápidas.

## Calidad

- Script `pnpm run calidad` (lint, typecheck, Vitest, build, Playwright).
