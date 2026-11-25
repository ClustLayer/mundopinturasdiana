/** Acceso a pantallas del catálogo (comparten dominio catalogo_productos). */

const CLAVES_CATALOGO = new Set(["productos", "categorias", "marcas", "tipos_producto", "vitrinas"])

const CLAVES_CAJA = new Set(["caja", "conceptos", "cierre", "categorias_caja", "historial_caja"])

export function puedeModuloCatalogo(clave: string, puedeModulo: (k: string) => boolean): boolean {
  if (!CLAVES_CATALOGO.has(clave)) return false
  if (puedeModulo(clave)) return true
  return puedeModulo("productos")
}

/** Pantallas de caja que pueden compartir permisos (HU 18 / demo). */
export function puedeModuloCaja(clave: string, puedeModulo: (k: string) => boolean): boolean {
  const k = clave === "historial-caja" ? "historial_caja" : clave
  if (!CLAVES_CAJA.has(k)) return false
  if (puedeModulo(k)) return true
  for (const ref of ["caja", "conceptos", "cierre"] as const) {
    if (puedeModulo(ref)) return true
  }
  return false
}