import { memo } from "react"
import {
  Ban,
  Circle,
  Download,
  Eye,
  Globe,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react"
import { ACCIONES_UI } from "./matriz-constants"

export type DetallePermiso = {
  id_permiso: number
  modulo: string
  accion: string
  nombre: string
  permitido: boolean | null
}

export type ModuloMatriz = {
  panel: string
  etiqueta: string
  modulo: string
  detalle: DetallePermiso[]
}

function activasDe(mod: ModuloMatriz): string[] {
  return mod.detalle.filter((d) => d.permitido).map((d) => d.accion)
}

function iconoResumen(activas: string[]) {
  if (activas.includes("Sin acceso")) return <Ban size={18} className="text-brand" aria-hidden />
  if (activas.includes("Total")) return <Globe size={18} className="text-cyan-dark" aria-hidden />
  if (!activas.length) return <Circle size={18} className="text-ink/25" aria-hidden />
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {activas.includes("Consultar") && <Eye size={15} className="text-plum" />}
      {activas.includes("Crear") && <Plus size={15} className="text-plum" />}
      {activas.includes("Editar") && <Pencil size={15} className="text-plum" />}
      {activas.includes("Cambiar estado") && <Power size={15} className="text-plum" />}
      {activas.includes("Anular") && <Trash2 size={15} className="text-plum" />}
      {activas.includes("Exportar") && <Download size={15} className="text-plum" />}
    </span>
  )
}

export const MatrizCarriles = memo(function MatrizCarriles({
  modulos,
  onChange,
}: {
  modulos: ModuloMatriz[]
  onChange: (next: ModuloMatriz[]) => void
}) {
  const toggleAccion = (panel: string, accion: string, activar: boolean) => {
    onChange(
      modulos.map((m) => {
        if (m.panel !== panel) return m
        const detalle = m.detalle.map((d) => {
          if (accion === "Sin acceso" && activar) {
            return { ...d, permitido: d.accion === "Sin acceso" }
          }
          if (accion === "Total" && activar) {
            return { ...d, permitido: d.accion === "Total" }
          }
          if (activar && accion !== "Sin acceso" && accion !== "Total") {
            if (d.accion === "Sin acceso" || d.accion === "Total") return { ...d, permitido: false }
            if (d.accion === accion) return { ...d, permitido: true }
            return d
          }
          if (!activar && d.accion === accion) return { ...d, permitido: false }
          return d
        })
        return { ...m, detalle }
      }),
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-plum-soft text-xs uppercase tracking-wider text-plum">
          <tr>
            <th className="px-4 py-3 font-bold">Módulo</th>
            <th className="px-4 py-3 font-bold">Permisos</th>
            <th className="px-4 py-3 font-bold text-center">Resumen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-plum/10">
          {modulos.map((m) => {
            const activas = activasDe(m)
            const bloqueado = activas.includes("Sin acceso")
            const totalOn = activas.includes("Total")
            return (
              <tr key={m.panel} className="align-top hover:bg-paper/60">
                <th scope="row" className="px-4 py-4 font-display text-base font-extrabold text-plum">
                  {m.etiqueta}
                </th>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {activas.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1 rounded-full border-2 border-plum/20 bg-plum-soft px-3 py-1 text-xs font-bold text-plum"
                      >
                        {a}
                        <button
                          type="button"
                          data-tip={`Quitar permiso ${a}`}
                          aria-label={`Quitar ${a}`}
                          className="rounded p-0.5 hover:bg-white"
                          onClick={() => toggleAccion(m.panel, a, false)}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ACCIONES_UI.filter((a) => !activas.includes(a)).map((a) => (
                      <button
                        key={a}
                        type="button"
                        data-tip={`Añadir ${a}`}
                        disabled={bloqueado && a !== "Sin acceso"}
                        className="rounded-lg border border-dashed border-plum/30 px-2 py-1 text-xs font-semibold text-plum hover:bg-paper disabled:opacity-40"
                        onClick={() => toggleAccion(m.panel, a, true)}
                      >
                        + {a}
                      </button>
                    ))}
                  </div>
                  {(bloqueado || totalOn) && (
                    <p className="mt-2 text-xs text-ink/50">
                      {bloqueado ? "Sin acceso bloquea el resto del carril." : "Total concede acceso completo al módulo."}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4 text-center">{iconoResumen(activas)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

export function aplanarDetalle(modulos: ModuloMatriz[]): DetallePermiso[] {
  return modulos.flatMap((m) => m.detalle)
}
