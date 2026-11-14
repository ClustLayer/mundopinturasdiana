import { useCallback, useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react"
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react"
import { toast } from "../../features/en-desarrollo"

function useModalA11y(open: boolean, contentRef: RefObject<HTMLDivElement | null>, trapFocus: boolean) {
  const prevFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!open) return
    prevFocus.current = document.activeElement as HTMLElement
    return () => {
      prevFocus.current?.focus?.()
    }
  }, [open])
  useEffect(() => {
    if (!open || !trapFocus) return
    const root = contentRef.current
    if (!root) return
    const selectors =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusable = () =>
      Array.from(root.querySelectorAll<HTMLElement>(selectors)).filter((el) => el.offsetParent !== null || el === document.activeElement)
    const list = focusable()
    window.setTimeout(() => list[0]?.focus(), 0)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      const nodes = focusable()
      if (nodes.length === 0) return
      const f = nodes[0]
      const l = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === f) {
        e.preventDefault()
        l.focus()
      } else if (!e.shiftKey && document.activeElement === l) {
        e.preventDefault()
        f.focus()
      }
    }
    root.addEventListener("keydown", onKeyDown)
    return () => root.removeEventListener("keydown", onKeyDown)
  }, [open, trapFocus, contentRef])
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
  trapFocus = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
  trapFocus?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headingId = useId()
  useModalA11y(open, contentRef, trapFocus)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-labelledby={headingId}
      className={`m-auto w-[calc(100%-2rem)] overflow-hidden ${wide ? "max-w-3xl" : "max-w-md"} rounded-2xl border-2 border-plum bg-white p-0 text-ink shadow-[8px_8px_0_0_var(--color-plum)] backdrop:bg-plum/50 backdrop:backdrop-blur-sm`}
    >
      {open && (
        <div ref={contentRef} className="max-h-[85dvh] overflow-y-auto p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id={headingId} className="font-display text-2xl font-extrabold text-plum">
              {title}
            </h2>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1.5 hover:bg-plum-soft">
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}

const btn = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 focus-visible:outline-2"
export const btnPrimary = `${btn} bg-brand text-white shadow-[3px_3px_0_0_var(--color-plum)] hover:-translate-y-0.5 hover:bg-brand-dark`
export const btnGhost = `${btn} border-2 border-plum/20 text-plum hover:bg-plum-soft`

export function FormAlert({ message, id }: { message: string; id?: string }) {
  if (!message) return null
  return (
    <p role="alert" id={id} className="rounded-xl border-2 border-brand bg-brand/5 p-3 text-sm font-medium text-brand-dark">
      {message}
    </p>
  )
}

export function FieldLabel({
  label,
  required,
  tip,
  children,
  className = "",
}: {
  label: string
  required?: boolean
  tip?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block text-sm font-semibold ${className}`} data-tip={tip}>
      {label}
      {required && (
        <span className="text-brand" aria-hidden>
          {" "}
          *
        </span>
      )}
      {children}
    </label>
  )
}

export function DayClosedToggle({
  closed,
  onChange,
  dayLabel,
}: {
  closed: boolean
  onChange: (closed: boolean) => void
  dayLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={closed}
      aria-label={`${dayLabel}: ${closed ? "cerrado" : "abierto"}`}
      data-tip={closed ? "Marcar día como abierto" : "Marcar día como cerrado"}
      onClick={() => onChange(!closed)}
      className={`inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition ${
        closed
          ? "border-ink/15 bg-ink/5 text-ink/50"
          : "border-cyan-dark/40 bg-cyan/10 text-cyan-dark shadow-[2px_2px_0_0_var(--color-plum)]"
      }`}
    >
      <span className={`size-2 rounded-full ${closed ? "bg-ink/25" : "bg-cyan-dark"}`} aria-hidden />
      {closed ? "Cerrado" : "Abierto"}
    </button>
  )
}

export function Confirm({
  open,
  title,
  text,
  busy,
  onYes,
  onNo,
  yes = "Confirmar",
  danger,
}: {
  open: boolean
  title: string
  text: string
  busy?: boolean
  onYes: () => void
  onNo: () => void
  yes?: string
  danger?: boolean
}) {
  return (
    <Modal open={open} onClose={onNo} title={title} trapFocus>
      <p className="text-sm text-ink/70">{text}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onNo} className={btnGhost}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => {
            if (busy) return
            onYes()
          }}
          disabled={busy}
          aria-busy={busy}
          className={danger ? `${btn} bg-brand text-white hover:opacity-90` : btnPrimary}
        >
          {busy && <Loader2 size={16} className="animate-spin" aria-hidden />} {yes}
        </button>
      </div>
    </Modal>
  )
}

function ConfirmDestructiveDialogBody({
  recordName,
  message,
  motiveRequired,
  motiveMax = 255,
  busy,
  onConfirm,
  onCancel,
  yes = "Confirmar",
  danger,
}: {
  recordName: string
  message: string
  motiveRequired?: boolean
  motiveMax?: number
  busy?: boolean
  onConfirm: (motive: string) => void
  onCancel: () => void
  yes?: string
  danger?: boolean
}) {
  const [motive, setMotive] = useState("")
  const ok =
    !motiveRequired || (motive.trim().length > 0 && motive.trim().length <= motiveMax)
  return (
    <>
      <p className="text-sm text-ink/70">
        {message} <span className="font-bold text-ink">{recordName}</span>
      </p>
      {motiveRequired && (
        <label className="mt-4 block text-sm font-semibold">
          Motivo
          <textarea
            value={motive}
            maxLength={motiveMax}
            required
            rows={3}
            className={input}
            aria-required
            onChange={(e) => setMotive(e.target.value)}
          />
          <span className="mt-1 block text-xs text-ink/50">{motive.trim().length}/{motiveMax}</span>
        </label>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className={btnGhost}>
          Cancelar
        </button>
        <button
          type="button"
          disabled={busy || !ok}
          aria-busy={busy}
          onClick={() => {
            if (busy || !ok) return
            onConfirm(motive.trim())
          }}
          className={danger ? `${btn} bg-brand text-white hover:opacity-90` : btnPrimary}
        >
          {busy && <Loader2 size={16} className="animate-spin" aria-hidden />} {yes}
        </button>
      </div>
    </>
  )
}

export function ConfirmDestructiveDialog({
  open,
  title,
  recordName,
  message,
  motiveRequired,
  motiveMax = 255,
  busy,
  onConfirm,
  onCancel,
  yes = "Confirmar",
  danger,
}: {
  open: boolean
  title: string
  recordName: string
  message: string
  motiveRequired?: boolean
  motiveMax?: number
  busy?: boolean
  onConfirm: (motive: string) => void
  onCancel: () => void
  yes?: string
  danger?: boolean
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} trapFocus>
      <ConfirmDestructiveDialogBody
        recordName={recordName}
        message={message}
        motiveRequired={motiveRequired}
        motiveMax={motiveMax}
        busy={busy}
        onConfirm={onConfirm}
        onCancel={onCancel}
        yes={yes}
        danger={danger}
      />
    </Modal>
  )
}

export function ConflictDialog({
  open,
  onReload,
  onCancel,
}: {
  open: boolean
  onReload: () => void
  onCancel: () => void
}) {
  return (
    <Modal open={open} onClose={onCancel} title="Conflicto de edición" trapFocus>
      <p className="text-sm text-ink/70" role="alert">
        Este registro fue modificado por otro usuario.
      </p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onCancel} className={btnGhost}>
          Cancelar
        </button>
        <button type="button" onClick={onReload} className={btnPrimary}>
          Recargar versión actual
        </button>
      </div>
    </Modal>
  )
}

export const input =
  "mt-1.5 w-full rounded-xl border-2 border-plum/15 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-cyan disabled:bg-ink/5"

export const inputInvalid = `${input} !border-brand ring-2 ring-brand/25`

export function Badge({ value }: { value: string }) {
  const tono =
    value === "Administrador" || value === "Activo"
      ? "bg-cyan/15 text-cyan-dark"
      : value === "Bloqueado" || value === "Inactivo"
        ? "bg-brand/10 text-brand-dark"
        : "bg-plum-soft text-plum"
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${tono}`}>{value}</span>
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms)
    return () => window.clearTimeout(t)
  }, [value, ms])
  return debounced
}

