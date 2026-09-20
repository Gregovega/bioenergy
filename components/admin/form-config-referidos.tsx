'use client'

// =============================================================
// COMPONENTE: form-config-referidos.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: edita configuracion_global.referido_inversion_minima_usd
// (monto acumulado que necesita un inversionista para que sus
// dividendos generen comisión hacia su cadena de referidos) y el
// interruptor maestro programa_referidos_activo, sin tocar Supabase
// directamente.
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2 } from 'lucide-react'

export function FormConfigReferidos({
  montoMinimoInicial,
  programaActivoInicial,
}: {
  montoMinimoInicial: number
  programaActivoInicial: boolean
}) {
  const supabase = createClient()
  const router = useRouter()

  const [montoTexto, setMontoTexto] = useState(String(montoMinimoInicial))
  const [programaActivo, setProgramaActivo] = useState(programaActivoInicial)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  async function guardar() {
    const monto = Number(montoTexto)
    if (!Number.isFinite(monto) || monto < 0) {
      setMensaje('El monto mínimo debe ser un número válido.')
      return
    }
    setGuardando(true)
    setMensaje(null)

    const [{ error: err1 }, { error: err2 }] = await Promise.all([
      supabase
        .from('configuracion_global')
        .update({ valor: String(monto) })
        .eq('clave', 'referido_inversion_minima_usd'),
      supabase
        .from('configuracion_global')
        .update({ valor: programaActivo ? 'true' : 'false' })
        .eq('clave', 'programa_referidos_activo'),
    ])

    setGuardando(false)

    if (err1 || err2) {
      setMensaje('No se pudo guardar: ' + (err1?.message ?? err2?.message))
      return
    }

    setMensaje('Guardado.')
    router.refresh()
  }

  return (
    <div className="space-y-4 rounded-lg border border-line bg-surface p-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          Programa de referidos
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={programaActivo}
            onChange={(e) => setProgramaActivo(e.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          Activo (los dividendos generan comisión hacia la cadena de referidos)
        </label>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          Inversión mínima acumulada para participar en referidos (USD)
        </label>
        <input
          type="number"
          step="1"
          min={0}
          value={montoTexto}
          onChange={(e) => setMontoTexto(e.target.value)}
          className="w-full max-w-xs rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
        />
        <p className="mt-1 text-[11px] text-muted">
          Suma de todas las participaciones activas de un inversionista. Por debajo de este monto,
          sus dividendos se pagan normal pero no generan comisión hacia arriba en la cadena de
          referidos. En cuanto la suma acumulada llegue aquí, empieza a participar automáticamente.
        </p>
      </div>

      {mensaje && <p className="text-sm text-muted">{mensaje}</p>}

      <button
        onClick={guardar}
        disabled={guardando}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
      >
        {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Guardar
      </button>
    </div>
  )
}
