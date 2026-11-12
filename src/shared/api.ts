import {
  guardarTokenPersistido,
  leerTokenPersistido,
} from "../features/auth/session-storage"

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

export type Cuerpo = Record<string, unknown>

let accessToken: string | null = leerTokenPersistido()
let renovando: Promise<boolean> | null = null

export function leerToken(): string | null {
  return accessToken
}

export function guardarToken(token: string | null): void {
  accessToken = token
  guardarTokenPersistido(token)
}

export async function api(path: string, opciones: RequestInit = {}, reintentar = true): Promise<Response> {
  const headers = new Headers(opciones.headers)
  if (opciones.body && !(opciones.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)
  const respuesta = await fetch(`${API_URL}${path}`, { ...opciones, headers, credentials: "include" })
  if (respuesta.status === 401 && reintentar && path !== "/api/v1/auth/refresh" && path !== "/api/v1/auth/login") {
    const renovado = await renovarUnaVez()
    if (renovado) return api(path, opciones, false)
  }
  return respuesta
}

export type ErrorApi = { codigo?: string; mensaje?: string }

export async function cuerpoError(respuesta: Response): Promise<ErrorApi> {
  try {
    return (await respuesta.json()) as ErrorApi
  } catch {
    return {}
  }
}

export async function mensajeDe(respuesta: Response): Promise<string> {
  const data = await cuerpoError(respuesta.clone())
  return data.mensaje ?? ""
}

export async function renovarUnaVez(): Promise<boolean> {
  if (!renovando) {
    renovando = fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then(async (respuesta) => {
        if (!respuesta.ok) {
          guardarToken(null)
          return false
        }
        const data = (await respuesta.json()) as { access_token?: string }
        guardarToken(data.access_token ?? null)
        return Boolean(data.access_token)
      })
      .catch(() => {
        guardarToken(null)
        return false
      })
      .finally(() => {
        renovando = null
      })
  }
  return renovando
}
