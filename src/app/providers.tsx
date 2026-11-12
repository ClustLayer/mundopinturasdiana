import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { AccesosProvider } from "../features/accesos/accesos-provider"
import {
  guardarSesionPersistida,
  guardarTokenPersistido,
  leerSesionPersistida,
  leerTokenPersistido,
} from "../features/auth/session-storage"
import type { Sesion } from "../features/auth/session-types"
import { api, guardarToken, renovarUnaVez } from "../shared/api"

export type { Sesion }

export type Aviso = { id: number; texto: string; tipo: "ok" | "error" }

type AppState = {
  sesion: Sesion | null
  sesionLista: boolean
  entrar: (sesion: Sesion, accessToken: string | null) => void
  actualizar: (parcial: Partial<Sesion>, accessToken?: string | null) => void
  salir: () => void
  avisar: (texto: string, tipo?: "ok" | "error") => void
  avisos: Aviso[]
  cerrarAviso: (id: number) => void
}

const Ctx = createContext<AppState | null>(null)

function perfilASesion(data: {
  nombre?: string
  apellido?: string
  email?: string
  rol_nombre?: string
  debe_cambiar_password?: boolean
}): Sesion {
  const nombre = [data.nombre, data.apellido].filter(Boolean).join(" ").trim() || data.email || ""
  return {
    nombre,
    email: data.email ?? "",
    rol: data.rol_nombre ?? "Empleado",
    debeCambiarPassword: Boolean(data.debe_cambiar_password),
    requiere2fa: false,
    desafioToken: null,
  }
}

export function Providers({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(() => leerSesionPersistida())
  const [sesionLista, setSesionLista] = useState(() => !leerTokenPersistido())
  const [avisos, setAvisos] = useState<Aviso[]>([])

  const avisar = useCallback((texto: string, tipo: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setAvisos((lista) => [...lista, { id, texto, tipo }])
    window.setTimeout(() => setAvisos((lista) => lista.filter((aviso) => aviso.id !== id)), 6000)
  }, [])

  const salir = useCallback(() => {
    guardarToken(null)
    guardarTokenPersistido(null)
    guardarSesionPersistida(null)
    setSesion(null)
    setSesionLista(true)
  }, [])

  useEffect(() => {
    const token = leerTokenPersistido()
    if (!token) return
    guardarToken(token)
    let cancelado = false
    void (async () => {
      const ok = await renovarUnaVez()
      if (cancelado) return
      if (!ok) {
        salir()
        return
      }
      try {
        const r = await api("/api/v1/auth/profile")
        if (cancelado) return
        if (!r.ok) {
          salir()
          return
        }
        const body = (await r.json()) as Parameters<typeof perfilASesion>[0]
        const restaurada = perfilASesion(body)
        setSesion(restaurada)
        guardarSesionPersistida(restaurada)
      } catch {
        if (!cancelado) salir()
      } finally {
        if (!cancelado) setSesionLista(true)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [salir])

  const value = useMemo<AppState>(
    () => ({
      sesion,
      sesionLista,
      avisos,
      entrar: (nueva, accessToken) => {
        guardarToken(accessToken)
        guardarSesionPersistida(nueva)
        setSesion(nueva)
        setSesionLista(true)
      },
      actualizar: (parcial, accessToken) => {
        if (accessToken !== undefined) guardarToken(accessToken)
        setSesion((actual) => {
          if (!actual) return actual
          const next = { ...actual, ...parcial }
          guardarSesionPersistida(next)
          return next
        })
      },
      salir,
      avisar,
      cerrarAviso: (id) => setAvisos((lista) => lista.filter((aviso) => aviso.id !== id)),
    }),
    [sesion, sesionLista, avisos, avisar, salir],
  )

  return (
    <Ctx.Provider value={value}>
      <AccesosProvider activo={Boolean(sesion && sesionLista && !sesion.requiere2fa && !sesion.debeCambiarPassword)}>
        {children}
      </AccesosProvider>
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(100%-2rem,24rem)] flex-col gap-2" aria-live="polite">
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            role={aviso.tipo === "error" ? "alert" : "status"}
            className={`pointer-events-auto rounded-xl border-2 px-4 py-3 text-sm font-semibold shadow-lg ${aviso.tipo === "error" ? "border-brand bg-white text-brand-dark" : "border-cyan bg-white text-plum"}`}
          >
            {aviso.texto}
            <button type="button" className="ml-3 underline" onClick={() => value.cerrarAviso(aviso.id)}>
              Cerrar
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useApp(): AppState {
  const valor = useContext(Ctx)
  if (!valor) throw new Error("Falta el proveedor de la aplicacion")
  return valor
}
