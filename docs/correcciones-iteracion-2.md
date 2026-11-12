# Correcciones iteración 2 — restauración visual frontend

## Objetivo

Alinear `mpdw-frontend` con la demo `MundoPinturasDiana-Demo` en layout, clases Tailwind, tokens CSS y flujos públicos, manteniendo la integración real de autenticación (`VITE_API_URL`, `src/shared/api.ts`, `src/app/providers.tsx`).

## Sitio público

- **Layout:** `SiteLayout` con `SiteHeader`, `SiteFooter` y `CartProvider` (equivalente al layout Next de la demo).
- **Páginas:** inicio, catálogo, sobre nosotros, sedes, mapa del sitio, carrito.
- **Datos de catálogo:** `src/lib/demo/build-fixtures.ts` + `src/lib/public-data.ts` (solo lectura, sin mock de auth).
- **Componentes portados/adaptados:** splash, reveal, product-card, catalog-client, carruseles, promociones, eventos, branch-card.
- **Enlaces:** `react-router-dom` (`Link` / `Navigate`); imágenes con `<img src="/brand/...">`.

## Login y recuperación

- **Pantalla:** `src/pages/login-page.tsx` + `src/components/auth/login-form.tsx` + `src/components/auth/recovery-flow.tsx` (mismas clases que la demo).
- **API:** login, recuperar y restablecer vía `/api/v1/auth/*` existentes.

## Panel protegido

- **Shell:** `src/components/panel/shell.tsx` (layout demo: sidebar colapsable, íconos Lucide, modal de inactividad).
- **Logout:** `POST /api/v1/auth/logout` + `salir()` del provider.
- **Resumen:** `src/pages/panel-resumen.tsx` con KPIs alimentados por fixtures demo.
- **Módulos:** rutas `/panel/:rol/:modulo` muestran placeholder; acciones no implementadas → `alert('Funcionalidad en desarrollo')`.

## Estilos y assets

- **`src/styles.css`:** tokens `@theme`, animaciones y utilidades copiadas de la demo; variables `--nf-*` en `:root`.
- **`public/brand/`:** `logo.png`, `logo-alt.jpg`, `banner.jpg` copiados de la demo.
- **`index.html`:** fuentes Bricolage Grotesque, Instrument Sans, DM Mono.

## Dependencias

- **`lucide-react`** añadido en `package.json`.

## Rutas (`src/app/App.tsx`)

- Públicas bajo `SiteLayout`: `/`, `/catalogo`, `/sobre-nosotros`, `/sedes`, `/mapa-del-sitio`, `/carrito`.
- Auth: `/login`, `/recuperar` → login, `/nueva-contrasena`, `/verificacion`, `/cambiar-contrasena`.
- Panel: `/panel/administrador|gerente|empleado` y `/panel/:rol/:modulo`.

## Archivos eliminados / reemplazados

- Eliminado `src/app/shell.tsx` (shell genérico de iteración 1).
- `src/app/pages.tsx` pasa a reexportar páginas modulares en `src/pages/`.

## Verificación

- `pnpm run lint`
- `pnpm run typecheck`
