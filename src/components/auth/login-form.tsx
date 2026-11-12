import { useState } from "react"
import { Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Navigate, useNavigate } from "react-router-dom"
import { MSG, correoValido, rutaDeRol } from "../../features/auth/logic"
import { api } from "../../shared/api"
import { useApp } from "../../app/providers"
import { RecoveryFlow } from "./recovery-flow"

export function LoginForm() {
  const { entrar, avisar, sesion } = useApp()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [success, setSuccess] = useState("")
  const [prefill, setPrefill] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const field = "mt-2 w-full rounded-xl border-2 border-plum/15 bg-white px-4 py-3.5 text-ink outline-none transition focus:border-cyan"

  if (sesion && !sesion.requiere2fa && !sesion.debeCambiarPassword) {
    return <Navigate to={rutaDeRol(sesion.rol)} replace />
  }

  if (recovering) {
    return (
      <RecoveryFlow
        onBack={() => setRecovering(false)}
        onDone={(msg, mail) => {
          setSuccess(msg)
          setPrefill(mail)
          setEmail(mail)
          setRecovering(false)
        }}
      />
    )
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    if (!correoValido(email)) {
      setError(MSG.email)
      return
    }
    if (!password) {
      setError(MSG.passwordVacia)
      return
    }
    setPending(true)
    try {
      const respuesta = await api("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email: email.trim(), password }) }, false)
      const data = (await respuesta.json()) as {
        mensaje?: string
        nombre?: string
        rol?: string
        email?: string
        access_token?: string
        desafio_token?: string
        debe_cambiar_password?: boolean
        requiere_2fa?: boolean
      }
      if (!respuesta.ok) {
        setError(data.mensaje || MSG.errorLogin)
        return
      }
      const requiere2fa = Boolean(data.requiere_2fa)
      const debe = Boolean(data.debe_cambiar_password)
      entrar(
        {
          nombre: data.nombre || email,
          email: data.email || email.trim(),
          rol: data.rol || "Empleado",
          debeCambiarPassword: debe,
          requiere2fa,
          desafioToken: data.desafio_token ?? null,
        },
        data.access_token ?? null,
      )
      if (data.mensaje) avisar(data.mensaje)
      if (requiere2fa && !data.access_token) navigate("/verificacion", { replace: true })
      else if (debe) navigate("/cambiar-contrasena", { replace: true })
      else navigate(rutaDeRol(data.rol || "Empleado"), { replace: true })
    } catch {
      setError(MSG.errorLogin)
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="w-full max-w-md" noValidate onSubmit={submit}>
      <p className="text-sm font-bold uppercase tracking-widest text-brand">Portal del equipo</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold text-plum">Inicia sesión</h1>
      <p className="mt-2 text-sm text-ink/60">Usa las credenciales que te asignó administración.</p>
      {success && (
        <p role="status" className="mt-6 flex items-start gap-2 rounded-xl border-2 border-cyan bg-cyan/5 p-3 text-sm font-medium text-plum">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> {success}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 flex items-start gap-2 rounded-xl border-2 border-brand bg-brand/5 p-3 text-sm font-medium text-brand-dark">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}
      <label className="mt-7 block text-sm font-semibold">
        Correo electrónico
        <input name="email" type="email" value={email || prefill} onChange={(e) => { setEmail(e.target.value); setPrefill("") }} autoComplete="username" required className={field} />
      </label>
      <label className="mt-5 block text-sm font-semibold">
        Contraseña
        <span className="relative block">
          <input name="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className={`${field} pr-12`} />
          <button type="button" title={show ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShow((s) => !s)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-plum/70 hover:bg-plum-soft">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      <button disabled={pending} title="Ingresar al sistema" aria-label="Ingresar al sistema" className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 font-bold text-white shadow-[4px_4px_0_0_var(--color-plum)] transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:opacity-60">
        {pending && <Loader2 size={18} className="animate-spin" />} Ingresar al sistema
      </button>
      <button type="button" onClick={() => setRecovering(true)} title="Recuperar contraseña" aria-label="¿Olvidaste tu contraseña?" className="mt-5 text-sm font-semibold text-plum underline-offset-4 hover:text-brand hover:underline">
        ¿Olvidaste tu contraseña?
      </button>
      <p className="mt-6 text-xs leading-relaxed text-ink/50">Tras 5 intentos fallidos la cuenta se bloquea 15 minutos. El acceso queda registrado en auditoría.</p>
    </form>
  )
}
