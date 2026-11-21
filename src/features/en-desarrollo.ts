export const EN_DESARROLLO = "Funcionalidad en desarrollo"

export function avisoEnDesarrollo() {
  toast(EN_DESARROLLO)
}

let toastTimer = 0
let toastEl: HTMLDivElement | null = null

function dismissToast(el: HTMLDivElement) {
  el.remove()
  if (toastEl === el) toastEl = null
  window.clearTimeout(toastTimer)
}

export function toast(message: string) {
  window.clearTimeout(toastTimer)
  if (toastEl?.isConnected) toastEl.remove()
  const el = document.createElement("div")
  el.setAttribute("role", "status")
  const panel = document.querySelector("[data-panel-shell]")
  const inPanel = Boolean(panel)
  el.className = inPanel
    ? "pointer-events-auto fixed top-4 right-4 z-[200] flex max-w-sm items-start gap-2 rounded-xl border border-plum/15 bg-white py-2 pl-3 pr-2 text-sm font-semibold text-plum shadow-lg"
    : "pointer-events-auto fixed top-4 right-4 z-[200] flex max-w-sm items-start gap-2 rounded-xl border border-cyan/40 bg-white py-2 pl-3 pr-2 text-sm font-semibold text-plum shadow-lg"
  const msg = document.createElement("span")
  msg.className = "min-w-0 flex-1 leading-snug"
  msg.textContent = message
  const close = document.createElement("button")
  close.type = "button"
  close.className = "grid size-7 shrink-0 place-items-center rounded-lg text-ink/50 hover:bg-plum/10 hover:text-plum"
  close.setAttribute("aria-label", "Cerrar notificación")
  close.textContent = "×"
  close.addEventListener("click", () => dismissToast(el))
  el.append(msg, close)
  document.body.appendChild(el)
  toastEl = el
  toastTimer = window.setTimeout(() => dismissToast(el), 2200)
}
