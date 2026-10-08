'use client'

// =============================================================
// COMPONENTE: chat-asistente.tsx
// PORTAL: Mothership (admin / super_admin)
// QUÉ HACE: chat con el asistente de IA. La conversación vive solo en
// esta pantalla (no se guarda). Lo que el asistente propone aparece en
// /admin/aprobaciones; aquí solo se avisa.
// =============================================================

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Send } from 'lucide-react'

type Msg = { rol: 'usuario' | 'asistente'; texto: string; propuestas?: number }

const SUGERENCIAS = [
  'Dame el resumen del negocio de hoy',
  '¿Qué pagos están pendientes de verificar?',
  '¿Hay leads sin atender?',
]

export function ChatAsistente({ deshabilitado }: { deshabilitado: boolean }) {
  const [mensajes, setMensajes] = useState<Msg[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fin = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, enviando])

  async function enviar(contenido: string) {
    const limpio = contenido.trim()
    if (!limpio || enviando) return

    const nuevos: Msg[] = [...mensajes, { rol: 'usuario', texto: limpio }]
    setMensajes(nuevos)
    setTexto('')
    setErrorMsg(null)
    setEnviando(true)

    try {
      const r = await fetch('/api/asistente', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ historial: nuevos.map((m) => ({ rol: m.rol, texto: m.texto })) }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setErrorMsg(data?.error ?? 'No se pudo obtener respuesta.')
      } else {
        setMensajes([
          ...nuevos,
          { rol: 'asistente', texto: data.respuesta, propuestas: (data.propuestas ?? []).length },
        ])
      }
    } catch {
      setErrorMsg('No se pudo conectar. Revisa tu conexión e intenta de nuevo.')
    }
    setEnviando(false)
  }

  return (
    <section className="flex flex-col rounded-lg border border-line bg-surface">
      <div className="max-h-[60vh] min-h-[16rem] space-y-4 overflow-y-auto p-5">
        {mensajes.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Pregúntame por el estado del negocio. Puedo consultar y proponer acciones, pero
              nada se ejecuta sin tu aprobación.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  disabled={deshabilitado || enviando}
                  onClick={() => enviar(s)}
                  className="rounded-lg border border-line px-3 py-1.5 text-left text-xs text-ink disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensajes.map((m, i) => (
          <div key={i} className={m.rol === 'usuario' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm ${
                m.rol === 'usuario' ? 'bg-accent/15 text-ink' : 'bg-base text-ink'
              }`}
            >
              {m.texto}
              {m.rol === 'asistente' && (m.propuestas ?? 0) > 0 && (
                <p className="mt-2 text-xs">
                  <Link href="/admin/aprobaciones" className="text-accent underline">
                    {m.propuestas === 1
                      ? 'Hay 1 propuesta esperando tu aprobación'
                      : `Hay ${m.propuestas} propuestas esperando tu aprobación`}
                  </Link>
                </p>
              )}
            </div>
          </div>
        ))}

        {enviando && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Pensando…
          </div>
        )}
        {errorMsg && <p className="text-sm text-accent">{errorMsg}</p>}
        <div ref={fin} />
      </div>

      <div className="flex items-end gap-2 border-t border-line p-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              enviar(texto)
            }
          }}
          rows={2}
          maxLength={4000}
          disabled={deshabilitado}
          placeholder={deshabilitado ? 'El asistente está apagado' : 'Escribe tu mensaje…'}
          className="flex-1 resize-none rounded-md border border-line bg-base px-3 py-2 text-sm text-ink disabled:opacity-50"
        />
        <button
          onClick={() => enviar(texto)}
          disabled={deshabilitado || enviando || !texto.trim()}
          aria-label="Enviar"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-base disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}
