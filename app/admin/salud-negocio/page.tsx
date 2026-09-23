import { createClient } from '@/lib/supabase/server'
import {
  Sun,
  Receipt,
  Wallet,
  LifeBuoy,
  Smile,
  Users,
} from 'lucide-react'

function formatUsd(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function formatEntero(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString('en-US')
}

function Kpi({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <p className="font-mono text-2xl text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
      {sub && <p className="mt-2 text-xs text-muted/70">{sub}</p>}
    </div>
  )
}

function Seccion({
  icon: Icon,
  titulo,
  children,
}: {
  icon: any
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" strokeWidth={2} />
        <h2 className="font-display text-lg text-ink">{titulo}</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{children}</div>
    </section>
  )
}

function Badge({ label, count, tono }: { label: string; count: number; tono: 'ok' | 'alerta' | 'neutro' }) {
  const clases =
    tono === 'ok'
      ? 'bg-signal/10 text-signal'
      : tono === 'alerta'
      ? 'bg-red-500/10 text-red-500'
      : 'bg-muted/10 text-muted'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${clases}`}>
      {label}: {count}
    </span>
  )
}

export default async function SaludNegocioPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('fn_salud_negocio')

  if (error || !data) {
    return (
      <div className="rounded-lg border border-line bg-surface p-6 text-sm text-muted">
        No se pudo cargar el panel de salud del negocio
        {error ? `: ${error.message}` : '.'}
      </div>
    )
  }

  const g = data.generacion ?? {}
  const c = data.cobranza ?? {}
  const d = data.dividendos ?? {}
  const r = data.reclamos ?? {}
  const s = data.satisfaccion ?? {}
  const cr = data.crecimiento ?? {}

  const equiposPorEstado: Record<string, number> = g.equipos_por_estado ?? {}
  const reclamosPorEstado: Record<string, number> = r.por_estado ?? {}
  const leadsPorEstado: Record<string, number> = cr.leads_por_estado ?? {}
  const satisfaccionPorCategoria: Record<string, number> = s.promedio_por_categoria ?? {}

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Panel admin
        </p>
        <h1 className="mt-1 font-display text-2xl text-ink">Salud del negocio</h1>
        <p className="mt-1 text-xs text-muted">
          Actualizado en vivo · {new Date(data.generado_en).toLocaleString('es-VE')}
        </p>
      </div>

      <Seccion icon={Sun} titulo="Generación e instalaciones">
        <Kpi
          label="Capacidad instalada"
          value={`${formatEntero(g.capacidad_inversor_kw_instalada)} kW`}
          sub={`${formatEntero(g.capacidad_bateria_kwh_instalada)} kWh batería`}
        />
        <Kpi
          label="kWh generados (total)"
          value={formatEntero(g.kwh_generados_total)}
          sub={g.kwh_generados_total === 0 ? 'sin telemetría real aún' : undefined}
        />
        <Kpi
          label="CO2 evitado (kg)"
          value={formatEntero(g.co2_evitado_kg_total)}
        />
        <Kpi
          label="Valor del parque instalado"
          value={formatUsd(g.costo_total_usd_parque)}
        />
        <div className="col-span-2 flex flex-wrap gap-2 lg:col-span-4">
          {Object.entries(equiposPorEstado).map(([estado, cantidad]) => (
            <Badge
              key={estado}
              label={estado}
              count={cantidad}
              tono={estado === 'instalado' ? 'ok' : 'neutro'}
            />
          ))}
        </div>
      </Seccion>

      <Seccion icon={Receipt} titulo="Cobranza">
        <Kpi label="Facturado total" value={formatUsd(c.facturado_total_usd)} />
        <Kpi
          label="Cobrado"
          value={formatUsd(c.facturado_pagado_usd)}
          sub={c.pct_cobrado != null ? `${c.pct_cobrado}% del total facturado` : undefined}
        />
        <Kpi
          label="Vencido"
          value={formatUsd(c.facturado_vencido_usd)}
          sub={`${formatEntero(c.facturas_vencidas_count)} facturas`}
        />
        <Kpi label="Cobrado este mes" value={formatUsd(c.cobrado_mes_actual_usd)} />
      </Seccion>

      <Seccion icon={Wallet} titulo="Dividendos a inversionistas">
        <Kpi label="Total repartido" value={formatUsd(d.total_repartido_usd)} />
        <Kpi label="Acreditado" value={formatUsd(d.acreditado_usd)} />
        <Kpi label="Retirado" value={formatUsd(d.retirado_usd)} />
        <Kpi label="Reinvertido" value={formatUsd(d.reinvertido_usd)} />
      </Seccion>

      <Seccion icon={LifeBuoy} titulo="Reclamos y soporte">
        <Kpi
          label="Abiertos urgentes/altos"
          value={formatEntero(r.abiertos_urgentes_o_altos)}
        />
        <Kpi
          label="Tiempo de resolución promedio"
          value={
            r.tiempo_resolucion_promedio_horas != null
              ? `${r.tiempo_resolucion_promedio_horas} h`
              : '—'
          }
        />
        <div className="col-span-2 flex flex-wrap gap-2 lg:col-span-2">
          {Object.entries(reclamosPorEstado).map(([estado, cantidad]) => (
            <Badge
              key={estado}
              label={estado}
              count={cantidad}
              tono={estado === 'abierto' ? 'alerta' : estado === 'resuelto' || estado === 'cerrado' ? 'ok' : 'neutro'}
            />
          ))}
          {Object.keys(reclamosPorEstado).length === 0 && (
            <span className="text-xs text-muted">Sin reclamos registrados todavía.</span>
          )}
        </div>
      </Seccion>

      <Seccion icon={Smile} titulo="Satisfacción">
        <Kpi
          label="Calificación promedio"
          value={s.promedio_general != null ? `${s.promedio_general} / 5` : '—'}
          sub={`${formatEntero(s.respuestas_count)} respuestas`}
        />
        <div className="col-span-2 flex flex-wrap gap-2 lg:col-span-3">
          {Object.entries(satisfaccionPorCategoria).map(([categoria, promedio]) => (
            <Badge key={categoria} label={categoria} count={promedio} tono="neutro" />
          ))}
          {Object.keys(satisfaccionPorCategoria).length === 0 && (
            <span className="text-xs text-muted">Sin encuestas respondidas todavía.</span>
          )}
        </div>
      </Seccion>

      <Seccion icon={Users} titulo="Crecimiento">
        <Kpi
          label="Inversionistas"
          value={formatEntero(cr.inversionistas_total)}
          sub={`+${formatEntero(cr.inversionistas_nuevos_mes)} este mes`}
        />
        <Kpi
          label="Clientes"
          value={formatEntero(cr.clientes_total)}
          sub={`+${formatEntero(cr.clientes_nuevos_mes)} este mes`}
        />
        <div className="col-span-2 flex flex-wrap gap-2 lg:col-span-2">
          {Object.entries(leadsPorEstado).map(([estado, cantidad]) => (
            <Badge key={estado} label={`lead ${estado}`} count={cantidad} tono="neutro" />
          ))}
          {Object.keys(leadsPorEstado).length === 0 && (
            <span className="text-xs text-muted">Sin leads registrados todavía.</span>
          )}
        </div>
      </Seccion>
    </div>
  )
}
