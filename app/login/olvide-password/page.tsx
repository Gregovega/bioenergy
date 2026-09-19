'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Zap, Loader2, ArrowLeft, MailCheck } from 'lucide-react'

export default function OlvidePasswordPage() {
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login/restablecer`,
    })

    setCargando(false)

    // Se muestra el mismo mensaje exista o no la cuenta, para no revelar
    // qué correos están registrados (evita enumeración de usuarios).
    if (error && error.status && error.status >= 500) {
      setError('Hubo un problema enviando el correo. Intenta de nuevo en unos minutos.')
      return
    }

    setEnviado(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" strokeWidth={2.5} />
          <span className="font-display text-lg tracking-tight text-ink">Mothership</span>
        </div>

        {enviado ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-signal/10">
              <MailCheck className="h-6 w-6 text-signal" strokeWidth={2} />
            </div>
            <h1 className="font-display text-lg text-ink">Revisa tu correo</h1>
            <p className="text-sm text-muted">
              Si <span className="text-ink">{email}</span> tiene una cuenta con nosotros, te
              enviamos un enlace para restablecer tu contraseña. El enlace vence en 1 hora.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-accent transition hover:opacity-80"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-1 font-display text-lg text-ink">Restablecer contraseña</h1>
            <p className="mb-6 text-sm text-muted">
              Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted">
                  Correo
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  placeholder="tu@correo.com"
                />
              </div>

              {error && <p className="text-sm text-alert">{error}</p>}

              <button
                type="submit"
                disabled={cargando}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-base transition hover:opacity-90 disabled:opacity-50"
              >
                {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar enlace
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-muted transition hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver a iniciar sesión
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
