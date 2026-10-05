'use client'

// =============================================================
// COMPONENTE: marketplace-aprobaciones.tsx
// PORTAL: Mothership (staff/admin)
// Para cada venta pendiente, genera una URL firmada del comprobante
// (bucket privado "comprobantes") y permite aprobar o rechazar.
// =============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X, FileText, Loader2 } from 'lucide-react'

type Pendiente = {
  id: string
  precio_listado_usd: number
  equipo_numero_serie: string
  equipo_modelo: string
  cantidad_participaciones: number
  comprobante_pago_url: string | null
  fecha_solicitud_compra: string
  vendedor: { nombre: string } | null
  comprador: { nombre: string } | null
}

export function MarketplaceAprobaciones({ pendientes }: { pendientes: Pendiente[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [procesando, setProcesando] = useState<string | null>(null)
  const [rechazando, setRechazando] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    async function cargarUrls() {
      const entradas = await Promise.all(
        pendientes
          .filter((p) => p.comprobante_pago_url)
          .map(async (p) => {
            const { data } = await supabase.storage
              .from('comprobantes')
              .createSignedUrl(p.comprobante_pago_url!, 300)
            return [p.id, data?.signedUrl ?? ''] as const
          })
      )
      setUrls(Object.fromEntries(entradas))
    }
    if (pendientes.length > 0) cargarUrls()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendientes.length])

  async function aprobar(id: string) {
    setProcesando(id)
    setMensaje(null)
    const { error } = await supabase.rpc('fn_aprobar_venta_marketplace', { p_listado_id: id })
    setProcesando(null)
    if (error) {
      setMensaje(error.message)
      return
    }
    router.refresh()
  }

  async function rechazar(id: string) {
    if (!motivo.trim()) {
      setMensaje('Escribe el motivo del rechazo.')
      return
    }
    setProcesando(id)
    setMensaje(null)
    const { error } = await supabase.rpc('fn_rechazar_venta_marketplace', {
      p_listado_id: id,
      p_motivo: motivo,
    })
    setProcesando(null)
    if (error) {
      setMensaje(error.message)
      return
    }
    setRechazando(null)
    setMotivo('')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {pendientes.map((p) => (
        <div key={p.id} className="rounded-lg border border-line bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-sm text-ink">
                {p.equipo_numero_serie} · {p.equipo_modelo}
              </p>
              <p className="mt-1 text-xs text-muted">
                {p.vendedor?.nombre ?? 'Vendedor'} vende a {p.comprador?.nombre ?? 'comprador'} ·{' '}
                {Number(p.cantidad_participaciones).toFixed(2)} participaciones
              </p>
              <p className="mt-1 font-mono text-lg text-ink">
                ${Number(p.precio_listado_usd).toFixed(2)}
              </p>
              <p className="text-[11px] text-muted">
                Solicitado el {new Date(p.fecha_solicitud_compra).toLocaleString('es-VE')}
              </p>
            </div>
            {urls[p.id] && (
              <a
                href={urls[p.id]}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-accent"
              >
                <FileText className="h-3.5 w-3.5" /> Ver comprobante
              </a>
            )}
          </div>

          {rechazando === p.id ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                autoFocus
                placeholder="Motivo del rechazo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="flex-1 rounded-md border border-line bg-base px-3 py-1.5 text-xs text-ink outline-none focus:border-accent"
              />
              <button
                onClick={() => rechazar(p.id)}
                disabled={procesando === p.id}
                className="rounded-md bg-signal px-3 py-1.5 text-xs font-medium text-base disabled:opacity-50"
              >
                Confirmar rechazo
              </button>
              <button
                onClick={() => {
                  setRechazando(null)
                  setMotivo('')
                }}
                className="rounded-md border border-line px-3 py-1.5 text-xs text-muted"
              >
                Volver
              </button>
            </div>
          ) : (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => aprobar(p.id)}
                disabled={procesando === p.id}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-base disabled:opacity-50"
              >
                {procesando === p.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Aprobar
              </button>
              <button
                onClick={() => setRechazando(p.id)}
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
              >
                <X className="h-3.5 w-3.5" /> Rechazar
              </button>
            </div>
          )}
        </div>
      ))}
      {pendientes.length === 0 && (
        <p className="rounded-lg border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
          No hay ventas pendientes de aprobar.
        </p>
      )}
      {mensaje && <p className="text-sm text-muted">{mensaje}</p>}
    </div>
  )
}
