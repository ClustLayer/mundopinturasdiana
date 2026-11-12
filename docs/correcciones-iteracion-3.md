# Correcciones iteración 3 (HU MPDW 01 01)

## Seguridad y UX

- Eliminado el bloque de credenciales demo del formulario de login (`login-form.tsx`).
- Los datos de demostración ya no se renderizan en catálogo, carruseles, sedes, promociones, eventos ni panel operativo.

## Datos públicos y panel

- `public-data.ts` expone tipos y ajustes de sitio, pero devuelve colecciones vacías hasta integrar API.
- Componente reutilizable `EnDesarrolloRecuadro` y constante `EN_DESARROLLO` para estados sin backend.
- Se conservan filtros, rutas, carruseles (solo títulos) y layout de la demo.

## Validación local

- `npm run lint`, `typecheck`, `test`, `build` ejecutados con éxito en `mpdw-frontend`.
- Vitest (unitarias + axe en `en-desarrollo-recuadro.a11y.test.tsx`) y Playwright (`e2e/smoke.spec.ts`) integrados en CI.

## Git

- `epica-1-autenticacion` realineada sobre `develop` (`git reset --soft develop`) para permitir PR sin historiales divergentes.
