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

export class ApiTimeoutError extends Error {
  constructor() {
    super("La solicitud tardó demasiado. Verifica el listado antes de reintentar.")
    this.name = "ApiTimeoutError"
  }
}

export async function api(
  path: string,
  opciones: RequestInit & { timeoutMs?: number } = {},
  reintentar = true,
): Promise<Response> {
  const { timeoutMs, signal: señalExterna, ...resto } = opciones
  const esArchivo = resto.body instanceof FormData
  const limite = timeoutMs ?? (esArchivo ? 60000 : resto.method && resto.method !== "GET" ? 20000 : 15000)
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), limite)
  const cancelarExterna = () => controlador.abort()
  señalExterna?.addEventListener("abort", cancelarExterna)
  const headers = new Headers(resto.headers)
  if (resto.body && !(resto.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)
  try {
    const respuesta = await fetch(`${API_URL}${path}`, {
      ...resto,
      headers,
      credentials: "include",
      signal: controlador.signal,
    })
    if (respuesta.status === 401 && reintentar && path !== "/api/v1/auth/refresh" && path !== "/api/v1/auth/login") {
      const renovado = await renovarUnaVez()
      if (renovado) return api(path, resto, false)
    }
    return respuesta
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      if (señalExterna?.aborted) throw error
      throw new ApiTimeoutError()
    }
    throw error
  } finally {
    clearTimeout(temporizador)
    señalExterna?.removeEventListener("abort", cancelarExterna)
  }
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
