'use client'

// =============================================================
// COMPONENTES: acciones-ia.tsx
// PORTAL: Mothership (staff / admin)
//  - TarjetaAccionIA: una acción propuesta por el asistente, con los botones
//    para aprobar, rechazar o cerrarla una vez ejecutada.
//  - ControlIA: interruptor general del asistente y tope de dinero por lote.
// Toda decisión pasa por funciones de la BD (fn_ia_decidir_accion,
// fn_ia_marcar_resultado) que verifican el rol. La IA no puede decidir.
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2, X } from 'lucide-react'

export type AccionIA = {
  id: string
  tipo: string
  titulo: string
  descripcion: string | null
  payload: any
  riesgo: 'bajo' | 'medio' | 'alto' | 'dinero'
  estado: 'propuesta' | 'aprobada' | 'rechazada' | 'ejecutada' | 'fallida' | 'expirada'
  propuesta_en: string
  expira_en: string
  decidida_en: string | null
  motivo: string | null
  resultado: any
}

const ESTILO_RIESGO: Record<string, string> = {
  bajo: 'bg-signal/10 text-signal',
  medio: 'bg-line/40 text-muted',
  alto: 'bg-accent/10 text-accent',
  dinero: 'bg-accent/10 text-accent',
}
const ETIQUETA_RIESGO: Record<string, string> = {
  bajo: 'Riesgo bajo',
  medio: 'Riesgo medio',
  alto: 'Riesgo alto',
  dinero: 'Involucra dinero',
}
const ETIQUETA_ESTADO: Record<string, string> = {
  propuesta: 'Por decidir',
  aprobada: 'Aprobada: falta ejecutarla',
  rechazada: 'Rechazada',
  ejecutada: 'Ejecutada',
  fallida: 'Fallida',
  expirada: 'Expirada',
}

function fecha(iso: string | null) {
  return iso ? new Date(iso).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }) : '—'
}

