export const MENSAJE_EN_DESARROLLO = "Funcionalidad en desarrollo"

export const MSG = {
  email: "El correo electrónico ingresado no tiene un formato válido.",
  passwordVacia: "La contraseña es obligatoria.",
  credenciales: "Credenciales no válidas, por favor intente de nuevo.",
  bloqueado: "Acceso temporalmente bloqueado. Intente más tarde o contacte al administrador.",
  errorLogin: "No fue posible iniciar sesión. Intente nuevamente.",
  bienvenida: (nombre: string) => `Bienvenido(a), ${nombre}.`,
  logout: "Sesión cerrada correctamente.",
  sesionExpirada: "Su sesión ya había expirado. Inicie sesión nuevamente.",
  logoutFallo: "No fue posible cerrar la sesión en el servidor. Intente nuevamente.",
  recuperacion: "Si el correo está registrado, recibirá un enlace para restablecer su contraseña.",
  resetOk: "Su contraseña ha sido restablecida. Ya puede iniciar sesión.",
  resetInvalido: "El enlace de recuperación no es válido o ha expirado. Solicite uno nuevo.",
  errorSolicitud: "No fue posible completar la solicitud. Intente nuevamente.",
  politica: "La contraseña no cumple los requisitos mínimos de seguridad.",
  noCoinciden: "Las contraseñas no coinciden.",
  actual: "La contraseña actual es incorrecta.",
  campos: "Todos los campos obligatorios deben ser diligenciados.",
  cambioOk: "Su contraseña ha sido actualizada correctamente.",
  cambioError: "No fue posible cambiar la contraseña. Intente nuevamente.",
  continua: "Su sesión continúa activa.",
  inactividad: "Su sesión expiró por inactividad. Inicie sesión nuevamente.",
  renovar: "No fue posible renovar la sesión. Inicie sesión nuevamente.",
  verificado: "Verificación completada.",
  codigoInvalido: "El código ingresado no es válido.",
  codigoExpirado: "El código ha expirado. Solicite uno nuevo.",
  codigoError: "No fue posible verificar el código. Intente nuevamente.",
  reenviado: "Se generó un nuevo código. El anterior quedó invalidado.",
} as const

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const ESPECIALES = new Set("!@#$%^&*")

export function correoValido(email: string): boolean {
  const valor = email.trim()
  return valor.length > 0 && valor.length <= 255 && EMAIL.test(valor)
}

export function puedeEnviarLogin(email: string, password: string): boolean {
  return email.trim().length > 0 && password.length > 0
}

export function puedeEnviarRecuperacion(email: string): boolean {
  return email.trim().length > 0
}

export function passwordCumplePolitica(password: string, actual?: string): boolean {
  if (actual !== undefined && password === actual) return false
  if (password.length < 8 || password.length > 64) return false
  let mayuscula = false
  let numero = false
  let especial = false
  for (const c of password) {
    if (c >= "A" && c <= "Z") mayuscula = true
    if (c >= "0" && c <= "9") numero = true
    if (ESPECIALES.has(c)) especial = true
  }
  return mayuscula && numero && especial
}

export function rutaDeRol(rol: string): string {
  if (rol === "Administrador") return "/panel/administrador"
  if (rol === "Gerente") return "/panel/gerente"
  return "/panel/empleado"
}

export function calcularAvisoMs(inactividadMinutos: number, avisoMinutos: number): number {
  return Math.max(inactividadMinutos - avisoMinutos, 1) * 60_000
}

export function tokenDesdeHash(hash: string): string {
  const params = new URLSearchParams(hash.replace(/^#/, ""))
  return params.get("rt") ?? ""
}
