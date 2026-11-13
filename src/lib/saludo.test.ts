import { describe, expect, it } from "vitest"
import { saludoColombia } from "./saludo"

function enBogota(isoUtc: string): Date {
  return new Date(isoUtc)
}

describe("saludoColombia", () => {
  it("cubre fronteras en hora de Bogotá (UTC-5)", () => {
    expect(saludoColombia(enBogota("2026-06-15T09:59:00Z"))).toBe("Buenas noches")
    expect(saludoColombia(enBogota("2026-06-15T10:00:00Z"))).toBe("Buenos días")
    expect(saludoColombia(enBogota("2026-06-15T16:59:00Z"))).toBe("Buenos días")
    expect(saludoColombia(enBogota("2026-06-15T17:00:00Z"))).toBe("Buenas tardes")
    expect(saludoColombia(enBogota("2026-06-15T22:59:00Z"))).toBe("Buenas tardes")
    expect(saludoColombia(enBogota("2026-06-15T23:00:00Z"))).toBe("Buenas noches")
  })
})
