import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente de Supabase para usar dentro de Client Components
 * (formularios, botones con onClick, cualquier cosa interactiva).
 * Lee la sesión desde las cookies del navegador.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
