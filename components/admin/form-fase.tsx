// =============================================================
// COMPONENTE: form-fase.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: crea una nueva fase de inversión (nombre, tope,
// % de bono, vigencia). El admin define todos los valores
// manualmente — nada viene fijo en el código.
// =============================================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function FormFase() {
  const supabase = createClient()
  const router = useRouter()

  const [nombre, setNombre] = useState('')
  const [montoTope, setMontoTope] = useState(0)
  const [porcentajeBono, setPorcentajeBono] = useState(0)
  const [vigenciaMeses, setVigenciaMeses] = useState<number | ''>('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError('El nombre de la fase es obligatorio.')
      return
    }
    if (montoTope <= 0) {
      setError('El tope debe ser mayor a 0.')
      return
    }
    if (porcentajeBono < 0 || porcentajeBono > 100) {
      setError('El porcentaje debe estar entre 0 y 100.')
      return
    }

    setGuardando(true)

    // Averigua cuál es el siguiente número de orden (fase 1, 2, 3...)
    const { data: ultimaFase } = await supabase
      .from('fase_inversion')
      .select('orden')
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()

    const siguienteOrden = (ultimaFase?.orden ?? 0) + 1

    const { error: errInsert } = await supabase.from('fase_inversion').insert({
      orden: siguienteOrden,
      nombre: nombre.trim(),
      monto_tope_usd: montoTope,
      porcentaje_bono: porcentajeBono / 100,
      vigencia_meses: vigenciaMeses === '' ? null : vigenciaMeses,
      estado: 'abierta',
    })

    if (errInsert) {
      setError('No se pudo crear la fase: ' + errInsert.message)
      setGuardando(false)
      return
    }

    router.push('/admin/fases')
    router.refresh()
  }

  return (
    <form onSubmit={guardar} className="space-y-6 rounded-lg border border-line bg-surface p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Nombre de la fase</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Fundadores"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Tope de captación (USD)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={montoTope}
            onChange={(e) => setMontoTope(Number(e.target.value))}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            % de bono de expansión
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={porcentajeBono}
            onChange={(e) => setPorcentajeBono(Number(e.target.value))}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
          <p className="mt-1 text-[11px] text-muted">
            % sobre el ingreso de los equipos propios de la empresa que se destina a esta fase.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Vigencia del bono (meses, opcional)
          </label>
          <input
            type="number"
            min={0}
            value={vigenciaMeses}
            onChange={(e) => setVigenciaMeses(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Ej. 36 (déjalo vacío para sin límite)"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : 'Crear fase'}
      </button>
    </form>
  )
}
