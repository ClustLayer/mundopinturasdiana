/** Acceso a pantallas del catálogo (comparten dominio catalogo_productos). */

const CLAVES_CATALOGO = new Set(["productos", "categorias", "marcas", "tipos_producto"])

export function puedeModuloCatalogo(clave: string, puedeModulo: (k: string) => boolean): boolean {
  if (!CLAVES_CATALOGO.has(clave)) return false
  if (puedeModulo(clave)) return true
  return puedeModulo("productos")
}
