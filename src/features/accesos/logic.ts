/** Evalúa permisos efectivos del panel (HU 18 + Total / Sin acceso). */

const ALIAS: Record<string, readonly string[]> = {
  T: ["T", "Total"],
  L: ["L", "Consultar", "Total", "T"],
  O: ["O", "Total", "T"],
  Consultar: ["Consultar", "L", "Total", "T"],
  Crear: ["Crear", "Total", "T"],
  Editar: ["Editar", "Total", "T"],
  "Cambiar estado": ["Cambiar estado", "Total", "T"],
  Anular: ["Anular", "Total", "T"],
  Exportar: ["Exportar", "L", "Consultar", "Total", "T"],
  Total: ["Total", "T"],
}

export function moduloBloqueado(acciones: string[] | undefined): boolean {
  return Boolean(acciones?.includes("Sin acceso"))
}

export function puedeAccion(acciones: string[] | undefined, requerida: string): boolean {
  if (!acciones?.length) return false
  if (moduloBloqueado(acciones)) return false
  const candidatas = ALIAS[requerida] ?? [requerida]
  return candidatas.some((a) => acciones.includes(a))
}

export function puedeVerModulo(acciones: string[] | undefined): boolean {
  if (!acciones?.length) return false
  if (moduloBloqueado(acciones)) return false
  return acciones.some((a) => a !== "Sin acceso")
}
