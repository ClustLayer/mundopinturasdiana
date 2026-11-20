import { Link } from "react-router-dom"
import { FormEvent, useEffect, useState } from "react"
import { useCart } from "../components/cart/cart-provider"
import { fetchTiendaSedes, prepararPedido, type TiendaSede } from "../features/tienda/api"
import { formatCOPClient } from "../lib/format"
import { toast } from "../features/en-desarrollo"
import { validateE164 } from "../lib/phone-e164"

const SEDE_KEY = "mpd-sede-id"

export function PedidoPage() {
  const { lines, subtotal, clear } = useCart()
  const [sedes, setSedes] = useState<TiendaSede[]>([])
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [notas, setNotas] = useState("")
  const [idSede, setIdSede] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTiendaSedes().then((s) => {
      setSedes(s)
      const guardada = localStorage.getItem(SEDE_KEY)
      if (guardada && s.some((x) => String(x.id_sede) === guardada)) setIdSede(guardada)
      else if (s[0]) setIdSede(String(s[0].id_sede))
    })
  }, [])

  if (!lines.length) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <p className="font-display text-2xl font-bold text-plum">Su carrito está vacío.</p>
        <Link to="/catalogo" className="mt-6 inline-block rounded-full bg-brand px-8 py-3 font-bold text-white">
          Ver catálogo
        </Link>
      </div>
    )
  }

  const enviar = async (ev: FormEvent) => {
    ev.preventDefault()
    setError(null)
    if (!nombre.trim()) {
      setError("Ingrese su nombre completo.")
      return
    }
    if (!validateE164(telefono)) {
      setError("Ingrese un número de teléfono móvil válido.")
      return
    }
    if (!idSede) {
      setError("Seleccione la sede que atenderá su pedido.")
      return
    }
    setLoading(true)
    try {
      localStorage.setItem(SEDE_KEY, idSede)
      const out = await prepararPedido({
        cliente_nombre: nombre.trim(),
        cliente_telefono: telefono.trim(),
        direccion_entrega: direccion.trim(),
        observaciones: notas.trim(),
        id_sede: Number(idSede),
        items: lines.map((l) => ({ id_producto: Number(l.id), cantidad: l.quantity })),
        clave_idempotencia: `web-${Date.now()}`,
      })
      toast(out.mensaje)
      window.open(out.url_whatsapp, "_blank", "noopener")
      clear()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No fue posible preparar su pedido. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:px-10">
      <h1 className="font-display text-4xl font-extrabold text-plum">Enviar pedido</h1>
      <form onSubmit={enviar} className="mt-10 space-y-5">
        <label className="block">
          <span className="font-semibold text-ink">Nombre completo</span>
          <input required maxLength={255} value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-plum/15 px-4 py-3" />
        </label>
        <label className="block">
          <span className="font-semibold text-ink">Teléfono móvil (E.164)</span>
          <input required placeholder="+57..." maxLength={20} value={telefono} onChange={(e) => setTelefono(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-plum/15 px-4 py-3" />
        </label>
        <label className="block">
          <span className="font-semibold text-ink">Dirección de entrega</span>
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-plum/15 px-4 py-3" />
        </label>
        <label className="block">
          <span className="font-semibold text-ink">Notas</span>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-plum/15 px-4 py-3" rows={3} />
        </label>
        <label className="block">
          <span className="font-semibold text-ink">Sede</span>
          <select required value={idSede} onChange={(e) => setIdSede(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-plum/15 px-4 py-3">
            <option value="">Seleccione sede</option>
            {sedes.map((s) => (
              <option key={s.id_sede} value={String(s.id_sede)}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <section aria-label="Resumen del pedido" className="rounded-2xl border border-plum/15 bg-white p-4">
          <h2 className="font-bold text-plum">Resumen</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {lines.map((l) => (
              <li key={l.key}>
                {l.quantity}× {l.name} — {formatCOPClient(l.price * l.quantity)}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-right font-display text-xl font-extrabold">{formatCOPClient(subtotal)}</p>
        </section>
        {error && (
          <p className="text-sm font-semibold text-brand" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="w-full rounded-full bg-[#1FA855] py-4 font-bold text-white disabled:opacity-60">
          Enviar pedido por WhatsApp
        </button>
      </form>
      <Link to="/carrito/validar" className="mt-6 inline-block text-sm font-bold text-plum hover:text-brand">
        Volver a validación
      </Link>
    </div>
  )
}