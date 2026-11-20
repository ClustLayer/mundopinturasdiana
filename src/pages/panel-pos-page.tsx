import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, Minus, Plus, Search, Trash2, UserPlus } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { btnPrimary, btnGhost, Empty, FieldLabel, FormAlert, SearchCombobox, input, useDebounced, useDo } from "../components/panel/kit"
import { toast } from "../features/en-desarrollo"
import { cambioCliente, pagosCubrenTotal, saldoPendiente } from "../features/ventas/logic"
import { api, mensajeDe } from "../shared/api"
import { useAccesos } from "../features/accesos/accesos-provider"
import { puedeAccion } from "../features/accesos/logic"
import { useApp } from "../app/providers"

type Catalogos = {
  sedes: { id_sede: number; nombre: string }[]
  tipos_venta: { id_tipo_venta: number; nombre: string }[]
  metodos_pago: { id_metodo_pago: number; nombre: string }[]
  cuentas_bancarias: { id_cuenta_bancaria: number; label: string }[]
  mensajeros: { id_mensajero: number; label: string }[]
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

type PagoLinea = { uid: number; id_metodo_pago: string; valor: string; referencia: string; id_cuenta_bancaria: string }

let lineUid = 1
let payUid = 1

const money = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)

const cardProductos = "rounded-2xl border-2 border-plum/10 bg-white p-5 shadow-[4px_4px_0_0_#E11D74]/15 transition duration-300 hover:shadow-[5px_5px_0_0_#E11D74]/20"
const cardCarrito = "rounded-2xl border-2 border-cyan/30 bg-gradient-to-br from-cyan/[0.07] to-white p-5 shadow-[3px_3px_0_0_#00A8C5]/20 transition duration-300"
const cardCliente = "rounded-2xl border-2 border-plum/25 bg-gradient-to-br from-plum-soft/80 to-white p-5 shadow-[3px_3px_0_0_#371837]/10 transition duration-300"
const cardCobro = "rounded-2xl border-2 border-brand/25 bg-gradient-to-br from-brand/[0.06] to-white p-5 shadow-[3px_3px_0_0_#E11D74]/15 transition duration-300"

