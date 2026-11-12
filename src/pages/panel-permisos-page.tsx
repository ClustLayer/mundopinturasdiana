import { useCallback, useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import {
  Confirm,
  Empty,
  Modal,
  Panel,
  btnGhost,
  btnPrimary,
  input,
  useDebounced,
  useDo,
} from "../components/panel/kit"
import { useAccesos } from "../features/accesos/accesos-provider"
import { MatrizCarriles, aplanarDetalle, type ModuloMatriz } from "../features/roles/matriz-carriles"
import { MSG_ROLES } from "../features/roles/messages"
import { toast } from "../features/en-desarrollo"
import { api, mensajeDe } from "../shared/api"

type Rol = { id_rol: number; nombre: string; descripcion: string; estado: boolean; es_rol_base: boolean; version_fila: number }
type Permiso = { id_permiso: number; nombre: string; modulo: string; accion: string; descripcion: string; estado: boolean; version_fila: number }

const TABS = [
  { id: "roles", label: "Roles" },
  { id: "permisos", label: "Catálogo de permisos" },
  { id: "matriz", label: "Matriz de permisos" },
] as const

export function PanelPermisosPage() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get("tab") as (typeof TABS)[number]["id"]) || "roles"
  const setTab = (id: string) => {
    const next = new URLSearchParams(params)
    next.set("tab", id)
    setParams(next, { replace: true })
  }

  return (
    <section className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Roles y permisos</p>
        <h1 className="font-display text-4xl font-extrabold text-plum">Permisos</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink/60">
          Qué acciones puede ejecutar cada rol y cada usuario. Los ajustes por usuario prevalecen sobre los del rol.
        </p>
      </header>
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Secciones">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === t.id ? "bg-plum text-white shadow-[3px_3px_0_0_var(--color-brand)]" : "border-2 border-plum/15 bg-white text-plum hover:bg-plum-soft"}`}
            aria-current={tab === t.id ? "page" : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {tab === "roles" && <TabRoles />}
      {tab === "permisos" && <TabPermisos />}
      {tab === "matriz" && <TabMatriz />}
    </section>
  )
}

