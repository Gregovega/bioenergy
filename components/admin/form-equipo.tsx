// =============================================================
// COMPONENTE: form-equipo.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: registra un equipo nuevo (inversor + batería) en
// estado 'en_stock', listo para asignarse a un cliente después.
// Todos los valores (modelo, capacidad, costo) son configurables
// aquí — nada hardcodeado.
// =============================================================

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function FormEquipo() {
  const supabase = createClient()
  const router = useRouter()

  // Los numéricos van como TEXTO para que el campo pueda quedar vacío
  // (si van como número arrancan en 0 y al escribir queda "050000").
  const [numeroSerie, setNumeroSerie] = useState('')
  const [modelo, setModelo] = useState('')
  const [capacidadInversorTexto, setCapacidadInversorTexto] = useState('')
  const [capacidadBateriaTexto, setCapacidadBateriaTexto] = useState('')
  const [costoTotalTexto, setCostoTotalTexto] = useState('')
  const [macAddress, setMacAddress] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modelo "Uber": el equipo lo aporta un tercero para que Bioenergy lo gestione
  const [esDeTercero, setEsDeTercero] = useState(false)
  const [propietarioId, setPropietarioId] = useState('')
  const [comisionTexto, setComisionTexto] = useState('')
  const [inversionistas, setInversionistas] = useState<{ id: string; nombre: string; email: string }[]>([])

  const capacidadInversor = Number(capacidadInversorTexto) || 0
  const capacidadBateria = Number(capacidadBateriaTexto) || 0
  const costoTotal = Number(costoTotalTexto) || 0
  const participacionesDelTercero = costoTotal > 0 ? costoTotal / 20 : 0

  useEffect(() => {
    async function cargarInversionistas() {
      const { data } = await supabase
        .from('inversionista')
        .select('id, nombre, email')
        .order('nombre')
      setInversionistas(data ?? [])
    }
    cargarInversionistas()
  }, [supabase])


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
    if (esDeTercero && !propietarioId) {
      setError('Selecciona quién es el dueño del equipo aportado.')
      return
    }

    setGuardando(true)
    const { data: equipoCreado, error: errInsert } = await supabase
      .from('equipo')
      .insert({
        numero_serie: numeroSerie.trim(),
        modelo: modelo.trim(),
        capacidad_inversor_kw: capacidadInversor,
        capacidad_bateria_kwh: capacidadBateria,
        costo_total_usd: costoTotal,
        mac_address: macAddress.trim() || null,
        estado: 'en_stock',
      })
      .select('id')
      .single()

    if (errInsert) {
      setError('No se pudo registrar el equipo: ' + errInsert.message)
      setGuardando(false)
      return
    }

    // Modelo Uber: la función de Supabase marca el equipo como de tercero y le
    // acredita al dueño sus participaciones por el costo real del equipo.
    if (esDeTercero && equipoCreado) {
      const { error: errTercero } = await supabase.rpc('fn_registrar_equipo_de_tercero', {
        p_equipo_id: equipoCreado.id,
        p_propietario_inversionista_id: propietarioId,
        p_comision_gestion_pct: comisionTexto === '' ? null : Number(comisionTexto) / 100,
      })

      if (errTercero) {
        setError(
          'El equipo se creó, pero no se pudo registrar como equipo de tercero: ' +
            errTercero.message
        )
        setGuardando(false)
        return
      }
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
            value={capacidadInversorTexto}
            onChange={(e) => setCapacidadInversorTexto(e.target.value)}
            placeholder="0"
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
            value={capacidadBateriaTexto}
            onChange={(e) => setCapacidadBateriaTexto(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Costo total (USD)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={costoTotalTexto}
            onChange={(e) => setCostoTotalTexto(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
          <p className="mt-1 text-[11px] text-muted">
            {costoTotal > 0
              ? `Este equipo tendrá $${costoTotal.toFixed(2)} disponibles para participaciones de inversionistas.`
              : 'El costo total determina cuánto pueden aportar los inversionistas en participaciones.'}
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

      {/* Modelo Uber: equipo aportado por un tercero */}
      <div className="rounded-lg border border-line bg-base p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={esDeTercero}
            onChange={(e) => setEsDeTercero(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-line"
          />
          <span>
            <span className="block text-sm font-medium text-ink">
              Este equipo lo aporta un tercero para que nosotros lo gestionemos
            </span>
            <span className="mt-0.5 block text-[11px] text-muted">
              El equipo se declara a su costo real con nacionalización. El dueño recibe
              participaciones por ese costo y cobra igual que cualquier inversionista. Nuestra
              ganancia aquí es la comisión de gestión, no un margen sobre el equipo.
            </span>
          </span>
        </label>

        {esDeTercero && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Dueño del equipo</label>
              <select
                value={propietarioId}
                onChange={(e) => setPropietarioId(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
              >
                <option value="">Selecciona al dueño...</option>
                {inversionistas.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.nombre} — {inv.email}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-muted">
                Debe existir antes como inversionista. Si no está en la lista, créalo primero.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Comisión de gestión (%)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={comisionTexto}
                onChange={(e) => setComisionTexto(e.target.value)}
                placeholder="Ej. 15"
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
            </div>

            {costoTotal > 0 && (
              <p className="text-[11px] text-muted sm:col-span-2">
                Con un costo de ${costoTotal.toFixed(2)}, el dueño recibirá{' '}
                <span className="font-mono text-ink">
                  {participacionesDelTercero.toFixed(2)} participaciones
                </span>{' '}
                (valoradas al precio normalizado de reparto).
              </p>
            )}
          </div>
        )}
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
