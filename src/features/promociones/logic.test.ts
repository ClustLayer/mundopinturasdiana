import { describe, expect, it } from "vitest"
import { estadoPromocion, fechasPromocionValidas, mapPromocionPublica, urlImagenPromocion } from "./logic"

describe("estadoPromocion", () => {
  it("marca archivada cuando ya pasó la fecha fin", () => {
    expect(estadoPromocion("2025-01-01", "2025-01-10", true, "2025-11-25")).toBe("archivada")
  })
  it("marca pausada si activa es false en vigencia", () => {
    expect(estadoPromocion("2025-11-01", "2025-12-31", false, "2025-11-25")).toBe("pausada")
  })
  it("marca programada si aún no empieza", () => {
    expect(estadoPromocion("2026-01-01", "2026-01-31", true, "2025-11-25")).toBe("programada")
  })
})

describe("fechasPromocionValidas", () => {
  it("requiere fin >= inicio", () => {
    expect(fechasPromocionValidas("2025-11-20", "2025-11-25")).toBe(true)
    expect(fechasPromocionValidas("2025-11-25", "2025-11-20")).toBe(false)
  })
})

describe("mapPromocionPublica", () => {
  it("normaliza campos al modelo público", () => {
    const p = mapPromocionPublica({
      id_promocion: 9,
      titulo: "Sorteo navideño",
      tipo: "sorteo",
      descripcion: "Participa",
      hashtags: "#navidad",
      imagen_url: "promo/x.jpg",
      fecha_inicio: "2025-11-01T00:00:00Z",
      fecha_fin: "2025-12-01T00:00:00Z",
    })
    expect(p.id).toBe("9")
    expect(p.kind).toBe("sorteo")
    expect(p.image).toContain("promo/x.jpg")
  })
})

describe("urlImagenPromocion", () => {
  it("deja URLs absolutas intactas", () => {
    expect(urlImagenPromocion("https://cdn.test/p.jpg")).toBe("https://cdn.test/p.jpg")
  })
})