import { describe, expect, it } from "vitest"
import { moduloBloqueado, puedeAccion, puedeVerModulo } from "./logic"

describe("accesos logic", () => {
  it("bloquea módulo con Sin acceso", () => {
    expect(moduloBloqueado(["Sin acceso"])).toBe(true)
    expect(puedeVerModulo(["Sin acceso"])).toBe(false)
    expect(puedeAccion(["Sin acceso", "Total"], "Consultar")).toBe(false)
  })

  it("Total concede acciones concretas", () => {
    expect(puedeAccion(["Total"], "Crear")).toBe(true)
    expect(puedeAccion(["T"], "Editar")).toBe(true)
  })

  it("sin acciones no concede", () => {
    expect(puedeAccion([], "Crear")).toBe(false)
    expect(puedeVerModulo([])).toBe(false)
  })
})
