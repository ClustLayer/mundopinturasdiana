import { useCallback, useEffect, useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { DomiciliosVistaDemo } from "../components/panel/domicilios-vista-demo"
import {
  ConfirmDestructiveDialog,
  Empty,
  FieldLabel,
  FormAlert,
  Modal,
  Pager,
  btnGhost,
  btnPrimary,
  input,
  useDebounced,
  useDo,
} from "../components/panel/kit"
import { PhoneInput } from "../components/panel/phone-input"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import { toast } from "../features/en-desarrollo"
import { api, cuerpoError, mensajeDe } from "../shared/api"

type Antiguedad = { minutos: number; etiqueta: string; alerta_antiguedad: boolean }

type Entrega = {
  id_entrega: number
  consecutivo_factura: string
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
  antiguedad: Antiguedad
  transiciones_permitidas: string[]
  version_fila: number
  duracion?: string | null
  observaciones?: string
  historial?: { estado_anterior: string | null; estado_nuevo: string; fecha_hora: string; observaciones: string }[]
}

type Mensajero = {
  id_mensajero: number
  nombre: string
  apellido: string
  nombre_completo: string
  documento: string
  telefono: string
  fecha_inicio: string
  tarifa_promedio: string
  observaciones: string
  estado: boolean
  version_fila: number
  anos_trabajados: number
}

type Opt = { id_mensajero: number; label: string }

type Vista = "bandeja" | "mensajeros" | "historial"

const ESTADO_HIST = [
  { v: "", l: "Todos" },
  { v: "ENTREGADO", l: "Entregado" },
  { v: "CANCELADO", l: "Cancelado" },
  { v: "PENDIENTE", l: "Pendiente" },
  { v: "ASIGNADO", l: "Asignado" },
  { v: "EN_CAMINO", l: "En camino" },
]

function estadoBadge(estado: string, etiqueta: string) {
  const tono =
    estado === "ENTREGADO"
      ? "bg-cyan/15 text-cyan-dark"
      : estado === "CANCELADO"
        ? "bg-brand/10 text-brand-dark"
        : estado === "EN_CAMINO"
          ? "bg-plum-soft text-plum"
          : "bg-paper text-ink/80 border border-plum/15"
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${tono}`} title={`Estado: ${etiqueta}`}>
      {etiqueta}
    </span>
  )
}

export function PanelDomiciliosPage() {
  const { accionesModulo } = useAccesos()
  const acciones = accionesModulo("domicilios")
  const puedeCrear = puedeAccion(acciones, "Crear")
  const puedeEditar = puedeAccion(acciones, "Editar")
  const [vista, setVista] = useState<Vista>("bandeja")
  const { run, pending } = useDo()

  const [bandeja, setBandeja] = useState<Entrega[]>([])
  const [bandejaTotal, setBandejaTotal] = useState(0)
  const [bandejaPage, setBandejaPage] = useState(1)
  const [vistaDemo, setVistaDemo] = useState("activos")

  const [mensajeros, setMensajeros] = useState<Mensajero[]>([])
  const [mensajerosTotal, setMensajerosTotal] = useState(0)
  const [mensPage, setMensPage] = useState(1)
  const [qMens, setQMens] = useState("")
  const debQMens = useDebounced(qMens, 300)

  const [historial, setHistorial] = useState<Entrega[]>([])
  const [histTotal, setHistTotal] = useState(0)
  const [histPage, setHistPage] = useState(1)
  const [histEstado, setHistEstado] = useState("")
  const [histMensajero, setHistMensajero] = useState("")

  const [activos, setActivos] = useState<Opt[]>([])

  const [asignar, setAsignar] = useState<Entrega | null>(null)
  const [idMensajeroAsign, setIdMensajeroAsign] = useState("")
  const [cambiarEstado, setCambiarEstado] = useState<Entrega | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState("")
  const [obsEstado, setObsEstado] = useState("")
  const [confirmTerminal, setConfirmTerminal] = useState<"ENTREGADO" | "CANCELADO" | null>(null)
  const [modalMensajero, setModalMensajero] = useState<"new" | number | null>(null)
  const [formError, setFormError] = useState("")

  const [formMens, setFormMens] = useState({
    nombre: "",
    apellido: "",
    documento: "",
    telefono: "",
    fecha_inicio: new Date().toISOString().slice(0, 10),
    tarifa_promedio: "",
    observaciones: "",
    estado: true,
    version_fila: 1,
  })

  const cargarActivos = useCallback(async () => {
    const r = await api("/api/v1/domicilios/mensajeros/activos/")
    if (r.ok) setActivos(((await r.json()) as { items: Opt[] }).items)
  }, [])

  const cargarBandeja = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(bandejaPage), page_size: "15", orden: "desc", vista: vistaDemo })
    const r = await api(`/api/v1/domicilios/bandeja/?${qs}`)
    if (!r.ok) return toast((await mensajeDe(r)) || "No fue posible cargar los domicilios. Intente nuevamente.")
    const d = (await r.json()) as { items: Entrega[]; total: number; mensaje?: string }
    setBandeja(d.items)
    setBandejaTotal(d.total)
    if (d.mensaje) toast(d.mensaje)
  }, [bandejaPage, vistaDemo])

  const cargarMensajeros = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(mensPage), page_size: "15" })
    if (debQMens.trim()) qs.set("q", debQMens.trim())
    const r = await api(`/api/v1/domicilios/mensajeros/?${qs}`)
    if (!r.ok) return
    const d = (await r.json()) as { items: Mensajero[]; total: number }
    setMensajeros(d.items)
    setMensajerosTotal(d.total)
  }, [mensPage, debQMens])

  const cargarHistorial = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(histPage), page_size: "15" })
    if (histEstado) qs.set("estado", histEstado)
    if (histMensajero) qs.set("id_mensajero", histMensajero)
    const r = await api(`/api/v1/domicilios/historial/?${qs}`)
    if (!r.ok) return toast((await mensajeDe(r)) || "No fue posible cargar el historial. Intente nuevamente.")
    const d = (await r.json()) as { items: Entrega[]; total: number; mensaje?: string }
    setHistorial(d.items)
    setHistTotal(d.total)
    if (d.mensaje) toast(d.mensaje)
  }, [histPage, histEstado, histMensajero])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- catálogos auxiliares al montar
    void cargarActivos()
  }, [cargarActivos])

  useEffect(() => {
    if (vista !== "bandeja") return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargarBandeja()
  }, [vista, cargarBandeja])

  useEffect(() => {
    if (vista !== "mensajeros") return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargarMensajeros()
  }, [vista, cargarMensajeros])

  useEffect(() => {
    if (vista !== "historial") return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargarHistorial()
  }, [vista, cargarHistorial])

  const guardarAsignacion = () =>
    run(async () => {
      if (!asignar || !idMensajeroAsign) {
        setFormError("Debe seleccionar un mensajero activo.")
        return
      }
      const r = await api(`/api/v1/domicilios/${asignar.id_entrega}/asignar/`, {
        method: "POST",
        body: JSON.stringify({ id_mensajero: Number(idMensajeroAsign) }),
      })
      if (!r.ok) {
        setFormError((await mensajeDe(r)) || "No fue posible asignar el mensajero. Intente nuevamente.")
        return
      }
      toast(((await r.json()) as { mensaje: string }).mensaje)
      setAsignar(null)
      void cargarBandeja()
    })

  const aplicarEstado = (estado: string) =>
    run(async () => {
      if (!cambiarEstado) return
      const r = await api(`/api/v1/domicilios/${cambiarEstado.id_entrega}/estado/`, {
        method: "POST",
        body: JSON.stringify({ estado, observaciones: obsEstado }),
      })
      if (!r.ok) {
        setFormError((await mensajeDe(r)) || "No fue posible actualizar el estado. Intente nuevamente.")
        return
      }
      toast(((await r.json()) as { mensaje: string }).mensaje)
      setCambiarEstado(null)
      setConfirmTerminal(null)
      setNuevoEstado("")
      setObsEstado("")
      void cargarBandeja()
    })

  const abrirEditarMensajero = (m: Mensajero) => {
    setFormMens({
      nombre: m.nombre,
      apellido: m.apellido,
      documento: m.documento,
      telefono: m.telefono,
      fecha_inicio: m.fecha_inicio,
      tarifa_promedio: m.tarifa_promedio,
      observaciones: m.observaciones,
      estado: m.estado,
      version_fila: m.version_fila,
    })
    setModalMensajero(m.id_mensajero)
    setFormError("")
  }

  const guardarMensajero = () =>
    run(async () => {
      const payload = {
        ...formMens,
        tarifa_promedio: formMens.tarifa_promedio === "" ? "0" : formMens.tarifa_promedio,
      }
      const isNew = modalMensajero === "new"
      const r = await api(isNew ? "/api/v1/domicilios/mensajeros/" : `/api/v1/domicilios/mensajeros/${modalMensajero}/`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const err = await cuerpoError(r)
        if (err.codigo === "CONCURRENCIA") {
          setFormError(err.mensaje ?? "Conflicto de edición.")
          return
        }
        setFormError(err.mensaje ?? "No fue posible guardar el mensajero.")
        return
      }
      toast(((await r.json()) as { mensaje: string }).mensaje)
      setModalMensajero(null)
      void cargarMensajeros()
      void cargarActivos()
    })

  const tabs: { id: Vista; label: string }[] = [
    { id: "bandeja", label: "Bandeja de domicilios" },
    { id: "mensajeros", label: "Mensajeros" },
    { id: "historial", label: "Historial" },
  ]

  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Logística</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Domicilios</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">
        Los domicilios nacen en el punto de venta; aquí solo se gestionan: asignar domiciliario y avanzar el estado.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Secciones de domicilios">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-xl border-2 px-4 py-2 text-sm font-bold ${vista === t.id ? "border-brand bg-brand text-white" : "border-plum/15 bg-white text-plum"}`}
            aria-current={vista === t.id ? "page" : undefined}
            onClick={() => setVista(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {vista === "bandeja" && (
        <>
          <DomiciliosVistaDemo
            rows={bandeja}
            vista={vistaDemo}
            onVista={(v) => {
              setVistaDemo(v)
              setBandejaPage(1)
            }}
            canWrite={puedeEditar}
            activos={activos}
            onReload={() => void cargarBandeja()}
          />
          <Pager page={bandejaPage} total={bandejaTotal} totalPages={Math.max(1, Math.ceil(bandejaTotal / 15))} onPage={setBandejaPage} />
        </>
      )}

      {vista === "mensajeros" && (
        <>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <FieldLabel label="Buscar" className="min-w-[14rem] flex-1">
              <input className={input} value={qMens} onChange={(e) => { setMensPage(1); setQMens(e.target.value) }} placeholder="Nombre, documento o teléfono" />
            </FieldLabel>
            {puedeCrear && (
              <button type="button" className={btnPrimary} onClick={() => { setModalMensajero("new"); setFormMens({ nombre: "", apellido: "", documento: "", telefono: "", fecha_inicio: new Date().toISOString().slice(0, 10), tarifa_promedio: "", observaciones: "", estado: true, version_fila: 1 }); setFormError("") }}>
                <Plus size={16} className="mr-1 inline" /> Nuevo mensajero
              </button>
            )}
          </div>
          <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-plum/10 bg-paper/80 text-xs uppercase tracking-wide text-ink/60">
                <tr>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Documento</th>
                  <th className="p-3">Teléfono</th>
                  <th className="p-3">Tarifa prom.</th>
                  <th className="p-3">Años</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {mensajeros.map((m) => (
                  <tr key={m.id_mensajero} className="border-b border-plum/5">
                    <td className="p-3 font-semibold">{m.nombre_completo}</td>
                    <td className="p-3">{m.documento}</td>
                    <td className="p-3">{m.telefono}</td>
                    <td className="p-3">{m.tarifa_promedio}</td>
                    <td className="p-3">{m.anos_trabajados}</td>
                    <td className="p-3">{m.estado ? "Activo" : "Inactivo"}</td>
                    <td className="p-3">
                      {puedeEditar && (
                        <button type="button" className="rounded-lg p-2 hover:bg-plum/5" title="Editar" onClick={() => abrirEditarMensajero(m)}>
                          <Pencil size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!mensajeros.length && <Empty text="No hay mensajeros registrados." />}
          </div>
          <Pager page={mensPage} total={mensajerosTotal} totalPages={Math.max(1, Math.ceil(mensajerosTotal / 15))} onPage={setMensPage} />
        </>
      )}

      {vista === "historial" && (
        <>
          <div className="mt-6 flex flex-wrap gap-3">
            <FieldLabel label="Estado">
              <select className={input} value={histEstado} onChange={(e) => { setHistPage(1); setHistEstado(e.target.value) }}>
                {ESTADO_HIST.map((o) => (
                  <option key={o.v || "all"} value={o.v}>{o.l}</option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="Mensajero">
              <select className={input} value={histMensajero} onChange={(e) => { setHistPage(1); setHistMensajero(e.target.value) }}>
                <option value="">Todos</option>
                {activos.map((m) => (
                  <option key={m.id_mensajero} value={String(m.id_mensajero)}>{m.label}</option>
                ))}
              </select>
            </FieldLabel>
          </div>
          <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-plum/10 bg-paper/80 text-xs uppercase tracking-wide text-ink/60">
                <tr>
                  <th className="p-3">Factura</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Mensajero</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Solicitud</th>
                  <th className="p-3">Duración</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((e) => (
                  <tr key={e.id_entrega} className="border-b border-plum/5">
                    <td className="p-3 font-mono">{e.consecutivo_factura}</td>
                    <td className="p-3">{e.cliente}</td>
                    <td className="p-3">{e.mensajero || "—"}</td>
                    <td className="p-3">{estadoBadge(e.estado, e.estado_etiqueta)}</td>
                    <td className="p-3">{new Date(e.fecha_solicitud).toLocaleString("es-CO")}</td>
                    <td className="p-3">{e.duracion || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!historial.length && <Empty text="No hay entregas para los criterios indicados." />}
          </div>
          <Pager page={histPage} total={histTotal} totalPages={Math.max(1, Math.ceil(histTotal / 15))} onPage={setHistPage} />
        </>
      )}

      <Modal open={!!asignar} title="Asignar mensajero" onClose={() => setAsignar(null)}>
        {asignar && (
          <>
            <p className="text-sm text-ink/70">{asignar.consecutivo_factura} · {asignar.cliente}</p>
            <FieldLabel label="Mensajero" required className="mt-4">
              <select className={input} value={idMensajeroAsign} onChange={(e) => setIdMensajeroAsign(e.target.value)}>
                <option value="">Seleccione…</option>
                {activos.map((m) => (
                  <option key={m.id_mensajero} value={String(m.id_mensajero)}>{m.label}</option>
                ))}
              </select>
            </FieldLabel>
            {formError && <FormAlert message={formError} />}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setAsignar(null)}>Cancelar</button>
              <button type="button" className={btnPrimary} disabled={pending} onClick={() => void guardarAsignacion()}>Asignar</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!cambiarEstado} title="Cambiar estado" onClose={() => setCambiarEstado(null)}>
        {cambiarEstado && (
          <>
            <FieldLabel label="Estado nuevo" required>
              <select className={input} value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
                <option value="">Seleccione…</option>
                {cambiarEstado.transiciones_permitidas.map((st) => (
                  <option key={st} value={st}>{st.replace(/_/g, " ")}</option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="Observaciones" className="mt-3">
              <textarea className={input} rows={3} value={obsEstado} onChange={(e) => setObsEstado(e.target.value)} />
            </FieldLabel>
            {formError && <FormAlert message={formError} />}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setCambiarEstado(null)}>Cancelar</button>
              <button
                type="button"
                className={btnPrimary}
                disabled={!nuevoEstado || pending}
                onClick={() => {
                  if (nuevoEstado === "ENTREGADO" || nuevoEstado === "CANCELADO") setConfirmTerminal(nuevoEstado)
                  else void aplicarEstado(nuevoEstado)
                }}
              >
                Guardar estado
              </button>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDestructiveDialog
        open={confirmTerminal === "CANCELADO"}
        title="Cancelar domicilio"
        recordName={cambiarEstado?.consecutivo_factura ?? ""}
        message="El domicilio quedará cancelado. La factura de venta no se anula."
        yes="Cancelar domicilio"
        danger
        busy={pending}
        onCancel={() => setConfirmTerminal(null)}
        onConfirm={() => void aplicarEstado("CANCELADO")}
      />
      <ConfirmDestructiveDialog
        open={confirmTerminal === "ENTREGADO"}
        title="Marcar como entregado"
        recordName={cambiarEstado?.consecutivo_factura ?? ""}
        message="El domicilio quedará entregado y ya no admitirá cambios de estado."
        yes="Marcar entregado"
        busy={pending}
        onCancel={() => setConfirmTerminal(null)}
        onConfirm={() => void aplicarEstado("ENTREGADO")}
      />

      <Modal open={modalMensajero !== null} title={modalMensajero === "new" ? "Crear mensajero" : "Editar mensajero"} onClose={() => setModalMensajero(null)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel label="Nombre" required>
            <input className={input} value={formMens.nombre} onChange={(e) => setFormMens({ ...formMens, nombre: e.target.value })} />
          </FieldLabel>
          <FieldLabel label="Apellido" required>
            <input className={input} value={formMens.apellido} onChange={(e) => setFormMens({ ...formMens, apellido: e.target.value })} />
          </FieldLabel>
          <FieldLabel label="Documento" required>
            <input className={input} value={formMens.documento} onChange={(e) => setFormMens({ ...formMens, documento: e.target.value })} />
          </FieldLabel>
          <PhoneInput label="Teléfono" required value={formMens.telefono} onChange={(telefono) => setFormMens({ ...formMens, telefono })} />
          <FieldLabel label="Fecha de inicio" required>
            <input type="date" className={input} value={formMens.fecha_inicio} onChange={(e) => setFormMens({ ...formMens, fecha_inicio: e.target.value })} />
          </FieldLabel>
          <FieldLabel label="Tarifa promedio">
            <input type="number" min={0} step="0.01" className={input} value={formMens.tarifa_promedio} onChange={(e) => setFormMens({ ...formMens, tarifa_promedio: e.target.value })} />
          </FieldLabel>
        </div>
        <FieldLabel label="Observaciones" className="mt-3">
          <textarea className={input} rows={2} value={formMens.observaciones} onChange={(e) => setFormMens({ ...formMens, observaciones: e.target.value })} />
        </FieldLabel>
        {modalMensajero !== "new" && (
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={formMens.estado} onChange={(e) => setFormMens({ ...formMens, estado: e.target.checked })} />
            Mensajero activo
          </label>
        )}
        {formError && <FormAlert message={formError} />}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={() => setModalMensajero(null)}>Cancelar</button>
          <button type="button" className={btnPrimary} disabled={pending} onClick={() => void guardarMensajero()}>
            {modalMensajero === "new" ? "Crear mensajero" : "Guardar"}
          </button>
        </div>
      </Modal>
    </section>
  )
}