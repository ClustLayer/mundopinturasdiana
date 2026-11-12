import { useLocation } from "react-router-dom"
import { Squiggle } from "../components/ui/splash"
import { CatalogClient } from "../components/catalog-client"
import { getProducts } from "../lib/public-data"

export function CatalogPage() {
  const location = useLocation()
  const products = getProducts()
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-14 md:px-10">
      <p className="kicker">Catálogo</p>
      <h1 className="mt-2 font-display text-5xl font-extrabold text-plum md:text-6xl">Elige tu color</h1>
      <Squiggle className="mt-3 h-4 w-52" />
      <p className="mt-4 max-w-2xl text-ink/70">Precios sujetos a confirmación y disponibilidad. Confirma tu pedido con la sede por WhatsApp.</p>
      <div className="mt-8">
        <CatalogClient key={location.search} products={products} />
      </div>
      </div>
    </div>
  )
}
