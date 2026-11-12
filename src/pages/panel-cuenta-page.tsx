import { useEffect, useState } from "react"
import { Panel, btnPrimary, input, useDo } from "../components/panel/kit"
import { MSG } from "../features/usuarios/messages"
import { partirNombreCompleto, unirNombreCompleto } from "../features/perfil/logic"
import { toast } from "../features/en-desarrollo"
import { api, mensajeDe } from "../shared/api"

const BLOOD = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const

type Perfil = {
  nombre: string
  apellido: string
  telefono: string
  email: string
  documento: string
  rol_nombre: string
  tipo_sangre: string
  fecha_nacimiento: string
  direccion: string
  contacto_emergencia_nombre: string
  contacto_emergencia_telefono: string
}

export function PanelCuentaPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [nombreCompleto, setNombreCompleto] = useState("")
  const [error, setError] = useState("")
  const [passwordActual, setPasswordActual] = useState("")
  const [passwordNueva, setPasswordNueva] = useState("")
  const { run, pending } = useDo()

  useEffect(() => {
    void (async () => {
      try {
        const resp = await api("/api/v1/auth/profile")
        if (!resp.ok) {
          setError(MSG.perfilError)
          toast(MSG.perfilError)
          return
        }
        const data = (await resp.json()) as Perfil
        setPerfil({
          nombre: data.nombre,
          apellido: data.apellido ?? "",
          telefono: data.telefono ?? "",
          email: data.email,
          documento: data.documento,
          rol_nombre: data.rol_nombre,
          tipo_sangre: data.tipo_sangre ?? "",
          fecha_nacimiento: data.fecha_nacimiento ? String(data.fecha_nacimiento).slice(0, 10) : "",
          direccion: data.direccion ?? "",
          contacto_emergencia_nombre: data.contacto_emergencia_nombre ?? "",
          contacto_emergencia_telefono: data.contacto_emergencia_telefono ?? "",
        })
        setNombreCompleto(unirNombreCompleto(data.nombre, data.apellido ?? ""))
      } catch {
        setError(MSG.perfilError)
        toast(MSG.perfilError)
      }
    })()
  }, [])

  const lab = "block text-sm font-semibold"

  if (!perfil && !error) {
    return <p className="text-sm text-ink/60">Cargando perfil…</p>
  }

  return (
    <section>
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-cyan-dark">Mi perfil</p>
      <h1 className="font-display text-3xl font-extrabold text-plum">Mi perfil</h1>
      <p className="mt-2 max-w-3xl text-sm text-ink/60">Tus datos personales y tu contraseña.</p>
      {error && (
        <p role="alert" className="mt-4 rounded-xl border-2 border-brand p-3 text-sm text-brand-dark">
          {error}
        </p>
      )}
      {perfil && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[3fr_2fr]">
          <Panel title="Tu perfil">
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                run(async () => {
                  setError("")
                  const { nombre, apellido } = partirNombreCompleto(nombreCompleto)
                  const resp = await api("/api/v1/auth/profile", {
                    method: "PATCH",
                    body: JSON.stringify({
                      nombre,
                      apellido,
                      telefono: perfil.telefono,
                      tipo_sangre: perfil.tipo_sangre,
                      fecha_nacimiento: perfil.fecha_nacimiento || null,
                      direccion: perfil.direccion,
                      contacto_emergencia_nombre: perfil.contacto_emergencia_nombre,
                      contacto_emergencia_telefono: perfil.contacto_emergencia_telefono,
                    }),
                  })
                  const msg = await mensajeDe(resp)
                  if (!resp.ok) {
                    setError(msg || MSG.perfilError)
                    toast(msg || MSG.perfilError)
                    return
                  }
                  toast(msg || MSG.perfilOk)
                })
              }}
            >
              <label className={`${lab} sm:col-span-2`}>
                Nombre completo<span className="text-brand"> *</span>
                <input
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className={input}
                />
              </label>
              <div>
                <span className="text-xs text-ink/55">Correo</span>
                <p className="font-bold">{perfil.email}</p>
              </div>
              <div>
                <span className="text-xs text-ink/55">Rol</span>
                <p className="font-bold capitalize">{perfil.rol_nombre}</p>
              </div>
              <div>
                <span className="text-xs text-ink/55">Cédula</span>
                <p className="font-bold">{perfil.documento}</p>
              </div>
              <label className={lab}>
                Teléfono
                <input
                  type="tel"
                  value={perfil.telefono}
                  onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                  className={input}
                />
              </label>
              <label className={lab}>
                Tipo de sangre
                <select
                  value={perfil.tipo_sangre}
                  onChange={(e) => setPerfil({ ...perfil, tipo_sangre: e.target.value })}
                  className={input}
                >
                  <option value="">Sin indicar</option>
                  {BLOOD.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <label className={lab}>
                Fecha de nacimiento
                <input
                  type="date"
                  value={perfil.fecha_nacimiento}
                  onChange={(e) => setPerfil({ ...perfil, fecha_nacimiento: e.target.value })}
                  className={input}
                />
              </label>
              <label className={`${lab} sm:col-span-2`}>
                Dirección
                <input
                  value={perfil.direccion}
                  onChange={(e) => setPerfil({ ...perfil, direccion: e.target.value })}
                  className={input}
                />
              </label>
              <label className={lab}>
                Contacto de emergencia
                <input
                  value={perfil.contacto_emergencia_nombre}
                  onChange={(e) => setPerfil({ ...perfil, contacto_emergencia_nombre: e.target.value })}
                  className={input}
                />
              </label>
              <label className={lab}>
                Teléfono de emergencia
                <input
                  type="tel"
                  value={perfil.contacto_emergencia_telefono}
                  onChange={(e) => setPerfil({ ...perfil, contacto_emergencia_telefono: e.target.value })}
                  className={input}
                />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" disabled={pending} className={btnPrimary}>
                  Guardar perfil
                </button>
              </div>
            </form>
          </Panel>
          <Panel title="Cambiar contraseña">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                run(async () => {
                  setError("")
                  const resp = await api("/api/v1/auth/cambiar-contrasena", {
                    method: "POST",
                    body: JSON.stringify({
                      password_actual: passwordActual,
                      password: passwordNueva,
                      confirmar: passwordNueva,
                    }),
                  })
                  const msg = await mensajeDe(resp)
                  if (!resp.ok) {
                    setError(msg || MSG.perfilError)
                    toast(msg || MSG.perfilError)
                    return
                  }
                  toast(msg || "Su contraseña ha sido actualizada correctamente.")
                  setPasswordActual("")
                  setPasswordNueva("")
                })
              }}
            >
              <label className={lab}>
                Contraseña actual
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className={input}
                />
              </label>
              <label className={lab}>
                Nueva contraseña (mín. 8)
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                  className={input}
                />
              </label>
              <button type="submit" disabled={pending} className={btnPrimary}>
                Actualizar
              </button>
            </form>
          </Panel>
        </div>
      )}
    </section>
  )
}
