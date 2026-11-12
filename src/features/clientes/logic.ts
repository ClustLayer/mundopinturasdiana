const E164 = /^\+?[1-9]\d{6,14}$/
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function telefonoValido(t: string): boolean {
  return E164.test((t || "").trim())
}

export function correoValido(t: string): boolean {
  const v = (t || "").trim()
  return !v || EMAIL.test(v)
}

export const TEXTO_HABEAS =
  "Autorizo el tratamiento de mis datos personales para la gestión de ventas, facturación y comunicaciones comerciales según la Política de Privacidad de la empresa."
