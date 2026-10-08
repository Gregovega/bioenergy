import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNav } from '@/components/admin/admin-nav'
import { OnboardingGate } from '@/components/onboarding/onboarding-gate'
import { CampanaNotificaciones } from '@/components/notificaciones/campana-notificaciones'
import { LogoBioenergy } from '@/components/brand/logo-bioenergy'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: staff } = await supabase
    .from('staff')
    .select('rol')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!staff) redirect('/')

  return (
    <div className="min-h-screen bg-base font-sans text-ink">
      <OnboardingGate rol={staff.rol} />
      <header className="border-b border-line bg-surface/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4">
          <LogoBioenergy size="md" />
          <span className="hidden rounded-full border border-line px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest text-muted sm:inline">
            Panel de administración
          </span>
          <CampanaNotificaciones />
          <span className="ml-auto truncate text-sm text-muted">{user.email}</span>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-4">
          <AdminNav rol={staff.rol} />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}
