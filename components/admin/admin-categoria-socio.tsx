// =============================================================
// COMPONENTE: admin-categoria-socio.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE:
//  1) Lista los inversionistas y permite cambiar su
//     categoria_socio ('fundador' | 'fase_2' | 'regular').
//  2) Incluye el campo de bono (CampoBonoFundadores) para
//     insertar en el formulario de creación/edición de una
//     asignación, donde se define monto_bono_fundadores_usd.
// =============================================================

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Inversionista = {
  id: string
  nombre: string
  email: string
  categoria_socio: 'fundador' | 'fase_2' | 'regular'
}

const OPCIONES_CATEGORIA: Array<{ value: Inversionista['categoria_socio']; label: string }> = [
  { value: 'fundador', label: 'Fundador' },
  { value: 'fase_2', label: 'Fase 2' },
  { value: 'regular', label: 'Regular' },
]

export function ListaInversionistasCategoria() {
  const [inversionistas, setInversionistas] = useState<Inversionista[]>([])
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('inversionista')
        .select('id, nombre, email, categoria_socio')
        .order('nombre', { ascending: true })
      setInversionistas(data ?? [])
    }
    cargar()
  }, [supabase])

  async function actualizarCategoria(id: string, nuevaCategoria: Inversionista['categoria_socio']) {
    setGuardandoId(id)
    const { error } = await supabase
      .from('inversionista')
      .update({ categoria_socio: nuevaCategoria })
      .eq('id', id)

    if (!error) {
      setInversionistas((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, categoria_socio: nuevaCategoria } : inv))
      )
    } else {
      alert('No se pudo actualizar la categoría: ' + error.message)
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
        <h3 className="font-display text-sm text-ink">Categoría de socio por inversionista</h3>
        <p className="mt-1 text-xs text-muted">
          Los inversionistas marcados como &quot;Fundador&quot; reciben el Bono de Expansión del
          Ecosistema cuando una asignación lo tenga configurado.
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
            <th className="px-6 py-3 font-medium">Categoría</th>
          </tr>
        </thead>
        <tbody>
          {inversionistasFiltrados.map((inv) => (
            <tr key={inv.id} className="border-b border-line last:border-0">
              <td className="px-6 py-3 text-ink">{inv.nombre}</td>
              <td className="px-6 py-3 text-muted">{inv.email}</td>
              <td className="px-6 py-3">
                <select
                  value={inv.categoria_socio}
                  disabled={guardandoId === inv.id}
                  onChange={(e) =>
                    actualizarCategoria(inv.id, e.target.value as Inversionista['categoria_socio'])
                  }
                  className="rounded-lg border border-line bg-base px-3 py-1.5 text-sm text-ink disabled:opacity-50"
                >
                  {OPCIONES_CATEGORIA.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
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
// Insértalo donde ya tengas los campos mensualidad_usd,
// monto_pool_inversionistas_usd, monto_fondo_operativo_usd, etc.
// -------------------------------------------------------------
type CampoBonoProps = {
  montoBono: number
  onChange: (valor: number) => void
  mensualidad: number
  sumaOtrosMontos: number // pool + fondo operativo + margen empresa
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
          : `Disponible sin superar la mensualidad: $${disponible.toFixed(2)}`}
      </p>
    </div>
  )
}
