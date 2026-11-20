import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, History, ImagePlus, Loader2, Pencil, Plus, Power, Search, Upload } from "lucide-react"
import {
  Confirm,
  Empty,
  FieldLabel,
  FormAlert,
  Modal,
  Pager,
  btnGhost,
  btnPrimary,
  input,
  inputInvalid,
  useDebounced,
  useDo,
} from "../components/panel/kit"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import { OriginBadge } from "../features/inventory/badges"
import { toast } from "../features/en-desarrollo"
import { API_URL, api, mensajeDe } from "../shared/api"

type Item = {
  id_producto: number
  codigo_producto: string
  nombre: string
  categoria: string
  marca: string
  tipo: string
  precio_venta: string
  existencia: string | null
  stock_nivel: string
  origen?: string
  estado: boolean
  imagen_url: string
  version_fila: number
}
type Opt = { id_categoria?: number; id_marca?: number; id_tipo_producto?: number; nombre: string; es_base?: boolean }
type Detalle = {
  id_producto: number
  codigo_producto: string
  codigo_barras: string
  nombre: string
  descripcion: string
  id_categoria: number
  id_marca: number
  id_tipo_producto: number
  unidad_medida: string
  precio_compra: string
  precio_venta: string
  iva_porcentaje: string
  stock_minimo: number
  inventario_habilitado: boolean
  origen: string
  imagen_url: string
  version_fila: number
  estado: boolean
}

const vacio = {
  codigo_producto: "",
  codigo_barras: "",
  nombre: "",
  descripcion: "",
  id_categoria: "",
  id_marca: "",
  id_tipo_producto: "",
  unidad_medida: "UND",
  precio_compra: "",
  precio_venta: "",
  iva_porcentaje: "19",
  stock_minimo: "0",
  inventario_habilitado: true,
  origen: "comprado",
}

