// =============================================================
// COMPONENTE: billetera-desglose.tsx
// PORTAL: Inversionista
// QUÉ HACE: Muestra el balance de billetera del inversionista,
// separando el dividendo normal del "Bono de Expansión del
// Ecosistema" (solo aplica a inversionistas con
// categoria_socio = 'fundador').
// =============================================================

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type MovimientoBilletera = {
  id: string
  monto_usd: number
  tipo: string
  estado: string
  fecha: string
}

type Props = {
  inversionistaId: string
}

const ETIQUETAS_TIPO: Record<string, { label: string; color: string }> = {
  credito_dividendo: { label: 'Dividendo', color: 'text-signal' },
  credito_bono_expansion: { label: 'Bono de Expansión (Fundador)', color: 'text-accent' },
  credito_fondo_operativo: { label: 'Fondo Operativo', color: 'text-muted' },
  credito_margen_empresa: { label: 'Margen Empresa', color: 'text-muted' },
}

export function BilleteraDesglose({ inversionistaId }: Props) {
  const [movimientos, setMovimientos] = useState<MovimientoBilletera[]>([])
  const [cargando, setCargando] = useState(true)
  const [esFundador, setEsFundador] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true)

      const { data: inv } = await supabase
        .from('inversionista')
        .select('categoria_socio')
        .eq('id', inversionistaId)
        .single()

      setEsFundador(inv?.categoria_socio === 'fundador')

      const { data: movs } = await supabase
        .from('billetera_movimiento')
        .select('id, monto_usd, tipo, estado, fecha')
        .eq('inversionista_id', inversionistaId)
        .order('fecha', { ascending: false })
        .limit(50)

      setMovimientos(movs ?? [])
      setCargando(false)
    }

    cargarDatos()
  }, [inversionistaId, supabase])

  const totalDividendos = movimientos
    .filter((m) => m.tipo === 'credito_dividendo')
    .reduce((acc, m) => acc + Number(m.monto_usd), 0)

  const totalBono = movimientos
    .filter((m) => m.tipo === 'credito_bono_expansion')
    .reduce((acc, m) => acc + Number(m.monto_usd), 0)

  const totalGeneral = totalDividendos + totalBono

  if (cargando) {
    return (
      <div className="animate-pulse rounded-lg border border-line bg-surface p-6">
        <div className="mb-4 h-4 w-32 rounded bg-line" />
        <div className="h-8 w-48 rounded bg-line" />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-6">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted">Balance total generado</h3>
        {esFundador && (
          <span className="rounded-full bg-accent/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
            Socio Fundador
          </span>
        )}
      </div>

      <p className="mb-6 font-mono text-3xl text-ink">${totalGeneral.toFixed(2)}</p>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-xs text-muted">Dividendos</p>
          <p className="font-mono text-lg text-signal">${totalDividendos.toFixed(2)}</p>
        </div>
        {esFundador && (
          <div>
            <p className="mb-1 text-xs text-muted">Bono de Expansión</p>
            <p className="font-mono text-lg text-accent">${totalBono.toFixed(2)}</p>
          </div>
        )}
      </div>

      <div className="border-t border-line pt-4">
        <h4 className="mb-3 text-xs font-medium text-muted">Movimientos recientes</h4>
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {movimientos.map((m) => {
            const meta = ETIQUETAS_TIPO[m.tipo] ?? { label: m.tipo, color: 'text-ink' }
            return (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className={meta.color}>{meta.label}</span>
                  <span className="text-[11px] text-muted">
                    {new Date(m.fecha).toLocaleDateString('es-VE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <span className="font-mono text-ink">+${Number(m.monto_usd).toFixed(2)}</span>
              </li>
            )
          })}
          {movimientos.length === 0 && (
            <li className="text-sm text-muted">Aún no hay movimientos registrados.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
