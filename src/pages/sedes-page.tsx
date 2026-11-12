import { useEffect, useState } from "react"
import { Sticker } from "../components/ui/splash"
import { BranchCard, type BranchView } from "../components/site/branch-card"
import { Reveal } from "../components/ui/reveal"
import { getSiteSettings } from "../lib/public-data"
import { API_URL } from "../shared/api"

type ApiSede = {
  id_sede: number
  nombre: string
  direccion: string
  ciudad?: string
  whatsapp?: string
  maps_url?: string
  map_query?: string
  schedule_text?: string
}

export function SedesPage() {
  const s = getSiteSettings()
  const [list, setList] = useState<BranchView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch(`${API_URL}/api/v1/branches/`)
        if (!r.ok) {
          setError("No fue posible cargar las sedes. Intente nuevamente.")
          return
        }
        const data = (await r.json()) as ApiSede[]
        setList(
          data.map((b) => ({
            id: b.id_sede,
            name: b.nombre,
            address: b.direccion,
            city: b.ciudad ?? "Cali",
            schedule: b.schedule_text ?? null,
            mapsUrl: b.maps_url ?? null,
            mapQuery: b.map_query ?? null,
          })),
        )
      } catch {
        setError("No fue posible cargar las sedes. Intente nuevamente.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const [first, ...rest] = list
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-14 md:px-10">
        <Sticker>Cali, Colombia</Sticker>
        <h1 className="mt-5 font-display text-5xl font-extrabold text-plum md:text-6xl">Sedes y contacto</h1>
        <p className="mt-4 max-w-2xl text-ink/70">Encuentra la sede más cercana, revisa si estamos abiertos hoy y escríbenos por WhatsApp.</p>
        {loading ? (
          <p className="mt-12 text-sm text-ink/60">Cargando sedes…</p>
        ) : error ? (
          <p className="mt-12 text-sm font-semibold text-brand" role="alert">
            {error}
          </p>
        ) : !list.length ? (
          <p className="mt-12 text-sm text-ink/60">No hay sedes activas publicadas.</p>
        ) : (
          <div className="mt-12 space-y-14">
            <Reveal>
              <BranchCard b={first} index={0} whatsapp={s.whatsapp} variant="featured" />
            </Reveal>
            {rest.length === 1 && (
              <Reveal>
                <BranchCard b={rest[0]} index={1} whatsapp={s.whatsapp} variant="featured" mirror />
              </Reveal>
            )}
            {rest.length > 1 && (
              <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
                {rest.map((b, i) => (
                  <Reveal
                    key={b.id}
                    delay={(i % 2) * 120}
                    className={`${i % 2 === 1 ? "md:mt-16" : ""} ${rest.length % 2 === 1 && i === rest.length - 1 ? "md:col-span-2" : ""}`}
                  >
                    <BranchCard
                      b={b}
                      index={i + 1}
                      whatsapp={s.whatsapp}
                      variant={rest.length % 2 === 1 && i === rest.length - 1 ? "featured" : "tile"}
                      mirror={i % 2 === 0}
                    />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
