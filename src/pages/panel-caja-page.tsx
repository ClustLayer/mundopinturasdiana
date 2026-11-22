import { useCallback, useEffect, useState } from "react"
import { CashModule } from "../components/panel/cash-module"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import { bogotaDay, money } from "../features/caja/format"
import type { ConceptoMov, CuadreCaja, MovimientoCaja } from "../features/caja/types"
import { toast } from "../features/en-desarrollo"
import { api, mensajeDe } from "../shared/api"

const cuadreVacio = (fecha: string, sede = ""): CuadreCaja => ({
  fecha,
  id_sede: 0,
  sede,
  estado_jornada: "ABIERTO",
  cerrado: false,
  base_inicial: 0,
  ventas_efectivo: 0,
  ventas_transferencia: 0,
  ventas_tarjeta: 0,
  adiciones: 0,
  gastos: 0,
  ahorros: 0,
  transferencias: 0,
  entrega: 0,
  entrega_nota: "",
  efectivo_esperado: 0,
  ventas_registrada: false,
  cantidad_ventas: 0,
})

export function PanelCajaPage() {
  const { accionesModulo } = useAccesos()
  const acciones = accionesModulo("caja")
  const puedeCrear = puedeAccion(acciones, "Crear")
  const puedeEditar = puedeAccion(acciones, "Editar")
  const [tab, setTab] = useState<"gasto" | "ahorro">("gasto")
  const [sedes, setSedes] = useState<{ id_sede: number; nombre: string }[]>([])
  const [idSede, setIdSede] = useState("")
  const [conceptos, setConceptos] = useState<ConceptoMov[]>([])
  const [movs, setMovs] = useState<MovimientoCaja[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [cuadre, setCuadre] = useState<CuadreCaja>(() => cuadreVacio(bogotaDay()))

  const cargarCuadre = useCallback(async () => {
    if (!idSede) return
    const r = await api(`/api/v1/caja/reporte/cuadre/?id_sede=${idSede}`)
    if (!r.ok) return
    const d = (await r.json()) as CuadreCaja
    setCuadre(d)
  }, [idSede])

  const cargarMovs = useCallback(async () => {
    if (!idSede) return
    const qs = new URLSearchParams({ page: String(page), page_size: "15", pestana: tab, id_sede: idSede })
    const r = await api(`/api/v1/caja/movimientos/gastos-ahorros/?${qs}`)
    if (!r.ok) {
      toast((await mensajeDe(r)) || "No fue posible cargar los movimientos.")
      return
    }
    const d = (await r.json()) as { items: MovimientoCaja[]; total: number }
    setMovs(d.items ?? [])
    setTotal(d.total ?? 0)
  }, [idSede, page, tab])

  const cargarConceptos = useCallback(async () => {
    const r = await api("/api/v1/caja/conceptos/?page=1&page_size=200&estado=activo")
    if (r.ok) setConceptos(((await r.json()) as { items: ConceptoMov[] }).items ?? [])
  }, [])

  useEffect(() => {
    void api("/api/v1/sedes/gestion/?page=1&page_size=200&estado=activo").then(async (r) => {
      if (!r.ok) return
      const d = (await r.json()) as { items: { id_sede: number; nombre: string }[] }
      const list = d.items ?? []
      setSedes(list)
      if (list[0]) setIdSede(String(list[0].id_sede))
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargarConceptos()
  }, [cargarConceptos])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargarMovs()
  }, [cargarMovs])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargarCuadre()
    const t = window.setInterval(() => void cargarCuadre(), 12_000)
    return () => window.clearInterval(t)
  }, [cargarCuadre])

  useEffect(() => {
    if (!idSede) return
    void api("/api/v1/caja/jornada/apertura/", {
      method: "POST",
      body: JSON.stringify({ id_sede: Number(idSede), fecha: bogotaDay() }),
    }).then(() => void cargarCuadre())
  }, [idSede, cargarCuadre])

  const refrescar = () => {
    void cargarMovs()
    void cargarCuadre()
  }

  const onCreate = async (body: Parameters<typeof CashModule>[0]["onCreate"] extends (b: infer B) => unknown ? B : never) => {
    const r = await api("/api/v1/caja/movimientos/gastos-ahorros/", { method: "POST", body: JSON.stringify(body) })
    const msg = await mensajeDe(r)
    if (!r.ok) {
      toast(msg || "No fue posible registrar el movimiento.")
      return false
    }
    toast(msg || "Movimiento registrado.")
    refrescar()
    return true
  }

  const onUpdate = async (id: number, body: { id_concepto_movimiento?: number; valor: number; detalle: string }) => {
    const r = await api(`/api/v1/caja/movimientos/gasto/${id}/corregir/`, { method: "POST", body: JSON.stringify(body) })
    const msg = await mensajeDe(r)
    if (!r.ok) {
      toast(msg || "No fue posible actualizar el movimiento.")
      return false
    }
    toast(msg || "Movimiento actualizado.")
    refrescar()
    return true
  }

  const onDelete = async (id: number) => {
    const r = await api(`/api/v1/caja/movimientos/gasto/${id}/corregir/`, {
      method: "POST",
      body: JSON.stringify({ eliminar: true }),
    })
    const msg = await mensajeDe(r)
    if (!r.ok) {
      toast(msg || "No fue posible eliminar el movimiento.")
      return false
    }
    toast(msg || "Movimiento eliminado.")
    refrescar()
    return true
  }

  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Tesorería</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Caja</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">
        Elige un concepto para precargar categoría, valor y detalle; todo es editable. Las transferencias quedan bloqueadas.
      </p>
      <p className="mt-3 rounded-xl border-2 border-cyan/25 bg-cyan/5 px-4 py-2 text-sm font-semibold text-plum" role="status" aria-live="polite">
        Cuadre en vivo · efectivo esperado: {money(cuadre.efectivo_esperado)}
      </p>
      <div className="mt-8">
        <CashModule
          tab={tab}
          onTab={(t) => {
            setTab(t)
            setPage(1)
          }}
          movements={movs}
          concepts={conceptos}
          sedes={sedes}
          idSede={idSede}
          onSede={setIdSede}
          expected={cuadre.efectivo_esperado}
          jornadaCerrada={cuadre.cerrado}
          page={page}
          total={total}
          onPage={setPage}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          puedeEditar={puedeCrear || puedeEditar}
        />
      </div>
    </section>
  )
}