'use client'

// =============================================================
// COMPONENTE: reinversion-cerrar-ronda.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: le muestra al staff cuánto hay acumulado en el pool
// de reinversión, le deja elegir un equipo en stock, y calcula
// en vivo si el pool + el tope de la empresa (30%) alcanza para
// comprarlo. Al confirmar, llama a fn_comprar_equipo_con_reinversion
// (RPC con SECURITY DEFINER) que hace todo el trabajo del lado
// de la base de datos: junta los aportes, crea las fracciones con
// origen=reinversion, y si hace falta agrega la fracción de la
// empresa. Esta pantalla NO decide nada por su cuenta — solo
// muestra el cálculo antes de confirmar y deja que la función
// de la base de datos sea la única fuente de verdad.
// =============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, PackageCheck, TriangleAlert } from 'lucide-react'

const TOPE_EMPRESA_PCT = 0.30

type Equipo = {
  id: string
  numero_serie: string
  modelo: string | null
  costo_total_usd: number
}

type Ronda = {
  id: string
  monto_pool_usd: number
  monto_empresa_usd: number
  costo_equipo_usd: number
}

export function ReinversionCerrarRonda() {
  const supabase = createClient()
  const router = useRouter()

  const [cargando, setCargando] = useState(true)
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [poolDisponible, setPoolDisponible] = useState(0)
  const [equipoId, setEquipoId] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rondaCreada, setRondaCreada] = useState<Ronda | null>(null)

  async function cargarDatos() {
    setCargando(true)
    const [{ data: equiposData }, { data: aportesData }] = await Promise.all([
      supabase
        .from('equipo')
        .select('id, numero_serie, modelo, costo_total_usd')
        .eq('estado', 'en_stock')
        .order('numero_serie'),
      supabase.from('reinversion_aporte').select('monto_usd').eq('estado', 'en_pool'),
    ])

    setEquipos(equiposData ?? [])
    setPoolDisponible((aportesData ?? []).reduce((acc, a) => acc + Number(a.monto_usd), 0))
    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const equipoSeleccionado = equipos.find((e) => e.id === equipoId) ?? null
  const costo = equipoSeleccionado ? Number(equipoSeleccionado.costo_total_usd) : 0
  const faltante = Math.max(costo - poolDisponible, 0)
  const topeEmpresa = costo * TOPE_EMPRESA_PCT
  const alcanza = costo > 0 && faltante <= topeEmpresa
  const montoEmpresa = Math.min(faltante, topeEmpresa)
  const montoPoolUsado = costo > 0 ? Math.min(poolDisponible, costo) : 0

  async function confirmar() {
    if (!equipoId) return
    setConfirmando(true)
    setError(null)

    const { data, error: err } = await supabase.rpc('fn_comprar_equipo_con_reinversion', {
      p_equipo_id: equipoId,
    })

    if (err) {
      setError(err.message)
      setConfirmando(false)
      return
    }

    const { data: ronda } = await supabase
      .from('ronda_reinversion')
      .select('id, monto_pool_usd, monto_empresa_usd, costo_equipo_usd')
      .eq('id', data)
      .single()

    setRondaCreada(ronda)
    setConfirmando(false)
    router.refresh()
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface p-6 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando pool y equipos disponibles...
      </div>
    )
  }

  if (rondaCreada) {
    return (
      <div className="rounded-lg border border-signal/30 bg-signal/10 p-6">
        <div className="flex items-center gap-2 text-signal">
          <PackageCheck className="h-5 w-5" />
          <h3 className="text-sm font-medium">Ronda cerrada con éxito</h3>
        </div>
        <p className="mt-2 text-sm text-ink">
          Pool aportado por inversionistas: ${Number(rondaCreada.monto_pool_usd).toFixed(2)}
          <br />
          Completado por la empresa: ${Number(rondaCreada.monto_empresa_usd).toFixed(2)}
          <br />
          Costo del equipo: ${Number(rondaCreada.costo_equipo_usd).toFixed(2)}
        </p>
        <button
          onClick={() => {
            setRondaCreada(null)
            setEquipoId('')
            cargarDatos()
          }}
          className="mt-4 rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink"
        >
          Cerrar otra ronda
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border border-line bg-surface p-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Pool de reinversión disponible ahora
        </p>
        <p className="mt-1 font-mono text-2xl text-ink">${poolDisponible.toFixed(2)}</p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          Equipo en stock a comprar con esta ronda
        </label>
        <select
          value={equipoId}
          onChange={(e) => {
            setEquipoId(e.target.value)
            setError(null)
          }}
          className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
        >
          <option value="">Selecciona un equipo...</option>
          {equipos.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.numero_serie} — {eq.modelo ?? 'sin modelo'} (${Number(eq.costo_total_usd).toFixed(2)})
            </option>
          ))}
        </select>
        {equipos.length === 0 && (
          <p className="mt-1 text-[11px] text-muted">
            No hay equipos en stock todavía. Regístralos primero en "Nuevo equipo".
          </p>
        )}
      </div>

      {equipoSeleccionado && (
        <div className="rounded-lg border border-line bg-base p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-muted">Costo del equipo</span>
            <span className="font-mono text-ink">${costo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Del pool de inversionistas</span>
            <span className="font-mono text-ink">${montoPoolUsado.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Completaría la empresa (tope 30%: ${topeEmpresa.toFixed(2)})</span>
            <span className="font-mono text-ink">${montoEmpresa.toFixed(2)}</span>
          </div>

          {alcanza ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-signal">
              <PackageCheck className="h-3.5 w-3.5" /> Alcanza para cerrar esta ronda ahora.
            </p>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-500">
              <TriangleAlert className="h-3.5 w-3.5" />
              Falta ${(faltante - topeEmpresa).toFixed(2)} más de lo que la empresa puede completar. Espera
              a que el pool crezca.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={confirmar}
        disabled={!equipoId || !alcanza || confirmando}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
      >
        {confirmando ? 'Cerrando ronda...' : 'Cerrar ronda y comprar equipo'}
      </button>
    </div>
  )
}
