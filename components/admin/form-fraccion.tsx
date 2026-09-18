// =============================================================
// COMPONENTE: form-fraccion.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: registra que un inversionista compró participaciones de
// un equipo específico. El precio por participación ($30/$25/$20) y
// el % de propiedad se calculan automáticamente en la base de datos
// según el tramo de la fase de inversión asignada al inversionista
// (ver fn_calcular_tramo_participacion / fn_recalcular_porcentaje_equipo
// en Supabase). Este formulario solo replica ese cálculo en el cliente
// para mostrar una vista previa antes de guardar; la BD es la fuente
// de verdad final. También avisa si el equipo ya no tiene capacidad
// disponible.
// =============================================================

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Inversionista = { id: string; nombre: string; email: string; fase_inversion_id: string | null }
type Equipo = { id: string; numero_serie: string; modelo: string; costo_total_usd: number }
type FraccionExistente = { inversionista_id: string; equipo_id: string; monto_aportado_usd: number }
type FaseInversion = {
  id: string
  nombre: string
  precio_tramo1_usd: number
  precio_tramo2_usd: number
  precio_tramo3_usd: number
  umbral_tramo1_usd: number
  umbral_tramo2_usd: number
}

// Respaldo si un inversionista no tiene fase asignada (debe coincidir con
// el fallback del trigger fn_calcular_tramo_participacion en Supabase)
const TRAMO_RESPALDO = { precio1: 30, precio2: 25, precio3: 20, umbral1: 900, umbral2: 2000 }

