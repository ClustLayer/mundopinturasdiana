import { useCallback, useEffect, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { Ban, ChevronDown, LayoutGrid, List, Printer, RotateCcw } from "lucide-react"
import { btnGhost, btnPrimary, Empty, FieldLabel, FormAlert, input, Modal, Pager, useDo } from "../components/panel/kit"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import { toast } from "../features/en-desarrollo"
import { api, mensajeDe } from "../shared/api"
import { useApp } from "../app/providers"

type Factura = {
  id_factura: number
  consecutivo: string
  numero_corto: number | string
  estado: string
  fecha_hora: string
  cliente: string
  empleado: string
  sede: string
  total: number
  margen_negativo: boolean
  requiere_domicilio: boolean
}

type LineaDet = {
  id_detalle: number
  id_producto: number
  producto: string
  cantidad: number
  cantidad_devuelta: number
  precio_unitario: number
  subtotal: number
  descuento_porcentaje: number
  afecta_venta_diaria: boolean
}

type Detalle = Factura & {
  lineas: LineaDet[]
  pagos: { metodo: string; valor: number; referencia: string }[]
  devoluciones?: { lineas: { producto: string; cantidad: number }[] }[]
  version_fila: number
  observaciones?: string
  requiere_factura_electronica?: boolean
}

type Stats = { mes: string; label: string; ventas: number; devoluciones: number } | null

const money = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)

const dt = (v: string) =>
  new Date(v).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" })

