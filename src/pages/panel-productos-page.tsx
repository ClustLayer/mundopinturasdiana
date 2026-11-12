import { useCallback, useEffect, useMemo, useState } from "react"
import { History, Loader2, Pencil, Plus, Power, Search, Upload } from "lucide-react"
import {
  Confirm,
  Empty,
  Modal,
  Pager,
  btnGhost,
  btnPrimary,
  input,
  useDebounced,
  useDo,
} from "../components/panel/kit"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
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
  const [formato, setFormato] = useState("")
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

  const exportar = () =>
    run(async () => {
      if (!formato) return
      const qs = new URLSearchParams({ formato, q: debounced, estado, stock })
      if (categoria) qs.set("id_categoria", categoria)
      if (marca) qs.set("id_marca", marca)
      if (tipo) qs.set("id_tipo", tipo)
      const r = await api(`/api/v1/catalogo/productos/exportar/?${qs}`)
      if (!r.ok) {
        toast((await mensajeDe(r)) || "No fue posible generar la exportación. Intente nuevamente.")
        return
      }
      const blob = await r.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = formato === "csv" ? "catalogo-productos.csv" : "catalogo-productos.xlsx"
      a.click()
      toast("Exportación generada correctamente.")
    })

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
          {puedeCrear && (
            <button type="button" className={btnPrimary} onClick={() => setForm("new")}>
              <Plus size={16} aria-hidden /> Nuevo producto
            </button>
          )}
        </div>
      </header>
      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="relative xl:col-span-2">
          <span className="sr-only">Buscar productos</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plum/40" />
          <input value={q} onChange={(e) => { setPage(1); setQ(e.target.value) }} placeholder="Nombre, código, barras o marca" className={`${input} pl-9`} />
        </label>
        <Select label="Categoría" value={categoria} onChange={(v) => { setPage(1); setCategoria(v) }} options={catalogos.categorias.map((c) => ({ v: String(c.id_categoria), l: c.nombre }))} />
        <Select label="Marca" value={marca} onChange={(v) => { setPage(1); setMarca(v) }} options={catalogos.marcas.map((c) => ({ v: String(c.id_marca), l: c.nombre }))} />
        <Select label="Tipo" value={tipo} onChange={(v) => { setPage(1); setTipo(v) }} options={catalogos.tipos.map((c) => ({ v: String(c.id_tipo_producto), l: c.nombre }))} />
        <Select label="Estado" value={estado} onChange={(v) => { setPage(1); setEstado(v) }} todos options={[{ v: "activo", l: "Activo" }, { v: "inactivo", l: "Inactivo" }]} />
        <Select label="Stock" value={stock} onChange={(v) => { setPage(1); setStock(v) }} todos options={[{ v: "con_stock", l: "Con stock" }, { v: "bajo", l: "Stock bajo" }, { v: "agotado", l: "Agotado" }]} />
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
                {[["", ""], ["codigo", "Código"], ["nombre", "Nombre"], ["categoria", "Categoría"], ["marca", "Marca"], ["tipo", "Tipo"], ["precio", "Precio"], ["existencia", "Existencia"], ["estado", "Estado"], ["", "Acciones"]].map(([k, h]) => (
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
                  <td className="px-3 py-2">{p.categoria}</td>
                  <td className="px-3 py-2">{p.marca}</td>
                  <td className="px-3 py-2">{p.tipo}</td>
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
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold">Por página
          <select className={`${input} ml-2 !mt-0 w-auto`} value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)) }}>
            {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        {puedeExportar && (
          <>
            <select aria-label="Formato de exportación" className={`${input} !mt-0 w-auto`} value={formato} onChange={(e) => setFormato(e.target.value)}>
              <option value="">Formato</option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV</option>
            </select>
            <button type="button" className={btnPrimary} disabled={!formato || pending} onClick={() => void exportar()}>Exportar</button>
          </>
        )}
      </div>
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
    </section>
  )
}

function Select({ label, value, onChange, options, todos }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[]; todos?: boolean }) {
  return (
    <label className="text-sm font-semibold">{label}
      <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{todos ? "Todos" : "Todos"}</option>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  )
}

