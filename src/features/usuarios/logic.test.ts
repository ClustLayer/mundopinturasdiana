import { describe, expect, it } from "vitest"
import { correoValido, documentoValido, formularioUsuarioCompleto, telefonoValido } from "./logic"

describe("usuarios logic", () => {
  it("valida documento y telefono", () => {
    expect(documentoValido("ABC123456")).toBe(true)
    expect(documentoValido("12")).toBe(false)
    expect(telefonoValido("+573001234567")).toBe(true)
    expect(telefonoValido("30-1")).toBe(false)
    expect(correoValido("a@b.co")).toBe(true)
  })

  it("exige campos obligatorios del formulario", () => {
    expect(
      formularioUsuarioCompleto({
        nombre: "Ana",
        apellido: "Lopez",
        documento: "1234567890",
        email: "a@b.co",
        idRol: "1",
        idSede: "2",
      }),
    ).toBe(true)
    expect(
      formularioUsuarioCompleto({
        nombre: "",
        apellido: "Lopez",
        documento: "1234567890",
        email: "a@b.co",
        idRol: "1",
        idSede: "2",
      }),
    ).toBe(false)
  })
})
