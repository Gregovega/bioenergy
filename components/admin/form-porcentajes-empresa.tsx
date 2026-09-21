'use client'

// =============================================================
// COMPONENTE: form-porcentajes-empresa.tsx
// PORTAL: Mothership (staff/admin financiero)
// QUÉ HACE: edita qué porcentaje de la base distribuible va a
// caja chica y cuál a reserva (fn_set_pct_empresa). Deben sumar
// 100% o menos; lo que no se asigna queda sin asignar. La base de
// datos rechaza bajar un porcentaje si esa bolsa ya gastó más de
// lo que le tocaría con el nuevo valor.
// NOTA: al cambiar el porcentaje se recalcula sobre todo el
// histórico (lo asignado se calcula sobre el acumulado).
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2 } from 'lucide-react'

function usd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function aTexto(fraccion: number) {
  return String(Number((fraccion * 100).toFixed(2)))
}

export function FormPorcentajesEmpresa({
  pctCajaChica,
  pctReserva,
  baseDistribuible,
}: {
  pctCajaChica: number
  pctReserva: number
  baseDistribuible: number
}) {
  const supabase = createClient()
  const router = useRouter()

  const [cajaTexto, setCajaTexto] = useState(aTexto(pctCajaChica))
  const [reservaTexto, setReservaTexto] = useState(aTexto(pctReserva))
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const caja = Number(cajaTexto.replace(',', '.'))
  const reserva = Number(reservaTexto.replace(',', '.'))
  const numerosValidos =
    Number.isFinite(caja) && Number.isFinite(reserva) && caja >= 0 && reserva >= 0
  const suma = numerosValidos ? caja + reserva : 0
  const excede = numerosValidos && suma > 100.0001
  const sinAsignar = numerosValidos ? Math.max(100 - suma, 0) : 0

  async function guardar() {
    setMensaje(null)
    if (!numerosValidos) {
      setMensaje({ tipo: 'error', texto: 'Escribe porcentajes válidos (números de 0 a 100).' })
      return
    }
    if (excede) {
      setMensaje({ tipo: 'error', texto: 'Caja chica + reserva no pueden superar 100%.' })
      return
    }

    setGuardando(true)
    const { error } = await supabase.rpc('fn_set_pct_empresa', {
      p_caja: Number((caja / 100).toFixed(4)),
      p_reserva: Number((reserva / 100).toFixed(4)),
    })
    setGuardando(false)

    if (error) {
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar: ' + error.message })
      return
    }
    setMensaje({ tipo: 'ok', texto: 'Porcentajes guardados.' })
    router.refresh()
  }

  return (
    <div className="space-y-4 rounded-lg border border-line bg-surface p-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Caja chica (%)</label>
          <input
            type="text"
            inputMode="decimal"
            value={cajaTexto}
            onChange={(e) => setCajaTexto(e.target.value)}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
          {numerosValidos && (
            <p className="mt-1 text-[11px] text-muted">
              ≈ {usd((baseDistribuible * caja) / 100)} de la base actual
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Reserva (%)</label>
          <input
            type="text"
            inputMode="decimal"
            value={reservaTexto}
            onChange={(e) => setReservaTexto(e.target.value)}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
          {numerosValidos && (
            <p className="mt-1 text-[11px] text-muted">
              ≈ {usd((baseDistribuible * reserva) / 100)} de la base actual
            </p>
          )}
        </div>
      </div>

      <p className={`text-xs ${excede ? 'text-red-500' : 'text-muted'}`}>
        {excede
          ? `Suman ${Number(suma.toFixed(2))}% — no pueden superar 100%.`
          : `Suman ${Number(suma.toFixed(2))}%${sinAsignar > 0 ? ` · ${Number(sinAsignar.toFixed(2))}% queda sin asignar` : ''}.`}
      </p>

      <p className="text-[11px] text-muted">
        Estos porcentajes son provisionales y se pueden cambiar cuando quieras. Al cambiarlos se
        recalcula todo el histórico, y no se permite bajar una bolsa por debajo de lo que ya gastó.
      </p>

      {mensaje && (
        <p className={`text-sm ${mensaje.tipo === 'ok' ? 'text-signal' : 'text-red-500'}`}>
          {mensaje.texto}
        </p>
      )}

      <button
        onClick={guardar}
        disabled={guardando || excede}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
      >
        {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Guardar porcentajes
      </button>
    </div>
  )
}