function ProductoForm({ id, catalogos, onClose, onSaved }: { id: number | null; catalogos: { categorias: Opt[]; marcas: Opt[]; tipos: Opt[]; unidades: string[] }; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(vacio)
  const [version, setVersion] = useState(1)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [progreso, setProgreso] = useState(0)
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
      })
      if (d.imagen_url) setPreview(`${API_URL}/api/v1/catalogo/media/${d.imagen_url}`)
    })
  }, [id])

  const guardar = () =>
    run(async () => {
      const oblig = [f.codigo_producto, f.nombre, f.id_categoria, f.id_marca, f.id_tipo_producto, f.unidad_medida, f.precio_compra, f.precio_venta, f.iva_porcentaje, f.stock_minimo]
      if (oblig.some((v) => String(v).trim() === "")) {
        toast("Todos los campos obligatorios deben ser diligenciados.")
        return
      }
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
              toast("Debe ingresar el motivo de la modificación de precio.")
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
        toast(msg || (isNew ? "No fue posible crear el producto. Intente nuevamente." : "No fue posible actualizar el producto. Intente nuevamente."))
        return
      }
      const creado = (await r.json()) as { producto?: { id_producto: number } }
      const pid = creado.producto?.id_producto ?? id
      if (archivo && pid) await subir(pid, archivo, setProgreso)
      toast(msg || (isNew ? "Producto creado correctamente." : "Producto actualizado correctamente."))
      onSaved()
    })

  return (
    <Modal open title={isNew ? "Crear producto" : "Editar producto"} onClose={onClose} wide>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Código" value={f.codigo_producto} onChange={(v) => setF({ ...f, codigo_producto: v })} />
        <Field label="Código de barras" value={f.codigo_barras} onChange={(v) => setF({ ...f, codigo_barras: v })} />
        <Field label="Nombre" value={f.nombre} onChange={(v) => setF({ ...f, nombre: v })} />
        <label className="text-sm font-semibold md:col-span-2">Descripción<textarea className={input} rows={2} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></label>
        <Select label="Categoría" value={f.id_categoria} onChange={(v) => setF({ ...f, id_categoria: v })} options={catalogos.categorias.map((c) => ({ v: String(c.id_categoria), l: c.nombre }))} />
        <Select label="Marca" value={f.id_marca} onChange={(v) => setF({ ...f, id_marca: v })} options={catalogos.marcas.map((c) => ({ v: String(c.id_marca), l: c.nombre }))} />
        <Select label="Tipo" value={f.id_tipo_producto} onChange={(v) => setF({ ...f, id_tipo_producto: v })} options={catalogos.tipos.map((c) => ({ v: String(c.id_tipo_producto), l: c.nombre }))} />
        <Select label="Unidad de medida" value={f.unidad_medida} onChange={(v) => setF({ ...f, unidad_medida: v })} options={catalogos.unidades.map((u) => ({ v: u, l: u }))} />
        <Field label="Precio de compra" value={f.precio_compra} onChange={(v) => setF({ ...f, precio_compra: v })} />
        <Field label="Precio de venta" value={f.precio_venta} onChange={(v) => setF({ ...f, precio_venta: v })} />
        <Field label="IVA" value={f.iva_porcentaje} onChange={(v) => setF({ ...f, iva_porcentaje: v })} />
        <Field label="Stock mínimo" value={f.stock_minimo} onChange={(v) => setF({ ...f, stock_minimo: v })} />
        <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
          <input type="checkbox" checked={f.inventario_habilitado} onChange={(e) => setF({ ...f, inventario_habilitado: e.target.checked })} /> Inventario habilitado
        </label>
        <label className="text-sm font-semibold md:col-span-2">Imagen
          <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm" onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            setArchivo(file)
            setPreview(file ? URL.createObjectURL(file) : preview)
          }} />
        </label>
        {preview && <img src={preview} alt="Vista previa" className="h-24 w-24 rounded-xl object-cover" />}
        {progreso > 0 && <progress className="w-full" value={progreso} max={100} aria-label="Progreso de carga" />}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className={btnGhost} onClick={onClose}>Cancelar</button>
        <button type="button" className={btnPrimary} disabled={pending} onClick={() => void guardar()}>{pending ? <Loader2 className="animate-spin" size={16} /> : isNew ? "Guardar producto" : "Guardar cambios"}</button>
      </div>
    </Modal>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="text-sm font-semibold">{label}<input className={input} value={value} onChange={(e) => onChange(e.target.value)} /></label>
}

