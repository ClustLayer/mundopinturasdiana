import { describe, expect, it } from "vitest"
import { etiquetaEstadoFe } from "./logic"

describe("facturacion externa", () => {
  it("etiqueta estados HU 59", () => {
    expect(etiquetaEstadoFe("PENDIENTE")).toBe("Pendiente")
    expect(etiquetaEstadoFe("GENERADA_EXTERNA")).toBe("Generada Externamente")
    expect(etiquetaEstadoFe("CANCELADA")).toBe("Cancelada")
  })
})