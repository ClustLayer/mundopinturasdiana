export function money(v: string | number | null | undefined) {
  if (v == null || v === "") return "—"
  const n = Number(v)
  if (Number.isNaN(n)) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)
}

export function dt(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })
  } catch {
    return iso
  }
}
