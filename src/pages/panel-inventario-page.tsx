import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { FieldLabel, FormAlert, btnPrimary, input, inputInvalid } from "../components/panel/kit"
import { puedeAccion } from "../features/accesos/logic"
import { useAccesos } from "../features/accesos/accesos-provider"
import { toast } from "../features/en-desarrollo"
import { api, mensajeDe } from "../shared/api"

type Sede = { id_sede: number; nombre: string }
type Fila = { id_producto: number; nombre: string; codigo: string; origen: string; unidad: string; minimo: number; celdas: Record<string, number>; total: number }
type Mov = { id_movimiento: number; fecha: string; producto: string; sede: string; tipo: string; cantidad: number; delta: number; anterior: number; nueva: number; motivo: string; referencia: string; proveedor: string; usuario: string }

const TABS = [
  { id: "stock", label: "Existencias" },
  { id: "kardex", label: "Historial de movimientos" },
  { id: "entrada", label: "Registrar entrada" },
  { id: "ajuste", label: "Ajuste / merma" },
  { id: "traslado", label: "Traslado" },
] as const

export function PanelInventarioPage() {
  const { accionesModulo } = useAccesos()
  const puedeEscribir = puedeAccion(accionesModulo("inventario"), "Crear") || puedeAccion(accionesModulo("inventario"), "Total")
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("stock")
  const tabs = TABS.filter((t) => puedeEscribir || t.id === "stock" || t.id === "kardex")
  return (
    <section className="mx-auto max-w-6xl">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Inventario</p>
      <h1 className="font-display text-4xl font-extrabold text-plum">Inventario</h1>
      <p className="mt-2 max-w-3xl text-sm text-ink/65">Todos los productos creados aparecen aquí. Registra entradas, ajustes y traslados; cada movimiento actualiza el saldo y deja historial.</p>
      <nav className="my-4 flex flex-wrap gap-2" aria-label="Secciones de inventario">
        {tabs.map((t) => (
          <button key={t.id} type="button" className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === t.id ? "bg-plum text-white" : "bg-white"}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </nav>
      {tab === "stock" && <Stock />}
      {tab === "kardex" && <Kardex />}
      {tab === "entrada" && <MovForm accion="entrada" />}
      {tab === "ajuste" && <MovForm accion="ajuste" />}
      {tab === "traslado" && <MovForm accion="traslado" />}
    </section>
  )
}

function Stock() {
  const [q, setQ] = useState("")
  const [sede, setSede] = useState("")
  const [data, setData] = useState<{ sedes: Sede[]; items: Fila[]; alerta: string[]; mensaje: string } | null>(null)
  const cargar = useCallback(async () => {
    const qs = new URLSearchParams()
    if (q) qs.set("q", q)
    if (sede) qs.set("id_sede", sede)
    const r = await api(`/api/v1/inventario/existencias/?${qs}`)
    if (r.ok) setData(await r.json())
  }, [q, sede])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])
  return (
    <div>
      {data && data.alerta.length > 0 && (
        <p role="status" className="mb-3 flex items-start gap-2 rounded-xl border-2 border-sun bg-sun/20 p-3 text-sm">
          <AlertTriangle size={18} /> {data.alerta.length} existencia(s) en o bajo el stock mínimo: {data.alerta.slice(0, 4).join(", ")}
        </p>
      )}
      <div className="mb-3 flex flex-wrap gap-3">
        <input className={`${input} !mt-0 w-56`} placeholder="Nombre o código" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${input} !mt-0 w-48`} value={sede} onChange={(e) => setSede(e.target.value)} aria-label="Sede">
          <option value="">Todas las sedes</option>
          {data?.sedes.map((s) => <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-plum-soft text-xs uppercase text-plum">
            <tr>
              <th className="px-3 py-3">Producto</th><th>Origen</th>
              {data?.sedes.map((s) => <th key={s.id_sede} className="text-right">{s.nombre}</th>)}
              <th className="text-right">Total</th><th className="px-3 text-right">Mínimo</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((f) => (
              <tr key={f.id_producto} className="border-t">
                <td className="px-3 py-2 font-semibold">{f.nombre} <span className="text-xs font-normal text-ink/50">{f.codigo}</span></td>
                <td>{f.origen}</td>
                {data.sedes.map((s) => {
                  const v = f.celdas[String(s.id_sede)] ?? 0
                  const bajo = v <= f.minimo
                  return <td key={s.id_sede} className={`text-right font-bold ${bajo ? "text-brand" : ""}`}>{bajo ? (v === 0 ? "Agotado " : "Bajo ") : ""}{v}</td>
                })}
                <td className="text-right font-bold">{f.total}</td>
                <td className="px-3 text-right">{f.minimo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm">{data?.mensaje}</p>
    </div>
  )
}

function Kardex() {
  const [tipo, setTipo] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [items, setItems] = useState<Mov[]>([])
  const [msg, setMsg] = useState("")
  const cargar = useCallback(async () => {
    const qs = new URLSearchParams()
    if (tipo) qs.set("tipo", tipo)
    if (desde) qs.set("desde", desde)
    if (hasta) qs.set("hasta", hasta)
    const r = await api(`/api/v1/inventario/kardex/?${qs}`)
    if (!r.ok) { setMsg("No fue posible cargar el kardex."); return }
    const body = await r.json()
    setItems(body.items)
    setMsg(body.mensaje)
  }, [tipo, desde, hasta])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga remota
    void cargar()
  }, [cargar])
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        <select className={`${input} !mt-0 w-48`} value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo de movimiento">
          <option value="">Todos los tipos</option>
          <option value="entrada_compra">Entrada</option>
          <option value="ajuste_positivo">Ajuste +</option>
          <option value="ajuste_negativo">Ajuste −</option>
          <option value="merma">Merma</option>
          <option value="traslado_entrada">Traslado entrada</option>
          <option value="traslado_salida">Traslado salida</option>
        </select>
        <input type="date" className={`${input} !mt-0 w-40`} value={desde} onChange={(e) => setDesde(e.target.value)} aria-label="Desde" />
        <input type="date" className={`${input} !mt-0 w-40`} value={hasta} onChange={(e) => setHasta(e.target.value)} aria-label="Hasta" />
      </div>
      <div className="overflow-x-auto rounded-2xl border-2 border-plum/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-plum-soft text-xs uppercase"><tr>{["Fecha", "Producto", "Sede", "Tipo", "Cantidad", "Antes", "Después", "Motivo"].map((h) => <th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id_movimiento} className="border-t">
                <td className="px-2 py-2">{m.fecha.slice(0, 16).replace("T", " ")}</td>
                <td>{m.producto}</td><td>{m.sede}</td><td>{m.tipo}</td><td>{m.delta}</td><td>{m.anterior}</td><td>{m.nueva}</td><td>{m.motivo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm">{msg}</p>
    </div>
  )
}

function MovForm({ accion }: { accion: "entrada" | "ajuste" | "traslado" }) {
  const [sedes, setSedes] = useState<Sede[]>([])
  const [productos, setProductos] = useState<{ id_producto: number; nombre: string; codigo_producto: string }[]>([])
  const [idProducto, setIdProducto] = useState("")
  const [idSede, setIdSede] = useState("")
  const [destino, setDestino] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [motivo, setMotivo] = useState("")
  const [proveedor, setProveedor] = useState("")
  const [referencia, setReferencia] = useState("")
  const [tipo, setTipo] = useState("ajuste_positivo")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  useEffect(() => {
    void (async () => {
      const [ex, pr] = await Promise.all([api("/api/v1/inventario/existencias/"), api("/api/v1/catalogo/productos/?page_size=50")])
      if (ex.ok) setSedes((await ex.json()).sedes)
      if (pr.ok) setProductos((await pr.json()).items ?? [])
    })()
  }, [])
  const enviar = async () => {
    if (pending) return
    if (!idProducto || !idSede || !cantidad || !motivo.trim() || (accion === "traslado" && !destino)) {
      setError("Todos los campos obligatorios deben ser diligenciados.")
      return
    }
    setPending(true)
    setError("")
    const r = await api(`/api/v1/inventario/movimientos/${accion}/`, {
      method: "POST",
      body: JSON.stringify({ id_producto: Number(idProducto), id_sede: Number(idSede), id_sede_destino: Number(destino || 0), cantidad, motivo, proveedor, referencia, tipo }),
    })
    const msg = await mensajeDe(r)
    setPending(false)
    if (!r.ok) { setError(msg || "No fue posible registrar el movimiento."); return }
    toast(msg || "Movimiento registrado correctamente.")
    setCantidad(""); setMotivo(""); setReferencia("")
  }
  return (
    <div className="max-w-xl space-y-3 rounded-2xl border-2 border-plum/10 bg-white p-5">
      <FormAlert message={error} />
      <FieldLabel label="Producto" required><select className={idProducto ? input : inputInvalid} value={idProducto} onChange={(e) => setIdProducto(e.target.value)}><option value="">Seleccione…</option>{productos.map((p) => <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>)}</select></FieldLabel>
      <FieldLabel label={accion === "traslado" ? "Sede origen" : "Sede"} required><select className={input} value={idSede} onChange={(e) => setIdSede(e.target.value)}><option value="">Seleccione…</option>{sedes.map((s) => <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>)}</select></FieldLabel>
      {accion === "traslado" && <FieldLabel label="Sede destino" required><select className={input} value={destino} onChange={(e) => setDestino(e.target.value)}><option value="">Seleccione…</option>{sedes.map((s) => <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>)}</select></FieldLabel>}
      {accion === "ajuste" && <FieldLabel label="Tipo" required><select className={input} value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="ajuste_positivo">Ajuste positivo</option><option value="ajuste_negativo">Ajuste negativo</option><option value="merma">Merma / daño</option></select></FieldLabel>}
      <FieldLabel label="Cantidad" required><input className={input} placeholder="Ej. 10" value={cantidad} onChange={(e) => setCantidad(e.target.value)} /></FieldLabel>
      {accion === "entrada" && <FieldLabel label="Proveedor"><input className={input} placeholder="Ej. Pintuco" value={proveedor} onChange={(e) => setProveedor(e.target.value)} /></FieldLabel>}
      <FieldLabel label="Referencia"><input className={input} placeholder="Ej. OC-102" value={referencia} onChange={(e) => setReferencia(e.target.value)} /></FieldLabel>
      <FieldLabel label="Motivo" required><textarea className={input} placeholder="Ej. Compra de reposición" value={motivo} onChange={(e) => setMotivo(e.target.value)} /></FieldLabel>
      <button type="button" className={btnPrimary} disabled={pending} onClick={() => void enviar()}>{pending ? <Loader2 className="animate-spin" size={16} /> : "Registrar"}</button>
    </div>
  )
}
