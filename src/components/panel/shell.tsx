import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  BarChart3,
  Boxes,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Contact,
  FileCheck2,
  Gift,
  Handshake,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  Truck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react"
import { Navigate } from "react-router-dom"
import { MSG, calcularAvisoMs, rutaDeRol } from "../../features/auth/logic"
import { useAccesos } from "../../features/accesos/accesos-provider"
import { api, mensajeDe, renovarUnaVez } from "../../shared/api"
import { GlobalTooltips } from "../ui/global-tooltips"
import { useApp } from "../../app/providers"
import { Modal, btnGhost, btnPrimary } from "./kit"

const ICONS: Record<string, LucideIcon> = {
  resumen: LayoutDashboard,
  usuarios: Users,
  permisos: ShieldCheck,
  sedes: Store,
  productos: Package,
  inventario: Boxes,
  clientes: Contact,
  proveedores: Handshake,
  ventas: Receipt,
  pos: ShoppingBag,
  domicilios: Truck,
  caja: Wallet,
  cierre: CalendarCheck,
  eventos: CalendarDays,
  facturacion: FileCheck2,
  conceptos: ReceiptText,
  categorias: Tags,
  promociones: Gift,
  auditoria: History,
  analitica: BarChart3,
  cuenta: KeyRound,
}

const ORDER = [
  "resumen",
  "pos",
  "ventas",
  "domicilios",
  "facturacion",
  "caja",
  "cierre",
  "conceptos",
  "productos",
  "categorias",
  "inventario",
  "clientes",
  "proveedores",
  "promociones",
  "eventos",
  "analitica",
  "usuarios",
  "permisos",
  "sedes",
  "auditoria",
] as const

const LABELS: Record<string, string> = {
  resumen: "Resumen",
  usuarios: "Usuarios",
  permisos: "Permisos",
  sedes: "Sedes",
  categorias: "Categorías de producto",
  productos: "Productos",
  inventario: "Inventario",
  clientes: "Clientes",
  proveedores: "Proveedores",
  ventas: "Ventas",
  pos: "Punto de venta",
  domicilios: "Domicilios",
  facturacion: "Factura electrónica",
  caja: "Caja",
  conceptos: "Conceptos de caja",
  cierre: "Cierre de jornada",
  eventos: "Eventos",
  promociones: "Promociones y sorteos",
  auditoria: "Auditoría",
  analitica: "Analítica",
  cuenta: "Mi perfil",
}

const DEFAULT_IDLE_MIN = 15
const DEFAULT_WARN_MIN = 2

