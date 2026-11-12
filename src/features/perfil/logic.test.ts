import { describe, expect, it } from "vitest"
import { partirNombreCompleto, unirNombreCompleto } from "./logic"

describe("perfil logic", () => {
  it("une y parte nombre completo", () => {
    expect(unirNombreCompleto("Admin", "Demo")).toBe("Admin Demo")
    expect(partirNombreCompleto("Admin Demo")).toEqual({ nombre: "Admin", apellido: "Demo" })
  })
})
