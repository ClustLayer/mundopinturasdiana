import { CartClient } from "../components/cart/cart-client"

export function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-8 pt-14 md:px-10">
      <h1 className="font-display text-5xl font-extrabold text-plum md:text-6xl">Tu carrito</h1>
      <div className="mt-10">
        <CartClient />
      </div>
    </div>
  )
}