export function PanelShell({ children }: { children: ReactNode }) {
  const { sesion, sesionLista, salir, avisar } = useApp()
  const navigate = useNavigate()
  const { pathname: path } = useLocation()
  const [open, setOpen] = useState(false)
  const [warn, setWarn] = useState(false)
  const idleMsRef = useRef(DEFAULT_IDLE_MIN * 60_000)
  const warnMsRef = useRef(DEFAULT_WARN_MIN * 60_000)
  const warnTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { puedeModulo } = useAccesos()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("panel-collapsed") === "1"
    } catch {
      return false
    }
  })

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem("panel-collapsed", c ? "0" : "1")
      } catch {
        /* ignore */
      }
      return !c
    })

  const cerrarSesion = useCallback(async (mensajeOk: string = MSG.logout) => {
    try {
      const respuesta = await api("/api/v1/auth/logout", { method: "POST", body: "{}" }, false)
      const texto = await mensajeDe(respuesta)
      salir()
      if (respuesta.ok) avisar(texto || mensajeOk)
      else if (respuesta.status === 401) avisar(texto || MSG.sesionExpirada, "error")
      else avisar(texto || MSG.logoutFallo, "error")
    } catch {
      salir()
      avisar(MSG.logoutFallo, "error")
    }
    navigate("/login", { replace: true })
  }, [avisar, navigate, salir])

  const programarInactividad = useCallback(() => {
    clearTimeout(warnTimerRef.current)
    clearTimeout(logoutTimerRef.current)
    const avisoEn = calcularAvisoMs(idleMsRef.current / 60_000, warnMsRef.current / 60_000)
    warnTimerRef.current = setTimeout(() => setWarn(true), avisoEn)
    logoutTimerRef.current = setTimeout(() => void cerrarSesion(MSG.inactividad), idleMsRef.current)
  }, [cerrarSesion])

  const registrarActividad = useCallback(() => {
    setWarn(false)
    programarInactividad()
  }, [programarInactividad])

  const continuar = async () => {
    const ok = await renovarUnaVez()
    if (!ok) {
      salir()
      avisar(MSG.renovar, "error")
      navigate("/login", { replace: true })
      return
    }
    registrarActividad()
    avisar(MSG.continua)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false)
  }, [path])

  useEffect(() => {
    if (!sesion) return
    let cancelado = false
    void (async () => {
      try {
        const respuesta = await api("/api/v1/auth/politica-sesion")
        if (!respuesta.ok || cancelado) return
        const data = (await respuesta.json()) as { inactividad_minutos?: number; aviso_minutos?: number }
        if (typeof data.inactividad_minutos === "number" && data.inactividad_minutos > 0) {
          idleMsRef.current = data.inactividad_minutos * 60_000
        }
        if (typeof data.aviso_minutos === "number" && data.aviso_minutos >= 0) {
          warnMsRef.current = data.aviso_minutos * 60_000
        }
        if (!cancelado) programarInactividad()
      } catch {
        if (!cancelado) programarInactividad()
      }
    })()
    return () => {
      cancelado = true
    }
  }, [sesion, programarInactividad])

  useEffect(() => {
    if (!sesion) return
    const evs = ["pointerdown", "keydown", "scroll"] as const
    const on = () => registrarActividad()
    evs.forEach((e) => window.addEventListener(e, on, { passive: true }))
    programarInactividad()
    return () => {
      clearTimeout(warnTimerRef.current)
      clearTimeout(logoutTimerRef.current)
      evs.forEach((e) => window.removeEventListener(e, on))
    }
  }, [sesion, registrarActividad, programarInactividad])

  if (!sesionLista) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper text-sm font-semibold text-plum">
        Restaurando sesión…
      </div>
    )
  }
  if (!sesion) return <Navigate to="/login" replace />
  if (sesion.debeCambiarPassword) return <Navigate to="/cambiar-contrasena" replace />
  if (sesion.requiere2fa) return <Navigate to="/verificacion" replace />

  const base = rutaDeRol(sesion.rol)
  const items = [
    ...ORDER.filter((m) => {
      if (m === "permisos" && sesion?.rol !== "Administrador") return false
      return puedeModulo(m)
    }).map((m) => ({ key: m, label: LABELS[m], href: m === "resumen" ? base : `${base}/${m}` })),
    { key: "cuenta", label: LABELS.cuenta, href: `${base}/cuenta` },
  ]
  const user = { name: sesion.nombre, role: sesion.rol.toLowerCase() }

  const render = (mini: boolean) => (
    <div className="flex h-full flex-col bg-plum text-white">
      <div className={`flex shrink-0 items-center gap-3 border-b border-white/10 bg-plum ${mini ? "justify-center p-3" : "p-5"}`}>
        <img src="/brand/logo.png" alt="" width={44} height={44} className="rounded-full bg-white p-0.5" />
        {!mini && (
          <div className="leading-tight">
            <p className="font-display text-base font-extrabold">Mundo Pinturas</p>
            <p className="text-xs text-white/60">Panel interno</p>
          </div>
        )}
      </div>
      <NavList items={items} path={path} mini={mini} />
      <div className={`shrink-0 border-t border-white/15 bg-plum ${mini ? "p-2" : "p-4"}`}>
        {!mini && (
          <>
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="mb-3 text-xs capitalize text-cyan">{user.role}</p>
          </>
        )}
        <button
          type="button"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 py-2 text-sm font-semibold hover:bg-white/10"
          onClick={() => void cerrarSesion()}
        >
          <LogOut size={16} />
          {!mini && " Cerrar sesión"}
        </button>
        <button
          type="button"
          onClick={toggle}
          title={mini ? "Expandir menú" : "Contraer menú"}
          aria-label={mini ? "Expandir menú" : "Contraer menú"}
          className="mt-2 hidden w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white lg:flex"
        >
          {mini ? <PanelLeftOpen size={18} /> : <><PanelLeftClose size={18} /> Contraer</>}
        </button>
      </div>
    </div>
  )

  const side = render(false)

  return (
    <div className={`min-h-dvh bg-paper transition-[grid-template-columns] duration-200 lg:grid ${collapsed ? "lg:grid-cols-[4.5rem_1fr]" : "lg:grid-cols-[17rem_1fr]"}`}>
      <a href="#panel-main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">
        Saltar al contenido
      </a>
      <aside className="sticky top-0 hidden h-dvh lg:block">{render(collapsed)}</aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-plum/10 bg-white px-4 py-3 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menú" className="rounded-lg p-2 hover:bg-plum-soft">
          <Menu />
        </button>
        <span className="font-display font-extrabold text-plum">Mundo Pinturas Diana</span>
        <span className="w-10" />
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-plum/60" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 max-w-[85%]">
            {side}
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute right-2 top-3 rounded-lg p-2 text-white">
              <X />
            </button>
          </div>
        </div>
      )}
      <main id="panel-main" className="min-w-0 p-4 sm:p-8">
        {children}
      </main>
      <Modal open={warn} onClose={() => setWarn(false)} title="¿Sigues ahí?">
        <p className="text-sm text-ink/70">Por seguridad cerraremos tu sesión en menos de 2 minutos por inactividad.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className={btnGhost} onClick={() => void cerrarSesion()}>
            Salir ahora
          </button>
          <button type="button" className={btnPrimary} onClick={() => void continuar()}>
            Seguir trabajando
          </button>
        </div>
      </Modal>
      <GlobalTooltips />
    </div>
  )
}

