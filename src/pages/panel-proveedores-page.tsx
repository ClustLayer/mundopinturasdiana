import { useCallback, useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Power, Search } from "lucide-react"
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
import { PhoneInput } from "../components/panel/phone-input"
import { telefonoValido } from "../features/clientes/logic"
import { correoValido, TIPOS_DOCUMENTO } from "../features/proveedores/logic"
import { toast } from "../features/en-desarrollo"
import { api, mensajeDe } from "../shared/api"

type Proveedor = {
  id_proveedor: number
  nombre: string
  tipo_documento: string
  numero_documento: string
  contacto_nombre: string
  contacto_cargo: string
  telefono: string
  correo: string
  direccion: string
  ciudad: string
  descripcion: string
  productos_suministra: string
  estado: boolean
  version_fila: number
}

export function PanelProveedoresPage() {
  const { accionesModulo } = useAccesos()
  const acciones = accionesModulo("proveedores")
  const puedeCrear = puedeAccion(acciones, "Crear")
  const puedeEditar = puedeAccion(acciones, "Editar")
  const [q, setQ] = useState("")
  const debouncedQ = useDebounced(q, 300)
  const [estadoFiltro, setEstadoFiltro] = useState("todos")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Proveedor[]>([])
  const [total, setTotal] = useState(0)
  const [mensaje, setMensaje] = useState("")
  const [modal, setModal] = useState<"new" | number | null>(null)
  const [confirmar, setConfirmar] = useState<Proveedor | null>(null)
  const [cambiando, setCambiando] = useState(false)
  const pageSize = 20

  const cargar = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (debouncedQ.trim()) qs.set("q", debouncedQ.trim())
    if (estadoFiltro !== "todos") qs.set("estado", estadoFiltro)
    const r = await api(`/api/v1/proveedores/?${qs}`)
    const msg = await mensajeDe(r)
    if (!r.ok) {
      toast(msg || "No fue posible cargar los proveedores. Intente nuevamente.")
      return
    }
    const body = (await r.json()) as { items: Proveedor[]; total: number; mensaje?: string }
    setItems(body.items)
    setTotal(body.total)
    setMensaje(body.mensaje || "")
  }, [debouncedQ, estadoFiltro, page])

  useEffect(() => {
    const t = window.setTimeout(() => void cargar(), 0)
    return () => window.clearTimeout(t)
  }, [cargar])

  const aplicarEstado = async () => {
    if (!confirmar || cambiando) return
    setCambiando(true)
    try {
      const r = await api(`/api/v1/proveedores/${confirmar.id_proveedor}/`, {
        method: "PATCH",
        body: JSON.stringify({
          nombre: confirmar.nombre,
          tipo_documento: confirmar.tipo_documento,
          numero_documento: confirmar.numero_documento,
          contacto_nombre: confirmar.contacto_nombre,
          contacto_cargo: confirmar.contacto_cargo,
          telefono: confirmar.telefono,
          correo: confirmar.correo,
          direccion: confirmar.direccion,
          ciudad: confirmar.ciudad,
          descripcion: confirmar.descripcion,
          productos_suministra: confirmar.productos_suministra,
          estado: !confirmar.estado,
          version_fila: confirmar.version_fila,
        }),
      })
      const msg = await mensajeDe(r)
      if (!r.ok) {
        toast(msg || "No fue posible actualizar el proveedor. Intente nuevamente.")
        return
      }
      toast(msg || (confirmar.estado ? "Proveedor desactivado." : "Proveedor activado."))
      setConfirmar(null)
      await cargar()
    } finally {
      setCambiando(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Directorio de proveedores</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Proveedores</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">Quién nos surte y qué productos nos provee. Se usa en entradas de inventario.</p>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar proveedor</span>
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plum/50" aria-hidden />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar por empresa, contacto o documento…"
            className={`${input} !mt-0 pl-9`}
          />
        </label>
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
            <Plus size={16} /> Nuevo proveedor
          </button>
        )}
      </div>

      {mensaje && <p className="mt-4 text-sm text-ink/60">{mensaje}</p>}

      {items.length === 0 ? (
        <Empty text={debouncedQ.trim() ? "No se encontraron proveedores con los criterios indicados." : "No hay proveedores registrados."} />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-plum/10 text-xs uppercase tracking-wide text-ink/55">
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 w-28" aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id_proveedor} className="border-t border-plum/5">
                  <td className="px-4 py-3 font-semibold">{p.nombre}</td>
                  <td className="px-4 py-3">{p.contacto_nombre || "—"}</td>
                  <td className="px-4 py-3">{p.telefono || "—"}</td>
                  <td className="px-4 py-3">{p.correo || "—"}</td>
                  <td className="px-4 py-3">{p.estado ? "Activo" : "Inactivo"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {puedeEditar && (
                        <>
                          <button
                            type="button"
                            className="rounded-lg p-2 hover:bg-plum-soft"
                            aria-label={`Editar ${p.nombre}`}
                            onClick={() => setModal(p.id_proveedor)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 text-brand hover:bg-brand/10"
                            aria-label={p.estado ? `Desactivar ${p.nombre}` : `Activar ${p.nombre}`}
                            onClick={() => setConfirmar(p)}
                          >
                            <Power size={16} />
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
      <Pager page={page} total={total} totalPages={Math.max(1, Math.ceil(total / pageSize))} onPage={setPage} />

      <ProveedorModal
        open={modal !== null}
        id={modal === "new" ? null : modal}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null)
          void cargar()
        }}
      />

      <Confirm
        open={confirmar !== null}
        title={confirmar ? `${confirmar.estado ? "Desactivar" : "Activar"} ${confirmar.nombre}` : "Proveedor"}
        text={
          confirmar?.estado
            ? "¿Está seguro de que desea desactivar este proveedor?"
            : "¿Está seguro de que desea activar este proveedor?"
        }
        danger={confirmar?.estado}
        busy={cambiando}
        yes={confirmar?.estado ? "Desactivar" : "Activar"}
        onYes={() => void aplicarEstado()}
        onNo={() => {
          if (!cambiando) setConfirmar(null)
        }}
      />
    </section>
  )
}

function ProveedorModal({
  open,
  id,
  onClose,
  onSaved,
}: {
  open: boolean
  id: number | null
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = id === null
  const [nombre, setNombre] = useState("")
  const [tipoDocumento, setTipoDocumento] = useState("NIT")
  const [numeroDocumento, setNumeroDocumento] = useState("")
  const [contactoNombre, setContactoNombre] = useState("")
  const [contactoCargo, setContactoCargo] = useState("")
  const [telefono, setTelefono] = useState("")
  const [correo, setCorreo] = useState("")
  const [direccion, setDireccion] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [productos, setProductos] = useState("")
  const [estado, setEstado] = useState(true)
  const [version, setVersion] = useState(1)
  const [error, setError] = useState("")
  const [confirmOff, setConfirmOff] = useState(false)
  const { run, pending } = useDo()

  useEffect(() => {
    if (!open) return
    if (isNew) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset modal al abrir
      setNombre("")
      setTipoDocumento("NIT")
      setNumeroDocumento("")
      setContactoNombre("")
      setContactoCargo("")
      setTelefono("")
      setCorreo("")
      setDireccion("")
      setCiudad("")
      setDescripcion("")
      setProductos("")
      setEstado(true)
      setError("")
      setConfirmOff(false)
      return
    }
    void (async () => {
      const r = await api(`/api/v1/proveedores/${id}/`)
      if (!r.ok) return
      const p = (await r.json()) as Proveedor
      setNombre(p.nombre)
      setTipoDocumento(p.tipo_documento || "NIT")
      setNumeroDocumento(p.numero_documento)
      setContactoNombre(p.contacto_nombre)
      setContactoCargo(p.contacto_cargo)
      setTelefono(p.telefono)
      setCorreo(p.correo)
      setDireccion(p.direccion)
      setCiudad(p.ciudad)
      setDescripcion(p.descripcion)
      setProductos(p.productos_suministra)
      setEstado(p.estado)
      setVersion(p.version_fila)
    })()
  }, [open, id, isNew])

  const invalidTel = telefono.trim() && !telefonoValido(telefono)
  const invalidMail = correo.trim() && !correoValido(correo)

  const enviar = () =>
    run(async () => {
      setError("")
      if (!nombre.trim()) {
        setError("Todos los campos obligatorios deben ser diligenciados.")
        return
      }
      if (telefono.trim() && !telefonoValido(telefono)) {
        setError("El teléfono ingresado no tiene un formato válido.")
        return
      }
      if (!correoValido(correo)) {
        setError("El correo electrónico ingresado no tiene un formato válido.")
        return
      }
      const payload = {
        nombre,
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento,
        contacto_nombre: contactoNombre,
        contacto_cargo: contactoCargo,
        telefono,
        correo,
        direccion,
        ciudad,
        descripcion,
        productos_suministra: productos,
        estado,
        ...(isNew ? {} : { version_fila: version }),
      }
      const r = await api(isNew ? "/api/v1/proveedores/" : `/api/v1/proveedores/${id}/`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(payload),
      })
      const body = await r.json().catch(() => ({}))
      const msg = (body as { mensaje?: string }).mensaje || (await mensajeDe(r))
      if (!r.ok) {
        setError(msg || (isNew ? "No fue posible crear el proveedor. Intente nuevamente." : "No fue posible actualizar el proveedor. Intente nuevamente."))
        return
      }
      toast(msg || (isNew ? "Proveedor creado correctamente." : "Proveedor actualizado correctamente."))
      onSaved()
    })

  const onEstadoChange = (activo: boolean) => {
    if (!activo && estado) {
      setConfirmOff(true)
      return
    }
    setEstado(activo)
  }

  return (
    <>
      <Modal open={open} title={isNew ? "Crear proveedor" : "Editar proveedor"} onClose={onClose}>
        {error && <FormAlert message={error} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldLabel label="Nombre / empresa" required className="sm:col-span-2">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Razón social o nombre comercial" className={input} aria-invalid={!nombre.trim()} />
          </FieldLabel>
          <FieldLabel label="Tipo de documento">
            <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} className={input}>
              {TIPOS_DOCUMENTO.map((t) => (
                <option key={t.v} value={t.v}>{t.l}</option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Número de documento">
            <input value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} placeholder="NIT, cédula o pasaporte" className={input} />
          </FieldLabel>
          <FieldLabel label="Persona de contacto">
            <input value={contactoNombre} onChange={(e) => setContactoNombre(e.target.value)} placeholder="Nombre del contacto" className={input} />
          </FieldLabel>
          <FieldLabel label="Cargo del contacto">
            <input value={contactoCargo} onChange={(e) => setContactoCargo(e.target.value)} placeholder="Ej. Gerente comercial" className={input} />
          </FieldLabel>
          <PhoneInput label="Teléfono" value={telefono} onChange={setTelefono} invalid={Boolean(invalidTel)} placeholder="300 123 4567" />
          <FieldLabel label="Correo">
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="contacto@proveedor.com"
              className={invalidMail ? inputInvalid : input}
              aria-invalid={!!invalidMail}
            />
          </FieldLabel>
          <FieldLabel label="Dirección">
            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección comercial" className={input} />
          </FieldLabel>
          <FieldLabel label="Ciudad">
            <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ciudad" className={input} />
          </FieldLabel>
          <FieldLabel label="Descripción" className="sm:col-span-2">
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} placeholder="Notas internas sobre el proveedor" className={input} />
          </FieldLabel>
          <FieldLabel label="Qué nos suministra" className="sm:col-span-2">
            <textarea value={productos} onChange={(e) => setProductos(e.target.value)} rows={3} placeholder="Pinturas base, solventes, empaques…" className={input} />
          </FieldLabel>
          {!isNew && (
            <FieldLabel label="Estado">
              <select value={estado ? "activo" : "inactivo"} onChange={(e) => onEstadoChange(e.target.value === "activo")} className={input}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </FieldLabel>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className={btnGhost} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" disabled={pending} className={btnPrimary} onClick={() => void enviar()}>
            {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : isNew ? "Crear proveedor" : "Guardar cambios"}
          </button>
        </div>
      </Modal>
      <Confirm
        open={confirmOff}
        title="Desactivar proveedor"
        text="¿Está seguro de que desea desactivar este proveedor?"
        danger
        yes="Desactivar"
        onYes={() => {
          setEstado(false)
          setConfirmOff(false)
        }}
        onNo={() => setConfirmOff(false)}
      />
    </>
  )
}
