import { createClient } from '@/lib/supabase/server'
import { Sprout, PiggyBank } from 'lucide-react'

export default async function ReinversionInversionistaPage() {
  const supabase = await createClient()

  const { data: aportes } = await supabase
    .from('reinversion_aporte')
    .select(
      'id, monto_usd, estado, fecha, ronda_reinversion(fecha_cierre, equipo(numero_serie, modelo))'
    )
    .order('fecha', { ascending: false })

  const lista = (aportes ?? []).map((a: any) => ({
    ...a,
    ronda: Array.isArray(a.ronda_reinversion) ? a.ronda_reinversion[0] : a.ronda_reinversion,
  }))

  const totalEnPool = lista
    .filter((a) => a.estado === 'en_pool')
    .reduce((acc, a) => acc + Number(a.monto_usd), 0)
  const totalAplicado = lista
    .filter((a) => a.estado === 'aplicado')
    .reduce((acc, a) => acc + Number(a.monto_usd), 0)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-xl text-ink">Mi reinversión</h1>
        <p className="mt-1 text-sm text-muted">
          Cada dividendo que decides reinvertir entra aquí, se acumula junto con el de otros
          inversionistas, y se aplica cuando alcanza para comprar un equipo nuevo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-5">
          <PiggyBank className="h-4 w-4 text-accent" strokeWidth={2} />
          <p className="mt-4 font-mono text-2xl text-ink">
            ${totalEnPool.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-muted">En pool, esperando cerrar una ronda</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5">
          <Sprout className="h-4 w-4 text-signal" strokeWidth={2} />
          <p className="mt-4 font-mono text-2xl text-ink">
            ${totalAplicado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-muted">Ya aplicado a un equipo nuevo</p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 font-display text-lg text-ink">Detalle de aportes</h2>
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Equipo aplicado</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-muted">
                    {new Date(a.fecha).toLocaleDateString('es-VE')}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">
                    ${Number(a.monto_usd).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {a.estado === 'en_pool' ? (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                        En pool
                      </span>
                    ) : (
                      <span className="rounded-full bg-signal/10 px-2 py-0.5 text-xs font-medium text-signal">
                        Aplicado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted">
                    {a.ronda?.equipo?.numero_serie ?? '—'}
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Todavía no tienes aportes de reinversión.
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
