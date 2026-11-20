import { useCallback, useEffect, useState } from "react"
import { Eye, Printer, RotateCcw, Truck, XCircle } from "lucide-react"
import { btnGhost, btnPrimary, Empty, FieldLabel, FormAlert, input, Modal, Pager, useDo } from "../components/panel/kit"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import { toast } from "../features/en-desarrollo"
import { api, mensajeDe } from "../shared/api"

type Factura = {
  id_factura: number
  consecutivo: string
  estado: string
  fecha_hora: string
  cliente: string
  sede: string
  total: number
  margen_negativo: boolean
  factura_electronica_estado: string | null
}

type Detalle = Factura & {
  lineas: { id_detalle: number; producto: string; cantidad: number; cantidad_devuelta: number; subtotal: number }[]
  pagos: { metodo: string; valor: number; referencia: string }[]
  version_fila: number
  tipo_venta?: string
}

const money = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)

export function PanelVentasPage() {
  const { accionesModulo } = useAccesos()
  const puedeTotal = puedeAccion(accionesModulo("ventas"), "Total")
  const puedeDomicilio = puedeAccion(accionesModulo("domicilios"), "Crear")
  const [items, setItems] = useState<Factura[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const [margenNeg, setMargenNeg] = useState(false)
  const [detalle, setDetalle] = useState<Detalle | null>(null)
  const [anular, setAnular] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState("")
  const [crearDom, setCrearDom] = useState(false)
  const [domForm, setDomForm] = useState({ direccion: "", telefono_contacto: "", valor_cobrado_cliente: "", valor_pagado_mensajero: "", observaciones: "" })
  const { run, pending } = useDo()

  const cargar = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), page_size: "15", q })
    if (margenNeg && puedeTotal) qs.set("margen_negativo", "1")
    const r = await api(`/api/v1/ventas/facturas/?${qs}`)
    if (!r.ok) return toast((await mensajeDe(r)) || "No fue posible cargar las facturas. Intente nuevamente.")
    const d = (await r.json()) as { items: Factura[]; total: number; mensaje?: string }
    setItems(d.items)
    setTotal(d.total)
    if (d.mensaje) toast(d.mensaje)
  }, [page, q, margenNeg, puedeTotal])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota al cambiar filtros
    void cargar()
  }, [cargar])

  const verDetalle = async (id: number) => {
    const r = await api(`/api/v1/ventas/facturas/${id}/`)
    if (!r.ok) return toast((await mensajeDe(r)) || "No fue posible cargar el detalle.")
    const d = (await r.json()) as { factura: Detalle }
    setDetalle(d.factura)
  }

  const abrirCrearDomicilio = async () => {
    if (!detalle) return
    const r = await api(`/api/v1/domicilios/factura/${detalle.id_factura}/precarga/`)
    if (!r.ok) return toast((await mensajeDe(r)) || "La factura seleccionada no es de tipo Domicilio o ya tiene un domicilio asociado.")
    const d = (await r.json()) as { direccion: string; telefono_contacto: string }
    setDomForm({ direccion: d.direccion, telefono_contacto: d.telefono_contacto, valor_cobrado_cliente: "", valor_pagado_mensajero: "", observaciones: "" })
    setCrearDom(true)
    setError("")
  }

  const confirmarDomicilio = () =>
    run(async () => {
      if (!detalle) return
      const r = await api("/api/v1/domicilios/", {
        method: "POST",
        body: JSON.stringify({ id_factura: detalle.id_factura, ...domForm }),
      })
      if (!r.ok) {
        setError((await mensajeDe(r)) || "No fue posible crear el domicilio. Intente nuevamente.")
        return
      }
      toast(((await r.json()) as { mensaje: string }).mensaje)
      setCrearDom(false)
    })

  const confirmarAnular = () =>
    run(async () => {
      if (!detalle) return
      const r = await api(`/api/v1/ventas/facturas/${detalle.id_factura}/anular/`, {
        method: "POST",
        body: JSON.stringify({ motivo }),
      })
      if (!r.ok) {
        setError((await mensajeDe(r)) || "No fue posible anular la factura.")
        return
      }
      toast((await r.json() as { mensaje: string }).mensaje)
      setAnular(false)
      setDetalle(null)
      void cargar()
    })

  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Ventas</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Facturas</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">Consulta, reimpresión, anulación y devoluciones parciales.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <FieldLabel label="Buscar" className="min-w-[14rem] flex-1">
          <input className={input} value={q} onChange={(e) => { setPage(1); setQ(e.target.value) }} placeholder="Número, cliente o documento" />
        </FieldLabel>
        {puedeTotal && (
          <label className="flex items-center gap-2 self-end text-sm font-semibold">
            <input type="checkbox" checked={margenNeg} onChange={(e) => { setMargenNeg(e.target.checked); setPage(1) }} />
            Margen negativo
          </label>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-plum/10 bg-paper/80 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="p-3">Número</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Sede</th>
              <th className="p-3">Total</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.id_factura} className="border-b border-plum/5">
                <td className="p-3 font-mono font-semibold">{f.consecutivo}</td>
                <td className="p-3">{new Date(f.fecha_hora).toLocaleString("es-CO")}</td>
                <td className="p-3">{f.cliente}</td>
                <td className="p-3">{f.sede}</td>
                <td className="p-3 font-semibold">{money(f.total)}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${f.estado === "ANULADA" ? "bg-ink/10" : "bg-brand/15 text-brand-dark"}`}>
                    {f.estado}
                  </span>
                  {f.margen_negativo && <span className="ml-1 text-[10px] font-bold text-brand">Margen −</span>}
                </td>
                <td className="p-3">
                  <button type="button" className="rounded-lg p-2 hover:bg-plum/5" title="Ver detalle" onClick={() => void verDetalle(f.id_factura)}>
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <Empty text="No se encontraron facturas con los criterios indicados." />}
      </div>
      <Pager page={page} total={total} totalPages={Math.max(1, Math.ceil(total / 15))} onPage={setPage} />

      <Modal open={!!detalle} title={detalle ? `Factura ${detalle.consecutivo}` : "Detalle"} onClose={() => setDetalle(null)}>
        {detalle && (
          <>
          <p className="text-sm text-ink/70">
            {detalle.sede} · {detalle.cliente} · {money(detalle.total)}
          </p>
          <ul className="mt-4 divide-y divide-plum/10 text-sm">
            {detalle.lineas.map((l) => (
              <li key={l.id_detalle} className="flex justify-between py-2">
                <span>
                  {l.producto} × {l.cantidad}
                </span>
                <span>{money(l.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={btnGhost} onClick={() => window.print()}>
              <Printer size={16} className="mr-1 inline" /> Reimprimir
            </button>
            {puedeDomicilio && detalle.estado === "EMITIDA" && (detalle.tipo_venta ?? "").toLowerCase() === "domicilio" && (
              <button type="button" className={btnPrimary} onClick={() => void abrirCrearDomicilio()}>
                <Truck size={16} className="mr-1 inline" /> Crear domicilio
              </button>
            )}
            {puedeTotal && detalle.estado === "EMITIDA" && (
              <>
                <button type="button" className={btnGhost} onClick={() => setAnular(true)}>
                  <XCircle size={16} className="mr-1 inline" /> Anular
                </button>
                <button type="button" className={btnGhost} title="Devolución parcial">
                  <RotateCcw size={16} className="mr-1 inline" /> Devolver
                </button>
              </>
            )}
          </div>
          </>
        )}
      </Modal>

      <Modal open={crearDom && !!detalle} title="Crear domicilio" onClose={() => setCrearDom(false)}>
        {detalle && (
          <>
            <FieldLabel label="Factura asociada">
              <input className={input} readOnly value={detalle.consecutivo} />
            </FieldLabel>
            <FieldLabel label="Dirección de entrega" required className="mt-3">
              <input className={input} value={domForm.direccion} onChange={(e) => setDomForm({ ...domForm, direccion: e.target.value })} />
            </FieldLabel>
            <FieldLabel label="Teléfono de contacto" className="mt-3">
              <input className={input} value={domForm.telefono_contacto} onChange={(e) => setDomForm({ ...domForm, telefono_contacto: e.target.value })} />
            </FieldLabel>
            <FieldLabel label="Valor cobrado al cliente" required className="mt-3">
              <input type="number" min={0} step="0.01" className={input} value={domForm.valor_cobrado_cliente} onChange={(e) => setDomForm({ ...domForm, valor_cobrado_cliente: e.target.value })} />
            </FieldLabel>
            <FieldLabel label="Valor pagado al mensajero" required className="mt-3">
              <input type="number" min={0} step="0.01" className={input} value={domForm.valor_pagado_mensajero} onChange={(e) => setDomForm({ ...domForm, valor_pagado_mensajero: e.target.value })} />
            </FieldLabel>
            <FieldLabel label="Observaciones" className="mt-3">
              <textarea className={input} rows={2} value={domForm.observaciones} onChange={(e) => setDomForm({ ...domForm, observaciones: e.target.value })} />
            </FieldLabel>
            {error && <FormAlert message={error} />}
            <div className="mt-4 flex gap-2">
              <button type="button" className={btnGhost} onClick={() => setCrearDom(false)}>Cancelar</button>
              <button type="button" className={btnPrimary} disabled={pending || !domForm.direccion.trim()} onClick={() => void confirmarDomicilio()}>
                Crear domicilio
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={anular && !!detalle} title="Anular factura" onClose={() => setAnular(false)}>
        {detalle && (
          <>
            <p className="text-sm text-ink/70">Se reingresará el inventario de la sede {detalle.sede}.</p>
            <FieldLabel label="Motivo" required className="mt-3">
              <textarea className={input} rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </FieldLabel>
            {error && <FormAlert message={error} />}
            <button type="button" className={`${btnPrimary} mt-4`} disabled={motivo.trim().length < 10 || pending} onClick={() => void confirmarAnular()}>
              Confirmar anulación
            </button>
          </>
        )}
      </Modal>
    </section>
  )
}