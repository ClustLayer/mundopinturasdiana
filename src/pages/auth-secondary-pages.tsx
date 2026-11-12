import { useState, type FormEvent, type ReactNode } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { MSG, passwordCumplePolitica, rutaDeRol, tokenDesdeHash } from "../features/auth/logic"
import { api, mensajeDe } from "../shared/api"
import { useApp } from "../app/providers"
import { EnDesarrolloRecuadro } from "../components/ui/en-desarrollo-recuadro"
import { useAccesos } from "../features/accesos/accesos-provider"
import { useParams } from "react-router-dom"
import { PanelAccesoDenegadoPage } from "./panel-acceso-denegado-page"
import { PanelAuditoriaPage } from "./panel-auditoria-page"
import { PanelParametrosPage, PanelProductosPage } from "./panel-productos-page"
import { PanelCuentaPage } from "./panel-cuenta-page"
import { PanelPermisosPage } from "./panel-permisos-page"
import { PanelSedesPage } from "./panel-sedes-page"
import { PanelUsuariosPage } from "./panel-usuarios-page"

const campo = "mt-2 w-full rounded-xl border-2 border-plum/15 bg-white px-4 py-3.5 text-ink outline-none focus:border-cyan"
const boton = "mt-7 flex w-full items-center justify-center rounded-xl bg-brand px-5 py-3.5 font-bold text-white shadow-[4px_4px_0_0_var(--color-plum)] disabled:cursor-not-allowed disabled:opacity-50"

function Marco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-plum p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <img src="/brand/logo.png" alt="Mundo Pinturas Diana" className="relative size-20 rounded-full bg-white p-1" />
        <div>
          <h2 className="font-display text-5xl font-extrabold leading-[0.95]">Todo el negocio, en un solo lugar.</h2>
          <p className="mt-6 max-w-md text-white/75">Ventas, inventario, caja y clientes conectados para decidir mejor.</p>
        </div>
        <p className="text-sm text-white/60">Acceso exclusivo para personal autorizado.</p>
      </section>
      <section className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <Link to="/" className="mb-8 text-sm font-semibold text-plum hover:text-brand">
          Volver al sitio
        </Link>
        <div className="w-full max-w-md">
          <p className="text-sm font-bold uppercase tracking-widest text-brand">Portal del equipo</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold text-plum">{titulo}</h1>
          {children}
        </div>
      </section>
    </main>
  )
}

function PasswordField({ id, label, value, onChange, autoComplete }: { id: string; label: string; value: string; onChange: (valor: string) => void; autoComplete: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="mt-5 block text-sm font-semibold" htmlFor={id}>
      {label}
      <span className="relative block">
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} type={visible ? "text" : "password"} autoComplete={autoComplete} className={`${campo} pr-28`} />
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-plum" aria-pressed={visible} onClick={() => setVisible((v) => !v)}>
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </span>
    </label>
  )
}

export function RecuperarPage() {
  return <Navigate to="/login" replace />
}

export function NuevaContrasenaPage() {
  const navigate = useNavigate()
  const { avisar } = useApp()
  const [token] = useState(() => tokenDesdeHash(window.location.hash))
  const [password, setPassword] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [error, setError] = useState("")
  const enviar = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!password || !confirmar) return setError(MSG.campos)
    if (!passwordCumplePolitica(password)) return setError(MSG.politica)
    if (password !== confirmar) return setError(MSG.noCoinciden)
    if (!token) return setError(MSG.resetInvalido)
    try {
      const respuesta = await api("/api/v1/auth/restablecer", { method: "POST", body: JSON.stringify({ token, password, confirmar }) }, false)
      const texto = await mensajeDe(respuesta)
      if (!respuesta.ok) return setError(texto || MSG.errorSolicitud)
      avisar(texto || MSG.resetOk)
      navigate("/login", { replace: true })
    } catch {
      setError(MSG.errorSolicitud)
    }
  }
  return (
    <Marco titulo="Nueva contraseña">
      <p className="mt-2 text-sm text-ink/60">Elija una contraseña de 8 a 64 caracteres, con mayúscula, número y un carácter de !@#$%^&*.</p>
      {error && <p role="alert" className="mt-4 rounded-xl border-2 border-brand p-3 text-sm text-brand-dark">{error}</p>}
      {!token && (
        <p role="alert" className="mt-4 text-sm text-brand-dark">
          {MSG.resetInvalido}{" "}
          <Link to="/login" className="underline">
            Volver al inicio de sesión
          </Link>
        </p>
      )}
      <form onSubmit={enviar}>
        <PasswordField id="nueva" label="Nueva contraseña" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordField id="confirma" label="Confirmar nueva contraseña" value={confirmar} onChange={setConfirmar} autoComplete="new-password" />
        <button className={boton} disabled={!password || !confirmar} type="submit">
          Restablecer contraseña
        </button>
      </form>
    </Marco>
  )
}

