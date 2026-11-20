import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, X, SlidersHorizontal, SearchX, RotateCcw } from "lucide-react"
import { ProductCard } from "./product-card"
import { fetchCatalogo, fetchTiendaFiltros, mapProducto, ORDEN_URL, type TiendaFiltros } from "../features/tienda/api"
import type { PublicProduct } from "../lib/public-data"
import { toast } from "../features/en-desarrollo"

const PAGE = 12
const SEDE_KEY = "mpd-sede-id"

function leerSede(): number | undefined {
  try {
    const n = Number.parseInt(localStorage.getItem(SEDE_KEY) || "", 10)
    return Number.isFinite(n) && n > 0 ? n : undefined
  } catch {
    return undefined
  }
}

export function CatalogClient() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get("q") ?? "")
  const [filtros, setFiltros] = useState<TiendaFiltros | null>(null)
  const [products, setProducts] = useState<PublicProduct[]>([])
  const [mensaje, setMensaje] = useState("")
  const [total, setTotal] = useState(0)
  const page = Number.parseInt(searchParams.get("page") || "1", 10) || 1
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const idCat = searchParams.get("id_categoria") ?? ""
  const idMarca = searchParams.get("id_marca") ?? ""
  const idTipo = searchParams.get("id_tipo") ?? ""
  const precioMin = searchParams.get("precio_min") ?? ""
  const precioMax = searchParams.get("precio_max") ?? ""
  const ordenUi = searchParams.get("orden") ?? ""
  const ordenApi = ORDEN_URL[ordenUi] ?? "destacados"

  const setParam = useCallback(
    (k: string, v: string) => {
      const n = new URLSearchParams(searchParams)
      if (v) n.set(k, v)
      else n.delete(k)
      if (k !== "page") n.delete("page")
      setSearchParams(n, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  useEffect(() => {
    const t = window.setTimeout(() => {
      if ((searchParams.get("q") ?? "") !== q.trim()) setParam("q", q.trim())
    }, 300)
    return () => window.clearTimeout(t)
  }, [q, searchParams, setParam])

  useEffect(() => {
    fetchTiendaFiltros().then(setFiltros)
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCatalogo({
        q: searchParams.get("q") ?? undefined,
        id_categoria: idCat ? Number(idCat) : undefined,
        id_marca: idMarca ? Number(idMarca) : undefined,
        id_tipo: idTipo ? Number(idTipo) : undefined,
        precio_min: precioMin || undefined,
        precio_max: precioMax || undefined,
        orden: ordenApi,
        page,
        id_sede: leerSede(),
      })
      setProducts(data.items.map(mapProducto))
      setMensaje(data.mensaje)
      setTotal(data.total)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No fue posible cargar el catálogo. Intente nuevamente."
      setError(msg)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [searchParams, idCat, idMarca, idTipo, precioMin, precioMax, ordenApi, page])

  useEffect(() => {
    // Sincroniza lista con parámetros de URL (HU 88)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [cargar])

  const limpiar = () => {
    setQ("")
    setSearchParams({}, { replace: true })
    toast("Filtros restablecidos")
  }

  const active = useMemo(() => {
    const chips: [string, string][] = []
    if (idCat && filtros) {
      const c = filtros.categorias.find((x) => String(x.id) === idCat)
      if (c) chips.push(["id_categoria", c.nombre])
    }
    if (idMarca && filtros) {
      const m = filtros.marcas.find((x) => String(x.id) === idMarca)
      if (m) chips.push(["id_marca", m.nombre])
    }
    if (idTipo && filtros) {
      const t = filtros.tipos_producto.find((x) => String(x.id) === idTipo)
      if (t) chips.push(["id_tipo", t.nombre])
    }
    return chips
  }, [idCat, idMarca, idTipo, filtros])

  const sel = "rounded-2xl border-2 border-plum/15 bg-white px-4 py-3 text-sm font-semibold text-ink outline-none transition focus:border-cyan"
  const catalogSearch = `?${searchParams.toString()}`

  return (
    <div>
      <div className="sticky top-[76px] z-30 -mx-5 border-b border-plum/10 bg-white/95 px-5 py-4 backdrop-blur md:-mx-10 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Buscar productos</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-plum/50" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, código o marca"
              className="w-full rounded-2xl border-2 border-plum/15 py-3 pl-12 pr-4 outline-none transition focus:border-cyan"
            />
          </label>
          <SlidersHorizontal className="hidden size-5 text-plum/50 md:block" aria-hidden />
          <select aria-label="Categoría" value={idCat} onChange={(e) => setParam("id_categoria", e.target.value)} className={sel}>
            <option value="">Todas las categorías</option>
            {(filtros?.categorias ?? []).map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre}
              </option>
            ))}
          </select>
          <select aria-label="Marca" value={idMarca} onChange={(e) => setParam("id_marca", e.target.value)} className={sel}>
            <option value="">Todas las marcas</option>
            {(filtros?.marcas ?? []).map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.nombre}
              </option>
            ))}
          </select>
          <select aria-label="Tipo" value={idTipo} onChange={(e) => setParam("id_tipo", e.target.value)} className={sel}>
            <option value="">Todos los tipos</option>
            {(filtros?.tipos_producto ?? []).map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.nombre}
              </option>
            ))}
          </select>
          <select aria-label="Ordenar" value={ordenUi} onChange={(e) => setParam("orden", e.target.value)} className={sel}>
            <option value="">Más relevantes / Destacados</option>
            <option value="menor">Precio: Menor a Mayor</option>
            <option value="mayor">Precio: Mayor a Menor</option>
            <option value="nombre">Nombre: A - Z</option>
            <option value="nombre-desc">Nombre: Z - A</option>
          </select>
        </div>
        <div className="mx-auto mt-3 flex max-w-7xl flex-wrap items-center gap-2">
          <input
            type="number"
            min={0}
            step="0.01"
            aria-label="Precio mínimo"
            placeholder="Precio mín."
            value={precioMin}
            onChange={(e) => setParam("precio_min", e.target.value)}
            className="w-32 rounded-xl border-2 border-plum/15 px-3 py-2 text-sm"
          />
          <span className="text-ink/50">—</span>
          <input
            type="number"
            min={0}
            step="0.01"
            aria-label="Precio máximo"
            placeholder="Precio máx."
            value={precioMax}
            onChange={(e) => setParam("precio_max", e.target.value)}
            className="w-32 rounded-xl border-2 border-plum/15 px-3 py-2 text-sm"
          />
        </div>
        {active.length > 0 && (
          <div className="mx-auto mt-3 flex max-w-7xl flex-wrap gap-2">
            {active.map(([k, v]) => (
              <button key={k} type="button" onClick={() => setParam(k, "")} className="inline-flex items-center gap-1.5 rounded-full bg-plum px-3 py-1.5 text-xs font-bold text-white hover:bg-brand">
                {v} <X className="size-3.5" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="skeleton mt-6 h-48 rounded-3xl" role="status" aria-live="polite" />
      ) : error ? (
        <div className="stripes mt-6 rounded-3xl border-2 border-dashed border-plum/30 p-14 text-center">
          <p className="font-display text-2xl font-bold text-plum">{error}</p>
          <button type="button" onClick={() => cargar()} className="mt-6 rounded-full bg-brand px-8 py-3 font-bold text-white">
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <p className="mt-6 font-mono text-xs uppercase tracking-wider text-ink/55" aria-live="polite">
            {mensaje || `Mostrando ${products.length} productos.`}
          </p>
          {products.length === 0 ? (
            <div className="stripes mt-6 rounded-3xl border-2 border-dashed border-plum/30 p-14 text-center">
              <SearchX className="mx-auto size-12 text-brand" aria-hidden />
              <p className="mt-4 font-display text-2xl font-bold text-plum">No encontramos productos con los criterios indicados.</p>
              <button type="button" onClick={limpiar} className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-plum px-8 py-3 font-bold text-plum">
                <RotateCcw className="size-4" aria-hidden /> Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <li key={p.id}>
                    <ProductCard p={p} catalogSearch={catalogSearch} />
                  </li>
                ))}
              </ul>
              {page * PAGE < total && (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={() => setParam("page", String(page + 1))}
                    className="rounded-full border-2 border-plum px-8 py-3 font-bold text-plum transition hover:bg-plum hover:text-white"
                  >
                    Ver más productos
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}