'use client'

// =============================================================
// COMPONENTE: tabla-leads.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: CRM básico. Lista los leads que llegan desde la landing
// (calculadora, "aportar equipo", CTA final) o los que el staff
// carga a mano, con su estado (nuevo → contactado → en proceso →
// convertido/perdido) y notas internas. Convertir a cliente real
// se sigue haciendo desde los formularios de admin ya existentes;
// aquí solo se rastrea el interés hasta que eso pase.
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

type Lead = {
  id: string
  nombre: string
  email: string | null
  telefono: string | null
  monto_interes_usd: number | null
  mensaje: string | null
  origen: string
  codigo_referido: string | null
  estado: string
  notas_internas: string | null
  created_at: string
}

const ESTADOS = ['nuevo', 'contactado', 'en_proceso', 'convertido', 'perdido'] as const

const COLOR_ESTADO: Record<string, string> = {
  nuevo: 'bg-accent/10 text-accent border-accent/30',
  contactado: 'bg-muted/10 text-muted border-line',
  en_proceso: 'bg-signal/10 text-signal border-signal/30',
  convertido: 'bg-signal/20 text-signal border-signal/40',
  perdido: 'bg-red-500/10 text-red-500 border-red-500/20',
}

const ORIGEN_LEGIBLE: Record<string, string> = {
  landing_calculadora: 'Calculadora',
  landing_equipo_tercero: 'Aportar equipo',
  landing_cta_final: 'CTA final',
  manual: 'Cargado a mano',
}

export function TablaLeads({ leads }: { leads: Lead[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<string>('todos')
  const [notaAbierta, setNotaAbierta] = useState<string | null>(null)
  const [notaTexto, setNotaTexto] = useState('')

  const leadsFiltrados = filtro === 'todos' ? leads : leads.filter((l) => l.estado === filtro)

  async function cambiarEstado(id: string, estado: string) {
    setGuardandoId(id)
    await supabase.from('lead').update({ estado, updated_at: new Date().toISOString() }).eq('id', id)
    setGuardandoId(null)
    router.refresh()
  }

  async function guardarNota(id: string) {
    setGuardandoId(id)
    await supabase
      .from('lead')
      .update({ notas_internas: notaTexto.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', id)
    setGuardandoId(null)
    setNotaAbierta(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltro('todos')}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            filtro === 'todos' ? 'border-ink text-ink' : 'border-line text-muted'
          }`}
        >
          Todos ({leads.length})
        </button>
        {ESTADOS.map((e) => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
              filtro === e ? 'border-ink text-ink' : 'border-line text-muted'
            }`}
          >
            {e.replace('_', ' ')} ({leads.filter((l) => l.estado === e).length})
          </button>
        ))}
      </div>

      {leadsFiltrados.length === 0 && (
        <p className="text-sm text-muted">No hay leads en este filtro todavía.</p>
      )}

      <div className="space-y-3">
        {leadsFiltrados.map((lead) => (
          <div key={lead.id} className="rounded-lg border border-line bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{lead.nombre}</p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${COLOR_ESTADO[lead.estado] ?? ''}`}
                  >
                    {lead.estado.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-1 space-y-0.5 text-xs text-muted">
                  {lead.email && <p>{lead.email}</p>}
                  {lead.telefono && <p>{lead.telefono}</p>}
                  {lead.monto_interes_usd != null && (
                    <p>
                      Interés: <span className="font-mono text-ink">${Number(lead.monto_interes_usd).toLocaleString('en-US')}</span>
                    </p>
                  )}
                  {lead.codigo_referido && <p>Referido por: {lead.codigo_referido}</p>}
                  <p>
                    {ORIGEN_LEGIBLE[lead.origen] ?? lead.origen} ·{' '}
                    {new Date(lead.created_at).toLocaleDateString('es-VE')}
                  </p>
                  {lead.mensaje && <p className="italic">"{lead.mensaje}"</p>}
                  {lead.notas_internas && (
                    <p className="mt-1 rounded bg-base px-2 py-1 text-ink">📝 {lead.notas_internas}</p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <select
                  value={lead.estado}
                  onChange={(e) => cambiarEstado(lead.id, e.target.value)}
                  disabled={guardandoId === lead.id}
                  className="rounded-md border border-line bg-base px-2 py-1 text-xs text-ink capitalize"
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e} className="capitalize">
                      {e.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setNotaAbierta(notaAbierta === lead.id ? null : lead.id)
                    setNotaTexto(lead.notas_internas ?? '')
                  }}
                  className="text-[11px] text-muted hover:text-ink"
                >
                  {guardandoId === lead.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Nota'}
                </button>
              </div>
            </div>

            {notaAbierta === lead.id && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={notaTexto}
                  onChange={(e) => setNotaTexto(e.target.value)}
                  rows={2}
                  placeholder="Nota interna (no la ve el lead)"
                  className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => guardarNota(lead.id)}
                    className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-base"
                  >
                    Guardar nota
                  </button>
                  <button
                    onClick={() => setNotaAbierta(null)}
                    className="rounded-md border border-line px-3 py-1.5 text-xs text-muted"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
