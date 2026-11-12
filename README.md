# Mundo Pinturas Diana — Portal

[![pnpm](https://img.shields.io/badge/pnpm-10-F69220)](https://pnpm.io/)
[![React](https://img.shields.io/badge/React-19-149ECA)](https://react.dev/)
[![WCAG](https://img.shields.io/badge/WCAG-2.1%20AA-green)](https://www.w3.org/WAI/WCAG21/quickref/)
[![License](https://img.shields.io/badge/license-Privada-red)](LICENSE)

**Versión del portal:** 1.1.5 (Sprint 1 — cierre Épicas 13 y 18; entregas previas 1.1.1–1.1.4 por épica).

Portal de produccion del backoffice. La demo visual permanece en `MundoPinturasDiana-Demo` y no se modifica. Este proyecto reproduce la pantalla de acceso y deja el resto de modulos enrutados con el aviso "Funcionalidad en desarrollo".

## Uso

```bash
pnpm install
cp .env.example .env
pnpm dev
```

`VITE_API_URL` apunta al backend, por defecto `http://localhost:8000`.

```bash
pnpm test
pnpm run build
```

Las dependencias se instalan solo con pnpm.
