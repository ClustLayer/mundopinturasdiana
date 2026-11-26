import { useCallback, useEffect, useState } from "react"
import { Gift, ImagePlus, Loader2, Pencil, Plus, Search } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import { toast } from "../features/en-desarrollo"
import {
  ETIQUETA_TIPO,
  TIPOS_PROMOCION,
  estadoPromocion,
  fechasPromocionValidas,
  urlImagenPromocion,
  type PromocionApi,
} from "../features/promociones/logic"
import { bogotaDay } from "../lib/schedule"
import { API_URL, api, mensajeDe } from "../shared/api"
import { Empty, FieldLabel, FormAlert, Modal, Pager, btnGhost, btnPrimary, input, useDebounced, useDo } from "../components/panel/kit"

type Promocion = PromocionApi

const VER_OPCIONES = [
  { id: "vigentes", label: "Vigentes y programadas" },
  { id: "archivadas", label: "Archivadas" },
  { id: "todas", label: "Todas" },
] as const

const ESTADO_CLASS: Record<string, string> = {
  vigente: "bg-cyan/20 text-cyan-dark",
  programada: "bg-sun/30 text-ink",
  archivada: "bg-plum-soft text-ink/60",
  pausada: "bg-brand/15 text-brand-dark",
}

const ESTADO_LABEL: Record<string, string> = {
  vigente: "Vigente",
  programada: "Programada",
  archivada: "Archivada",
  pausada: "Pausada",
}

export function PanelPromocionesPage() {
  const { accionesModulo } = useAccesos()
  const acciones = accionesModulo("promociones")
  const puedeCrear = puedeAccion(acciones, "Crear")
  const puedeEditar = puedeAccion(acciones, "Editar")
  const [params, setParams] = useSearchParams()
  const verParam = params.get("ver") ?? "vigentes"
  const ver = VER_OPCIONES.some((v) => v.id === verParam) ? verParam : "vigentes"
  const [q, setQ] = useState("")
  const debouncedQ = useDebounced(q, 300)
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Promocion[]>([])
  const [total, setTotal] = useState(0)
  const [mensaje, setMensaje] = useState("")
  const [modal, setModal] = useState<"new" | number | null>(null)
  const hoy = bogotaDay()
  const pageSize = 20

  const cargar = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), page_size: String(pageSize), ver })
    if (debouncedQ.trim()) qs.set("q", debouncedQ.trim())
    const r = await api(`/api/v1/promociones/?${qs}`)
    const msg = await mensajeDe(r)
    if (!r.ok) {
      toast(msg || "No fue posible cargar las promociones. Intente nuevamente.")
      return
    }
    const body = (await r.json()) as { items: Promocion[]; total: number; mensaje?: string }
    setItems(body.items)
    setTotal(body.total)
    setMensaje(body.mensaje || "")
  }, [debouncedQ, page, ver])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void cargar()
    }, 0)
    return () => window.clearTimeout(t)
  }, [cargar])

  return (
    <section className="mx-auto max-w-6xl">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Sitio público</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Promociones y sorteos</h1>
      <p className="mt-2 max-w-3xl text-sm text-ink/65">
        Se ven en el inicio hasta su fecha de fin; luego se archivan. Los clics en WhatsApp se miden en analítica.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Vista de promociones">
        {VER_OPCIONES.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={ver === tab.id}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              ver === tab.id ? "bg-plum text-white" : "border-2 border-plum/15 text-plum hover:bg-plum-soft"
            }`}
            onClick={() => {
              setPage(1)
              const next = new URLSearchParams(params)
              if (tab.id === "vigentes") next.delete("ver")
              else next.set("ver", tab.id)
              setParams(next, { replace: true })
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <label className="relative min-w-0 flex-1 lg:min-w-[14rem]">
          <span className="sr-only">Buscar promoción</span>
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plum/50" aria-hidden />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar por título o hashtags…"
            className={`${input} !mt-0 pl-9`}
          />
        </label>
        {puedeCrear && (
          <button type="button" className={`${btnPrimary} shrink-0`} onClick={() => setModal("new")}>
            <Plus size={16} /> Nueva promoción
          </button>
        )}
      </div>

      {mensaje && <p className="mt-4 text-sm text-ink/60">{mensaje}</p>}

      {items.length === 0 ? (
        <Empty text={debouncedQ.trim() ? "No se encontraron promociones con los criterios indicados." : "No hay promociones en esta vista."} />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-plum/10 text-xs uppercase tracking-wide text-ink/55">
                <th className="w-12 px-4 py-3" />
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Hashtags</th>
                <th className="px-4 py-3">Inicia</th>
                <th className="px-4 py-3">Termina</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Clics WhatsApp</th>
                <th className="w-16 px-4 py-3" aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const activa = p.activa ?? p.estado ?? true
                const st = estadoPromocion(p.fecha_inicio, p.fecha_fin, activa, hoy)
                const img = urlImagenPromocion(p.imagen_url || "")
                return (
                  <tr key={p.id_promocion} className="border-t border-plum/5">
                    <td className="px-4 py-3">
                      {img ? (
                        <img src={img} alt="" className="size-10 rounded-lg object-cover" />
                      ) : (
                        <span className="grid size-10 place-items-center rounded-lg bg-plum-soft text-plum/40">
                          <Gift size={18} aria-hidden />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-plum">
                      {p.titulo}
                      <span className="ml-2 text-xs font-bold text-cyan-dark">{ETIQUETA_TIPO[p.tipo] ?? p.tipo}</span>
                    </td>
                    <td className="max-w-[10rem] truncate px-4 py-3 text-xs text-brand">{p.hashtags}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">{p.fecha_inicio.slice(0, 10)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">{p.fecha_fin.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ESTADO_CLASS[st]}`}>{ESTADO_LABEL[st]}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{p.clics_whatsapp ?? 0}</td>
                    <td className="px-4 py-3">
                      {puedeEditar && (
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-plum-soft"
                          aria-label={`Editar ${p.titulo}`}
                          onClick={() => setModal(p.id_promocion)}
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

      <PromocionModal
        open={modal !== null}
        id={modal === "new" ? null : modal}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null)
          void cargar()
        }}
      />
    </section>
  )
}

