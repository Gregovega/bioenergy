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
import { PlusCircle, Pencil, Check, X } from 'lucide-react'

type Fase = {
  id: string
  orden: number
  nombre: string
  monto_tope_usd: number
  porcentaje_bono: number
  vigencia_meses: number | null
  estado: 'abierta' | 'cerrada'
  precio_tramo1_usd: number
  precio_tramo2_usd: number
  precio_tramo3_usd: number
  umbral_tramo1_usd: number
  umbral_tramo2_usd: number
}

type BorradorTramos = {
  precio_tramo1_usd: string
  precio_tramo2_usd: string
  precio_tramo3_usd: string
  umbral_tramo1_usd: string
  umbral_tramo2_usd: string
}

export function ListaFases() {
  const supabase = createClient()
  const [fases, setFases] = useState<Fase[]>([])
  const [captadoPorFase, setCaptadoPorFase] = useState<Record<string, number>>({})
  const [cargando, setCargando] = useState(true)
  const [cambiandoId, setCambiandoId] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [borrador, setBorrador] = useState<BorradorTramos | null>(null)
  const [guardandoTramos, setGuardandoTramos] = useState(false)

  async function cargar() {
    const { data: fasesData } = await supabase
      .from('fase_inversion')
      .select(
        'id, orden, nombre, monto_tope_usd, porcentaje_bono, vigencia_meses, estado, precio_tramo1_usd, precio_tramo2_usd, precio_tramo3_usd, umbral_tramo1_usd, umbral_tramo2_usd'
      )
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

  function abrirEdicion(fase: Fase) {
    setEditandoId(fase.id)
    setBorrador({
      precio_tramo1_usd: String(fase.precio_tramo1_usd),
      precio_tramo2_usd: String(fase.precio_tramo2_usd),
      precio_tramo3_usd: String(fase.precio_tramo3_usd),
      umbral_tramo1_usd: String(fase.umbral_tramo1_usd),
      umbral_tramo2_usd: String(fase.umbral_tramo2_usd),
    })
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setBorrador(null)
  }

  async function guardarTramos(faseId: string) {
    if (!borrador) return

    const valores = {
      precio_tramo1_usd: Number(borrador.precio_tramo1_usd),
      precio_tramo2_usd: Number(borrador.precio_tramo2_usd),
      precio_tramo3_usd: Number(borrador.precio_tramo3_usd),
      umbral_tramo1_usd: Number(borrador.umbral_tramo1_usd),
      umbral_tramo2_usd: Number(borrador.umbral_tramo2_usd),
    }

    if (Object.values(valores).some((v) => !Number.isFinite(v) || v <= 0)) {
      alert('Todos los precios y umbrales deben ser números mayores que 0.')
      return
    }
    if (valores.umbral_tramo1_usd >= valores.umbral_tramo2_usd) {
      alert('El umbral del tramo 1 debe ser menor que el del tramo 2.')
      return
    }

    setGuardandoTramos(true)
    const { error } = await supabase.from('fase_inversion').update(valores).eq('id', faseId)

    if (error) {
      alert('No se pudieron guardar los tramos: ' + error.message)
    } else {
      setFases((prev) => prev.map((f) => (f.id === faseId ? { ...f, ...valores } : f)))
      cancelarEdicion()
    }
    setGuardandoTramos(false)
  }

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

              {/* Tramos de precio de participación — editables a mano */}
              <div className="mb-3 rounded-lg border border-line bg-base p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-ink">
                    Precios de participación
                  </span>
                  {editandoId === fase.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => guardarTramos(fase.id)}
                        disabled={guardandoTramos}
                        className="flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-[11px] font-medium text-base disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" />
                        {guardandoTramos ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        disabled={guardandoTramos}
                        className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] text-muted disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => abrirEdicion(fase)}
                      className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] text-ink hover:bg-surface"
                    >
                      <Pencil className="h-3 w-3" />
                      Editar precios
                    </button>
                  )}
                </div>

                {editandoId === fase.id && borrador ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {([
                      ['precio_tramo1_usd', 'Precio 1'],
                      ['precio_tramo2_usd', 'Precio 2'],
                      ['precio_tramo3_usd', 'Precio 3'],
                      ['umbral_tramo1_usd', 'Hasta (1)'],
                      ['umbral_tramo2_usd', 'Hasta (2)'],
                    ] as [keyof BorradorTramos, string][]).map(([campo, etiqueta]) => (
                      <div key={campo}>
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted">
                          {etiqueta}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={borrador[campo]}
                          onChange={(e) =>
                            setBorrador({ ...borrador, [campo]: e.target.value })
                          }
                          className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted">
                    Hasta ${Number(fase.umbral_tramo1_usd).toFixed(0)} acumulados: $
                    {Number(fase.precio_tramo1_usd).toFixed(2)}/participación · hasta $
                    {Number(fase.umbral_tramo2_usd).toFixed(0)}: $
                    {Number(fase.precio_tramo2_usd).toFixed(2)} · más allá: $
                    {Number(fase.precio_tramo3_usd).toFixed(2)}. Mínimo de compra = precio de 1
                    participación del tramo que le toque.
                  </p>
                )}
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
