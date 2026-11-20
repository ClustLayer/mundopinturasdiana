import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Printer } from "lucide-react"

export type PrintSale = {
  numero_corto: number | string
  consecutivo: string
  fecha_hora: string
  estado: string
  empleado: string
  sede_detalle: { nombre: string; direccion: string; telefono: string; ciudad: string }
  cliente_detalle: { nombre: string; documento: string; telefono: string; direccion: string }
  lineas: {
    producto: string
    cantidad: number
    precio_unitario: number
    descuento_porcentaje: number
    subtotal: number
    afecta_venta_diaria: boolean
  }[]
  subtotal: number
  descuento: number
  total: number
  artistic_total: number
  pagos: { metodo: string; valor: number; referencia: string }[]
  observaciones: string
}

const money = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)

const when = (v: string) =>
  new Date(v).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium", timeStyle: "short" })

const LEGAL = "Documento de venta — no es factura electrónica DIAN"

export function InvoicePrint({
  sale,
  formato,
  backHref,
  onFormato,
}: {
  sale: PrintSale
  formato: "carta" | "termico"
  backHref: string
  onFormato: (f: "carta" | "termico") => void
}) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const navigate = useNavigate()
  useEffect(() => setHost(document.body), [])
  if (!host) return null

  const normal = sale.lineas.filter((l) => l.afecta_venta_diaria !== false)
  const art = sale.lineas.filter((l) => l.afecta_venta_diaria === false)
  const carta = formato === "carta"
  const tab = "rounded-full px-4 py-1.5 text-sm font-bold transition"
  const numero = sale.numero_corto ?? sale.consecutivo

  return createPortal(
    <div className="inv-portal">
      <style>{`
        .inv-portal{position:fixed;inset:0;z-index:2000;overflow:auto;background:#e5e5e5;color:#111;font-family:ui-sans-serif,system-ui,sans-serif}
        .inv-bar{position:sticky;top:0;z-index:1;display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;padding:.75rem 1rem;background:#fff;border-bottom:1px solid #ccc}
        .inv-sheet{margin:1.5rem auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.2)}
        .inv-carta{width:8.5in;min-height:11in;padding:.6in;font-size:12px}
        .inv-termico{width:80mm;padding:4mm;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;line-height:1.35}
        .inv-sheet table{width:100%;border-collapse:collapse}
        .inv-carta th{background:#f3f0f7;text-align:left;padding:6px 8px;font-size:11px;text-transform:uppercase}
        .inv-carta td{padding:6px 8px;border-bottom:1px solid #e5e5e5}
        .inv-r{text-align:right}
        .inv-termico hr{border:0;border-top:1px dashed #000;margin:6px 0}
        .inv-termico td{padding:1px 0;vertical-align:top}
        @media print{
          @page{${carta ? "size:letter;margin:0" : "size:80mm auto;margin:0"}}
          body>*:not(.inv-portal){display:none!important}
          .inv-portal{position:static;overflow:visible;background:#fff}
          .inv-bar{display:none!important}
          .inv-sheet{margin:0;box-shadow:none}
          ${carta ? ".inv-carta{width:100%;min-height:0}" : ""}
          html,body{background:#fff!important}
        }
      `}</style>
      <div className="inv-bar">
        <button
          type="button"
          onClick={() => navigate(backHref)}
          className={`${tab} border-2 border-plum/20 text-plum`}
          title="Volver a ventas"
        >
          <ArrowLeft size={14} className="inline" /> Volver
        </button>
        <div className="flex gap-2" role="tablist" aria-label="Formato de impresión">
          <button
            type="button"
            role="tab"
            aria-selected={carta}
            onClick={() => onFormato("carta")}
            className={`${tab} ${carta ? "bg-plum text-white" : "border-2 border-plum/20 text-plum"}`}
          >
            Carta
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!carta}
            onClick={() => onFormato("termico")}
            className={`${tab} ${!carta ? "bg-plum text-white" : "border-2 border-plum/20 text-plum"}`}
          >
            Térmico 80 mm
          </button>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white"
        >
          <Printer size={15} /> Imprimir
        </button>
      </div>

      {carta ? (
        <article className="inv-sheet inv-carta">
          <header style={{ display: "flex", justifyContent: "space-between", gap: 24, borderBottom: "2px solid #333", paddingBottom: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <img src="/brand/logo.png" alt="Mundo Pinturas Diana" style={{ height: 56, width: "auto" }} />
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800 }}>Mundo Pinturas Diana</h1>
                <p>
                  {sale.sede_detalle.nombre}
                  {sale.sede_detalle.direccion ? ` · ${sale.sede_detalle.direccion}` : ""}
                  {sale.sede_detalle.ciudad ? `, ${sale.sede_detalle.ciudad}` : ""}
                </p>
                {sale.sede_detalle.telefono && <p>Tel. {sale.sede_detalle.telefono}</p>}
              </div>
            </div>
            <div className="inv-r">
              <p style={{ fontSize: 11, textTransform: "uppercase" }}>Venta N.º</p>
              <p style={{ fontSize: 24, fontWeight: 800 }}>{numero}</p>
              <p>{when(sale.fecha_hora)}</p>
              {sale.estado === "ANULADA" && <p style={{ fontWeight: 800, color: "#b00" }}>ANULADA</p>}
            </div>
          </header>
          <section style={{ display: "flex", justifyContent: "space-between", gap: 24, margin: "14px 0" }}>
            <div>
              <p style={{ fontWeight: 700 }}>Cliente</p>
              <p>{sale.cliente_detalle.nombre || "Cliente de mostrador"}</p>
              {sale.cliente_detalle.documento && <p>Doc. {sale.cliente_detalle.documento}</p>}
              {sale.cliente_detalle.telefono && <p>Tel. {sale.cliente_detalle.telefono}</p>}
              {sale.cliente_detalle.direccion && <p>{sale.cliente_detalle.direccion}</p>}
            </div>
            <div className="inv-r">
              <p style={{ fontWeight: 700 }}>Atendió</p>
              <p>{sale.empleado || "—"}</p>
            </div>
          </section>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th className="inv-r">Cant.</th>
                <th className="inv-r">Precio unit.</th>
                <th className="inv-r">Desc.</th>
                <th className="inv-r">Total</th>
              </tr>
            </thead>
            <tbody>
              {normal.map((l, i) => (
                <tr key={i}>
                  <td>{l.producto}</td>
                  <td className="inv-r">{l.cantidad}</td>
                  <td className="inv-r">{money(l.precio_unitario)}</td>
                  <td className="inv-r">{l.descuento_porcentaje ? `${l.descuento_porcentaje}%` : "—"}</td>
                  <td className="inv-r">{money(l.subtotal)}</td>
                </tr>
              ))}
              {art.length > 0 && (
                <tr>
                  <td colSpan={5} style={{ background: "#fafafa", fontWeight: 700, paddingTop: 10 }}>
                    Productos artísticos (se facturan pero no suman a las ventas)
                  </td>
                </tr>
              )}
              {art.map((l, i) => (
                <tr key={`a${i}`}>
                  <td>
                    {l.producto} <em>(artístico)</em>
                  </td>
                  <td className="inv-r">{l.cantidad}</td>
                  <td className="inv-r">{money(l.precio_unitario)}</td>
                  <td className="inv-r">{l.descuento_porcentaje ? `${l.descuento_porcentaje}%` : "—"}</td>
                  <td className="inv-r">{money(l.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <section style={{ display: "flex", justifyContent: "space-between", gap: 24, marginTop: 16 }}>
            <div>
              <p style={{ fontWeight: 700 }}>Forma de pago</p>
              {sale.pagos.map((p, i) => (
                <p key={i} style={{ textTransform: "capitalize" }}>
                  {p.metodo.toLowerCase()}
                  {p.referencia ? ` (${p.referencia})` : ""}: {money(p.valor)}
                </p>
              ))}
              {sale.observaciones && <p style={{ marginTop: 8 }}>Notas: {sale.observaciones}</p>}
            </div>
            <table style={{ width: "3in" }}>
              <tbody>
                <tr>
                  <td>Subtotal</td>
                  <td className="inv-r">{money(sale.subtotal)}</td>
                </tr>
                <tr>
                  <td>Descuento</td>
                  <td className="inv-r">−{money(sale.descuento)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 800, fontSize: 15 }}>Total</td>
                  <td className="inv-r" style={{ fontWeight: 800, fontSize: 15 }}>
                    {money(sale.total)}
                  </td>
                </tr>
                {sale.artistic_total > 0 && (
                  <tr>
                    <td colSpan={2} style={{ fontSize: 11 }}>
                      Incluye {money(sale.artistic_total)} en productos artísticos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
          <footer style={{ marginTop: 40, borderTop: "1px solid #999", paddingTop: 8, fontSize: 10, textAlign: "center" }}>
            <p style={{ fontWeight: 700 }}>{LEGAL}</p>
            <p>[Texto legal por definir con la administración.] Gracias por su compra.</p>
          </footer>
        </article>
      ) : (
        <article className="inv-sheet inv-termico">
          <div style={{ textAlign: "center" }}>
            <img src="/brand/logo.png" alt="Mundo Pinturas Diana" style={{ height: 40, width: "auto", margin: "0 auto 4px", filter: "grayscale(1)" }} />
            <p style={{ fontWeight: 700 }}>MUNDO PINTURAS DIANA</p>
            <p>{sale.sede_detalle.nombre}</p>
            {sale.sede_detalle.direccion && <p>{sale.sede_detalle.direccion}</p>}
            {sale.sede_detalle.telefono && <p>Tel. {sale.sede_detalle.telefono}</p>}
          </div>
          <hr />
          <p>
            Venta N.º {numero}
            {sale.estado === "ANULADA" ? " (ANULADA)" : ""}
          </p>
          <p>{when(sale.fecha_hora)}</p>
          <p>Atendió: {sale.empleado || "—"}</p>
          <p>
            Cliente: {sale.cliente_detalle.nombre || "Mostrador"}
            {sale.cliente_detalle.documento ? ` · ${sale.cliente_detalle.documento}` : ""}
          </p>
          <hr />
          <table>
            <tbody>
              {normal.map((l, i) => (
                <tr key={i}>
                  <td colSpan={2}>
                    {l.producto}
                    <br />
                    {l.cantidad} x {money(l.precio_unitario)}
                    {l.descuento_porcentaje ? ` -${l.descuento_porcentaje}%` : ""}
                  </td>
                  <td className="inv-r">{money(l.subtotal)}</td>
                </tr>
              ))}
              {art.length > 0 && (
                <tr>
                  <td colSpan={3}>
                    <b>ARTISTICOS (no suman a ventas)</b>
                  </td>
                </tr>
              )}
              {art.map((l, i) => (
                <tr key={`a${i}`}>
                  <td colSpan={2}>
                    {l.producto}
                    <br />
                    {l.cantidad} x {money(l.precio_unitario)}
                    {l.descuento_porcentaje ? ` -${l.descuento_porcentaje}%` : ""}
                  </td>
                  <td className="inv-r">{money(l.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr />
          <table>
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td className="inv-r">{money(sale.subtotal)}</td>
              </tr>
              <tr>
                <td>Descuento</td>
                <td className="inv-r">-{money(sale.descuento)}</td>
              </tr>
              <tr>
                <td>
                  <b>TOTAL</b>
                </td>
                <td className="inv-r">
                  <b>{money(sale.total)}</b>
                </td>
              </tr>
            </tbody>
          </table>
          <hr />
          {sale.pagos.map((p, i) => (
            <p key={i} style={{ textTransform: "capitalize" }}>
              {p.metodo.toLowerCase()}
              {p.referencia ? ` (${p.referencia})` : ""}: {money(p.valor)}
            </p>
          ))}
          <hr />
          <p style={{ textAlign: "center" }}>{LEGAL}</p>
          <p style={{ textAlign: "center" }}>Gracias por su compra</p>
        </article>
      )}
    </div>,
    host
  )
}