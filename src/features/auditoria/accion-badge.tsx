function moduloClass(entidad: string): string {
  const e = entidad.toLowerCase()
  if (/producto|categor|marca|tipo_producto|catalogo/.test(e)) return "bg-cyan/15 text-cyan-dark"
  if (/cliente|tipo_cliente/.test(e)) return "bg-sun/30 text-ink"
  if (/inventario|movimiento|existencia|kardex/.test(e)) return "bg-plum-soft text-plum"
  if (/usuario|rol|permiso/.test(e)) return "bg-blue-100 text-blue-900"
  if (/evento/.test(e)) return "bg-brand/15 text-brand-dark"
  if (/proveedor/.test(e)) return "bg-emerald-100 text-emerald-900"
  if (/sede|branch/.test(e)) return "bg-indigo-100 text-indigo-900"
  if (/venta|factura|domicilio|caja/.test(e)) return "bg-amber-100 text-amber-900"
  return "bg-plum-soft text-plum"
}

export function AccionBadge({ accion, entidad }: { accion: string; entidad: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${moduloClass(entidad)}`}>
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