export function PanelProductosPage() {
  const { accionesModulo } = useAccesos()
  const acciones = accionesModulo("productos")
  const puedeCrear = puedeAccion(acciones, "Crear")
  const puedeEditar = puedeAccion(acciones, "Editar")
  const puedeEstado = puedeAccion(acciones, "Cambiar estado")
  const puedeExportar = puedeAccion(acciones, "Exportar") || puedeAccion(acciones, "Consultar")
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)
  const [q, setQ] = useState("")
  const debounced = useDebounced(q, 300)
  const [categoria, setCategoria] = useState("")
  const [marca, setMarca] = useState("")
  const [tipo, setTipo] = useState("")
  const [estado, setEstado] = useState("todos")
  const [stock, setStock] = useState("todos")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [orden, setOrden] = useState("nombre")
  const [catalogos, setCatalogos] = useState<{ categorias: Opt[]; marcas: Opt[]; tipos: Opt[]; unidades: string[] }>({
    categorias: [],
    marcas: [],
    tipos: [],
    unidades: ["UND"],
  })
  const [form, setForm] = useState<number | "new" | null>(null)
  const [estadoTarget, setEstadoTarget] = useState<Item | null>(null)
  const [historialId, setHistorialId] = useState<number | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const { run, pending } = useDo()

  const cargar = useCallback(async () => {
    setCargando(true)
    setError("")
    const qs = new URLSearchParams({
      q: debounced,
      page: String(page),
      page_size: String(pageSize),
      orden,
      estado,
      stock,
    })
    if (categoria) qs.set("id_categoria", categoria)
    if (marca) qs.set("id_marca", marca)
    if (tipo) qs.set("id_tipo", tipo)
    try {
      const r = await api(`/api/v1/catalogo/productos/?${qs}`)
      if (!r.ok) {
        setError("No fue posible cargar los productos. Intente nuevamente.")
        setItems([])
        return
      }
      const body = (await r.json()) as { items: Item[]; total: number; mensaje: string; catalogos: typeof catalogos }
      setItems(body.items)
      setTotal(body.total)
      setMensaje(body.mensaje)
      if (body.catalogos) setCatalogos(body.catalogos)
    } catch {
      setError("No fue posible cargar los productos. Intente nuevamente.")
    } finally {
      setCargando(false)
    }
  }, [debounced, page, pageSize, orden, estado, stock, categoria, marca, tipo])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])

  const toggleOrden = (col: string) => setOrden((o) => (o === col ? `-${col}` : col))
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <section className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Catálogo de productos</p>
          <h1 className="font-display text-4xl font-extrabold text-plum">Productos</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {puedeCrear && (
            <button type="button" className={btnGhost} onClick={() => setImportOpen(true)}>
              <Upload size={16} aria-hidden /> Importar
            </button>
          )}
          {puedeExportar && (
            <button type="button" className={btnGhost} onClick={() => setExportOpen(true)}>
              <Download size={16} aria-hidden /> Exportar
            </button>
          )}
          {puedeCrear && (
            <button type="button" className={btnPrimary} onClick={() => setForm("new")}>
              <Plus size={16} aria-hidden /> Nuevo producto
            </button>
          )}
        </div>
      </header>
      <div className="mb-5 rounded-2xl border-2 border-plum/10 bg-white p-4 shadow-[4px_4px_0_0_var(--color-plum)]">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cyan-dark">Filtros</p>
        <div className="space-y-3">
          <label className="relative block">
            <span className="sr-only">Buscar productos</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plum/40" />
            <input value={q} onChange={(e) => { setPage(1); setQ(e.target.value) }} placeholder="Nombre, código, barras o marca" className={`${input} !mt-0 pl-9`} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <Select label="Categoría" value={categoria} onChange={(v) => { setPage(1); setCategoria(v) }} todos options={catalogos.categorias.map((c) => ({ v: String(c.id_categoria), l: c.nombre }))} />
            <Select label="Marca" value={marca} onChange={(v) => { setPage(1); setMarca(v) }} todos options={catalogos.marcas.map((c) => ({ v: String(c.id_marca), l: c.nombre }))} />
            <Select label="Tipo" value={tipo} onChange={(v) => { setPage(1); setTipo(v) }} todos options={catalogos.tipos.map((c) => ({ v: String(c.id_tipo_producto), l: c.nombre }))} />
            <Select label="Estado" value={estado === "todos" ? "" : estado} onChange={(v) => { setPage(1); setEstado(v || "todos") }} todos options={[{ v: "activo", l: "Activo" }, { v: "inactivo", l: "Inactivo" }]} />
            <Select label="Stock" value={stock === "todos" ? "" : stock} onChange={(v) => { setPage(1); setStock(v || "todos") }} todos options={[{ v: "con_stock", l: "Con stock" }, { v: "bajo", l: "Stock bajo" }, { v: "agotado", l: "Agotado" }]} />
            <FieldLabel label="Por página">
              <select className={input} value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)) }}>
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>
        </div>
      </div>
      {error && (
        <div className="mb-4 rounded-xl border-2 border-brand p-4" role="alert">
          {error}
          <button type="button" className={`${btnGhost} ml-3`} onClick={() => void cargar()}>Reintentar</button>
        </div>
      )}
      {cargando ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-plum"><Loader2 className="animate-spin" size={16} /> Cargando productos…</p>
      ) : items.length === 0 ? (
        <Empty text={mensaje || "No se encontraron productos con los criterios indicados."} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-plum-soft text-xs uppercase tracking-wider text-plum">
              <tr>
                {[["", ""], ["codigo", "Código"], ["nombre", "Nombre"], ["categoria", "Categoría"], ["marca", "Marca"], ["tipo", "Tipo"], ["", "Origen"], ["precio", "Precio"], ["existencia", "Existencia"], ["estado", "Estado"], ["", "Acciones"]].map(([k, h]) => (
                  <th key={h || "img"} className="px-3 py-3">
                    {k ? <button type="button" className="font-bold" onClick={() => toggleOrden(k)}>{h}</button> : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-plum/10">
              {items.map((p) => (
                <tr key={p.id_producto} className="hover:bg-paper">
                  <td className="px-3 py-2">{p.imagen_url ? <img src={`${API_URL}/api/v1/catalogo/media/${p.imagen_url}`} alt="" className="size-10 rounded-lg object-cover" /> : <span className="grid size-10 place-items-center rounded-lg bg-plum-soft text-[10px] text-plum">N/A</span>}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.codigo_producto}</td>
                  <td className="px-3 py-2 font-semibold">{p.nombre}</td>
                  <td className="px-3 py-2">{p.categoria ? p.categoria : <SinAsignarBadge />}</td>
                  <td className="px-3 py-2">{p.marca ? p.marca : <SinAsignarBadge />}</td>
                  <td className="px-3 py-2">{p.tipo ? p.tipo : <SinAsignarBadge />}</td>
                  <td className="px-3 py-2"><OriginBadge value={p.origen || "comprado"} /></td>
                  <td className="px-3 py-2">{p.precio_venta}</td>
                  <td className="px-3 py-2">
                    {p.existencia ?? "N/A"}
                    {p.stock_nivel === "agotado" && <span className="ml-2 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">Agotado</span>}
                    {p.stock_nivel === "bajo" && <span className="ml-2 rounded-full bg-sun px-2 py-0.5 text-[10px] font-bold text-plum">Stock bajo</span>}
                  </td>
                  <td className="px-3 py-2">{p.estado ? "Activo" : "Inactivo"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {puedeEditar && <button type="button" aria-label={`Editar ${p.nombre}`} className="rounded-lg p-2 text-plum hover:bg-plum-soft" onClick={() => setForm(p.id_producto)}><Pencil size={16} /></button>}
                    {puedeEstado && <button type="button" aria-label={`Cambiar estado ${p.nombre}`} className="rounded-lg p-2 text-brand hover:bg-brand/10" onClick={() => setEstadoTarget(p)}><Power size={16} /></button>}
                    <button type="button" aria-label={`Historial de precios ${p.nombre}`} className="rounded-lg p-2 text-plum hover:bg-plum-soft" onClick={() => setHistorialId(p.id_producto)}><History size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-sm text-ink/70" role="status">{mensaje}</p>
      <Pager page={page} totalPages={totalPages} total={total} onPage={setPage} />
      {form !== null && (
        <ProductoForm
          id={form === "new" ? null : form}
          catalogos={catalogos}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); void cargar() }}
        />
      )}
      <Confirm
        open={Boolean(estadoTarget)}
        title="Cambiar estado"
        text="¿Está seguro de que desea cambiar el estado de este producto?"
        busy={pending}
        onNo={() => setEstadoTarget(null)}
        onYes={() => {
          if (!estadoTarget) return
          void run(async () => {
            const r = await api(`/api/v1/catalogo/productos/${estadoTarget.id_producto}/estado/`, {
              method: "POST",
              body: JSON.stringify({ activo: !estadoTarget.estado }),
            })
            const msg = await mensajeDe(r)
            if (!r.ok) {
              toast(msg || "No fue posible cambiar el estado del producto. Intente nuevamente.")
              return
            }
            toast(msg || "El estado del producto se actualizó correctamente.")
            setEstadoTarget(null)
            void cargar()
          })
        }}
      />
      {historialId !== null && <HistorialModal id={historialId} onClose={() => setHistorialId(null)} />}
      {importOpen && <ImportarModal onClose={() => { setImportOpen(false); void cargar() }} />}
      {exportOpen && (
        <ExportarProductosModal
          onClose={() => setExportOpen(false)}
          page={page}
          pageSize={pageSize}
          filters={{ q: debounced, estado, stock, categoria, marca, tipo }}
        />
      )}
    </section>
  )
}

function SinAsignarBadge() {
  return <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold uppercase text-ink/45">Sin asignar</span>
}

function nombreArchivoExport(header: string | null, fallback: string): string {
  if (!header) return fallback
  const star = /filename\*=(?:UTF-8'')?([^;\n]+)/i.exec(header)
  if (star) return decodeURIComponent(star[1].replace(/"/g, "").trim())
  const plain = /filename="?([^";\n]+)"?/i.exec(header)
  return plain ? plain[1].trim() : fallback
}

function ExportarProductosModal({
  onClose,
  page,
  pageSize,
  filters,
}: {
  onClose: () => void
  page: number
  pageSize: number
  filters: { q: string; estado: string; stock: string; categoria: string; marca: string; tipo: string }
}) {
  const [alcance, setAlcance] = useState<"pagina" | "filtrado">("filtrado")
  const [formato, setFormato] = useState<"csv" | "xlsx">("xlsx")
  const [error, setError] = useState("")
  const { run, pending } = useDo()

  const exportar = () =>
    run(async () => {
      setError("")
      const qs = new URLSearchParams({ formato, alcance, q: filters.q, estado: filters.estado, stock: filters.stock })
      if (filters.categoria) qs.set("id_categoria", filters.categoria)
      if (filters.marca) qs.set("id_marca", filters.marca)
      if (filters.tipo) qs.set("id_tipo", filters.tipo)
      if (alcance === "pagina") {
        qs.set("page", String(page))
        qs.set("page_size", String(pageSize))
      }
      const r = await api(`/api/v1/catalogo/productos/exportar/?${qs}`)
      if (!r.ok) {
        const msg = (await mensajeDe(r)) || "No fue posible generar la exportación. Intente nuevamente."
        setError(msg)
        return
      }
      const blob = await r.blob()
      const fallback = formato === "csv" ? "catalogo-productos.csv" : "catalogo-productos.xlsx"
      const name = nombreArchivoExport(r.headers.get("Content-Disposition"), fallback)
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = name
      a.click()
      toast("Exportación generada correctamente.")
      onClose()
    })

  return (
    <Modal open title="Exportar productos" onClose={onClose}>
      <FormAlert message={error} />
      <FieldLabel label="Alcance" required>
        <select className={input} value={alcance} onChange={(e) => setAlcance(e.target.value as "pagina" | "filtrado")}>
          <option value="filtrado">Todos los resultados filtrados</option>
          <option value="pagina">Solo la página actual</option>
        </select>
      </FieldLabel>
      <FieldLabel label="Formato" required className="mt-3">
        <select className={input} value={formato} onChange={(e) => setFormato(e.target.value as "csv" | "xlsx")}>
          <option value="xlsx">Excel (.xlsx)</option>
          <option value="csv">CSV (.csv)</option>
        </select>
      </FieldLabel>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className={btnGhost} onClick={onClose} disabled={pending}>
          Cancelar
        </button>
        <button type="button" className={btnPrimary} disabled={pending} onClick={() => void exportar()}>
          {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
          Exportar
        </button>
      </div>
    </Modal>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
  todos,
  required,
  invalid,
  emptyLabel = "Seleccione…",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { v: string; l: string }[]
  todos?: boolean
  required?: boolean
  invalid?: boolean
  emptyLabel?: string
}) {
  return (
    <FieldLabel label={label} required={required}>
      <select
        className={invalid ? inputInvalid : input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
      >
        <option value="">{todos ? "Todos" : emptyLabel}</option>
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </FieldLabel>
  )
}

const OBLIG_PRODUCTO: { key: keyof typeof vacio; label: string }[] = [
  { key: "codigo_producto", label: "Código" },
  { key: "nombre", label: "Nombre" },
  { key: "id_categoria", label: "Categoría" },
  { key: "id_marca", label: "Marca" },
  { key: "id_tipo_producto", label: "Tipo" },
  { key: "unidad_medida", label: "Unidad de medida" },
  { key: "precio_compra", label: "Precio de compra" },
  { key: "precio_venta", label: "Precio de venta" },
  { key: "iva_porcentaje", label: "IVA" },
  { key: "stock_minimo", label: "Stock mínimo" },
  { key: "origen", label: "Origen" },
]

function ProductoForm({ id, catalogos, onClose, onSaved }: { id: number | null; catalogos: { categorias: Opt[]; marcas: Opt[]; tipos: Opt[]; unidades: string[] }; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(vacio)
  const [version, setVersion] = useState(1)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [progreso, setProgreso] = useState(0)
  const [formError, setFormError] = useState("")
  const [invalid, setInvalid] = useState<Set<string>>(new Set())
  const { run, pending } = useDo()
  const isNew = id === null

  useEffect(() => {
    if (id === null) return
    void api(`/api/v1/catalogo/productos/${id}/`).then(async (r) => {
      if (!r.ok) return
      const d = (await r.json()) as Detalle
      setVersion(d.version_fila)
      setF({
        codigo_producto: d.codigo_producto,
        codigo_barras: d.codigo_barras || "",
        nombre: d.nombre,
        descripcion: d.descripcion || "",
        id_categoria: String(d.id_categoria),
        id_marca: String(d.id_marca),
        id_tipo_producto: String(d.id_tipo_producto),
        unidad_medida: d.unidad_medida,
        precio_compra: d.precio_compra,
        precio_venta: d.precio_venta,
        iva_porcentaje: d.iva_porcentaje,
        stock_minimo: String(d.stock_minimo),
        inventario_habilitado: d.inventario_habilitado,
        origen: d.origen || "comprado",
      })
      if (d.imagen_url) setPreview(`${API_URL}/api/v1/catalogo/media/${d.imagen_url}`)
    })
  }, [id])

  const validar = () => {
    const next = new Set<string>()
    for (const { key } of OBLIG_PRODUCTO) {
      const v = f[key]
      if (String(v).trim() === "") next.add(key)
    }
    const barras = f.codigo_barras.trim()
    if (barras && (!/^\d+$/.test(barras) || barras.length > 14)) {
      next.add("codigo_barras")
      setInvalid(next)
      setFormError("El código de barras debe ser numérico y tener máximo 14 dígitos.")
      return false
    }
    if (next.size) {
      const faltan = OBLIG_PRODUCTO.filter(({ key }) => next.has(key)).map(({ label }) => label)
      setInvalid(next)
      setFormError(`Todos los campos obligatorios deben ser diligenciados. Faltan: ${faltan.join(", ")}.`)
      return false
    }
    setInvalid(new Set())
    setFormError("")
    return true
  }

  const guardar = () =>
    run(async () => {
      if (!validar()) return
      if (Number(f.precio_venta) < Number(f.precio_compra) && !window.confirm("El precio de venta es menor al precio de compra. ¿Desea continuar?")) return
      let motivo = ""
      const body = {
        ...f,
        id_categoria: Number(f.id_categoria),
        id_marca: Number(f.id_marca),
        id_tipo_producto: Number(f.id_tipo_producto),
        precio_compra: f.precio_compra,
        precio_venta: f.precio_venta,
        iva_porcentaje: f.iva_porcentaje,
        stock_minimo: Number(f.stock_minimo),
        version_fila: version,
        motivo,
      }
      if (!isNew) {
        const actual = await api(`/api/v1/catalogo/productos/${id}/`)
        if (actual.ok) {
          const d = (await actual.json()) as Detalle
          const cambio = String(d.precio_compra) !== String(f.precio_compra) || String(d.precio_venta) !== String(f.precio_venta) || String(d.iva_porcentaje) !== String(f.iva_porcentaje)
          if (cambio) {
            motivo = window.prompt("Motivo del cambio") || ""
            if (!motivo.trim()) {
              setFormError("Debe ingresar el motivo de la modificación de precio.")
              return
            }
            body.motivo = motivo
          }
        }
      }
      const r = await api(isNew ? "/api/v1/catalogo/productos/" : `/api/v1/catalogo/productos/${id}/`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(body),
      })
      const msg = await mensajeDe(r)
      if (!r.ok) {
        setFormError(msg || (isNew ? "No fue posible crear el producto. Intente nuevamente." : "No fue posible actualizar el producto. Intente nuevamente."))
        return
      }
      const creado = (await r.json()) as { producto?: { id_producto: number } }
      const pid = creado.producto?.id_producto ?? id
      toast(msg || (isNew ? "Producto creado correctamente." : "Producto actualizado correctamente."))
      onSaved()
      if (archivo && pid) {
        void subir(pid, archivo, setProgreso).catch(() => {
          toast("El registro se guardó, pero la imagen no se pudo cargar. Puede reintentarla al editar.")
        })
      }
    })

  const sinCatalogo =
    catalogos.categorias.length === 0 || catalogos.marcas.length === 0 || catalogos.tipos.length === 0

  return (
    <Modal open title={isNew ? "Crear producto" : "Editar producto"} onClose={onClose} wide>
      <FormAlert message={formError} />
      {sinCatalogo && (
        <p className="mb-3 rounded-xl border-2 border-plum/20 bg-plum-soft p-3 text-sm text-plum">
          Cree al menos una categoría, una marca y un tipo activos en el menú del catálogo antes de guardar el producto.
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Código" required placeholder="Ej. VIN-001" invalid={invalid.has("codigo_producto")} value={f.codigo_producto} onChange={(v) => setF({ ...f, codigo_producto: v })} />
        <Field label="Código de barras" placeholder="Ej. 7701234567890 (máx. 14 dígitos)" invalid={invalid.has("codigo_barras")} value={f.codigo_barras} onChange={(v) => setF({ ...f, codigo_barras: v })} />
        <Field label="Nombre" required placeholder="Ej. Vinilo mate blanco 1 L" invalid={invalid.has("nombre")} value={f.nombre} onChange={(v) => setF({ ...f, nombre: v })} />
        <FieldLabel label="Descripción" className="md:col-span-2">
          <textarea className={input} rows={2} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} placeholder="Uso, acabado, presentación…" />
        </FieldLabel>
        <Select required invalid={invalid.has("id_categoria")} label="Categoría" value={f.id_categoria} onChange={(v) => setF({ ...f, id_categoria: v })} options={catalogos.categorias.map((c) => ({ v: String(c.id_categoria), l: c.nombre }))} />
        <Select required invalid={invalid.has("id_marca")} label="Marca" value={f.id_marca} onChange={(v) => setF({ ...f, id_marca: v })} options={catalogos.marcas.map((c) => ({ v: String(c.id_marca), l: c.nombre }))} />
        <Select required invalid={invalid.has("id_tipo_producto")} label="Tipo" value={f.id_tipo_producto} onChange={(v) => setF({ ...f, id_tipo_producto: v })} options={catalogos.tipos.map((c) => ({ v: String(c.id_tipo_producto), l: c.nombre }))} />
        <Select required invalid={invalid.has("unidad_medida")} label="Unidad de medida" value={f.unidad_medida} onChange={(v) => setF({ ...f, unidad_medida: v })} options={catalogos.unidades.map((u) => ({ v: u, l: u }))} />
        <Select required invalid={invalid.has("origen")} label="Origen" value={f.origen} onChange={(v) => setF({ ...f, origen: v })} options={[{ v: "comprado", l: "Comprado (proveedor)" }, { v: "fabricado", l: "Fabricado en empresa" }]} />
        <p className="text-xs text-ink/60 md:col-span-2">Comprado: se adquiere a un proveedor. Fabricado: se produce en la empresa.</p>
        <Field required invalid={invalid.has("precio_compra")} label="Precio de compra" placeholder="0.00" value={f.precio_compra} onChange={(v) => setF({ ...f, precio_compra: v })} />
        <Field required invalid={invalid.has("precio_venta")} label="Precio de venta" placeholder="0.00" value={f.precio_venta} onChange={(v) => setF({ ...f, precio_venta: v })} />
        <Field required invalid={invalid.has("iva_porcentaje")} label="IVA (%)" placeholder="19" value={f.iva_porcentaje} onChange={(v) => setF({ ...f, iva_porcentaje: v })} />
        <Field required invalid={invalid.has("stock_minimo")} label="Stock mínimo" placeholder="0" value={f.stock_minimo} onChange={(v) => setF({ ...f, stock_minimo: v })} />
        <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
          <input type="checkbox" checked={f.inventario_habilitado} onChange={(e) => setF({ ...f, inventario_habilitado: e.target.checked })} /> Inventario habilitado
          <span className="text-brand"> *</span>
        </label>
        <div className="md:col-span-2">
          <p className="mb-1.5 text-sm font-semibold">Imagen</p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cyan bg-cyan/10 px-4 py-8 text-center transition hover:bg-cyan/20">
            <ImagePlus size={28} className="text-cyan-dark" aria-hidden />
            <span className="text-sm font-bold text-plum">Adjuntar imagen del producto</span>
            <span className="text-xs text-ink/60">JPG, JPEG, PNG o WEBP · máximo 5 MB</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setArchivo(file)
                setPreview(file ? URL.createObjectURL(file) : preview)
              }}
            />
          </label>
          {preview && <img src={preview} alt="Vista previa" className="mt-3 h-24 w-24 rounded-xl object-cover" />}
          {progreso > 0 && <progress className="mt-2 w-full" value={progreso} max={100} aria-label="Progreso de carga" />}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className={btnGhost} onClick={onClose}>Cancelar</button>
        <button type="button" className={btnPrimary} disabled={pending} onClick={() => void guardar()}>{pending ? <Loader2 className="animate-spin" size={16} /> : isNew ? "Guardar producto" : "Guardar cambios"}</button>
      </div>
    </Modal>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  invalid,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
  invalid?: boolean
}) {
  return (
    <FieldLabel label={label} required={required}>
      <input
        className={invalid ? inputInvalid : input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={invalid}
      />
    </FieldLabel>
  )
}

function subir(id: number, file: File, setProgreso: (n: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${API_URL}/api/v1/catalogo/productos/${id}/imagen/`)
    xhr.timeout = 60000
    const token = sessionStorage.getItem("mpdw_access_token_v1")
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgreso(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error("imagen"))
    }
    xhr.onerror = () => reject(new Error("imagen"))
    xhr.ontimeout = () => reject(new Error("imagen"))
    const data = new FormData()
    data.append("imagen", file)
    xhr.send(data)
  })
}

function HistorialModal({ id, onClose }: { id: number; onClose: () => void }) {
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [body, setBody] = useState<{ producto?: { codigo_producto: string; nombre: string }; items: { id_historial: number; precio_compra: string; precio_venta: string; iva_porcentaje: string; fecha_inicio: string; fecha_fin: string; motivo: string; usuario: string; precio_anterior: string; precio_nuevo: string }[]; mensaje: string } | null>(null)
  const [sel, setSel] = useState<number | null>(null)
  const [error, setError] = useState("")
  const cargar = useCallback(async () => {
    const qs = new URLSearchParams()
    if (desde) qs.set("desde", desde)
    if (hasta) qs.set("hasta", hasta)
    const r = await api(`/api/v1/catalogo/productos/${id}/historial/?${qs}`)
    if (!r.ok) {
      setError((await mensajeDe(r)) || "No fue posible cargar el historial de precios. Intente nuevamente.")
      return
    }
    setError("")
    setBody(await r.json())
  }, [id, desde, hasta])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])
  const fila = useMemo(() => body?.items.find((i) => i.id_historial === sel), [body, sel])
  return (
    <Modal open title="Historial de precios" onClose={onClose} wide>
      <p className="text-sm text-ink/70">{body?.producto?.codigo_producto} · {body?.producto?.nombre}</p>
      <div className="mt-3 flex gap-3">
        <label className="text-sm font-semibold">Desde<input type="date" className={input} value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
        <label className="text-sm font-semibold">Hasta<input type="date" className={input} value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-brand">{error}</p>}
      {!error && body && body.items.length === 0 && <Empty text={body.mensaje} />}
      {body && body.items.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr>{["Compra", "Venta", "IVA", "Inicio", "Fin", "Motivo", "Usuario"].map((h) => <th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
            <tbody>
              {body.items.map((h) => (
                <tr key={h.id_historial} className="cursor-pointer border-t" onClick={() => setSel(h.id_historial)}>
                  <td className="px-2 py-2">{h.precio_compra}</td>
                  <td className="px-2 py-2">{h.precio_venta}</td>
                  <td className="px-2 py-2">{h.iva_porcentaje}</td>
                  <td className="px-2 py-2">{h.fecha_inicio.slice(0, 10)}</td>
                  <td className="px-2 py-2">{h.fecha_fin ? h.fecha_fin.slice(0, 10) : ""}</td>
                  <td className="px-2 py-2">{h.motivo}</td>
                  <td className="px-2 py-2">{h.usuario || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-sm">{body.mensaje}</p>
          {fila && <p className="mt-2 rounded-xl bg-plum-soft p-3 text-sm">Anterior: {fila.precio_anterior} · Nuevo: {fila.precio_nuevo}</p>}
        </div>
      )}
    </Modal>
  )
}

function ImportarModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [progreso, setProgreso] = useState(0)
  const [reporte, setReporte] = useState<{ mensaje: string; errores: { fila: number; columna: string; motivo: string }[] } | null>(null)
  const { run, pending } = useDo()
  return (
    <Modal open title="Importar productos" onClose={onClose}>
      <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <button type="button" className={`${btnGhost} mt-3`} onClick={() => {
        void api("/api/v1/catalogo/productos/plantilla/").then(async (r) => {
          const blob = await r.blob()
          const a = document.createElement("a")
          a.href = URL.createObjectURL(blob)
          a.download = "plantilla-productos.xlsx"
          a.click()
        })
      }}>Descargar plantilla</button>
      {progreso > 0 && <progress className="mt-3 w-full" value={progreso} max={100} />}
      {reporte && (
        <div className="mt-3 text-sm">
          <p>{reporte.mensaje}</p>
          {reporte.errores.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-auto">
              {reporte.errores.map((e) => <li key={`${e.fila}-${e.motivo}`}>Fila {e.fila} {e.columna}: {e.motivo}</li>)}
            </ul>
          )}
        </div>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className={btnGhost} onClick={onClose}>Cancelar</button>
        <button type="button" className={btnPrimary} disabled={!file || pending} onClick={() => void run(async () => {
          if (!file) return
          const data = new FormData()
          data.append("archivo", file)
          setProgreso(30)
          const r = await api("/api/v1/catalogo/productos/importar/", { method: "POST", body: data, headers: {} })
          setProgreso(100)
          if (!r.ok) {
            toast((await mensajeDe(r)) || "No fue posible procesar el archivo. Intente nuevamente.")
            return
          }
          const body = await r.json()
          setReporte(body)
          toast(body.mensaje)
        })}>Validar y cargar</button>
      </div>
    </Modal>
  )
}
