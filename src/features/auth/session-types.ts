export type Sesion = {
  nombre: string
  email: string
  rol: string
  debeCambiarPassword: boolean
  requiere2fa: boolean
  desafioToken: string | null
}
