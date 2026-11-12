import { useEffect, useRef, useState } from "react"

const SEL =
  'button, [role="button"], summary, input[type="submit"], input[type="checkbox"], [role="switch"], select, [data-tip]'

/** Tooltip único: data-tip, aria-label, title o texto del control. */
export function GlobalTooltips() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number; below: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const textOf = (el: HTMLElement) => {
      const t = el.getAttribute("title")
      if (t) {
        el.setAttribute("data-tip", t)
        el.removeAttribute("title")
      }
      const raw =
        el.getAttribute("data-tip") ||
        el.getAttribute("aria-label") ||
        (el as HTMLInputElement).placeholder ||
        (el as HTMLButtonElement).value ||
        el.textContent ||
        ""
      return raw.replace(/\s+/g, " ").trim().slice(0, 120)
    }
    const show = (e: Event) => {
      const el = (e.target as HTMLElement | null)?.closest?.(SEL) as HTMLElement | null
      if (!el || ((el as HTMLButtonElement).disabled && !el.dataset.tip)) return
      const text = textOf(el)
      if (!text) return
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        const r = el.getBoundingClientRect()
        const below = r.top < 48
        setTip({
          text,
          x: Math.min(Math.max(r.left + r.width / 2, 90), window.innerWidth - 90),
          y: below ? r.bottom + 8 : r.top - 8,
          below,
        })
      }, 350)
    }
    const hide = () => {
      clearTimeout(timer.current)
      setTip(null)
    }
    document.addEventListener("pointerover", show)
    document.addEventListener("focusin", show)
    document.addEventListener("pointerout", hide)
    document.addEventListener("focusout", hide)
    document.addEventListener("pointerdown", hide)
    window.addEventListener("scroll", hide, true)
    return () => {
      document.removeEventListener("pointerover", show)
      document.removeEventListener("focusin", show)
      document.removeEventListener("pointerout", hide)
      document.removeEventListener("focusout", hide)
      document.removeEventListener("pointerdown", hide)
      window.removeEventListener("scroll", hide, true)
    }
  }, [])

  if (!tip) return null
  return (
    <div
      role="tooltip"
      style={{ left: tip.x, top: tip.y }}
      className={`pointer-events-none fixed z-[100] max-w-[220px] -translate-x-1/2 ${tip.below ? "" : "-translate-y-full"} rounded-lg bg-ink px-2.5 py-1.5 text-center text-xs font-semibold leading-snug text-white shadow-lg`}
    >
      {tip.text}
    </div>
  )
}