function PromocionModal({
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
  const [titulo, setTitulo] = useState("")
  const [tipo, setTipo] = useState("promocion")
  const [descripcion, setDescripcion] = useState("")
  const [hashtags, setHashtags] = useState("")
  const [inicio, setInicio] = useState("")
  const [fin, setFin] = useState("")
  const [activa, setActiva] = useState(true)
  const [imagenUrl, setImagenUrl] = useState("")
  const [imagenTab, setImagenTab] = useState<"url" | "archivo">("url")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [version, setVersion] = useState(1)
  const [error, setError] = useState("")
  const { run, pending } = useDo()

  useEffect(() => {
    if (!open) return
    if (isNew) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset modal al abrir
      setTitulo("")
      setTipo("promocion")
      setDescripcion("")
      setHashtags("")
      setInicio("")
      setFin("")
      setActiva(true)
      setImagenUrl("")
      setImagenTab("url")
      setArchivo(null)
      setPreview("")
      setVersion(1)
      setError("")
      return
    }
    void (async () => {
      const r = await api(`/api/v1/promociones/${id}/`)
      if (!r.ok) {
        setError((await mensajeDe(r)) || "No fue posible cargar la promoción.")
        return
      }
      const p = (await r.json()) as Promocion
      setTitulo(p.titulo)
      setTipo(p.tipo)
      setDescripcion(p.descripcion)
      setHashtags(p.hashtags)
      setInicio(p.fecha_inicio.slice(0, 10))
      setFin(p.fecha_fin.slice(0, 10))
      setActiva(p.activa ?? p.estado ?? true)
      setImagenUrl(p.imagen_url || "")
      const img = urlImagenPromocion(p.imagen_url || "")
      setPreview(img)
      setImagenTab(p.imagen_url && !p.imagen_url.startsWith("http") ? "archivo" : "url")
      setVersion(p.version_fila ?? 1)
      setError("")
    })()
  }, [open, isNew, id])

  const guardar = () =>
    run(async () => {
      if (!titulo.trim() || !descripcion.trim() || !hashtags.trim()) {
        setError("Complete título, descripción y hashtags.")
        return
      }
      if (!fechasPromocionValidas(inicio, fin)) {
        setError("La fecha de fin debe ser igual o posterior a la de inicio.")
        return
      }
      if (isNew && !imagenUrl.trim() && !archivo) {
        setError("Agregue una imagen (URL o archivo).")
        return
      }
      const body = {
        titulo: titulo.trim(),
        tipo,
        descripcion: descripcion.trim(),
        hashtags: hashtags.trim(),
        fecha_inicio: inicio,
        fecha_fin: fin,
        activa,
        imagen_url: imagenTab === "url" ? imagenUrl.trim() : "",
        version_fila: version,
      }
      const r = isNew
        ? await api("/api/v1/promociones/", { method: "POST", body: JSON.stringify(body) })
        : await api(`/api/v1/promociones/${id}/`, { method: "PATCH", body: JSON.stringify(body) })
      const msg = await mensajeDe(r)
      if (!r.ok) {
        setError(msg || "No fue posible guardar la promoción.")
        return
      }
      const data = (await r.json()) as { promocion?: Promocion; id_promocion?: number }
      const promoId = data.promocion?.id_promocion ?? data.id_promocion ?? id
      if (archivo && imagenTab === "archivo" && promoId) {
        const fd = new FormData()
        fd.append("imagen", archivo)
        const up = await api(`/api/v1/promociones/${promoId}/imagen/`, { method: "POST", body: fd, headers: {} })
        if (!up.ok) toast((await mensajeDe(up)) || "La promoción se guardó, pero la imagen no pudo cargarse.")
      }
      toast("Promoción guardada.")
      onSaved()
    })

  return (
    <Modal open={open} title={isNew ? "Nueva promoción" : "Editar promoción"} onClose={onClose} wide trapFocus>
      {error && <FormAlert message={error} />}
      <div className="grid gap-3 md:grid-cols-2">
        <FieldLabel label="Título *" className="md:col-span-2">
          <input className={input} value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120} />
        </FieldLabel>
        <FieldLabel label="Tipo *">
          <select className={input} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_PROMOCION.map((t) => (
              <option key={t.v} value={t.v}>
                {t.l}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Publicada">
          <label className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-plum">
            <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} />
            Visible en el sitio (puede pausarla sin borrarla)
          </label>
        </FieldLabel>
        <FieldLabel label="Descripción *" className="md:col-span-2">
          <textarea className={`${input} min-h-28`} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </FieldLabel>
        <FieldLabel label="Hashtags *" className="md:col-span-2">
          <input className={input} value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#promo #sorteo" />
        </FieldLabel>
        <FieldLabel label="Inicio *">
          <input type="date" className={input} value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </FieldLabel>
        <FieldLabel label="Fin *">
          <input type="date" className={input} value={fin} onChange={(e) => setFin(e.target.value)} />
        </FieldLabel>
        <SummaryImages
          imagenTab={imagenTab}
          setImagenTab={setImagenTab}
          imagenUrl={imagenUrl}
          setImagenUrl={setImagenUrl}
          archivo={archivo}
          setArchivo={setArchivo}
          preview={preview}
          setPreview={setPreview}
        />
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className={btnGhost} onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className={btnPrimary} disabled={pending} onClick={() => guardar()}>
          {pending ? <Loader2 className="animate-spin" size={16} /> : null} Guardar
        </button>
      </div>
    </Modal>
  )
}

