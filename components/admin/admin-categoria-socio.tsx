// =============================================================
// COMPONENTE: admin-categoria-socio.tsx (v2 — fases dinámicas)
// PORTAL: Mothership (staff/admin)
// QUÉ HACE:
//  1) Lista los inversionistas y permite asignarles una fase
//     (fase_inversion_id) en vez de la categoría fija anterior.
//  2) Incluye el campo de bono (CampoBonoFundadores) para
//     insertar en el formulario de asignación.
// =============================================================

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Inversionista = {
  id: string
  nombre: string
  email: string
  fase_inversion_id: string | null
}

type Fase = {
  id: string
  orden: number
  nombre: string
}

export function ListaInversionistasCategoria() {
  const [inversionistas, setInversionistas] = useState<Inversionista[]>([])
  const [fases, setFases] = useState<Fase[]>([])
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function cargar() {
      const [{ data: invs }, { data: fasesData }] = await Promise.all([
        supabase
          .from('inversionista')
          .select('id, nombre, email, fase_inversion_id')
          .order('nombre', { ascending: true }),
        supabase
          .from('fase_inversion')
          .select('id, orden, nombre')
          .order('orden', { ascending: true }),
      ])
      setInversionistas(invs ?? [])
      setFases(fasesData ?? [])
    }
    cargar()
  }, [supabase])

  async function actualizarFase(id: string, nuevaFaseId: string) {
    setGuardandoId(id)
    const { error } = await supabase
      .from('inversionista')
      .update({ fase_inversion_id: nuevaFaseId || null })
      .eq('id', id)

    if (!error) {
      setInversionistas((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, fase_inversion_id: nuevaFaseId || null } : inv))
      )
    } else {
      alert('No se pudo actualizar la fase: ' + error.message)
    }
    setGuardandoId(null)
  }

  const inversionistasFiltrados = inversionistas.filter((inv) => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return true
    return inv.nombre.toLowerCase().includes(q) || inv.email.toLowerCase().includes(q)
  })

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="border-b border-line px-6 py-4">
        <h3 className="font-display text-sm text-ink">Fase de inversión por inversionista</h3>
        <p className="mt-1 text-xs text-muted">
          Los inversionistas vinculados a una fase reciben el Bono de Expansión del Ecosistema
          según el % configurado en esa fase, cuando una asignación lo tenga configurado.
        </p>
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mt-3 w-full max-w-xs rounded-lg border border-line bg-base px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <th className="px-6 py-3 font-medium">Nombre</th>
            <th className="px-6 py-3 font-medium">Email</th>
            <th className="px-6 py-3 font-medium">Fase</th>
          </tr>
        </thead>
        <tbody>
          {inversionistasFiltrados.map((inv) => (
            <tr key={inv.id} className="border-b border-line last:border-0">
              <td className="px-6 py-3 text-ink">{inv.nombre}</td>
              <td className="px-6 py-3 text-muted">{inv.email}</td>
              <td className="px-6 py-3">
                <select
                  value={inv.fase_inversion_id ?? ''}
                  disabled={guardandoId === inv.id}
                  onChange={(e) => actualizarFase(inv.id, e.target.value)}
                  className="rounded-lg border border-line bg-base px-3 py-1.5 text-sm text-ink disabled:opacity-50"
                >
                  <option value="">Sin fase (regular)</option>
                  {fases.map((fase) => (
                    <option key={fase.id} value={fase.id}>
                      Fase {fase.orden} — {fase.nombre}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {inversionistasFiltrados.length === 0 && (
            <tr>
              <td colSpan={3} className="px-6 py-8 text-center text-muted">
                {inversionistas.length === 0
                  ? 'No hay inversionistas registrados todavía.'
                  : 'Ningún inversionista coincide con la búsqueda.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// -------------------------------------------------------------
// Sub-componente: campo de bono dentro del formulario de asignación
// (sin cambios respecto a la versión anterior — sigue siendo un
// monto en dólares que el trigger reparte automáticamente entre
// todas las fases vigentes según su % configurado)
// -------------------------------------------------------------
type CampoBonoProps = {
  montoBono: number
  onChange: (valor: number) => void
  mensualidad: number
  sumaOtrosMontos: number
}

export function CampoBonoFundadores({
  montoBono,
  onChange,
  mensualidad,
  sumaOtrosMontos,
}: CampoBonoProps) {
  const disponible = mensualidad - sumaOtrosMontos
  const excedeLimite = montoBono > disponible

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">
        Bono de Expansión del Ecosistema (USD/mes)
      </label>
      <input
        type="number"
        step="0.01"
        min={0}
        value={montoBono}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <p className={`mt-1 text-[11px] ${excedeLimite ? 'text-red-500' : 'text-muted'}`}>
        {excedeLimite
          ? `Excede el monto disponible ($${disponible.toFixed(2)}). La base de datos rechazará este valor.`
          : `Este monto se reparte automáticamente entre todas las fases vigentes, según el % de cada una.`}
      </p>
    </div>
  )
}
