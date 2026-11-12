export type DemoUser = {
  id: string
  collection: "users"
  email: string
  password: string
  name: string
  role: "admin" | "gerente" | "empleado"
  status: "activo"
  branch?: string
  document?: string
  phone?: string
}
