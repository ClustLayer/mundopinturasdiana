const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function correoValido(t: string): boolean {
  const v = (t || "").trim()
  return !v || EMAIL.test(v)
}

export const TIPOS_DOCUMENTO = [
  { v: "NIT", l: "NIT" },
  { v: "CC", l: "Cédula de ciudadanía" },
  { v: "Pasaporte", l: "Pasaporte" },
] as const