function TabRoles() {
  const [items, setItems] = useState<Rol[]>([])
  const [q, setQ] = useState("")
  const debouncedQ = useDebounced(q, 300)
  const [modal, setModal] = useState<"new" | number | null>(null)
  const [confirmDel, setConfirmDel] = useState<Rol | null>(null)
  const [error, setError] = useState("")
  const { run, pending } = useDo()

  const cargar = useCallback(async () => {
    setError("")
    const qs = new URLSearchParams()
    if (debouncedQ.trim()) qs.set("q", debouncedQ.trim())
    qs.set("page", "1")
    try {
      const r = await api(`/api/v1/roles-permisos/roles?${qs}`)
      if (!r.ok) {
        setError(MSG_ROLES.listadoError)
        return
      }
      const body = (await r.json()) as { items: Rol[] }
      setItems(body.items)
    } catch {
      setError(MSG_ROLES.listadoError)
    }
  }, [debouncedQ])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])

  return (
    <>
      <div className="mb-4 flex flex-nowrap items-center gap-3 overflow-x-auto">
        <label className="relative min-w-[12rem] flex-1">
          <span className="sr-only">Buscar roles</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar roles…" className={`${input} !mt-0 pl-10`} />
        </label>
        <button type="button" className={`${btnPrimary} shrink-0`} onClick={() => setModal("new")}>
          <Plus size={16} aria-hidden /> Nuevo rol
        </button>
      </div>
      {error && (
        <div className="mb-4 rounded-xl border-2 border-brand p-4 text-sm" role="alert">
          {error}
        </div>
      )}
      {!error && items.length === 0 ? (
        <Empty text="No hay roles registrados." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-plum-soft text-xs uppercase tracking-wider text-plum">
              <tr>
                {["Nombre", "Descripción", "Estado", "Rol base", "Acciones"].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-plum/10">
              {items.map((r) => (
                <tr key={r.id_rol} className="hover:bg-paper">
                  <td className="px-4 py-3 font-semibold">{r.nombre}</td>
                  <td className="px-4 py-3 text-ink/70">{r.descripcion || "—"}</td>
                  <td className="px-4 py-3">{r.estado ? <span className="font-bold text-cyan-dark">Activo</span> : <span className="text-ink/40">Inactivo</span>}</td>
                  <td className="px-4 py-3">{r.es_rol_base ? "Sí" : "No"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {!r.es_rol_base && (
                      <>
                        <button
                          type="button"
                          aria-label={`Editar rol ${r.nombre}`}
                          className="rounded-lg p-2 text-plum hover:bg-plum-soft"
                          onClick={() => setModal(r.id_rol)}
                          disabled={pending}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar rol ${r.nombre}`}
                          className="rounded-lg p-2 text-brand hover:bg-brand/10"
                          onClick={() => setConfirmDel(r)}
                          disabled={pending}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    {r.es_rol_base && <span className="text-xs text-ink/45">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <RolModal open={modal !== null} id={modal === "new" ? null : modal} onClose={() => setModal(null)} onSaved={() => void cargar()} />
      <Confirm
        open={!!confirmDel}
        title="Eliminar rol"
        text={MSG_ROLES.eliminarConfirm}
        yes="Eliminar"
        danger
        busy={pending}
        onNo={() => setConfirmDel(null)}
        onYes={() =>
          run(async () => {
            if (!confirmDel) return
            const r = await api(`/api/v1/roles-permisos/roles/${confirmDel.id_rol}`, { method: "DELETE" })
            const msg = await mensajeDe(r)
            if (!r.ok) {
              toast(msg || MSG_ROLES.listadoError)
              return
            }
            toast(msg || MSG_ROLES.eliminarOk)
            setConfirmDel(null)
            await cargar()
          })
        }
      />
    </>
  )
}

function RolModal({ open, id, onClose, onSaved }: { open: boolean; id: number | null; onClose: () => void; onSaved: () => void }) {
  const isNew = id === null
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [estado, setEstado] = useState(true)
  const [esBase, setEsBase] = useState(false)
  const [version, setVersion] = useState(1)
  const [confirmOff, setConfirmOff] = useState(false)
  const { run, pending } = useDo()

  useEffect(() => {
    if (!open) return
    if (isNew) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset al abrir modal
      setNombre("")
      setDescripcion("")
      setEstado(true)
      setEsBase(false)
      setVersion(1)
      return
    }
    void (async () => {
      const r = await api(`/api/v1/roles-permisos/roles/${id}`)
      if (!r.ok) return
      const d = (await r.json()) as Rol
      setNombre(d.nombre)
      setDescripcion(d.descripcion)
      setEstado(d.estado)
      setEsBase(d.es_rol_base)
      setVersion(d.version_fila)
    })()
  }, [open, id, isNew])

  const guardar = () =>
    run(async () => {
      if (isNew) {
        const r = await api("/api/v1/roles-permisos/roles", { method: "POST", body: JSON.stringify({ nombre, descripcion }) })
        const msg = await mensajeDe(r)
        if (!r.ok) {
          toast(msg || "No fue posible crear el rol. Intente nuevamente.")
          return
        }
        toast(msg || "Rol creado correctamente.")
      } else {
        const r = await api(`/api/v1/roles-permisos/roles/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ nombre: esBase ? undefined : nombre, descripcion, estado, version_fila: version }),
        })
        const msg = await mensajeDe(r)
        if (!r.ok) {
          toast(msg || "No fue posible actualizar el rol. Intente nuevamente.")
          return
        }
        toast(msg || "Rol actualizado correctamente.")
      }
      onSaved()
      onClose()
    })

  return (
    <>
      <Modal open={open} onClose={onClose} title={isNew ? "Crear rol" : "Editar rol"}>
        <label className="block text-sm font-semibold">
          Nombre<span className="text-brand"> *</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={30} disabled={!isNew && esBase} className={input} required placeholder="Ej. Vendedor" />
        </label>
        <label className="block text-sm font-semibold">
          Descripción
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={input} rows={3} placeholder="Uso previsto del rol en el sistema" />
        </label>
        {!isNew && (
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={estado} disabled={esBase} onChange={(e) => (e.target.checked ? setEstado(true) : setConfirmOff(true))} />
            Activo
          </label>
        )}
        {!isNew && esBase && <p className="mt-2 text-xs text-ink/60">{MSG_ROLES.rolBase}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className={btnGhost} onClick={onClose}>Cancelar</button>
          <button type="button" className={btnPrimary} disabled={pending} onClick={() => void guardar()}>
            {pending ? <Loader2 className="animate-spin" size={16} /> : isNew ? "Crear rol" : "Guardar cambios"}
          </button>
        </div>
      </Modal>
      <Confirm
        open={confirmOff}
        title="Inactivar rol"
        text={MSG_ROLES.confirmInactivar}
        onNo={() => setConfirmOff(false)}
        onYes={() => {
          setEstado(false)
          setConfirmOff(false)
        }}
      />
    </>
  )
}

function TabPermisos() {
  const filtroSelect = `${input} !mt-0 w-auto max-w-[12rem] shrink-0`
  const [items, setItems] = useState<Permiso[]>([])
  const [modulo, setModulo] = useState("")
  const [accion, setAccion] = useState("")
  const [catalogos, setCatalogos] = useState<{ modulos: { clave: string; etiqueta: string }[]; acciones: string[] }>({ modulos: [], acciones: [] })
  const [modal, setModal] = useState<"new" | number | null>(null)
  const { pending } = useDo()

  const cargar = useCallback(async () => {
    const qs = new URLSearchParams({ page: "1" })
    if (modulo) qs.set("modulo", modulo)
    if (accion) qs.set("accion", accion)
    const r = await api(`/api/v1/roles-permisos/permisos?${qs}`)
    if (r.ok) setItems(((await r.json()) as { items: Permiso[] }).items)
  }, [modulo, accion])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])
  useEffect(() => {
    void (async () => {
      const r = await api("/api/v1/roles-permisos/permisos/catalogos")
      if (r.ok) setCatalogos(await r.json())
    })()
  }, [])

  return (
    <>
      <div className="mb-4 flex flex-nowrap items-center gap-3 overflow-x-auto">
        <select aria-label="Filtro módulo" value={modulo} onChange={(e) => setModulo(e.target.value)} className={filtroSelect}>
          <option value="">Todos los módulos</option>
          {catalogos.modulos.map((m) => (
            <option key={m.clave} value={m.clave}>{m.etiqueta}</option>
          ))}
        </select>
        <select aria-label="Filtro acción" value={accion} onChange={(e) => setAccion(e.target.value)} className={filtroSelect}>
          <option value="">Todas las acciones</option>
          {catalogos.acciones.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button type="button" className={`${btnPrimary} shrink-0`} onClick={() => setModal("new")}>
          <Plus size={16} /> Nuevo permiso
        </button>
      </div>
      {items.length === 0 ? (
        <Empty text="No hay permisos en el catálogo." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-plum-soft text-xs uppercase tracking-wider text-plum">
              <tr>
                {["Nombre", "Módulo", "Acción", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-plum/10">
              {items.map((p) => (
                <tr key={p.id_permiso}>
                  <td className="px-4 py-3 font-semibold">{p.nombre}</td>
                  <td className="px-4 py-3">{p.modulo}</td>
                  <td className="px-4 py-3">{p.accion}</td>
                  <td className="px-4 py-3">{p.estado ? "Activo" : "Inactivo"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      aria-label={`Editar permiso ${p.nombre}`}
                      className="rounded-lg p-2 text-plum hover:bg-plum-soft"
                      disabled={pending}
                      onClick={() => setModal(p.id_permiso)}
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PermisoModal open={modal !== null} id={modal === "new" ? null : modal} catalogos={catalogos} onClose={() => setModal(null)} onSaved={() => void cargar()} />
    </>
  )
}

function PermisoModal({
  open,
  id,
  catalogos,
  onClose,
  onSaved,
}: {
  open: boolean
  id: number | null
  catalogos: { modulos: { clave: string; etiqueta: string }[]; acciones: string[] }
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = id === null
  const [nombre, setNombre] = useState("")
  const [modulo, setModulo] = useState("")
  const [accion, setAccion] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [estado, setEstado] = useState(true)
  const [version, setVersion] = useState(1)
  const { run, pending } = useDo()

  useEffect(() => {
    if (!open || isNew) return
    void (async () => {
      const r = await api(`/api/v1/roles-permisos/permisos?page=1&page_size=500`)
      if (!r.ok) return
      const items = ((await r.json()) as { items: Permiso[] }).items
      const p = items.find((x) => x.id_permiso === id)
      if (!p) return
      setNombre(p.nombre)
      setModulo(p.modulo)
      setAccion(p.accion)
      setDescripcion(p.descripcion)
      setEstado(p.estado)
      setVersion(p.version_fila)
    })()
  }, [open, id, isNew])

  const guardar = () =>
    run(async () => {
      const payload = isNew
        ? { nombre, modulo, accion, descripcion }
        : { nombre, modulo, accion, descripcion, estado, version_fila: version }
      const r = await api(
        isNew ? "/api/v1/roles-permisos/permisos" : `/api/v1/roles-permisos/permisos/${id}`,
        { method: isNew ? "POST" : "PATCH", body: JSON.stringify(payload) },
      )
      const msg = await mensajeDe(r)
      if (!r.ok) {
        toast(msg || (isNew ? "No fue posible crear el permiso. Intente nuevamente." : "No fue posible actualizar el permiso. Intente nuevamente."))
        return
      }
      toast(msg)
      onSaved()
      onClose()
    })

  return (
    <Modal open={open} onClose={onClose} title={isNew ? "Crear permiso" : "Editar permiso"} wide>
      <label className="block text-sm font-semibold">Nombre<input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} className={input} /></label>
      <label className="block text-sm font-semibold">
        Módulo
        <select value={modulo} onChange={(e) => setModulo(e.target.value)} className={input}>
          <option value="">—</option>
          {catalogos.modulos.map((m) => (
            <option key={m.clave} value={m.clave}>{m.etiqueta}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Acción
        <select value={accion} onChange={(e) => setAccion(e.target.value)} className={input}>
          <option value="">—</option>
          {catalogos.acciones.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold">Descripción<textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={input} rows={2} /></label>
      {!isNew && (
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={estado} onChange={(e) => setEstado(e.target.checked)} /> Activo
        </label>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className={btnGhost} onClick={onClose}>Cancelar</button>
        <button type="button" className={btnPrimary} disabled={pending} onClick={() => void guardar()}>
          {isNew ? "Crear permiso" : "Guardar cambios"}
        </button>
      </div>
    </Modal>
  )
}

function TabMatriz() {
  const { refrescar } = useAccesos()
  const [params, setParams] = useSearchParams()
  const sub = params.get("matriz") === "usuario" ? "usuario" : "rol"
  const [roles, setRoles] = useState<{ id_rol: number; nombre: string }[]>([])
  const [usuarios, setUsuarios] = useState<{ id_usuario: number; label: string }[]>([])
  const [destino, setDestino] = useState("")
  const [modulos, setModulos] = useState<ModuloMatriz[]>([])
  const { run, pending } = useDo()

  useEffect(() => {
    void (async () => {
      const [r, u] = await Promise.all([
        api("/api/v1/roles-permisos/roles/catalogo/activos"),
        api("/api/v1/roles-permisos/usuarios-activos"),
      ])
      if (r.ok) setRoles(((await r.json()) as { items: { id_rol: number; nombre: string }[] }).items)
      if (u.ok) setUsuarios(((await u.json()) as { items: { id_usuario: number; label: string }[] }).items)
    })()
  }, [])

  const cargarMatriz = useCallback(async () => {
    if (!destino) {
      setModulos([])
      return
    }
    const qs = new URLSearchParams({ tipo: sub, id_destino: destino })
    const r = await api(`/api/v1/roles-permisos/matriz?${qs}`)
    if (r.ok) setModulos(((await r.json()) as { filas: ModuloMatriz[] }).filas)
  }, [destino, sub])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargarMatriz()
  }, [cargarMatriz])

  const guardar = () =>
    run(async () => {
      if (!destino) {
        toast(MSG_ROLES.matrizDestino)
        return
      }
      const cambios = aplanarDetalle(modulos)
        .filter((f) => f.permitido !== null)
        .map((f) => ({ id_permiso: f.id_permiso, permitido: !!f.permitido }))
      const r = await api("/api/v1/roles-permisos/matriz", {
        method: "PUT",
        body: JSON.stringify({ tipo: sub, id_destino: Number(destino), cambios }),
      })
      const msg = await mensajeDe(r)
      if (!r.ok) {
        toast(msg || "No fue posible guardar los permisos. Intente nuevamente.")
        return
      }
      toast(msg)
      refrescar()
      void cargarMatriz()
    })

  return (
    <Panel title="Asignación">
      <div className="mb-4 flex flex-wrap gap-2">
        {(["rol", "usuario"] as const).map((m) => (
          <button
            key={m}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm font-bold ${sub === m ? "bg-brand/15 text-plum" : "text-ink/60"}`}
            onClick={() => {
              const next = new URLSearchParams(params)
              next.set("matriz", m)
              setParams(next, { replace: true })
              setDestino("")
            }}
          >
            {m === "rol" ? "A nivel de Rol" : "A nivel de Usuario"}
          </button>
        ))}
      </div>
      <label className="mb-4 block max-w-md text-sm font-semibold">
        {sub === "rol" ? "Rol" : "Usuario"}
        <select
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          className={input}
        >
          <option value="">— Seleccione —</option>
          {sub === "rol"
            ? roles.map((r) => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)
            : usuarios.map((u) => <option key={u.id_usuario} value={u.id_usuario}>{u.label}</option>)}
        </select>
      </label>
      {!destino ? (
        <Empty text={MSG_ROLES.matrizDestino} />
      ) : (
        <MatrizCarriles modulos={modulos} onChange={setModulos} />
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className={btnGhost} onClick={() => setDestino("")}>Cancelar</button>
        <button type="button" className={btnPrimary} disabled={pending} onClick={() => void guardar()}>{pending ? <Loader2 className="animate-spin" size={16} /> : "Guardar permisos"}</button>
      </div>
    </Panel>
  )
}
