const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const DOCUMENTO = /^[A-Za-z0-9]{6,15}$/
const TELEFONO = /^\+?[0-9]+$/

export function correoValido(email: string): boolean {
  const v = email.trim()
  return v.length > 0 && v.length <= 255 && EMAIL.test(v)
}

export function documentoValido(documento: string): boolean {
  const v = documento.trim()
  return v.length > 0 && v.length <= 20 && DOCUMENTO.test(v)
}

export function telefonoValido(telefono: string): boolean {
  const v = telefono.trim()
  if (!v) return true
  return v.length <= 20 && TELEFONO.test(v)
}

export function formularioUsuarioCompleto(datos: {
  nombre: string
  apellido: string
  documento: string
  email: string
  idRol: string
  idSede: string
}): boolean {
  return (
    datos.nombre.trim().length > 0 &&
    datos.apellido.trim().length > 0 &&
    datos.documento.trim().length > 0 &&
    datos.email.trim().length > 0 &&
    datos.idRol.trim().length > 0 &&
    datos.idSede.trim().length > 0
  )
}
