'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react'
import { CONTENIDO_ONBOARDING } from '@/lib/onboarding-contenido'

// =============================================================
// OnboardingGate (punto 8)
// Uso: <OnboardingGate rol="admin" /> dentro de cualquier layout
// que ya sepa el rol del usuario (staff/tecnico/inversionista/
// cliente). No requiere nada más: revisa solo, muestra el tour
// obligatorio si falta, y llama a fn_completar_onboarding al
// terminar. No se puede cerrar ni saltar a mitad de camino.
// =============================================================

export function OnboardingGate({ rol }: { rol: string }) {
  const [visible, setVisible] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [paso, setPaso] = useState(0) // 0 = bienvenida, 1..N = pasos del tour
  const [enviando, setEnviando] = useState(false)
  const supabase = createClient()

  const contenido = CONTENIDO_ONBOARDING[rol]

  useEffect(() => {
    async function revisar() {
      const { data } = await supabase
        .from('onboarding_estado')
        .select('completado_en')
        .maybeSingle()
      if (!data || !data.completado_en) setVisible(true)
      setCargando(false)
    }
    if (contenido) revisar()
    else setCargando(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (cargando || !visible || !contenido) return null

  const totalPasos = contenido.pasos.length
  const esBienvenida = paso === 0
  const esUltimo = paso === totalPasos
  const actual = esBienvenida ? contenido.bienvenida : contenido.pasos[paso - 1]

  async function finalizar() {
    setEnviando(true)
    await supabase.rpc('fn_completar_onboarding', { p_rol: rol })
    setEnviando(false)
    setVisible(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/90 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-xl">
        <div className="flex items-center gap-2 text-accent">
          {esUltimo ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          <span className="text-xs font-medium uppercase tracking-widest">
            {esBienvenida ? 'Bienvenida' : `Paso ${paso} de ${totalPasos}`}
          </span>
        </div>

        <h2 className="mt-3 font-display text-xl text-ink">{actual.titulo}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{actual.contenido}</p>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {Array.from({ length: totalPasos + 1 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === paso ? 'bg-accent' : 'bg-line'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {paso > 0 && (
              <button
                onClick={() => setPaso((p) => p - 1)}
                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Atrás
              </button>
            )}
            <button
              onClick={() => (paso < totalPasos ? setPaso((p) => p + 1) : finalizar())}
              disabled={enviando}
              className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-base transition hover:opacity-90 disabled:opacity-50"
            >
              {paso < totalPasos ? 'Siguiente' : 'Comenzar a usar el panel'}
              {paso < totalPasos && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
