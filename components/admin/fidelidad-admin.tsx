'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Check, Loader2 } from 'lucide-react'

type Recompensa = {
  id: string
  nombre: string
  descripcion: string | null
  costo_puntos: number
  activo: boolean
}

type Canje = {
  id: string
  puntos_usados: number
  estado: string
  created_at: string
  cliente_final: { nombre: string; email: string } | null
  fidelidad_recompensa: { nombre: string } | null
}

export function FidelidadAdmin() {
  const [recompensas, setRecompensas] = useState<Recompensa[]>([])
  const [canjes, setCanjes] = useState<Canje[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesandoId, setProcesandoId] = useState<string | null>(null)
  const [nuevo, setNuevo] = useState({ nombre: '', descripcion: '', costo_puntos: '' })
  const [creando, setCreando] = useState(false)
  const supabase = createClient()

  async function cargar() {
    const [{ data: rec }, { data: cj }] = await Promise.all([
      supabase.from('fidelidad_recompensa').select('*').order('costo_puntos', { ascending: true }),
      supabase
        .from('fidelidad_canje')
        .select('id, puntos_usados, estado, created_at, cliente_final(nombre, email), fidelidad_recompensa(nombre)')
        .order('created_at', { ascending: false })
        .limit(30),
    ])
    setRecompensas((rec ?? []) as any)
    setCanjes((cj ?? []) as any)
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function crearRecompensa(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevo.nombre.trim() || !nuevo.costo_puntos) return
    setCreando(true)
    const { error } = await supabase.from('fidelidad_recompensa').insert({
      nombre: nuevo.nombre.trim(),
      descripcion: nuevo.descripcion.trim() || null,
      costo_puntos: Number(nuevo.costo_puntos),
    })
    setCreando(false)
    if (error) {
      alert('No se pudo crear: ' + error.message)
      return
    }
    setNuevo({ nombre: '', descripcion: '', costo_puntos: '' })
    cargar()
  }

  async function toggleActivo(r: Recompensa) {
    await supabase.from('fidelidad_recompensa').update({ activo: !r.activo }).eq('id', r.id)
    cargar()
  }

  async function marcarEntregado(canjeId: string) {
    setProcesandoId(canjeId)
    const { error } = await supabase.rpc('fn_marcar_canje_entregado', { p_canje_id: canjeId })
    setProcesandoId(null)
    if (error) {
      alert('No se pudo marcar como entregado: ' + error.message)
      return
    }
    cargar()
  }

  if (cargando) return <p className="text-sm text-muted">Cargando...</p>

  const pendientes = canjes.filter((c) => c.estado === 'solicitado')
  const resueltos = canjes.filter((c) => c.estado !== 'solicitado')

  return (
    <div className="space-y-8">
      {/* Catálogo */}
      <section className="rounded-lg border border-line bg-surface">
        <div className="border-b border-line px-6 py-4">
          <h3 className="font-display text-sm text-ink">Catálogo de recompensas</h3>
          <p className="mt-1 text-xs text-muted">
            Lo que ve el cliente en su portal para canjear con sus puntos.
          </p>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-6 py-3 font-medium">Nombre</th>
              <th className="px-6 py-3 font-medium">Costo</th>
              <th className="px-6 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {recompensas.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-6 py-3">
                  <p className="text-ink">{r.nombre}</p>
                  {r.descripcion && <p className="text-xs text-muted">{r.descripcion}</p>}
                </td>
                <td className="px-6 py-3 font-mono text-ink">{r.costo_puntos} pts</td>
                <td className="px-6 py-3">
                  <button
                    onClick={() => toggleActivo(r)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      r.activo ? 'bg-signal/10 text-signal' : 'bg-muted/10 text-muted'
                    }`}
                  >
                    {r.activo ? 'Activa' : 'Inactiva'}
                  </button>
                </td>
              </tr>
            ))}
            {recompensas.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-muted">
                  Todavía no hay recompensas en el catálogo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <form onSubmit={crearRecompensa} className="grid grid-cols-1 gap-3 border-t border-line p-6 sm:grid-cols-4">
          <input
            type="text"
            placeholder="Nombre"
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            className="rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink sm:col-span-2"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={nuevo.descripcion}
            onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
            className="rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              placeholder="Puntos"
              value={nuevo.costo_puntos}
              onChange={(e) => setNuevo({ ...nuevo, costo_puntos: e.target.value })}
              className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
            />
            <button
              type="submit"
              disabled={creando}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-base disabled:opacity-50"
            >
              {creando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Agregar
            </button>
          </div>
        </form>
      </section>

      {/* Canjes pendientes */}
      <section className="rounded-lg border border-line bg-surface">
        <div className="border-b border-line px-6 py-4">
          <h3 className="font-display text-sm text-ink">Canjes por entregar ({pendientes.length})</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-6 py-3 font-medium">Cliente</th>
              <th className="px-6 py-3 font-medium">Recompensa</th>
              <th className="px-6 py-3 font-medium">Fecha</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {pendientes.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-6 py-3">
                  <p className="text-ink">{c.cliente_final?.nombre ?? '—'}</p>
                  <p className="text-xs text-muted">{c.cliente_final?.email}</p>
                </td>
                <td className="px-6 py-3 text-ink">
                  {c.fidelidad_recompensa?.nombre ?? '—'}{' '}
                  <span className="font-mono text-xs text-muted">({c.puntos_usados} pts)</span>
                </td>
                <td className="px-6 py-3 text-muted">
                  {new Date(c.created_at).toLocaleDateString('es-VE')}
                </td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => marcarEntregado(c.id)}
                    disabled={procesandoId === c.id}
                    className="flex items-center gap-1 rounded-md bg-signal/10 px-2.5 py-1 text-xs font-medium text-signal disabled:opacity-50"
                  >
                    {procesandoId === c.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Marcar entregado
                  </button>
                </td>
              </tr>
            ))}
            {pendientes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted">
                  No hay canjes pendientes por entregar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {resueltos.length > 0 && (
        <section className="rounded-lg border border-line bg-surface">
          <div className="border-b border-line px-6 py-4">
            <h3 className="font-display text-sm text-ink">Historial de canjes</h3>
          </div>
          <table className="w-full text-left text-sm">
            <tbody>
              {resueltos.map((c) => (
                <tr key={c.id} className="border-b border-line text-xs last:border-0">
                  <td className="px-6 py-3 text-muted">{c.cliente_final?.nombre ?? '—'}</td>
                  <td className="px-6 py-3 text-muted">{c.fidelidad_recompensa?.nombre ?? '—'}</td>
                  <td className="px-6 py-3 text-muted">
                    {new Date(c.created_at).toLocaleDateString('es-VE')}
                  </td>
                  <td className="px-6 py-3 text-right text-muted capitalize">{c.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
