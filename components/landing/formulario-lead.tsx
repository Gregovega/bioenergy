'use client'

// =============================================================
// COMPONENTE: formulario-lead.tsx
// PÁGINA: landing pública
// QUÉ HACE: reemplaza los botones que antes mandaban a /login (que
// solo sirve para quien YA tiene cuenta). Captura el interés de la
// persona en la tabla `lead` — sin necesidad de cuenta — para que
// el equipo la contacte y la convierta manualmente (KYC, cuenta,
// etc. los sigue haciendo el admin, como hoy). Si vino de un link
// de referido (?ref=codigo), lo guarda junto con el lead.
// =============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Check, Loader2 } from 'lucide-react'

export function FormularioLead({
  origen,
  montoSugerido,
  textoBoton = 'Quiero que me contacten',
  className = '',
}: {
  origen: string
  montoSugerido?: number
  textoBoton?: string
  className?: string
}) {
  const supabase = createClient()

  // Se lee directo del navegador (en vez de useSearchParams) para no
  // obligar a envolver la landing en <Suspense>.
  const [codigoReferido, setCodigoReferido] = useState<string | null>(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCodigoReferido(params.get('ref'))
  }, [])

  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [contacto, setContacto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !contacto.trim()) {
      setError('Necesito al menos tu nombre y un teléfono o correo para contactarte.')
      return
    }
    setEnviando(true)
    setError(null)

    const esEmail = contacto.includes('@')

    const { error: err } = await supabase.from('lead').insert({
      nombre: nombre.trim(),
      email: esEmail ? contacto.trim() : null,
      telefono: esEmail ? null : contacto.trim(),
      monto_interes_usd: montoSugerido ?? null,
      mensaje: mensaje.trim() || null,
      origen,
      codigo_referido: codigoReferido,
    })

    setEnviando(false)

    if (err) {
      setError('No se pudo enviar, intenta de nuevo en un momento.')
      return
    }
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div
        className={`flex items-center justify-center gap-2 rounded-lg border border-signal/30 bg-signal/10 px-6 py-3 text-sm font-medium text-signal ${className}`}
      >
        <Check className="h-4 w-4" />
        ¡Listo! Te contactamos muy pronto.
      </div>
    )
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className={`flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-base transition-opacity hover:opacity-90 ${className}`}
      >
        {textoBoton}
        <ArrowRight className="h-4 w-4" />
      </button>
    )
  }

  return (
    <form
      onSubmit={enviar}
      className={`space-y-3 rounded-xl border border-line bg-surface p-5 text-left ${className}`}
    >
      <div>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
        />
      </div>
      <div>
        <input
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          placeholder="Teléfono o correo"
          className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
        />
      </div>
      <div>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="¿Algo que quieras contarnos? (opcional)"
          rows={2}
          className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {enviando ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  )
}