export function VerificacionPage() {
  const { sesion, actualizar, avisar } = useApp()
  const navigate = useNavigate()
  const [codigo, setCodigo] = useState("")
  const [error, setError] = useState("")
  if (!sesion) return <Navigate to="/login" replace />
  const enviar = async (evento: FormEvent) => {
    evento.preventDefault()
    try {
      const respuesta = await api(
        "/api/v1/auth/verificar-2fa",
        { method: "POST", body: JSON.stringify({ codigo, desafio_token: sesion.desafioToken ?? "" }) },
        false,
      )
      const data = (await respuesta.json()) as { mensaje?: string; access_token?: string; debe_cambiar_password?: boolean }
      if (!respuesta.ok) return setError(data.mensaje || MSG.codigoError)
      actualizar({ requiere2fa: false, debeCambiarPassword: Boolean(data.debe_cambiar_password), desafioToken: null }, data.access_token ?? null)
      avisar(data.mensaje || MSG.verificado)
      navigate(data.debe_cambiar_password ? "/cambiar-contrasena" : rutaDeRol(sesion.rol), { replace: true })
    } catch {
      setError(MSG.codigoError)
    }
  }
  const reenviar = async () => {
    const respuesta = await api("/api/v1/auth/reenviar-2fa", { method: "POST", body: JSON.stringify({ desafio_token: sesion.desafioToken ?? "" }) }, false)
    const data = (await respuesta.json().catch(() => ({}))) as { mensaje?: string; desafio_token?: string }
    const texto = data.mensaje || (await mensajeDe(respuesta))
    if (!respuesta.ok) setError(texto || MSG.codigoError)
    else {
      if (data.desafio_token) actualizar({ desafioToken: data.desafio_token })
      avisar(texto || MSG.reenviado)
    }
  }
  return (
    <Marco titulo="Verificación en dos pasos">
      <p className="mt-2 text-sm text-ink/60">Ingrese el código de 6 dígitos enviado a su correo. Vence en 10 minutos.</p>
      {error && <p role="alert" className="mt-4 rounded-xl border-2 border-brand p-3 text-sm text-brand-dark">{error}</p>}
      <form onSubmit={enviar}>
        <label className="mt-6 block text-sm font-semibold">
          Código de verificación
          <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))} className={campo} />
        </label>
        <button className={boton} disabled={codigo.length === 0} type="submit">
          Verificar
        </button>
      </form>
      <button type="button" className="mt-4 text-sm font-semibold text-plum underline" onClick={() => void reenviar()}>
        Reenviar código
      </button>
    </Marco>
  )
}

export function CambiarContrasenaPage() {
  const { sesion, actualizar, avisar } = useApp()
  const navigate = useNavigate()
  const [actual, setActual] = useState("")
  const [password, setPassword] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [error, setError] = useState("")
  if (!sesion) return <Navigate to="/login" replace />
  const obligatorio = sesion.debeCambiarPassword
  const enviar = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!actual || !password || !confirmar) return setError(MSG.campos)
    if (!passwordCumplePolitica(password, actual)) return setError(MSG.politica)
    if (password !== confirmar) return setError(MSG.noCoinciden)
    try {
      const respuesta = await api("/api/v1/auth/cambiar-contrasena", { method: "POST", body: JSON.stringify({ password_actual: actual, password, confirmar }) })
      const data = (await respuesta.json()) as { mensaje?: string; access_token?: string; requiere_2fa?: boolean; desafio_token?: string }
      if (!respuesta.ok) return setError(data.mensaje || MSG.cambioError)
      actualizar(
        {
          debeCambiarPassword: false,
          requiere2fa: Boolean(data.requiere_2fa),
          desafioToken: data.desafio_token ?? null,
        },
        data.access_token ?? null,
      )
      avisar(data.mensaje || MSG.cambioOk)
      navigate(data.requiere_2fa ? "/verificacion" : rutaDeRol(sesion.rol), { replace: true })
    } catch {
      setError(MSG.cambioError)
    }
  }
  return (
    <Marco titulo="Cambiar contraseña">
      <p className="mt-2 text-sm text-ink/60">{obligatorio ? "Debe actualizar la contraseña temporal antes de continuar." : "Puede volver a su panel si prefiere no cambiarla ahora."}</p>
      {error && <p role="alert" className="mt-4 rounded-xl border-2 border-brand p-3 text-sm text-brand-dark">{error}</p>}
      <form onSubmit={enviar}>
        <PasswordField id="actual" label="Contraseña actual" value={actual} onChange={setActual} autoComplete="current-password" />
        <PasswordField id="nueva-auth" label="Nueva contraseña" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordField id="confirma-auth" label="Confirmar nueva contraseña" value={confirmar} onChange={setConfirmar} autoComplete="new-password" />
        <button className={boton} disabled={!actual || !password || !confirmar} type="submit">
          Guardar contraseña
        </button>
      </form>
      {!obligatorio && (
        <button type="button" className="mt-4 text-sm font-semibold text-plum" onClick={() => navigate(rutaDeRol(sesion.rol))}>
          Cancelar
        </button>
      )}
    </Marco>
  )
}

