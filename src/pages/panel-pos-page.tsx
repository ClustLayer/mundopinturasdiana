import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, Minus, Plus, Search, Trash2 } from "lucide-react"
import { btnPrimary, btnGhost, Empty, FieldLabel, FormAlert, SearchCombobox, input, useDebounced, useDo } from "../components/panel/kit"
import { toast } from "../features/en-desarrollo"
import { cambioCliente, pagosCubrenTotal, saldoPendiente } from "../features/ventas/logic"
import { api, mensajeDe } from "../shared/api"
import { useAccesos } from "../features/accesos/accesos-provider"
import { puedeAccion } from "../features/accesos/logic"
import { Link } from "react-router-dom"

type Catalogos = {
  sedes: { id_sede: number; nombre: string }[]
  tipos_venta: { id_tipo_venta: number; nombre: string }[]
  metodos_pago: { id_metodo_pago: number; nombre: string }[]
}

type ProductoOp = {
  id_producto: number
  nombre: string
  codigo: string
  precio_venta: number
  stock_disponible: number | null
  inventario_habilitado: boolean
  iva_porcentaje: number
}

type Linea = {
  uid: number
  id_producto: number
  nombre: string
  cantidad: number
  precio: number
  descuento_porcentaje: number
  inventario_habilitado: boolean
  stock?: number | null
}

type PagoLinea = { uid: number; id_metodo_pago: string; valor: string; referencia: string }

let lineUid = 1
let payUid = 1

const money = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)

