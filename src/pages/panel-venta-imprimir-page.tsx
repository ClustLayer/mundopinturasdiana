import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { InvoicePrint, type PrintSale } from "../components/panel/invoice-print"
import { toast } from "../features/en-desarrollo"
import { api, mensajeDe } from "../shared/api"

export function PanelVentaImprimirPage() {
  const { rol, id } = useParams<{ rol: string; id: string }>()
  const [sp, setSp] = useSearchParams()
  const formato = sp.get("formato") === "termico" ? "termico" : "carta"
  const [sale, setSale] = useState<PrintSale | null>(null)

  useEffect(() => {
    if (!id) return
    void api(`/api/v1/ventas/facturas/${id}/`).then(async (r) => {
      if (!r.ok) {
        toast((await mensajeDe(r)) || "No fue posible cargar la venta.")
        return
      }
      const d = (await r.json()) as { factura: PrintSale }
      setSale({
        ...d.factura,
        sede_detalle: d.factura.sede_detalle ?? {
          nombre: (d.factura as { sede?: string }).sede ?? "",
          direccion: "",
          telefono: "",
          ciudad: "",
        },
        cliente_detalle: d.factura.cliente_detalle ?? {
          nombre: (d.factura as { cliente?: string }).cliente ?? "",
          documento: "",
          telefono: "",
          direccion: "",
        },
        lineas: d.factura.lineas ?? [],
        pagos: d.factura.pagos ?? [],
        artistic_total: d.factura.artistic_total ?? 0,
      })
    })
  }, [id])

  if (!sale) return null

  const backHref = `/panel/${rol}/ventas${sale.numero_corto ? `?numero=${sale.numero_corto}` : ""}`

  return (
    <InvoicePrint
      sale={sale}
      formato={formato}
      backHref={backHref}
      onFormato={(f) => {
        setSp({ formato: f })
      }}
    />
  )
}