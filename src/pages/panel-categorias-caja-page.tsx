import { useCallback, useEffect, useState } from "react"
import { Pencil, Plus } from "lucide-react"
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
import type { CategoriaMov, TipoMovimiento } from "../features/caja/types"
import { toast } from "../features/en-desarrollo"
import { api, cuerpoError, mensajeDe } from "../shared/api"

const TIPOS_CAT: { value: TipoMovimiento; label: string }[] = [
  { value: "gasto", label: "Gasto" },
  { value: "transferencia", label: "Transferencia" },
  { value: "ahorro", label: "Ahorro" },
]

export function PanelCategoriasCajaPage() {
  const { accionesModulo } = useAccesos()
  const acciones = accionesModulo("categorias_caja")
  const accionesConceptos = accionesModulo("conceptos")
  const puedeCrear = puedeAccion(acciones, "Crear") || puedeAccion(accionesConceptos, "Crear")
  const puedeEditar = puedeAccion(acciones, "Editar") || puedeAccion(accionesConceptos, "Editar")
  const [items, setItems] = useState<CategoriaMov[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const debQ = useDebounced(q, 300)
  const [modal, setModal] = useState<"new" | number | null>(null)
  const [form, setForm] = useState({
    nombre: "",
    tipo_movimiento: "gasto" as TipoMovimiento,
    descripcion: "",
    estado: true,
    version_fila: 1,
  })
  const [error, setError] = useState("")
  const { run, pending } = useDo()

  const cargar = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), page_size: "15" })
    if (debQ.trim()) qs.set("q", debQ.trim())
    const r = await api(`/api/v1/caja/categorias/?${qs}`)
    if (!r.ok) return toast((await mensajeDe(r)) || "No fue posible cargar categorías.")
    const d = (await r.json()) as { items: CategoriaMov[]; total?: number }
    setItems(d.items ?? [])
    setTotal(d.total ?? d.items?.length ?? 0)
  }, [page, debQ])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])

  const guardar = () =>
    run(async () => {
      if (!form.nombre.trim()) {
        setError("El nombre es obligatorio.")
        return
      }
      const isNew = modal === "new"
      const r = await api(isNew ? "/api/v1/caja/categorias/" : `/api/v1/caja/categorias/${modal}/`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(form),
      })
      if (!r.ok) {
        const err = await cuerpoError(r)
        setError(err.mensaje ?? "No fue posible guardar.")
        return
      }
      toast(((await r.json()) as { mensaje?: string }).mensaje || "Guardado.")
      setModal(null)
      void cargar()
    })

  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Tesorería</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Categorías de caja</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">
        Clasifique gastos, transferencias y ahorros. Los conceptos de caja usan estas categorías al registrar movimientos.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <FieldLabel label="Buscar" className="min-w-[14rem] flex-1">
          <input
            className={input}
            value={q}
            onChange={(e) => {
              setPage(1)
              setQ(e.target.value)
            }}
            placeholder="Nombre"
          />
        </FieldLabel>
        {puedeCrear && (
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setModal("new")
              setForm({ nombre: "", tipo_movimiento: "gasto", descripcion: "", estado: true, version_fila: 1 })
              setError("")
            }}
          >
            <Plus size={16} className="mr-1 inline" /> Nueva categoría
          </button>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-plum/10 bg-paper/80 text-xs uppercase text-ink/60">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Descripción</th>
              <th className="p-3">Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id_categoria_movimiento} className="border-b border-plum/5">
                <td className="p-3 font-semibold">{c.nombre}</td>
                <td className="p-3 capitalize">{c.tipo_movimiento}</td>
                <td className="p-3 text-ink/70">{c.descripcion || "—"}</td>
                <td className="p-3">{c.estado ? "Activa" : "Inactiva"}</td>
                <td className="p-3 text-right">
                  {puedeEditar && (
                    <button
                      type="button"
                      className="rounded-lg p-2 hover:bg-plum/5"
                      aria-label="Editar"
                      onClick={() => {
                        setForm({
                          nombre: c.nombre,
                          tipo_movimiento: String(c.tipo_movimiento).toLowerCase() as TipoMovimiento,
                          descripcion: c.descripcion,
                          estado: c.estado,
                          version_fila: c.version_fila,
                        })
                        setModal(c.id_categoria_movimiento)
                        setError("")
                      }}
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
      {!items.length && <Empty text="Sin categorías. Cree al menos una para registrar conceptos de caja." />}
      <Pager page={page} totalPages={Math.max(1, Math.ceil(total / 15) || 1)} total={total} onPage={setPage} />

      <Modal open={modal !== null} title={modal === "new" ? "Crear categoría" : "Editar categoría"} onClose={() => setModal(null)}>
        <FieldLabel label="Nombre" required>
          <input className={input} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </FieldLabel>
        <FieldLabel label="Tipo" required className="mt-3">
          <select
            className={input}
            value={form.tipo_movimiento}
            onChange={(e) => setForm({ ...form, tipo_movimiento: e.target.value as TipoMovimiento })}
          >
            {TIPOS_CAT.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Descripción" className="mt-3">
          <textarea className={input} rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </FieldLabel>
        {modal !== "new" && (
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.checked })} />
            Activa
          </label>
        )}
        {error && <FormAlert message={error} />}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={() => setModal(null)}>
            Cancelar
          </button>
          <button type="button" className={btnPrimary} disabled={pending} onClick={() => void guardar()}>
            Guardar
          </button>
        </div>
      </Modal>
    </section>
  )
}
