import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { useAccesos } from "../features/accesos/accesos-provider"
import { puedeAccion } from "../features/accesos/logic"
import { toast } from "../features/en-desarrollo"
import { MSG_TRANSVERSAL } from "../features/transversal/messages"
import { api } from "../shared/api"
import { Empty, Modal, Pager, btnGhost, btnPrimary, input, useDebounced } from "../components/panel/kit"
import { AccionBadge } from "../features/auditoria/accion-badge"

type UsuarioAnidado = { id_usuario: number | null; nombre: string; email: string | null }

type FilaAuditoria = {
  id_auditoria: number
  fecha_hora: string | null
  usuario: UsuarioAnidado
  accion: string
  entidad: string
  id_entidad: number
  ip_origen: string
  resumen: string
  motivo: string
  datos_anteriores: Record<string, unknown> | null
  datos_nuevos: Record<string, unknown> | null
}

type UsuarioOpt = { id_usuario: number; etiqueta: string; email: string }

function formatDt(iso: string | null): string {
  if (!iso) return "—"
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(d)
  } catch {
    return iso
  }
}

function keysCambiados(antes: Record<string, unknown> | null, despues: Record<string, unknown> | null): Set<string> {
  const names = new Set([...Object.keys(antes ?? {}), ...Object.keys(despues ?? {})])
  const out = new Set<string>()
  for (const k of names) {
    if (JSON.stringify(antes?.[k]) !== JSON.stringify(despues?.[k])) out.add(k)
  }
  return out
}

function JsonBlock({
  data,
  highlight,
}: {
  data: Record<string, unknown> | null
  highlight: Set<string>
}) {
  if (!data || Object.keys(data).length === 0) {
    return <span className="text-ink/40">—</span>
  }
  return (
    <ul className="space-y-1 text-xs">
      {Object.entries(data).map(([k, v]) => (
        <li
          key={k}
          className={highlight.has(k) ? "rounded bg-brand/10 px-1 font-semibold text-brand-dark" : ""}
        >
          <span className="text-plum">{k}</span>: {typeof v === "object" ? JSON.stringify(v) : String(v)}
        </li>
      ))}
    </ul>
  )
}

