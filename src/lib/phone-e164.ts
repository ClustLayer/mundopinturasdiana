export type PhoneCountry = {
  iso: string
  name: string
  dial: string
}

/** Diez países de la región (texto, sin banderas). Colombia por defecto. */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "CO", name: "Colombia", dial: "57" },
  { iso: "MX", name: "México", dial: "52" },
  { iso: "PE", name: "Perú", dial: "51" },
  { iso: "EC", name: "Ecuador", dial: "593" },
  { iso: "CL", name: "Chile", dial: "56" },
  { iso: "AR", name: "Argentina", dial: "54" },
  { iso: "BR", name: "Brasil", dial: "55" },
  { iso: "PA", name: "Panamá", dial: "507" },
  { iso: "US", name: "Estados Unidos", dial: "1" },
  { iso: "ES", name: "España", dial: "34" },
]

const DEFAULT_DIAL = "57"

const E164_RE = /^\+[1-9]\d{6,14}$/

function longestDialMatch(digits: string): { dial: string; national: string } {
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  for (const c of sorted) {
    if (digits.startsWith(c.dial)) {
      return { dial: c.dial, national: digits.slice(c.dial.length) }
    }
  }
  return { dial: DEFAULT_DIAL, national: digits }
}

export function parseE164(value: string): { dial: string; national: string } {
  const raw = (value || "").trim()
  if (!raw) return { dial: DEFAULT_DIAL, national: "" }
  const digits = raw.replace(/\D/g, "")
  if (!digits) return { dial: DEFAULT_DIAL, national: "" }
  const body = raw.startsWith("+") ? digits : digits
  const match = longestDialMatch(body)
  if (!match.national && body.length <= 3) {
    return { dial: body || DEFAULT_DIAL, national: "" }
  }
  return match
}

export function formatE164(dial: string, nationalDigits: string): string {
  const d = dial.replace(/\D/g, "") || DEFAULT_DIAL
  const n = nationalDigits.replace(/\D/g, "")
  if (!n) return ""
  return `+${d}${n}`
}

export function validateE164(value: string): boolean {
  const v = (value || "").trim()
  if (!v) return false
  const normalized = v.startsWith("+") ? v : `+${v.replace(/\D/g, "")}`
  return E164_RE.test(normalized)
}
