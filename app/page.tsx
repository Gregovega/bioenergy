import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: esStaff } = await supabase.rpc('is_staff')
  if (esStaff) redirect('/admin')

  const { data: inversionista } = await supabase
    .from('inversionista')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (inversionista) redirect('/inversionista')

  const { data: cliente } = await supabase
    .from('cliente_final')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (cliente) redirect('/cliente')

  // Usuario autenticado pero sin rol asignado todavía en ninguna tabla.
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <h1 className="font-display text-xl text-ink">Cuenta sin acceso asignado</h1>
        <p className="mt-2 text-sm text-muted">
          Tu usuario existe pero todavía no está vinculado a un perfil de inversionista,
          cliente o staff. Contacta al administrador para que te asigne uno.
        </p>
      </div>
    </div>
  )
}
