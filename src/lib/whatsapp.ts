export function digitosWhatsApp(e164: string | null | undefined): string | null {
  const digits = (e164 ?? "").replace(/\D/g, "")
  if (digits.length < 8 || digits.length > 15) return null
  return digits
}

export function urlWhatsApp(digitos: string): string {
  return `https://wa.me/${digitos}`
}
