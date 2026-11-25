import { useCallback, useEffect, useState, type ReactNode } from "react"
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
import { money } from "../features/caja/format"
import type { CategoriaMov, ConceptoMov, TipoMovimiento } from "../features/caja/types"
import { toast } from "../features/en-desarrollo"
import { api, cuerpoError, mensajeDe } from "../shared/api"
import { PanelCuentasPage } from "./panel-cuentas-page"

const TIPOS: { value: TipoMovimiento; label: string }[] = [
  { value: "gasto", label: "Gasto" },
  { value: "transferencia", label: "Transferencia" },
  { value: "ahorro", label: "Ahorro" },
  { value: "adicion", label: "Adición de base" },
]

type Vista = "categorias" | "conceptos" | "cuentas"

export function PanelConceptosPage() {
  const [vista, setVista] = useState<Vista>("conceptos")
  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Tesorería</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Configuración de caja</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">
        Categorías, conceptos frecuentes y cuentas bancarias para el POS y la planilla de movimientos.
      </p>
      <Row className="mt-5 flex flex-wrap gap-2 border-b border-plum/10 pb-3">
        <Tab active={vista === "conceptos"} onClick={() => setVista("conceptos")}>
          Conceptos
        </Tab>
        <Tab active={vista === "categorias"} onClick={() => setVista("categorias")}>
          Categorías
        </Tab>
        <Tab active={vista === "cuentas"} onClick={() => setVista("cuentas")}>
          Cuentas bancarias
        </Tab>
      </Row>
      {vista === "categorias" && <CategoriasPanel />}
      {vista === "conceptos" && <ConceptosPanel />}
      {vista === "cuentas" && (
        <div className="mt-6">
          <PanelCuentasPage embedded />
        </div>
      )}
    </section>
  )
}

