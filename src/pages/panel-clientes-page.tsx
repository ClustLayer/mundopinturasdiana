import { useCallback, useEffect, useState, type ReactNode } from "react"
import { Eye, Loader2, MessageCircle, Pencil, Plus, Search } from "lucide-react"
import {
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
import { PhoneInput } from "../components/panel/phone-input"
import { TEXTO_HABEAS, correoValido, telefonoValido } from "../features/clientes/logic"
import { TIPO_COLOR_PRESETS, contrastText } from "../lib/contrast-badge"
import { toast } from "../features/en-desarrollo"
import { useApp } from "../app/providers"
import { api, mensajeDe } from "../shared/api"

type Cliente = {
  id_cliente: number
  nombre: string
  apellido: string
  nombre_completo: string
  numero_telefono: string
  tiene_whatsapp: boolean
  direccion: string
  ciudad: string
  documento: string
  correo: string
  observaciones: string
  id_tipo_cliente: number
  tipo_nombre: string
  tipo_color?: string
  consentimiento_datos: boolean
  fecha_consentimiento: string | null
  estado: boolean
  version_fila: number
  whatsapp_url: string
  whatsapp_habilitado: boolean
  whatsapp_motivo: string
  tiene_facturas?: boolean
}

type TipoCliente = {
  id_tipo_cliente: number
  nombre: string
  descripcion: string
  estado: boolean
  es_tipo_predeterminado: boolean
  version_fila: number
  color?: string
}

function TipoClienteBadge({ nombre, color }: { nombre: string; color?: string }) {
  const bg = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#64748B"
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: bg, color: contrastText(bg) }}>
      {nombre}
    </span>
  )
}

type Vista = "clientes" | "tipos" | "detalle"

