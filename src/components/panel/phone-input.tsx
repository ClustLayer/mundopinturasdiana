import { useMemo, useState } from "react"
import { FieldLabel, input, inputInvalid } from "./kit"
import { PHONE_COUNTRIES, formatE164, parseE164 } from "../../lib/phone-e164"

export function PhoneInput({
  label,
  value,
  onChange,
  required,
  invalid,
  placeholder = "300 123 4567",
}: {
  label: string
  value: string
  onChange: (e164: string) => void
  required?: boolean
  invalid?: boolean
  placeholder?: string
}) {
  const [countryQ, setCountryQ] = useState("")
  const [open, setOpen] = useState(false)

  const { dial, national } = useMemo(() => parseE164(value), [value])
  const country = useMemo(
    () => PHONE_COUNTRIES.find((c) => c.dial === dial) ?? PHONE_COUNTRIES[0],
    [dial],
  )

  const filtered = useMemo(() => {
    const t = countryQ.trim().toLowerCase()
    if (!t) return PHONE_COUNTRIES
    return PHONE_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(t) || c.dial.includes(t.replace(/\D/g, "")) || `+${c.dial}`.includes(t),
    )
  }, [countryQ])

  const displayCountry = open ? countryQ : `${country.name} (+${country.dial})`

  return (
    <FieldLabel label={label} required={required} className="relative">
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1 sm:max-w-[14rem]">
          <input
            className={`${invalid ? inputInvalid : input} !mt-0`}
            value={displayCountry}
            placeholder="Buscar país…"
            aria-autocomplete="list"
            aria-expanded={open}
            onChange={(e) => {
              setCountryQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => {
              setCountryQ("")
              setOpen(true)
            }}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          />
          {open && filtered.length > 0 && (
            <ul
              className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border-2 border-plum/15 bg-white shadow-lg"
              role="listbox"
            >
              {filtered.map((c) => (
                <li key={c.iso}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-plum-soft"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setCountryQ("")
                      setOpen(false)
                      onChange(formatE164(c.dial, national))
                    }}
                  >
                    <span className="font-semibold">{c.name}</span>
                    <span className="ml-2 text-xs text-ink/55">+{c.dial}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="tel-national"
          className={`${invalid ? inputInvalid : input} !mt-0 flex-[2]`}
          value={national}
          placeholder={placeholder}
          aria-invalid={invalid}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "")
            onChange(formatE164(dial, digits))
          }}
        />
      </div>
    </FieldLabel>
  )
}
