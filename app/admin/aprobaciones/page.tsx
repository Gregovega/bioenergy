import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TarjetaAccionIA, ControlIA, type AccionIA } from '@/components/admin/acciones-ia'

// =============================================================
// PÁGINA: /admin/aprobaciones
// Bandeja de acciones que propone el asistente de IA. Nada se hace
// hasta que una persona aprueba. Lo que mueve dinero solo lo decide
// admin o super_admin. Los pagos en bolívares siguen verificándose y
// ejecutándose a mano: el asistente prepara, tú apruebas y ejecutas.
// =============================================================

export default async function AprobacionesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: staff } = await supabase
    .from('staff')
    .select('rol')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!staff) redirect('/')

  const esAdmin = ['super_admin', 'admin'].includes(staff.rol)

  // Vence las propuestas que llevan demasiado tiempo sin decisión.
  await supabase.rpc('fn_ia_expirar_propuestas')

  const [{ data: acciones }, { data: config }] = await Promise.all([
    supabase.from('ia_accion').select('*').order('propuesta_en', { ascending: false }).limit(80),
    supabase
      .from('configuracion_global')
      .select('clave, valor')
      .in('clave', ['ia_activa', 'ia_tope_pago_lote_usd']),
  ])

  const todas = (acciones ?? []) as AccionIA[]
  const porDecidir = todas.filter((a) => a.estado === 'propuesta')
  const porEjecutar = todas.filter((a) => a.estado === 'aprobada')
  const historial = todas
    .filter((a) => !['propuesta', 'aprobada'].includes(a.estado))
    .slice(0, 20)

  const valor = (clave: string) => config?.find((c: any) => c.clave === clave)?.valor ?? null
  const activa = valor('ia_activa') === 'true'
  const tope = Number(valor('ia_tope_pago_lote_usd') ?? 0) || 0

  const puede = (a: AccionIA) => (a.riesgo === 'alto' || a.riesgo === 'dinero' ? esAdmin : true)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Asistente de IA</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Aprobaciones</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Aquí llega todo lo que el asistente quiere hacer. No ejecuta nada por su cuenta: tú
          decides. Lo que mueve dinero solo lo aprueban admin y super_admin.
        </p>
      </div>

      {esAdmin && <ControlIA activaInicial={activa} topeInicial={tope} />}

      <section>
        <h2 className="mb-3 font-display text-lg text-ink">
          Por decidir <span className="font-mono text-sm text-accent">({porDecidir.length})</span>
        </h2>
        <div className="space-y-3">
          {porDecidir.map((a) => (
            <TarjetaAccionIA key={a.id} accion={a} puedeDecidir={puede(a)} />
          ))}
          {porDecidir.length === 0 && (
            <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
              No hay propuestas esperando decisión.
            </p>
          )}
        </div>
      </section>

      {porEjecutar.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg text-ink">
            Aprobadas, falta ejecutarlas{' '}
            <span className="font-mono text-sm text-accent">({porEjecutar.length})</span>
          </h2>
          <div className="space-y-3">
            {porEjecutar.map((a) => (
              <TarjetaAccionIA key={a.id} accion={a} puedeDecidir={puede(a)} />
            ))}
          </div>
        </section>
      )}

      {historial.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg text-ink">Historial reciente</h2>
          <div className="space-y-3">
            {historial.map((a) => (
              <TarjetaAccionIA key={a.id} accion={a} puedeDecidir={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
