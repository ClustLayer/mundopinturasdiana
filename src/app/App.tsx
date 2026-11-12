import { Navigate, Route, Routes } from "react-router-dom"
import {
  AboutPage,
  CambiarContrasenaPage,
  CartPage,
  CatalogPage,
  HomePage,
  LoginPage,
  NoEncontrada,
  NuevaContrasenaPage,
  PanelModulePage,
  PanelResumenPage,
  RecuperarPage,
  SedesPage,
  SitemapPage,
  VerificacionPage,
} from "./pages"
import { SiteLayout } from "./site-layout"
import { PanelShell } from "../components/panel/shell"

export function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/sobre-nosotros" element={<AboutPage />} />
        <Route path="/sedes" element={<SedesPage />} />
        <Route path="/mapa-del-sitio" element={<SitemapPage />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/catalogo/:slug" element={<Navigate to="/catalogo" replace />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar" element={<RecuperarPage />} />
      <Route path="/nueva-contrasena" element={<NuevaContrasenaPage />} />
      <Route path="/verificacion" element={<VerificacionPage />} />
      <Route path="/cambiar-contrasena" element={<CambiarContrasenaPage />} />
      <Route path="/panel/administrador" element={<PanelShell><PanelResumenPage /></PanelShell>} />
      <Route path="/panel/gerente" element={<PanelShell><PanelResumenPage /></PanelShell>} />
      <Route path="/panel/empleado" element={<PanelShell><PanelResumenPage /></PanelShell>} />
      <Route path="/panel/:rol/:modulo" element={<PanelShell><PanelModulePage /></PanelShell>} />
      <Route path="/registro" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  )
}
