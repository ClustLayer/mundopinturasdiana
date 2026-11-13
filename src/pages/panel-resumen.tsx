import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, ArrowUpRight, Banknote, Bell, FileCheck2, ShoppingBag, Truck } from "lucide-react"
import { rutaDeRol } from "../features/auth/logic"
import { useApp } from "../app/providers"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import { formatCOPClient } from "../lib/format"
import { getTodaySalesSummary } from "../lib/public-data"
import { Panel } from "../components/panel/kit"
import { Blob } from "../components/ui/splash"
import { avisoEnDesarrollo } from "../features/en-desarrollo"
import { saludoColombia } from "../lib/saludo"
import { api } from "../shared/api"

type PanelResumenPayload = {
  inventario?: { bajo_stock_minimo: number; alertas: string[] }
  actividad_reciente?: {
    id_auditoria: number
    fecha_hora: string | null
    accion: string
    entidad: string
    resumen: string
    usuario?: { nombre: string }
  }[]
}

export function PanelResumenPage() {
  const { sesion } = useApp()
  const { accionesModulo, puedeModulo } = useAccesos()
  const [data, setData] = useState<PanelResumenPayload | null>(null)

  useEffect(() => {
    if (!sesion) return
    void api("/api/v1/auth/panel-resumen/").then(async (r) => {
      if (!r.ok) return
      setData((await r.json()) as PanelResumenPayload)
    })
  }, [sesion])

  if (!sesion) return null
  const base = rutaDeRol(sesion.rol)
  const role = sesion.rol.toLowerCase()
  const isEmp = sesion.rol === "Empleado"
  const { count, total } = getTodaySalesSummary()
  const greet = saludoColombia()

  const accionesInv = accionesModulo("inventario")
  const puedeInventario =
    Boolean(data?.inventario) ||
    (accionesInv.length === 0 && puedeModulo("inventario")) ||
    puedeAccion(accionesInv, "Consultar")

  const accionesAud = accionesModulo("auditoria")
  const puedeActividad =
    Boolean(data?.actividad_reciente) ||
    (accionesAud.length === 0 && puedeModulo("auditoria")) ||
    puedeAccion(accionesAud, "Consultar")

  const low = data?.inventario?.bajo_stock_minimo
  const muestraInventario = Boolean(data?.inventario) || puedeInventario
  const muestraActividad = Boolean(data?.actividad_reciente) || puedeActividad

  const kpi = [
    {
      l: isEmp ? "Total vendido hoy" : "Ventas de hoy",
      v: formatCOPClient(total),
      s: isEmp ? "lo que llevas registrado hoy" : `${count} venta${count === 1 ? "" : "s"}`,
      Icon: Banknote,
      tone: "bg-brand text-white",
      href: undefined as string | undefined,
    },
    ...(!isEmp
      ? [
          ...(Boolean(data?.inventario) && low !== undefined
            ? [
                {
                  l: "Bajo stock mínimo",
                  v: String(low),
                  s: "productos por reponer",
                  Icon: AlertTriangle,
                  tone: "bg-sun text-ink",
                  href: `${base}/inventario`,
                },
              ]
            : []),
          { l: "Domicilios pendientes", v: "—", s: "por entregar", Icon: Truck, tone: "bg-cyan text-white", href: `${base}/domicilios` },
          { l: "Facturas electrónicas pendientes", v: "—", s: "por gestionar o corregir", Icon: FileCheck2, tone: "bg-plum text-white", href: `${base}/facturacion` },
        ]
      : []),
  ]

  const alertas = data?.inventario?.alertas ?? []
  const actividad = data?.actividad_reciente ?? []

  return (
    <div className="mx-auto max-w-6xl">
      <header className="relative overflow-hidden rounded-3xl bg-plum p-7 text-white sm:p-10">
        <Blob color="#E11D74" className="absolute -right-10 -top-16 size-64 animate-float opacity-70" />
        <p className="relative text-sm font-bold uppercase tracking-widest text-cyan">{role}</p>
        <h1 className="relative mt-1 font-display text-4xl font-extrabold sm:text-5xl">
          {greet}, {sesion.nombre.split(" ")[0]}
        </h1>
        <button type="button" onClick={avisoEnDesarrollo} className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-plum shadow-[4px_4px_0_0_var(--color-brand)] transition hover:-translate-y-0.5">
          <ShoppingBag size={18} /> Nueva venta <ArrowUpRight size={16} />
        </button>
      </header>
      <div className={`mt-6 grid gap-4 ${kpi.length > 3 ? "sm:grid-cols-2 lg:grid-cols-4" : kpi.length === 1 ? "max-w-sm" : "sm:grid-cols-3"}`}>
        {kpi.map(({ l, v, s, Icon, tone, href }) => {
          const body = (
            <>
              <span className={`inline-flex size-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={20} />
              </span>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink/55">{l}</p>
              <p className="font-display text-3xl font-extrabold text-plum">{v}</p>
              <p className="text-xs text-ink/55">{s}</p>
            </>
          )
          return href ? (
            <Link key={l} to={href} className="rounded-2xl border-2 border-plum/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-plum/30">
              {body}
            </Link>
          ) : (
            <div key={l} className="rounded-2xl border-2 border-plum/10 bg-white p-5">
              {body}
            </div>
          )
        })}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {!isEmp && muestraInventario && (
          <Panel title="Alertas de inventario">
            {alertas.length === 0 ? (
              <p className="text-sm text-ink/60">No hay alertas de inventario en este momento.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {alertas.map((a) => (
                  <li key={a} className="rounded-xl border border-sun/40 bg-sun/10 px-3 py-2 font-medium text-ink">
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
        {muestraActividad && (
          <Panel title="Notificaciones" action={<Bell size={18} className="text-plum/60" />}>
            {actividad.length === 0 ? (
              <p className="text-sm text-ink/60">Sin actividad reciente en auditoría.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {actividad.map((row) => (
                  <li key={row.id_auditoria} className="rounded-xl border border-plum/10 bg-paper px-3 py-2">
                    <p className="font-semibold text-plum">
                      {row.accion} · {row.entidad}
                    </p>
                    <p className="text-ink/70">{row.resumen}</p>
                    <p className="mt-1 text-xs text-ink/45">
                      {row.usuario?.nombre || "Sistema"}
                      {row.fecha_hora ? ` · ${new Date(row.fecha_hora).toLocaleString("es-CO")}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </div>
  )
}
