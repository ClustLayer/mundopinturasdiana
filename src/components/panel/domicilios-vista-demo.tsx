import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Check, ChevronDown, Truck, UserRound, X } from "lucide-react"
import { btnGhost, btnPrimary, ConfirmDestructiveDialog, Empty, Modal, input, useDo } from "./kit"
import { api, mensajeDe } from "../../shared/api"
import { toast } from "../../features/en-desarrollo"

export type EntregaRow = {
  id_entrega: number
  consecutivo_factura: string
  numero_corto?: number | string
  cliente: string
  direccion: string
  telefono_contacto: string
  estado: string
  estado_etiqueta: string
  mensajero: string
  id_mensajero?: number | null
  fecha_solicitud: string
  valor_cobrado_cliente: string
  valor_pagado_mensajero: string
  observaciones?: string
  historial?: { estado_anterior: string | null; estado_nuevo: string; fecha_hora: string; observaciones: string }[]
}

const money = (n: number | string) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(n) || 0)

const dt = (v: string) =>
  new Date(v).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" })

function badgeEstado(estado: string, etiqueta: string) {
  const tono =
    estado === "ENTREGADO"
      ? "bg-cyan/15 text-cyan-dark"
      : estado === "CANCELADO"
        ? "bg-brand/10 text-brand-dark"
        : estado === "EN_CAMINO"
          ? "bg-plum-soft text-plum"
          : "bg-paper text-ink/80 border border-plum/15"
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${tono}`}>{etiqueta}</span>
}

const TABS = [
  { id: "activos", label: "Pendientes y en ruta" },
  { id: "entregado", label: "Entregados" },
  { id: "cancelado", label: "Cancelados" },
  { id: "todos", label: "Todos" },
]

type Opt = { id_mensajero: number; label: string }

export function DomiciliosVistaDemo({
  rows,
  vista,
  onVista,
  canWrite,
  activos,
  onReload,
}: {
  rows: EntregaRow[]
  vista: string
  onVista: (v: string) => void
  canWrite: boolean
  activos: Opt[]
  onReload: () => void
}) {
  const { rol } = useParams<{ rol: string }>()
  const [openHist, setOpenHist] = useState<number | null>(null)
  const [edit, setEdit] = useState<EntregaRow | null>(null)
  const [f, setF] = useState({ id_mensajero: "", fee: "", notes: "" })
  const [conf, setConf] = useState<{ row: EntregaRow; estado: "ENTREGADO" | "CANCELADO" } | null>(null)
  const [histCache, setHistCache] = useState<Record<number, EntregaRow["historial"]>>({})
  const { run, pending } = useDo()

  const abierto = (r: EntregaRow) => r.estado === "PENDIENTE" || r.estado === "ASIGNADO" || r.estado === "EN_CAMINO"

  const enRuta = (r: EntregaRow) =>
    run(async () => {
      const r0 = await api(`/api/v1/domicilios/${r.id_entrega}/estado/`, {
        method: "POST",
        body: JSON.stringify({ estado: "EN_CAMINO" }),
      })
      if (!r0.ok) return toast((await mensajeDe(r0)) || "No fue posible marcar en ruta.")
      toast("Domicilio en ruta.")
      onReload()
    })

  const guardarCourier = () =>
    run(async () => {
      if (!edit) return
      if (!f.id_mensajero) return toast("Seleccione un domiciliario.")
      const r = await api(`/api/v1/domicilios/${edit.id_entrega}/asignar/`, {
        method: "POST",
        body: JSON.stringify({ id_mensajero: Number(f.id_mensajero), observaciones: f.notes }),
      })
      if (!r.ok) return toast((await mensajeDe(r)) || "No fue posible guardar.")
      toast("Domiciliario actualizado.")
      setEdit(null)
      onReload()
    })

  const confirmarEstado = () =>
    run(async () => {
      if (!conf) return
      const r = await api(`/api/v1/domicilios/${conf.row.id_entrega}/estado/`, {
        method: "POST",
        body: JSON.stringify({ estado: conf.estado }),
      })
      if (!r.ok) return toast((await mensajeDe(r)) || "No fue posible actualizar.")
      toast(conf.estado === "ENTREGADO" ? "Marcado como entregado." : "Domicilio cancelado.")
      setConf(null)
      onReload()
    })

  const expandHist = async (id: number) => {
    if (openHist === id) {
      setOpenHist(null)
      return
    }
    setOpenHist(id)
    if (!histCache[id]) {
      const r = await api(`/api/v1/domicilios/${id}/`)
      if (r.ok) {
        const d = (await r.json()) as { item: EntregaRow }
        setHistCache((h) => ({ ...h, [id]: d.item.historial ?? [] }))
      }
    }
  }

  const numeroVenta = (r: EntregaRow) => {
    const num = (r.consecutivo_factura.split("-").pop() || "").replace(/^0+/, "") || r.consecutivo_factura
    return num
  }

  return (
    <div>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Vistas de domicilios">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onVista(t.id)}
            className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition ${vista === t.id ? "border-brand bg-brand text-white shadow-[2px_2px_0_0_#371837]" : "border-plum/15 bg-white text-plum hover:border-cyan"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {!rows.length ? (
        <Empty text="No hay domicilios en esta vista." />
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((r) => (
            <li key={r.id_entrega} className="rounded-2xl border-2 border-plum/10 bg-white transition hover:border-plum/20">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    {r.cliente} {badgeEstado(r.estado, r.estado_etiqueta)}
                    <Link to={`/panel/${rol}/ventas?numero=${numeroVenta(r)}`} className="text-xs font-bold text-brand underline">
                      Venta #{numeroVenta(r)}
                    </Link>
                  </p>
                  <p className="text-xs text-ink/60">
                    {r.direccion} · {r.telefono_contacto}
                  </p>
                  <p className="text-xs text-ink/55">
                    Solicitado {dt(r.fecha_solicitud)} · Domiciliario: {r.mensajero || "sin asignar"}
                    {r.valor_pagado_mensajero ? ` · Pago domiciliario ${money(r.valor_pagado_mensajero)}` : ""}
                    {r.valor_cobrado_cliente ? ` · Cobrado ${money(r.valor_cobrado_cliente)}` : ""}
                  </p>
                </div>
                {canWrite && abierto(r) && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => {
                        setEdit(r)
                        setF({ id_mensajero: r.id_mensajero ? String(r.id_mensajero) : "", fee: r.valor_pagado_mensajero, notes: r.observaciones ?? "" })
                      }}
                    >
                      <UserRound size={15} /> Domiciliario
                    </button>
                    {(r.estado === "PENDIENTE" || r.estado === "ASIGNADO") && (
                      <button type="button" disabled={pending} className={btnPrimary} onClick={() => void enRuta(r)}>
                        <Truck size={15} /> En ruta
                      </button>
                    )}
                    {r.estado === "EN_CAMINO" && (
                      <button type="button" disabled={pending} className={btnPrimary} onClick={() => setConf({ row: r, estado: "ENTREGADO" })}>
                        <Check size={15} /> Entregado
                      </button>
                    )}
                    <button type="button" disabled={pending} className={btnGhost} onClick={() => setConf({ row: r, estado: "CANCELADO" })}>
                      <X size={15} /> Cancelar
                    </button>
                  </div>
                )}
                <button type="button" onClick={() => void expandHist(r.id_entrega)} className="rounded-lg p-1.5 hover:bg-plum-soft">
                  <ChevronDown size={18} className={`transition ${openHist === r.id_entrega ? "rotate-180" : ""}`} />
                </button>
              </div>
              {openHist === r.id_entrega && (
                <div className="border-t-2 border-dashed border-plum/15 p-4 text-xs text-ink/70">
                  {r.observaciones && <p className="mb-2">Notas: {r.observaciones}</p>}
                  {histCache[r.id_entrega]?.length ? (
                    <ul className="space-y-1">
                      {histCache[r.id_entrega]!.map((h, i) => (
                        <li key={i}>
                          {dt(h.fecha_hora)} · {String(h.estado_anterior ?? "—").replace(/_/g, " ")} → <b>{String(h.estado_nuevo).replace(/_/g, " ")}</b>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Sin cambios de estado todavía.</p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {edit && (
        <Modal open title={`Domicilio de ${edit.cliente}`} onClose={() => setEdit(null)}>
          <label className="block text-sm font-semibold">
            Domiciliario registrado
            <select value={f.id_mensajero} onChange={(e) => setF({ ...f, id_mensajero: e.target.value })} className={input}>
              <option value="">— Seleccionar —</option>
              {activos.map((c) => (
                <option key={c.id_mensajero} value={c.id_mensajero}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Pago al domiciliario (opcional)
            <input type="number" min={0} value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} className={input} />
          </label>
          <p className="mt-1 text-xs text-ink/55">No entra en ventas ni en gastos del día.</p>
          <label className="mt-4 block text-sm font-semibold">
            Notas
            <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={input} />
          </label>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" className={btnGhost} onClick={() => setEdit(null)}>Cancelar</button>
            <button type="button" disabled={pending} className={btnPrimary} onClick={() => void guardarCourier()}>Guardar</button>
          </div>
        </Modal>
      )}

      <ConfirmDestructiveDialog
        open={!!conf}
        title={conf?.estado === "ENTREGADO" ? "Marcar como entregado" : "Cancelar domicilio"}
        recordName={conf?.row.cliente ?? "Domicilio"}
        message={
          conf?.estado === "ENTREGADO"
            ? "El domicilio quedará como entregado y ya no se podrá cambiar."
            : "El domicilio quedará cancelado y ya no se podrá cambiar. La venta no se anula."
        }
        yes={conf?.estado === "ENTREGADO" ? "Marcar entregado" : "Cancelar domicilio"}
        danger={conf?.estado === "CANCELADO"}
        busy={pending}
        onCancel={() => setConf(null)}
        onConfirm={() => void confirmarEstado()}
      />
    </div>
  )
}