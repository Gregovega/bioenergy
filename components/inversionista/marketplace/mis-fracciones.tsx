'use client'

// =============================================================
// COMPONENTE: marketplace-mis-fracciones.tsx
// PORTAL: inversionista
// Lista las fracciones activas del inversionista. Si una no
// tiene listado, muestra el precio de referencia sugerido (según
// fn_calcular_precio_referencia_fraccion, calculado en el
// servidor al confirmar) y un botón para listarla. Si ya tiene un
// listado activo o pendiente, muestra su estado y un botón para
// cancelarlo.
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Tag, X, Loader2 } from 'lucide-react'

type Fraccion = {
  id: string
  cantidad_participaciones: number
  precio_entrada_usd: number
  fecha_compra: string
  plazo_meses: number
  equipo: { numero_serie: string; modelo: string } | null
}

type Listado = {
  id: string
  fraccion_id: string
  precio_listado_usd: number
  precio_referencia_usd: number
  estado: string
  motivo_rechazo: string | null
}

export function MarketplaceMisFracciones({
  fracciones,
  misListados,
  bandaPct,
  tenenciaMinimaMeses,
}: {
  fracciones: Fraccion[]
  misListados: Listado[]
  bandaPct: number
  tenenciaMinimaMeses: number
}) {
  const supabase = createClient()
  const router = useRouter()
  const [fraccionEnListado, setFraccionEnListado] = useState<string | null>(null)
  const [precioTexto, setPrecioTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const listadoPorFraccion = new Map(misListados.map((l) => [l.fraccion_id, l]))

  function puedeListar(f: Fraccion) {
    const meses =
      (Date.now() - new Date(f.fecha_compra).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    return meses >= tenenciaMinimaMeses && meses < f.plazo_meses
  }

  async function confirmarListado(fraccionId: string) {
    const precio = Number(precioTexto)
    if (!Number.isFinite(precio) || precio <= 0) {
      setMensaje('Ingresa un precio válido.')
      return
    }
    setEnviando(true)
    setMensaje(null)

    const { error } = await supabase.rpc('fn_listar_fraccion_marketplace', {
      p_fraccion_id: fraccionId,
      p_precio_listado_usd: precio,
    })

    setEnviando(false)
    if (error) {
      setMensaje(error.message)
      return
    }
    setFraccionEnListado(null)
    setPrecioTexto('')
    router.refresh()
  }

  async function cancelarListado(listadoId: string) {
    setEnviando(true)
    setMensaje(null)
    const { error } = await supabase.rpc('fn_cancelar_listado_marketplace', {
      p_listado_id: listadoId,
    })
    setEnviando(false)
    if (error) {
      setMensaje(error.message)
      return
    }
    router.refresh()
  }

  return (
    <section>
      <h2 className="mb-4 font-display text-lg text-ink">Mis fracciones</h2>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Equipo</th>
              <th className="px-4 py-3 font-medium">Participaciones</th>
              <th className="px-4 py-3 font-medium">Precio pagado</th>
              <th className="px-4 py-3 font-medium">Estado en marketplace</th>
              <th className="px-4 py-3 font-medium text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {fracciones.map((f) => {
              const listado = listadoPorFraccion.get(f.id)
              const elegible = puedeListar(f)
              return (
                <tr key={f.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono text-ink">{f.equipo?.numero_serie ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-muted">
                    {Number(f.cantidad_participaciones).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted">
                    ${Number(f.precio_entrada_usd).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {listado ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          listado.estado === 'pendiente_aprobacion'
                            ? 'bg-signal/10 text-signal'
                            : 'bg-accent/10 text-accent'
                        }`}
                      >
                        {listado.estado === 'pendiente_aprobacion'
                          ? `En venta pendiente de aprobar · $${Number(listado.precio_listado_usd).toFixed(2)}`
                          : `Listada · $${Number(listado.precio_listado_usd).toFixed(2)}`}
                      </span>
                    ) : elegible ? (
                      <span className="text-xs text-muted">Disponible para vender</span>
                    ) : (
                      <span className="text-xs text-muted">
                        Todavía no cumple {tenenciaMinimaMeses} meses de tenencia
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {listado ? (
                      <button
                        onClick={() => cancelarListado(listado.id)}
                        disabled={enviando}
                        className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted hover:text-ink disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" /> Cancelar
                      </button>
                    ) : elegible ? (
                      fraccionEnListado === f.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            step="0.01"
                            autoFocus
                            placeholder="Precio USD"
                            value={precioTexto}
                            onChange={(e) => setPrecioTexto(e.target.value)}
                            className="w-28 rounded-md border border-line bg-base px-2 py-1.5 text-xs text-ink outline-none focus:border-accent"
                          />
                          <button
                            onClick={() => confirmarListado(f.id)}
                            disabled={enviando}
                            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-base disabled:opacity-50"
                          >
                            {enviando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmar'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setFraccionEnListado(f.id)
                            setMensaje(null)
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-base"
                        >
                          <Tag className="h-3.5 w-3.5" /> Listar en venta
                        </button>
                      )
                    ) : null}
                  </td>
                </tr>
              )
            })}
            {fracciones.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No tienes fracciones activas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {fraccionEnListado && (
        <p className="mt-2 text-xs text-muted">
          El precio debe caer dentro de ±{Math.round(bandaPct * 100)}% del valor de referencia de tu
          fracción; el sistema lo valida al confirmar.
        </p>
      )}
      {mensaje && <p className="mt-3 text-sm text-muted">{mensaje}</p>}
    </section>
  )
}
