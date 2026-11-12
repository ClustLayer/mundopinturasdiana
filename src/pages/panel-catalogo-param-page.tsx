import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Pencil, Plus, Search } from "lucide-react"
import {
  Confirm,
  Empty,
  FieldLabel,
  FormAlert,
  Modal,
  btnGhost,
  btnPrimary,
  input,
  inputInvalid,
  useDo,
} from "../components/panel/kit"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import { toast } from "../features/en-desarrollo"
import { api, mensajeDe } from "../shared/api"

export type ParamTipo = "categorias" | "marcas" | "tipos"

type Param = {
  id: number
  nombre: string
  descripcion: string
  estado: boolean
  version_fila: number
  afecta_venta_diaria?: boolean
  es_base?: boolean
}

const META: Record<
  ParamTipo,
  { titulo: string; blurb: string; nombrePh: string; descPh: string; singular: string }
> = {
  categorias: {
    titulo: "Categorías de producto",
    blurb: "Taxonomía que se elige en Productos y organiza el catálogo y los carruseles.",
    nombrePh: "Ej. Vinilos",
    descPh: "Breve descripción de la categoría",
    singular: "categoría",
  },
  marcas: {
    titulo: "Marcas",
    blurb: "Fabricantes y líneas comerciales asociadas a cada producto del catálogo.",
    nombrePh: "Ej. Diana",
    descPh: "Breve descripción de la marca",
    singular: "marca",
  },
  tipos: {
    titulo: "Tipos de producto",
    blurb: "Clasificación operativa (terminado, insumo, servicio). Los tipos base vienen precargados.",
    nombrePh: "Ej. Insumo especial",
    descPh: "Breve descripción del tipo",
    singular: "tipo",
  },
}

