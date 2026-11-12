/** @deprecated Use useAccesos from accesos-provider */
export type AccesosPanel = {
  modulos: string[]
  acciones_por_modulo: Record<string, string[]>
}

export { useAccesos as useAccesosPanel } from "./accesos-provider"
