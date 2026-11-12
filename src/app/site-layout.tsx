import { Outlet } from "react-router-dom"
import { SiteHeader } from "../components/site-header"
import { SiteFooter } from "../components/site-footer"
import { CartProvider } from "../components/cart/cart-provider"
import { getSiteSettings } from "../lib/public-data"
import { GlobalTooltips } from "../components/ui/global-tooltips"

export function SiteLayout() {
  const settings = getSiteSettings()
  return (
    <CartProvider>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-plum focus:shadow-lg"
      >
        Saltar al contenido
      </a>
      <SiteHeader whatsapp={settings.whatsapp} />
      <main id="contenido" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter settings={settings} />
      <GlobalTooltips />
    </CartProvider>
  )
}
