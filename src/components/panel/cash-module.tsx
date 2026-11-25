import { useMemo, useState } from "react"
import { Check, Lock, Pencil, Trash2, X } from "lucide-react"
import {
  Confirm,
  Empty,
  FieldLabel,
  Pager,
  Panel,
  SearchCombobox,
  btnPrimary,
  input,
  useDo,
} from "./kit"
import { dt, money } from "../../features/caja/format"
import type { ConceptoMov, MovimientoCaja, TipoMovimiento } from "../../features/caja/types"

const CATS: [TipoMovimiento, string][] = [
  ["gasto", "Gasto"],
  ["transferencia", "Transferencia"],
  ["ahorro", "Ahorro"],
  ["adicion", "Adición de base"],
]
const catLabel = Object.fromEntries(CATS) as Record<string, string>
const TONE: Record<string, { text: string; chip: string; sign: string }> = {
  adicion: { text: "text-emerald-700", chip: "bg-emerald-100 text-emerald-800", sign: "+" },
  gasto: { text: "text-rose-600", chip: "bg-rose-100 text-rose-700", sign: "−" },
  ahorro: { text: "text-rose-600", chip: "bg-rose-100 text-rose-700", sign: "−" },
  transferencia: { text: "text-sky-700", chip: "bg-sky-100 text-sky-800", sign: "−" },
}

type Props = {
  tab: "gasto" | "ahorro"
  onTab: (t: "gasto" | "ahorro") => void
  movements: MovimientoCaja[]
  concepts: ConceptoMov[]
  sedes: { id_sede: number; nombre: string }[]
  idSede: string
  onSede: (v: string) => void
  expected: number
  jornadaCerrada: boolean
  page: number
  total: number
  onPage: (p: number) => void
  onCreate: (body: {
    id_sede: number
    tipo_movimiento: TipoMovimiento
    id_concepto_movimiento?: number
    valor: number
    detalle: string
  }) => Promise<boolean>
  onUpdate: (id: number, body: { id_concepto_movimiento?: number; valor: number; detalle: string }) => Promise<boolean>
  onDelete: (id: number) => Promise<boolean>
  puedeEditar: boolean
}