export function TarjetaAccionIA({
  accion,
  puedeDecidir,
}: {
  accion: AccionIA
  puedeDecidir: boolean
}) {
  const supabase = createClient()
  const router = useRouter()

  const [trabajando, setTrabajando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [rechazando, setRechazando] = useState(false)
  const [nota, setNota] = useState('')

  const delicada = accion.riesgo === 'alto' || accion.riesgo === 'dinero'

  async function decidir(aprobar: boolean) {
    setTrabajando(true)
    setMensaje(null)
    const { error } = await supabase.rpc('fn_ia_decidir_accion', {
      p_id: accion.id,
      p_aprobar: aprobar,
      p_motivo: aprobar ? null : nota.trim() || null,
    })
    setTrabajando(false)
    if (error) {
      setMensaje(error.message)
      return
    }
    router.refresh()
  }

  async function cerrar(ok: boolean) {
    setTrabajando(true)
    setMensaje(null)
    const { error } = await supabase.rpc('fn_ia_marcar_resultado', {
      p_id: accion.id,
      p_ok: ok,
      p_resultado: nota.trim() ? { nota: nota.trim() } : {},
    })
    setTrabajando(false)
    if (error) {
      setMensaje(error.message)
      return
    }
    router.refresh()
  }

  const cargando = trabajando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ESTILO_RIESGO[accion.riesgo]}`}>
          {ETIQUETA_RIESGO[accion.riesgo]}
        </span>
        <span className="rounded-full bg-line/40 px-2 py-0.5 text-[11px] text-muted">
          {ETIQUETA_ESTADO[accion.estado]}
        </span>
        <span className="font-mono text-[11px] text-muted">{accion.tipo}</span>
      </div>

      <h3 className="mt-3 text-sm font-medium text-ink">{accion.titulo}</h3>
      {accion.descripcion && <p className="mt-1 text-sm text-muted">{accion.descripcion}</p>}

      {accion.payload && Object.keys(accion.payload).length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-accent">Ver detalle</summary>
          <pre className="mt-2 max-h-56 overflow-auto rounded-md bg-base p-3 text-[11px] text-muted">
            {JSON.stringify(accion.payload, null, 2)}
          </pre>
        </details>
      )}

      <p className="mt-3 text-[11px] text-muted">
        Propuesta {fecha(accion.propuesta_en)}
        {accion.estado === 'propuesta' && ` · expira ${fecha(accion.expira_en)}`}
        {accion.decidida_en && ` · decidida ${fecha(accion.decidida_en)}`}
        {accion.motivo && ` · motivo: ${accion.motivo}`}
      </p>

      {accion.estado === 'propuesta' && puedeDecidir && (
        <div className="mt-4 space-y-3">
          {delicada && !confirmando && !rechazando && (
            <p className="text-xs text-accent">
              {accion.riesgo === 'dinero'
                ? 'Esta acción involucra dinero. Revisa el detalle antes de aprobar.'
                : 'Esta acción es de riesgo alto. Revisa el detalle antes de aprobar.'}
            </p>
          )}

          {rechazando && (
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Motivo (opcional)"
              className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
            />
          )}

          <div className="flex flex-wrap gap-2">
            {!rechazando && (
              <button
                disabled={trabajando}
                onClick={() => (delicada && !confirmando ? setConfirmando(true) : decidir(true))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
              >
                {cargando ?? <Check className="h-4 w-4" />}
                {delicada && confirmando ? 'Confirmar aprobación' : 'Aprobar'}
              </button>
            )}
            <button
              disabled={trabajando}
              onClick={() => {
                if (rechazando) decidir(false)
                else {
                  setRechazando(true)
                  setConfirmando(false)
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm text-ink disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              {rechazando ? 'Confirmar rechazo' : 'Rechazar'}
            </button>
            {(confirmando || rechazando) && (
              <button
                onClick={() => {
                  setConfirmando(false)
                  setRechazando(false)
                  setNota('')
                }}
                className="px-2 text-sm text-muted"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {accion.estado === 'propuesta' && !puedeDecidir && (
        <p className="mt-3 text-xs text-muted">
          Solo admin o super_admin pueden decidir esta acción.
        </p>
      )}

      {accion.estado === 'aprobada' && puedeDecidir && (
        <div className="mt-4 space-y-3">
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota (opcional): cómo se ejecutó, referencia, etc."
            className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
          />
          <div className="flex flex-wrap gap-2">
            <button
              disabled={trabajando}
              onClick={() => cerrar(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
            >
              {cargando ?? <Check className="h-4 w-4" />}
              Marcar como ejecutada
            </button>
            <button
              disabled={trabajando}
              onClick={() => cerrar(false)}
              className="rounded-lg border border-line px-4 py-2 text-sm text-ink disabled:opacity-50"
            >
              Marcar como fallida
            </button>
          </div>
        </div>
      )}

      {accion.resultado && Object.keys(accion.resultado).length > 0 && (
        <p className="mt-3 text-xs text-muted">Resultado: {JSON.stringify(accion.resultado)}</p>
      )}

      {mensaje && <p className="mt-3 text-sm text-muted">{mensaje}</p>}
    </div>
  )
}

// ---------------------------------------------------------------
// Interruptor general y tope de dinero
// ---------------------------------------------------------------
export function ControlIA({
  activaInicial,
  topeInicial,
}: {
  activaInicial: boolean
  topeInicial: number
}) {
  const supabase = createClient()
  const router = useRouter()

  const [activa, setActiva] = useState(activaInicial)
  const [tope, setTope] = useState(String(topeInicial))
  const [topeGuardado, setTopeGuardado] = useState(String(topeInicial))
  const [trabajando, setTrabajando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  async function cambiarActiva() {
    setTrabajando(true)
    setMensaje(null)
    const nuevo = !activa
    const { error } = await supabase
      .from('configuracion_global')
      .update({ valor: nuevo ? 'true' : 'false', updated_at: new Date().toISOString() })
      .eq('clave', 'ia_activa')
    setTrabajando(false)
    if (error) {
      setMensaje('No se pudo cambiar: ' + error.message)
      return
    }
    setActiva(nuevo)
    router.refresh()
  }

  async function guardarTope() {
    const n = Number(tope)
    if (tope.trim() === '' || Number.isNaN(n) || n < 0 || n > 1000000) {
      setMensaje('El tope debe ser un número entre 0 y 1.000.000.')
      return
    }
    setTrabajando(true)
    setMensaje(null)
    const { error } = await supabase
      .from('configuracion_global')
      .update({ valor: String(n), updated_at: new Date().toISOString() })
      .eq('clave', 'ia_tope_pago_lote_usd')
    setTrabajando(false)
    if (error) {
      setMensaje('No se pudo guardar: ' + error.message)
      return
    }
    setTopeGuardado(tope)
    setMensaje('Guardado.')
    router.refresh()
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-6">
      <h2 className="font-display text-lg text-ink">Control del asistente</h2>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            activa ? 'bg-signal/10 text-signal' : 'bg-line/40 text-muted'
          }`}
        >
          {activa ? 'Encendido' : 'Apagado'}
        </span>
        <button
          onClick={cambiarActiva}
          disabled={trabajando}
          className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink disabled:opacity-50"
        >
          {activa ? 'Apagar asistente' : 'Encender asistente'}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Apagado, el asistente no puede proponer nada. Es el freno de emergencia.
      </p>

      <div className="mt-5 border-t border-line pt-4">
        <p className="text-sm text-ink">Tope de dinero por lote</p>
        <p className="mt-0.5 text-xs text-muted">
          Monto máximo que el asistente puede proponer en un lote de pagos. En 0 no puede proponer
          ninguna acción que mueva dinero. Aun con tope, cada lote lo aprueba una persona.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min={0}
            step={1}
            value={tope}
            onChange={(e) => {
              setTope(e.target.value)
              setMensaje(null)
            }}
            className="w-28 rounded-md border border-line bg-base px-2 py-1.5 font-mono text-sm text-ink"
          />
          <span className="text-xs text-muted">USD</span>
          <button
            onClick={guardarTope}
            disabled={trabajando || tope === topeGuardado}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-base disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
            Guardar
          </button>
        </div>
      </div>

      {mensaje && <p className="mt-3 text-sm text-muted">{mensaje}</p>}
    </section>
  )
}
