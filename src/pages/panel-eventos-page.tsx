import { useCallback, useEffect, useState } from "react"
import { CalendarDays, Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Search } from "lucide-react"
import {
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
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import {
  aDatetimeLocal,
  desdeDatetimeLocal,
  estadoCalendario,
  ETIQUETA_TIPO,
  fechasEventoValidas,
  IMPACTOS,
  TIPOS_EVENTO,
  type EstadoCalendario,
} from "../features/eventos/logic"
import { dt } from "../features/inventory/format"
import { toast } from "../features/en-desarrollo"
import { bogotaDay } from "../lib/schedule"
import { API_URL, api, mensajeDe } from "../shared/api"

type Sede = { id_sede: number; nombre: string }

type Evento = {
  id_evento: number
  titulo: string
  tipo: string
  descripcion: string
  fecha_inicio: string
  fecha_fin: string | null
  impacto: string
  areas_afectadas: string
  id_sede: number | null
  sede_nombre?: string
  estado: boolean
  visible_sitio: boolean
  imagen_url: string
  importancia_clave: boolean
  version_fila: number
}

const ESTADO_CALENDARIO: Record<EstadoCalendario, string> = {
  vigente: "Vigente",
  programada: "Programada",
  archivada: "Finalizada",
}

const ESTADO_CLASS: Record<EstadoCalendario, string> = {
  vigente: "bg-cyan/20 text-cyan-dark",
  programada: "bg-sun/30 text-ink",
  archivada: "bg-plum-soft text-ink/60",
}

export function PanelEventosPage() {
  const { accionesModulo } = useAccesos()
  const acciones = accionesModulo("eventos")
  const puedeCrear = puedeAccion(acciones, "Crear")
  const puedeEditar = puedeAccion(acciones, "Editar")
  const [q, setQ] = useState("")
  const debouncedQ = useDebounced(q, 300)
  const [tipoFiltro, setTipoFiltro] = useState("")
  const [sedeFiltro, setSedeFiltro] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState("todos")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Evento[]>([])
  const [total, setTotal] = useState(0)
  const [mensaje, setMensaje] = useState("")
  const [sedes, setSedes] = useState<Sede[]>([])
  const [modal, setModal] = useState<"new" | number | null>(null)
  const hoy = bogotaDay()
  const pageSize = 20

  useEffect(() => {
    void api("/api/v1/sedes/gestion/?page=1&page_size=200&estado=activo").then(async (r) => {
      if (!r.ok) return
      const body = (await r.json()) as { items: Sede[] }
      setSedes(body.items)
    })
  }, [])

  const cargar = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (debouncedQ.trim()) qs.set("q", debouncedQ.trim())
    if (tipoFiltro) qs.set("tipo", tipoFiltro)
    if (sedeFiltro) qs.set("id_sede", sedeFiltro)
    if (desde) qs.set("fecha_desde", desde)
    if (hasta) qs.set("fecha_hasta", hasta)
    if (estadoFiltro !== "todos") qs.set("estado", estadoFiltro)
    const r = await api(`/api/v1/eventos/?${qs}`)
    const msg = await mensajeDe(r)
    if (!r.ok) {
      toast(msg || "No fue posible cargar los eventos. Intente nuevamente.")
      return
    }
    const body = (await r.json()) as { items: Evento[]; total: number; mensaje?: string }
    setItems(body.items)
    setTotal(body.total)
    setMensaje(body.mensaje || "")
  }, [debouncedQ, tipoFiltro, sedeFiltro, desde, hasta, estadoFiltro, page])

  useEffect(() => {
    const t = window.setTimeout(() => void cargar(), 0)
    return () => window.clearTimeout(t)
  }, [cargar])

  return (
    <section className="mx-auto max-w-6xl">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Calendario operativo</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Eventos</h1>
      <p className="mt-2 max-w-3xl text-sm text-ink/65">
        Promociones, capacitaciones, entregas y fechas clave. Los marcados como visibles aparecen en el sitio público.
      </p>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <label className="relative min-w-0 flex-1 lg:min-w-[14rem]">
          <span className="sr-only">Buscar evento</span>
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plum/50" aria-hidden />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar por título…"
            className={`${input} !mt-0 pl-9`}
          />
        </label>
        <select
          aria-label="Filtro tipo"
          value={tipoFiltro}
          onChange={(e) => {
            setTipoFiltro(e.target.value)
            setPage(1)
          }}
          className={`${input} !mt-0 w-full lg:w-40`}
        >
          <option value="">Todos los tipos</option>
          {TIPOS_EVENTO.map((t) => (
            <option key={t.v} value={t.v}>{t.l}</option>
          ))}
        </select>
        <select
          aria-label="Filtro sede"
          value={sedeFiltro}
          onChange={(e) => {
            setSedeFiltro(e.target.value)
            setPage(1)
          }}
          className={`${input} !mt-0 w-full lg:w-40`}
        >
          <option value="">Todas las sedes</option>
          {sedes.map((s) => (
            <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Desde"
          value={desde}
          onChange={(e) => {
            setDesde(e.target.value)
            setPage(1)
          }}
          className={`${input} !mt-0 w-full lg:w-36`}
        />
        <input
          type="date"
          aria-label="Hasta"
          value={hasta}
          onChange={(e) => {
            setHasta(e.target.value)
            setPage(1)
          }}
          className={`${input} !mt-0 w-full lg:w-36`}
        />
        <select
          aria-label="Filtro estado"
          value={estadoFiltro}
          onChange={(e) => {
            setEstadoFiltro(e.target.value)
            setPage(1)
          }}
          className={`${input} !mt-0 w-full lg:w-36`}
        >
          <option value="todos">Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        {puedeCrear && (
          <button type="button" className={`${btnPrimary} shrink-0`} onClick={() => setModal("new")}>
            <Plus size={16} /> Nuevo evento
          </button>
        )}
      </div>

      {mensaje && <p className="mt-4 text-sm text-ink/60">{mensaje}</p>}

      {items.length === 0 ? (
        <Empty text={debouncedQ.trim() ? "No se encontraron eventos con los criterios indicados." : "No hay eventos registrados."} />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-plum/10 text-xs uppercase tracking-wide text-ink/55">
                <th className="px-4 py-3 w-12" />
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Inicio</th>
                <th className="px-4 py-3">Fin</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Impacto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Público</th>
                <th className="px-4 py-3 w-16" aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {items.map((e) => {
                const cal = estadoCalendario(e.fecha_inicio, e.fecha_fin, hoy)
                return (
                  <tr key={e.id_evento} className="border-t border-plum/5">
                    <td className="px-4 py-3">
                      {e.imagen_url ? (
                        <img src={e.imagen_url} alt="" className="size-10 rounded-lg object-cover" />
                      ) : (
                        <span className="grid size-10 place-items-center rounded-lg bg-plum-soft text-plum/40">
                          <CalendarDays size={18} aria-hidden />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {e.titulo}
                      {e.importancia_clave && (
                        <span className="ml-2 rounded-full bg-sun px-2 py-0.5 text-[10px] font-bold uppercase text-ink">Clave</span>
                      )}
                      {!e.estado && <span className="ml-2 text-xs text-ink/45">(inactivo)</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">{dt(e.fecha_inicio)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">{e.fecha_fin ? dt(e.fecha_fin) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ESTADO_CLASS[cal]}`}>{ESTADO_CALENDARIO[cal]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-plum-soft px-2 py-0.5 text-xs font-bold text-plum">{e.impacto || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-xs font-bold text-cyan-dark">{ETIQUETA_TIPO[e.tipo] ?? e.tipo}</span>
                    </td>
                    <td className="px-4 py-3">
                      {e.visible_sitio ? (
                        <span className="inline-flex items-center gap-1 text-cyan-dark" title="Visible en el sitio">
                          <Eye size={16} aria-hidden /> Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-ink/40" title="No público">
                          <EyeOff size={16} aria-hidden /> No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {puedeEditar && (
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-plum-soft"
                          aria-label={`Editar ${e.titulo}`}
                          onClick={() => setModal(e.id_evento)}
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} total={total} totalPages={Math.max(1, Math.ceil(total / pageSize))} onPage={setPage} />

      <EventoModal
        open={modal !== null}
        id={modal === "new" ? null : modal}
        sedes={sedes}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null)
          void cargar()
        }}
      />
    </section>
  )
}

function EventoModal({
  open,
  id,
  sedes,
  onClose,
  onSaved,
}: {
  open: boolean
  id: number | null
  sedes: Sede[]
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = id === null
  const [titulo, setTitulo] = useState("")
  const [tipo, setTipo] = useState("promocion")
  const [inicio, setInicio] = useState("")
  const [fin, setFin] = useState("")
  const [impacto, setImpacto] = useState("Medio")
  const [areas, setAreas] = useState("")
  const [idSede, setIdSede] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [impactoTexto, setImpactoTexto] = useState("")
  const [imagenUrl, setImagenUrl] = useState("")
  const [imagenTab, setImagenTab] = useState<"url" | "archivo">("url")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [visible, setVisible] = useState(false)
  const [clave, setClave] = useState(false)
  const [estado, setEstado] = useState(true)
  const [version, setVersion] = useState(1)
  const [error, setError] = useState("")
  const { run, pending } = useDo()

  useEffect(() => {
    if (!open) return
    if (isNew) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset modal al abrir
      setTitulo("")
      setTipo("promocion")
      setInicio("")
      setFin("")
      setImpacto("Medio")
      setAreas("")
      setIdSede("")
      setDescripcion("")
      setImpactoTexto("")
      setImagenUrl("")
      setImagenTab("url")
      setArchivo(null)
      setPreview("")
      setVisible(false)
      setClave(false)
      setEstado(true)
      setError("")
      return
    }
    void (async () => {
      const r = await api(`/api/v1/eventos/${id}/`)
      if (!r.ok) return
      const e = (await r.json()) as Evento & { impacto_operacion?: string }
      setTitulo(e.titulo)
      setTipo(e.tipo || "otro")
      setInicio(aDatetimeLocal(e.fecha_inicio))
      setFin(e.fecha_fin ? aDatetimeLocal(e.fecha_fin) : "")
      setImpacto(e.impacto || "Medio")
      setAreas(e.areas_afectadas)
      setIdSede(e.id_sede ? String(e.id_sede) : "")
      setDescripcion(e.descripcion)
      setImpactoTexto((e as { impacto_operacion?: string }).impacto_operacion || "")
      setImagenUrl(e.imagen_url)
      setPreview(e.imagen_url.startsWith("http") ? e.imagen_url : e.imagen_url ? `${API_URL}/api/v1/catalogo/media/${e.imagen_url}` : "")
      setImagenTab(e.imagen_url && !e.imagen_url.startsWith("http") && !e.imagen_url.startsWith("https") ? "archivo" : "url")
      setVisible(e.visible_sitio)
      setClave(e.importancia_clave)
      setEstado(e.estado)
      setVersion(e.version_fila)
    })()
  }, [open, id, isNew])

  const enviar = () =>
    run(async () => {
      setError("")
      if (!titulo.trim() || !inicio.trim() || !fin.trim()) {
        setError("Todos los campos obligatorios deben ser diligenciados.")
        return
      }
      if (!fechasEventoValidas(inicio, fin)) {
        setError("La fecha de fin debe ser igual o posterior a la fecha de inicio.")
        return
      }
      const payload = {
        titulo,
        tipo,
        fecha_inicio: desdeDatetimeLocal(inicio),
        fecha_fin: desdeDatetimeLocal(fin),
        impacto,
        areas_afectadas: areas,
        id_sede: idSede ? Number(idSede) : null,
        descripcion,
        impacto_operacion: impactoTexto,
        imagen_url: imagenTab === "url" ? imagenUrl : "",
        visible_sitio: visible,
        importancia_clave: clave,
        estado,
        ...(isNew ? {} : { version_fila: version }),
      }
      const r = await api(isNew ? "/api/v1/eventos/" : `/api/v1/eventos/${id}/`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(payload),
      })
      const body = await r.json().catch(() => ({}))
      const msg = (body as { mensaje?: string }).mensaje || (await mensajeDe(r))
      if (!r.ok) {
        setError(msg || (isNew ? "No fue posible crear el evento. Intente nuevamente." : "No fue posible actualizar el evento. Intente nuevamente."))
        return
      }
      const eventoId = (body as { evento?: { id_evento: number }; id_evento?: number }).evento?.id_evento ?? (body as { id_evento?: number }).id_evento ?? id
      if (archivo && imagenTab === "archivo" && eventoId) {
        const data = new FormData()
        data.append("imagen", archivo)
        const up = await api(`/api/v1/eventos/${eventoId}/imagen/`, { method: "POST", body: data, headers: {} })
        if (!up.ok) {
          const upMsg = await mensajeDe(up)
          toast(upMsg || "El evento se guardó, pero la imagen no pudo cargarse.")
        }
      }
      toast(msg || (isNew ? "Evento creado correctamente." : "Evento actualizado correctamente."))
      onSaved()
    })

  return (
    <Modal open={open} title={isNew ? "Crear evento" : "Editar evento"} onClose={onClose}>
      {error && <FormAlert message={error} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldLabel label="Título" required className="sm:col-span-2">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nombre del evento" className={input} aria-invalid={!titulo.trim()} />
        </FieldLabel>
        <FieldLabel label="Tipo" required>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={input}>
            {TIPOS_EVENTO.map((t) => (
              <option key={t.v} value={t.v}>{t.l}</option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Impacto" required>
          <select value={impacto} onChange={(e) => setImpacto(e.target.value)} className={input}>
            {IMPACTOS.map((t) => (
              <option key={t.v} value={t.v}>{t.l}</option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Inicio" required>
          <input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} className={input} />
        </FieldLabel>
        <FieldLabel label="Fin" required>
          <input type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} className={input} />
        </FieldLabel>
        <FieldLabel label="Sede (opcional)">
          <select value={idSede} onChange={(e) => setIdSede(e.target.value)} className={input}>
            <option value="">Todas / global</option>
            {sedes.map((s) => (
              <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Áreas afectadas">
          <input value={areas} onChange={(e) => setAreas(e.target.value)} placeholder="Ventas, inventario, mostrador…" className={input} />
        </FieldLabel>
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold">Imagen del evento</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${imagenTab === "url" ? "bg-plum text-white" : "border-2 border-plum/15 text-plum"}`}
              onClick={() => setImagenTab("url")}
            >
              Enlace URL
            </button>
            <button
              type="button"
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${imagenTab === "archivo" ? "bg-plum text-white" : "border-2 border-plum/15 text-plum"}`}
              onClick={() => setImagenTab("archivo")}
            >
              Subir archivo
            </button>
          </div>
          {imagenTab === "url" ? (
            <FieldLabel label="URL de imagen" className="mt-3">
              <input value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} placeholder="https://…" className={input} />
            </FieldLabel>
          ) : (
            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cyan bg-cyan/10 px-4 py-6 text-center">
              <ImagePlus size={24} className="text-cyan-dark" aria-hidden />
              <span className="text-sm font-bold text-plum">Seleccionar imagen</span>
              <span className="text-xs text-ink/60">JPG, JPEG, PNG o WEBP · máximo 5 MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  setArchivo(file)
                  setPreview(file ? URL.createObjectURL(file) : preview)
                }}
              />
            </label>
          )}
          {preview && <img src={preview} alt="Vista previa" className="mt-3 h-24 w-auto max-w-full rounded-xl object-cover" />}
        </div>
        <FieldLabel label="Descripción" className="sm:col-span-2">
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} placeholder="Detalle para el equipo y el sitio público" className={input} />
        </FieldLabel>
        <FieldLabel label="Impacto en la operación" className="sm:col-span-2">
          <textarea value={impactoTexto} onChange={(e) => setImpactoTexto(e.target.value)} rows={2} placeholder="Cómo afecta inventario, horarios o ventas" className={input} />
        </FieldLabel>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="size-4 rounded border-plum/30" />
          Visible en el sitio público
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" checked={clave} onChange={(e) => setClave(e.target.checked)} className="size-4 rounded border-plum/30" />
          Importancia clave (marca meses atípicos en analítica)
        </label>
        {!isNew && (
          <FieldLabel label="Estado">
            <select value={estado ? "activo" : "inactivo"} onChange={(e) => setEstado(e.target.value === "activo")} className={input}>
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
          {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : isNew ? "Crear evento" : "Guardar cambios"}
        </button>
      </div>
    </Modal>
  )
}