export function PanelClientesPage() {
  const { sesion } = useApp()
  const { accionesModulo } = useAccesos()
  const acciones = accionesModulo("clientes")
  const puedeCrear = puedeAccion(acciones, "Crear")
  const puedeEditar = puedeAccion(acciones, "Editar")
  const [vista, setVista] = useState<Vista>("clientes")
  const [q, setQ] = useState("")
  const debouncedQ = useDebounced(q, 300)
  const [estadoFiltro, setEstadoFiltro] = useState("todos")
  const [tipoFiltro, setTipoFiltro] = useState("")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [mensaje, setMensaje] = useState("")
  const [tipos, setTipos] = useState<TipoCliente[]>([])
  const [modal, setModal] = useState<"new" | number | null>(null)
  const [detalleId, setDetalleId] = useState<number | null>(null)
  const pageSize = 20

  const cargarTipos = useCallback(async () => {
    const r = await api("/api/v1/clientes/tipos/")
    if (!r.ok) return
    setTipos(((await r.json()) as { items: TipoCliente[] }).items)
  }, [])

  const cargar = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (debouncedQ.trim()) qs.set("q", debouncedQ.trim())
    if (estadoFiltro !== "todos") qs.set("estado", estadoFiltro)
    if (tipoFiltro) qs.set("id_tipo_cliente", tipoFiltro)
    const r = await api(`/api/v1/clientes/?${qs}`)
    const msg = await mensajeDe(r)
    if (!r.ok) {
      toast(msg || "No fue posible cargar los clientes. Intente nuevamente.")
      return
    }
    const body = (await r.json()) as { items: Cliente[]; total: number; mensaje?: string }
    setItems(body.items)
    setTotal(body.total)
    setMensaje(body.mensaje || "")
  }, [debouncedQ, estadoFiltro, page, tipoFiltro])

  useEffect(() => {
    const t = window.setTimeout(() => void cargarTipos(), 0)
    return () => window.clearTimeout(t)
  }, [cargarTipos])

  useEffect(() => {
    if (vista !== "clientes") return
    const t = window.setTimeout(() => void cargar(), 0)
    return () => window.clearTimeout(t)
  }, [cargar, vista])

  const mostrarMetricas = sesion?.rol === "Gerente" || sesion?.rol === "Administrador"

  return (
    <section className="mx-auto max-w-5xl">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Directorio de clientes</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Clientes</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">
        Datos personales tratados bajo Habeas Data (Ley 1581). Registra la autorización del titular.
      </p>

      <Row className="mt-5 flex flex-wrap gap-2 border-b border-plum/10 pb-3">
        <Tab active={vista === "clientes"} onClick={() => setVista("clientes")}>
          Clientes
        </Tab>
        <Tab active={vista === "tipos"} onClick={() => setVista("tipos")}>
          Tipos de cliente
        </Tab>
      </Row>

      {vista === "tipos" ? (
        <TiposClientePanel tipos={tipos} puedeCrear={puedeCrear} puedeEditar={puedeEditar} onRefresh={cargarTipos} />
      ) : vista === "detalle" && detalleId ? (
        <ClienteDetalle id={detalleId} mostrarMetricas={mostrarMetricas} onVolver={() => setVista("clientes")} />
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Buscar por nombre o teléfono</span>
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plum/50" aria-hidden />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
                placeholder="Buscar por nombre o teléfono…"
                className={`${input} !mt-0 pl-9`}
              />
            </label>
            <select
              value={tipoFiltro}
              onChange={(e) => {
                setTipoFiltro(e.target.value)
                setPage(1)
              }}
              className={`${input} !mt-0 w-full lg:w-44`}
              aria-label="Filtro por tipo de cliente"
            >
              <option value="">Todos los tipos</option>
              {tipos
                .filter((t) => t.estado)
                .map((t) => (
                  <option key={t.id_tipo_cliente} value={t.id_tipo_cliente}>
                    {t.nombre}
                  </option>
                ))}
            </select>
            <select
              value={estadoFiltro}
              onChange={(e) => {
                setEstadoFiltro(e.target.value)
                setPage(1)
              }}
              className={`${input} !mt-0 w-full lg:w-36`}
              aria-label="Filtro por estado"
            >
              <option value="todos">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            {puedeCrear && (
              <button type="button" className={`${btnPrimary} shrink-0`} onClick={() => setModal("new")}>
                <Plus size={16} /> Nuevo cliente
              </button>
            )}
          </div>

          {mensaje && <p className="mt-4 text-sm text-ink/60">{mensaje}</p>}

          {items.length === 0 ? (
            <Empty text={debouncedQ.trim() ? "No se encontraron clientes con los criterios indicados." : "No hay clientes registrados."} />
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-plum/10 text-xs uppercase tracking-wide text-ink/55">
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Habeas Data</th>
                    <th className="px-4 py-3 w-36" aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id_cliente} className="border-t border-plum/5">
                      <td className="px-4 py-3 font-semibold">{c.nombre_completo}</td>
                      <td className="px-4 py-3">{c.numero_telefono}</td>
                      <td className="px-4 py-3">
                        <TipoClienteBadge
                          nombre={c.tipo_nombre}
                          color={c.tipo_color ?? tipos.find((t) => t.id_tipo_cliente === c.id_tipo_cliente)?.color}
                        />
                      </td>
                      <td className="px-4 py-3">{c.estado ? "Activo" : "Inactivo"}</td>
                      <td className="px-4 py-3">{c.consentimiento_datos ? "Sí" : "No"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {c.tiene_whatsapp && (
                            <a
                              href={c.whatsapp_habilitado ? c.whatsapp_url : undefined}
                              target="_blank"
                              rel="noreferrer"
                              aria-disabled={!c.whatsapp_habilitado}
                              title={c.whatsapp_habilitado ? "Abrir WhatsApp" : c.whatsapp_motivo}
                              className={`rounded-lg p-2 ${c.whatsapp_habilitado ? "text-green-700 hover:bg-green-50" : "cursor-not-allowed text-ink/30"}`}
                              onClick={(e) => !c.whatsapp_habilitado && e.preventDefault()}
                            >
                              <MessageCircle size={16} />
                            </a>
                          )}
                          <button
                            type="button"
                            className="rounded-lg p-2 hover:bg-plum-soft"
                            aria-label={`Ver detalle de ${c.nombre_completo}`}
                            onClick={() => {
                              setDetalleId(c.id_cliente)
                              setVista("detalle")
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          {puedeEditar && (
                            <button
                              type="button"
                              className="rounded-lg p-2 hover:bg-plum-soft"
                              aria-label={`Editar ${c.nombre_completo}`}
                              onClick={() => setModal(c.id_cliente)}
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={page} total={total} totalPages={Math.max(1, Math.ceil(total / pageSize))} onPage={setPage} />
        </>
      )}

      <ClienteModal
        open={modal !== null}
        id={modal === "new" ? null : modal}
        tipos={tipos.filter((t) => t.estado)}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null)
          void cargar()
        }}
      />
    </section>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-bold transition ${active ? "bg-brand text-white shadow-[2px_2px_0_0_#4A154B]" : "bg-plum-soft text-plum hover:bg-plum/10"}`}
    >
      {children}
    </button>
  )
}

function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

function ClienteModal({
  open,
  id,
  tipos,
  onClose,
  onSaved,
}: {
  open: boolean
  id: number | null
  tipos: TipoCliente[]
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = id === null
  const pred = tipos.find((t) => t.es_tipo_predeterminado)?.id_tipo_cliente ?? tipos[0]?.id_tipo_cliente
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [telefono, setTelefono] = useState("")
  const [whatsapp, setWhatsapp] = useState(false)
  const [direccion, setDireccion] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [idTipo, setIdTipo] = useState<number | "">(pred ?? "")
  const [documento, setDocumento] = useState("")
  const [correo, setCorreo] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [consentimiento, setConsentimiento] = useState(false)
  const [estado, setEstado] = useState(true)
  const [version, setVersion] = useState(1)
  const [bloqueaDoc, setBloqueaDoc] = useState(false)
  const [error, setError] = useState("")
  const [dup, setDup] = useState<{ id_cliente: number; nombre_completo: string } | null>(null)
  const { run, pending } = useDo()

  useEffect(() => {
    if (!open) return
    if (isNew) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset modal al abrir
      setNombre("")
      setApellido("")
      setTelefono("")
      setWhatsapp(false)
      setDireccion("")
      setCiudad("")
      setIdTipo(pred ?? "")
      setDocumento("")
      setCorreo("")
      setObservaciones("")
      setConsentimiento(false)
      setEstado(true)
      setError("")
      setDup(null)
      return
    }
    void (async () => {
      const r = await api(`/api/v1/clientes/${id}/`)
      if (!r.ok) return
      const c = (await r.json()) as Cliente
      setNombre(c.nombre)
      setApellido(c.apellido)
      setTelefono(c.numero_telefono)
      setWhatsapp(c.tiene_whatsapp)
      setDireccion(c.direccion)
      setCiudad(c.ciudad)
      setIdTipo(c.id_tipo_cliente)
      setDocumento(c.documento)
      setCorreo(c.correo)
      setObservaciones(c.observaciones)
      setConsentimiento(c.consentimiento_datos)
      setEstado(c.estado)
      setVersion(c.version_fila)
      setBloqueaDoc(Boolean(c.tiene_facturas))
    })()
  }, [open, id, isNew, pred])

  const invalidTel = telefono.trim() && !telefonoValido(telefono)
  const invalidMail = correo.trim() && !correoValido(correo)

  const enviar = (confirmarDup = false) =>
    run(async () => {
      setError("")
      if (!nombre.trim() || !telefono.trim() || !idTipo) {
        setError("Todos los campos obligatorios deben ser diligenciados.")
        return
      }
      if (!telefonoValido(telefono)) {
        setError("El teléfono ingresado no tiene un formato válido.")
        return
      }
      if (!correoValido(correo)) {
        setError("El correo electrónico ingresado no tiene un formato válido.")
        return
      }
      const payload = {
        nombre,
        apellido,
        numero_telefono: telefono,
        tiene_whatsapp: whatsapp,
        direccion,
        ciudad,
        id_tipo_cliente: idTipo,
        documento,
        correo,
        observaciones,
        consentimiento_datos: consentimiento,
        estado,
        confirmar_duplicado: confirmarDup,
        ...(isNew ? {} : { version_fila: version }),
      }
      const r = await api(isNew ? "/api/v1/clientes/" : `/api/v1/clientes/${id}/`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(payload),
      })
      const body = await r.json().catch(() => ({}))
      const msg = (body as { mensaje?: string }).mensaje || (await mensajeDe(r))
      if (!r.ok) {
        if ((body as { codigo?: string }).codigo === "TELEFONO_DUPLICADO") {
          setDup((body as { coincidencia: { id_cliente: number; nombre_completo: string } }).coincidencia)
          setError(msg)
          return
        }
        setError(msg || (isNew ? "No fue posible crear el cliente. Intente nuevamente." : "No fue posible actualizar el cliente. Intente nuevamente."))
        return
      }
      toast(msg || (isNew ? "Cliente creado correctamente." : "Cliente actualizado correctamente."))
      onSaved()
    })

  return (
    <Modal open={open} title={isNew ? "Crear cliente" : "Editar cliente"} onClose={onClose} wide>
      {error && <FormAlert message={error} />}
      {dup && (
        <div className="mb-4 rounded-xl border-2 border-brand/30 bg-brand/5 p-3 text-sm">
          <p>Ya existe un cliente con este número de teléfono.</p>
          <p className="mt-1 font-semibold">{dup.nombre_completo}</p>
          <span className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={btnGhost} onClick={() => window.open(`/panel/admin/clientes`, "_self")}>
              Ver coincidencia
            </button>
            <button type="button" className={btnPrimary} onClick={() => void enviar(true)}>
              Crear de todas formas
            </button>
          </span>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldLabel label="Nombre" required>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del cliente" className={input} aria-invalid={!nombre.trim()} />
        </FieldLabel>
        <FieldLabel label="Apellido">
          <input value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Apellido (opcional)" className={input} />
        </FieldLabel>
        <PhoneInput
          className="sm:col-span-2"
          label="Teléfono"
          required
          value={telefono}
          onChange={setTelefono}
          invalid={invalidTel || !telefono.trim()}
          placeholder="300 123 4567"
        />
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} />
          Tiene WhatsApp
        </label>
        <FieldLabel label="Correo electrónico">
          <input
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="correo@empresa.com"
            className={invalidMail ? inputInvalid : input}
            aria-invalid={invalidMail || undefined}
          />
        </FieldLabel>
        <FieldLabel label="Documento">
          <input
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            placeholder="Documento o NIT"
            className={input}
            readOnly={bloqueaDoc}
          />
        </FieldLabel>
        <FieldLabel label="Dirección">
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección de entrega o facturación" className={input} />
        </FieldLabel>
        <FieldLabel label="Ciudad">
          <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ciudad" className={input} />
        </FieldLabel>
        <FieldLabel label="Tipo de cliente" required>
          <select
            value={idTipo}
            onChange={(e) => setIdTipo(Number(e.target.value))}
            className={input}
            aria-invalid={!idTipo || undefined}
          >
            {tipos.map((t) => (
              <option key={t.id_tipo_cliente} value={t.id_tipo_cliente}>
                {t.nombre}
              </option>
            ))}
          </select>
        </FieldLabel>
        {!isNew && (
          <FieldLabel label="Estado">
            <select value={estado ? "activo" : "inactivo"} onChange={(e) => setEstado(e.target.value === "activo")} className={input}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </FieldLabel>
        )}
      </div>
      <FieldLabel label="Observaciones">
        <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas internas sobre el cliente" className={`${input} min-h-24`} />
      </FieldLabel>
      <label className="mt-4 flex items-start gap-2 text-sm font-semibold">
        <input type="checkbox" checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)} className="mt-1" />
        Autoriza el tratamiento de sus datos (Habeas Data)
      </label>
      {consentimiento && <p className="mt-2 rounded-xl bg-plum-soft p-3 text-xs text-ink/80">{TEXTO_HABEAS}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className={btnGhost} onClick={onClose} disabled={pending}>
          Cancelar
        </button>
        <button type="button" className={btnPrimary} disabled={pending} onClick={() => void enviar()}>
          {pending ? <Loader2 className="animate-spin" size={16} /> : null}
          {isNew ? "Guardar cliente" : "Guardar cambios"}
        </button>
      </div>
    </Modal>
  )
}

function TiposClientePanel({
  tipos,
  puedeCrear,
  puedeEditar,
  onRefresh,
}: {
  tipos: TipoCliente[]
  puedeCrear: boolean
  puedeEditar: boolean
  onRefresh: () => void
}) {
  const [edit, setEdit] = useState<TipoCliente | "new" | null>(null)
  return (
    <section className="mt-8">
      <p className="text-sm text-ink/65">Segmentación comercial. El tipo «Común» es predeterminado y no se puede desactivar.</p>
      {puedeCrear && (
        <button type="button" className={`${btnPrimary} mt-4`} onClick={() => setEdit("new")}>
          <Plus size={16} /> Nuevo tipo
        </button>
      )}
      <Row className="mt-4 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-plum/10 text-xs uppercase text-ink/55">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Predeterminado</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {tipos.map((t) => (
              <tr key={t.id_tipo_cliente} className="border-t border-plum/5">
                <td className="px-4 py-3 font-semibold">{t.nombre}</td>
                <td className="px-4 py-3 text-ink/70">{t.descripcion || "—"}</td>
                <td className="px-4 py-3">{t.es_tipo_predeterminado ? "Sí" : "—"}</td>
                <td className="px-4 py-3">{t.estado ? "Activo" : "Inactivo"}</td>
                <td className="px-4 py-3 text-right">
                  {puedeEditar && !t.es_tipo_predeterminado && (
                    <button type="button" className="rounded-lg p-2 hover:bg-plum-soft" onClick={() => setEdit(t)}>
                      <Pencil size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Row>
      <TipoModal open={edit !== null} row={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); onRefresh() }} />
    </section>
  )
}

function TipoModal({
  open,
  row,
  onClose,
  onSaved,
}: {
  open: boolean
  row: TipoCliente | "new" | null
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = row === "new"
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [estado, setEstado] = useState(true)
  const [color, setColor] = useState("#64748B")
  const [version, setVersion] = useState(1)
  const [error, setError] = useState("")
  const { run, pending } = useDo()

  useEffect(() => {
    if (!open) return
    if (isNew) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset modal al abrir
      setNombre("")
      setDescripcion("")
      setEstado(true)
      setColor("#64748B")
      setError("")
      return
    }
    if (row) {
      setNombre(row.nombre)
      setDescripcion(row.descripcion)
      setEstado(row.estado)
      setColor(row.color && /^#[0-9A-Fa-f]{6}$/.test(row.color) ? row.color : "#64748B")
      setVersion(row.version_fila)
    }
  }, [open, row, isNew])

  const guardar = () =>
    run(async () => {
      if (!nombre.trim()) {
        setError("El nombre del tipo de cliente es obligatorio.")
        return
      }
      const r = await api(isNew ? "/api/v1/clientes/tipos/" : `/api/v1/clientes/tipos/${(row as TipoCliente).id_tipo_cliente}/`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify({ nombre, descripcion, estado, color, version_fila: version }),
      })
      const msg = await mensajeDe(r)
      if (!r.ok) {
        setError(msg)
        return
      }
      toast(msg)
      onSaved()
    })

  return (
    <Modal open={open} title={isNew ? "Nuevo tipo de cliente" : "Editar tipo de cliente"} onClose={onClose}>
      {error && <FormAlert message={error} />}
      <FieldLabel label="Nombre" required>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del tipo" className={input} />
      </FieldLabel>
      <FieldLabel label="Descripción">
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción opcional" className={`${input} min-h-20`} />
      </FieldLabel>
      <FieldLabel label="Color de identificación">
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="size-10 cursor-pointer rounded-lg border-2 border-plum/15" aria-label="Selector de color" />
          {TIPO_COLOR_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className="size-8 rounded-full border-2 border-plum/15"
              style={{ backgroundColor: p }}
              aria-label={`Color ${p}`}
              onClick={() => setColor(p)}
            />
          ))}
          <TipoClienteBadge nombre="Vista previa" color={color} />
        </div>
      </FieldLabel>
      {!isNew && (
        <FieldLabel label="Estado">
          <select value={estado ? "activo" : "inactivo"} onChange={(e) => setEstado(e.target.value === "activo")} className={input}>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </FieldLabel>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className={btnGhost} onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className={btnPrimary} disabled={pending} onClick={() => void guardar()}>
          {pending ? <Loader2 className="animate-spin" size={16} /> : null}
          Guardar
        </button>
      </div>
    </Modal>
  )
}

type DetalleHistorial = {
  cliente: Cliente
  items: { id_factura: number; numero: string; fecha: string; sede: string; total: number; estado: string }[]
  mensaje: string
  resumen: { total_comprado: number; num_compras: number; ultima_compra: string | null }
  metricas: {
    monto_total: number
    frecuencia_compras: number
    ticket_promedio: number
    dias_promedio_entre_compras: number
    productos_frecuentes: { nombre: string; unidades: number; monto: number }[]
  } | null
}

function ClienteDetalle({ id, mostrarMetricas, onVolver }: { id: number; mostrarMetricas: boolean; onVolver: () => void }) {
  const [data, setData] = useState<DetalleHistorial | null>(null)

  const loadDetalleMemo = useCallback(
    async (clienteId: number) => {
      const r = await api(`/api/v1/clientes/${clienteId}/historial/?metricas=${mostrarMetricas ? "1" : "0"}`)
      if (!r.ok) throw new Error()
      return (await r.json()) as DetalleHistorial
    },
    [mostrarMetricas],
  )

  useEffect(() => {
    void loadDetalleMemo(id)
      .then(setData)
      .catch(() => toast("No fue posible cargar el historial del cliente. Intente nuevamente."))
  }, [id, loadDetalleMemo])

  if (!data) return <p className="mt-8 text-sm text-ink/60">Cargando detalle…</p>
  const c = data.cliente

  return (
    <section className="mt-8">
      <button type="button" className="text-sm font-semibold text-plum" onClick={onVolver}>
        ← Volver al directorio
      </button>
      <h2 className="mt-4 font-display text-3xl font-extrabold text-plum">{c.nombre_completo}</h2>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink/50">Teléfono</dt>
          <dd className="font-semibold">{c.numero_telefono}</dd>
        </div>
        <div>
          <dt className="text-ink/50">Correo</dt>
          <dd>{c.correo || "—"}</dd>
        </div>
        <div>
          <dt className="text-ink/50">Tipo</dt>
          <dd>{c.tipo_nombre}</dd>
        </div>
        <div>
          <dt className="text-ink/50">Habeas Data</dt>
          <dd>{c.consentimiento_datos ? `Sí · ${c.fecha_consentimiento ?? ""}` : "No"}</dd>
        </div>
      </dl>

      <h3 className="mt-8 font-display text-xl font-bold text-plum">Historial de compras</h3>
      <p className="text-sm text-ink/60">{data.mensaje}</p>
      {data.items.length === 0 ? (
        <Empty text="Este cliente aún no registra compras." />
      ) : (
        <>
          <p className="mt-2 text-sm">
            Total comprado: ${data.resumen.total_comprado.toLocaleString("es-CO")} · {data.resumen.num_compras} compras
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-plum/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-ink/55">
                  <th className="px-3 py-2">Factura</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Sede</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((f) => (
                  <tr key={f.id_factura} className="border-t border-plum/5">
                    <td className="px-3 py-2">{f.numero}</td>
                    <td className="px-3 py-2">{new Date(f.fecha).toLocaleString("es-CO")}</td>
                    <td className="px-3 py-2">{f.sede}</td>
                    <td className="px-3 py-2">${f.total.toLocaleString("es-CO")}</td>
                    <td className="px-3 py-2">{f.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mostrarMetricas && data.metricas && (
        <>
          <h3 className="mt-10 font-display text-xl font-bold text-plum">Métricas</h3>
          <Row className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Monto total", data.metricas.monto_total],
              ["Frecuencia", data.metricas.frecuencia_compras],
              ["Ticket promedio", data.metricas.ticket_promedio],
              ["Días entre compras", data.metricas.dias_promedio_entre_compras],
            ].map(([label, val]) => (
              <p key={String(label)} className="rounded-2xl border-2 border-plum/10 bg-white p-4 shadow-sm">
                <span className="text-xs uppercase text-ink/50">{label}</span>
                <span className="mt-1 block font-display text-2xl font-extrabold text-plum">{typeof val === "number" ? val.toLocaleString("es-CO") : val}</span>
              </p>
            ))}
          </Row>
          {data.metricas.productos_frecuentes.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-plum">Productos más frecuentes</p>
              <ul className="mt-2 space-y-1 text-sm">
                {data.metricas.productos_frecuentes.map((p) => (
                  <li key={p.nombre}>
                    {p.nombre} — {p.unidades} und · ${p.monto.toLocaleString("es-CO")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}
