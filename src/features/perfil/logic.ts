export function unirNombreCompleto(nombre: string, apellido: string): string {
  return [nombre.trim(), apellido.trim()].filter(Boolean).join(" ")
}

export function partirNombreCompleto(texto: string): { nombre: string; apellido: string } {
  const t = texto.trim()
  if (!t) return { nombre: "", apellido: "" }
  const i = t.indexOf(" ")
  if (i <= 0) return { nombre: t, apellido: t }
  return { nombre: t.slice(0, i).trim(), apellido: t.slice(i + 1).trim() }
}
