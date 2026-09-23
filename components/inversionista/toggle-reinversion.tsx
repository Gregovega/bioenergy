'use client'

// =============================================================
// COMPONENTE: toggle-reinversion.tsx
// PORTAL: Inversionista
// QUÉ HACE: permite al inversionista prender/apagar su reinversión
// automática. Llama a fn_set_reinversion_activa (RPC con
// SECURITY DEFINER) porque no hay política RLS que deje al
// inversionista hacer UPDATE directo sobre su propia fila de
// `inversionista` — así que un update directo con supabase.from()
// fallaría en silencio (0 filas afectadas) y esto NO.
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Sprout, Wallet } from 'lucide-react'

export default function ToggleReinversion({ activaInicial }: { activaInicial: boolean }) {
  const supabase = createClient()
  const router = useRouter()

  const [activa, setActiva] = useState(activaInicial)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cambiar() {
    const nuevoValor = !activa
    setGuardando(true)
    setError(null)

    const { error: err } = await supabase.rpc('fn_set_reinversion_activa', {
      p_activa: nuevoValor,
    })

    setGuardando(false)

    if (err) {
      setError('No se pudo guardar el cambio: ' + err.message)
      return
    }

    setActiva(nuevoValor)
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              activa ? 'bg-signal/10 text-signal' : 'bg-line/40 text-muted'
            }`}
          >
            {activa ? <Sprout className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="text-sm font-medium text-ink">Reinversión automática</h3>
            <p className="mt-1 max-w-md text-xs text-muted">
              {activa
                ? 'Tus ganancias mensuales se están acumulando en el pool de reinversión para comprar equipos nuevos, en vez de pagarse como saldo retirable. Tu capital invertido no se toca ni se bloquea.'
                : 'Tus ganancias mensuales se pagan como saldo retirable normal. Puedes activar la reinversión cuando quieras.'}
            </p>
          </div>
        </div>

        <button
          onClick={cambiar}
          disabled={guardando}
          role="switch"
          aria-checked={activa}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            activa ? 'bg-signal' : 'bg-line'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-base transition-transform ${
              activa ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {guardando && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
          <Loader2 className="h-3 w-3 animate-spin" /> Guardando...
        </p>
      )}
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
    </div>
  )
}
