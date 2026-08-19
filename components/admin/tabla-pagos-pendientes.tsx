'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Check, Loader2 } from 'lucide-react'

type PagoPendiente = {
  id: string
  monto_usd: number
  periodo: string
  comprobante_url: string | null
  comprobante_url_firmada: string | null
  created_at: string
  cliente_final: { nombre: string } | null
  asignacion: { equipo: { numero_serie: string } | null } | null
}

export function TablaPagosPendientes({ pagos }: { pagos: PagoPendiente[] }) {
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  async function confirmarPago(id: string) {
    setConfirmandoId(id)

    const { error } = await supabase
      .from('pago')
      .update({ estado: 'confirmado', fecha_pago: new Date().toISOString() })
      .eq('id', id)

    setConfirmandoId(null)

    if (error) {
      alert(`No se pudo confirmar el pago: ${error.message}`)
      return
    }

    // El trigger fn_procesar_pago_confirmado ya generó los dividendos.
    // Refrescamos el dashboard para reflejar el nuevo estado.
    startTransition(() => router.refresh())
  }

  if (pagos.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
        No hay pagos esperando confirmación.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Equipo</th>
            <th className="px-4 py-3 font-medium">Periodo</th>
            <th className="px-4 py-3 font-medium">Monto</th>
            <th className="px-4 py-3 font-medium">Comprobante</th>
            <th className="px-4 py-3 font-medium text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          {pagos.map((pago) => (
            <tr key={pago.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3 text-ink">{pago.cliente_final?.nombre ?? '—'}</td>
              <td className="px-4 py-3 font-mono text-muted">
                {pago.asignacion?.equipo?.numero_serie ?? '—'}
              </td>
              <td className="px-4 py-3 text-muted">
                {new Date(pago.periodo).toLocaleDateString('es-VE', {
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td className="px-4 py-3 font-mono text-ink">
                ${Number(pago.monto_usd).toFixed(2)}
              </td>
              <td className="px-4 py-3">
                {pago.comprobante_url_firmada ? (
                  <a
                    href={pago.comprobante_url_firmada}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Ver
                  </a>
                ) : (
                  <span className="text-muted">Sin adjunto</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => confirmarPago(pago.id)}
                  disabled={confirmandoId === pago.id}
                  className="inline-flex items-center gap-1.5 rounded-md bg-signal/10 px-3 py-1.5 text-xs font-medium text-signal transition hover:bg-signal/20 disabled:opacity-50"
                >
                  {confirmandoId === pago.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Confirmar pago
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
