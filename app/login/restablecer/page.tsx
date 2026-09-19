'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Zap, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

type EstadoEnlace = 'verificando' | 'valido' | 'invalido'

export default function RestablecerPasswordPage() {
  const [estadoEnlace, setEstadoEnlace] = useState<EstadoEnlace>('verificando')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [cargando, setCargando] = useState(false)
  const [listo, setListo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function verificarEnlace() {
      // El correo de Supabase puede llegar con un "code" en la URL (flujo PKCE)
      // o con el token directo en el hash (flujo implícito, manejado
      // automáticamente por el cliente al crearlo). Cubrimos ambos casos.
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setEstadoEnlace('invalido')
          return
        }
      }

      const { data } = await supabase.auth.getSession()
      setEstadoEnlace(data.session ? 'valido' : 'invalido')
    }

    verificarEnlace()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    const { error } = await supabase.auth.updateUser({ password })
    setCargando(false)

    if (error) {
      setError('No se pudo actualizar la contraseña. Intenta de nuevo.')
      return
    }

    setListo(true)
    setTimeout(() => {
      router.push('/portal')
      router.refresh()
    }, 2000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" strokeWidth={2.5} />
          <span className="font-display text-lg tracking-tight text-ink">Mothership</span>
        </div>

        {estadoEnlace === 'verificando' && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando enlace...
          </div>
        )}

        {estadoEnlace === 'invalido' && (
          <div className="space-y-4 text-center">
            <h1 className="font-display text-lg text-ink">Enlace inválido o vencido</h1>
            <p className="text-sm text-muted">
              Este enlace de recuperación ya no es válido. Solicita uno nuevo.
            </p>
            <Link
              href="/login/olvide-password"
              className="inline-flex items-center gap-1.5 text-sm text-accent transition hover:opacity-80"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Solicitar un nuevo enlace
            </Link>
          </div>
        )}

        {estadoEnlace === 'valido' && listo && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-signal/10">
              <CheckCircle2 className="h-6 w-6 text-signal" strokeWidth={2} />
            </div>
            <h1 className="font-display text-lg text-ink">Contraseña actualizada</h1>
            <p className="text-sm text-muted">Entrando a tu portal...</p>
          </div>
        )}

        {estadoEnlace === 'valido' && !listo && (
          <>
            <h1 className="mb-1 font-display text-lg text-ink">Crea tu nueva contraseña</h1>
            <p className="mb-6 text-sm text-muted">Mínimo 8 caracteres.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  required
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-sm text-alert">{error}</p>}

              <button
                type="submit"
                disabled={cargando}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-base transition hover:opacity-90 disabled:opacity-50"
              >
                {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar contraseña
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
