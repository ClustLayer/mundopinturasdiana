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

export function toast(message: string, tipo: "ok" | "error" = "ok") {
  window.clearTimeout(toastTimer)
  if (toastEl?.isConnected) toastEl.remove()
  const el = document.createElement("div")
  el.setAttribute("role", tipo === "error" ? "alert" : "status")
  const borde = tipo === "error" ? "border-brand" : "border-cyan"
  el.className = `pointer-events-auto fixed top-4 right-4 z-[200] flex w-auto max-w-md items-start gap-2 rounded-2xl border-2 ${borde} bg-white py-2.5 pl-4 pr-2 text-base font-semibold text-plum shadow-lg`
  const msg = document.createElement("span")
  msg.className = "min-w-0 flex-1 leading-snug"
  msg.textContent = message
  const close = document.createElement("button")
  close.type = "button"
  close.className = "grid size-9 shrink-0 place-items-center rounded-xl text-xl font-bold leading-none text-ink/55 hover:bg-plum/10 hover:text-brand"
  close.setAttribute("aria-label", "Cerrar notificación")
  close.textContent = "×"
  close.addEventListener("click", () => dismissToast(el))
  el.append(msg, close)
  document.body.appendChild(el)
  toastEl = el
  toastTimer = window.setTimeout(() => dismissToast(el), 3200)
}