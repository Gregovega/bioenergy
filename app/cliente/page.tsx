import { createClient } from '@/lib/supabase/server'
import { FormularioReportarPago } from '@/components/cliente/formulario-reportar-pago'
import { Zap, Clock } from 'lucide-react'

export default async function ClientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: cliente }, { data: asignacion }, { data: saldo }, { data: pagos }] =
    await Promise.all([
      supabase.from('cliente_final').select('id, estado_servicio').eq('user_id', user!.id).single(),
      supabase
        .from('asignacion')
        .select('id, mensualidad_usd, equipo(numero_serie, modelo)')
        .eq('estado', 'activa')
        .maybeSingle(),
      supabase.from('vista_cliente_saldo_diario').select('*').maybeSingle(),
      supabase
        .from('pago')
        .select('id, monto_usd, periodo, estado, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

  const estadoColor =
    cliente?.estado_servicio === 'activo'
      ? 'bg-signal/10 text-signal'
      : cliente?.estado_servicio === 'en_mora'
        ? 'bg-accent/10 text-accent'
        : 'bg-alert/10 text-alert'

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-line bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted">
              Estado del servicio
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              <span className="font-mono text-sm text-ink">
                {asignacion?.equipo?.numero_serie ?? 'Sin equipo asignado'}
              </span>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${estadoColor}`}>
            {cliente?.estado_servicio}
          </span>
        </div>
      </div>

      {saldo && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="font-mono text-2xl text-ink">
              ${Number(saldo.monto_devengado_ciclo_usd).toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-muted">Devengado este ciclo</p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="font-mono text-2xl text-ink">
              ${Number(saldo.saldo_pendiente_usd).toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-muted">Saldo pendiente</p>
          </div>
        </div>
      )}

      {asignacion && cliente && (
        <FormularioReportarPago
          clienteId={cliente.id}
          asignacionId={asignacion.id}
          userId={user!.id}
          mensualidadSugerida={Number(asignacion.mensualidad_usd)}
        />
      )}

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" />
          <h2 className="font-display text-lg text-ink">Historial de pagos</h2>
        </div>
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Fecha reportado</th>
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(pagos ?? []).map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-muted">
                    {new Date(p.created_at).toLocaleDateString('es-VE')}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">
                    ${Number(p.monto_usd).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.estado === 'confirmado'
                          ? 'bg-signal/10 text-signal'
                          : p.estado === 'rechazado'
                            ? 'bg-alert/10 text-alert'
                            : 'bg-muted/10 text-muted'
                      }`}
                    >
                      {p.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {(pagos ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted">
                    Todavía no has reportado pagos.
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
