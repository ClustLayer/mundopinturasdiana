import type { Sesion } from "./session-types"

export const TOKEN_KEY = "mpdw_access_token_v1"
export const SESION_KEY = "mpdw_sesion_v1"

export function leerTokenPersistido(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function guardarTokenPersistido(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export function leerSesionPersistida(): Sesion | null {
  try {
    const raw = sessionStorage.getItem(SESION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Sesion
  } catch {
    return null
  }
}

export function guardarSesionPersistida(sesion: Sesion | null) {
  try {
    if (sesion) sessionStorage.setItem(SESION_KEY, JSON.stringify(sesion))
    else sessionStorage.removeItem(SESION_KEY)
  } catch {
    /* ignore */
  }
}
