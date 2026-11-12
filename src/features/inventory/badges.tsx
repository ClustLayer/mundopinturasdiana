const TYPE_LABEL: Record<string, string> = {
  entrada_compra: "Entrada",
  venta: "Venta",
  ajuste_positivo: "Ajuste +",
  ajuste_negativo: "Ajuste −",
  merma: "Merma / daño",
  devolucion: "Devolución",
  anulacion: "Anulación",
  traslado_entrada: "Traslado entrada",
  traslado_salida: "Traslado salida",
}
const TYPE_TONE: Record<string, string> = {
  entrada_compra: "bg-emerald-100 text-emerald-800",
  traslado_entrada: "bg-emerald-100 text-emerald-800",
  venta: "bg-rose-100 text-rose-700",
  merma: "bg-rose-100 text-rose-700",
  traslado_salida: "bg-rose-100 text-rose-700",
  ajuste_positivo: "bg-amber-100 text-amber-800",
  ajuste_negativo: "bg-amber-100 text-amber-800",
  devolucion: "bg-cyan-100 text-cyan-800",
  anulacion: "bg-slate-200 text-slate-700",
}

export function TypeBadge({ value }: { value: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${TYPE_TONE[value] ?? "bg-plum-soft text-plum"}`}>
      {TYPE_LABEL[value] ?? value}
    </span>
  )
}

export function OriginBadge({ value }: { value?: string }) {
  const fabricado = value === "fabricado"
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${fabricado ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800"}`}>
      {fabricado ? "Fabricado" : "Comprado"}
    </span>
  )
}
