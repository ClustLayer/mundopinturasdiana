import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, X, SlidersHorizontal, SearchX } from "lucide-react"
import { ProductCard } from "./product-card"
import { EN_DESARROLLO } from "../features/en-desarrollo"
import type { PublicProduct } from "../lib/public-data"

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
const PAGE = 12

export function CatalogClient({ products }: { products: PublicProduct[] }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get("q") ?? "")
  const cat = searchParams.get("categoria") ?? ""
  const brand = searchParams.get("marca") ?? ""
  const tipo = searchParams.get("tipo") ?? ""
  const sort = searchParams.get("orden") ?? "nombre"
  const [shown, setShown] = useState(PAGE)

  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(searchParams)
    if (v) n.set(k, v)
    else n.delete(k)
    setSearchParams(n, { replace: true })
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      if ((searchParams.get("q") ?? "") !== q.trim()) setParam("q", q.trim())
    }, 300)
    return () => window.clearTimeout(t)
    // setParam estable respecto a searchParams
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, searchParams])

  const cats = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of products) if (p.categorySlug && p.category) m.set(p.categorySlug, p.category)
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"))
  }, [products])
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand).filter(Boolean) as string[])].sort(), [products])

  const list = useMemo(() => {
    const term = norm(searchParams.get("q") ?? "")
    let r = products.filter(
      (p) =>
        (!cat || p.categorySlug === cat) &&
        (tipo !== "artistico" || p.artistic) &&
        (!brand || p.brand === brand) &&
        (!term || norm(`${p.name} ${p.sku} ${p.brand ?? ""} ${p.category ?? ""} ${p.productType ?? ""}`).includes(term)),
    )
    r = [...r].sort((a, b) =>
      sort === "menor" ? a.salePrice - b.salePrice : sort === "mayor" ? b.salePrice - a.salePrice : a.name.localeCompare(b.name, "es"),
    )
    return r
  }, [products, searchParams, cat, brand, tipo, sort])

  const active = [cat && ["categoria", cats.find(([s]) => s === cat)?.[1] ?? cat], brand && ["marca", brand], tipo === "artistico" && ["tipo", "Artísticos"]].filter(Boolean) as [string, string][]
  const sel = "rounded-2xl border-2 border-plum/15 bg-white px-4 py-3 text-sm font-semibold text-ink outline-none transition focus:border-cyan"

  return (
    <div>
      <div className="sticky top-[76px] z-30 -mx-5 border-b border-plum/10 bg-white/95 px-5 py-4 backdrop-blur md:-mx-10 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Buscar productos</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-plum/50" aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, marca o referencia" className="w-full rounded-2xl border-2 border-plum/15 py-3 pl-12 pr-4 outline-none transition focus:border-cyan" />
          </label>
          <SlidersHorizontal className="hidden size-5 text-plum/50 md:block" aria-hidden />
          <select aria-label="Categoría" value={cat} onChange={(e) => setParam("categoria", e.target.value)} className={sel}>
            <option value="">Todas las categorías</option>
            {cats.map(([slug, name]) => (
              <option key={slug} value={slug}>
                {name}
              </option>
            ))}
          </select>
          <select aria-label="Marca" value={brand} onChange={(e) => setParam("marca", e.target.value)} className={sel}>
            <option value="">Todas las marcas</option>
            {brands.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select aria-label="Ordenar" value={sort} onChange={(e) => setParam("orden", e.target.value === "nombre" ? "" : e.target.value)} className={sel}>
            <option value="nombre">Nombre A–Z</option>
            <option value="menor">Menor precio</option>
            <option value="mayor">Mayor precio</option>
          </select>
        </div>
        {active.length > 0 && (
          <div className="mx-auto mt-3 flex max-w-7xl flex-wrap gap-2">
            {active.map(([k, v]) => (
              <button key={k} type="button" onClick={() => setParam(k, "")} className="inline-flex items-center gap-1.5 rounded-full bg-plum px-3 py-1.5 text-xs font-bold text-white hover:bg-brand">
                {v} <X className="size-3.5" aria-label="Quitar filtro" />
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 font-mono text-xs uppercase tracking-wider text-ink/55" aria-live="polite">
        {list.length} {list.length === 1 ? "producto" : "productos"}
      </p>

      {list.length === 0 ? (
        <div className="stripes mt-6 rounded-3xl border-2 border-dashed border-plum/30 p-14 text-center">
          <SearchX className="mx-auto size-12 text-brand" aria-hidden />
          <p className="mt-4 font-display text-2xl font-bold text-plum">{products.length === 0 ? EN_DESARROLLO : "No encontramos coincidencias"}</p>
          <p className="mt-2 text-ink/65">{products.length === 0 ? "El catálogo se conectará al backend en una iteración posterior." : "Prueba otro término o quita filtros."}</p>
        </div>
      ) : (
        <>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.slice(0, shown).map((p) => (
              <li key={p.id}>
                <ProductCard p={p} />
              </li>
            ))}
          </ul>
          {shown < list.length && (
            <div className="mt-10 text-center">
              <button type="button" onClick={() => setShown((s) => s + PAGE)} className="rounded-full border-2 border-plum px-8 py-3 font-bold text-plum transition hover:bg-plum hover:text-white">
                Ver más productos
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
