import { useState } from "react"
import { Badge, Confirm, Empty, Panel, btnPrimary, input, useDo } from "./kit"
import { money } from "../../features/caja/format"
import type { CuadreCaja } from "../../features/caja/types"

type Props = {
  cuadre: CuadreCaja
  onSaveBase: (base: number) => Promise<boolean>
  onSaveEntrega: (entrega: number, nota: string) => Promise<boolean>
  onVentaRegistrada: (registrada: boolean) => Promise<boolean>
  onCierre: (body: { efectivo_contado: number; observaciones: string }) => Promise<boolean>
  puedeCerrar: boolean
}

export function CierreModule({ cuadre, onSaveBase, onSaveEntrega, onVentaRegistrada, onCierre, puedeCerrar }: Props) {
  const closed = cuadre.cerrado || cuadre.estado_jornada === "CERRADO"
  const [base, setBase] = useState(cuadre.base_inicial || 0)
  const [delivery, setDelivery] = useState(cuadre.entrega || 0)
  const [dNote, setDNote] = useState(cuadre.entrega_nota || "")
  const [counted, setCounted] = useState(closed ? String(cuadre.efectivo_esperado) : "")
  const [notes, setNotes] = useState("")
  const [ask, setAsk] = useState(false)
  const { run, pending } = useDo()
  const expected =
  cuadre.efectivo_esperado ||
    base +
      cuadre.ventas_efectivo +
      cuadre.adiciones -
      (cuadre.gastos + cuadre.ahorros + cuadre.transferencias) -
      delivery
  const diff = (Number(counted) || 0) - expected
  const row = (l: string, v: number, sign = "") => (
    <div className="flex justify-between py-2 text-sm">
      <dt>{l}</dt>
      <dd className="font-bold">
        {sign}
        {money(v)}
      </dd>
    </div>
  )
  const numInput = (label: string, v: number, set: (n: number) => void, onBlur?: () => void) => (
    <div className="flex items-center justify-between py-2 text-sm">
      <dt>{label}</dt>
      <dd>
        <input
          aria-label={label}
          type="number"
          min={0}
          disabled={closed}
          value={v || ""}
          onChange={(e) => set(Number(e.target.value))}
          onBlur={() => onBlur?.()}
          className="w-32 rounded-lg border-2 border-plum/15 px-2 py-1 text-right font-bold disabled:bg-ink/5"
        />
      </dd>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={`Jornada ${cuadre.fecha} · ${cuadre.sede}`}>
          {closed && <p className="mb-3 rounded-xl bg-cyan/15 p-3 text-sm font-bold text-cyan-dark">Esta jornada ya está cerrada y bloqueada.</p>}
          <dl className="divide-y divide-plum/10">
            {numInput("Base inicial", base, setBase, () => void run(async () => { await onSaveBase(base) }))}
            {numInput("Entrega", delivery, setDelivery, () => void run(async () => { await onSaveEntrega(delivery, dNote) }))}
            {delivery > 0 && !closed && (
              <div className="py-2 text-sm">
                <label className="block text-xs font-semibold text-ink/60">
                  Nota de la entrega (opcional)
                  <input
                    value={dNote}
                    onChange={(e) => setDNote(e.target.value)}
                    onBlur={() => void run(async () => { await onSaveEntrega(delivery, dNote) })}
                    className={input}
                  />
                </label>
              </div>
            )}
            {closed && cuadre.entrega_nota && <div className="py-2 text-xs text-ink/60">Nota de la entrega: {cuadre.entrega_nota}</div>}
            {row(`Ventas en efectivo (${cuadre.cantidad_ventas} ventas)`, cuadre.ventas_efectivo, "+ ")}
            {row("Adiciones de base", cuadre.adiciones, "+ ")}
            {row("Gastos", cuadre.gastos, "− ")}
            {row("Ahorros", cuadre.ahorros, "− ")}
            {row("Transferencias (bloqueadas)", cuadre.transferencias, "− ")}
            {row("Entrega", delivery, "− ")}
            <div className="flex justify-between py-3">
              <dt className="font-extrabold text-plum">Efectivo esperado</dt>
              <dd className="font-display text-2xl font-extrabold text-plum">{money(expected)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-ink/55">
            Informativo: ventas por transferencia {money(cuadre.ventas_transferencia)} · tarjeta {money(cuadre.ventas_tarjeta)}. La entrega se guarda como valor del día, no como gasto.
          </p>
          {!closed && (
            <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={cuadre.ventas_registrada}
                onChange={(e) => void run(async () => { await onVentaRegistrada(e.target.checked) })}
              />
              Venta del día registrada en sistema
            </label>
          )}
        </Panel>
        <Panel title="Arqueo y cierre">
          <label className="block text-sm font-semibold">
            Efectivo contado
            <input type="number" min={0} disabled={closed} value={counted} onChange={(e) => setCounted(e.target.value)} className={input} />
          </label>
          <p
            className={`mt-3 rounded-xl p-3 text-sm font-bold ${counted === "" ? "bg-plum-soft text-plum" : diff === 0 ? "bg-cyan/15 text-cyan-dark" : "bg-brand/10 text-brand-dark"}`}
            role="status"
          >
            {counted === ""
              ? "Ingresa lo contado para ver la diferencia."
              : diff === 0
                ? "Caja cuadrada."
                : diff > 0
                  ? `Sobrante de ${money(diff)}`
                  : `Faltante de ${money(-diff)}`}
          </p>
          <label className="mt-4 block text-sm font-semibold">
            Observaciones
            <textarea rows={3} disabled={closed} value={notes} onChange={(e) => setNotes(e.target.value)} className={input} />
          </label>
          <button
            type="button"
            disabled={closed || counted === "" || pending || !puedeCerrar}
            onClick={() => setAsk(true)}
            className={`${btnPrimary} mt-5`}
          >
            Cerrar jornada
          </button>
        </Panel>
      </div>

      <Panel title="Estado de la jornada">
        <p className="text-sm text-ink/70">
          Estado: <Badge value={cuadre.estado_jornada} />
        </p>
        {!cuadre.ventas_registrada && !closed && <Empty text="Marque «venta registrada» antes de cerrar si aplica en su sede." />}
      </Panel>

      <Confirm
        open={ask}
        busy={pending}
        yes="Cerrar jornada"
        title="Cerrar la jornada"
        text="Al cerrar, los movimientos del día quedan bloqueados y no se podrán editar. ¿Continuar?"
        onNo={() => setAsk(false)}
        onYes={() =>
          void run(async () => {
            const ok = await onCierre({ efectivo_contado: Number(counted), observaciones: notes })
            if (ok) setAsk(false)
          })
        }
      />
    </div>
  )
}