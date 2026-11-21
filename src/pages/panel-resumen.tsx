import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, ArrowUpRight, Banknote, Bell, FileCheck2, Loader2, ShoppingBag, Truck } from "lucide-react"
import { rutaDeRol } from "../features/auth/logic"
import { useApp } from "../app/providers"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import { formatCOPClient } from "../lib/format"
import { Panel, btnGhost } from "../components/panel/kit"
import { Blob } from "../components/ui/splash"
import { saludoColombia } from "../lib/saludo"
import { api } from "../shared/api"
import { toast } from "../features/en-desarrollo"

type PanelResumenPayload = {
  ventas_hoy?: { cantidad: number; total: number }
  domicilios_pendientes?: number
  facturas_electronicas_pendientes?: number
  inventario?: {
    bajo_stock_minimo: number
    alertas: string[]
    productos_bajo_stock?: { codigo: string; nombre: string; nivel: string; stock_total: number }[]
  }
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
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!sesion) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga KPIs del panel
    setCargando(true)
    void api("/api/v1/auth/panel-resumen").then(async (r) => {
      setCargando(false)
      if (!r.ok) {
        toast("No fue posible cargar el resumen del panel.", "error")
        return
      }
      setData((await r.json()) as PanelResumenPayload)
    })
  }, [sesion])

  if (!sesion) return null
  const base = rutaDeRol(sesion.rol)
  const role = sesion.rol.toLowerCase()
  const isEmp = sesion.rol === "Empleado"
  const greet = saludoColombia()

  const ventasHoy = data?.ventas_hoy
  const count = ventasHoy?.cantidad ?? 0
  const total = ventasHoy?.total ?? 0

  const accionesInv = accionesModulo("inventario")
  const puedeInventario =
    Boolean(data?.inventario) || (accionesInv.length === 0 && puedeModulo("inventario")) || puedeAccion(accionesInv, "Consultar")

  const accionesAud = accionesModulo("auditoria")
  const puedeActividad =
    Boolean(data?.actividad_reciente) || (accionesAud.length === 0 && puedeModulo("auditoria")) || puedeAccion(accionesAud, "Consultar")

  const domPend = data?.domicilios_pendientes
  const fePend = data?.facturas_electronicas_pendientes
  const productosBajo = data?.inventario?.productos_bajo_stock ?? data?.inventario?.alertas?.map((a) => ({ codigo: "", nombre: a, nivel: "" })) ?? []
  const actividad = data?.actividad_reciente ?? []

  const kpi = [
    {
      l: isEmp ? "Total vendido hoy" : "Ventas de hoy",
      v: formatCOPClient(total),
      s: isEmp ? "lo que llevas registrado hoy" : `${count} venta${count === 1 ? "" : "s"} · ${formatCOPClient(total)}`,
      Icon: Banknote,
      tone: "bg-brand text-white",
      href: `${base}/ventas`,
    },
    ...(!isEmp
      ? [
          {
            l: "Domicilios pendientes",
            v: domPend !== undefined ? String(domPend) : cargando ? "…" : "0",
            s: "por asignar, en ruta o pendientes de entrega",
            Icon: Truck,
            tone: "bg-cyan text-white",
            href: `${base}/domicilios`,
          },
          {
            l: "Facturas electrónicas pendientes",
            v: fePend !== undefined ? String(fePend) : cargando ? "…" : "0",
            s: "por gestionar o corregir en facturación externa",
            Icon: FileCheck2,
            tone: "bg-plum text-white",
            href: `${base}/facturacion`,
          },
        ]
      : []),
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <header className="relative overflow-hidden rounded-3xl bg-plum p-7 text-white sm:p-10">
        <Blob color="#E11D74" className="absolute -right-10 -top-16 size-64 animate-float opacity-70" />
        <p className="relative text-sm font-bold uppercase tracking-widest text-cyan">{role}</p>
        <h1 className="relative mt-1 font-display text-4xl font-extrabold sm:text-5xl">
          {greet}, {sesion.nombre.split(" ")[0]}
        </h1>
        <Link
          to={`${base}/pos`}
          className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-plum shadow-[4px_4px_0_0_var(--color-brand)] transition hover:-translate-y-0.5"
        >
          <ShoppingBag size={18} /> Nueva venta <ArrowUpRight size={16} />
        </Link>
      </header>

      {cargando && (
        <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-plum">
          <Loader2 className="size-4 animate-spin" /> Cargando indicadores…
        </p>
      )}

      <div className={`mt-6 grid gap-4 ${kpi.length > 2 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
        {kpi.map(({ l, v, s, Icon, tone, href }) => (
          <Link key={l} to={href} className="rounded-2xl border-2 border-plum/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-plum/30 hover:shadow-md">
            <span className={`inline-flex size-10 items-center justify-center rounded-xl ${tone}`}>
              <Icon size={20} />
            </span>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink/55">{l}</p>
            <p className="font-display text-3xl font-extrabold text-plum">{v}</p>
            <p className="text-xs text-ink/55">{s}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {!isEmp && puedeInventario && (
          <Panel
            title="Alertas de inventario"
            action={
              <Link to={`${base}/inventario`} className={btnGhost}>
                Ver más
              </Link>
            }
          >
            {productosBajo.length === 0 ? (
              <p className="text-sm text-ink/60">No hay alertas de inventario en este momento.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {productosBajo.slice(0, 5).map((p, i) => (
                  <li key={`${p.codigo}-${i}`} className="flex items-start gap-2 rounded-xl border border-sun/40 bg-gradient-to-r from-sun/20 to-white px-3 py-2.5 font-medium text-ink">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                    <span>
                      {p.codigo ? (
                        <>
                          <span className="font-mono text-xs text-plum">{p.codigo}</span> · {p.nombre}
                          {p.nivel ? <span className="block text-xs text-ink/55 capitalize">{p.nivel}</span> : null}
                        </>
                      ) : (
                        p.nombre
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
        {puedeActividad && (
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