export function FormFraccion() {
  const supabase = createClient()
  const router = useRouter()

  const [inversionistas, setInversionistas] = useState<Inversionista[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [fraccionesExistentes, setFraccionesExistentes] = useState<FraccionExistente[]>([])
  const [fases, setFases] = useState<FaseInversion[]>([])
  const [cargando, setCargando] = useState(true)

  const [inversionistaId, setInversionistaId] = useState('')
  const [equipoId, setEquipoId] = useState('')
  // Se guarda como TEXTO, no como número: si fuera número, el campo arranca
  // en 0 y al escribir encima queda "050000". Como texto, el campo puede
  // quedar vacío y el 0 inicial desaparece al escribir.
  const [montoTexto, setMontoTexto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const montoAportado = Number(montoTexto) || 0

  useEffect(() => {
    async function cargar() {
      const [{ data: inv }, { data: eq }, { data: fr }, { data: fs }] = await Promise.all([
        supabase.from('inversionista').select('id, nombre, email, fase_inversion_id').order('nombre'),
        supabase
          .from('equipo')
          .select('id, numero_serie, modelo, costo_total_usd')
          .order('numero_serie'),
        supabase
          .from('fraccion')
          .select('inversionista_id, equipo_id, monto_aportado_usd')
          .eq('estado', 'activa'),
        supabase
          .from('fase_inversion')
          .select(
            'id, nombre, precio_tramo1_usd, precio_tramo2_usd, precio_tramo3_usd, umbral_tramo1_usd, umbral_tramo2_usd'
          ),
      ])
      setInversionistas(inv ?? [])
      setEquipos(eq ?? [])
      setFraccionesExistentes(fr ?? [])
      setFases(fs ?? [])
      setCargando(false)
    }
    cargar()
  }, [supabase])

  const equipoSeleccionado = equipos.find((eq) => eq.id === equipoId)
  const inversionistaSeleccionado = inversionistas.find((inv) => inv.id === inversionistaId)

  const yaAportadoAlEquipo = useMemo(() => {
    return fraccionesExistentes
      .filter((f) => f.equipo_id === equipoId)
      .reduce((acc, f) => acc + Number(f.monto_aportado_usd), 0)
  }, [fraccionesExistentes, equipoId])

  // Total ya invertido por ESTE inversionista (en cualquier equipo) — determina
  // en qué tramo de precio cae su próxima compra, igual que en la BD.
  const totalPrevioInversionista = useMemo(() => {
    return fraccionesExistentes
      .filter((f) => f.inversionista_id === inversionistaId)
      .reduce((acc, f) => acc + Number(f.monto_aportado_usd), 0)
  }, [fraccionesExistentes, inversionistaId])

  const faseDelInversionista = fases.find((f) => f.id === inversionistaSeleccionado?.fase_inversion_id)
  const tramo = faseDelInversionista
    ? {
        precio1: Number(faseDelInversionista.precio_tramo1_usd),
        precio2: Number(faseDelInversionista.precio_tramo2_usd),
        precio3: Number(faseDelInversionista.precio_tramo3_usd),
        umbral1: Number(faseDelInversionista.umbral_tramo1_usd),
        umbral2: Number(faseDelInversionista.umbral_tramo2_usd),
      }
    : TRAMO_RESPALDO

  const totalAcumuladoConEstaCompra = totalPrevioInversionista + montoAportado
  const precioEntradaResultante =
    totalAcumuladoConEstaCompra <= tramo.umbral1
      ? tramo.precio1
      : totalAcumuladoConEstaCompra <= tramo.umbral2
        ? tramo.precio2
        : tramo.precio3
  const participacionesResultantes =
    precioEntradaResultante > 0 ? montoAportado / precioEntradaResultante : 0

  const costoEquipo = equipoSeleccionado?.costo_total_usd ?? 0
  const disponibleEnEquipo = Math.max(costoEquipo - yaAportadoAlEquipo, 0)
  const excedeDisponible = montoAportado > disponibleEnEquipo
  const noAlcanzaMinimoDelTramo = montoAportado > 0 && montoAportado < precioEntradaResultante

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!inversionistaId || !equipoId) {
      setError('Selecciona un inversionista y un equipo.')
      return
    }
    if (noAlcanzaMinimoDelTramo) {
      setError(
        `Para este inversionista, en su tramo actual, el mínimo de compra es $${precioEntradaResultante} (precio de 1 participación).`
      )
      return
    }
    if (excedeDisponible) {
      setError(
        `Ese equipo solo tiene $${disponibleEnEquipo.toFixed(2)} disponibles para invertir.`
      )
      return
    }

    setGuardando(true)
    // porcentaje_propiedad va con un valor temporal: el trigger
    // fn_recalcular_porcentaje_equipo lo recalcula automáticamente justo
    // después del insert, en base a las participaciones normalizadas.
    const { error: errInsert } = await supabase.from('fraccion').insert({
      inversionista_id: inversionistaId,
      equipo_id: equipoId,
      monto_aportado_usd: montoAportado,
      porcentaje_propiedad: 0.0001,
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
          <label className="mb-1 block text-xs font-medium text-muted">Monto aportado (USD)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={montoTexto}
            onChange={(e) => setMontoTexto(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
          {inversionistaId && montoAportado > 0 && (
            <p
              className={`mt-1 text-[11px] ${
                noAlcanzaMinimoDelTramo ? 'text-red-500' : 'text-muted'
              }`}
            >
              {noAlcanzaMinimoDelTramo
                ? `No alcanza: en este tramo, la participación cuesta $${precioEntradaResultante}.`
                : `Tramo actual (${faseDelInversionista?.nombre ?? 'sin fase asignada, usando valores de respaldo'}): $${precioEntradaResultante}/participación → ${participacionesResultantes.toFixed(2)} participaciones. Total acumulado de este inversionista tras esta compra: $${totalAcumuladoConEstaCompra.toFixed(2)}.`}
            </p>
          )}
          {equipoId && (
            <p className={`mt-1 text-[11px] ${excedeDisponible ? 'text-red-500' : 'text-muted'}`}>
              {excedeDisponible
                ? `Excede lo disponible en este equipo ($${disponibleEnEquipo.toFixed(2)}).`
                : `Disponible en este equipo: $${disponibleEnEquipo.toFixed(2)} de $${costoEquipo.toFixed(2)}.`}
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={guardando || excedeDisponible || noAlcanzaMinimoDelTramo}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : 'Registrar participación'}
      </button>
    </form>
  )
}
