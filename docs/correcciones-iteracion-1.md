# Iteración 1 — Correcciones dirigidas (épica autenticación)

## Frontend

- Se añadió ESLint (typescript-eslint + react-hooks) y script `pnpm exec eslint`.
- Se añadió `Makefile` con objetivo `calidad` (lint, typecheck, test, build).
- Se añadió workflow `.github/workflows/ci.yml` con las mismas puertas antes de merge o despliegue.
- Se mantiene `VITE_API_URL=http://localhost:8000` en `.env.example`, alineado con el puerto del backend en desarrollo.
- Ajustes ESLint en `pages.tsx`, `shell.tsx` y `logic.ts` (inactividad, token en hash y regex de correo).

## Nota de ramas

Los commits de esta épica deben integrarse vía `epica-1-autenticacion` hacia `develop`; evitar adelantar `main` hasta el cierre formal de la épica.
