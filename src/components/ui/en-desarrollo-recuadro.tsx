import { Construction } from "lucide-react"
import { EN_DESARROLLO } from "../../features/en-desarrollo"

export function EnDesarrolloRecuadro({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`stripes rounded-3xl border-2 border-dashed border-plum/30 bg-white/80 text-center ${compact ? "p-8" : "p-10 md:p-14"}`}
      role="status"
    >
      <Construction className="mx-auto size-10 text-brand" aria-hidden />
      <p className="mt-4 font-display text-2xl font-extrabold text-plum md:text-3xl">{EN_DESARROLLO}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm text-ink/65">
        La integración con el backend cargará aquí la información real cuando esté disponible.
      </p>
    </div>
  )
}