function Row({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className}>{children}</div>
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-bold ${active ? "bg-plum text-white" : "text-plum hover:bg-plum-soft"}`}
    >
      {children}
    </button>
  )
}

function CategoriasPanel() {
  const { accionesModulo } = useAccesos()
  const acciones = accionesModulo("conceptos")
  const puedeCrear = puedeAccion(acciones, "Crear")
  const puedeEditar = puedeAccion(acciones, "Editar")
  const [items, setItems] = useState<CategoriaMov[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const debQ = useDebounced(q, 300)
  const [modal, setModal] = useState<"new" | number | null>(null)
  const [form, setForm] = useState({ nombre: "", tipo_movimiento: "gasto" as TipoMovimiento, descripcion: "", estado: true, version_fila: 1 })
  const [error, setError] = useState("")
  const { run, pending } = useDo()

  const cargar = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), page_size: "15" })
    if (debQ.trim()) qs.set("q", debQ.trim())
    const r = await api(`/api/v1/caja/categorias/?${qs}`)
    if (!r.ok) return toast((await mensajeDe(r)) || "No fue posible cargar categorías.")
    const d = (await r.json()) as { items: CategoriaMov[]; total: number }
    setItems(d.items)
    setTotal(d.total)
  }, [page, debQ])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])

  const guardar = () =>
    run(async () => {
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
    <>
      <div className="mt-6 flex flex-wrap gap-3">
        <FieldLabel label="Buscar" className="min-w-[14rem] flex-1">
          <input className={input} value={q} onChange={(e) => { setPage(1); setQ(e.target.value) }} placeholder="Nombre" />
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
      <TablaCat items={items} puedeEditar={puedeEditar} onEdit={(c) => { setForm({ nombre: c.nombre, tipo_movimiento: c.tipo_movimiento, descripcion: c.descripcion, estado: c.estado, version_fila: c.version_fila }); setModal(c.id_categoria_movimiento); setError("") }} />
      {!items.length && <Empty text="Sin categorías." />}
      <Pager page={page} totalPages={Math.max(1, Math.ceil(total / 15))} total={total} onPage={setPage} />
      <Modal open={modal !== null} title={modal === "new" ? "Crear categoría" : "Editar categoría"} onClose={() => setModal(null)}>
        <FieldLabel label="Nombre" required>
          <input className={input} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </FieldLabel>
        <FieldLabel label="Tipo" required className="mt-3">
          <select className={input} value={form.tipo_movimiento} onChange={(e) => setForm({ ...form, tipo_movimiento: e.target.value as TipoMovimiento })}>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
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
          <button type="button" className={btnGhost} onClick={() => setModal(null)}>Cancelar</button>
          <button type="button" className={btnPrimary} disabled={pending} onClick={() => void guardar()}>Guardar</button>
        </div>
      </Modal>
    </>
  )
}

function TablaCat({ items, puedeEditar, onEdit }: { items: CategoriaMov[]; puedeEditar: boolean; onEdit: (c: CategoriaMov) => void }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-plum/10 bg-paper/80 text-xs uppercase text-ink/60">
          <tr>
            <th className="p-3">Nombre</th>
            <th className="p-3">Tipo</th>
            <th className="p-3">Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id_categoria_movimiento} className="border-b border-plum/5">
              <td className="p-3 font-semibold">{c.nombre}</td>
              <td className="p-3 capitalize">{c.tipo_movimiento}</td>
              <td className="p-3">{c.estado ? "Activa" : "Inactiva"}</td>
              <td className="p-3 text-right">
                {puedeEditar && (
                  <button type="button" className="rounded-lg p-2 hover:bg-plum/5" onClick={() => onEdit(c)} aria-label="Editar">
                    <Pencil size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ConceptosPanel() {
  const { accionesModulo } = useAccesos()
  const acciones = accionesModulo("conceptos")
  const puedeCrear = puedeAccion(acciones, "Crear")
  const puedeEditar = puedeAccion(acciones, "Editar")
  const [cats, setCats] = useState<CategoriaMov[]>([])
  const [items, setItems] = useState<ConceptoMov[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const debQ = useDebounced(q, 300)
  const [modal, setModal] = useState<"new" | number | null>(null)
  const [form, setForm] = useState({
    nombre: "",
    id_categoria_movimiento: "",
    valor_sugerido: "",
    detalle_sugerido: "",
    estado: true,
    version_fila: 1,
  })
  const [error, setError] = useState("")
  const { run, pending } = useDo()

  const cargar = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), page_size: "15" })
    if (debQ.trim()) qs.set("q", debQ.trim())
    const r = await api(`/api/v1/caja/conceptos/?${qs}`)
    if (!r.ok) return toast((await mensajeDe(r)) || "No fue posible cargar conceptos.")
    const d = (await r.json()) as { items: ConceptoMov[]; total: number }
    setItems(d.items)
    setTotal(d.total)
  }, [page, debQ])

  useEffect(() => {
    void api("/api/v1/caja/categorias/?page=1&page_size=200&estado=activo").then(async (r) => {
      if (r.ok) setCats(((await r.json()) as { items: CategoriaMov[] }).items ?? [])
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])

  const guardar = () =>
    run(async () => {
      const body = {
        ...form,
        id_categoria_movimiento: Number(form.id_categoria_movimiento),
        valor_sugerido: form.valor_sugerido ? Number(form.valor_sugerido) : null,
      }
      const isNew = modal === "new"
      const r = await api(isNew ? "/api/v1/caja/conceptos/" : `/api/v1/caja/conceptos/${modal}/`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(body),
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
    <>
      <div className="mt-6 flex flex-wrap gap-3">
        <FieldLabel label="Buscar" className="min-w-[14rem] flex-1">
          <input className={input} value={q} onChange={(e) => { setPage(1); setQ(e.target.value) }} placeholder="Nombre del concepto" />
        </FieldLabel>
        {puedeCrear && (
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setModal("new")
              setForm({ nombre: "", id_categoria_movimiento: cats[0] ? String(cats[0].id_categoria_movimiento) : "", valor_sugerido: "", detalle_sugerido: "", estado: true, version_fila: 1 })
              setError("")
            }}
          >
            <Plus size={16} className="mr-1 inline" /> Nuevo concepto
          </button>
        )}
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-plum/10 bg-paper/80 text-xs uppercase text-ink/60">
            <tr>
              <th className="p-3">Concepto</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Valor sugerido</th>
              <th className="p-3">Activo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id_concepto_movimiento} className="border-b border-plum/5">
                <td className="p-3 font-semibold">{c.nombre}</td>
                <td className="p-3">{c.categoria_nombre}</td>
                <td className="p-3">{c.valor_sugerido != null && c.valor_sugerido !== "" ? money(c.valor_sugerido) : "—"}</td>
                <td className="p-3">{c.estado ? "Sí" : "No"}</td>
                <td className="p-3 text-right">
                  {puedeEditar && (
                    <button
                      type="button"
                      className="rounded-lg p-2 hover:bg-plum/5"
                      onClick={() => {
                        setForm({
                          nombre: c.nombre,
                          id_categoria_movimiento: String(c.id_categoria_movimiento),
                          valor_sugerido: c.valor_sugerido != null ? String(c.valor_sugerido) : "",
                          detalle_sugerido: c.detalle_sugerido ?? "",
                          estado: c.estado,
                          version_fila: c.version_fila,
                        })
                        setModal(c.id_concepto_movimiento)
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
        {!items.length && <Empty text="Sin conceptos." />}
      </div>
      <Pager page={page} totalPages={Math.max(1, Math.ceil(total / 15))} total={total} onPage={setPage} />
      <Modal open={modal !== null} title={modal === "new" ? "Crear concepto" : "Editar concepto"} onClose={() => setModal(null)}>
        <FieldLabel label="Nombre" required>
          <input className={input} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </FieldLabel>
        <FieldLabel label="Categoría" required className="mt-3">
          <select className={input} value={form.id_categoria_movimiento} onChange={(e) => setForm({ ...form, id_categoria_movimiento: e.target.value })}>
            <option value="">Seleccione</option>
            {cats.map((c) => (
              <option key={c.id_categoria_movimiento} value={c.id_categoria_movimiento}>{c.nombre}</option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Valor sugerido (opcional)" className="mt-3">
          <input type="number" min={0} className={input} value={form.valor_sugerido} onChange={(e) => setForm({ ...form, valor_sugerido: e.target.value })} />
        </FieldLabel>
        <FieldLabel label="Detalle sugerido" className="mt-3">
          <input className={input} value={form.detalle_sugerido} onChange={(e) => setForm({ ...form, detalle_sugerido: e.target.value })} />
        </FieldLabel>
        {modal !== "new" && (
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.checked })} />
            Concepto activo
          </label>
        )}
        {error && <FormAlert message={error} />}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={() => setModal(null)}>Cancelar</button>
          <button type="button" className={btnPrimary} disabled={pending} onClick={() => void guardar()}>Guardar</button>
        </div>
      </Modal>
    </>
  )
}