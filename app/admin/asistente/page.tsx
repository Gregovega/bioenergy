import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PROVEEDORES, IDS_PROVEEDORES, claveConfigurada } from '@/lib/ia/proveedores'
import { ChatAsistente } from '@/components/admin/chat-asistente'
import { SelectorProveedorIA, type InfoProveedor } from '@/components/admin/selector-proveedor-ia'

// =============================================================
// PÁGINA: /admin/asistente
// Chat con el asistente de IA y selección del proveedor (Anthropic, OpenAI,
// Google o DeepSeek). Solo super_admin y admin.
// =============================================================

export default async function AsistentePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: staff } = await supabase
    .from('staff')
    .select('rol')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!staff || !['super_admin', 'admin'].includes(staff.rol)) redirect('/admin')

  const { data: cfg } = await supabase
    .from('configuracion_global')
    .select('clave, valor')
    .like('clave', 'ia_%')
  const valor = (k: string) => (cfg ?? []).find((c: any) => c.clave === k)?.valor ?? ''

  const activa = valor('ia_activa') === 'true'
  const activo = valor('ia_proveedor') || 'anthropic'

  const proveedores: InfoProveedor[] = IDS_PROVEEDORES.map((id) => ({
    id,
    nombre: PROVEEDORES[id].nombre,
    claveEnv: PROVEEDORES[id].claveEnv,
    configurada: claveConfigurada(id),
    modelo: valor(`ia_modelo_${id}`),
  }))

  const listo = proveedores.find((p) => p.id === activo)
  const falta =
    !listo?.configurada
      ? `Falta la clave de ${listo?.nombre ?? activo} en Netlify (${listo?.claveEnv}).`
      : !listo?.modelo
        ? `Elige un modelo para ${listo.nombre}.`
        : null

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Asistente de IA</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Asistente</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Consulta el estado del negocio y pídele que prepare acciones. Todo lo que proponga
          espera tu decisión en{' '}
          <Link href="/admin/aprobaciones" className="text-accent underline">
            Aprobaciones
          </Link>
          .
        </p>
      </div>

      {!activa && (
        <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          El asistente está apagado. Enciéndelo en{' '}
          <Link href="/admin/aprobaciones" className="underline">
            Aprobaciones
          </Link>{' '}
          cuando estés listo.
        </div>
      )}
      {activa && falta && (
        <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          {falta}
        </div>
      )}

      <ChatAsistente deshabilitado={!activa || !!falta} />

      <SelectorProveedorIA proveedores={proveedores} activoInicial={activo} />
    </div>
  )
}
