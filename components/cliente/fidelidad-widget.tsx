'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Award, Flame, Gift, Loader2 } from 'lucide-react'

type Recompensa = {
  id: string
  nombre: string
  descripcion: string | null
  costo_puntos: number
}

type Movimiento = {
  id: string
  tipo: string
  puntos: number
  descripcion: string
  created_at: string
}

const ETIQUETA_TIPO: Record<string, string> = {
  ganado_puntualidad: 'Pago puntual',
  ganado_racha: 'Bono de racha',
  ganado_antiguedad: 'Antigüedad',
  canjeado: 'Canje',
  ajuste_manual: 'Ajuste',
}

export function FidelidadWidget({
  puntosDisponibles,
  racha,
  catalogo,
  movimientos,
}: {
  puntosDisponibles: number
  racha: number
  catalogo: Recompensa[]
  movimientos: Movimiento[]
}) {
  const [canjeando, setCanjeando] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function canjear(r: Recompensa) {
    setCanjeando(r.id)
    setMensaje(null)
    const { error } = await supabase.rpc('fn_canjear_recompensa', { p_recompensa_id: r.id })
    setCanjeando(null)
    if (error) {
      setMensaje(error.message)
      return
    }
    setMensaje(`Canjeaste "${r.nombre}". El equipo se pondrá en contacto contigo.`)
    router.refresh()
  }

  return (
    <section className="space-y-4 rounded-lg border border-line bg-surface p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-accent" />
          <h2 className="font-display text-lg text-ink">Programa de fidelidad</h2>
        </div>
        {racha > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Flame className="h-3.5 w-3.5" />
            {racha} {racha === 1 ? 'pago puntual seguido' : 'pagos puntuales seguidos'}
          </span>
        )}
      </div>

      <div className="rounded-lg border border-line bg-base p-5 text-center">
        <p className="font-mono text-3xl text-ink">{puntosDisponibles}</p>
        <p className="mt-1 text-xs text-muted">puntos disponibles</p>
      </div>

      {catalogo.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted">
            Canjear por
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {catalogo.map((r) => {
              const alcanza = puntosDisponibles >= r.costo_puntos
              return (
                <div key={r.id} className="rounded-md border border-line p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-ink">{r.nombre}</p>
                      {r.descripcion && <p className="mt-0.5 text-xs text-muted">{r.descripcion}</p>}
                    </div>
                    <span className="whitespace-nowrap font-mono text-xs text-muted">
                      {r.costo_puntos} pts
                    </span>
                  </div>
                  <button
                    onClick={() => canjear(r)}
                    disabled={!alcanza || canjeando === r.id}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-base transition hover:opacity-90 disabled:opacity-40"
                  >
                    {canjeando === r.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Gift className="h-3.5 w-3.5" />
                    )}
                    {alcanza ? 'Canjear' : 'Puntos insuficientes'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-line p-3 text-center text-xs text-muted">
          Sigue acumulando tus puntos — próximamente anunciamos los premios.
        </p>
      )}

      {mensaje && <p className="text-sm text-muted">{mensaje}</p>}

      {movimientos.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted">
            Movimientos recientes
          </p>
          <div className="space-y-1.5">
            {movimientos.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-xs">
                <span className="text-muted">
                  {ETIQUETA_TIPO[m.tipo] ?? m.tipo} · {m.descripcion}
                </span>
                <span className={`font-mono ${m.puntos >= 0 ? 'text-ink' : 'text-muted'}`}>
                  {m.puntos >= 0 ? '+' : ''}
                  {m.puntos}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
