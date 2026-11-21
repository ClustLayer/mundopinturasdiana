/** Cálculos de cobro mixto POS (Épica 8). */

export function saldoPendiente(total: number, pagos: number): number {
  const saldo = total - pagos
  return saldo > 0 ? Math.round(saldo * 100) / 100 : 0
}

export function cambioCliente(total: number, pagos: number): number {
  const diff = pagos - total
  return diff > 0 ? Math.round(diff * 100) / 100 : 0
}

export function pagosCubrenTotal(total: number, pagos: number): boolean {
  return pagos + 0.001 >= total && total > 0
}

export function correoOpcionalValido(correo: string): boolean {
  const t = correo.trim()
  if (!t) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

export function cantidadEnteraValida(cantidad: number): boolean {
  return Number.isInteger(cantidad) && cantidad >= 1
}

export type LineaPosTotal = {
  cantidad: number
  precio: number
  descuento_porcentaje: number
  iva_porcentaje: number
}

/** Réplica ligera de totales POS (línea neta + IVA). */
export function totalPosLineas(lineas: LineaPosTotal[]): number {
  let total = 0
  for (const l of lineas) {
    const bruto = l.precio * l.cantidad
    const desc = (bruto * l.descuento_porcentaje) / 100
    const neto = bruto - desc
    const iva = (neto * l.iva_porcentaje) / 100
    total += neto + iva
  }
  return Math.round(total * 100) / 100
}