function NavList({ items, path, mini }: { items: { key: string; label: string; href: string }[]; path: string; mini: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const [edge, setEdge] = useState({ top: false, bottom: false })
  const [scrolling, setScrolling] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setEdge({ top: el.scrollTop > 4, bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 4 })
  }, [])
  useEffect(() => {
    measure()
    window.addEventListener("resize", measure)
    return () => {
      window.removeEventListener("resize", measure)
      clearTimeout(timer.current)
    }
  }, [measure, items.length])
  const onScroll = () => {
    measure()
    setScrolling(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setScrolling(false), 900)
  }
  const thumb = scrolling
    ? "[scrollbar-color:rgb(255_255_255/0.35)_transparent]"
    : "[scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgb(255_255_255/0.3)_transparent]"
  return (
    <div className="relative min-h-0 flex-1">
      <nav
        ref={ref}
        onScroll={onScroll}
        aria-label="Módulos"
        className={`h-full space-y-0.5 overflow-y-auto overscroll-contain py-3 [scrollbar-width:thin] ${mini ? "px-2" : "px-3"} ${thumb}`}
      >
        {items.map((it) => {
          const I = ICONS[it.key] ?? ClipboardList
          const active = path === it.href
          return (
            <Link
              key={it.key}
              to={it.href}
              title={it.label}
              aria-label={it.label}
              aria-current={active ? "page" : undefined}
              className={`flex items-center ${mini ? "justify-center px-0" : "gap-3 px-3"} rounded-xl py-2.5 text-sm font-semibold transition ${active ? "bg-white text-plum shadow-[3px_3px_0_0_var(--color-brand)]" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
            >
              <I size={18} />
              {!mini && <> {it.label}</>}
            </Link>
          )
        })}
      </nav>
      <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-plum to-transparent transition-opacity ${edge.top ? "opacity-100" : "opacity-0"}`} />
      <div aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-plum to-transparent transition-opacity ${edge.bottom ? "opacity-100" : "opacity-0"}`} />
    </div>
  )
}
