export type TipoMovimiento = "gasto" | "ahorro" | "transferencia" | "adicion"

export type CategoriaMov = {
  id_categoria_movimiento: number
  nombre: string
  tipo_movimiento: TipoMovimiento
  descripcion: string
  estado: boolean
  version_fila: number
}

export type ConceptoMov = {
  id_concepto_movimiento: number
  nombre: string
  id_categoria_movimiento: number
  categoria_nombre: string
  tipo_movimiento: TipoMovimiento
  valor_sugerido: string | number | null
  detalle_sugerido: string
  estado: boolean
  version_fila: number
}

export type MovimientoCaja = {
  id_movimiento: number
  tipo_movimiento: TipoMovimiento
  concepto: string
  id_concepto_movimiento: number | null
  detalle: string
  valor: number | string
  fecha_hora: string
  usuario: string
  bloqueado: boolean
  editable: boolean
  origen?: string
}

export type CuadreCaja = {
  fecha: string
  id_sede: number
  sede: string
  estado_jornada: string
  cerrado: boolean
  base_inicial: number
  ventas_efectivo: number
  ventas_transferencia: number
  ventas_tarjeta: number
  adiciones: number
  gastos: number
  ahorros: number
  transferencias: number
  entrega: number
  entrega_nota: string
  efectivo_esperado: number
  ventas_registrada: boolean
  cantidad_ventas: number
}

export type CierreHistorial = {
  id_reporte_diario: number
  fecha: string
  sede: string
  base_inicial: number
  entrega: number
  efectivo_esperado: number
  efectivo_declarado: number
  diferencia: number
  estado: string
}