export function PanelPosPage() {
  const { accionesModulo } = useAccesos()
  const puedeEmitir = puedeAccion(accionesModulo("pos"), "Crear") || puedeAccion(accionesModulo("pos"), "Total")
  const [cat, setCat] = useState<Catalogos | null>(null)
  const [idSede, setIdSede] = useState("")
  const [idTipo, setIdTipo] = useState("")
  const [q, setQ] = useState("")
  const qDeb = useDebounced(q, 300)
  const [ops, setOps] = useState<ProductoOp[]>([])
  const [lineas, setLineas] = useState<Linea[]>([])
  const [pagos, setPagos] = useState<PagoLinea[]>([{ uid: payUid++, id_metodo_pago: "", valor: "", referencia: "" }])
  const [idCliente, setIdCliente] = useState("")
  const [clientesOps, setClientesOps] = useState<{ id: string; label: string }[]>([])
  const [requiereFe, setRequiereFe] = useState(false)
  const [emitida, setEmitida] = useState<{ consecutivo: string; total: number } | null>(null)
  const [error, setError] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const { run, pending } = useDo()

  useEffect(() => {
    void api("/api/v1/ventas/pos/catalogos/").then(async (r) => {
      if (!r.ok) return toast("No fue posible cargar el punto de venta.")
      const d = (await r.json()) as Catalogos
      setCat(d)
      if (d.sedes[0]) setIdSede(String(d.sedes[0].id_sede))
      if (d.tipos_venta[0]) setIdTipo(String(d.tipos_venta[0].id_tipo_venta))
      const ef = d.metodos_pago.find((m) => m.nombre === "Efectivo")
      if (ef) setPagos([{ uid: payUid++, id_metodo_pago: String(ef.id_metodo_pago), valor: "", referencia: "" }])
    })
  }, [])

  const buscarProductos = useCallback(async () => {
    if (!idSede) return
    const r = await api(`/api/v1/ventas/pos/productos/?q=${encodeURIComponent(qDeb)}&id_sede=${idSede}`)
    if (!r.ok) {
      toast((await mensajeDe(r)) || "No fue posible buscar productos. Intente nuevamente.")
      setOps([])
      return
    }
    const d = (await r.json()) as { items: ProductoOp[]; mensaje?: string }
    setOps(d.items)
  }, [idSede, qDeb])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota al cambiar sede o búsqueda
    void buscarProductos()
  }, [buscarProductos])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const subtotal = useMemo(
    () =>
      lineas.reduce((a, l) => {
        const bruto = l.precio * l.cantidad
        const desc = (bruto * l.descuento_porcentaje) / 100
        return a + bruto - desc
      }, 0),
    [lineas]
  )

  const totalPagos = useMemo(() => pagos.reduce((a, p) => a + (Number(p.valor) || 0), 0), [pagos])
  const saldo = saldoPendiente(subtotal, totalPagos)
  const cambio = cambioCliente(subtotal, totalPagos)

  const agregar = (p: ProductoOp) => {
    const existente = lineas.find((l) => l.id_producto === p.id_producto)
    if (existente) {
      const nueva = existente.cantidad + 1
      if (p.inventario_habilitado && p.stock_disponible !== null && nueva > p.stock_disponible) {
        toast(`Stock insuficiente: quedan ${p.stock_disponible} unidades de ${p.nombre}.`)
        return
      }
      setLineas((s) => s.map((l) => (l.uid === existente.uid ? { ...l, cantidad: nueva } : l)))
    } else {
      setLineas((s) => [
        ...s,
        {
          uid: lineUid++,
          id_producto: p.id_producto,
          nombre: p.nombre,
          cantidad: 1,
          precio: p.precio_venta,
          descuento_porcentaje: 0,
          inventario_habilitado: p.inventario_habilitado,
          stock: p.stock_disponible,
        },
      ])
    }
    toast(`${p.nombre} agregado a la venta.`)
  }

  useEffect(() => {
    void api("/api/v1/clientes/?page_size=40").then(async (r) => {
      if (!r.ok) return
      const d = (await r.json()) as { items: { id_cliente: number; nombre: string; apellido?: string }[] }
      setClientesOps(d.items.map((c) => ({ id: String(c.id_cliente), label: `${c.nombre} ${c.apellido || ""}`.trim() })))
    })
  }, [])

  const emitir = () => {
    setError("")
    if (!lineas.length) return setError("Agregue al menos un producto.")
    if (!pagosCubrenTotal(subtotal, totalPagos)) {
      return setError(
        `La suma de los pagos (${money(totalPagos)}) es inferior al total de la venta (${money(subtotal)}). Saldo pendiente: ${money(saldo)}.`
      )
    }
    const body = {
      id_sede: Number(idSede),
      id_tipo_venta: Number(idTipo),
      id_cliente: idCliente ? Number(idCliente) : null,
      requiere_factura_electronica: requiereFe,
      lineas: lineas.map((l) => ({
        id_producto: l.id_producto,
        cantidad: l.cantidad,
        descuento_porcentaje: l.descuento_porcentaje,
        descuento_valor: 0,
      })),
      pagos: pagos
        .filter((p) => Number(p.valor) > 0)
        .map((p) => ({
          id_metodo_pago: Number(p.id_metodo_pago),
          valor: Number(p.valor),
          referencia: p.referencia,
        })),
    }
    return run(async () => {
      const r = await api("/api/v1/ventas/pos/emitir/", { method: "POST", body: JSON.stringify(body) })
      if (!r.ok) {
        setError((await mensajeDe(r)) || "No fue posible emitir la factura. No se registró ninguna venta.")
        return
      }
      const d = (await r.json()) as { mensaje: string; factura: { consecutivo: string; total: number } }
      toast(d.mensaje)
      setEmitida({ consecutivo: d.factura.consecutivo, total: d.factura.total })
      setLineas([])
      setPagos([{ uid: payUid++, id_metodo_pago: cat?.metodos_pago[0] ? String(cat.metodos_pago[0].id_metodo_pago) : "", valor: "", referencia: "" }])
      setIdCliente("")
    })
  }

  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Ventas</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Punto de venta</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">Emisión en mostrador con inventario, cobro mixto y comprobante.</p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border-2 border-plum/10 bg-white p-5 shadow-[4px_4px_0_0_#E11D74]/20">
          <h2 className="font-display text-xl font-bold text-plum">Productos</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <FieldLabel label="Sede" required>
              <select className={input} value={idSede} onChange={(e) => setIdSede(e.target.value)} aria-label="Sede">
                {cat?.sedes.map((s) => (
                  <option key={s.id_sede} value={s.id_sede}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="Tipo de venta" required>
              <select className={input} value={idTipo} onChange={(e) => setIdTipo(e.target.value)}>
                {cat?.tipos_venta.map((t) => (
                  <option key={t.id_tipo_venta} value={t.id_tipo_venta}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>
          <label className="relative mt-4 block">
            <span className="sr-only">Buscar producto</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plum/50" />
            <input
              ref={searchRef}
              className={`${input} pl-10`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre, SKU o código de barras (Ctrl+K)"
            />
          </label>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {ops.map((p) => (
              <li key={p.id_producto}>
                <button
                  type="button"
                  onClick={() => agregar(p)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border-2 border-plum/10 p-3 text-left transition hover:border-cyan"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{p.nombre}</span>
                    <span className="text-xs text-ink/55">
                      {p.codigo}
                      {p.inventario_habilitado && p.stock_disponible !== null ? ` · stock ${p.stock_disponible}` : ""}
                    </span>
                  </span>
                  <span className="text-sm font-extrabold text-plum">{money(p.precio_venta)}</span>
                </button>
              </li>
            ))}
          </ul>
          {!ops.length && <Empty text={qDeb ? "No se encontraron productos." : "Busque un producto para agregarlo."} />}
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border-2 border-plum/10 bg-white p-5">
            <h2 className="font-display text-xl font-bold text-plum">Carrito</h2>
            {lineas.length === 0 ? (
              <Empty text="Seleccione productos para la venta." />
            ) : (
              <ul className="mt-3 divide-y divide-plum/10">
                {lineas.map((l) => (
                  <li key={l.uid} className="flex flex-wrap items-center gap-2 py-3 text-sm">
                    <span className="min-w-0 flex-1 font-semibold">{l.nombre}</span>
                    <span className="inline-flex items-center rounded-lg border-2 border-plum/15">
                      <button type="button" aria-label="Menos" className="p-1.5" onClick={() => setLineas((s) => s.map((x) => (x.uid === l.uid ? { ...x, cantidad: Math.max(1, x.cantidad - 1) } : x)))}>
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-bold">{l.cantidad}</span>
                      <button type="button" aria-label="Más" className="p-1.5" onClick={() => setLineas((s) => s.map((x) => (x.uid === l.uid ? { ...x, cantidad: x.cantidad + 1 } : x)))}>
                        <Plus size={14} />
                      </button>
                    </span>
                    <button type="button" className="rounded-lg p-1 text-brand" aria-label="Quitar" onClick={() => setLineas((s) => s.filter((x) => x.uid !== l.uid))}>
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-right text-lg font-extrabold text-plum">Total provisorio: {money(subtotal)}</p>
          </div>

          <div className="rounded-2xl border-2 border-plum/10 bg-white p-5">
            <h2 className="font-display text-lg font-bold text-plum">Cliente (opcional)</h2>
            <SearchCombobox
              label="Cliente"
              value={idCliente}
              onChange={(v) => {
                setIdCliente(v)
                if (v) toast("Cliente asociado a la venta.")
              }}
              options={clientesOps}
              placeholder="Buscar cliente…"
            />
            <Link to="../clientes" className="mt-2 inline-block text-xs font-semibold text-brand">
              Nuevo cliente
            </Link>
            <button type="button" className={`${btnGhost} mt-2 text-xs`} onClick={() => setIdCliente("")}>
              Quitar cliente
            </button>
          </div>

          <div className="rounded-2xl border-2 border-plum/10 bg-white p-5">
            <h2 className="font-display text-lg font-bold text-plum">Cobro</h2>
            {pagos.map((p, i) => (
              <div key={p.uid} className="mt-3 grid gap-2 sm:grid-cols-3">
                <select className={input} value={p.id_metodo_pago} onChange={(e) => setPagos((s) => s.map((x, j) => (j === i ? { ...x, id_metodo_pago: e.target.value } : x)))}>
                  <option value="">Medio</option>
                  {cat?.metodos_pago.map((m) => (
                    <option key={m.id_metodo_pago} value={m.id_metodo_pago}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
                <input className={input} type="number" min={0} step="0.01" placeholder="Valor" value={p.valor} onChange={(e) => setPagos((s) => s.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)))} />
                <input className={input} placeholder="Referencia" value={p.referencia} onChange={(e) => setPagos((s) => s.map((x, j) => (j === i ? { ...x, referencia: e.target.value } : x)))} />
              </div>
            ))}
            <button type="button" className={`${btnGhost} mt-2 text-xs`} onClick={() => setPagos((s) => [...s, { uid: payUid++, id_metodo_pago: "", valor: "", referencia: "" }])}>
              Agregar pago
            </button>
            {saldo > 0 && <p className="mt-2 text-sm text-ink/70">Saldo pendiente: {money(saldo)}</p>}
            {cambio > 0 && <p className="mt-1 text-sm font-semibold text-cyan-dark">Cambio: {money(cambio)}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={requiereFe} onChange={(e) => setRequiereFe(e.target.checked)} />
            Requiere factura electrónica
          </label>
          {error && <FormAlert message={error} />}
          {emitida && (
            <p className="rounded-xl border-2 border-cyan/30 bg-cyan/5 p-3 text-sm">
              Última emisión: <strong>{emitida.consecutivo}</strong> — {money(emitida.total)}
              <button type="button" className="ml-3 font-bold text-brand" onClick={() => window.print()}>
                Imprimir
              </button>
            </p>
          )}
          <button type="button" className={btnPrimary} disabled={!puedeEmitir || pending || !lineas.length} onClick={() => void emitir()}>
            {pending ? <Loader2 className="mx-auto animate-spin" size={20} /> : "Emitir factura"}
          </button>
        </div>
      </div>
    </section>
  )
}
