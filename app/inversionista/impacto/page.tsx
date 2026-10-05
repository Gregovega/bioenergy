import { createClient } from '@/lib/supabase/server'
import { Leaf, Zap, Cpu, Info } from 'lucide-react'

// =============================================================
// PÁGINA: Certificado de impacto ambiental del inversionista
// Ruta: /inversionista/impacto
// Usa fn_impacto_ambiental_inversionista(): estima por capacidad
// instalada + tiempo mientras no hay telemetría real, y en cuanto
// un equipo reporta datos reales, los usa automáticamente.
// =============================================================

export default async function ImpactoInversionistaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: impacto }, { data: inversionista }] = await Promise.all([
    supabase.rpc('fn_impacto_ambiental_inversionista'),
    supabase.from('inversionista').select('nombre').eq('user_id', user!.id).single(),
  ])

  const equipos = Number((impacto as any)?.equipos ?? 0)
  const kwh = Number((impacto as any)?.kwh_atribuido ?? 0)
  const co2 = Number((impacto as any)?.co2_evitado_kg ?? 0)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-xl text-ink">Mi impacto ambiental</h1>
        <p className="mt-1 text-sm text-muted">
          Lo que tus participaciones han aportado a la generación de energía limpia.
        </p>
      </div>

      <section className="rounded-xl border border-accent/40 bg-surface p-8 text-center">
        <Leaf className="mx-auto h-6 w-6 text-signal" strokeWidth={2} />
        <p className="mt-4 text-xs uppercase tracking-widest text-muted">
          Certificado de impacto{inversionista?.nombre ? ` · ${inversionista.nombre}` : ''}
        </p>
        <p className="mt-4 font-mono text-5xl text-ink">
          {co2.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          <span className="ml-2 text-xl text-muted">kg CO₂</span>
        </p>
        <p className="mt-2 text-sm text-muted">evitados gracias a tus participaciones</p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-5">
          <Zap className="h-4 w-4 text-accent" strokeWidth={2} />
          <p className="mt-4 font-mono text-2xl text-ink">
            {kwh.toLocaleString('en-US', { maximumFractionDigits: 0 })} kWh
          </p>
          <p className="mt-1 text-xs text-muted">Energía atribuible a tus participaciones</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5">
          <Cpu className="h-4 w-4 text-accent" strokeWidth={2} />
          <p className="mt-4 font-mono text-2xl text-ink">{equipos}</p>
          <p className="mt-1 text-xs text-muted">Equipos instalados donde participas</p>
        </div>
      </div>

      <p className="flex gap-2 rounded-lg border border-line bg-surface/50 p-4 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Estas cifras son estimadas (capacidad instalada y tiempo de operación) mientras los
        equipos no reporten telemetría. Cuando un equipo reporte datos reales, el cálculo pasa a
        usarlos automáticamente.
      </p>
    </div>
  )
}
