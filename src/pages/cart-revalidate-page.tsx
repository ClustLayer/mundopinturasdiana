import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { useCart } from "../components/cart/cart-provider"
import { validarCarrito } from "../features/tienda/api"
import { formatCOPClient } from "../lib/format"
import { toast } from "../features/en-desarrollo"

const SEDE_KEY = "mpd-sede-id"

export function CartRevalidatePage() {
  const { lines, replace, subtotal } = useCart()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState("")
  const [huboCambios, setHuboCambios] = useState(false)
  const [totalServidor, setTotalServidor] = useState<number | null>(null)

  useEffect(() => {
    if (!lines.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const idSede = Number.parseInt(localStorage.getItem(SEDE_KEY) || "", 10) || undefined
        const payload = lines.map((l) => ({
          id_producto: Number(l.id),
          cantidad: l.quantity,
          precio_cliente: l.price,
        }))
        const data = await validarCarrito(idSede, payload)
        if (cancel) return
        setMensaje(data.mensaje)
        setHuboCambios(data.hubo_cambios)
        setTotalServidor(Number.parseFloat(data.total))
        if (data.hubo_cambios) {
          const next = data.items.map((it) => ({
            key: `${it.id_producto}|`,
            id: it.id_producto,
            slug: it.slug,
            name: it.nombre,
            sku: it.codigo_producto,
            price: Number.parseFloat(it.precio_unitario),
            quantity: it.cantidad,
            image: it.imagen_url,
          }))
          replace(next)
        }
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : "No fue posible validar su carrito. Intente nuevamente.")
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
    // Validación única al entrar (evita bucle al actualizar líneas desde el servidor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (loading) return <div className="skeleton mx-auto mt-20 h-64 max-w-3xl rounded-3xl" />

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <p className="font-display text-xl font-bold text-plum">{error}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-full bg-brand px-8 py-3 font-bold text-white">
          Reintentar
        </button>
      </div>
    )
  }

  const total = totalServidor ?? subtotal

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:px-10">
      <h1 className="font-display text-4xl font-extrabold text-plum">Revisión del pedido</h1>
      <p className="mt-4 text-ink/70" aria-live="polite">
        {mensaje}
      </p>
      {huboCambios && <p className="mt-2 text-sm font-semibold text-brand">Revise los cambios antes de continuar.</p>}
      <ul className="mt-8 space-y-3">
        {lines.map((l) => (
          <li key={l.key} className="flex justify-between rounded-2xl border border-plum/15 px-4 py-3">
            <span>
              {l.quantity}× {l.name}
            </span>
            <span className="font-bold">{formatCOPClient(l.price * l.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-right font-display text-2xl font-extrabold">{formatCOPClient(total)}</p>
      <div className="mt-8 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => {
            if (!huboCambios) toast("Su carrito está validado.")
            navigate("/carrito/enviar")
          }}
          className="rounded-full bg-brand px-8 py-3.5 font-bold text-white"
        >
          Aceptar cambios y continuar
        </button>
        <Link to="/carrito" className="rounded-full border-2 border-plum px-8 py-3.5 font-bold text-plum">
          Volver al carrito
        </Link>
      </div>
    </div>
  )
}