import { createClient } from '@/lib/supabase/server'
import { Zap, CloudOff, Gauge } from 'lucide-react'

// =============================================================
// COMPONENTE: impacto-ambiental.tsx
// PORTAL: Landing pública (/)
// QUÉ HACE: muestra el contador agregado de impacto ambiental de
// TODA la empresa, llamando a fn_impacto_ambiental_publico() —
// una función pública (sin login) que solo expone agregados, sin
// datos de clientes ni inversionistas. Mientras los equipos no
// tengan telemetría real, el número es un ESTIMADO por capacidad
// instalada y tiempo — se lo decimos explícito al usuario para no
// prometer una precisión que todavía no existe. En cuanto un
// equipo tenga datos reales, ese equipo pasa a usarlos solo, sin
// que este componente tenga que cambiar.
// =============================================================

function formatoNumero(n: number) {
  return n.toLocaleString('es-VE', { maximumFractionDigits: 0 })
}

export async function ImpactoAmbiental() {
  const supabase = await createClient()
  const { data } = await supabase.rpc('fn_impacto_ambiental_publico')

  const impacto = data ?? {
    equipos_instalados: 0,
    capacidad_total_kw: 0,
    kwh_generados_total: 0,
    co2_evitado_kg_total: 0,
  }

  const toneladasCo2 = Number(impacto.co2_evitado_kg_total) / 1000

  return (
    <div className="rounded-2xl border border-line bg-surface p-8 sm:p-10">
      <p className="text-xs font-medium uppercase tracking-widest text-signal">
        Impacto en tiempo real
      </p>
      <h3 className="mt-2 font-display text-2xl text-ink">
        Esto es lo que ya estamos evitando
      </h3>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <Zap className="h-5 w-5 text-accent" strokeWidth={2} />
          <p className="mt-3 font-mono text-3xl text-ink">
            {formatoNumero(Number(impacto.kwh_generados_total))}
          </p>
          <p className="mt-1 text-xs text-muted">kWh generados de forma limpia</p>
        </div>
        <div>
          <CloudOff className="h-5 w-5 text-signal" strokeWidth={2} />
          <p className="mt-3 font-mono text-3xl text-ink">
            {toneladasCo2 >= 1 ? formatoNumero(toneladasCo2) : formatoNumero(Number(impacto.co2_evitado_kg_total))}
          </p>
          <p className="mt-1 text-xs text-muted">
            {toneladasCo2 >= 1 ? 'toneladas de CO2 evitadas' : 'kg de CO2 evitados'}
          </p>
        </div>
        <div>
          <Gauge className="h-5 w-5 text-accent" strokeWidth={2} />
          <p className="mt-3 font-mono text-3xl text-ink">
            {formatoNumero(Number(impacto.capacidad_total_kw))} kW
          </p>
          <p className="mt-1 text-xs text-muted">
            instalados en {impacto.equipos_instalados} equipo
            {Number(impacto.equipos_instalados) === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <p className="mt-8 text-[11px] leading-relaxed text-muted">
        Estas cifras son un estimado según la capacidad de cada equipo y su tiempo instalado,
        mientras terminamos de desplegar la medición en tiempo real en cada uno. A medida que un
        equipo empieza a reportar su generación real, el número se ajusta solo con ese dato.
      </p>
    </div>
  )
}
