import { describe, expect, it } from "vitest"
import { cambioCliente, cantidadEnteraValida, correoOpcionalValido, pagosCubrenTotal, saldoPendiente, totalPosLineas } from "./logic"

describe("ventas logic", () => {
  it("calcula saldo y cambio", () => {
    expect(saldoPendiente(100, 60)).toBe(40)
    expect(cambioCliente(100, 120)).toBe(20)
    expect(pagosCubrenTotal(100, 100)).toBe(true)
    expect(pagosCubrenTotal(100, 50)).toBe(false)
  })

  it("valida correo opcional y cantidad entera", () => {
    expect(correoOpcionalValido("")).toBe(true)
    expect(correoOpcionalValido("a@b.co")).toBe(true)
    expect(correoOpcionalValido("mal")).toBe(false)
    expect(cantidadEnteraValida(1)).toBe(true)
    expect(cantidadEnteraValida(0.5)).toBe(false)
  })

  it("total POS incluye IVA por línea", () => {
    const t = totalPosLineas([{ cantidad: 4, precio: 80000, descuento_porcentaje: 0, iva_porcentaje: 19 }])
    expect(t).toBe(380800)
  })
})