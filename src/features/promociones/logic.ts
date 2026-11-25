import { bogotaDay } from "../../lib/schedule"
import { API_URL } from "../../shared/api"
import type { PublicPromotion } from "../../lib/public-data"

export type EstadoPromocion = "vigente" | "programada" | "archivada" | "pausada"

export const TIPOS_PROMOCION = [
  { v: "promocion", l: "Promoción" },
  { v: "sorteo", l: "Sorteo" },
] as const

export const ETIQUETA_TIPO: Record<string, string> = Object.fromEntries(TIPOS_PROMOCION.map((t) => [t.v, t.l]))

export function estadoPromocion(
  inicio: string,
  fin: string,
  activa: boolean,
  hoy = bogotaDay(),
): EstadoPromocion {
  const s = (inicio || "").slice(0, 10)
  const e = (fin || "").slice(0, 10)
  if (e && e < hoy) return "archivada"
  if (!activa && s <= hoy && hoy <= e) return "pausada"
  if (s && s > hoy) return "programada"
  return "vigente"
}

export function fechasPromocionValidas(inicio: string, fin: string): boolean {
  if (!inicio.trim() || !fin.trim()) return false
  return fin.slice(0, 10) >= inicio.slice(0, 10)
}

export function urlImagenPromocion(imagenUrl: string): string {
  if (!imagenUrl) return ""
  if (imagenUrl.startsWith("http://") || imagenUrl.startsWith("https://")) return imagenUrl
  return `${API_URL}/api/v1/catalogo/media/${imagenUrl}`
}

export type PromocionApi = {
  id_promocion: number
  titulo: string
  tipo: string
  descripcion: string
  hashtags: string
  imagen_url?: string
  fecha_inicio: string
  fecha_fin: string
  activa?: boolean
  estado?: boolean
  version_fila?: number
  clics_whatsapp?: number
}

export function mapPromocionPublica(p: PromocionApi): PublicPromotion {
  return {
    id: String(p.id_promocion),
    title: p.titulo,
    kind: p.tipo === "sorteo" ? "sorteo" : "promocion",
    description: p.descripcion,
    hashtags: p.hashtags,
    image: urlImagenPromocion(p.imagen_url || ""),
    startDate: p.fecha_inicio.slice(0, 10),
    endDate: p.fecha_fin.slice(0, 10),
  }
}