export function useDo() {
  const [pending, setPending] = useState(false)
  const run = useCallback(async (accion: () => Promise<void>, despues?: () => void) => {
    setPending(true)
    try {
      await accion()
      despues?.()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      if (msg) toast(msg)
    } finally {
      setPending(false)
    }
  }, [])
  return { run, pending }
}

export function Pager({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number
  totalPages: number
  total: number
  onPage: (n: number) => void
}) {
  if (total === 0) return null
  const cell = "inline-flex size-9 items-center justify-center rounded-lg text-sm font-bold transition"
  return (
    <nav aria-label="Paginación" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-ink/55">
        {total} registro{total === 1 ? "" : "s"} · página {page} de {totalPages}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Página anterior" className={`${cell} border-2 border-plum/15 text-plum hover:bg-plum-soft disabled:opacity-30`}>
            <ChevronLeft size={16} />
          </button>
          <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Página siguiente" className={`${cell} border-2 border-plum/15 text-plum hover:bg-plum-soft disabled:opacity-30`}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </nav>
  )
}

export function SearchCombobox({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = "Buscar…",
  invalid,
}: {
  label: string
  required?: boolean
  value: string
  onChange: (id: string) => void
  options: { id: string; label: string; hint?: string }[]
  placeholder?: string
  invalid?: boolean
}) {
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.id === value)
  const filtered = options.filter((o) => {
    const t = q.trim().toLowerCase()
    if (!t) return true
    return o.label.toLowerCase().includes(t) || (o.hint || "").toLowerCase().includes(t)
  })
  return (
    <FieldLabel label={label} required={required} className="relative">
      <input
        className={invalid ? inputInvalid : input}
        value={open ? q : selected?.label ?? ""}
        placeholder={placeholder}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
          if (!e.target.value) onChange("")
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border-2 border-plum/15 bg-white shadow-lg" role="listbox">
          {filtered.slice(0, 40).map((o) => (
            <li key={o.id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-plum-soft"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(o.id)
                  setQ("")
                  setOpen(false)
                }}
              >
                <span className="font-semibold">{o.label}</span>
                {o.hint && <span className="ml-2 text-xs text-ink/50">{o.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </FieldLabel>
  )
}

export const Panel = ({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <section className="rounded-2xl border-2 border-plum/10 bg-white p-5">
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        {title && <h2 className="font-display text-lg font-extrabold text-plum">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
)

export const Empty = ({ text }: { text: string }) => (
  <p className="rounded-xl border-2 border-dashed border-plum/15 p-8 text-center text-sm text-ink/55">{text}</p>
)