export function PanelCatalogoParamPage({ tipo }: { tipo: ParamTipo }) {
  const meta = META[tipo]
  const { accionesModulo } = useAccesos()
  const acciones = accionesModulo("productos").length ? accionesModulo("productos") : accionesModulo("categorias")
  const puedeCrear = puedeAccion(acciones, "Crear")
  const puedeEditar = puedeAccion(acciones, "Editar")
  const [q, setQ] = useState("")
  const [items, setItems] = useState<Param[]>([])
  const [edit, setEdit] = useState<Param | "new" | null>(null)
  const [estadoTarget, setEstadoTarget] = useState<Param | null>(null)
  const { run, pending } = useDo()

  const cargar = useCallback(async () => {
    const r = await api(`/api/v1/catalogo/parametros/${tipo}/`)
    if (!r.ok) return
    setItems(((await r.json()) as { items: Param[] }).items)
  }, [tipo])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return items
    return items.filter((it) => it.nombre.toLowerCase().includes(t) || (it.descripcion || "").toLowerCase().includes(t))
  }, [items, q])

  return (
    <section className="mx-auto max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Catálogo de productos</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">{meta.titulo}</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">{meta.blurb}</p>

      <div className="relative mt-6 max-w-md">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plum/50" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Buscar ${meta.singular}…`}
          className={`${input} !mt-0 pl-9`}
        />
      </div>

      <div className="mt-4 flex justify-end">
        {puedeCrear && (
          <button type="button" className={btnPrimary} onClick={() => setEdit("new")}>
            <Plus size={16} /> Nuevo
          </button>
        )}
      </div>

      {filtrados.length === 0 ? (
        <Empty text={q.trim() ? "No hay coincidencias." : "No hay registros."} />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-plum/10 text-xs uppercase tracking-wide text-ink/55">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Descripción</th>
                {tipo === "tipos" && <th className="px-4 py-3">Afecta venta diaria</th>}
                {tipo === "tipos" && <th className="px-4 py-3">Base</th>}
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 w-16" aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {filtrados.map((it) => (
                <tr key={it.id} className="border-t border-plum/5">
                  <td className="px-4 py-3 font-semibold">{it.nombre}</td>
                  <td className="px-4 py-3 text-ink/70">{it.descripcion || "—"}</td>
                  {tipo === "tipos" && <td className="px-4 py-3">{it.afecta_venta_diaria ? "Sí" : "No"}</td>}
                  {tipo === "tipos" && <td className="px-4 py-3">{it.es_base ? "Sí" : "—"}</td>}
                  <td className="px-4 py-3">{it.estado ? "Activo" : "Inactivo"}</td>
                  <td className="px-4 py-3">
                    {puedeEditar && (
                      <button
                        type="button"
                        className="rounded-lg p-2 hover:bg-plum-soft"
                        aria-label={`Editar ${it.nombre}`}
                        onClick={() => setEdit(it)}
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {edit && (
        <ParamForm
          tipo={tipo}
          meta={meta}
          row={edit === "new" ? null : edit}
          pending={pending}
          onClose={() => setEdit(null)}
          onRequestEstado={(row, nuevo) => setEstadoTarget({ ...row, estado: nuevo })}
          onSave={(payload) =>
            void run(async () => {
              const r = await api(
                edit === "new" ? `/api/v1/catalogo/parametros/${tipo}/` : `/api/v1/catalogo/parametros/${tipo}/${(edit as Param).id}/`,
                {
                  method: edit === "new" ? "POST" : "PATCH",
                  body: JSON.stringify(payload),
                },
              )
              const msg = await mensajeDe(r)
              if (!r.ok) {
                toast(msg || (edit === "new" ? "No fue posible guardar el registro. Intente nuevamente." : "No fue posible actualizar el registro. Intente nuevamente."))
                return
              }
              toast(msg)
              setEdit(null)
              void cargar()
            })
          }
        />
      )}

      <Confirm
        open={estadoTarget !== null}
        title="Cambiar estado"
        text="¿Está seguro de que desea cambiar el estado de este producto?"
        onNo={() => setEstadoTarget(null)}
        onYes={() => {
          if (!estadoTarget) return
          void run(async () => {
            const r = await api(`/api/v1/catalogo/parametros/${tipo}/${estadoTarget.id}/`, {
              method: "PATCH",
              body: JSON.stringify({
                nombre: estadoTarget.nombre,
                descripcion: estadoTarget.descripcion,
                estado: estadoTarget.estado,
                afecta_venta_diaria: estadoTarget.afecta_venta_diaria ?? true,
                version_fila: estadoTarget.version_fila,
              }),
            })
            const msg = await mensajeDe(r)
            if (!r.ok) {
              toast(msg || "No fue posible actualizar el registro. Intente nuevamente.")
              return
            }
            toast(msg)
            setEstadoTarget(null)
            void cargar()
          })
        }}
      />
    </section>
  )
}

function ParamForm({
  tipo,
  meta,
  row,
  pending,
  onClose,
  onSave,
  onRequestEstado,
}: {
  tipo: ParamTipo
  meta: (typeof META)[ParamTipo]
  row: Param | null
  pending: boolean
  onClose: () => void
  onSave: (p: Record<string, unknown>) => void
  onRequestEstado: (row: Param, estado: boolean) => void
}) {
  const [nombre, setNombre] = useState(row?.nombre ?? "")
  const [descripcion, setDescripcion] = useState(row?.descripcion ?? "")
  const [estado, setEstado] = useState(row?.estado ?? true)
  const [afecta, setAfecta] = useState(row?.afecta_venta_diaria ?? true)
  const [error, setError] = useState("")
  const [invalid, setInvalid] = useState<Set<string>>(new Set())

  const validar = () => {
    const next = new Set<string>()
    if (!nombre.trim()) next.add("nombre")
    if (next.size) {
      setInvalid(next)
      setError("El nombre es obligatorio.")
      return false
    }
    setInvalid(new Set())
    setError("")
    return true
  }

  return (
    <Modal open title={row ? `Editar ${meta.singular}` : `Nueva ${meta.singular}`} onClose={onClose} wide>
      <FormAlert message={error} />
      <FieldLabel label="Nombre" required className="mt-1">
        <input
          className={invalid.has("nombre") ? inputInvalid : input}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={meta.nombrePh}
          aria-invalid={invalid.has("nombre")}
          maxLength={255}
        />
      </FieldLabel>
      <FieldLabel label="Descripción" className="mt-3">
        <textarea
          className={input}
          rows={2}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder={meta.descPh}
        />
      </FieldLabel>
      {tipo === "tipos" && (
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={afecta} onChange={(e) => setAfecta(e.target.checked)} /> Afecta venta diaria
          <span className="text-brand"> *</span>
        </label>
      )}
      {row && !row.es_base && (
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={estado}
            onChange={(e) => {
              const v = e.target.checked
              if (row.estado && !v) onRequestEstado(row, v)
              else setEstado(v)
            }}
          />{" "}
          Activo
        </label>
      )}
      {row?.es_base && <p className="mt-3 text-sm text-ink/60">Los tipos base no pueden desactivarse ni eliminarse.</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className={btnGhost} onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className={btnPrimary}
          disabled={pending}
          onClick={() => {
            if (!validar()) return
            onSave({ nombre: nombre.trim(), descripcion, estado, afecta_venta_diaria: afecta, version_fila: row?.version_fila ?? 1 })
          }}
        >
          {pending ? <Loader2 className="animate-spin" size={16} /> : "Guardar"}
        </button>
      </div>
    </Modal>
  )
}
