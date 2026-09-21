'use client'

// =============================================================
// COMPONENTE: tabla-gastos-empresa.tsx
// PORTAL: Mothership (staff/admin financiero)
// QUÉ HACE: lista los gastos de la empresa y permite ANULAR uno
// (con motivo obligatorio) llamando a fn_anular_gasto_empresa.
// Los gastos nunca se borran: al anular, el monto vuelve a estar
// disponible en su bolsa y el registro queda en el historial.
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

type Gasto = {
  id: string
  bolsa: 'caja_chica' | 'reserva'
  monto_usd: number
  concepto: string
  categoria: string | null
  fecha: string
  estado: 'registrado' | 'anulado'
  motivo_anulacion: string | null
}

const NOMBRE_BOLSA: Record<string, string> = {
  caja_chica: 'Caja chica',
  reserva: 'Reserva',
}

export function TablaGastosEmpresa({ gastos }: { gastos: Gasto[] }) {
  const supabase = createClient()
  const router = useRouter()

  const [anulandoId, setAnulandoId] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmarAnulacion(id: string) {
    if (!motivo.trim()) {
      setError('Escribe el motivo de la anulación.')
      return
    }
    setEnviando(true)
    setError(null)
    const { error: err } = await supabase.rpc('fn_anular_gasto_empresa', {
      p_id: id,
      p_motivo: motivo.trim(),
    })
    setEnviando(false)

    if (err) {
      setError('No se pudo anular: ' + err.message)
      return
    }
    setAnulandoId(null)
    setMotivo('')
    router.refresh()
  }

  if (gastos.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
        Todavía no se ha registrado ningún gasto.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Bolsa</th>
            <th className="px-4 py-3 font-medium">Concepto</th>
            <th className="px-4 py-3 font-medium">Categoría</th>
            <th className="px-4 py-3 text-right font-medium">Monto</th>
            <th className="px-4 py-3 text-right font-medium">Acción</th>
          </tr>
        </thead>
        <tbody>
          {gastos.map((g) => {
            const anulado = g.estado === 'anulado'
            const enAnulacion = anulandoId === g.id
            return (
              <tr key={g.id} className="border-b border-line align-top last:border-0">
                <td className="px-4 py-3 text-muted">
                  {new Date(g.fecha).toLocaleString('es-VE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3 text-ink">{NOMBRE_BOLSA[g.bolsa] ?? g.bolsa}</td>
                <td className="px-4 py-3">
                  <span className={anulado ? 'text-muted line-through' : 'text-ink'}>
                    {g.concepto}
                  </span>
                  {anulado && (
                    <p className="text-[11px] text-red-500">
                      Anulado{g.motivo_anulacion ? `: ${g.motivo_anulacion}` : ''}
                    </p>
                  )}
                  {enAnulacion && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Motivo de la anulación"
                        className="w-56 rounded-lg border border-line bg-base px-3 py-1.5 text-sm text-ink"
                      />
                      <button
                        onClick={() => confirmarAnulacion(g.id)}
                        disabled={enviando}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      >
                        {enviando && <Loader2 className="h-3 w-3 animate-spin" />}
                        Confirmar anulación
                      </button>
                      <button
                        onClick={() => {
                          setAnulandoId(null)
                          setMotivo('')
                          setError(null)
                        }}
                        className="text-xs text-muted hover:text-ink"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                  {enAnulacion && error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
                </td>
                <td className="px-4 py-3 text-muted">{g.categoria ?? '—'}</td>
                <td
                  className={`px-4 py-3 text-right font-mono ${
                    anulado ? 'text-muted line-through' : 'text-ink'
                  }`}
                >
                  ${Number(g.monto_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right">
                  {!anulado && !enAnulacion && (
                    <button
                      onClick={() => {
                        setAnulandoId(g.id)
                        setMotivo('')
                        setError(null)
                      }}
                      className="text-xs text-muted hover:text-red-500"
                    >
                      Anular
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
