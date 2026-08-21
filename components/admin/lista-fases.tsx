// =============================================================
// COMPONENTE: lista-fases.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: lista todas las fases de inversión, muestra cuánto
// se ha captado en cada una (sumando fracciones de inversionistas
// vinculados a esa fase) contra su tope, y permite cerrar/reabrir
// cada fase manualmente. Nunca cierra ni abre nada solo.
// =============================================================

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PlusCircle } from 'lucide-react'

type Fase = {
  id: string
  orden: number
  nombre: string
  monto_tope_usd: number
  porcentaje_bono: number
  vigencia_meses: number | null
  estado: 'abierta' | 'cerrada'
}

export function ListaFases() {
  const supabase = createClient()
  const [fases, setFases] = useState<Fase[]>([])
  const [captadoPorFase, setCaptadoPorFase] = useState<Record<string, number>>({})
  const [cargando, setCargando] = useState(true)
  const [cambiandoId, setCambiandoId] = useState<string | null>(null)

  async function cargar() {
    const { data: fasesData } = await supabase
      .from('fase_inversion')
      .select('id, orden, nombre, monto_tope_usd, porcentaje_bono, vigencia_meses, estado')
      .order('orden', { ascending: true })

    const listaFases = fasesData ?? []
    setFases(listaFases)

    // Para cada fase, suma cuánto han aportado (via fraccion) los
    // inversionistas vinculados a esa fase.
    const totales: Record<string, number> = {}
    await Promise.all(
      listaFases.map(async (fase) => {
        const { data: invsDeFase } = await supabase
          .from('inversionista')
          .select('id')
          .eq('fase_inversion_id', fase.id)

        const ids = (invsDeFase ?? []).map((i) => i.id)
        if (ids.length === 0) {
          totales[fase.id] = 0
          return
        }

        const { data: fracciones } = await supabase
          .from('fraccion')
          .select('monto_aportado_usd')
          .in('inversionista_id', ids)

        totales[fase.id] = (fracciones ?? []).reduce(
          (acc, f) => acc + Number(f.monto_aportado_usd),
          0
        )
      })
    )
    setCaptadoPorFase(totales)
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function cambiarEstado(fase: Fase) {
    setCambiandoId(fase.id)
    const nuevoEstado = fase.estado === 'abierta' ? 'cerrada' : 'abierta'
    const { error } = await supabase
      .from('fase_inversion')
      .update({
        estado: nuevoEstado,
        fecha_cierre: nuevoEstado === 'cerrada' ? new Date().toISOString() : null,
      })
      .eq('id', fase.id)

    if (!error) {
      setFases((prev) =>
        prev.map((f) => (f.id === fase.id ? { ...f, estado: nuevoEstado } : f))
      )
    } else {
      alert('No se pudo cambiar el estado: ' + error.message)
    }
    setCambiandoId(null)
  }

  if (cargando) {
    return <div className="text-sm text-muted">Cargando fases...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/admin/fases/nueva"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base"
        >
          <PlusCircle className="h-4 w-4" />
          Agregar fase
        </Link>
      </div>

      <div className="space-y-3">
        {fases.map((fase) => {
          const captado = captadoPorFase[fase.id] ?? 0
          const progreso = fase.monto_tope_usd > 0 ? Math.min(captado / fase.monto_tope_usd, 1) : 0

          return (
            <div key={fase.id} className="rounded-lg border border-line bg-surface p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted">Fase {fase.orden}</span>
                  <h3 className="font-display text-lg text-ink">{fase.nombre}</h3>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    fase.estado === 'abierta'
                      ? 'bg-signal/10 text-signal'
                      : 'bg-muted/10 text-muted'
                  }`}
                >
                  {fase.estado}
                </span>
              </div>

              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>
                    ${captado.toFixed(2)} captados de ${fase.monto_tope_usd.toFixed(2)}
                  </span>
                  <span>{(progreso * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${progreso * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  Bono: {(fase.porcentaje_bono * 100).toFixed(2)}%
                  {fase.vigencia_meses ? ` · Vigencia: ${fase.vigencia_meses} meses` : ' · Sin límite de tiempo'}
                </span>
                <button
                  onClick={() => cambiarEstado(fase)}
                  disabled={cambiandoId === fase.id}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-base disabled:opacity-50"
                >
                  {fase.estado === 'abierta' ? 'Cerrar fase' : 'Reabrir fase'}
                </button>
              </div>
            </div>
          )
        })}

        {fases.length === 0 && (
          <div className="rounded-lg border border-line bg-surface p-8 text-center text-muted">
            No hay fases creadas todavía.
          </div>
        )}
      </div>
    </div>
  )
}
