// =============================================================
// COMPONENTE: form-equipo.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: registra un equipo nuevo (inversor + batería) en
// estado 'en_stock', listo para asignarse a un cliente después.
// Todos los valores (modelo, capacidad, costo) son configurables
// aquí — nada hardcodeado.
// =============================================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function FormEquipo() {
  const supabase = createClient()
  const router = useRouter()

  const [numeroSerie, setNumeroSerie] = useState('')
  const [modelo, setModelo] = useState('')
  const [capacidadInversor, setCapacidadInversor] = useState(0)
  const [capacidadBateria, setCapacidadBateria] = useState(0)
  const [costoTotal, setCostoTotal] = useState(0)
  const [macAddress, setMacAddress] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cantidadFracciones = costoTotal > 0 ? Math.floor(costoTotal / 100) : 0

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!numeroSerie.trim() || !modelo.trim()) {
      setError('Número de serie y modelo son obligatorios.')
      return
    }
    if (costoTotal <= 0) {
      setError('El costo total debe ser mayor a 0.')
      return
    }

    setGuardando(true)
    const { error: errInsert } = await supabase.from('equipo').insert({
      numero_serie: numeroSerie.trim(),
      modelo: modelo.trim(),
      capacidad_inversor_kw: capacidadInversor,
      capacidad_bateria_kwh: capacidadBateria,
      costo_total_usd: costoTotal,
      mac_address: macAddress.trim() || null,
      estado: 'en_stock',
    })

    if (errInsert) {
      setError('No se pudo registrar el equipo: ' + errInsert.message)
      setGuardando(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={guardar} className="space-y-6 rounded-lg border border-line bg-surface p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Número de serie</label>
          <input
            type="text"
            value={numeroSerie}
            onChange={(e) => setNumeroSerie(e.target.value)}
            placeholder="EQ-0003"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Modelo / tipo de equipo</label>
          <input
            type="text"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            placeholder="Estación Comercial 12kW/16kWh"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Capacidad inversor (kW)
          </label>
          <input
            type="number"
            step="0.1"
            min={0}
            value={capacidadInversor}
            onChange={(e) => setCapacidadInversor(Number(e.target.value))}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Capacidad batería (kWh)
          </label>
          <input
            type="number"
            step="0.1"
            min={0}
            value={capacidadBateria}
            onChange={(e) => setCapacidadBateria(Number(e.target.value))}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Costo total (USD)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={costoTotal}
            onChange={(e) => setCostoTotal(Number(e.target.value))}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
          <p className="mt-1 text-[11px] text-muted">
            {costoTotal > 0
              ? `Este equipo tendrá ${cantidadFracciones} fracciones disponibles ($100 c/u).`
              : 'Cada $100 de costo equivale a una fracción disponible para inversionistas.'}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Dirección MAC (opcional)
          </label>
          <input
            type="text"
            value={macAddress}
            onChange={(e) => setMacAddress(e.target.value)}
            placeholder="AA:BB:CC:DD:EE:FF"
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
        {guardando ? 'Guardando...' : 'Registrar equipo (en stock)'}
      </button>
    </form>
  )
}
