import { MessageCircle } from "lucide-react"
import { digitosWhatsApp, urlWhatsApp } from "../../lib/whatsapp"

export function BotonWhatsApp({ telefono, nombre }: { telefono: string; nombre: string }) {
  const digitos = digitosWhatsApp(telefono)
  if (!digitos) return null
  return (
    <a
      href={urlWhatsApp(digitos)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex rounded-lg p-2 text-brand hover:bg-brand/10"
      aria-label={`Enviar mensaje de WhatsApp a ${nombre}`}
    >
      <MessageCircle size={16} aria-hidden />
    </a>
  )
}
