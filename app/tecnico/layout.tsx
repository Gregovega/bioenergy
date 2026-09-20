import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/sign-out-button'
import { Wrench } from 'lucide-react'

// =============================================================
// LAYOUT: /tecnico
// Portal simple para el equipo de instalación. Requiere que el
// usuario tenga una fila en `staff` con rol = 'tecnico' (se crea
// a mano en Supabase por ahora, igual que el resto del staff).
// =============================================================

export default async function TecnicoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: staffRow } = await supabase
    .from('staff')
    .select('rol')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!staffRow || staffRow.rol !== 'tecnico') redirect('/')

  return (
    <div className="min-h-screen bg-base font-sans text-ink">
      <header className="border-b border-line bg-surface/60 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4">
          <Wrench className="h-5 w-5 text-accent" strokeWidth={2.5} />
          <span className="font-display text-lg tracking-tight">Instalaciones</span>
          <span className="ml-auto">
            <SignOutButton />
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-8">{children}</main>
    </div>
  )
}
