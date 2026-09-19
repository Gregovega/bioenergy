import { createClient } from '@/lib/supabase/server'
import { FormularioReportarPago } from '@/components/cliente/formulario-reportar-pago'
import { Zap, Clock } from 'lucide-react'

export default async function ClientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cliente } = await supabase
    .from('cliente_final')
    .select('id, estado_servicio')
    .eq('user_id', user!.id)
    .single()

  // Un cliente puede tener más de un equipo activo (segunda ubicación,
  // batería adicional, etc.), así que se trae como lista, no como fila única.
  const [{ data: asignaciones }, { data: saldos }, { data: pagos }] = await Promise.all([
    supabase
      .from('asignacion')
      .select('id, mensualidad_usd, equipo(numero_serie, modelo, estado)')
      .eq('cliente_id', cliente?.id ?? '')
      .eq('estado', 'activa')
      .order('fecha_inicio', { ascending: true }),
    supabase
      .from('vista_cliente_saldo_diario')
      .select('*')
      .eq('cliente_id', cliente?.id ?? ''),
    supabase
      .from('pago')
      .select('id, monto_usd, periodo, estado, created_at, asignacion(equipo(numero_serie))')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const asignacionesNormalizadas = (asignaciones ?? []).map((a: any) => ({
    ...a,
    equipo: Array.isArray(a.equipo) ? a.equipo[0] ?? null : a.equipo ?? null,
  }))

  const saldoPorAsignacion = new Map((saldos ?? []).map((s: any) => [s.asignacion_id, s]))

  const pagosNormalizados = (pagos ?? []).map((p: any) => {
    const asig = Array.isArray(p.asignacion) ? p.asignacion[0] ?? null : p.asignacion ?? null
    const eq = asig ? (Array.isArray(asig.equipo) ? asig.equipo[0] ?? null : asig.equipo ?? null) : null
    return { ...p, equipoSerie: eq?.numero_serie ?? null }
  })

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
                {asignacionesNormalizadas.length === 0
                  ? 'Sin equipo asignado'
                  : asignacionesNormalizadas.length === 1
                    ? asignacionesNormalizadas[0].equipo?.numero_serie ?? '—'
                    : `${asignacionesNormalizadas.length} equipos activos`}
              </span>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${estadoColor}`}>
            {cliente?.estado_servicio}
          </span>
        </div>
      </div>

      {asignacionesNormalizadas.length === 0 && (
        <div className="rounded-lg border border-line bg-surface p-6 text-center text-sm text-muted">
          Todavía no tienes un equipo activo asignado.
        </div>
      )}

      {asignacionesNormalizadas.map((asig) => {
        const saldo = saldoPorAsignacion.get(asig.id) as any
        return (
          <section key={asig.id} className="space-y-4 rounded-lg border border-line p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                <span className="font-mono text-sm text-ink">
                  {asig.equipo?.numero_serie ?? '—'}
                </span>
                <span className="text-xs text-muted">{asig.equipo?.modelo}</span>
              </div>
              <span className="font-mono text-xs text-muted">
                ${Number(asig.mensualidad_usd).toFixed(2)}/mes
              </span>
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

            {cliente && (
              <FormularioReportarPago
                clienteId={cliente.id}
                asignacionId={asig.id}
                userId={user!.id}
                mensualidadSugerida={Number(asig.mensualidad_usd)}
              />
            )}
          </section>
        )
      })}

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
                <th className="px-4 py-3 font-medium">Equipo</th>
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pagosNormalizados.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-muted">
                    {new Date(p.created_at).toLocaleDateString('es-VE')}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted">{p.equipoSerie ?? '—'}</td>
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
              {pagosNormalizados.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
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
