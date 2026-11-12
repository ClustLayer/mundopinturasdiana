import { Link } from "react-router-dom"
import { btnPrimary } from "../components/panel/kit"
import { rutaDeRol } from "../features/auth/logic"
import { useApp } from "../app/providers"

export function PanelAccesoDenegadoPage() {
  const { sesion } = useApp()
  const inicio = sesion ? rutaDeRol(sesion.rol) : "/login"
  return (
    <section className="mx-auto max-w-lg py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Acceso restringido</p>
      <h1 className="mt-3 font-display text-3xl font-extrabold text-plum">Acceso denegado</h1>
      <p className="mt-4 text-sm text-ink/70">No tiene permisos para acceder a este recurso.</p>
      <Link to={inicio} className={`${btnPrimary} mt-8 inline-flex`}>
        Ir al inicio
      </Link>
    </section>
  )
}
