// =============================================================
// COMPONENTE: form-fraccion.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: registra que un inversionista compró una fracción de
// un equipo específico. Calcula el % de propiedad automáticamente
// (monto aportado / costo total del equipo) y avisa si el equipo
// ya no tiene fracciones disponibles.
// =============================================================

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Inversionista = { id: string; nombre: string; email: string }
type Equipo = { id: string; numero_serie: string; modelo: string; costo_total_usd: number }
type FraccionExistente = { equipo_id: string; monto_aportado_usd: number }

const MINIMO_INVERSION = 200

export function FormFraccion() {
  const supabase = createClient()
  const router = useRouter()

  const [inversionistas, setInversionistas] = useState<Inversionista[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [fraccionesExistentes, setFraccionesExistentes] = useState<FraccionExistente[]>([])
  const [cargando, setCargando] = useState(true)

  const [inversionistaId, setInversionistaId] = useState('')
  const [equipoId, setEquipoId] = useState('')
  const [montoAportado, setMontoAportado] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      const [{ data: inv }, { data: eq }, { data: fr }] = await Promise.all([
        supabase.from('inversionista').select('id, nombre, email').order('nombre'),
        supabase
          .from('equipo')
          .select('id, numero_serie, modelo, costo_total_usd')
          .order('numero_serie'),
        supabase
          .from('fraccion')
          .select('equipo_id, monto_aportado_usd')
          .eq('estado', 'activa'),
      ])
      setInversionistas(inv ?? [])
      setEquipos(eq ?? [])
      setFraccionesExistentes(fr ?? [])
      setCargando(false)
    }
    cargar()
  }, [supabase])

  const equipoSeleccionado = equipos.find((eq) => eq.id === equipoId)

  const yaAportadoAlEquipo = useMemo(() => {
    return fraccionesExistentes
      .filter((f) => f.equipo_id === equipoId)
      .reduce((acc, f) => acc + Number(f.monto_aportado_usd), 0)
  }, [fraccionesExistentes, equipoId])

  const costoEquipo = equipoSeleccionado?.costo_total_usd ?? 0
  const disponibleEnEquipo = Math.max(costoEquipo - yaAportadoAlEquipo, 0)
  const porcentajeResultante = costoEquipo > 0 ? montoAportado / costoEquipo : 0
  const excedeDisponible = montoAportado > disponibleEnEquipo

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!inversionistaId || !equipoId) {
      setError('Selecciona un inversionista y un equipo.')
      return
    }
    if (montoAportado < MINIMO_INVERSION) {
      setError(`El monto mínimo de inversión es $${MINIMO_INVERSION}.`)
      return
    }
    if (excedeDisponible) {
      setError(
        `Ese equipo solo tiene $${disponibleEnEquipo.toFixed(2)} disponibles para invertir.`
      )
      return
    }

    setGuardando(true)
    const { error: errInsert } = await supabase.from('fraccion').insert({
      inversionista_id: inversionistaId,
      equipo_id: equipoId,
      monto_aportado_usd: montoAportado,
      porcentaje_propiedad: porcentajeResultante,
      estado: 'activa',
      fecha_compra: new Date().toISOString(),
    })

    if (errInsert) {
      setError('No se pudo registrar la fracción: ' + errInsert.message)
      setGuardando(false)
      return
    }

    router.push('/admin/categorias')
    router.refresh()
  }

  if (cargando) {
    return <div className="text-sm text-muted">Cargando inversionistas y equipos...</div>
  }

  return (
    <form onSubmit={guardar} className="space-y-6 rounded-lg border border-line bg-surface p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Inversionista</label>
          <select
            value={inversionistaId}
            onChange={(e) => setInversionistaId(e.target.value)}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          >
            <option value="">Selecciona un inversionista...</option>
            {inversionistas.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.nombre} — {inv.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Equipo</label>
          <select
            value={equipoId}
            onChange={(e) => setEquipoId(e.target.value)}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          >
            <option value="">Selecciona un equipo...</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.numero_serie} — {eq.modelo} (${eq.costo_total_usd})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">
            Monto aportado (USD) — mínimo ${MINIMO_INVERSION}
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={montoAportado}
            onChange={(e) => setMontoAportado(Number(e.target.value))}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
          {equipoId && (
            <p className={`mt-1 text-[11px] ${excedeDisponible ? 'text-red-500' : 'text-muted'}`}>
              {excedeDisponible
                ? `Excede lo disponible en este equipo ($${disponibleEnEquipo.toFixed(2)}).`
                : `Disponible en este equipo: $${disponibleEnEquipo.toFixed(2)} de $${costoEquipo.toFixed(2)}. Esta fracción representaría ${(porcentajeResultante * 100).toFixed(2)}% de propiedad.`}
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={guardando || excedeDisponible}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : 'Registrar fracción'}
      </button>
    </form>
  )
}
