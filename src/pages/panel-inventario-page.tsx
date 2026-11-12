import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  Barcode,
  ClipboardList,
  FileText,
  HelpCircle,
  Keyboard,
  Loader2,
  Search,
  Trash2,
} from "lucide-react"
import {
  Empty,
  FieldLabel,
  FormAlert,
  Panel,
  SearchCombobox,
  btnGhost,
  btnPrimary,
  input,
  useDo,
} from "../components/panel/kit"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import { OriginBadge, TypeBadge } from "../features/inventory/badges"
import { dt, money } from "../features/inventory/format"
import { parseBulkInventoryText } from "../features/inventory/inventory-bulk"
import { toast } from "../features/en-desarrollo"
import { api, mensajeDe } from "../shared/api"

type Sede = { id_sede: number; nombre: string }
type ProveedorOpt = { id_proveedor: number; nombre: string; numero_documento?: string }
type Fila = { id_producto: number; nombre: string; codigo: string; origen: string; minimo: number; celdas: Record<string, number>; total: number }
type ProdOpt = { id_producto: number; nombre: string; codigo: string; codigo_barras: string; origen: string }
type Mov = {
  id_movimiento: number
  fecha: string
  producto: string
  sede: string
  tipo: string
  cantidad: number
  delta: number
  anterior: number
  nueva: number
  costo_unitario: string | null
  motivo: string
  referencia: string
  proveedor: string
  usuario: string
}
type EntryMode = "manual" | "barcode" | "bulk"

const TABS = [
  { id: "stock", label: "Existencias" },
  { id: "kardex", label: "Historial de movimientos" },
  { id: "entrada", label: "Registrar entrada" },
  { id: "ajuste", label: "Ajuste / merma" },
  { id: "traslado", label: "Traslado" },
] as const

const resolveProduct = (products: ProdOpt[], code: string) => {
  const c = code.trim().toLowerCase()
  if (!c) return undefined
  return products.find(
    (p) => p.codigo.toLowerCase() === c || p.codigo_barras.toLowerCase() === c || String(p.id_producto) === c,
  )
}

