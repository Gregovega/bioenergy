import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Zap } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: esStaff } = await supabase.rpc('is_staff')
  if (!esStaff) redirect('/')

  return (
    <div className="min-h-screen bg-base font-sans text-ink">
      <header className="border-b border-line bg-surface/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
          <Zap className="h-5 w-5 text-accent" strokeWidth={2.5} />
          <span className="font-display text-lg tracking-tight">Mothership</span>
          <span className="ml-auto text-sm text-muted">{user.email}</span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}
