/** Texto #fff o #1b1220 según luminancia del fondo hex. */
export function contrastText(hex: string): string {
  const h = hex.replace("#", "")
  if (h.length !== 6) return "#1b1220"
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 150 ? "#1b1220" : "#ffffff"
}

export const TIPO_COLOR_PRESETS = ["#64748B", "#E11D74", "#4A154B", "#00ACC1", "#FFC93C", "#15803d", "#1d4ed8", "#c2410c"]
