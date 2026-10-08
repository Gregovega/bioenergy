'use client'

// =============================================================
// COMPONENTE: selector-proveedor-ia.tsx
// PORTAL: Mothership (admin / super_admin)
// QUÉ HACE: elegir qué proveedor de IA usa el asistente (Anthropic, OpenAI,
// Google o DeepSeek) y qué modelo. Muestra si la clave de cada uno ya está
// configurada en Netlify (nunca muestra la clave).
// La lista de modelos se pide al proveedor con tu propia clave.
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2 } from 'lucide-react'

export type InfoProveedor = {
  id: string
  nombre: string
  claveEnv: string
  configurada: boolean
  modelo: string
}

export function SelectorProveedorIA({
  proveedores,
  activoInicial,
}: {
  proveedores: InfoProveedor[]
  activoInicial: string
}) {
  const supabase = createClient()
  const router = useRouter()

  const [activo, setActivo] = useState(activoInicial)
  const [modelos, setModelos] = useState<Record<string, string>>(
    Object.fromEntries(proveedores.map((p) => [p.id, p.modelo]))
  )
  const [guardados, setGuardados] = useState<Record<string, string>>(
    Object.fromEntries(proveedores.map((p) => [p.id, p.modelo]))
  )
  const [listas, setListas] = useState<Record<string, string[]>>({})
  const [trabajando, setTrabajando] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  async function elegir(id: string) {
    setTrabajando('activo')
    setMensaje(null)
    const { error } = await supabase
      .from('configuracion_global')
      .update({ valor: id, updated_at: new Date().toISOString() })
      .eq('clave', 'ia_proveedor')
    setTrabajando(null)
    if (error) {
      setMensaje('No se pudo cambiar: ' + error.message)
      return
    }
    setActivo(id)
    router.refresh()
  }

  async function guardarModelo(id: string) {
    const m = (modelos[id] ?? '').trim()
    if (!m) {
      setMensaje('Escribe o elige un modelo.')
      return
    }
    setTrabajando('modelo-' + id)
    setMensaje(null)
    const { error } = await supabase
      .from('configuracion_global')
      .update({ valor: m, updated_at: new Date().toISOString() })
      .eq('clave', `ia_modelo_${id}`)
    setTrabajando(null)
    if (error) {
      setMensaje('No se pudo guardar: ' + error.message)
      return
    }
    setGuardados({ ...guardados, [id]: m })
    setMensaje('Guardado.')
    router.refresh()
  }

  async function verModelos(id: string) {
    setTrabajando('lista-' + id)
    setMensaje(null)
    try {
      const r = await fetch(`/api/asistente/modelos?proveedor=${id}`)
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setMensaje(data?.error ?? 'No se pudo consultar la lista.')
      } else {
        setListas({ ...listas, [id]: data.modelos ?? [] })
      }
    } catch {
      setMensaje('No se pudo conectar.')
    }
    setTrabajando(null)
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-6">
      <h2 className="font-display text-lg text-ink">Proveedor de IA</h2>
      <p className="mt-1 text-sm text-muted">
        Elige con cuál IA trabaja el asistente. Puedes cambiar cuando quieras: las reglas de
        seguridad y la bandeja de aprobaciones son las mismas para todos.
      </p>

      <div className="mt-4 space-y-3">
        {proveedores.map((p) => {
          const esActivo = p.id === activo
          return (
            <div
              key={p.id}
              className={`rounded-lg border p-4 ${esActivo ? 'border-accent/50 bg-accent/5' : 'border-line'}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-ink">{p.nombre}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    p.configurada ? 'bg-signal/10 text-signal' : 'bg-line/40 text-muted'
                  }`}
                >
                  {p.configurada ? 'Clave lista' : `Falta ${p.claveEnv}`}
                </span>
                {esActivo ? (
                  <span className="ml-auto text-xs font-medium text-accent">En uso</span>
                ) : (
                  <button
                    onClick={() => elegir(p.id)}
                    disabled={trabajando !== null}
                    className="ml-auto rounded-lg border border-line px-3 py-1 text-xs text-ink disabled:opacity-50"
                  >
                    Usar este
                  </button>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={modelos[p.id] ?? ''}
                  onChange={(e) => {
                    setModelos({ ...modelos, [p.id]: e.target.value })
                    setMensaje(null)
                  }}
                  placeholder="Modelo"
                  className="w-56 rounded-md border border-line bg-base px-2 py-1.5 font-mono text-xs text-ink"
                />
                <button
                  onClick={() => guardarModelo(p.id)}
                  disabled={trabajando !== null || (modelos[p.id] ?? '') === guardados[p.id]}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-base disabled:opacity-40"
                >
                  {trabajando === 'modelo-' + p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Guardar
                </button>
                <button
                  onClick={() => verModelos(p.id)}
                  disabled={!p.configurada || trabajando !== null}
                  className="text-xs text-accent disabled:opacity-40"
                >
                  {trabajando === 'lista-' + p.id ? 'Consultando…' : 'Ver modelos disponibles'}
                </button>
              </div>

              {listas[p.id] && (
                <select
                  size={Math.min(8, Math.max(3, listas[p.id].length))}
                  onChange={(e) => setModelos({ ...modelos, [p.id]: e.target.value })}
                  className="mt-3 w-full max-w-sm rounded-md border border-line bg-base p-1 font-mono text-xs text-ink"
                >
                  {listas[p.id].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
              {listas[p.id] && listas[p.id].length === 0 && (
                <p className="mt-2 text-xs text-muted">El proveedor no devolvió modelos.</p>
              )}
            </div>
          )
        })}
      </div>

      {mensaje && <p className="mt-3 text-sm text-muted">{mensaje}</p>}
    </section>
  )
}
