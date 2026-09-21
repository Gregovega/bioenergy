'use client'

// =============================================================
// COMPONENTE: enlace-referido.tsx
// PÁGINA: /inversionista/reporte
// QUÉ HACE: muestra el enlace de referido completo (listo para
// compartir), con botón de copiar al portapapeles y botón directo
// a WhatsApp con el mensaje pre-armado. Reemplaza el badge de
// solo texto ("Tu código: XXXX") que quedó tras la reconstrucción
// de la página de reporte.
// =============================================================

import { useState } from 'react'
import { Copy, Check, MessageCircle } from 'lucide-react'

export function EnlaceReferido({ codigo }: { codigo: string | null | undefined }) {
  const [copiado, setCopiado] = useState(false)

  if (!codigo) {
    return (
      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
        Sin código asignado
      </span>
    )
  }

  const origen = typeof window !== 'undefined' ? window.location.origin : ''
  const enlace = `${origen}/?ref=${codigo}`
  const mensajeWhatsapp = `¡Únete a Bioenergy conmigo! Invierte en equipos de energía y gana dividendos mensuales. Usa mi enlace: ${enlace}`
  const urlWhatsapp = `https://wa.me/?text=${encodeURIComponent(mensajeWhatsapp)}`

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(enlace)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Si el navegador bloquea el portapapeles, no rompemos la UI
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-base px-3 py-2">
        <span className="truncate font-mono text-xs text-ink sm:text-sm">{enlace}</span>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={copiarEnlace}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition hover:bg-base"
        >
          {copiado ? <Check className="h-3.5 w-3.5 text-signal" /> : <Copy className="h-3.5 w-3.5" />}
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
        <a
          href={urlWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-base transition hover:opacity-90"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>
      </div>
    </div>
  )
}
