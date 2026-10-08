import { createClient } from '@/lib/supabase/server'
import { Target } from 'lucide-react'

// =============================================================
// COMPONENTE: marcador-recuperacion.tsx  (Portal del Inversionista)
// QUÉ HACE: muestra cuánto de su inversión ha recuperado el
// inversionista con los dividendos recibidos. Al llegar a 100% todo
// lo que sigue es ganancia.
// DATOS: función fn_recuperacion_inversionista() (RLS: solo ve lo suyo).
// FASE 1: todo en dólares (la unidad actual del sistema).
// FASE 2 (cuando se decida la política de tasa, P-039): agregar
// bolívares, tasa BCV y equivalente en dólares reales por pago.
// =============================================================

function usd(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function MarcadorRecuperacion() {
  const supabase = await createClient()
  const { data } = await supabase.rpc('fn_recuperacion_inversionista')
  const fila: any = Array.isArray(data) ? data[0] : data
  if (!fila) return null

  const capital = Number(fila.capital_usd ?? 0)
  if (capital <= 0) return null

  const cobrado = Number(fila.cobrado_usd ?? 0)
  const pct = Number(fila.pct_recuperado ?? 0)
  const falta = Number(fila.falta_usd ?? 0)
  const ganancia = Number(fila.ganancia_usd ?? 0)
  const pagos = Number(fila.pagos_recibidos ?? 0)
  const promedio = Number(fila.promedio_mensual_usd ?? 0)
  const pctMensual = Number(fila.pct_mensual_sobre_capital ?? 0)
  const mesesRestantes: number | null =
    fila.meses_estimados_restantes === null || fila.meses_estimados_restantes === undefined
      ? null
      : Number(fila.meses_estimados_restantes)

  const recuperada = pct >= 100
  const barra = Math.min(Math.max(pct, 0), 100)
  const mostrarProyeccion =
    !recuperada && pagos >= 2 && mesesRestantes !== null && mesesRestantes > 0 && mesesRestantes <= 120

  const mensaje = recuperada
    ? '¡Ya recuperaste tu inversión! Desde aquí, cada pago que recibes es ganancia.'
    : cobrado > 0
      ? `Has recibido ${usd(cobrado)} de ${usd(capital)} invertidos. Te faltan ${usd(falta)} para recuperar tu inversión.`
      : 'Aquí verás cómo avanza la recuperación de tu inversión con cada pago que recibas.'

  return (
    <section className="rounded-lg border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-accent" strokeWidth={2} />
          <h2 className="font-display text-lg text-ink">Recuperación de tu inversión</h2>
        </div>
        <span className={`font-mono text-2xl ${recuperada ? 'text-signal' : 'text-accent'}`}>
          {pct.toFixed(1)}%
        </span>
      </div>

      <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-line/50">
        <div
          className={`h-full rounded-full ${recuperada ? 'bg-signal' : 'bg-accent'}`}
          style={{ width: `${barra}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>

      <p className="mt-4 text-sm text-ink">{mensaje}</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="font-mono text-lg text-ink">{usd(cobrado)}</p>
          <p className="text-xs text-muted">Has recibido</p>
        </div>
        <div>
          <p className="font-mono text-lg text-ink">{usd(recuperada ? ganancia : falta)}</p>
          <p className="text-xs text-muted">
            {recuperada ? 'Ganancia acumulada' : 'Te falta para recuperar'}
          </p>
        </div>
        <div>
          <p className="font-mono text-lg text-ink">
            {pagos > 0 ? usd(promedio) : '—'}
            {pagos > 0 && (
              <span className="ml-1.5 text-xs text-muted">({pctMensual.toFixed(2)}%)</span>
            )}
          </p>
          <p className="text-xs text-muted">Promedio mensual según tus pagos hasta hoy</p>
        </div>
      </div>

      {mostrarProyeccion && (
        <p className="mt-4 text-xs text-muted">
          Al ritmo de tus pagos hasta hoy, te faltarían unos {mesesRestantes}{' '}
          {mesesRestantes === 1 ? 'mes' : 'meses'}. Es una estimación basada en pagos anteriores,
          no una garantía.
        </p>
      )}

      <p className="mt-3 text-[11px] text-muted">
        Montos en dólares. Cuenta los dividendos acreditados, incluidos los que reinviertas; no
        incluye bonos ni referidos.
      </p>
    </section>
  )
}
