import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/sign-out-button'
import { Zap } from 'lucide-react'

export default async function InversionistaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: inversionista } = await supabase
    .from('inversionista')
    .select('id, nombre')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!inversionista) redirect('/')

  return (
    <div className="min-h-screen bg-base font-sans text-ink">
      <header className="border-b border-line bg-surface/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <Zap className="h-5 w-5 text-accent" strokeWidth={2.5} />
          <span className="font-display text-lg tracking-tight">
            Portal del Inversionista
          </span>
          <span className="ml-4 text-sm text-muted">{inversionista.nombre}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
