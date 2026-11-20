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