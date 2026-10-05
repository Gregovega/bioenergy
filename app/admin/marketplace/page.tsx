import { createClient } from '@/lib/supabase/server'
import { MarketplaceAprobaciones } from '@/components/admin/marketplace-aprobaciones'

// =============================================================
// PÁGINA: /admin/marketplace
// Bandeja de ventas pendientes de aprobación. El admin revisa el
// comprobante subido por el comprador y aprueba o rechaza.
// =============================================================

export default async function AdminMarketplacePage() {
  const supabase = await createClient()

  const { data: pendientes } = await supabase
    .from('marketplace_listado')
    .select(
      'id, precio_listado_usd, equipo_numero_serie, equipo_modelo, cantidad_participaciones, comprobante_pago_url, fecha_solicitud_compra, vendedor:vendedor_id(nombre), comprador:comprador_id(nombre)'
    )
    .eq('estado', 'pendiente_aprobacion')
    .order('fecha_solicitud_compra', { ascending: true })

  const normalizados = (pendientes ?? []).map((p: any) => ({
    ...p,
    vendedor: Array.isArray(p.vendedor) ? p.vendedor[0] ?? null : p.vendedor ?? null,
    comprador: Array.isArray(p.comprador) ? p.comprador[0] ?? null : p.comprador ?? null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Marketplace</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Ventas pendientes de aprobar</h1>
      </div>
      <MarketplaceAprobaciones pendientes={normalizados} />
    </div>
  )
}
