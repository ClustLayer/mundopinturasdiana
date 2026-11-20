const horaBogota = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Bogota",
  hour: "numeric",
  hourCycle: "h23",
})

export function horaColombia(fecha: Date = new Date()): number {
  return Number(horaBogota.format(fecha))
}

export function saludoColombia(fecha: Date = new Date()): string {
  const hora = horaColombia(fecha)
  if (hora >= 5 && hora < 12) return "Buenos días"
  if (hora >= 12 && hora < 18) return "Buenas tardes"
  return "Buenas noches"
}
