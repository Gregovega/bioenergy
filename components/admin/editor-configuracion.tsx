'use client'

// =============================================================
// COMPONENTE: editor-configuracion.tsx
// PORTAL: Mothership (admin / super_admin)
// QUÉ HACE: edita valores sueltos de configuracion_global desde el panel,
// con validación de rango. Cada fila se guarda por separado.
// Los porcentajes se muestran como % (3) y se guardan como fracción (0.03).
// Staff ya tiene permiso de escritura en configuracion_global por RLS.
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2 } from 'lucide-react'

export type ItemConfig = {
  clave: string
  etiqueta: string
  ayuda: string
  tipo: 'porcentaje' | 'entero' | 'usd'
  unidad?: string // texto junto al campo (ej. "meses")
  min: number
  max: number
  valor: string | null // valor crudo guardado en la BD
}

function aMostrar(item: ItemConfig): string {
  if (item.valor === null || item.valor === '') return ''
  const n = Number(item.valor)
  if (Number.isNaN(n)) return item.valor
  if (item.tipo === 'porcentaje') return String(Math.round(n * 10000) / 100)
  return String(n)
}

function FilaConfig({ item }: { item: ItemConfig }) {
  const supabase = createClient()
  const router = useRouter()

  const inicial = aMostrar(item)
  const [texto, setTexto] = useState(inicial)
  const [guardado, setGuardado] = useState(inicial)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const n = Number(texto)
  const valido =
    texto.trim() !== '' &&
    !Number.isNaN(n) &&
    n >= item.min &&
    n <= item.max &&
    (item.tipo !== 'entero' || Number.isInteger(n))
  const cambio = texto !== guardado

  async function guardar() {
    if (!valido) {
      setMensaje(
        item.tipo === 'entero'
          ? `Escribe un número entero entre ${item.min} y ${item.max}.`
          : `Escribe un valor entre ${item.min} y ${item.max}.`
      )
      return
    }
    setGuardando(true)
    setMensaje(null)

    const valorBD = item.tipo === 'porcentaje' ? String(Math.round(n * 100) / 10000) : String(n)

    const { error } = await supabase
      .from('configuracion_global')
      .update({ valor: valorBD, updated_at: new Date().toISOString() })
      .eq('clave', item.clave)

    setGuardando(false)

    if (error) {
      setMensaje('No se pudo guardar: ' + error.message)
      return
    }

    setGuardado(texto)
    setMensaje('Guardado.')
    router.refresh()
  }

  const sufijo = item.tipo === 'porcentaje' ? '%' : item.tipo === 'usd' ? 'USD' : item.unidad ?? ''

  return (
    <div className="flex flex-col gap-2 border-b border-line py-4 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="max-w-md">
        <p className="text-sm text-ink">{item.etiqueta}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.ayuda}</p>
      </div>
      <div className="shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="number"
            step={item.tipo === 'entero' ? 1 : 0.01}
            min={item.min}
            max={item.max}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              setMensaje(null)
            }}
            className="w-24 rounded-md border border-line bg-base px-2 py-1.5 font-mono text-sm text-ink"
          />
          {sufijo && <span className="text-xs text-muted">{sufijo}</span>}
          <button
            onClick={guardar}
            disabled={guardando || !cambio}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-base disabled:opacity-40"
          >
            {guardando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Guardar
          </button>
        </div>
        {mensaje && <p className="mt-1 text-[11px] text-muted">{mensaje}</p>}
      </div>
    </div>
  )
}

export function EditorConfiguracion({
  titulo,
  descripcion,
  items,
}: {
  titulo: string
  descripcion: string
  items: ItemConfig[]
}) {
  return (
    <section className="rounded-lg border border-line bg-surface p-6">
      <h2 className="font-display text-lg text-ink">{titulo}</h2>
      <p className="mt-1 text-sm text-muted">{descripcion}</p>
      <div className="mt-2">
        {items.map((item) => (
          <FilaConfig key={item.clave} item={item} />
        ))}
      </div>
    </section>
  )
}
