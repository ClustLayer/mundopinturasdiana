import { useCallback, useEffect, useState } from "react"
import { Landmark, Pencil, Plus, Power } from "lucide-react"
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
import { toast } from "../features/en-desarrollo"
import { api, cuerpoError, mensajeDe } from "../shared/api"

const TIPOS = ["Nequi", "Bancolombia", "Davivienda", "NuBanq", "Banco Agrario", "Banco AVVILLAS"] as const

type Cuenta = {
  id_cuenta_bancaria: number
  nombre: string
  tipo_cuenta: string
  numero: string
  estado: boolean
  version_fila: number
}

export function PanelCuentasPage() {
  const { accionesModulo } = useAccesos()
  const acciones = accionesModulo("caja")
  const puedeCrear = puedeAccion(acciones, "Crear")
  const puedeEditar = puedeAccion(acciones, "Editar")
  const [items, setItems] = useState<Cuenta[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const debQ = useDebounced(q, 300)
  const [modal, setModal] = useState<"new" | number | null>(null)
  const [form, setForm] = useState<{ nombre: string; tipo_cuenta: string; numero: string; estado: boolean; version_fila: number }>({
    nombre: "",
    tipo_cuenta: TIPOS[0],
    numero: "",
    estado: true,
    version_fila: 1,
  })
  const [error, setError] = useState("")
  const { run, pending } = useDo()

  const cargar = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), page_size: "15" })
    if (debQ.trim()) qs.set("q", debQ.trim())
    const r = await api(`/api/v1/caja/cuentas/?${qs}`)
    if (!r.ok) return toast((await mensajeDe(r)) || "No fue posible cargar las cuentas.")
    const d = (await r.json()) as { items: Cuenta[]; total: number; mensaje?: string }
    setItems(d.items)
    setTotal(d.total)
  }, [page, debQ])

  const toggleActiva = (c: Cuenta) =>
    run(async () => {
      const r = await api(`/api/v1/caja/cuentas/${c.id_cuenta_bancaria}/`, {
        method: "PATCH",
        body: JSON.stringify({ nombre: c.nombre, tipo_cuenta: c.tipo_cuenta, numero: c.numero, estado: !c.estado, version_fila: c.version_fila }),
      })
      if (!r.ok) {
        toast((await mensajeDe(r)) || "No fue posible actualizar la cuenta.")
        return
      }
      toast(c.estado ? "Cuenta desactivada para el POS." : "Cuenta activada en el POS.")
      void cargar()
    })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])

  const abrirEditar = (c: Cuenta) => {
    setForm({
      nombre: c.nombre,
      tipo_cuenta: c.tipo_cuenta,
      numero: c.numero,
      estado: c.estado,
      version_fila: c.version_fila,
    })
    setModal(c.id_cuenta_bancaria)
    setError("")
  }

  const guardar = () =>
    run(async () => {
      const isNew = modal === "new"
      const r = await api(isNew ? "/api/v1/caja/cuentas/" : `/api/v1/caja/cuentas/${modal}/`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(form),
      })
      if (!r.ok) {
        const err = await cuerpoError(r)
        setError(err.mensaje ?? "No fue posible guardar la cuenta.")
        return
      }
      toast(((await r.json()) as { mensaje: string }).mensaje)
      setModal(null)
      void cargar()
    })

  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Tesorería</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Cuentas bancarias</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">Cuentas habilitadas para registrar transferencias en el punto de venta.</p>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <FieldLabel label="Buscar" className="min-w-[14rem] flex-1">
          <input className={input} value={q} onChange={(e) => { setPage(1); setQ(e.target.value) }} placeholder="Nombre o número" />
        </FieldLabel>
        {puedeCrear && (
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setModal("new")
              setForm({ nombre: "", tipo_cuenta: "Nequi", numero: "", estado: true, version_fila: 1 })
              setError("")
            }}
          >
            <Plus size={16} className="mr-1 inline" /> Nueva cuenta
          </button>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white shadow-[4px_4px_0_0_#371837]/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-plum/10 bg-paper/80 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Número</th>
              <th className="p-3">Estado</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id_cuenta_bancaria} className="border-b border-plum/5 transition-colors hover:bg-plum-soft/30">
                <td className="p-3 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <Landmark size={16} className="text-cyan-dark" aria-hidden />
                    {c.nombre}
                  </span>
                </td>
                <td className="p-3">{c.tipo_cuenta}</td>
                <td className="p-3 font-mono">{c.numero}</td>
                <td className="p-3">{c.estado ? "Activa" : "Inactiva"}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    {puedeEditar && (
                      <button
                        type="button"
                        className={`rounded-lg p-2 hover:bg-plum/5 ${c.estado ? "text-cyan-dark" : "text-ink/40"}`}
                        title={c.estado ? "Desactivar en POS" : "Activar en POS"}
                        onClick={() => void toggleActiva(c)}
                      >
                        <Power size={16} />
                      </button>
                    )}
                    {puedeEditar && (
                      <button type="button" className="rounded-lg p-2 hover:bg-plum/5" title="Editar" onClick={() => abrirEditar(c)}>
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <Empty text="No hay cuentas registradas." />}
      </div>
      <Pager page={page} total={total} totalPages={Math.max(1, Math.ceil(total / 15))} onPage={setPage} />

      <Modal open={modal !== null} title={modal === "new" ? "Crear cuenta" : "Editar cuenta"} onClose={() => setModal(null)}>
        <FieldLabel label="Nombre" required>
          <input className={input} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Nequi Almacén" />
        </FieldLabel>
        <FieldLabel label="Tipo" required className="mt-3">
          <select className={input} value={form.tipo_cuenta} onChange={(e) => setForm({ ...form, tipo_cuenta: e.target.value })}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Número de cuenta" required className="mt-3">
          <input className={input} value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
        </FieldLabel>
        {modal !== "new" && (
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.checked })} />
            Cuenta activa
          </label>
        )}
        {error && <FormAlert message={error} />}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={() => setModal(null)}>Cancelar</button>
          <button type="button" className={btnPrimary} disabled={pending} onClick={() => void guardar()}>Guardar</button>
        </div>
      </Modal>
    </section>
  )
}