export function PanelAuditoriaPage() {
  const [params, setParams] = useSearchParams()
  const [idUsuario, setIdUsuario] = useState(params.get("id_usuario") ?? "")
  const [accion, setAccion] = useState(params.get("accion") ?? "")
  const [q, setQ] = useState(params.get("q") ?? "")
  const debouncedQ = useDebounced(q, 300)
  const [catalogoAcciones, setCatalogoAcciones] = useState<string[]>([])
  const [fechaDesde, setFechaDesde] = useState(params.get("fecha_desde") ?? "")
  const [fechaHasta, setFechaHasta] = useState(params.get("fecha_hasta") ?? "")
  const [page, setPage] = useState(Number(params.get("page") || 1))
  const [items, setItems] = useState<FilaAuditoria[]>([])
  const [total, setTotal] = useState(0)
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)
  const [detalle, setDetalle] = useState<FilaAuditoria | null>(null)
  const [usuarioText, setUsuarioText] = useState("")
  const debouncedUsuarioQ = useDebounced(usuarioText, 300)
  const [usuarioOpts, setUsuarioOpts] = useState<UsuarioOpt[]>([])
  const [abiertoCombo, setAbiertoCombo] = useState(false)
  const seq = useRef(0)

  const { accionesModulo, puedeModulo } = useAccesos()
  const acciones = accionesModulo("auditoria")
  const amplio = acciones.length === 0 && puedeModulo("auditoria")
  const puedeConsultar = amplio || puedeAccion(acciones, "Consultar")

  const pageSize = 15
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const syncParams = useCallback(() => {
    const next = new URLSearchParams()
    if (idUsuario) next.set("id_usuario", idUsuario)
    if (accion.trim()) next.set("accion", accion.trim())
    if (debouncedQ.trim()) next.set("q", debouncedQ.trim())
    if (fechaDesde) next.set("fecha_desde", fechaDesde)
    if (fechaHasta) next.set("fecha_hasta", fechaHasta)
    if (page > 1) next.set("page", String(page))
    setParams(next, { replace: true })
  }, [idUsuario, accion, debouncedQ, fechaDesde, fechaHasta, page, setParams])

  useEffect(() => {
    syncParams()
  }, [syncParams])

  const cargarUsuarios = useCallback(async () => {
    const q = debouncedUsuarioQ.trim()
    if (!q) {
      setUsuarioOpts([])
      return
    }
    const r = await api(`/api/v1/auditoria/bitacora/usuarios/?q=${encodeURIComponent(q)}&limit=30`)
    if (!r.ok) return
    const data = (await r.json()) as UsuarioOpt[]
    setUsuarioOpts(data)
  }, [debouncedUsuarioQ])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void cargarUsuarios()
    }, 0)
    return () => window.clearTimeout(t)
  }, [cargarUsuarios])

  const cargar = useCallback(async () => {
    const id = ++seq.current
    setCargando(true)
    setError("")
    const qs = new URLSearchParams()
    qs.set("page", String(page))
    qs.set("page_size", String(pageSize))
    if (idUsuario) qs.set("id_usuario", idUsuario)
    if (accion.trim()) qs.set("accion", accion.trim())
    if (debouncedQ.trim()) qs.set("q", debouncedQ.trim())
    if (fechaDesde) qs.set("fecha_desde", fechaDesde)
    if (fechaHasta) qs.set("fecha_hasta", fechaHasta)
    try {
      const resp = await api(`/api/v1/auditoria/bitacora/?${qs.toString()}`)
      if (id !== seq.current) return
      if (!resp.ok) {
        setError(MSG_TRANSVERSAL.auditoriaCargaError)
        setItems([])
        setTotal(0)
        setMensaje("")
        toast(MSG_TRANSVERSAL.auditoriaCargaError)
        return
      }
      const data = (await resp.json()) as { items: FilaAuditoria[]; total: number; mensaje: string }
      setItems(data.items)
      setTotal(data.total)
      setMensaje(data.mensaje)
    } catch {
      if (id !== seq.current) return
      setError(MSG_TRANSVERSAL.auditoriaCargaError)
      toast(MSG_TRANSVERSAL.auditoriaCargaError)
    } finally {
      if (id === seq.current) setCargando(false)
    }
  }, [page, pageSize, idUsuario, accion, debouncedQ, fechaDesde, fechaHasta])

  useEffect(() => {
    if (!puedeConsultar) return
    const t = window.setTimeout(() => {
      void (async () => {
        const r = await api("/api/v1/auditoria/bitacora/acciones/")
        if (!r.ok) return
        const data = (await r.json()) as { acciones: string[] }
        setCatalogoAcciones(data.acciones ?? [])
      })()
    }, 0)
    return () => window.clearTimeout(t)
  }, [puedeConsultar])

  useEffect(() => {
    if (!puedeConsultar) return
    const t = window.setTimeout(() => {
      void cargar()
    }, 0)
    return () => window.clearTimeout(t)
  }, [cargar, puedeConsultar])

  const etiquetaUsuarioSeleccion = useMemo(() => {
    if (!idUsuario) return usuarioText
    const o = usuarioOpts.find((u) => String(u.id_usuario) === idUsuario)
    return o?.etiqueta ?? usuarioText
  }, [idUsuario, usuarioOpts, usuarioText])

  const aplicarFiltros = () => {
    setPage(1)
    void cargar()
  }

  if (!puedeConsultar) {
    return (
      <section>
        <h1 className="font-display text-3xl font-extrabold text-plum">Auditoría</h1>
        <p className="mt-3 text-sm text-ink/70">{MSG_TRANSVERSAL.permisoDenegado}</p>
      </section>
    )
  }

  return (
    <section>
      <h1 className="font-display text-3xl font-extrabold text-plum">Auditoría</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">
        Quién hizo qué y cuándo. Los registros no se pueden editar ni borrar.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="relative min-w-[14rem] flex-1 text-sm font-semibold">
          Usuario
          <input
            role="combobox"
            aria-expanded={abiertoCombo}
            aria-autocomplete="list"
            value={etiquetaUsuarioSeleccion}
            onChange={(e) => {
              setUsuarioText(e.target.value)
              setIdUsuario("")
              setAbiertoCombo(true)
            }}
            onFocus={() => setAbiertoCombo(true)}
            onBlur={() => window.setTimeout(() => setAbiertoCombo(false), 200)}
            placeholder="Escribe para buscar…"
            className={`${input} !mt-0 pl-10`}
          />
          <Search size={16} className="pointer-events-none absolute left-3.5 top-[2.15rem] text-plum/50" />
          {abiertoCombo && usuarioOpts.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border-2 border-plum/15 bg-white py-1 text-sm shadow-lg"
            >
              {usuarioOpts.map((u) => (
                <li key={u.id_usuario}>
                  <button
                    type="button"
                    role="option"
                    className="w-full px-3 py-2 text-left hover:bg-plum-soft"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setIdUsuario(String(u.id_usuario))
                      setUsuarioText(u.etiqueta)
                      setAbiertoCombo(false)
                    }}
                  >
                    {u.etiqueta} <span className="text-ink/50">({u.email})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
        <label className="min-w-[12rem] flex-1 text-sm font-semibold">
          Buscar
          <input
            value={q}
            maxLength={100}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Entidad, identificador o usuario"
            className={input}
          />
        </label>
        <label className="min-w-[10rem] text-sm font-semibold">
          Acción
          <select value={accion} onChange={(e) => setAccion(e.target.value)} className={input} aria-label="Acción">
            <option value="">Todas</option>
            {catalogoAcciones.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[10rem] text-sm font-semibold">
          Desde
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className={input} />
        </label>
        <label className="min-w-[10rem] text-sm font-semibold">
          Hasta
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className={input} />
        </label>
        <button type="button" className={btnPrimary} onClick={aplicarFiltros}>
          Filtrar
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() => {
            setIdUsuario("")
            setUsuarioText("")
            setAccion("")
            setQ("")
            setFechaDesde("")
            setFechaHasta("")
            setPage(1)
          }}
        >
          Limpiar
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border-2 border-brand p-3 text-sm text-brand-dark" role="alert">
          {error}
        </p>
      )}

      {cargando && (
        <p className="mt-4 flex items-center gap-2 text-sm text-plum">
          <Loader2 className="animate-spin" size={18} aria-hidden /> Cargando…
        </p>
      )}

      {items.length === 0 && !cargando && (
        <div className="mt-6">
          <Empty text={mensaje || MSG_TRANSVERSAL.auditoriaVacia} />
        </div>
      )}

      {items.length > 0 && (
        <>
          <p className="mt-4 text-xs text-ink/55" aria-live="polite">
            {mensaje}
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-plum-soft text-xs uppercase tracking-wider text-plum">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Cuándo
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Usuario
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Acción
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Módulo
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    ID
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    IP
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Detalle
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Ver detalle</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {items.map((r) => (
                  <tr key={r.id_auditoria} className="transition hover:bg-paper">
                    <td className="whitespace-nowrap px-4 py-3">{formatDt(r.fecha_hora)}</td>
                    <td className="px-4 py-3">{r.usuario.nombre || r.usuario.email || "—"}</td>
                    <td className="px-4 py-3">
                      <AccionBadge accion={r.accion} entidad={r.entidad} />
                    </td>
                    <td className="px-4 py-3">{r.entidad}</td>
                    <td className="px-4 py-3">{r.id_entidad}</td>
                    <td className="font-mono text-xs text-ink/70">{r.ip_origen}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-ink/80">{r.resumen}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" className={btnGhost} onClick={() => setDetalle(r)}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={totalPages} total={total} onPage={setPage} />
        </>
      )}

      <Modal open={!!detalle} onClose={() => setDetalle(null)} title="Detalle de la operación" wide trapFocus>
        {detalle && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 text-sm">
              <p>
                <span className="font-bold text-plum">Fecha:</span> {formatDt(detalle.fecha_hora)}
              </p>
              <p>
                <span className="font-bold text-plum">Usuario:</span>{" "}
                {detalle.usuario.nombre || detalle.usuario.email || "—"}
              </p>
              <p>
                <span className="font-bold text-plum">Acción:</span> {detalle.accion}
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-plum">Datos anteriores</h3>
              <JsonBlock
                data={detalle.datos_anteriores}
                highlight={keysCambiados(detalle.datos_anteriores, detalle.datos_nuevos)}
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-plum">Datos nuevos</h3>
              <JsonBlock
                data={detalle.datos_nuevos}
                highlight={keysCambiados(detalle.datos_anteriores, detalle.datos_nuevos)}
              />
            </div>
            {detalle.motivo && detalle.motivo !== "—" && (
              <div className="sm:col-span-2 rounded-lg border border-plum/15 bg-plum-soft/40 p-3 text-sm">
                <span className="font-bold text-plum">Motivo:</span> {detalle.motivo}
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}
