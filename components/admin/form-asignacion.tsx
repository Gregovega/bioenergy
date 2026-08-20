// =============================================================
// COMPONENTE: form-asignacion.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: formulario para crear una asignación (vincular un
// equipo en stock a un cliente final), definiendo la mensualidad
// y cómo se reparte: pool de inversionistas, fondo operativo,
// margen de la empresa y bono de expansión del ecosistema.
// =============================================================

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CampoBonoFundadores } from './admin-categoria-socio'

type ClienteFinal = {
  id: string
  nombre: string
  cedula: string | null
}

type Equipo = {
  id: string
  numero_serie: string
  modelo: string
  capacidad_inversor_kw: number
  capacidad_bateria_kwh: number
}

export function FormAsignacion() {
  const supabase = createClient()
  const router = useRouter()

  const [clientes, setClientes] = useState<ClienteFinal[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [clienteId, setClienteId] = useState('')
  const [equipoId, setEquipoId] = useState('')
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().slice(0, 10))
  const [mensualidad, setMensualidad] = useState(0)
  const [montoPool, setMontoPool] = useState(0)
  const [montoFondoOperativo, setMontoFondoOperativo] = useState(0)
  const [margenEmpresa, setMargenEmpresa] = useState(0)
  const [montoBono, setMontoBono] = useState(0)

  useEffect(() => {
    async function cargar() {
      const [{ data: cli }, { data: eq }] = await Promise.all([
        supabase.from('cliente_final').select('id, nombre, cedula').order('nombre'),
        supabase
          .from('equipo')
          .select('id, numero_serie, modelo, capacidad_inversor_kw, capacidad_bateria_kwh')
          .eq('estado', 'en_stock')
          .order('numero_serie'),
      ])
      setClientes(cli ?? [])
      setEquipos(eq ?? [])
      setCargando(false)
    }
    cargar()
  }, [supabase])

  const sumaOtrosMontos = montoPool + montoFondoOperativo + margenEmpresa
  const totalAsignado = sumaOtrosMontos + montoBono
  const excedeMensualidad = totalAsignado > mensualidad

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!clienteId || !equipoId) {
      setError('Selecciona un cliente y un equipo.')
      return
    }
    if (mensualidad <= 0) {
      setError('La mensualidad debe ser mayor a 0.')
      return
    }
    if (excedeMensualidad) {
      setError('La suma de los montos no puede superar la mensualidad.')
      return
    }

    setGuardando(true)
    const { error: errInsert } = await supabase.from('asignacion').insert({
      cliente_id: clienteId,
      equipo_id: equipoId,
      fecha_inicio: fechaInicio,
      mensualidad_usd: mensualidad,
      monto_pool_inversionistas_usd: montoPool,
      monto_fondo_operativo_usd: montoFondoOperativo,
      margen_ganancia_neta_empresa_usd: margenEmpresa,
      monto_bono_fundadores_usd: montoBono,
      estado: 'activa',
    })

    if (errInsert) {
      setError('No se pudo crear la asignación: ' + errInsert.message)
      setGuardando(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  if (cargando) {
    return <div className="text-sm text-muted">Cargando clientes y equipos disponibles...</div>
  }

  return (
    <form onSubmit={guardar} className="space-y-6 rounded-lg border border-line bg-surface p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Cliente</label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          >
            <option value="">Selecciona un cliente...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {c.cedula ? ` — ${c.cedula}` : ''}
              </option>
            ))}
          </select>
          {clientes.length === 0 && (
            <p className="mt-1 text-[11px] text-muted">No hay clientes registrados todavía.</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Equipo (solo equipos en stock)
          </label>
          <select
            value={equipoId}
            onChange={(e) => setEquipoId(e.target.value)}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          >
            <option value="">Selecciona un equipo...</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.numero_serie} — {eq.modelo} ({eq.capacidad_inversor_kw}kW/
                {eq.capacidad_bateria_kwh}kWh)
              </option>
            ))}
          </select>
          {equipos.length === 0 && (
            <p className="mt-1 text-[11px] text-muted">
              No hay equipos en stock disponibles para asignar.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Fecha de inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Mensualidad total (USD)
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={mensualidad}
            onChange={(e) => setMensualidad(Number(e.target.value))}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
      </div>

      <div className="border-t border-line pt-4">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Reparto de la mensualidad
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Pool inversionistas (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={montoPool}
              onChange={(e) => setMontoPool(Number(e.target.value))}
              className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Fondo operativo (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={montoFondoOperativo}
              onChange={(e) => setMontoFondoOperativo(Number(e.target.value))}
              className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Margen empresa (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={margenEmpresa}
              onChange={(e) => setMargenEmpresa(Number(e.target.value))}
              className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
            />
          </div>
        </div>

        <div className="mt-4">
          <CampoBonoFundadores
            montoBono={montoBono}
            onChange={setMontoBono}
            mensualidad={mensualidad}
            sumaOtrosMontos={sumaOtrosMontos}
          />
        </div>

        <p className={`mt-3 text-xs ${excedeMensualidad ? 'text-red-500' : 'text-muted'}`}>
          Total asignado: ${totalAsignado.toFixed(2)} de ${mensualidad.toFixed(2)}
          {excedeMensualidad && ' — excede la mensualidad'}
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={guardando || excedeMensualidad}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : 'Crear asignación'}
      </button>
    </form>
  )
}
