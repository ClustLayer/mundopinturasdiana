import { bogotaDay } from "../../lib/schedule"

export type EstadoCalendario = "vigente" | "programada" | "archivada"

export const TIPOS_EVENTO = [
  { v: "promocion", l: "Promoción" },
  { v: "capacitacion", l: "Capacitación" },
  { v: "entrega", l: "Entrega" },
  { v: "festivo", l: "Festivo" },
  { v: "social", l: "Evento social" },
  { v: "atipico", l: "Especial / atípico" },
  { v: "otro", l: "Otro" },
] as const

export const IMPACTOS = [
  { v: "Alto", l: "Alto" },
  { v: "Medio", l: "Medio" },
  { v: "Bajo", l: "Bajo" },
] as const

export const ETIQUETA_TIPO: Record<string, string> = Object.fromEntries(TIPOS_EVENTO.map((t) => [t.v, t.l]))

/** Estado por fechas: archivada (ya terminó), programada (aún no empieza) o vigente. */
export function estadoCalendario(inicio: string, fin: string | null | undefined, hoy = bogotaDay()): EstadoCalendario {
  const e = (fin || inicio || "").slice(0, 10)
  const s = (inicio || "").slice(0, 10)
  if (e && e < hoy) return "archivada"
  if (s && s > hoy) return "programada"
  return "vigente"
}

export function fechasEventoValidas(inicio: string, fin: string): boolean {
  if (!inicio.trim() || !fin.trim()) return false
  const a = new Date(inicio).getTime()
  const b = new Date(fin).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return false
  return b >= a
}

export function aDatetimeLocal(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16)
  const off = d.getTime() - d.getTimezoneOffset() * 60_000
  return new Date(off).toISOString().slice(0, 16)
}

export function desdeDatetimeLocal(local: string): string {
  if (!local) return ""
  return new Date(local).toISOString()
}
