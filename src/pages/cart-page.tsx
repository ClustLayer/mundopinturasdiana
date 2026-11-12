import { CartClient } from "../components/cart/cart-client"
import { getBranches } from "../lib/public-data"

export function CartPage() {
  const branches = getBranches().map((b) => ({ id: b.id, name: b.name, address: b.address, whatsapp: b.whatsapp ?? undefined }))
  return (
    <div className="mx-auto max-w-7xl px-5 pb-8 pt-14 md:px-10">
      <h1 className="font-display text-5xl font-extrabold text-plum md:text-6xl">Tu carrito</h1>
      <div className="mt-10">
        <CartClient branches={branches} />
      </div>
    </div>
  )
}
