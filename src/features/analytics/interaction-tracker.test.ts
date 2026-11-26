import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { encolarInteraccion } from "./interaction-tracker"

describe("interaction-tracker", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it("agrupa clics y envía lote al backend", async () => {
    encolarInteraccion({ boton: "whatsapp_promo", pantalla: "home", id_promocion: 3 })
    await vi.advanceTimersByTimeAsync(1300)
    expect(fetch).toHaveBeenCalledTimes(1)
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(String(init.body)) as { interacciones: unknown[] }
    expect(body.interacciones).toHaveLength(1)
  })
})