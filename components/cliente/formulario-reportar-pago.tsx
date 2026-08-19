'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Loader2 } from 'lucide-react'

export function FormularioReportarPago({
  clienteId,
  asignacionId,
  userId,
  mensualidadSugerida,
}: {
  clienteId: string
  asignacionId: string
  userId: string
  mensualidadSugerida: number
}) {
  const [monto, setMonto] = useState(mensualidadSugerida.toFixed(2))
  const [archivo, setArchivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!archivo) {
      setMensaje('Adjunta el comprobante de pago.')
      return
    }

    setEnviando(true)
    setMensaje(null)

    const rutaArchivo = `${userId}/${Date.now()}-${archivo.name}`

    const { error: errorSubida } = await supabase.storage
      .from('comprobantes')
      .upload(rutaArchivo, archivo)

    if (errorSubida) {
      setEnviando(false)
      setMensaje(`No se pudo subir el comprobante: ${errorSubida.message}`)
      return
    }

    const { error: errorPago } = await supabase.from('pago').insert({
      cliente_id: clienteId,
      asignacion_id: asignacionId,
      monto_usd: Number(monto),
      periodo: new Date().toISOString().slice(0, 10),
      comprobante_url: rutaArchivo,
      estado: 'pendiente',
    })

    setEnviando(false)

    if (errorPago) {
      setMensaje(`No se pudo reportar el pago: ${errorPago.message}`)
      return
    }

    setMensaje('Pago reportado. Un administrador lo confirmará en breve.')
    setArchivo(null)
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-line bg-surface p-6"
    >
      <h2 className="font-display text-lg text-ink">Reportar pago</h2>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted">
          Monto abonado (USD)
        </label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          required
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
        <p className="mt-1 text-xs text-muted">
          Puedes abonar el total o un pago parcial en cualquier momento.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted">
          Comprobante
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-line px-3 py-3 text-sm text-muted hover:border-accent hover:text-ink">
          <Upload className="h-4 w-4" />
          {archivo ? archivo.name : 'Seleccionar imagen o PDF'}
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {mensaje && <p className="text-sm text-muted">{mensaje}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-base transition hover:opacity-90 disabled:opacity-50"
      >
        {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
        Reportar pago
      </button>
    </form>
  )
}
