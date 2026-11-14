import { describe, expect, it } from "vitest"
import { correoValido } from "./logic"

describe("proveedores logic", () => {
  it("valida correo opcional", () => {
    expect(correoValido("")).toBe(true)
    expect(correoValido("proveedor@empresa.co")).toBe(true)
    expect(correoValido("sin-arroba")).toBe(false)
  })
})