export function PanelPosPage() {
  const { rol } = useParams<{ rol: string }>()
  const { sesion } = useApp()
  const { accionesModulo } = useAccesos()
  const puedeEmitir = puedeAccion(accionesModulo("pos"), "Crear") || puedeAccion(accionesModulo("pos"), "Total")
  const maxDesc = sesion?.rol === "Empleado" ? 10 : 100

  const [cat, setCat] = useState<Catalogos | null>(null)
  const [idSede, setIdSede] = useState("")
  const [idTipo, setIdTipo] = useState("")
  const [q, setQ] = useState("")
  const qDeb = useDebounced(q, 300)
  const [ops, setOps] = useState<ProductoOp[]>([])
  const [lineas, setLineas] = useState<Linea[]>([])
  const [pagos, setPagos] = useState<PagoLinea[]>([{ uid: payUid++, id_metodo_pago: "", valor: "", referencia: "", id_cuenta_bancaria: "" }])
  const [idCliente, setIdCliente] = useState("")
  const [clientesOps, setClientesOps] = useState<{ id: string; label: string; telefono?: string; direccion?: string }[]>([])
  const [requiereFe, setRequiereFe] = useState(false)
  const [esDomicilio, setEsDomicilio] = useState(false)
  const [dom, setDom] = useState({ nombre: "", telefono: "", direccion: "", fee: "", id_mensajero: "", pago_mensajero: "" })
  const [comprador, setComprador] = useState({ nombre: "", documento: "", correo: "" })
  const [notas, setNotas] = useState("")
  const [emitida, setEmitida] = useState<{ consecutivo: string; total: number } | null>(null)
  const [error, setError] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const { run, pending } = useDo()

  const metodoNombre = useCallback(
    (id: string) => cat?.metodos_pago.find((m) => String(m.id_metodo_pago) === id)?.nombre ?? "",
    [cat]
  )

  useEffect(() => {
    void api("/api/v1/ventas/pos/catalogos/").then(async (r) => {
      if (!r.ok) return toast("No fue posible cargar el punto de venta.")
      const d = (await r.json()) as Catalogos
      setCat({ ...d, cuentas_bancarias: d.cuentas_bancarias ?? [], mensajeros: d.mensajeros ?? [] })
      if (d.sedes[0]) setIdSede(String(d.sedes[0].id_sede))
      if (d.tipos_venta[0]) setIdTipo(String(d.tipos_venta[0].id_tipo_venta))
      const ef = d.metodos_pago.find((m) => m.nombre === "Efectivo")
      if (ef) setPagos([{ uid: payUid++, id_metodo_pago: String(ef.id_metodo_pago), valor: "", referencia: "", id_cuenta_bancaria: "" }])
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
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

  const lineTotal = (l: Linea) => {
    const bruto = l.precio * l.cantidad
    return bruto - (bruto * l.descuento_porcentaje) / 100
  }

  const subtotal = useMemo(() => lineas.reduce((a, l) => a + lineTotal(l), 0), [lineas])
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
    void api("/api/v1/clientes/?page_size=80").then(async (r) => {
      if (!r.ok) return
      const d = (await r.json()) as { items: { id_cliente: number; nombre: string; apellido?: string; numero_telefono?: string; direccion?: string }[] }
      setClientesOps(
        d.items.map((c) => ({
          id: String(c.id_cliente),
          label: `${c.nombre} ${c.apellido || ""}`.trim(),
          telefono: c.numero_telefono,
          direccion: c.direccion,
        }))
      )
    })
  }, [])

  const pickCliente = (v: string) => {
    setIdCliente(v)
    const c = clientesOps.find((x) => x.id === v)
    if (c) {
      toast("Cliente asociado a la venta.")
      if (requiereFe) setComprador((b) => ({ ...b, nombre: c.label }))
      if (esDomicilio) {
        setDom((d0) => ({
          ...d0,
          nombre: d0.nombre || c.label,
          telefono: d0.telefono || c.telefono || "",
          direccion: d0.direccion || c.direccion || "",
        }))
      }
    } else setRequiereFe(false)
  }

  const transferSinCuenta = pagos.some(
    (p) => Number(p.valor) > 0 && metodoNombre(p.id_metodo_pago).toLowerCase() === "transferencia" && !p.id_cuenta_bancaria
  )

  const puedeConfirmar =
    lineas.length > 0 &&
    pagosCubrenTotal(subtotal, totalPagos) &&
    !transferSinCuenta &&
    (!esDomicilio ||
      (dom.nombre.trim() && dom.telefono.trim() && dom.direccion.trim() && dom.id_mensajero)) &&
    (!requiereFe || idCliente) &&
    (!requiereFe || (comprador.nombre.trim() && comprador.documento.trim()))

  const emitir = () => {
    setError("")
    if (!puedeConfirmar) return
    const body = {
      id_sede: Number(idSede),
      id_tipo_venta: Number(idTipo),
      id_cliente: idCliente ? Number(idCliente) : null,
      requiere_factura_electronica: requiereFe,
      es_domicilio: esDomicilio,
      observaciones: notas,
      comprador_nombre: comprador.nombre,
      comprador_documento: comprador.documento,
      comprador_correo: comprador.correo,
      domicilio: esDomicilio
        ? {
            nombre: dom.nombre,
            telefono: dom.telefono,
            direccion: dom.direccion,
            valor_cobrado_cliente: Number(dom.fee) || 0,
            valor_pagado_mensajero: Number(dom.pago_mensajero) || 0,
            id_mensajero: Number(dom.id_mensajero),
          }
        : undefined,
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
          referencia:
            metodoNombre(p.id_metodo_pago).toLowerCase() === "transferencia" ? p.id_cuenta_bancaria : p.referencia,
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
      setPagos([{ uid: payUid++, id_metodo_pago: cat?.metodos_pago[0] ? String(cat.metodos_pago[0].id_metodo_pago) : "", valor: "", referencia: "", id_cuenta_bancaria: "" }])
      setIdCliente("")
      setEsDomicilio(false)
      setRequiereFe(false)
      setDom({ nombre: "", telefono: "", direccion: "", fee: "", id_mensajero: "", pago_mensajero: "" })
      setComprador({ nombre: "", documento: "", correo: "" })
      setNotas("")
    })
  }

  const rutaClientes = rol ? `/panel/${rol}/clientes` : "../clientes"

  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Ventas</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Punto de venta</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">Emisión en mostrador con inventario, cobro mixto, domicilio y comprobante.</p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className={cardProductos}>
          <h2 className="font-display text-xl font-bold text-plum">Productos</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <FieldLabel label="Sede" required>
              <select className={input} value={idSede} onChange={(e) => setIdSede(e.target.value)} aria-label="Sede">
                {cat?.sedes.map((s) => (
                  <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="Tipo de venta" required>
              <select className={input} value={idTipo} onChange={(e) => setIdTipo(e.target.value)}>
                {cat?.tipos_venta.map((t) => (
                  <option key={t.id_tipo_venta} value={t.id_tipo_venta}>{t.nombre}</option>
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
                  className="flex w-full items-center justify-between gap-2 rounded-xl border-2 border-plum/10 p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-cyan hover:shadow-md"
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
          <div className={cardCarrito}>
            <h2 className="font-display text-xl font-bold text-plum">Carrito</h2>
            {lineas.length === 0 ? (
              <Empty text="Seleccione productos para la venta." />
            ) : (
              <ul className="mt-3 divide-y divide-plum/10">
                {lineas.map((l) => (
                  <li key={l.uid} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 font-semibold">{l.nombre}</span>
                      <button type="button" className="rounded-lg p-1 text-brand hover:bg-brand/10" aria-label="Quitar" onClick={() => setLineas((s) => s.filter((x) => x.uid !== l.uid))}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                      <span className="inline-flex items-center rounded-lg border-2 border-plum/15">
                        <button type="button" aria-label="Menos" className="p-1.5" onClick={() => setLineas((s) => s.map((x) => (x.uid === l.uid ? { ...x, cantidad: Math.max(1, x.cantidad - 1) } : x)))}>
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-bold">{l.cantidad}</span>
                        <button type="button" aria-label="Más" className="p-1.5" onClick={() => setLineas((s) => s.map((x) => (x.uid === l.uid ? { ...x, cantidad: x.cantidad + 1 } : x)))}>
                          <Plus size={14} />
                        </button>
                      </span>
                      <label className="flex items-center gap-1.5 text-xs font-semibold">
                        Desc. %
                        <input
                          type="number"
                          min={0}
                          max={maxDesc}
                          value={l.descuento_porcentaje}
                          onChange={(e) =>
                            setLineas((s) =>
                              s.map((x) =>
                                x.uid === l.uid
                                  ? { ...x, descuento_porcentaje: Math.min(maxDesc, Math.max(0, Number(e.target.value) || 0)) }
                                  : x
                              )
                            )
                          }
                          className="w-16 rounded-lg border-2 border-plum/15 px-2 py-1"
                        />
                      </label>
                      <span className="ml-auto font-extrabold text-plum">{money(lineTotal(l))}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-right text-lg font-extrabold text-plum">Total venta: {money(subtotal)}</p>
          </div>

          <div className={cardCliente}>
            <h2 className="font-display text-lg font-bold text-plum">Cliente y entrega</h2>
            <SearchCombobox label="Cliente" value={idCliente} onChange={pickCliente} options={clientesOps} placeholder="Cliente de mostrador" />
            <Link
              to={rutaClientes}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border-2 border-plum/15 bg-white px-4 py-2 text-sm font-bold text-plum shadow-[2px_2px_0_0_#371837] transition hover:-translate-y-0.5 hover:border-cyan hover:text-brand"
            >
              <UserPlus size={16} aria-hidden /> Nuevo cliente
            </Link>
            <button type="button" className={`${btnGhost} mt-2 text-xs`} onClick={() => setIdCliente("")}>
              Quitar cliente
            </button>

            <div className="mt-4 space-y-2 border-t border-dashed border-plum/20 pt-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={esDomicilio}
                  onChange={(e) => {
                    const on = e.target.checked
                    setEsDomicilio(on)
                    if (on && idCliente) {
                      const c = clientesOps.find((x) => x.id === idCliente)
                      if (c) setDom((d0) => ({ ...d0, nombre: c.label, telefono: c.telefono || "", direccion: c.direccion || "" }))
                    }
                  }}
                />
                Domicilio
              </label>
              {esDomicilio && (
                <div className="grid gap-2 rounded-xl bg-plum-soft/40 p-3 sm:grid-cols-2">
                  <FieldLabel label="Nombre" required>
                    <input className={input} value={dom.nombre} onChange={(e) => setDom({ ...dom, nombre: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label="Teléfono" required>
                    <input className={input} value={dom.telefono} onChange={(e) => setDom({ ...dom, telefono: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label="Dirección" required className="sm:col-span-2">
                    <input className={input} value={dom.direccion} onChange={(e) => setDom({ ...dom, direccion: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label="Valor del domicilio cobrado (no suma al total de la venta)" className="sm:col-span-2">
                    <input type="number" min={0} className={input} value={dom.fee} onChange={(e) => setDom({ ...dom, fee: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label="Domiciliario (mensajero)" required className="sm:col-span-2">
                    <select className={input} value={dom.id_mensajero} onChange={(e) => setDom({ ...dom, id_mensajero: e.target.value })}>
                      <option value="">— Seleccionar mensajero —</option>
                      {cat?.mensajeros.map((m) => (
                        <option key={m.id_mensajero} value={m.id_mensajero}>{m.label}</option>
                      ))}
                    </select>
                  </FieldLabel>
                  <FieldLabel label="Pago al domiciliario (opcional)" className="sm:col-span-2">
                    <input type="number" min={0} className={input} value={dom.pago_mensajero} onChange={(e) => setDom({ ...dom, pago_mensajero: e.target.value })} />
                    <span className="mt-1 block text-xs text-ink/55">No entra en ventas ni en gastos del día.</span>
                  </FieldLabel>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={requiereFe} disabled={!idCliente} onChange={(e) => setRequiereFe(e.target.checked)} />
                Factura electrónica
                {!idCliente && <span className="text-xs font-normal text-ink/55">(elige un cliente)</span>}
              </label>
              {requiereFe && (
                <div className="grid gap-2 rounded-xl bg-plum-soft/40 p-3 sm:grid-cols-2">
                  <FieldLabel label="Nombre del comprador" required>
                    <input className={input} value={comprador.nombre} onChange={(e) => setComprador({ ...comprador, nombre: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label="Documento / NIT" required>
                    <input className={input} value={comprador.documento} onChange={(e) => setComprador({ ...comprador, documento: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label="Correo" className="sm:col-span-2">
                    <input type="email" className={input} value={comprador.correo} onChange={(e) => setComprador({ ...comprador, correo: e.target.value })} />
                  </FieldLabel>
                </div>
              )}
            </div>
          </div>

          <div className={cardCobro}>
            <h2 className="font-display text-lg font-bold text-plum">Cobro</h2>
            {pagos.map((p, i) => (
              <div key={p.uid} className="mt-3 space-y-2 rounded-xl border border-plum/10 bg-white/80 p-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <select
                    className={input}
                    value={p.id_metodo_pago}
                    onChange={(e) => setPagos((s) => s.map((x, j) => (j === i ? { ...x, id_metodo_pago: e.target.value, id_cuenta_bancaria: "" } : x)))}
                  >
                    <option value="">Medio</option>
                    {cat?.metodos_pago.map((m) => (
                      <option key={m.id_metodo_pago} value={m.id_metodo_pago}>{m.nombre}</option>
                    ))}
                  </select>
                  <input
                    className={input}
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Valor"
                    value={p.valor}
                    onChange={(e) => setPagos((s) => s.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)))}
                  />
                  <button
                    type="button"
                    className="rounded-xl bg-plum-soft px-3 text-xs font-bold text-plum hover:bg-plum/10"
                    onClick={() => {
                      const otros = totalPagos - (Number(p.valor) || 0)
                      setPagos((s) => s.map((x, j) => (j === i ? { ...x, valor: String(Math.max(0, subtotal - otros)) } : x)))
                    }}
                  >
                    Pagar resto
                  </button>
                </div>
                {metodoNombre(p.id_metodo_pago).toLowerCase() === "transferencia" && (
                  <select
                    className={input}
                    value={p.id_cuenta_bancaria}
                    onChange={(e) => setPagos((s) => s.map((x, j) => (j === i ? { ...x, id_cuenta_bancaria: e.target.value } : x)))}
                    aria-label="Cuenta que recibe la transferencia"
                  >
                    <option value="">Cuenta que recibe…</option>
                    {cat?.cuentas_bancarias.map((c) => (
                      <option key={c.id_cuenta_bancaria} value={String(c.id_cuenta_bancaria)}>{c.label}</option>
                    ))}
                  </select>
                )}
                {metodoNombre(p.id_metodo_pago).toLowerCase() !== "transferencia" && (
                  <input className={input} placeholder="Referencia (opcional)" value={p.referencia} onChange={(e) => setPagos((s) => s.map((x, j) => (j === i ? { ...x, referencia: e.target.value } : x)))} />
                )}
              </div>
            ))}
            <button
              type="button"
              className="mt-3 rounded-xl bg-cyan px-4 py-2 text-xs font-bold text-white shadow-[2px_2px_0_0_#371837] transition hover:-translate-y-0.5 hover:bg-cyan-dark"
              onClick={() => setPagos((s) => [...s, { uid: payUid++, id_metodo_pago: "", valor: "", referencia: "", id_cuenta_bancaria: "" }])}
            >
              + Agregar pago
            </button>
            {saldo > 0 && <p className="mt-2 text-sm text-ink/70">Saldo pendiente: {money(saldo)}</p>}
            {cambio > 0 && <p className="mt-1 text-sm font-semibold text-cyan-dark">Cambio: {money(cambio)}</p>}
            <FieldLabel label="Notas" className="mt-3">
              <input className={input} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Opcional" />
            </FieldLabel>
          </div>

          {error && <FormAlert message={error} />}
          {emitida && (
            <p className="rounded-xl border-2 border-cyan/30 bg-cyan/5 p-3 text-sm">
              Última emisión: <strong>{emitida.consecutivo}</strong> — {money(emitida.total)}
              <button type="button" className="ml-3 font-bold text-brand" onClick={() => window.print()}>Imprimir</button>
            </p>
          )}

          <button
            type="button"
            className={`${btnPrimary} w-full transition ${puedeConfirmar && puedeEmitir ? "" : "!cursor-not-allowed !bg-ink/25 !text-ink/50 !shadow-none grayscale"}`}
            disabled={!puedeEmitir || pending || !puedeConfirmar}
            onClick={() => void emitir()}
          >
            {pending ? <Loader2 className="mx-auto animate-spin" size={20} /> : "Emitir factura"}
          </button>
          {lineas.length > 0 && !puedeConfirmar && (
            <p className="text-xs text-brand-dark" role="status">
              {!pagosCubrenTotal(subtotal, totalPagos)
                ? `Los pagos deben cubrir el total (${money(subtotal)}).`
                : transferSinCuenta
                  ? "Seleccione la cuenta que recibe la transferencia."
                  : "Complete los datos obligatorios de domicilio o factura electrónica."}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
