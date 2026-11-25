import { API_URL } from "../../shared/api"

export type InteraccionClick = {
  boton: string
  pantalla: string
  id_promocion?: number | null
}

const ATTR_BOTON = "data-track-click"
const ATTR_PANTALLA = "data-track-screen"
const ATTR_PROMO = "data-track-promo-id"

const FLUSH_MS = 1200
const MAX_BATCH = 20

const cola: InteraccionClick[] = []
let timer: ReturnType<typeof setTimeout> | undefined
let instalado = false

function leerClick(el: HTMLElement): InteraccionClick | null {
  const boton = el.getAttribute(ATTR_BOTON)?.trim()
  if (!boton) return null
  const pantalla = el.getAttribute(ATTR_PANTALLA)?.trim() || window.location.pathname || "home"
  const rawPromo = el.getAttribute(ATTR_PROMO)?.trim()
  const id_promocion = rawPromo ? Number(rawPromo) : null
  return {
    boton,
    pantalla,
    id_promocion: id_promocion != null && !Number.isNaN(id_promocion) ? id_promocion : null,
  }
}

export function encolarInteraccion(evento: InteraccionClick): void {
  cola.push(evento)
  if (cola.length >= MAX_BATCH) {
    void vaciarCola()
    return
  }
  if (timer === undefined) {
    timer = window.setTimeout(() => {
      void vaciarCola()
    }, FLUSH_MS)
  }
}

async function vaciarCola(): Promise<void> {
  if (timer !== undefined) {
    window.clearTimeout(timer)
    timer = undefined
  }
  if (!cola.length) return
  const lote = cola.splice(0, MAX_BATCH)
  try {
    await fetch(`${API_URL}/api/v1/analitica/interacciones/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interacciones: lote }),
      credentials: "include",
      keepalive: true,
    })
  } catch {
    /* telemetría best-effort */
  }
  if (cola.length) void vaciarCola()
}

function onClick(ev: MouseEvent): void {
  const target = ev.target
  if (!(target instanceof Element)) return
  const el = target.closest<HTMLElement>(`[${ATTR_BOTON}]`)
  if (!el) return
  const evento = leerClick(el)
  if (evento) encolarInteraccion(evento)
}

export function initInteractionTracker(): void {
  if (instalado || typeof window === "undefined") return
  instalado = true
  document.addEventListener("click", onClick, true)
  window.addEventListener("pagehide", () => {
    void vaciarCola()
  })
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void vaciarCola()
  })
}