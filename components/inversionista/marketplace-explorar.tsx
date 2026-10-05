'use client'

// =============================================================
// COMPONENTE: marketplace-explorar.tsx
// PORTAL: inversionista
// Lista los listados activos de OTROS inversionistas. Al comprar,
// el inversionista sube su comprobante de pago (mismo patrón que
// FormularioReportarPago: se sube a storage/comprobantes bajo su
// propio user_id, y solo se guarda la ruta relativa) y queda
// pendiente de aprobación del equipo.
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, ShoppingCart, Loader2 } from 'lucide-react'

type Listado = {
  id: string
  precio_listado_usd: number
  precio_referencia_usd: number
  equipo_numero_serie: string
  equipo_modelo: string
  cantidad_participaciones: number
  plazo_meses_fraccion: number
  fecha_compra_fraccion: string
  fecha_listado: string
}

export function MarketplaceExplorar({
  listados,
  userId,
}: {
  listados: Listado[]
  userId: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [listadoActivo, setListadoActivo] = useState<string | null>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  function mesesRestantesDividendo(l: Listado) {
    const fin = new Date(l.fecha_compra_fraccion)
    fin.setMonth(fin.getMonth() + l.plazo_meses_fraccion)
    return fin.toLocaleDateString('es-VE')
  }

  async function comprar(listadoId: string) {
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

    const { error } = await supabase.rpc('fn_solicitar_compra_marketplace', {
      p_listado_id: listadoId,
      p_comprobante_url: rutaArchivo,
    })

    setEnviando(false)
    if (error) {
      setMensaje(error.message)
      return
    }

    setListadoActivo(null)
    setArchivo(null)
    setMensaje('Solicitud enviada. El equipo la revisará y te notificaremos.')
    router.refresh()
  }

  return (
    <section>
      <h2 className="mb-4 font-display text-lg text-ink">Explorar marketplace</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listados.map((l) => (
          <div key={l.id} className="rounded-lg border border-line bg-surface p-5">
            <p className="font-mono text-sm text-ink">{l.equipo_numero_serie}</p>
            <p className="text-xs text-muted">{l.equipo_modelo}</p>
            <p className="mt-3 font-mono text-2xl text-ink">
              ${Number(l.precio_listado_usd).toFixed(2)}
            </p>
            <p className="text-[11px] text-muted">
              Referencia ${Number(l.precio_referencia_usd).toFixed(2)}
            </p>
            <p className="mt-2 text-xs text-muted">
              {Number(l.cantidad_participaciones).toFixed(2)} participaciones · paga dividendo hasta{' '}
              {mesesRestantesDividendo(l)}
            </p>

            {listadoActivo === l.id ? (
              <div className="mt-4 space-y-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-line px-3 py-2.5 text-xs text-muted hover:border-accent hover:text-ink">
                  <Upload className="h-3.5 w-3.5" />
                  {archivo ? archivo.name : 'Adjuntar comprobante de pago'}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => comprar(l.id)}
                    disabled={enviando}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-xs font-medium text-base disabled:opacity-50"
                  >
                    {enviando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirmar compra
                  </button>
                  <button
                    onClick={() => {
                      setListadoActivo(null)
                      setArchivo(null)
                    }}
                    className="rounded-md border border-line px-3 py-2 text-xs text-muted"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setListadoActivo(l.id)
                  setMensaje(null)
                }}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-md border border-line px-3 py-2 text-xs font-medium text-ink hover:border-accent"
              >
                <ShoppingCart className="h-3.5 w-3.5" /> Comprar
              </button>
            )}
          </div>
        ))}
        {listados.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted">
            No hay listados disponibles en este momento.
          </p>
        )}
      </div>
      {mensaje && <p className="mt-3 text-sm text-muted">{mensaje}</p>}
    </section>
  )
}