function subir(id: number, file: File, setProgreso: (n: number) => void) {
  return new Promise<void>((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${API_URL}/api/v1/catalogo/productos/${id}/imagen/`)
    const token = sessionStorage.getItem("mpdw_access_token_v1")
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgreso(Math.round((e.loaded / e.total) * 100)) }
    xhr.onloadend = () => resolve()
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

type Param = { id: number; nombre: string; descripcion: string; estado: boolean; version_fila: number; afecta_venta_diaria?: boolean; es_base?: boolean }

export function PanelParametrosPage() {
  const [tab, setTab] = useState<"categorias" | "marcas" | "tipos">("categorias")
  const [items, setItems] = useState<Param[]>([])
  const [edit, setEdit] = useState<Param | "new" | null>(null)
  const { run, pending } = useDo()
  const cargar = useCallback(async () => {
    const r = await api(`/api/v1/catalogo/parametros/${tab}/`)
    if (!r.ok) return
    setItems(((await r.json()) as { items: Param[] }).items)
  }, [tab])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])
  return (
    <section className="mx-auto max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Catálogo de productos</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Parámetros de producto</h1>
      <nav className="my-4 flex gap-2" aria-label="Parámetros">
        {(["categorias", "marcas", "tipos"] as const).map((t) => (
          <button key={t} type="button" className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === t ? "bg-plum text-white" : "bg-white"}`} onClick={() => setTab(t)}>
            {t === "categorias" ? "Categorías" : t === "marcas" ? "Marcas" : "Tipos"}
          </button>
        ))}
        <button type="button" className={btnPrimary} onClick={() => setEdit("new")}><Plus size={16} /> Nuevo</button>
      </nav>
      {items.length === 0 ? <Empty text="No hay registros." /> : (
        <ul className="divide-y rounded-2xl border-2 border-plum/10 bg-white">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between px-4 py-3">
              <div><p className="font-semibold">{it.nombre}</p><p className="text-sm text-ink/60">{it.descripcion || "—"} · {it.estado ? "Activo" : "Inactivo"}</p></div>
              <button type="button" className="rounded-lg p-2" aria-label={`Editar ${it.nombre}`} onClick={() => setEdit(it)}><Pencil size={16} /></button>
            </li>
          ))}
        </ul>
      )}
      {edit && (
        <ParamForm
          tipo={tab}
          row={edit === "new" ? null : edit}
          pending={pending}
          onClose={() => setEdit(null)}
          onSave={(payload) => void run(async () => {
            const r = await api(edit === "new" ? `/api/v1/catalogo/parametros/${tab}/` : `/api/v1/catalogo/parametros/${tab}/${(edit as Param).id}/`, {
              method: edit === "new" ? "POST" : "PATCH",
              body: JSON.stringify(payload),
            })
            const msg = await mensajeDe(r)
            if (!r.ok) {
              toast(msg || (edit === "new" ? "No fue posible guardar el registro. Intente nuevamente." : "No fue posible actualizar el registro. Intente nuevamente."))
              return
            }
            toast(msg)
            setEdit(null)
            void cargar()
          })}
        />
      )}
    </section>
  )
}

function ParamForm({ tipo, row, pending, onClose, onSave }: { tipo: string; row: Param | null; pending: boolean; onClose: () => void; onSave: (p: Record<string, unknown>) => void }) {
  const [nombre, setNombre] = useState(row?.nombre ?? "")
  const [descripcion, setDescripcion] = useState(row?.descripcion ?? "")
  const [estado, setEstado] = useState(row?.estado ?? true)
  const [afecta, setAfecta] = useState(row?.afecta_venta_diaria ?? true)
  return (
    <Modal open title={row ? "Editar" : "Nuevo"} onClose={onClose}>
      <label className="text-sm font-semibold">Nombre<input className={input} value={nombre} onChange={(e) => setNombre(e.target.value)} /></label>
      <label className="mt-3 block text-sm font-semibold">Descripción<textarea className={input} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></label>
      {tipo === "tipos" && <label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={afecta} onChange={(e) => setAfecta(e.target.checked)} /> Afecta venta diaria</label>}
      {row && <label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={estado} onChange={(e) => setEstado(e.target.checked)} /> Activo</label>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className={btnGhost} onClick={onClose}>Cancelar</button>
        <button type="button" className={btnPrimary} disabled={pending} onClick={() => {
          if (!nombre.trim()) {
            toast("El nombre es obligatorio.")
            return
          }
          if (row && row.estado && !estado && !window.confirm("¿Está seguro de que desea cambiar el estado de este producto?")) return
          onSave({ nombre, descripcion, estado, afecta_venta_diaria: afecta, version_fila: row?.version_fila ?? 1 })
        }}>Guardar</button>
      </div>
    </Modal>
  )
}
