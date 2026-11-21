import { useCallback, useEffect, useState } from "react"
import { Plus, Power, Search, X } from "lucide-react"
import { btnGhost, btnPrimary, Empty, FieldLabel, Modal, input, useDebounced, useDo } from "../components/panel/kit"
import { toast } from "../features/en-desarrollo"
import { api, mensajeDe } from "../shared/api"

type Seccion = {
  id_escaparate: number
  clave: string
  frase: string
  titulo: string
  enlace_catalogo: string
  color_acento: string
  orden: number
  estado: boolean
  version_fila: number
  productos: { id_producto: number; nombre: string }[]
}

type ProdOpt = { id_producto: number; nombre: string; codigo_producto: string }

export function PanelVitrinasPage() {
  const [items, setItems] = useState<Seccion[]>([])
  const [edit, setEdit] = useState<Seccion | "new" | null>(null)
  const [form, setForm] = useState({ clave: "", frase: "", titulo: "", enlace_catalogo: "/catalogo", color_acento: "#E11D74", orden: "0", estado: true, version_fila: 1 })
  const [seleccionados, setSeleccionados] = useState<ProdOpt[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [opciones, setOpciones] = useState<ProdOpt[]>([])
  const q = useDebounced(busqueda, 280)
  const { run, pending } = useDo()

  const cargar = useCallback(async () => {
    const r = await api("/api/v1/catalogo/escaparates/")
    if (!r.ok) return toast((await mensajeDe(r)) || "No fue posible cargar vitrinas.", "error")
    setItems(((await r.json()) as { items: Seccion[] }).items)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- listado remoto
    void cargar()
  }, [cargar])

  useEffect(() => {
    if (!edit || q.trim().length < 2) return
    let cancel = false
    void api(`/api/v1/catalogo/productos/?q=${encodeURIComponent(q.trim())}&page_size=12&estado=activo`).then(async (r) => {
      if (!r.ok || cancel) return
      const body = (await r.json()) as { items: { id_producto: number; nombre: string; codigo_producto: string }[] }
      setOpciones(body.items.map((p) => ({ id_producto: p.id_producto, nombre: p.nombre, codigo_producto: p.codigo_producto })))
    })
    return () => {
      cancel = true
    }
  }, [edit, q])

  const abrirNuevo = () => {
    setForm({ clave: "", frase: "", titulo: "", enlace_catalogo: "/catalogo", color_acento: "#E11D74", orden: String(items.length), estado: true, version_fila: 1 })
    setSeleccionados([])
    setBusqueda("")
    setEdit("new")
  }

  const abrirEditar = (s: Seccion) => {
    setForm({
      clave: s.clave,
      frase: s.frase,
      titulo: s.titulo,
      enlace_catalogo: s.enlace_catalogo,
      color_acento: s.color_acento,
      orden: String(s.orden),
      estado: s.estado,
      version_fila: s.version_fila,
    })
    setSeleccionados(s.productos.map((p) => ({ id_producto: p.id_producto, nombre: p.nombre, codigo_producto: "" })))
    setBusqueda("")
    setEdit(s)
  }

  const agregarProducto = (p: ProdOpt) => {
    setSeleccionados((prev) => (prev.some((x) => x.id_producto === p.id_producto) ? prev : [...prev, p]))
    setBusqueda("")
    setOpciones([])
  }

  const quitarProducto = (id: number) => setSeleccionados((prev) => prev.filter((p) => p.id_producto !== id))

  const guardar = () =>
    run(async () => {
      const body = {
        ...form,
        orden: Number(form.orden) || 0,
      }
      const r =
        edit === "new"
          ? await api("/api/v1/catalogo/escaparates/", { method: "POST", body: JSON.stringify(body) })
          : await api(`/api/v1/catalogo/escaparates/${(edit as Seccion).id_escaparate}/`, { method: "PATCH", body: JSON.stringify(body) })
      if (!r.ok) return toast((await mensajeDe(r)) || "No fue posible guardar.", "error")
      const data = (await r.json()) as { escaparate?: Seccion }
      const id = data.escaparate?.id_escaparate ?? (edit as Seccion).id_escaparate
      const ids = seleccionados.map((p) => p.id_producto)
      if (id && ids.length) {
        await api(`/api/v1/catalogo/escaparates/${id}/productos/`, { method: "POST", body: JSON.stringify({ ids_producto: ids }) })
      }
      toast("Vitrina guardada.")
      setEdit(null)
      void cargar()
    })

  return (
    <section className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-dark">Sitio público</p>
          <h1 className="font-display text-4xl font-extrabold text-plum">Vitrinas del inicio</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink/60">Carruseles de la página de inicio: título, frase y productos visibles en el catálogo web.</p>
        </div>
        <button type="button" className={btnPrimary} onClick={abrirNuevo}>
          <Plus size={16} /> Nueva sección
        </button>
      </header>
      {items.length === 0 ? (
        <Empty text="Sin vitrinas. Cree secciones como «Los más vendidos» o «Ferretería»." />
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.id_escaparate} className="rounded-2xl border-2 border-plum/10 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-dark">{s.frase}</p>
                  <h2 className="font-display text-xl font-extrabold text-plum">{s.titulo}</h2>
                  <p className="text-xs text-ink/55">
                    {s.productos.length} productos · {s.enlace_catalogo} ·{" "}
                    <span className={s.estado ? "text-cyan-dark" : "text-ink/40"}>{s.estado ? "Activa" : "Inactiva"}</span>
                  </p>
                </div>
                <button type="button" className={btnGhost} onClick={() => abrirEditar(s)}>
                  Editar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {edit && (
        <Modal open title={edit === "new" ? "Nueva vitrina" : "Editar vitrina"} onClose={() => setEdit(null)} wide>
          <div className="grid gap-3 md:grid-cols-2">
            <FieldLabel label="Clave (URL)">
              <input className={input} value={form.clave} disabled={edit !== "new"} onChange={(e) => setForm({ ...form, clave: e.target.value })} placeholder="mas-vendidos" />
            </FieldLabel>
            <FieldLabel label="Orden">
              <input className={input} value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} />
            </FieldLabel>
            <FieldLabel label="Frase (kicker)" className="md:col-span-2">
              <input className={input} value={form.frase} onChange={(e) => setForm({ ...form, frase: e.target.value })} placeholder="Todo para el trabajo" />
            </FieldLabel>
            <FieldLabel label="Título" className="md:col-span-2">
              <input className={input} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ferretería" />
            </FieldLabel>
            <FieldLabel label="Enlace del carrusel">
              <input className={input} value={form.enlace_catalogo} onChange={(e) => setForm({ ...form, enlace_catalogo: e.target.value })} />
            </FieldLabel>
            <FieldLabel label="Color">
              <input type="color" className="h-11 w-full rounded-xl border-2 border-plum/15" value={form.color_acento} onChange={(e) => setForm({ ...form, color_acento: e.target.value })} />
            </FieldLabel>
            <FieldLabel label="Productos en esta vitrina" className="md:col-span-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/40" aria-hidden />
                <input
                  className={`${input} pl-9`}
                  value={busqueda}
                  onChange={(e) => {
                    const v = e.target.value
                    setBusqueda(v)
                    if (v.trim().length < 2) setOpciones([])
                  }}
                  placeholder="Buscar por nombre o código (mín. 2 caracteres)"
                />
                {opciones.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border-2 border-plum/15 bg-white shadow-lg">
                    {opciones.map((p) => (
                      <li key={p.id_producto}>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-plum-soft" onClick={() => agregarProducto(p)}>
                          <span className="font-semibold text-plum">{p.nombre}</span>
                          <span className="ml-2 text-xs text-ink/50">{p.codigo_producto}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {seleccionados.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {seleccionados.map((p) => (
                    <li key={p.id_producto} className="inline-flex items-center gap-1 rounded-full border-2 border-plum/15 bg-plum-soft px-3 py-1 text-xs font-bold text-plum">
                      {p.nombre}
                      <button type="button" aria-label="Quitar" onClick={() => quitarProducto(p.id_producto)}>
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </FieldLabel>
            <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
              <input type="checkbox" checked={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.checked })} /> Sección activa en el inicio
              <Power size={14} className="text-cyan-dark" />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setEdit(null)}>Cancelar</button>
            <button type="button" className={btnPrimary} disabled={pending} onClick={() => void guardar()}>Guardar</button>
          </div>
        </Modal>
      )}
    </section>
  )
}