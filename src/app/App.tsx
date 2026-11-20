import { Navigate, Route, Routes, useParams } from "react-router-dom"
import {
  AboutPage,
  CambiarContrasenaPage,
  CartPage,
  CartRevalidatePage,
  CatalogPage,
  PedidoPage,
  ProductPage,
  HomePage,
  LoginPage,
  NoEncontrada,
  NuevaContrasenaPage,
  PanelModulePage,
  PanelResumenPage,
  PanelVentaImprimirPage,
  RecuperarPage,
  SedesPage,
  SitemapPage,
  VerificacionPage,
} from "./pages"
import { SiteLayout } from "./site-layout"
import { PanelShell } from "../components/panel/shell"

function LegacyCatalogProductLink() {
  const { slug } = useParams()
  return <Navigate to={`/producto/${slug ?? ""}`} replace />
}

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
        <Route path="/carrito/validar" element={<CartRevalidatePage />} />
        <Route path="/carrito/enviar" element={<PedidoPage />} />
        <Route path="/producto/:slug" element={<ProductPage />} />
        <Route path="/catalogo/:slug" element={<LegacyCatalogProductLink />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar" element={<RecuperarPage />} />
      <Route path="/nueva-contrasena" element={<NuevaContrasenaPage />} />
      <Route path="/verificacion" element={<VerificacionPage />} />
      <Route path="/cambiar-contrasena" element={<CambiarContrasenaPage />} />
      <Route path="/panel/administrador" element={<PanelShell><PanelResumenPage /></PanelShell>} />
      <Route path="/panel/gerente" element={<PanelShell><PanelResumenPage /></PanelShell>} />
      <Route path="/panel/empleado" element={<PanelShell><PanelResumenPage /></PanelShell>} />
      <Route path="/panel/:rol/imprimir/:id" element={<PanelShell><PanelVentaImprimirPage /></PanelShell>} />
      <Route path="/panel/:rol/:modulo" element={<PanelShell><PanelModulePage /></PanelShell>} />
      <Route path="/registro" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  )
}
