import { createClient } from '@/lib/supabase/server'
import { FormFormasPago } from '@/components/admin/form-formas-pago'
import { FormConfigReferidos } from '@/components/admin/form-config-referidos'

// =============================================================
// PÁGINA: /admin/pagos
// Configuración editable desde la plataforma (sin tocar Supabase
// a mano): formas de pago que ve el cliente, y el monto mínimo
// de inversión acumulada para participar en el programa de
// referidos.
// =============================================================

export default async function AdminPagosPage() {
  const supabase = await createClient()

  const [{ data: formasPago }, { data: config }] = await Promise.all([
    supabase.from('forma_pago').select('*').order('orden', { ascending: true }),
    supabase
      .from('configuracion_global')
      .select('clave, valor')
      .in('clave', ['referido_inversion_minima_usd', 'programa_referidos_activo']),
  ])

  const montoMinimo = Number(
    config?.find((c) => c.clave === 'referido_inversion_minima_usd')?.valor ?? 0
  )
  const programaActivo =
    (config?.find((c) => c.clave === 'programa_referidos_activo')?.valor ?? 'false') === 'true'

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Configuración</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Pagos y referidos</h1>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-ink">Formas de pago</h2>
        <p className="text-sm text-muted">
          Esto es lo que ve el cliente en su portal antes de reportar un pago. Puedes agregar,
          editar u ocultar cuantas formas de pago necesites.
        </p>
        <FormFormasPago formasPago={formasPago ?? []} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-ink">Programa de referidos</h2>
        <FormConfigReferidos montoMinimoInicial={montoMinimo} programaActivoInicial={programaActivo} />
      </section>
    </div>
  )
}
