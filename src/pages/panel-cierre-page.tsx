import { useCallback, useEffect, useState } from "react"
import { CierreModule } from "../components/panel/cierre-module"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import { bogotaDay } from "../features/caja/format"
import type { CuadreCaja } from "../features/caja/types"
import { toast } from "../features/en-desarrollo"
import { api, mensajeDe } from "../shared/api"

export function PanelCierrePage() {
  const { accionesModulo } = useAccesos()
  const puedeCerrar = puedeAccion(accionesModulo("cierre"), "Crear") || puedeAccion(accionesModulo("cierre"), "Total")
  const [idSede, setIdSede] = useState("")
  const [sedes, setSedes] = useState<{ id_sede: number; nombre: string }[]>([])
  const [cuadre, setCuadre] = useState<CuadreCaja | null>(null)

  const cargar = useCallback(async () => {
    if (!idSede) return
    const r = await api(`/api/v1/caja/reporte/cuadre/?id_sede=${idSede}`)
    if (!r.ok) {
      toast((await mensajeDe(r)) || "No fue posible cargar el cuadre de la jornada.")
      return
    }
    setCuadre((await r.json()) as CuadreCaja)
  }, [idSede])

  useEffect(() => {
    void api("/api/v1/sedes/gestion/?page=1&page_size=200&estado=activo").then(async (r) => {
      if (!r.ok) return
      const d = (await r.json()) as { items: { id_sede: number; nombre: string }[] }
      const list = d.items ?? []
      setSedes(list)
      if (list[0]) setIdSede(String(list[0].id_sede))
    })
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
    const t = window.setInterval(() => void cargar(), 10_000)
    return () => window.clearInterval(t)
  }, [cargar])

  const onSaveBase = async (base: number) => {
    const r = await api("/api/v1/caja/jornada/base-inicial/", {
      method: "POST",
      body: JSON.stringify({ id_sede: Number(idSede), base_inicial: base }),
    })
    if (!r.ok) {
      toast((await mensajeDe(r)) || "No fue posible guardar la base.")
      return false
    }
    void cargar()
    return true
  }

  const onSaveEntrega = async (entrega: number, nota: string) => {
    const r = await api("/api/v1/caja/entregas/", {
      method: "POST",
      body: JSON.stringify({ id_sede: Number(idSede), valor: entrega, detalle: nota }),
    })
    if (!r.ok) {
      toast((await mensajeDe(r)) || "No fue posible guardar la entrega.")
      return false
    }
    void cargar()
    return true
  }

  const onVentaRegistrada = async (registrada: boolean) => {
    const r = await api("/api/v1/caja/reporte/venta-registrada/", {
      method: "PATCH",
      body: JSON.stringify({ id_sede: Number(idSede), venta_registrada: registrada }),
    })
    if (!r.ok) {
      toast((await mensajeDe(r)) || "No fue posible actualizar el estado de venta.")
      return false
    }
    void cargar()
    return true
  }

  const onCierre = async (body: { efectivo_contado: number; observaciones: string }) => {
    const r = await api("/api/v1/caja/reporte/cierre/", {
      method: "POST",
      body: JSON.stringify({ id_sede: Number(idSede), fecha: bogotaDay(), ...body }),
    })
    const msg = await mensajeDe(r)
    if (!r.ok) {
      toast(msg || "No fue posible cerrar la jornada.")
      return false
    }
    toast(msg || "Jornada cerrada.")
    void cargar()
    return true
  }

  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Tesorería</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Cierre de jornada</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">
        Efectivo = base + ventas en efectivo + adiciones − (gastos + ahorros + transferencias) − entrega.
      </p>
      <div className="mt-6 max-w-xs">
        <label className="block text-sm font-semibold">
          Sede
          <select className="mt-1 w-full rounded-xl border-2 border-plum/15 px-3 py-2.5 text-sm" value={idSede} onChange={(e) => setIdSede(e.target.value)}>
            {sedes.map((s) => (
              <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
            ))}
          </select>
        </label>
      </div>
      {cuadre && (
        <div className="mt-8">
          <CierreModule
            cuadre={cuadre}
            onSaveBase={onSaveBase}
            onSaveEntrega={onSaveEntrega}
            onVentaRegistrada={onVentaRegistrada}
            onCierre={onCierre}
            puedeCerrar={puedeCerrar}
          />
        </div>
      )}
    </section>
  )
}