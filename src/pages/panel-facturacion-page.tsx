import { useCallback, useEffect, useState } from "react"
import { ExternalLink, Info, Pencil } from "lucide-react"
import { Empty, FieldLabel, FormAlert, Modal, Pager, btnGhost, btnPrimary, input, useDebounced, useDo } from "../components/panel/kit"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import { toast } from "../features/en-desarrollo"
import { api, cuerpoError, mensajeDe } from "../shared/api"

type Item = {
  id_gestion_externa: number
  id_factura: number
  numero_factura: string
  cliente: string
  fecha_solicitud: string
  estado: string
  estado_etiqueta: string
  numero_electronico: string
  observaciones: string
  fecha_registro: string
  version_fila: number
  tiene_soporte_pdf: boolean
}

const ESTADOS = [
  { v: "", l: "Todos" },
  { v: "PENDIENTE", l: "Pendiente" },
  { v: "GENERADA_EXTERNA", l: "Generada Externamente" },
  { v: "CANCELADA", l: "Cancelada" },
]

function badge(estado: string, etiqueta: string) {
  const tono =
    estado === "GENERADA_EXTERNA"
      ? "bg-cyan/15 text-cyan-dark"
      : estado === "CANCELADA"
        ? "bg-brand/10 text-brand-dark"
        : "bg-sun/30 text-ink border border-plum/10"
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${tono}`} title={`Estado: ${etiqueta}`}>
      {etiqueta}
    </span>
  )
}

export function PanelFacturacionPage() {
  const { accionesModulo } = useAccesos()
  const acciones = accionesModulo("facturacion")
  const puedeEditar = puedeAccion(acciones, "Editar")
  const { run, pending } = useDo()

  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  const [estado, setEstado] = useState("")
  const [numero, setNumero] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const debNumero = useDebounced(numero, 300)

  const [detalle, setDetalle] = useState<Item | null>(null)
  const [editar, setEditar] = useState<Item | null>(null)
  const [form, setForm] = useState({ numero_electronico: "", url_pdf: "", observaciones: "", estado: "GENERADA_EXTERNA" })

  const cargar = useCallback(async () => {
    setCargando(true)
    setError("")
    try {
      const q = new URLSearchParams({
        page: String(page),
        page_size: "15",
      })
      if (estado) q.set("estado", estado)
      if (debNumero.trim()) q.set("numero", debNumero.trim())
      if (fechaDesde) q.set("fecha_desde", fechaDesde)
      if (fechaHasta) q.set("fecha_hasta", fechaHasta)
      const resp = await api(`/api/v1/ventas/facturacion-externa/?${q}`)
      const texto = await mensajeDe(resp)
      if (!resp.ok) {
        setError(texto || "No fue posible cargar la bandeja. Intente nuevamente.")
        setItems([])
        setTotal(0)
        return
      }
      const data = (await resp.json()) as { items: Item[]; total: number; mensaje: string }
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
      setMensaje(data.mensaje ?? "")
    } catch {
      setError("No fue posible cargar la bandeja. Intente nuevamente.")
    } finally {
      setCargando(false)
    }
  }, [page, estado, debNumero, fechaDesde, fechaHasta])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])

  const abrirDetalle = async (id: number) => {
    try {
      const resp = await api(`/api/v1/ventas/facturacion-externa/${id}/`)
      if (!resp.ok) {
        toast(await mensajeDe(resp))
        return
      }
      const data = (await resp.json()) as { item: Item }
      setDetalle(data.item)
    } catch {
      toast("No fue posible cargar la bandeja. Intente nuevamente.")
    }
  }

  const abrirPdf = async (id: number) => {
    try {
      const resp = await api(`/api/v1/ventas/facturacion-externa/${id}/soporte/`)
      const texto = await mensajeDe(resp)
      if (!resp.ok) {
        toast(texto || "El archivo o soporte solicitado no está disponible.")
        return
      }
      const data = (await resp.json()) as { url_pdf: string }
      window.open(data.url_pdf, "_blank", "noopener,noreferrer")
    } catch {
      toast("El archivo o soporte solicitado no está disponible.")
    }
  }

  const guardarEstado = () => {
    if (!editar) return
    void run(async () => {
      const resp = await api(`/api/v1/ventas/facturacion-externa/${editar.id_gestion_externa}/estado/`, {
        method: "POST",
        body: JSON.stringify({
          estado: form.estado,
          numero_electronico: form.numero_electronico,
          url_pdf: form.url_pdf,
          observaciones: form.observaciones,
          version_fila: editar.version_fila,
        }),
      })
      const texto = await mensajeDe(resp)
      if (!resp.ok) {
        const det = await cuerpoError(resp)
        toast(det?.mensaje || texto)
        return
      }
      toast(texto)
      setEditar(null)
      await cargar()
    })
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-brand">Control operativo</p>
        <h1 className="font-display text-3xl font-extrabold text-plum">Control de Facturación Externa</h1>
      </div>

      <div role="note" className="flex items-start gap-3 rounded-2xl border-2 border-sun bg-sun/20 p-4 text-sm text-ink">
        <Info size={18} className="mt-0.5 shrink-0 text-plum" aria-hidden />
        <p>
          <b>Seguimiento interno manual.</b> No hay conexión con la DIAN; aquí solo se registra el estado del comprobante generado por fuera.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border-2 border-plum/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <FieldLabel label="Estado">
          <select value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1) }} className={input} aria-label="Filtrar por estado">
            {ESTADOS.map((o) => (
              <option key={o.v || "all"} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Número de factura">
          <input value={numero} onChange={(e) => { setNumero(e.target.value); setPage(1) }} className={input} placeholder="Serie o consecutivo" aria-label="Número de factura" />
        </FieldLabel>
        <FieldLabel label="Desde">
          <input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPage(1) }} className={input} aria-label="Fecha desde" />
        </FieldLabel>
        <FieldLabel label="Hasta">
          <input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setPage(1) }} className={input} aria-label="Fecha hasta" />
        </FieldLabel>
      </div>

      {error && <FormAlert message={error} />}
      {cargando ? (
        <p className="text-sm text-ink/60" role="status">
          Cargando bandeja…
        </p>
      ) : !items.length ? (
        <Empty text={mensaje || "No hay facturas para los criterios indicados."} />
      ) : (
        <>
          <p className="text-sm font-semibold text-ink/70" role="status">
            {mensaje}
          </p>
          <div className="overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b-2 border-plum/10 bg-paper text-xs font-bold uppercase tracking-wide text-plum">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Factura
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Cliente
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Solicitud
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Nº externo
                  </th>
                  <th scope="col" className="px-4 py-3">
                    PDF
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id_gestion_externa} className="border-b border-plum/5 hover:bg-plum-soft/40">
                    <td className="px-4 py-3 font-semibold text-plum">{r.numero_factura}</td>
                    <td className="px-4 py-3">{r.cliente}</td>
                    <td className="px-4 py-3 text-ink/70">{new Date(r.fecha_solicitud).toLocaleString("es-CO")}</td>
                    <td className="px-4 py-3">{badge(r.estado, r.estado_etiqueta)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.numero_electronico || "—"}</td>
                    <td className="px-4 py-3">
                      {r.tiene_soporte_pdf ? (
                        <button
                          type="button"
                          className={`${btnGhost} !px-2 !py-1 text-xs`}
                          onClick={() => void abrirPdf(r.id_gestion_externa)}
                          aria-label={`Abrir PDF ${r.numero_factura}`}
                        >
                          <ExternalLink size={14} className="inline" /> Soporte
                        </button>
                      ) : (
                        <span className="text-xs text-ink/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={`${btnGhost} !px-2 !py-1 text-xs`} onClick={() => void abrirDetalle(r.id_gestion_externa)}>
                          Detalle
                        </button>
                        {puedeEditar && r.estado === "PENDIENTE" && (
                          <button
                            type="button"
                            className={`${btnPrimary} !px-2 !py-1 text-xs`}
                            onClick={() => {
                              setEditar(r)
                              setForm({
                                numero_electronico: r.numero_electronico,
                                url_pdf: "",
                                observaciones: r.observaciones,
                                estado: "GENERADA_EXTERNA",
                              })
                            }}
                            aria-label={`Registrar comprobante ${r.numero_factura}`}
                          >
                            <Pencil size={14} className="inline" /> Generar externa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={Math.max(1, Math.ceil(total / 15))} total={total} onPage={setPage} />
        </>
      )}

      {detalle && (
        <Modal open onClose={() => setDetalle(null)} title={`Comprobante · ${detalle.numero_factura}`}>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-bold text-plum">Fecha de registro</dt>
              <dd>{new Date(detalle.fecha_registro).toLocaleString("es-CO")}</dd>
            </div>
            <div>
              <dt className="font-bold text-plum">Número comprobante externo</dt>
              <dd>{detalle.numero_electronico || "—"}</dd>
            </div>
            <div>
              <dt className="font-bold text-plum">Observaciones</dt>
              <dd className="whitespace-pre-line">{detalle.observaciones || "—"}</dd>
            </div>
          </dl>
          <div className="mt-6 flex justify-end">
            <button type="button" className={btnGhost} onClick={() => setDetalle(null)}>
              Cerrar
            </button>
          </div>
        </Modal>
      )}

      {editar && (
        <Modal open onClose={() => setEditar(null)} title="Cambio manual de estado">
          <p className="text-sm text-ink/70">Marque como generada externamente e ingrese el número asignado por la plataforma o el enlace al PDF.</p>
          <FieldLabel label="Número comprobante externo (máx. 100)" required>
            <input
              value={form.numero_electronico}
              onChange={(e) => setForm({ ...form, numero_electronico: e.target.value })}
              className={input}
              maxLength={100}
              required
            />
          </FieldLabel>
          <FieldLabel label="URL PDF externo">
            <input value={form.url_pdf} onChange={(e) => setForm({ ...form, url_pdf: e.target.value })} className={input} type="url" placeholder="https://" />
          </FieldLabel>
          <FieldLabel label="Observaciones">
            <textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className={input} rows={3} />
          </FieldLabel>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setEditar(null)} disabled={pending}>
              Cancelar
            </button>
            <button type="button" className={btnPrimary} onClick={guardarEstado} disabled={pending || !form.numero_electronico.trim()}>
              Guardar
            </button>
          </div>
        </Modal>
      )}
    </section>
  )
}