import { useCallback, useEffect, useState } from "react"
import { Download } from "lucide-react"
import { Empty, FieldLabel, Modal, Pager, btnGhost, btnPrimary, input } from "../components/panel/kit"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import { money } from "../features/caja/format"
import type { CierreHistorial } from "../features/caja/types"
import { toast } from "../features/en-desarrollo"
import { api, mensajeDe } from "../shared/api"

export function PanelHistorialArqueosPage() {
  const { accionesModulo } = useAccesos()
  const puedeExportar = puedeAccion(accionesModulo("cierre"), "Exportar") || puedeAccion(accionesModulo("cierre"), "Consultar")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [idSede, setIdSede] = useState("")
  const [estado, setEstado] = useState("")
  const [sedes, setSedes] = useState<{ id_sede: number; nombre: string }[]>([])
  const [items, setItems] = useState<CierreHistorial[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [exportOpen, setExportOpen] = useState(false)

  const cargar = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), page_size: "20" })
    if (desde) qs.set("desde", desde)
    if (hasta) qs.set("hasta", hasta)
    if (idSede) qs.set("id_sede", idSede)
    if (estado) qs.set("estado", estado)
    const r = await api(`/api/v1/caja/historial/?${qs}`)
    if (!r.ok) {
      toast((await mensajeDe(r)) || "No fue posible cargar el historial.")
      return
    }
    const d = (await r.json()) as { items: CierreHistorial[]; total: number }
    setItems(d.items ?? [])
    setTotal(d.total ?? 0)
  }, [desde, hasta, idSede, estado, page])

  useEffect(() => {
    void api("/api/v1/sedes/gestion/?page=1&page_size=200&estado=activo").then(async (r) => {
      if (!r.ok) return
      setSedes(((await r.json()) as { items: { id_sede: number; nombre: string }[] }).items ?? [])
    })
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])

  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Tesorería</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Historial de arqueos</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">Consulta cierres anteriores, diferencias y exporta reportes.</p>

      <form
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          void cargar()
        }}
      >
        <FieldLabel label="Desde" className="w-40">
          <input type="date" className={input} value={desde} onChange={(e) => setDesde(e.target.value)} />
        </FieldLabel>
        <FieldLabel label="Hasta" className="w-40">
          <input type="date" className={input} value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </FieldLabel>
        <FieldLabel label="Sede" className="w-48">
          <select className={input} value={idSede} onChange={(e) => setIdSede(e.target.value)}>
            <option value="">Todas</option>
            {sedes.map((s) => (
              <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Estado" className="w-40">
          <select className={input} value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="CERRADO">Cerrado</option>
            <option value="ABIERTO">Abierto</option>
          </select>
        </FieldLabel>
        <button type="submit" className={btnGhost}>Filtrar</button>
        {puedeExportar && (
          <button type="button" className={btnPrimary} onClick={() => setExportOpen(true)}>
            <Download size={16} className="mr-1 inline" /> Exportar
          </button>
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-plum">
            <tr>
              <th className="py-2 pl-3">Día</th>
              <th>Sede</th>
              <th className="text-right">Base</th>
              <th className="text-right">Entrega</th>
              <th className="text-right">Esperado</th>
              <th className="text-right">Contado</th>
              <th className="text-right">Diferencia</th>
              <th className="pl-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum/10">
            {items.map((h) => (
              <tr key={h.id_reporte_diario}>
                <td className="py-2.5 pl-3 font-semibold">{h.fecha}</td>
                <td>{h.sede}</td>
                <td className="text-right">{money(h.base_inicial)}</td>
                <td className="text-right">{money(h.entrega)}</td>
                <td className="text-right">{money(h.efectivo_esperado)}</td>
                <td className="text-right">{money(h.efectivo_declarado)}</td>
                <td className={`text-right font-bold ${Number(h.diferencia) === 0 ? "text-emerald-700" : "text-rose-600"}`}>{money(h.diferencia)}</td>
                <td className="pl-4 font-semibold uppercase text-xs">{h.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <Empty text="Aún no hay cierres registrados." />}
      </div>
      <Pager page={page} totalPages={Math.max(1, Math.ceil(total / 20))} total={total} onPage={setPage} />

      {exportOpen && (
        <ExportModal
          onClose={() => setExportOpen(false)}
          desde={desde}
          hasta={hasta}
          idSede={idSede}
          estado={estado}
        />
      )}
    </section>
  )
}

function ExportModal({
  onClose,
  desde,
  hasta,
  idSede,
  estado,
}: {
  onClose: () => void
  desde: string
  hasta: string
  idSede: string
  estado: string
}) {
  const [formato, setFormato] = useState<"xlsx" | "csv">("xlsx")
  const [busy, setBusy] = useState(false)

  const exportar = async () => {
    setBusy(true)
    try {
      const qs = new URLSearchParams({ formato })
      if (desde) qs.set("desde", desde)
      if (hasta) qs.set("hasta", hasta)
      if (idSede) qs.set("id_sede", idSede)
      if (estado) qs.set("estado", estado)
      const r = await api(`/api/v1/caja/historial/export/?${qs}`)
      if (!r.ok) {
        toast((await mensajeDe(r)) || "No fue posible exportar.")
        return
      }
      const blob = await r.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `historial-arqueos.${formato}`
      a.click()
      URL.revokeObjectURL(a.href)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open title="Exportar historial" onClose={onClose}>
      <p className="text-sm text-ink/70">Se aplicarán los mismos filtros de la tabla.</p>
      <FieldLabel label="Formato" className="mt-4">
        <select className={input} value={formato} onChange={(e) => setFormato(e.target.value as "xlsx" | "csv")}>
          <option value="xlsx">Excel (.xlsx)</option>
          <option value="csv">CSV</option>
        </select>
      </FieldLabel>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className={btnGhost} onClick={onClose}>Cancelar</button>
        <button type="button" className={btnPrimary} disabled={busy} onClick={() => void exportar()}>Descargar</button>
      </div>
    </Modal>
  )
}