export function PanelInventarioPage() {
  const { accionesModulo } = useAccesos()
  const puedeEscribir = puedeAccion(accionesModulo("inventario"), "Crear") || puedeAccion(accionesModulo("inventario"), "Total")
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("stock")
  const tabs = TABS.filter((t) => puedeEscribir || t.id === "stock" || t.id === "kardex")
  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Inventario</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Inventario</h1>
      <p className="max-w-3xl text-sm text-ink/65">
        Todos los productos creados aparecen aquí. Registra entradas, ajustes y traslados; cada movimiento actualiza el saldo y deja historial.
      </p>
      <nav className="flex flex-wrap gap-2" aria-label="Secciones de inventario">
        {tabs.map((t) => {
          const active = tab === t.id
          let cls = active ? "bg-plum text-white" : "bg-white border-2 border-plum/15 text-plum"
          if (t.id === "entrada") {
            cls = active
              ? "bg-brand text-white shadow-[3px_3px_0_0_var(--color-plum)]"
              : "border-2 border-brand/35 bg-white text-brand"
          } else if (t.id === "ajuste" || t.id === "traslado") {
            cls = active ? "bg-cyan-dark text-white" : "border-2 border-cyan/40 bg-white text-cyan-dark"
          } else if (!active) {
            cls = "bg-white border-2 border-plum/15 text-plum"
          }
          return (
            <button key={t.id} type="button" className={`rounded-xl px-4 py-2 text-sm font-bold ${cls}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          )
        })}
      </nav>
      {tab === "stock" && <Stock />}
      {tab === "kardex" && <Kardex />}
      {tab === "entrada" && <EntryHub />}
      {tab === "ajuste" && <MovForm accion="ajuste" />}
      {tab === "traslado" && <MovForm accion="traslado" />}
    </section>
  )
}

function Stock() {
  const [q, setQ] = useState("")
  const [sede, setSede] = useState("")
  const [data, setData] = useState<{ sedes: Sede[]; items: Fila[]; alerta: string[]; mensaje: string } | null>(null)
  const cargar = useCallback(async () => {
    const qs = new URLSearchParams()
    if (q) qs.set("q", q)
    if (sede) qs.set("id_sede", sede)
    const r = await api(`/api/v1/inventario/existencias/?${qs}`)
    if (r.ok) setData(await r.json())
  }, [q, sede])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])
  return (
    <div>
      {data && data.alerta.length > 0 && (
        <p role="status" className="mb-3 flex items-start gap-2 rounded-xl border-2 border-sun bg-sun/20 p-3 text-sm font-medium">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          {data.alerta.length} existencia{data.alerta.length > 1 ? "s" : ""} en o bajo el stock mínimo: {data.alerta.slice(0, 4).join(", ")}
          {data.alerta.length > 4 ? "…" : ""}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void cargar()
        }}
        className="mb-4 flex flex-wrap items-end gap-3"
      >
        <label className="text-xs font-semibold text-ink/70">
          Buscar producto
          <input className={`${input} w-44`} placeholder="Nombre o código" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label className="text-xs font-semibold text-ink/70">
          Sede
          <select className={`${input} w-44`} value={sede} onChange={(e) => setSede(e.target.value)} aria-label="Sede">
            <option value="">Todas las sedes</option>
            {data?.sedes.map((s) => (
              <option key={s.id_sede} value={s.id_sede}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={`${btnGhost} gap-1.5`}>
          <Search size={15} /> Filtrar
        </button>
      </form>
      {data && data.items.length === 0 ? (
        <Empty text="No hay productos que coincidan. Crea productos en el módulo Productos y aparecerán aquí." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-plum-soft text-xs uppercase tracking-wider text-plum">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th>Origen</th>
                {data?.sedes.map((s) => (
                  <th key={s.id_sede} className="text-right">
                    {s.nombre}
                  </th>
                ))}
                <th className="text-right">Total</th>
                <th className="px-4 text-right">Mínimo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plum/10">
              {data?.items.map((f) => (
                <tr key={f.id_producto}>
                  <td className="px-4 py-3 font-semibold">
                    {f.nombre}
                    <span className="ml-2 text-xs font-normal text-ink/50">{f.codigo}</span>
                  </td>
                  <td>
                    <OriginBadge value={f.origen} />
                  </td>
                  {data.sedes.map((s) => {
                    const v = f.celdas[String(s.id_sede)] ?? 0
                    const isLow = v <= f.minimo && f.minimo > 0
                    return (
                      <td key={s.id_sede} className={`text-right font-extrabold ${isLow ? "text-rose-600" : ""}`}>
                        {isLow && (
                          <span className="mr-1.5 inline-block rounded bg-rose-100 px-1.5 text-[10px] font-bold uppercase text-rose-700">
                            {v === 0 ? "Agotado" : "Bajo"}
                          </span>
                        )}
                        {v}
                      </td>
                    )
                  })}
                  <td className="text-right font-bold">{f.total}</td>
                  <td className="px-4 text-right text-ink/55">{f.minimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-sm">{data?.mensaje}</p>
    </div>
  )
}

function Kardex() {
  const [tipo, setTipo] = useState("")
  const [sede, setSede] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [sedes, setSedes] = useState<Sede[]>([])
  const [rows, setRows] = useState<Mov[]>([])
  const [msg, setMsg] = useState("")
  const cargar = useCallback(async () => {
    const ex = await api("/api/v1/inventario/existencias/")
    if (ex.ok) setSedes((await ex.json()).sedes)
    const qs = new URLSearchParams()
    if (tipo) qs.set("tipo", tipo)
    if (sede) qs.set("id_sede", sede)
    if (desde) qs.set("desde", desde)
    if (hasta) qs.set("hasta", hasta)
    const r = await api(`/api/v1/inventario/kardex/?${qs}`)
    if (r.ok) {
      const body = await r.json()
      setRows(body.items)
      setMsg(body.mensaje)
    }
  }, [tipo, desde, hasta, sede])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); void cargar() }} className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-ink/70">
          Tipo
          <select className={`${input} w-44`} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            <option value="entrada_compra">Entrada</option>
            <option value="ajuste_positivo">Ajuste +</option>
            <option value="ajuste_negativo">Ajuste −</option>
            <option value="merma">Merma</option>
            <option value="traslado_entrada">Traslado entrada</option>
            <option value="traslado_salida">Traslado salida</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-ink/70">
          Sede
          <select className={`${input} w-44`} value={sede} onChange={(e) => setSede(e.target.value)}>
            <option value="">Todas</option>
            {sedes.map((s) => (
              <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-ink/70">
          Desde
          <input type="date" className={`${input} w-44`} value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="text-xs font-semibold text-ink/70">
          Hasta
          <input type="date" className={`${input} w-44`} value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <button type="submit" className={btnGhost}><Search size={15} /> Filtrar</button>
      </form>
      <p className="mb-3 flex flex-wrap gap-2 text-xs" aria-label="Leyenda de tipos">
        {["entrada_compra", "ajuste_positivo", "ajuste_negativo", "merma", "traslado_entrada"].map((t) => (
          <TypeBadge key={t} value={t} />
        ))}
      </p>
      {rows.length === 0 ? (
        <Empty text="Aún no hay movimientos." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-plum-soft text-xs uppercase tracking-wider text-plum">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th>Producto</th>
                <th>Sede</th>
                <th>Tipo</th>
                <th className="text-right">Cant.</th>
                <th className="text-right">Anterior</th>
                <th className="text-right">Nuevo</th>
                <th className="text-right">Costo</th>
                <th>Proveedor</th>
                <th>Referencia / motivo</th>
                <th className="px-4">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plum/10">
              {rows.map((x) => (
                <tr key={x.id_movimiento}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">{dt(x.fecha)}</td>
                  <td className="font-semibold">{x.producto}</td>
                  <td>{x.sede}</td>
                  <td>
                    <TypeBadge value={x.tipo} />
                  </td>
                  <td className={`text-right font-bold ${x.delta > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                    {x.delta > 0 ? "+" : "−"}
                    {x.cantidad}
                  </td>
                  <td className="text-right text-ink/60">{x.anterior}</td>
                  <td className="text-right">{x.nueva}</td>
                  <td className="text-right">{money(x.costo_unitario)}</td>
                  <td className="text-xs">{x.proveedor || "—"}</td>
                  <td className="max-w-48 truncate text-xs" title={[x.referencia, x.motivo].filter(Boolean).join(" · ")}>
                    {[x.referencia, x.motivo].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 text-xs">{x.usuario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-sm">{msg}</p>
    </div>
  )
}

function useProductos() {
  const [productos, setProductos] = useState<ProdOpt[]>([])
  const cargar = useCallback(async (q = "") => {
    const qs = new URLSearchParams()
    if (q) qs.set("q", q)
    const r = await api(`/api/v1/inventario/productos-opciones/?${qs}`)
    if (r.ok) setProductos((await r.json()).items)
  }, [])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])
  const options = useMemo(
    () => productos.map((p) => ({ id: String(p.id_producto), label: p.nombre, hint: p.codigo })),
    [productos],
  )
  return { productos, options, recargar: cargar }
}

function useSedes() {
  const [sedes, setSedes] = useState<Sede[]>([])
  useEffect(() => {
    void api("/api/v1/inventario/existencias/").then(async (r) => {
      if (r.ok) setSedes((await r.json()).sedes)
    })
  }, [])
  return sedes
}

function useProveedoresActivos() {
  const [items, setItems] = useState<ProveedorOpt[]>([])
  useEffect(() => {
    void (async () => {
      let r = await api("/api/v1/inventario/proveedores-activos/")
      if (!r.ok) r = await api("/api/v1/proveedores/activos/")
      if (!r.ok) return
      const body = (await r.json()) as { items: ProveedorOpt[] }
      setItems(body.items ?? [])
    })()
  }, [])
  const options = useMemo(
    () => items.map((p) => ({ id: String(p.id_proveedor), label: p.nombre, hint: p.numero_documento })),
    [items],
  )
  return options
}

function EntryHub() {
  const [mode, setMode] = useState<EntryMode>("manual")
  const tabs: { id: EntryMode; label: string; icon: ReactNode }[] = [
    { id: "manual", label: "Manual", icon: <Keyboard size={15} aria-hidden /> },
    { id: "barcode", label: "Detector códigos", icon: <Barcode size={15} aria-hidden /> },
    { id: "bulk", label: "Carga rápida", icon: <ClipboardList size={15} aria-hidden /> },
  ]
  const { productos, options } = useProductos()
  const sedes = useSedes()
  const proveedores = useProveedoresActivos()
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Modo de entrada">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={mode === t.id}
            onClick={() => setMode(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${mode === t.id ? "bg-plum text-white" : "border-2 border-plum/15 text-plum hover:bg-plum-soft"}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
      {mode === "manual" && <ManualEntry productos={productos} options={options} sedes={sedes} proveedores={proveedores} />}
      {mode === "barcode" && <BarcodeEntry productos={productos} sedes={sedes} proveedores={proveedores} />}
      {mode === "bulk" && <BulkEntry productos={productos} sedes={sedes} proveedores={proveedores} />}
    </div>
  )
}

function SharedMeta({
  sede,
  setSede,
  sedes,
  idProveedor,
  setIdProveedor,
  proveedores,
  referencia,
  setReferencia,
  notas,
  setNotas,
  needSupplier,
}: {
  sede: string
  setSede: (v: string) => void
  sedes: Sede[]
  idProveedor: string
  setIdProveedor: (v: string) => void
  proveedores: { id: string; label: string; hint?: string }[]
  referencia: string
  setReferencia: (v: string) => void
  notas: string
  setNotas: (v: string) => void
  needSupplier: boolean
}) {
  return (
    <>
      <FieldLabel label="Sede" required>
        <select className={input} value={sede} onChange={(e) => setSede(e.target.value)}>
          <option value="">Seleccione sede…</option>
          {sedes.map((s) => (
            <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
          ))}
        </select>
      </FieldLabel>
      <div className="sm:col-span-2">
        <SearchCombobox
          label="Proveedor"
          required={needSupplier}
          value={idProveedor}
          onChange={setIdProveedor}
          options={proveedores}
          placeholder={needSupplier ? "Buscar proveedor activo…" : "Opcional para productos fabricados"}
          invalid={needSupplier && !idProveedor}
        />
      </div>
      <FieldLabel label="Documento / referencia">
        <input className={input} value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Factura, remisión…" />
      </FieldLabel>
      <FieldLabel label="Observaciones" className="sm:col-span-2">
        <input className={input} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas de la entrada" />
      </FieldLabel>
    </>
  )
}

function ManualEntry({
  productos,
  options,
  sedes,
  proveedores,
}: {
  productos: ProdOpt[]
  options: { id: string; label: string; hint?: string }[]
  sedes: Sede[]
  proveedores: { id: string; label: string; hint?: string }[]
}) {
  const blank = { product: "", sede: sedes[0]?.id_sede ? String(sedes[0].id_sede) : "", cantidad: "1", id_proveedor: "", costo: "", referencia: "", notas: "" }
  const [m, setM] = useState(blank)
  const [error, setError] = useState("")
  const { run, pending } = useDo()
  const p = productos.find((x) => String(x.id_producto) === m.product)
  const needSupplier = !!p && p.origen !== "fabricado"
  const enviar = () =>
    run(async () => {
      if (!m.product || !m.sede || !m.cantidad) {
        setError("Todos los campos obligatorios deben ser diligenciados.")
        return
      }
      if (needSupplier && !m.id_proveedor) {
        setError("Los productos comprados requieren proveedor.")
        return
      }
      setError("")
      const r = await api("/api/v1/inventario/movimientos/entrada/", {
        method: "POST",
        body: JSON.stringify({
          id_producto: Number(m.product),
          id_sede: Number(m.sede),
          cantidad: m.cantidad,
          costo_unitario: m.costo || undefined,
          ...(m.id_proveedor ? { id_proveedor: Number(m.id_proveedor) } : {}),
          referencia: m.referencia,
          motivo: m.notas || "Entrada de mercancía",
        }),
      })
      const msg = await mensajeDe(r)
      if (!r.ok) {
        setError(msg)
        return
      }
      toast(msg)
      setM({ ...blank, sede: m.sede })
    })
  return (
    <Panel title="Entrada manual">
      <FormAlert message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <SearchCombobox
            label="Producto"
            required
            value={m.product}
            onChange={(v) => setM({ ...m, product: v })}
            options={options}
            placeholder="Buscar producto…"
          />
        </div>
        <FieldLabel label="Cantidad" required>
          <input type="number" min={1} className={input} value={m.cantidad} onChange={(e) => setM({ ...m, cantidad: e.target.value })} placeholder="Ej. 10" />
        </FieldLabel>
        <FieldLabel label="Costo unitario">
          <input type="number" min={0} className={input} value={m.costo} onChange={(e) => setM({ ...m, costo: e.target.value })} placeholder="Opcional" />
        </FieldLabel>
        <SharedMeta
          sede={m.sede}
          setSede={(v) => setM({ ...m, sede: v })}
          sedes={sedes}
          idProveedor={m.id_proveedor}
          setIdProveedor={(v) => setM({ ...m, id_proveedor: v })}
          proveedores={proveedores}
          referencia={m.referencia}
          setReferencia={(v) => setM({ ...m, referencia: v })}
          notas={m.notas}
          setNotas={(v) => setM({ ...m, notas: v })}
          needSupplier={needSupplier}
        />
        <div className="sm:col-span-2">
          <button type="button" disabled={pending} className={btnPrimary} onClick={() => void enviar()}>
            {pending ? <Loader2 className="animate-spin" size={16} /> : "Registrar entrada"}
          </button>
        </div>
      </div>
    </Panel>
  )
}

type ScanRow = { productId: string; name: string; sku: string; qty: number; unitCost?: string }

function BarcodeEntry({
  productos,
  sedes,
  proveedores,
}: {
  productos: ProdOpt[]
  sedes: Sede[]
  proveedores: { id: string; label: string; hint?: string }[]
}) {
  const [sede, setSede] = useState(sedes[0]?.id_sede ? String(sedes[0].id_sede) : "")
  const [idProveedor, setIdProveedor] = useState("")
  const [referencia, setReferencia] = useState("")
  const [notas, setNotas] = useState("")
  const [code, setCode] = useState("")
  const [unitCost, setUnitCost] = useState("")
  const [rows, setRows] = useState<ScanRow[]>([])
  const [lastScan, setLastScan] = useState("")
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const scanBuf = useRef("")
  const scanLastKey = useRef(0)
  const { run, pending } = useDo()
  const needSupplier = useMemo(() => rows.some((r) => productos.find((p) => String(p.id_producto) === r.productId)?.origen !== "fabricado"), [rows, productos])

  const addScan = useCallback(
    (rawCode?: string) => {
      const scanned = (rawCode ?? code).trim()
      if (!scanned) return
      const prod = resolveProduct(productos, scanned)
      if (!prod) {
        toast("Código no encontrado. Usa SKU o código de barras registrado.")
        return
      }
      setLastScan(`${prod.nombre} (+1)`)
      setRows((prev) => {
        const i = prev.findIndex((x) => x.productId === String(prod.id_producto))
        if (i >= 0) {
          const next = [...prev]
          next[i] = { ...next[i], qty: next[i].qty + 1, unitCost: unitCost || next[i].unitCost }
          return next
        }
        return [...prev, { productId: String(prod.id_producto), name: prod.nombre, sku: prod.codigo, qty: 1, unitCost: unitCost || undefined }]
      })
      setCode("")
      inputRef.current?.focus()
    },
    [code, productos, unitCost],
  )

  useEffect(() => {
    const gapMs = 45
    const onKeyDown = (ev: KeyboardEvent) => {
      const tag = (ev.target as HTMLElement)?.tagName
      if (tag === "TEXTAREA" || tag === "SELECT") return
      const now = Date.now()
      if (ev.key === "Enter") {
        const token = scanBuf.current.trim() || (tag !== "INPUT" ? "" : (inputRef.current?.value ?? "").trim())
        scanBuf.current = ""
        if (token.length >= 3) {
          ev.preventDefault()
          addScan(token)
        }
        return
      }
      if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
        if (now - scanLastKey.current > gapMs) scanBuf.current = ""
        scanBuf.current += ev.key
        scanLastKey.current = now
      }
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [addScan])

  const commit = () =>
    run(async () => {
      if (!rows.length) return
      if (needSupplier && !idProveedor) {
        setError("Los productos comprados requieren proveedor.")
        return
      }
      setError("")
      const r = await api("/api/v1/inventario/movimientos/entrada-lote/", {
        method: "POST",
        body: JSON.stringify({
          id_sede: Number(sede),
          ...(idProveedor ? { id_proveedor: Number(idProveedor) } : {}),
          referencia,
          motivo: notas,
          lineas: rows.map((row) => ({
            id_producto: Number(row.productId),
            cantidad: row.qty,
            costo_unitario: row.unitCost || undefined,
          })),
        }),
      })
      const msg = await mensajeDe(r)
      if (!r.ok) {
        setError(msg)
        return
      }
      toast(msg)
      setRows([])
      setReferencia("")
      setNotas("")
    })

  return (
    <Panel title="Detector de códigos (lector USB / pistola)">
      <FormAlert message={error} />
      <p className="mb-2 text-sm text-ink/60">
        Conecta el lector en modo teclado: cada lectura se registra sola al detectar el código (Enter del lector).
      </p>
      {lastScan && (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800" role="status">
          Última detección: {lastScan}
        </p>
      )}
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <SharedMeta
          sede={sede}
          setSede={setSede}
          sedes={sedes}
          idProveedor={idProveedor}
          setIdProveedor={setIdProveedor}
          proveedores={proveedores}
          referencia={referencia}
          setReferencia={setReferencia}
          notas={notas}
          setNotas={setNotas}
          needSupplier={needSupplier}
        />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          addScan()
        }}
        className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-cyan/40 bg-cyan/5 p-4 sm:flex-row sm:items-end"
      >
        <FieldLabel label="Escanear o escribir código" className="flex-1">
          <input
            ref={inputRef}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addScan()
              }
            }}
            placeholder="Apunta el lector aquí — detección automática"
            className={`${input} font-mono`}
          />
        </FieldLabel>
        <FieldLabel label="Costo (opcional)" className="w-full sm:w-36">
          <input type="number" min={0} value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className={input} />
        </FieldLabel>
        <button type="submit" className={`${btnGhost} shrink-0`}>Agregar</button>
      </form>
      {rows.length ? (
        <div className="mt-4 overflow-x-auto rounded-xl border-2 border-plum/10">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-plum-soft text-xs uppercase tracking-wider text-plum">
              <tr>
                <th className="px-3 py-2">Producto</th>
                <th>SKU</th>
                <th className="text-right">Cantidad</th>
                <th className="px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plum/10">
              {rows.map((r) => (
                <tr key={r.productId}>
                  <td className="px-3 py-2 font-semibold">{r.name}</td>
                  <td className="font-mono text-xs text-ink/60">{r.sku}</td>
                  <td className="text-right font-bold">{r.qty}</td>
                  <td className="px-3 text-right">
                    <button type="button" aria-label="Quitar" onClick={() => setRows((x) => x.filter((y) => y.productId !== r.productId))} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink/55">Aún no hay lecturas. Escanea el primer producto para ver el listado.</p>
      )}
      <div className="mt-4">
        <button type="button" disabled={pending || !rows.length} onClick={() => void commit()} className={btnPrimary}>
          {pending ? <Loader2 className="animate-spin" size={16} /> : `Registrar ${rows.length} producto${rows.length === 1 ? "" : "s"}`}
        </button>
      </div>
    </Panel>
  )
}

function BulkEntry({
  productos,
  sedes,
  proveedores,
}: {
  productos: ProdOpt[]
  sedes: Sede[]
  proveedores: { id: string; label: string; hint?: string }[]
}) {
  const [sede, setSede] = useState(sedes[0]?.id_sede ? String(sedes[0].id_sede) : "")
  const [idProveedor, setIdProveedor] = useState("")
  const [referencia, setReferencia] = useState("")
  const [notas, setNotas] = useState("")
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const { run, pending } = useDo()
  const preview = useMemo(() => {
    const { lines, errors } = parseBulkInventoryText(text)
    const resolved = lines.map((l) => {
      const p = resolveProduct(productos, l.sku)
      return { ...l, product: p, error: p ? undefined : `SKU «${l.sku}» no encontrado` }
    })
    return { lines: resolved, errors: [...errors, ...resolved.map((r) => r.error).filter(Boolean) as string[]] }
  }, [text, productos])
  const needSupplier = preview.lines.some((l) => l.product && l.product.origen !== "fabricado")

  const submit = () =>
    run(async () => {
      const ok = preview.lines.filter((l) => l.product)
      if (!ok.length || preview.errors.length) return
      if (needSupplier && !idProveedor) {
        setError("Los productos comprados requieren proveedor.")
        return
      }
      setError("")
      const r = await api("/api/v1/inventario/movimientos/entrada-lote/", {
        method: "POST",
        body: JSON.stringify({
          id_sede: Number(sede),
          ...(idProveedor ? { id_proveedor: Number(idProveedor) } : {}),
          referencia,
          motivo: notas,
          lineas: ok.map((l) => ({
            codigo: l.sku,
            cantidad: l.quantity,
            costo_unitario: l.unitCost,
          })),
        }),
      })
      const msg = await mensajeDe(r)
      if (!r.ok) {
        setError(msg)
        return
      }
      toast(msg)
      setText("")
    })

  return (
    <Panel title="Carga rápida desde texto">
      <FormAlert message={error} />
      <p className="mb-4 text-sm text-ink/60">Pega líneas en formato SKU - CANTIDAD - costo unitario. Ideal para transcribir ítems de una factura.</p>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <SharedMeta
          sede={sede}
          setSede={setSede}
          sedes={sedes}
          idProveedor={idProveedor}
          setIdProveedor={setIdProveedor}
          proveedores={proveedores}
          referencia={referencia}
          setReferencia={setReferencia}
          notas={notas}
          setNotas={setNotas}
          needSupplier={needSupplier}
        />
      </div>
      <p className="mb-2 flex items-start gap-2 text-xs text-ink/60">
        <HelpCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
        Ejemplo: <span className="font-mono">VIN-BLAN-1GL - 12 - 45000</span> (separador coma o salto de línea).
        <FileText size={12} className="inline" aria-hidden />
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={"SKU - CANTIDAD - costo unitario\nSKU - CANTIDAD - costo unitario"}
        className={`${input} min-h-[140px] w-full font-mono text-xs`}
      />
      {preview.errors.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-rose-700">
          {preview.errors.slice(0, 6).map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
      {preview.lines.length > 0 && !preview.errors.length && (
        <p className="mt-2 text-xs font-semibold text-emerald-800">
          {preview.lines.length} línea{preview.lines.length > 1 ? "s" : ""} lista{preview.lines.length > 1 ? "s" : ""} para registrar.
        </p>
      )}
      <div className="mt-4">
        <button type="button" disabled={pending || !preview.lines.length || preview.errors.length > 0} onClick={() => void submit()} className={btnPrimary}>
          {pending ? <Loader2 className="animate-spin" size={16} /> : "Registrar entradas"}
        </button>
      </div>
    </Panel>
  )
}

function MovForm({ accion }: { accion: "ajuste" | "traslado" }) {
  const { options } = useProductos()
  const sedes = useSedes()
  const [idProducto, setIdProducto] = useState("")
  const [idSede, setIdSede] = useState("")
  const [destino, setDestino] = useState("")
  const [cantidad, setCantidad] = useState("1")
  const [motivo, setMotivo] = useState("")
  const [tipo, setTipo] = useState("ajuste_negativo")
  const [error, setError] = useState("")
  const { run, pending } = useDo()
  const sign = tipo === "ajuste_positivo" ? "+" : "−"
  const enviar = () =>
    run(async () => {
      if (!idProducto || !idSede || !cantidad || !motivo.trim() || (accion === "traslado" && !destino)) {
        setError("Todos los campos obligatorios deben ser diligenciados.")
        return
      }
      setError("")
      const r = await api(`/api/v1/inventario/movimientos/${accion}/`, {
        method: "POST",
        body: JSON.stringify({
          id_producto: Number(idProducto),
          id_sede: Number(idSede),
          id_sede_destino: Number(destino || 0),
          cantidad,
          motivo,
          tipo,
        }),
      })
      const msg = await mensajeDe(r)
      if (!r.ok) {
        setError(msg)
        return
      }
      toast(msg)
      setCantidad("1")
      setMotivo("")
    })

  if (accion === "traslado" && sedes.length < 2) {
    return <Empty text="Necesitas al menos dos sedes activas para hacer traslados." />
  }

  return (
    <Panel title={accion === "ajuste" ? "Ajuste, merma o daño" : "Traslado entre sedes"}>
      <FormAlert message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <SearchCombobox label="Producto" required value={idProducto} onChange={setIdProducto} options={options} placeholder="Buscar producto…" />
        </div>
        <FieldLabel label={accion === "traslado" ? "Desde" : "Sede"} required>
          <select className={input} value={idSede} onChange={(e) => setIdSede(e.target.value)}>
            <option value="">Seleccione…</option>
            {sedes.map((s) => (
              <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
            ))}
          </select>
        </FieldLabel>
        {accion === "traslado" ? (
          <FieldLabel label="Hacia" required>
            <select className={input} value={destino} onChange={(e) => setDestino(e.target.value)}>
              <option value="">Seleccione…</option>
              {sedes.map((s) => (
                <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
              ))}
            </select>
          </FieldLabel>
        ) : (
          <FieldLabel label="Tipo" required>
            <select className={input} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="ajuste_positivo">Ajuste positivo (+)</option>
              <option value="ajuste_negativo">Ajuste negativo (−)</option>
              <option value="merma">Merma / daño (−)</option>
            </select>
          </FieldLabel>
        )}
        <FieldLabel label="Cantidad" required>
          <input type="number" min={1} className={input} value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ej. 1" />
        </FieldLabel>
        <FieldLabel label={accion === "ajuste" ? "Motivo (obligatorio)" : "Motivo"} required={accion === "ajuste"}>
          <input className={input} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Describa el motivo" />
        </FieldLabel>
        {accion === "ajuste" && (
          <p className="text-xs text-ink/60 sm:col-span-2">
            Impacto: {sign}
            {Number(cantidad) || 0} unidades en la sede elegida. Queda en el historial y en auditoría.
          </p>
        )}
        <div className="sm:col-span-2">
          <button type="button" className={btnPrimary} disabled={pending} onClick={() => void enviar()}>
            {pending ? <Loader2 className="animate-spin" size={16} /> : accion === "traslado" ? "Trasladar" : "Registrar"}
          </button>
        </div>
      </div>
    </Panel>
  )
}
