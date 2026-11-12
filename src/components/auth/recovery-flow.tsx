import { useEffect, useState, useTransition } from "react"
import { Loader2, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react"
import { MSG, correoValido } from "../../features/auth/logic"
import { api, mensajeDe } from "../../shared/api"

const field = "mt-2 w-full rounded-xl border-2 border-plum/15 bg-white px-4 py-3.5 text-ink outline-none transition focus:border-cyan"
const primary =
  "mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 font-bold text-white shadow-[4px_4px_0_0_var(--color-plum)] transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:opacity-60"
const COOLDOWN = 60

export function RecoveryFlow({ onDone, onBack }: { onDone: (msg: string, email: string) => void; onBack: () => void }) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [cool, setCool] = useState(0)
  const [pending, start] = useTransition()

  useEffect(() => {
    if (cool <= 0) return
    const t = setTimeout(() => setCool((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cool])

  const send = (resend = false) => {
    setError("")
    if (!correoValido(email)) {
      setError(MSG.email)
      return
    }
    start(async () => {
      try {
        const respuesta = await api("/api/v1/auth/recuperar", { method: "POST", body: JSON.stringify({ email: email.trim() }) }, false)
        const texto = await mensajeDe(respuesta)
        if (!respuesta.ok) {
          setError(texto || MSG.errorSolicitud)
          return
        }
        const mensaje = texto || MSG.recuperacion
        setInfo(mensaje)
        setCool(COOLDOWN)
        if (!resend) onDone(mensaje, email.trim())
        setSent(true)
      } catch {
        setError(MSG.errorSolicitud)
      }
    })
  }

  return (
    <div className="w-full max-w-md">
      <p className="text-sm font-bold uppercase tracking-widest text-brand">Recuperar acceso</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold text-plum">¿Olvidaste tu contraseña?</h1>
      <p className="mt-2 text-sm text-ink/60">
        Escribe tu correo y te enviaremos un enlace seguro. Ábrelo en el navegador y completa el restablecimiento en la página de nueva contraseña (el token viaja en el enlace, no es un código de 6 dígitos).
      </p>
      {error && (
        <p role="alert" className="mt-6 flex items-start gap-2 rounded-xl border-2 border-brand bg-brand/5 p-3 text-sm font-medium text-brand-dark">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}
      {(sent || info) && (
        <p role="status" className="mt-6 flex items-start gap-2 rounded-xl border-2 border-cyan bg-cyan/5 p-3 text-sm font-medium text-plum">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> {info || MSG.recuperacion}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        noValidate
      >
        <label className="mt-7 block text-sm font-semibold">
          Correo electrónico
          <input value={email} onChange={(e) => setEmail(e.target.value)} name="email" type="email" autoComplete="username" required className={field} />
        </label>
        <button disabled={pending} title="Enviar enlace" aria-label="Enviar enlace de recuperación" className={primary}>
          {pending && <Loader2 size={18} className="animate-spin" />} Enviar enlace
        </button>
        {sent && (
          <button
            type="button"
            disabled={pending || cool > 0}
            onClick={() => send(true)}
            title="Reenviar enlace"
            aria-label="Reenviar enlace de recuperación"
            className="mt-4 w-full rounded-xl border-2 border-plum/15 px-5 py-3 text-sm font-bold text-plum transition hover:bg-plum-soft disabled:opacity-60"
          >
            {cool > 0 ? `Reenviar enlace en ${cool} s` : "Reenviar enlace"}
          </button>
        )}
      </form>
      <button
        type="button"
        onClick={onBack}
        title="Volver a iniciar sesión"
        aria-label="Volver a iniciar sesión"
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-plum hover:text-brand"
      >
        <ArrowLeft size={16} /> Volver a iniciar sesión
      </button>
    </div>
  )
}
