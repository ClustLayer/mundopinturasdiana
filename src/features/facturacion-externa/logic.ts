const ETIQUETAS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  GENERADA_EXTERNA: "Generada Externamente",
  CANCELADA: "Cancelada",
}

export function etiquetaEstadoFe(estado: string): string {
  return ETIQUETAS[estado] ?? estado
}