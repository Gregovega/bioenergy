'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="ml-auto flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"
    >
      <LogOut className="h-3.5 w-3.5" />
      Salir
    </button>
  )
}
