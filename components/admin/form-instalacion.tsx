'use client'

// =============================================================
// COMPONENTE: form-instalacion.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: asigna un equipo a un técnico para que lo instale.
// El técnico ve esto en su propio portal (/tecnico) y lo marca
// completado desde allá con foto y serial confirmado.
// =============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Opcion = { id: string; label: string }

export function FormInstalacion() {
  const supabase = createClient()
  const router = useRouter()

  const [equipos, setEquipos] = useState<Opcion[]>([])
  const [clientes, setClientes] = useState<Opcion[]>([])
  const [tecnicos, setTecnicos] = useState<Opcion[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  const [equipoId, setEquipoId] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [tecnicoId, setTecnicoId] = useState('')
  const [tipo, setTipo] = useState('instalacion')
  const [prioridad, setPrioridad] = useState('media')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    async function cargar() {
      const [{ data: eq }, { data: cli }, { data: tecnicoRows }] = await Promise.all([
        supabase.from('equipo').select('id, numero_serie, modelo').order('numero_serie'),
        supabase.from('cliente_final').select('id, nombre').order('nombre'),
        supabase.from('tecnico').select('id, nombre').eq('activo', true).order('nombre'),
      ])

      setEquipos((eq ?? []).map((e) => ({ id: e.id, label: `${e.numero_serie} · ${e.modelo}` })))
      setClientes((cli ?? []).map((c) => ({ id: c.id, label: c.nombre })))
      setTecnicos((tecnicoRows ?? []).map((t) => ({ id: t.id, label: t.nombre })))
      setCargando(false)
    }
    cargar()
  }, [])

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!equipoId || !tecnicoId) {
      setError('Selecciona al menos el equipo y el técnico.')
      return
    }
    setGuardando(true)
    setError(null)

    const { error: err } = await supabase.from('orden_trabajo').insert({
      equipo_id: equipoId,
      cliente_id: clienteId || null,
      tecnico_id: tecnicoId,
      tipo,
      prioridad,
      fecha_programada: fecha || null,
      estado: 'pendiente',
    })

    setGuardando(false)

    if (err) {
      setError('No se pudo asignar: ' + err.message)
      return
    }

    setExito(true)
    setEquipoId('')
    setClienteId('')
    router.refresh()
  }

  if (cargando) return <p className="text-sm text-muted">Cargando...</p>

  if (tecnicos.length === 0) {
    return (
      <p className="text-sm text-muted">
        Todavía no hay ningún técnico dado de alta. Crea un usuario y agrégalo a la tabla{' '}
        <code className="rounded bg-surface px-1">tecnico</code> con su <code className="rounded bg-surface px-1">user_id</code>.
      </p>
    )
  }

  return (
    <form onSubmit={guardar} className="space-y-3 rounded-lg border border-line bg-surface p-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Equipo</label>
        <select
          value={equipoId}
          onChange={(e) => setEquipoId(e.target.value)}
          className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
        >
          <option value="">Selecciona un equipo</option>
          {equipos.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Cliente (opcional)</label>
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
        >
          <option value="">Sin cliente todavía</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Técnico</label>
        <select
          value={tecnicoId}
          onChange={(e) => setTecnicoId(e.target.value)}
          className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
        >
          <option value="">Selecciona un técnico</option>
          {tecnicos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink capitalize"
          >
            {['instalacion', 'mantenimiento', 'desinstalacion', 'reparacion'].map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Prioridad</label>
          <select
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value)}
            className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink capitalize"
          >
            {['baja', 'media', 'alta', 'urgente'].map((p) => (
              <option key={p} value={p} className="capitalize">
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Fecha programada</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full max-w-xs rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {exito && <p className="text-sm text-signal">Orden asignada.</p>}

      <button
        type="submit"
        disabled={guardando}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : 'Asignar orden'}
      </button>
    </form>
  )
}