function SummaryImages({
  imagenTab,
  setImagenTab,
  imagenUrl,
  setImagenUrl,
  archivo,
  setArchivo,
  preview,
  setPreview,
}: {
  imagenTab: "url" | "archivo"
  setImagenTab: (v: "url" | "archivo") => void
  imagenUrl: string
  setImagenUrl: (v: string) => void
  archivo: File | null
  setArchivo: (f: File | null) => void
  preview: string
  setPreview: (v: string) => void
}) {
  return (
    <div className="md:col-span-2">
      <p className="text-sm font-bold text-plum">Imagen *</p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className={`rounded-xl px-3 py-1.5 text-xs font-bold ${imagenTab === "url" ? "bg-plum text-white" : "border-2 border-plum/15 text-plum"}`}
          onClick={() => setImagenTab("url")}
        >
          URL
        </button>
        <button
          type="button"
          className={`rounded-xl px-3 py-1.5 text-xs font-bold ${imagenTab === "archivo" ? "bg-plum text-white" : "border-2 border-plum/15 text-plum"}`}
          onClick={() => setImagenTab("archivo")}
        >
          Archivo
        </button>
      </div>
      {imagenTab === "url" ? (
        <FieldLabel label="URL de imagen" className="mt-3">
          <input
            value={imagenUrl}
            onChange={(e) => {
              setImagenUrl(e.target.value)
              setPreview(e.target.value.startsWith("http") ? e.target.value : e.target.value ? `${API_URL}/api/v1/catalogo/media/${e.target.value}` : "")
            }}
            placeholder="https://…"
            className={input}
          />
        </FieldLabel>
      ) : (
        <FieldLabel label="Archivo JPG o PNG (máx. 2 MB)" className="mt-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-plum/25 bg-plum-soft/40 px-4 py-3 text-sm font-semibold text-plum">
            <ImagePlus size={18} aria-hidden />
            {archivo ? archivo.name : "Seleccionar imagen"}
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                setArchivo(f)
                if (f) setPreview(URL.createObjectURL(f))
              }}
            />
          </label>
        </FieldLabel>
      )}
      {preview && (
        <img src={preview} alt="" className="mt-3 max-h-40 rounded-xl border-2 border-plum/10 object-cover" />
      )}
    </div>
  )
}