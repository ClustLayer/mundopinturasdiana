import { API_URL } from "../shared/api"

export type SedePublica = {
  id_sede: number
  nombre: string
  direccion: string
  telefono: string
  whatsapp: string
  ciudad: string
  maps_url?: string
  map_query?: string
  es_principal?: boolean
}

export async function fetchSedesPublicas(): Promise<SedePublica[]> {
  const r = await fetch(`${API_URL}/api/v1/branches/`)
  if (!r.ok) return []
  return (await r.json()) as SedePublica[]
}

export function sedePrincipal(list: SedePublica[]): SedePublica | null {
  return list.find((s) => s.es_principal) ?? list[0] ?? null
}

export function mapsDeSede(s: SedePublica): string {
  if (s.maps_url) return s.maps_url
  const q = s.map_query || `${s.direccion}, ${s.ciudad}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function digitos(valor: string): string {
  return (valor || "").replace(/\D/g, "")
}