function estadoVentasBadge(estado: string) {
  const map: Record<string, { label: string; cls: string }> = {
    EMITIDA: { label: "emitida", cls: "bg-cyan/15 text-cyan-dark" },
    DEVOLUCION_PARCIAL: { label: "devolución parcial", cls: "bg-plum-soft text-plum" },
    ANULADA: { label: "anulada", cls: "bg-ink/10 text-ink/70" },
  }
  const e = map[estado] ?? { label: estado.toLowerCase(), cls: "bg-paper text-ink/80 border border-plum/15" }
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${e.cls}`}>{e.label}</span>
}

const mesActual = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function PanelVentasPage() {
  const { rol } = useParams<{ rol: string }>()
  const [searchParams] = useSearchParams()
  const { sesion } = useApp()
  const { accionesModulo } = useAccesos()
  const puedeTotal = puedeAccion(accionesModulo("ventas"), "Total")
  const isEmp = sesion?.rol === "Empleado"
  const puedeGestionar = puedeTotal && !isEmp

  const [vista, setVista] = useState<"tarjetas" | "tabla">("tarjetas")
  const [items, setItems] = useState<Factura[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [stats, setStats] = useState<Stats>(null)

  const [mes, setMes] = useState(mesActual())
  const [idSede, setIdSede] = useState("")
  const [estado, setEstado] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [q, setQ] = useState("")
  const [sedes, setSedes] = useState<{ id_sede: number; nombre: string }[]>([])

  const [open, setOpen] = useState<number | null>(null)
  const [cache, setCache] = useState<Record<number, Detalle>>({})
  const [anular, setAnular] = useState<Detalle | null>(null)
  const [devolver, setDevolver] = useState<Detalle | null>(null)
  const [motivo, setMotivo] = useState("")
  const [devForm, setDevForm] = useState({ id_detalle: "", qty: 1, motivo: "" })
  const [error, setError] = useState("")
  const { run, pending } = useDo()

  const numeroUrl = searchParams.get("numero")

  useEffect(() => {
    if (!puedeGestionar) return
    void api("/api/v1/ventas/pos/catalogos/").then(async (r) => {
      if (r.ok) {
        const d = (await r.json()) as { sedes: { id_sede: number; nombre: string }[] }
        setSedes(d.sedes)
      }
    })
  }, [puedeGestionar])

  const cargarStats = useCallback(async () => {
    if (isEmp) return
    const qs = new URLSearchParams({ mes })
    if (idSede) qs.set("id_sede", idSede)
    const r = await api(`/api/v1/ventas/facturas/estadisticas/?${qs}`)
    if (r.ok) setStats((await r.json()) as Stats)
  }, [mes, idSede, isEmp])

  const cargar = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), page_size: "15" })
    if (q.trim()) qs.set("q", q.trim())
    if (numeroUrl) qs.set("numero", numeroUrl)
    if (estado) qs.set("estado", estado.toUpperCase())
    if (idSede) qs.set("id_sede", idSede)
    if (desde) qs.set("desde", desde)
    if (hasta) qs.set("hasta", hasta)
    const r = await api(`/api/v1/ventas/facturas/?${qs}`)
    if (!r.ok) return toast((await mensajeDe(r)) || "No fue posible cargar las facturas.")
    const d = (await r.json()) as { items: Factura[]; total: number }
    setItems(d.items)
    setTotal(d.total)
    if (numeroUrl && d.items[0]) setOpen(d.items[0].id_factura)
  }, [page, q, estado, idSede, desde, hasta, numeroUrl])

  useEffect(() => {
    void cargarStats()
    void cargar()
  }, [cargar, cargarStats])

  const cargarDetalle = async (id: number) => {
    if (cache[id]) return cache[id]
    const r = await api(`/api/v1/ventas/facturas/${id}/`)
    if (!r.ok) return null
    const d = (await r.json()) as { factura: Detalle }
    setCache((c) => ({ ...c, [id]: d.factura }))
    return d.factura
  }

  const toggleOpen = async (id: number) => {
    if (open === id) {
      setOpen(null)
      return
    }
    setOpen(id)
    await cargarDetalle(id)
  }

  const confirmarAnular = () =>
    run(async () => {
      if (!anular) return
      const r = await api(`/api/v1/ventas/facturas/${anular.id_factura}/anular/`, {
        method: "POST",
        body: JSON.stringify({ motivo }),
      })
      if (!r.ok) {
        setError((await mensajeDe(r)) || "No fue posible anular.")
        return
      }
      toast(((await r.json()) as { mensaje: string }).mensaje)
      setAnular(null)
      setOpen(null)
      void cargar()
      void cargarStats()
    })

  const confirmarDevolucion = () =>
    run(async () => {
      if (!devolver) return
      const linea = devolver.lineas.find((l) => String(l.id_detalle) === devForm.id_detalle)
      if (!linea) return
      const r = await api(`/api/v1/ventas/facturas/${devolver.id_factura}/devolucion/`, {
        method: "POST",
        body: JSON.stringify({
          id_detalle: linea.id_detalle,
          cantidad: devForm.qty,
          motivo: devForm.motivo,
        }),
      })
      if (!r.ok) {
        setError((await mensajeDe(r)) || "No fue posible registrar la devolución.")
        return
      }
      toast(((await r.json()) as { mensaje: string }).mensaje)
      setDevolver(null)
      setCache({})
      void cargar()
      void cargarStats()
    })

  const panelCls = "rounded-2xl border-2 border-plum/10 bg-white p-5 shadow-[3px_3px_0_0_#371837]/08"

  const detalleAbierto = open ? cache[open] : null

  const titulo = isEmp ? "Mis ventas de hoy" : "Ventas"

  return (
    <section className="animate-in fade-in duration-300">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Ventas</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">{titulo}</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">
        {isEmp ? "Solo ves las ventas que registraste hoy." : "Anulaciones y devoluciones restituyen inventario y quedan auditadas."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-ink/55">Vista:</span>
        <button
          type="button"
          className={`inline-flex items-center gap-1 rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition ${vista === "tarjetas" ? "border-brand bg-brand text-white" : "border-plum/15 text-plum hover:border-cyan"}`}
          onClick={() => setVista("tarjetas")}
        >
          <LayoutGrid size={16} /> Tarjetas
        </button>
        <button
          type="button"
          className={`inline-flex items-center gap-1 rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition ${vista === "tabla" ? "border-brand bg-brand text-white" : "border-plum/15 text-plum hover:border-cyan"}`}
          onClick={() => setVista("tabla")}
        >
          <List size={16} /> Lista con acciones
        </button>
      </div>

      {stats && puedeGestionar && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <p className={panelCls}>
            <span className="text-xs font-bold uppercase tracking-wider text-ink/55">
              Ventas del mes · <span className="capitalize">{stats.label}</span>
            </span>
            <span className="mt-1 block font-display text-3xl font-extrabold text-plum">{money(stats.ventas)}</span>
            <span className="mt-1 block text-xs text-ink/55">No incluye anuladas ni productos artísticos.</span>
          </p>
          <p className={panelCls}>
            <span className="text-xs font-bold uppercase tracking-wider text-ink/55">Devoluciones del mes</span>
            <span className="mt-1 block font-display text-3xl font-extrabold text-plum">{money(stats.devoluciones)}</span>
          </p>
        </div>
      )}

      {puedeGestionar && (
        <div className="mt-5 grid gap-3 rounded-2xl border-2 border-plum/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
          <FieldLabel label="Mes (estadísticas)">
            <input type="month" className={input} value={mes} onChange={(e) => setMes(e.target.value)} />
          </FieldLabel>
          <FieldLabel label="Sede">
            <select className={input} value={idSede} onChange={(e) => { setIdSede(e.target.value); setPage(1) }}>
              <option value="">Todas</option>
              {sedes.map((s) => (
                <option key={s.id_sede} value={String(s.id_sede)}>{s.nombre}</option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Estado">
            <select className={input} value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1) }}>
              <option value="">Todos</option>
              <option value="EMITIDA">Emitida</option>
              <option value="DEVOLUCION_PARCIAL">Devolución parcial</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </FieldLabel>
          <FieldLabel label="Desde">
            <input type="date" className={input} value={desde} onChange={(e) => { setDesde(e.target.value); setPage(1) }} />
          </FieldLabel>
          <FieldLabel label="Hasta">
            <input type="date" className={input} value={hasta} onChange={(e) => { setHasta(e.target.value); setPage(1) }} />
          </FieldLabel>
          <FieldLabel label="Buscar" className="sm:col-span-2">
            <input className={input} value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Número, cliente o documento" />
          </FieldLabel>
        </div>
      )}

      {!items.length ? (
        <Empty text={isEmp ? "Hoy todavía no has registrado ventas." : "No hay ventas con estos filtros."} />
      ) : vista === "tarjetas" ? (
        <ul className="mt-6 space-y-2">
          {items.map((f) => (
            <li key={f.id_factura} className="rounded-2xl border-2 border-plum/10 bg-white transition hover:border-plum/20">
              <button
                type="button"
                onClick={() => void toggleOpen(f.id_factura)}
                className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 p-4 text-left"
              >
                <span className="font-display text-lg font-extrabold text-plum">#{f.numero_corto ?? f.consecutivo}</span>
                <span className="text-sm text-ink/60">{dt(f.fecha_hora)}</span>
                <span className="text-sm">{f.empleado}</span>
                {estadoVentasBadge(f.estado)}
                {f.requiere_domicilio && (
                  <span className="rounded-full bg-cyan/10 px-2 py-0.5 text-[10px] font-bold text-cyan-dark">Domicilio</span>
                )}
                <span className="ml-auto font-extrabold">{money(f.total)}</span>
                <ChevronDown size={18} className={`transition ${open === f.id_factura ? "rotate-180" : ""}`} />
              </button>
              {open === f.id_factura && detalleAbierto && (
                <MotionDetalle
                  f={f}
                  detalle={detalleAbierto}
                  rol={rol}
                  puedeGestionar={puedeGestionar}
                  onAnular={() => { setAnular(detalleAbierto); setMotivo(""); setError("") }}
                  onDevolver={() => {
                    setDevolver(detalleAbierto)
                    setDevForm({
                      id_detalle: String(detalleAbierto.lineas[0]?.id_detalle ?? ""),
                      qty: 1,
                      motivo: "",
                    })
                    setError("")
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-plum/10 bg-paper/80 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="p-3">Número</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Vendedor</th>
                <th className="p-3">Total</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id_factura} className="border-b border-plum/5">
                  <td className="p-3 font-display font-bold text-plum">#{f.numero_corto}</td>
                  <td className="p-3 whitespace-nowrap">{dt(f.fecha_hora)}</td>
                  <td className="p-3">{f.empleado}</td>
                  <td className="p-3 font-semibold">{money(f.total)}</td>
                  <td className="p-3">{estadoVentasBadge(f.estado)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Link to={`/panel/${rol}/imprimir/${f.id_factura}?formato=carta`} className={btnGhost} title="Imprimir">
                        <Printer size={15} />
                      </Link>
                      {puedeGestionar && f.estado !== "ANULADA" && (
                        <>
                          <button type="button" className={btnGhost} title="Devolución" onClick={async () => {
                            const d = await cargarDetalle(f.id_factura)
                            if (d) {
                              setDevolver(d)
                              setDevForm({ id_detalle: String(d.lineas[0]?.id_detalle ?? ""), qty: 1, motivo: "" })
                            }
                          }}>
                            <RotateCcw size={15} />
                          </button>
                          <button type="button" className={btnGhost} title="Anular" onClick={async () => {
                            const d = await cargarDetalle(f.id_factura)
                            if (d) { setAnular(d); setMotivo("") }
                          }}>
                            <Ban size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} total={total} totalPages={Math.max(1, Math.ceil(total / 15))} onPage={setPage} />

      <Modal open={!!anular} title={anular ? `Anular venta #${anular.numero_corto}` : ""} onClose={() => setAnular(null)}>
        <p className="text-sm text-ink/70">El stock vuelve al inventario y la acción queda en auditoría.</p>
        <FieldLabel label="Motivo" required className="mt-4">
          <input autoFocus className={input} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </FieldLabel>
        {error && <FormAlert message={error} />}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className={btnGhost} onClick={() => setAnular(null)}>Cancelar</button>
          <button type="button" className={btnPrimary} disabled={pending || motivo.trim().length < 10} onClick={() => void confirmarAnular()}>
            Anular venta
          </button>
        </div>
      </Modal>

      <Modal open={!!devolver} title={devolver ? `Devolución · venta #${devolver.numero_corto}` : ""} onClose={() => setDevolver(null)}>
        {devolver && (
          <>
            <FieldLabel label="Producto">
              <select className={input} value={devForm.id_detalle} onChange={(e) => setDevForm({ ...devForm, id_detalle: e.target.value })}>
                {devolver.lineas.map((l) => (
                  <option key={l.id_detalle} value={l.id_detalle}>
                    {l.producto} (vendidos {l.cantidad})
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="Cantidad" className="mt-4">
              <input type="number" min={1} className={input} value={devForm.qty} onChange={(e) => setDevForm({ ...devForm, qty: Number(e.target.value) })} />
            </FieldLabel>
            <FieldLabel label="Motivo" className="mt-4">
              <input className={input} value={devForm.motivo} onChange={(e) => setDevForm({ ...devForm, motivo: e.target.value })} />
            </FieldLabel>
            {error && <FormAlert message={error} />}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className={btnGhost} onClick={() => setDevolver(null)}>Cancelar</button>
              <button type="button" className={btnPrimary} disabled={pending || devForm.qty < 1} onClick={() => void confirmarDevolucion()}>
                Registrar devolución
              </button>
            </div>
          </>
        )}
      </Modal>
    </section>
  )
}

function MotionDetalle({
  f,
  detalle,
  rol,
  puedeGestionar,
  onAnular,
  onDevolver,
}: {
  f: Factura
  detalle: Detalle
  rol?: string
  puedeGestionar: boolean
  onAnular: () => void
  onDevolver: () => void
}) {
  return (
    <div className="border-t-2 border-dashed border-plum/15 p-4 text-sm animate-in slide-in-from-top-1 duration-200">
      <table className="w-full">
        <tbody>
          {detalle.lineas.map((l) => (
            <tr key={l.id_detalle}>
              <td className="py-1">
                {l.producto}
                {l.afecta_venta_diaria === false && (
                  <span className="ml-2 text-[11px] font-bold text-brand-dark">Artístico</span>
                )}
              </td>
              <td className="text-right">
                {l.cantidad} × {money(l.precio_unitario)}
                {l.descuento_porcentaje ? ` (−${l.descuento_porcentaje}%)` : ""}
              </td>
              <td className="w-28 text-right font-bold">{money(l.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-ink/60">
        Pagos:{" "}
        {detalle.pagos.map((p) => `${p.metodo.toLowerCase()} ${money(p.valor)}${p.referencia ? ` (${p.referencia})` : ""}`).join(" · ")}
      </p>
      {f.requiere_domicilio && <p className="mt-1 text-xs text-ink/60">Venta con domicilio.</p>}
      {detalle.requiere_factura_electronica && (
        <p className="mt-1 text-xs text-ink/60">Factura electrónica solicitada (seguimiento interno).</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/panel/${rol}/imprimir/${f.id_factura}?formato=carta`} className={btnGhost}>
          <Printer size={15} className="mr-1 inline" /> Imprimir
        </Link>
        {puedeGestionar && f.estado !== "ANULADA" && (
          <>
            <button type="button" className={btnGhost} onClick={onDevolver}>
              <RotateCcw size={15} className="mr-1 inline" /> Devolución parcial
            </button>
            <button type="button" className={btnGhost} onClick={onAnular}>
              <Ban size={15} className="mr-1 inline" /> Anular venta
            </button>
          </>
        )}
      </div>
    </div>
  )
}