export function CashModule({
  tab,
  onTab,
  movements,
  concepts,
  sedes,
  idSede,
  onSede,
  expected,
  jornadaCerrada,
  page,
  total,
  onPage,
  onCreate,
  onUpdate,
  onDelete,
  puedeEditar,
}: Props) {
  const [category, setCategory] = useState<TipoMovimiento>("gasto")
  const [concept, setConcept] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [del, setDel] = useState<MovimientoCaja | null>(null)
  const [edit, setEdit] = useState<{ id: number; concept: string; amount: string; note: string } | null>(null)
  const { run, pending } = useDo()
  const active = useMemo(() => concepts.filter((c) => c.estado), [concepts])
  const copts = useMemo(
    () => active.map((c) => ({ id: String(c.id_concepto_movimiento), label: c.nombre, hint: catLabel[c.tipo_movimiento] ?? "" })),
    [active],
  )
  const byId = (id: string) => active.find((c) => String(c.id_concepto_movimiento) === id)

  const pickConcept = (id: string, set: { cat?: (v: TipoMovimiento) => void; amount: (v: string) => void; note: (v: string) => void }) => {
    const c = byId(id)
    if (!c) return
    if (c.tipo_movimiento) set.cat?.(c.tipo_movimiento)
    set.amount(c.valor_sugerido != null && c.valor_sugerido !== "" ? String(c.valor_sugerido) : "")
    set.note(c.detalle_sugerido ?? "")
  }

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (jornadaCerrada || !puedeEditar) return
    const valor = Number(amount)
    if (!idSede || valor < 1) return
    await run(async () => {
      const ok = await onCreate({
        id_sede: Number(idSede),
        tipo_movimiento: category,
        id_concepto_movimiento: concept ? Number(concept) : undefined,
        valor,
        detalle: note,
      })
      if (ok) {
        setAmount("")
        setNote("")
        setConcept("")
      }
    })
  }

  const totalPages = Math.max(1, Math.ceil(total / 15))

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <Panel title="Nuevo movimiento">
        {jornadaCerrada && (
          <p className="mb-3 rounded-xl bg-cyan/15 p-3 text-sm font-bold text-cyan-dark">La jornada está cerrada; no se pueden registrar movimientos.</p>
        )}
        <form onSubmit={(e) => void registrar(e)} className="space-y-4">
          <FieldLabel label="Sede" required>
            <select className={input} value={idSede} disabled={jornadaCerrada} onChange={(e) => onSede(e.target.value)}>
              <option value="">Seleccione</option>
              {sedes.map((s) => (
                <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
              ))}
            </select>
          </FieldLabel>
          <SearchCombobox
            label="Concepto"
            value={concept}
            onChange={(id) => {
              setConcept(id)
              pickConcept(id, { cat: setCategory, amount: setAmount, note: setNote })
            }}
            options={copts}
            placeholder="Buscar concepto…"
          />
          <fieldset disabled={jornadaCerrada}>
            <legend className="text-sm font-semibold">Categoría</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {CATS.map(([k, l]) => (
                <button
                  type="button"
                  key={k}
                  aria-pressed={category === k}
                  onClick={() => setCategory(k)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${category === k ? "bg-plum text-white" : "bg-plum-soft text-plum"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </fieldset>
          <FieldLabel label="Valor (COP)" required>
            <input type="number" min={1} required disabled={jornadaCerrada} value={amount} onChange={(e) => setAmount(e.target.value)} className={input} />
          </FieldLabel>
          <FieldLabel label="Detalle">
            <input disabled={jornadaCerrada} value={note} onChange={(e) => setNote(e.target.value)} className={input} />
          </FieldLabel>
          <button type="submit" disabled={pending || jornadaCerrada || !puedeEditar} className={btnPrimary}>
            Registrar
          </button>
        </form>
      </Panel>
      <Panel
        title="Movimientos de la jornada"
        action={
          <div className="flex gap-1 rounded-full bg-plum-soft p-1 text-xs font-bold" role="tablist" aria-label="Tipo de planilla">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "gasto"}
              className={`rounded-full px-3 py-1 ${tab === "gasto" ? "bg-plum text-white" : "text-plum"}`}
              onClick={() => onTab("gasto")}
            >
              Gastos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "ahorro"}
              className={`rounded-full px-3 py-1 ${tab === "ahorro" ? "bg-plum text-white" : "text-plum"}`}
              onClick={() => onTab("ahorro")}
            >
              Ahorros
            </button>
          </div>
        }
      >
        <p className="mb-2 text-xs text-ink/55">
          Efectivo esperado hoy: <b className="text-plum">{money(expected)}</b>
        </p>
        <p className="mb-3 flex flex-wrap gap-2 text-xs font-bold" aria-label="Leyenda">
          <span className={`rounded-full px-2.5 py-0.5 ${TONE.adicion.chip}`}>+ Suma: adición de base</span>
          <span className={`rounded-full px-2.5 py-0.5 ${TONE.gasto.chip}`}>− Resta: gasto / ahorro</span>
          <span className={`rounded-full px-2.5 py-0.5 ${TONE.transferencia.chip}`}>− Resta: transferencia</span>
        </p>
        {movements.length ? (
          <ul className="divide-y divide-plum/10">
            {movements.map((m) => {
              const t = TONE[m.tipo_movimiento] ?? TONE.gasto
              const editing = edit?.id === m.id_movimiento
              const locked = m.bloqueado || !m.editable || !puedeEditar
              return (
                <li key={m.id_movimiento} className="py-2.5 text-sm">
                  {editing && edit ? (
                    <form
                      className="space-y-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        void run(async () => {
                          const ok = await onUpdate(m.id_movimiento, {
                            id_concepto_movimiento: edit.concept ? Number(edit.concept) : undefined,
                            valor: Number(edit.amount),
                            detalle: edit.note,
                          })
                          if (ok) setEdit(null)
                        })
                      }}
                    >
                      <SearchCombobox
                        label="Concepto"
                        value={edit.concept}
                        onChange={(id) => {
                          setEdit((x) => x && { ...x, concept: id })
                          pickConcept(id, {
                            amount: (v) => setEdit((x) => x && { ...x, amount: v }),
                            note: (v) => setEdit((x) => x && { ...x, note: v }),
                          })
                        }}
                        options={copts}
                      />
                      <div className="flex flex-wrap gap-2">
                        <input
                          aria-label="Valor"
                          type="number"
                          min={1}
                          required
                          value={edit.amount}
                          onChange={(e) => setEdit({ ...edit, amount: e.target.value })}
                          className={`${input} !mt-0 w-36`}
                        />
                        <input
                          aria-label="Detalle"
                          value={edit.note}
                          onChange={(e) => setEdit({ ...edit, note: e.target.value })}
                          className={`${input} !mt-0 min-w-40 flex-1`}
                        />
                        <button type="submit" disabled={pending} className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50" aria-label="Guardar">
                          <Check size={16} />
                        </button>
                        <button type="button" onClick={() => setEdit(null)} className="rounded-lg p-2 text-ink/60 hover:bg-plum-soft" aria-label="Cancelar">
                          <X size={16} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${t.chip}`}>{catLabel[m.tipo_movimiento] ?? m.tipo_movimiento}</span>
                      <span className="min-w-0 flex-1 truncate">
                        {m.concepto ? <b>{m.concepto}</b> : null}
                        {m.concepto && m.detalle ? " · " : ""}
                        {m.detalle || (m.concepto ? "" : "—")}
                        <span className="block text-xs text-ink/50">
                          {dt(m.fecha_hora)} · {m.usuario}
                        </span>
                      </span>
                      <b className={t.text}>
                        {t.sign} {money(m.valor)}
                      </b>
                      {locked ? (
                        <Lock size={15} aria-label="Bloqueado" className="text-ink/40" />
                      ) : (
                        <>
                          <button
                            type="button"
                            title="Editar"
                            onClick={() =>
                              setEdit({
                                id: m.id_movimiento,
                                concept: m.id_concepto_movimiento ? String(m.id_concepto_movimiento) : "",
                                amount: String(m.valor),
                                note: m.detalle ?? "",
                              })
                            }
                            className="rounded-lg p-1.5 text-plum hover:bg-plum-soft"
                          >
                            <Pencil size={15} />
                          </button>
                          <button type="button" title="Eliminar" onClick={() => setDel(m)} className="rounded-lg p-1.5 text-brand hover:bg-brand/10">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <Empty text="Sin movimientos en esta pestaña." />
        )}
        <Pager page={page} totalPages={totalPages} total={total} onPage={onPage} />
      </Panel>
      <Confirm
        open={!!del}
        danger
        busy={pending}
        yes="Eliminar"
        title="Eliminar movimiento"
        text={`¿Eliminar el movimiento de ${money(del?.valor ?? 0)}? Quedará en auditoría.`}
        onNo={() => setDel(null)}
        onYes={() =>
          void run(async () => {
            if (del) {
              const ok = await onDelete(del.id_movimiento)
              if (ok) setDel(null)
            }
          })
        }
      />
    </div>
  )
}