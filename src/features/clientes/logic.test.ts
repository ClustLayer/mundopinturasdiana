import { describe, expect, it } from "vitest"
import { correoValido, telefonoValido } from "./logic"

describe("clientes logic", () => {
  it("valida e.164", () => {
    expect(telefonoValido("+573001234567")).toBe(true)
    expect(telefonoValido("573001234567")).toBe(true)
    expect(telefonoValido("abc")).toBe(false)
  })
  it("valida correo opcional", () => {
    expect(correoValido("")).toBe(true)
    expect(correoValido("a@b.co")).toBe(true)
    expect(correoValido("mal")).toBe(false)
  })
})
