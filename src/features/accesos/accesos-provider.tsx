import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { api } from "../../shared/api"
import { toast } from "../en-desarrollo"
import type { AccesosPanel } from "./use-accesos-panel"
import { puedeVerModulo } from "./logic"

const CACHE_KEY = "mpdw_accesos_panel_v2"
const CLAVES_CATALOGO = new Set(["productos", "categorias", "marcas", "tipos_producto"])
const CACHE_MS = 60_000

type Ctx = {
  data: AccesosPanel | null
  error: boolean
  cargando: boolean
  puedeModulo: (clave: string) => boolean
  accionesModulo: (clave: string) => string[]
  refrescar: () => void
}

const AccesosCtx = createContext<Ctx | null>(null)

function leerCache(): AccesosPanel | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { ts: number; data: AccesosPanel }
    if (Date.now() - parsed.ts > CACHE_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

function guardarCache(data: AccesosPanel) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
  } catch {
    /* ignore */
  }
}

export function AccesosProvider({ activo, children }: { activo: boolean; children: ReactNode }) {
  const [data, setData] = useState<AccesosPanel | null>(() => (activo ? leerCache() : null))
  const [error, setError] = useState(false)
  const [cargando, setCargando] = useState(false)
  const seq = useRef(0)

  const cargar = useCallback(async (forzar = false) => {
    if (!activo) return
    if (!forzar) {
      const cached = leerCache()
      if (cached) {
        setData(cached)
        return
      }
    }
    const id = ++seq.current
    setCargando(true)
    try {
      const r = await api("/api/v1/auth/accesos-panel")
      if (id !== seq.current) return
      if (!r.ok) {
        setError(true)
        toast("No fue posible verificar sus permisos. Intente nuevamente.")
        return
      }
      const body = (await r.json()) as AccesosPanel
      setData(body)
      setError(false)
      guardarCache(body)
    } catch {
      if (id === seq.current) setError(true)
    } finally {
      if (id === seq.current) setCargando(false)
    }
  }, [activo])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota / caché de accesos
    void cargar(false)
  }, [cargar])

  const value = useMemo<Ctx>(
    () => ({
      data,
      error,
      cargando,
      refrescar: () => void cargar(true),
      accionesModulo: (clave) => data?.acciones_por_modulo?.[clave] ?? [],
      puedeModulo: (clave) => {
        if (clave === "cuenta" || clave === "resumen") return true
        if (!data) return true
        const acts = data.acciones_por_modulo?.[clave]
        if (acts?.length) return puedeVerModulo(acts)
        if (CLAVES_CATALOGO.has(clave)) {
          for (const k of CLAVES_CATALOGO) {
            const ref = data.acciones_por_modulo?.[k]
            if (ref?.length && puedeVerModulo(ref)) return true
          }
        }
        return data.modulos.includes(clave)
      },
    }),
    [data, error, cargando, cargar],
  )

  return <AccesosCtx.Provider value={value}>{children}</AccesosCtx.Provider>
}

export function useAccesos(): Ctx {
  const ctx = useContext(AccesosCtx)
  if (!ctx) throw new Error("Falta AccesosProvider")
  return ctx
}
