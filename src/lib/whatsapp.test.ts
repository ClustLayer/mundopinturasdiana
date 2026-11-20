import { describe, expect, it } from "vitest"
import { digitosWhatsApp, urlWhatsApp } from "./whatsapp"

describe("whatsapp", () => {
  it("acepta E.164 y rechaza vacíos o longitudes inválidas", () => {
    expect(digitosWhatsApp("+573001234567")).toBe("573001234567")
    expect(digitosWhatsApp("")).toBeNull()
    expect(digitosWhatsApp("+123")).toBeNull()
    expect(digitosWhatsApp("+1234567890123456")).toBeNull()
  })

  it("arma la URL solo con dígitos", () => {
    expect(urlWhatsApp("573001234567")).toBe("https://wa.me/573001234567")
  })
})
