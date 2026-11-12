export const EN_DESARROLLO = "Funcionalidad en desarrollo"

export function avisoEnDesarrollo() {
  toast(EN_DESARROLLO)
}

let toastTimer = 0
let toastEl: HTMLDivElement | null = null

export function toast(message: string) {
  window.clearTimeout(toastTimer)
  if (toastEl?.isConnected) toastEl.remove()
  const el = document.createElement("div")
  el.setAttribute("role", "status")
  el.className =
    "fixed bottom-6 left-1/2 z-[100] max-w-md -translate-x-1/2 rounded-xl border-2 border-cyan bg-white px-5 py-3 text-sm font-semibold text-plum shadow-lg"
  el.textContent = message
  document.body.appendChild(el)
  toastEl = el
  toastTimer = window.setTimeout(() => {
    el.remove()
    if (toastEl === el) toastEl = null
  }, 3200)
}
