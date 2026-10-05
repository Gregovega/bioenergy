import { createClient } from '@/lib/supabase/server'
import { MarketplaceMisFracciones } from '@/components/inversionista/marketplace-mis-fracciones'
import { MarketplaceExplorar } from '@/components/inversionista/marketplace-explorar'

// =============================================================
// PÁGINA: /inversionista/marketplace
// Dos bloques: (1) mis fracciones activas, para listarlas o
// cancelar un listado que ya tenga; (2) listados activos de
// otros inversionistas, para explorar y comprar.
// =============================================================

export default async function MarketplacePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: inversionista } = await supabase
    .from('inversionista')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const [{ data: fracciones }, { data: misListados }, { data: config }, { data: listadosAjenos }] =
    await Promise.all([
      supabase
        .from('fraccion')
        .select(
          'id, cantidad_participaciones, precio_entrada_usd, fecha_compra, plazo_meses, equipo(numero_serie, modelo)'
        )
        .eq('estado', 'activa')
        .eq('inversionista_id', inversionista?.id ?? ''),
      supabase
        .from('marketplace_listado')
        .select('id, fraccion_id, precio_listado_usd, precio_referencia_usd, estado, motivo_rechazo')
        .eq('vendedor_id', inversionista?.id ?? '')
        .in('estado', ['activo', 'pendiente_aprobacion']),
      supabase
        .from('configuracion_global')
        .select('clave, valor')
        .in('clave', ['marketplace_banda_precio_pct', 'marketplace_tenencia_minima_meses']),
      supabase
        .from('marketplace_listado')
        .select(
          'id, precio_listado_usd, precio_referencia_usd, equipo_numero_serie, equipo_modelo, cantidad_participaciones, plazo_meses_fraccion, fecha_compra_fraccion, fecha_listado, vendedor_id'
        )
        .eq('estado', 'activo')
        .neq('vendedor_id', inversionista?.id ?? ''),
    ])

  const bandaPct = Number(
    config?.find((c) => c.clave === 'marketplace_banda_precio_pct')?.valor ?? 0.3
  )
  const tenenciaMinimaMeses = Number(
    config?.find((c) => c.clave === 'marketplace_tenencia_minima_meses')?.valor ?? 12
  )

  const fraccionesNormalizadas = (fracciones ?? []).map((f: any) => ({
    ...f,
    equipo: Array.isArray(f.equipo) ? f.equipo[0] ?? null : f.equipo ?? null,
  }))

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Marketplace
        </p>
        <h1 className="mt-1 font-display text-2xl text-ink">Compra y venta de fracciones</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Puedes vender una fracción una vez que cumpla {tenenciaMinimaMeses} meses en tu poder, a
          un precio dentro de ±{Math.round(bandaPct * 100)}% del valor de referencia. Cada venta
          pasa por aprobación del equipo antes de completarse.
        </p>
      </div>

      <MarketplaceMisFracciones
        fracciones={fraccionesNormalizadas}
        misListados={misListados ?? []}
        bandaPct={bandaPct}
        tenenciaMinimaMeses={tenenciaMinimaMeses}
      />

      <MarketplaceExplorar listados={listadosAjenos ?? []} userId={user!.id} />
    </div>
  )
}
