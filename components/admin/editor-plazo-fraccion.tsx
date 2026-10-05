'use client'

// =============================================================
// COMPONENTE: editor-plazo-fraccion.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: edita fraccion.plazo_meses de UNA participación y muestra
// al instante hasta qué fecha pagará dividendo (fecha_compra + plazo).
// Staff ya tiene permiso de escritura en fraccion por RLS; el cambio
// queda registrado en auditoria_cambio automáticamente.
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2 } from 'lucide-react'

function sumarMeses(fechaISO: string, meses: number) {
  const d = new Date(fechaISO)
  d.setMonth(d.getMonth() + meses)
  return d
}

export function EditorPlazoFraccion({
  fraccionId,
  plazoInicial,
  fechaCompra,
}: {
  fraccionId: string
  plazoInicial: number
  fechaCompra: string
}) {
  const supabase = createClient()
  const router = useRouter()

  const [texto, setTexto] = useState(String(plazoInicial))
  const [guardado, setGuardado] = useState(plazoInicial)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const meses = Number(texto)
  const valido = Number.isInteger(meses) && meses >= 1 && meses <= 240
  const hasta = valido ? sumarMeses(fechaCompra, meses) : null
  const cambio = valido && meses !== guardado

  async function guardar() {
    if (!valido) {
      setMensaje('Escribe un número entero de meses entre 1 y 240.')
      return
    }
    setGuardando(true)
    setMensaje(null)

    const { error } = await supabase
      .from('fraccion')
      .update({ plazo_meses: meses })
      .eq('id', fraccionId)

    setGuardando(false)

    if (error) {
      setMensaje('No se pudo guardar: ' + error.message)
      return
    }

    setGuardado(meses)
    setMensaje('Guardado.')
    router.refresh()
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={240}
          step={1}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            setMensaje(null)
          }}
          className="w-20 rounded-md border border-line bg-base px-2 py-1.5 font-mono text-sm text-ink"
        />
        <span className="text-xs text-muted">meses</span>
        <button
          onClick={guardar}
          disabled={guardando || !cambio}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-base disabled:opacity-40"
        >
          {guardando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Guardar
        </button>
      </div>
      <p className="text-[11px] text-muted">
        {hasta
          ? `Paga dividendo hasta el ${hasta.toLocaleDateString('es-VE')}`
          : 'Plazo no válido'}
      </p>
      {mensaje && <p className="text-[11px] text-muted">{mensaje}</p>}
    </div>
  )
}
