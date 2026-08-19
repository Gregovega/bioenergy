import { createClient } from '@/lib/supabase/server'
import { Wallet, TrendingUp, Clock, PieChart } from 'lucide-react'
import BilleteraDesglose from '@/components/inversionista/BilleteraDesglose'

export default async function InversionistaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // RLS ya restringe cada una de estas consultas a las filas de este inversionista.
  const [{ data: inversionista }, { data: fracciones }, { data: movimientos }, { data: devengado }] =
    await Promise.all([
      supabase.from('inversionista').select('id, nombre, estado_kyc').eq('user_id', user!.id).single(),
      supabase
        .from('fraccion')
        .select('id, monto_aportado_usd, porcentaje_propiedad, estado, equipo(numero_serie, modelo, estado, capacidad_inversor_kw, capacidad_bateria_kwh)')
        .eq('estado', 'activa'),
      supabase
        .from('billetera_movimiento')
        .select('id, monto_usd, tipo, fecha')
        .order('fecha', { ascending: false })
        .limit(15),
      supabase.from('vista_inversionista_devengado_diario').select('*'),
    ])

  const fraccionesNormalizadas = (fracciones ?? []).map((f: any) => ({
    ...f,
    equipo: Array.isArray(f.equipo) ? f.equipo[0] ?? null : f.equipo ?? null,
  }))

  const saldoDisponible = (movimientos ?? []).reduce((acc, m) => {
    if (m.tipo === 'credito_dividendo') return acc + Number(m.monto_usd)
    if (m.tipo === 'retiro') return acc - Number(m.monto_usd)
    return acc
  }, 0)

  const totalInvertido = fraccionesNormalizadas.reduce(
    (acc, f) => acc + Number(f.monto_aportado_usd),
    0
  )

  const devengadoCiclo = (devengado ?? []).reduce(
    (acc, d) => acc + Number(d.monto_devengado_ciclo_usd),
    0
  )
  const acreditadoCiclo = (devengado ?? []).reduce(
    (acc, d) => acc + Number(d.monto_ya_acreditado_ciclo_usd),
    0
  )
  const enCamino = Math.max(devengadoCiclo - acreditadoCiclo, 0)

  const stats = [
    { label: 'Saldo disponible', value: saldoDisponible, icon: Wallet },
    { label: 'Total invertido', value: totalInvertido, icon: PieChart },
    { label: 'Devengado este ciclo', value: devengadoCiclo, icon: TrendingUp },
    { label: 'En camino (por acreditar)', value: enCamino, icon: Clock },
  ]

  return (
    <div className="space-y-10">
      {inversionista?.estado_kyc !== 'verificado' && (
        <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          Tu verificación KYC está {inversionista?.estado_kyc}. Algunas funciones pueden estar
          limitadas hasta completarla.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-line bg-surface p-5">
            <Icon className="h-4 w-4 text-accent" strokeWidth={2} />
            <p className="mt-4 font-mono text-2xl text-ink">
              ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {inversionista?.id && <BilleteraDesglose inversionistaId={inversionista.id} />}

      <section>
        <h2 className="mb-4 font-display text-lg text-ink">Mis fracciones activas</h2>
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Equipo</th>
                <th className="px-4 py-3 font-medium">Capacidad</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">% Propiedad</th>
                <th className="px-4 py-3 font-medium">Aportado</th>
              </tr>
            </thead>
            <tbody>
              {fraccionesNormalizadas.map((f) => (
                <tr key={f.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono text-ink">
                    {f.equipo?.numero_serie ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted">
                    {f.equipo?.capacidad_inversor_kw}kW / {f.equipo?.capacidad_bateria_kwh}kWh
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-signal/10 px-2 py-0.5 text-xs font-medium text-signal">
                      {f.equipo?.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">
                    {(Number(f.porcentaje_propiedad) * 100).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">
                    ${Number(f.monto_aportado_usd).toFixed(2)}
                  </td>
                </tr>
              ))}
              {fraccionesNormalizadas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Todavía no tienes fracciones activas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg text-ink">Movimientos recientes</h2>
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {(movimientos ?? []).map((m) => (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-muted">
                    {new Date(m.fecha).toLocaleDateString('es-VE')}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {m.tipo === 'credito_dividendo' ? 'Dividendo acreditado' : m.tipo}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink">
                    ${Number(m.monto_usd).toFixed(2)}
                  </td>
                </tr>
              ))}
              {(movimientos ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted">
                    Sin movimientos todavía.
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
