import { Link } from "react-router-dom"
import { Minus, Plus, Trash2, MessageCircle, ShoppingBag } from "lucide-react"
import { useCart } from "./cart-provider"
import { avisoEnDesarrollo, toast } from "../../features/en-desarrollo"
import { formatCOPClient, waLink } from "../../lib/format"

type Branch = { id: number | string; name: string; address: string; whatsapp?: string | null }

export function CartClient({ branches }: { branches: Branch[] }) {
  const { lines, ready, subtotal, setQty, remove, clear } = useCart()
  const branch = branches[0]

  if (!ready) return <div className="skeleton h-72 rounded-3xl" />
  if (!lines.length)
    return (
      <div className="stripes rounded-3xl border-2 border-dashed border-plum/30 p-16 text-center">
        <ShoppingBag className="mx-auto size-12 text-brand" aria-hidden />
        <p className="mt-4 font-display text-3xl font-bold text-plum">Tu carrito está vacío</p>
        <p className="mt-1 text-ink/65">Explora el catálogo y agrega lo que necesites.</p>
        <Link to="/catalogo" className="mt-6 inline-block rounded-full bg-brand px-7 py-3.5 font-bold text-white">
          Ir al catálogo
        </Link>
      </div>
    )

  const send = () => {
    if (!branch?.whatsapp) {
      avisoEnDesarrollo()
      return
    }
    const text = lines.map((l) => `${l.quantity}× ${l.name} (${l.sku})`).join("\n")
    window.open(waLink(branch.whatsapp, `Hola, quisiera confirmar este pedido:\n${text}\nTotal estimado: ${formatCOPClient(subtotal)}`), "_blank", "noopener")
    toast("Abriendo WhatsApp para confirmar tu pedido.")
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
      <ul className="space-y-4">
        {lines.map((l) => (
          <li key={l.key} className="flex gap-4 rounded-3xl border-2 border-plum/10 bg-white p-4 transition hover:border-plum/30">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-plum-soft">
              {l.image ? <img src={l.image} alt="" className="size-full object-cover" /> : <div className="dots h-full" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link to={`/catalogo/${l.slug}`} className="font-display text-lg font-bold leading-tight text-plum hover:text-brand">
                {l.name}
              </Link>
              <p className="font-mono text-xs text-ink/50">Ref. {l.sku}</p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center rounded-full border-2 border-plum/20">
                  <button type="button" aria-label={`Disminuir ${l.name}`} onClick={() => setQty(l.key, l.quantity - 1)} className="grid size-9 place-items-center text-plum">
                    <Minus className="size-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold" aria-live="polite">
                    {l.quantity}
                  </span>
                  <button type="button" aria-label={`Aumentar ${l.name}`} onClick={() => setQty(l.key, l.quantity + 1)} className="grid size-9 place-items-center text-plum">
                    <Plus className="size-4" />
                  </button>
                </div>
                <p className="font-display text-xl font-extrabold">{formatCOPClient(l.price * l.quantity)}</p>
              </div>
            </div>
            <button type="button" aria-label={`Quitar ${l.name}`} onClick={() => { remove(l.key); toast("Producto quitado") }} className="self-start text-ink/40 transition hover:text-brand">
              <Trash2 className="size-5" />
            </button>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-3xl border-2 border-plum bg-white p-6 shadow-[8px_8px_0_0_#E11D74] lg:sticky lg:top-28">
        <h2 className="font-display text-2xl font-extrabold text-plum">Resumen</h2>
        <dl className="mt-4 flex items-baseline justify-between border-b border-plum/10 pb-4">
          <dt className="text-ink/70">Total estimado</dt>
          <dd className="font-display text-3xl font-extrabold">{formatCOPClient(subtotal)}</dd>
        </dl>
        <p className="mt-3 rounded-xl bg-sun/30 p-3 text-xs font-medium text-ink">Precios sujetos a confirmación y disponibilidad.</p>
        <button type="button" onClick={send} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#1FA855] py-4 font-bold text-white transition hover:brightness-110">
          <MessageCircle className="size-5" aria-hidden /> Enviar pedido por WhatsApp
        </button>
        <button type="button" onClick={() => { clear(); toast("Carrito vaciado") }} className="mt-3 w-full text-sm font-bold text-ink/55 hover:text-brand">
          Vaciar carrito
        </button>
      </aside>
    </div>
  )
}
