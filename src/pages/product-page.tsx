import { Link, useLocation, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import { fetchProductoDetalle, mapProducto } from "../features/tienda/api"
import { useCart } from "../components/cart/cart-provider"
import { toast } from "../features/en-desarrollo"
import { formatCOPClient } from "../lib/format"
import { Squiggle } from "../components/ui/splash"

const SEDE_KEY = "mpd-sede-id"

function leerSede(): number | undefined {
  try {
    const n = Number.parseInt(localStorage.getItem(SEDE_KEY) || "", 10)
    return Number.isFinite(n) && n > 0 ? n : undefined
  } catch {
    return undefined
  }
}

export function ProductPage() {
  const { slug = "" } = useParams()
  const location = useLocation()
  const catalogBack = `/catalogo${location.state?.catalogSearch ?? ""}`
  const { add } = useCart()
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [item, setItem] = useState<ReturnType<typeof mapProducto> | null>(null)
  const [seo, setSeo] = useState<{ titulo: string; descripcion: string } | null>(null)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const raw = await fetchProductoDetalle(slug, leerSede())
        if (cancel) return
        setItem(mapProducto(raw))
        if (raw.seo) {
          setSeo({ titulo: raw.seo.titulo, descripcion: raw.seo.descripcion })
          document.title = raw.seo.titulo
          const meta = document.querySelector('meta[name="description"]')
          if (meta) meta.setAttribute("content", raw.seo.descripcion)
        }
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : "No fue posible cargar el producto. Intente nuevamente.")
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [slug])

  if (loading) return <div className="skeleton mx-auto mt-20 h-96 max-w-4xl rounded-3xl" role="status" aria-live="polite" />

  if (error || !item) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <p className="font-display text-2xl font-bold text-plum">{error ?? "El producto que busca no está disponible."}</p>
        <Link to={catalogBack} className="mt-8 inline-block rounded-full bg-brand px-8 py-3 font-bold text-white">
          Ir al catálogo
        </Link>
      </div>
    )
  }

  const agregar = () => {
    if (!item.inStock) return
    add(
      { id: item.id, slug: item.slug, name: item.name, sku: item.sku, price: item.salePrice, image: item.image?.url },
      qty,
    )
    toast(`${item.name} agregado al carrito.`)
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pb-16 pt-14 md:px-10">
      <Link to={catalogBack} className="inline-flex items-center gap-2 text-sm font-bold text-plum hover:text-brand">
        <ArrowLeft className="size-4" aria-hidden /> Volver al catálogo
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border-2 border-plum/10 bg-plum-soft">
          {item.image ? (
            <img src={item.image.url} alt={item.image.alt} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
          ) : (
            <div className="dots grid aspect-square place-items-center font-display text-6xl text-plum/30">{item.name.slice(0, 1)}</div>
          )}
        </div>
        <div>
          <p className="kicker">{[item.brand, item.category, item.productType].filter(Boolean).join(" · ")}</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold text-plum md:text-5xl">{item.name}</h1>
          <Squiggle className="mt-3 h-4 w-40" />
          <p className="mt-6 text-ink/75">{item.description || "Producto disponible en nuestra tienda."}</p>
          <p className="mt-8 font-display text-4xl font-extrabold text-ink">{formatCOPClient(item.salePrice)}</p>
          {item.unit && <p className="text-sm text-ink/55">Unidad: {item.unit}</p>}
          <p className="mt-2 text-xs text-ink/60">Incluye IVA / Impoconsumo según aplique al producto.</p>
          <p className="mt-4 font-semibold text-ink/80">{item.inStock ? "Disponible" : "Agotado"}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 font-semibold text-ink">
              Cantidad
              <input
                type="number"
                min={1}
                max={99}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(99, Number.parseInt(e.target.value, 10) || 1)))}
                className="w-20 rounded-xl border-2 border-plum/20 px-3 py-2"
              />
            </label>
            <button
              type="button"
              disabled={!item.inStock}
              onClick={agregar}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 font-bold text-white disabled:opacity-50"
            >
              <ShoppingBag className="size-5" aria-hidden /> Agregar al carrito
            </button>
          </div>
          {seo && <p className="sr-only">{seo.descripcion}</p>}
        </div>
      </div>
    </div>
  )
}