export function PanelModulePage() {
  const { sesion, sesionLista } = useApp()
  const { modulo: moduloParam } = useParams<{ modulo: string }>()
  const modulo = moduloParam ?? "modulo"
  const { puedeModulo, error: accesosError } = useAccesos()
  if (!sesionLista) return null
  if (!sesion) return <Navigate to="/login" replace />
  if (modulo !== "cuenta" && !puedeModulo(modulo) && !accesosError) {
    return <PanelAccesoDenegadoPage />
  }
  if (modulo === "usuarios" && (puedeModulo("usuarios") || accesosError)) return <PanelUsuariosPage />
  if (modulo === "permisos" && sesion.rol === "Administrador" && (puedeModulo("permisos") || accesosError)) {
    return <PanelPermisosPage />
  }
  if (modulo === "sedes" && (puedeModulo("sedes") || accesosError)) return <PanelSedesPage />
  if (modulo === "productos" && (puedeModulo("productos") || accesosError)) return <PanelProductosPage />
  if (modulo === "categorias" && (puedeModulo("categorias") || puedeModulo("productos") || accesosError)) return <PanelParametrosPage />
  if (modulo === "auditoria" && (puedeModulo("auditoria") || accesosError)) return <PanelAuditoriaPage />
  if (modulo === "cuenta") return <PanelCuentaPage />
  return (
    <section>
      <h1 className="font-display text-3xl font-extrabold text-plum capitalize">{modulo.replace(/-/g, " ")}</h1>
      <p className="mt-3 max-w-xl text-ink/70">Estructura del módulo según la demo; los datos operativos se cargarán desde el backend.</p>
      <div className="mt-8 max-w-2xl">
        <EnDesarrolloRecuadro />
      </div>
    </section>
  )
}

export function NoEncontrada() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-paper px-6 py-16">
      <style>{`
        @keyframes drip { 0% { transform: translateY(-20vh) scaleY(.6); opacity: 0 } 20% { opacity: .9 } 100% { transform: translateY(110vh) scaleY(1); opacity: .15 } }
        @keyframes blob { 0%,100% { transform: translate3d(0,0,0) rotate(0deg) } 50% { transform: translate3d(12px,-18px,0) rotate(8deg) } }
      `}</style>
      {["#E11D74", "#00ACC1", "#FFC93C", "#4A154B", "#E11D74"].map((color, i) => (
        <span
          key={color + i}
          aria-hidden
          className="pointer-events-none absolute top-0 w-3 rounded-full"
          style={{
            left: `${12 + i * 16}%`,
            height: `${80 + i * 18}px`,
            background: color,
            animation: `drip ${6 + i}s ${i * 0.6}s ease-in infinite`,
            filter: "blur(0.2px)",
          }}
        />
      ))}
      <div className="pointer-events-none absolute -left-16 top-10 size-64 rounded-full bg-brand/20 blur-2xl" style={{ animation: "blob 7s ease-in-out infinite" }} />
      <div className="pointer-events-none absolute -right-10 bottom-8 size-72 rounded-full bg-cyan/30 blur-2xl" style={{ animation: "blob 9s ease-in-out infinite" }} />
      <section className="relative max-w-xl rounded-[2rem] border-2 border-plum bg-white/90 p-10 text-center shadow-[10px_10px_0_0_#E11D74] backdrop-blur">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-dark">Mundo Pinturas Diana</p>
        <p className="mt-4 font-display text-[7rem] font-extrabold leading-none text-plum">404</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-plum">Este color no está en el catálogo</h1>
        <p className="mt-3 text-ink/70">La página que buscas se movió o nunca se mezcló. Vuelve al inicio y seguimos pintando Cali.</p>
        <Link to="/" className="mt-8 inline-flex rounded-full bg-brand px-7 py-3.5 font-bold text-white shadow-[4px_4px_0_0_#4A154B] transition hover:-translate-y-0.5">
          Volver al inicio
        </Link>
      </section>
    </main>
  )
}
