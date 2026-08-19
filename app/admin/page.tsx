import { createClient } from '@/lib/supabase/server'
import { TablaPagosPendientes } from '@/components/admin/tabla-pagos-pendientes'
import { Cpu, Users, Wallet, TrendingUp, Clock } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [{ data: resumen }, { data: pagosPendientes }, { data: equipos }] = await Promise.all([
    supabase.from('vista_resumen_mothership').select('*').single(),
    supabase
      .from('pago')
      .select(
        'id, monto_usd, periodo, comprobante_url, created_at, cliente_final(nombre), asignacion(equipo(numero_serie))'
      )
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true }),
    supabase
      .from('equipo')
      .select(
        'id, numero_serie, modelo, estado, capacidad_inversor_kw, capacidad_bateria_kwh, asignacion(estado, mensualidad_usd, cliente_final(nombre))'
      )
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const pagosConComprobanteFirmado = await Promise.all(
    (pagosPendientes ?? []).map(async (pago) => {
      if (!pago.comprobante_url) return { ...pago, comprobante_url_firmada: null }

      const { data } = await supabase.storage
        .from('comprobantes')
        .createSignedUrl(pago.comprobante_url, 3600) // 1 hora de validez

      return { ...pago, comprobante_url_firmada: data?.signedUrl ?? null }
    })
  )

  const stats = [
    {
      label: 'Equipos totales',
      value: resumen?.equipos_totales ?? 0,
      icon: Cpu,
      formato: 'entero' as const,
    },
    {
      label: 'Clientes activos',
      value: resumen?.clientes_activos ?? 0,
      icon: Users,
      formato: 'entero' as const,
    },
    {
      label: 'Fondo operativo acumulado',
      value: resumen?.fondo_operativo_acumulado_usd ?? 0,
      icon: Wallet,
      formato: 'usd' as const,
    },
    {
      label: 'Ganancia neta acumulada',
      value: resumen?.ganancia_neta_acumulada_usd ?? 0,
      icon: TrendingUp,
      formato: 'usd' as const,
    },
  ]

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Resumen operativo
        </p>
        <h1 className="mt-1 font-display text-2xl text-ink">Panel general</h1>
      </div>

      {/* Franja de métricas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, formato }) => (
          <div
            key={label}
            className="rounded-lg border border-line bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <Icon className="h-4 w-4 text-accent" strokeWidth={2} />
            </div>
            <p className="mt-4 font-mono text-2xl text-ink">
              {formato === 'usd'
                ? `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : Number(value).toLocaleString('en-US')}
            </p>
            <p className="mt-1 text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Cola de pagos pendientes */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" />
          <h2 className="font-display text-lg text-ink">
            Cola de pagos pendientes
          </h2>
          {pagosPendientes && pagosPendientes.length > 0 && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              {pagosPendientes.length}
            </span>
          )}
        </div>
        <TablaPagosPendientes pagos={pagosConComprobanteFirmado} />
      </section>

      {/* Equipos y asignaciones */}
      <section>
        <h2 className="mb-4 font-display text-lg text-ink">
          Equipos y asignaciones
        </h2>
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Serial</th>
                <th className="px-4 py-3 font-medium">Modelo</th>
                <th className="px-4 py-3 font-medium">Capacidad</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Cliente asignado</th>
                <th className="px-4 py-3 font-medium">Mensualidad</th>
              </tr>
            </thead>
            <tbody>
              {(equipos ?? []).map((eq) => {
                const asignacionActiva = Array.isArray(eq.asignacion)
                  ? eq.asignacion.find((a) => a.estado === 'activa')
                  : null

                return (
                  <tr key={eq.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-mono text-ink">{eq.numero_serie}</td>
                    <td className="px-4 py-3 text-muted">{eq.modelo}</td>
                    <td className="px-4 py-3 font-mono text-muted">
                      {eq.capacidad_inversor_kw}kW / {eq.capacidad_bateria_kwh}kWh
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          eq.estado === 'instalado'
                            ? 'bg-signal/10 text-signal'
                            : 'bg-muted/10 text-muted'
                        }`}
                      >
                        {eq.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {asignacionActiva?.cliente_final?.nombre ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink">
                      {asignacionActiva
                        ? `$${Number(asignacionActiva.mensualidad_usd).toFixed(2)}`
                        : '—'}
                    </td>
                  </tr>
                )
              })}
              {(equipos ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    Todavía no hay equipos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
