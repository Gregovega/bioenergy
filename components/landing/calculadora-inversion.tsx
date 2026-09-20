'use client'

// =============================================================
// COMPONENTE: calculadora-inversion.tsx
// PÁGINA: landing pública (app/page.tsx)
// QUÉ HACE: simula cuántas participaciones y a qué precio le
// tocan a alguien según cuánto quiera invertir, usando los mismos
// tramos de precio ($30/$25/$20 según monto, editables por el
// admin en Fases de inversión) que usa el sistema real. También
// avisa si ese monto ya lo deja participando en el programa de
// referidos, usando el mínimo que el admin configuró en
// /admin/pagos. No hay checkout: el botón lleva a /login.
// =============================================================

import { useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import { FormularioLead } from './formulario-lead'

const MONTOS_RAPIDOS = [500, 1000, 2000, 5000]

export function CalculadoraInversion({
  tramo,
  minimoReferido,
}: {
  tramo: { precio1: number; precio2: number; precio3: number; umbral1: number; umbral2: number }
  minimoReferido: number
}) {
  const [montoTexto, setMontoTexto] = useState('1000')
  const monto = Number(montoTexto) || 0

  const { precio, participaciones, calificaReferido } = useMemo(() => {
    const precioActual =
      monto <= tramo.umbral1 ? tramo.precio1 : monto <= tramo.umbral2 ? tramo.precio2 : tramo.precio3
    return {
      precio: precioActual,
      participaciones: precioActual > 0 ? monto / precioActual : 0,
      calificaReferido: minimoReferido > 0 && monto >= minimoReferido,
    }
  }, [monto, tramo, minimoReferido])

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Lado izquierdo: input */}
        <div className="border-b border-line p-7 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 text-accent">
            <Calculator className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-widest">Calculadora</span>
          </div>
          <h3 className="mt-2 font-display text-xl text-ink">¿Cuánto quieres invertir?</h3>

          <div className="mt-5">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-base px-4 py-3">
              <span className="text-lg text-muted">$</span>
              <input
                type="number"
                min={0}
                step="10"
                value={montoTexto}
                onChange={(e) => setMontoTexto(e.target.value)}
                className="w-full bg-transparent text-2xl font-medium text-ink outline-none"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {MONTOS_RAPIDOS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMontoTexto(String(m))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    monto === m
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line text-muted hover:border-accent/40 hover:text-ink'
                  }`}
                >
                  ${m.toLocaleString('en-US')}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-muted">
            Mientras más inviertas en una misma entrada, mejor precio de participación consigues:
            hasta ${tramo.umbral1.toLocaleString('en-US')} el precio es ${tramo.precio1}, de ahí
            hasta ${tramo.umbral2.toLocaleString('en-US')} baja a ${tramo.precio2}, y por encima
            de eso queda en ${tramo.precio3}.
          </p>
        </div>

        {/* Lado derecho: resultado */}
        <div className="flex flex-col justify-between p-7">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted">
              Con ${monto > 0 ? monto.toLocaleString('en-US') : '0'} obtienes
            </p>
            <p className="mt-2 font-display text-4xl text-ink">
              {participaciones.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              <span className="ml-2 text-base font-normal text-muted">participaciones</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              a ${precio.toLocaleString('en-US')} por participación
            </p>

            {minimoReferido > 0 && (
              <p
                className={`mt-4 rounded-lg border px-3 py-2 text-xs ${
                  calificaReferido
                    ? 'border-signal/30 bg-signal/10 text-signal'
                    : 'border-line bg-base text-muted'
                }`}
              >
                {calificaReferido
                  ? `Con este monto ya participas en el programa de referidos (5% / 3% / 2%).`
                  : `A partir de $${minimoReferido.toLocaleString('en-US')} acumulados también participas en el programa de referidos.`}
              </p>
            )}
          </div>

          <FormularioLead
            origen="landing_calculadora"
            montoSugerido={monto}
            textoBoton="Quiero invertir esto"
            className="mt-6"
          />
        </div>
      </div>
    </div>
  )
}
