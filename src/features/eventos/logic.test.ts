import { describe, expect, it } from "vitest"
import { estadoCalendario, fechasEventoValidas } from "./logic"

describe("eventos logic", () => {
  it("valida fin >= inicio", () => {
    expect(fechasEventoValidas("2026-06-01T10:00", "2026-06-01T12:00")).toBe(true)
    expect(fechasEventoValidas("2026-06-02T10:00", "2026-06-01T12:00")).toBe(false)
    expect(fechasEventoValidas("", "2026-06-01")).toBe(false)
  })

  it("calcula estado calendario", () => {
    expect(estadoCalendario("2026-01-01", "2026-01-05", "2026-06-01")).toBe("archivada")
    expect(estadoCalendario("2026-12-01", "2026-12-05", "2026-06-01")).toBe("programada")
    expect(estadoCalendario("2026-05-01", "2026-07-01", "2026-06-01")).toBe("vigente")
  })
})
