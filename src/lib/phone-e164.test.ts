import { describe, expect, it } from "vitest"
import { formatE164, parseE164, validateE164 } from "./phone-e164"

describe("phone-e164", () => {
  it("parsea E.164 de Colombia", () => {
    expect(parseE164("+573001234567")).toEqual({ dial: "57", national: "3001234567" })
  })

  it("formatea dígitos locales", () => {
    expect(formatE164("57", "3001234567")).toBe("+573001234567")
  })

  it("valida E.164", () => {
    expect(validateE164("+573001234567")).toBe(true)
    expect(validateE164("573001234567")).toBe(true)
    expect(validateE164("+1234")).toBe(false)
    expect(validateE164("")).toBe(false)
  })

  it("reconoce indicativo de tres dígitos", () => {
    expect(parseE164("+593991234567")).toEqual({ dial: "593", national: "991234567" })
  })
})
