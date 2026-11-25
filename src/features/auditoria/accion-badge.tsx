function accionClass(accion: string): string {
  const a = accion.toLowerCase()
  if (a.includes("login")) return "bg-blue-100 text-blue-900"
  if (a.includes("contrasena") || a.includes("password")) return "bg-amber-100 text-amber-900"
  return "bg-plum-soft text-plum"
}

export function AccionBadge({ accion, entidad }: { accion: string; entidad?: string }) {
  void entidad
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${accionClass(accion)}`}>
      {accion}
    </span>
  )
}

export function RolBadge({ rol }: { rol: string }) {
  const norm = rol.trim().toLowerCase()
  const tono =
    norm.includes("admin")
      ? "bg-plum text-white"
      : norm.includes("gerente")
        ? "bg-blue-100 text-blue-900"
        : norm.includes("empleado")
          ? "bg-emerald-100 text-emerald-900"
          : "bg-plum-soft text-plum"
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${tono}`}>{rol}</span>
}
