'use client'

// =============================================================
// COMPONENTES: editor-referidos-fidelidad.tsx
// PORTAL: Mothership (admin / super_admin)
//  - EditorNivelesReferido: % de comisión por nivel (tabla configuracion_referido_nivel)
//  - EditorHitosFidelidad: puntos por antigüedad (configuracion_global.fidelidad_hitos_antiguedad_meses, JSON)
// Staff ya tiene permiso de escritura en ambas por RLS.
// Los cambios aplican hacia adelante (pagos y eventos futuros).
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2, Plus, X } from 'lucide-react'

const BOTON =
  'inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50'
const CAMPO = 'rounded-md border border-line bg-base px-2 py-1.5 font-mono text-sm text-ink'

// ---------------------------------------------------------------
// Niveles de referidos
// ---------------------------------------------------------------
export function EditorNivelesReferido({
  niveles,
}: {
  niveles: { nivel: number; porcentaje: number }[]
}) {
  const supabase = createClient()
  const router = useRouter()

  const aTexto = (p: number) => String(Math.round(p * 10000) / 100)
  const [textos, setTextos] = useState<Record<number, string>>(
    Object.fromEntries(niveles.map((n) => [n.nivel, aTexto(n.porcentaje)]))
  )
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const total = niveles.reduce((acc, n) => acc + (Number(textos[n.nivel]) || 0), 0)

  async function guardar() {
    for (const n of niveles) {
      const v = Number(textos[n.nivel])
      if (textos[n.nivel] === '' || Number.isNaN(v) || v < 0 || v > 50) {
        setMensaje(`El nivel ${n.nivel} debe estar entre 0 y 50 %.`)
        return
      }
    }
    setGuardando(true)
    setMensaje(null)

    const resultados = await Promise.all(
      niveles.map((n) =>
        supabase
          .from('configuracion_referido_nivel')
          .update({ porcentaje: Math.round(Number(textos[n.nivel]) * 100) / 10000 })
          .eq('nivel', n.nivel)
      )
    )
    setGuardando(false)

    const fallo = resultados.find((r) => r.error)
    if (fallo?.error) {
      setMensaje('No se pudo guardar: ' + fallo.error.message)
      return
    }
    setMensaje('Guardado.')
    router.refresh()
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-6">
      <h2 className="font-display text-lg text-ink">Comisión por nivel de referidos</h2>
      <p className="mt-1 text-sm text-muted">
        Porcentaje del dividendo que gana quien refirió, según qué tan arriba está en la cadena
        (nivel 1 es el referidor directo). Aplica a los dividendos que se paguen de ahora en
        adelante.
      </p>

      <div className="mt-4 space-y-3">
        {niveles.map((n) => (
          <div key={n.nivel} className="flex items-center gap-3">
            <span className="w-16 text-sm text-ink">Nivel {n.nivel}</span>
            <input
              type="number"
              step={0.01}
              min={0}
              max={50}
              value={textos[n.nivel]}
              onChange={(e) => {
                setTextos({ ...textos, [n.nivel]: e.target.value })
                setMensaje(null)
              }}
              className={`w-24 ${CAMPO}`}
            />
            <span className="text-xs text-muted">%</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted">
        Total repartido en la cadena por cada dividendo: <span className="font-mono">{total.toFixed(2)}%</span>
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button onClick={guardar} disabled={guardando} className={BOTON}>
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Guardar
        </button>
        {mensaje && <span className="text-sm text-muted">{mensaje}</span>}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------
// Hitos de antigüedad de fidelidad
// ---------------------------------------------------------------
type Hito = { meses: string; puntos: string }

export function EditorHitosFidelidad({
  hitos,
}: {
  hitos: { meses: number; puntos: number }[]
}) {
  const supabase = createClient()
  const router = useRouter()

  const [filas, setFilas] = useState<Hito[]>(
    hitos.map((h) => ({ meses: String(h.meses), puntos: String(h.puntos) }))
  )
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  function cambiar(i: number, campo: keyof Hito, valor: string) {
    setFilas(filas.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f)))
    setMensaje(null)
  }

  async function guardar() {
    const vistos = new Set<number>()
    const objeto: Record<string, number> = {}

    for (const f of filas) {
      const m = Number(f.meses)
      const p = Number(f.puntos)
      if (!Number.isInteger(m) || m < 1 || m > 600) {
        setMensaje('Cada hito necesita meses enteros entre 1 y 600.')
        return
      }
      if (!Number.isInteger(p) || p < 0 || p > 100000) {
        setMensaje('Los puntos deben ser un entero entre 0 y 100000.')
        return
      }
      if (vistos.has(m)) {
        setMensaje(`El hito de ${m} meses está repetido.`)
        return
      }
      vistos.add(m)
      objeto[String(m)] = p
    }

    // Orden numérico por meses para que el JSON quede ordenado.
    const ordenado = Object.fromEntries(
      Object.entries(objeto).sort((a, b) => Number(a[0]) - Number(b[0]))
    )

    setGuardando(true)
    setMensaje(null)
    const { error } = await supabase
      .from('configuracion_global')
      .update({ valor: JSON.stringify(ordenado), updated_at: new Date().toISOString() })
      .eq('clave', 'fidelidad_hitos_antiguedad_meses')
    setGuardando(false)

    if (error) {
      setMensaje('No se pudo guardar: ' + error.message)
      return
    }
    setMensaje('Guardado.')
    router.refresh()
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-6">
      <h2 className="font-display text-lg text-ink">Hitos de antigüedad (fidelidad)</h2>
      <p className="mt-1 text-sm text-muted">
        Puntos extra que gana un cliente al cumplir cierta antigüedad. Aplica a los hitos que se
        alcancen de ahora en adelante.
      </p>

      <div className="mt-4 space-y-3">
        {filas.map((f, i) => (
          <div key={i} className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={1}
              step={1}
              value={f.meses}
              onChange={(e) => cambiar(i, 'meses', e.target.value)}
              className={`w-20 ${CAMPO}`}
            />
            <span className="text-xs text-muted">meses →</span>
            <input
              type="number"
              min={0}
              step={1}
              value={f.puntos}
              onChange={(e) => cambiar(i, 'puntos', e.target.value)}
              className={`w-24 ${CAMPO}`}
            />
            <span className="text-xs text-muted">puntos</span>
            <button
              onClick={() => {
                setFilas(filas.filter((_, idx) => idx !== i))
                setMensaje(null)
              }}
              aria-label="Quitar hito"
              className="rounded-md p-1 text-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {filas.length === 0 && <p className="text-sm text-muted">No hay hitos definidos.</p>}
      </div>

      <button
        onClick={() => setFilas([...filas, { meses: '', puntos: '' }])}
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent"
      >
        <Plus className="h-4 w-4" /> Agregar hito
      </button>

      <div className="mt-4 flex items-center gap-3">
        <button onClick={guardar} disabled={guardando} className={BOTON}>
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Guardar
        </button>
        {mensaje && <span className="text-sm text-muted">{mensaje}</span>}
      </div>
    </section>
  )
}
