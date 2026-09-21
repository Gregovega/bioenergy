'use client'

// =============================================================
// COMPONENTE: form-gasto-empresa.tsx
// PORTAL: Mothership (staff/admin financiero)
// QUÉ HACE: registra un gasto de la empresa y lo descuenta de la
// bolsa elegida (caja chica o reserva) llamando a
// fn_registrar_gasto_empresa. La base de datos valida contra lo
// DISPONIBLE de esa bolsa; aquí solo se avisa antes para no
// esperar al error.
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2 } from 'lucide-react'

type Bolsa = 'caja_chica' | 'reserva'

const NOMBRE_BOLSA: Record<Bolsa, string> = {
  caja_chica: 'Caja chica',
  reserva: 'Reserva',
}

const CATEGORIAS_SUGERIDAS = [
  'Operativo',
  'Transporte',
  'Herramientas y repuestos',
  'Servicios',
  'Nómina',
  'Compra de equipos',
  'Otro',
]

function usd(n: number) {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function FormGastoEmpresa({
  disponibleCajaChica,
  disponibleReserva,
  bloqueado,
}: {
  disponibleCajaChica: number
  disponibleReserva: number
  bloqueado: boolean
}) {
  const supabase = createClient()
  const router = useRouter()

  const [bolsa, setBolsa] = useState<Bolsa>('caja_chica')
  const [montoTexto, setMontoTexto] = useState('')
  const [concepto, setConcepto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const disponible = bolsa === 'caja_chica' ? disponibleCajaChica : disponibleReserva
  // Acepta coma o punto decimal.
  const monto = Number(montoTexto.replace(',', '.'))
  const montoValido = Number.isFinite(monto) && monto > 0
  const excede = montoValido && monto > disponible
  const quedaria = montoValido ? disponible - monto : null

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setMensaje(null)

    if (!montoValido) {
      setMensaje({ tipo: 'error', texto: 'Escribe un monto mayor a 0.' })
      return
    }
    if (!concepto.trim()) {
      setMensaje({ tipo: 'error', texto: 'El concepto es obligatorio.' })
      return
    }
    if (excede) {
      setMensaje({
        tipo: 'error',
        texto: `Excede lo disponible en ${NOMBRE_BOLSA[bolsa]} (${usd(disponible)}).`,
      })
      return
    }

    setGuardando(true)
    const { error } = await supabase.rpc('fn_registrar_gasto_empresa', {
      p_bolsa: bolsa,
      p_monto: monto,
      p_concepto: concepto.trim(),
      p_categoria: categoria.trim() || null,
    })
    setGuardando(false)

    if (error) {
      setMensaje({ tipo: 'error', texto: 'No se pudo registrar: ' + error.message })
      return
    }

    setMontoTexto('')
    setConcepto('')
    setCategoria('')
    setMensaje({ tipo: 'ok', texto: 'Gasto registrado.' })
    router.refresh()
  }

  return (
    <form onSubmit={guardar} className="space-y-4 rounded-lg border border-line bg-surface p-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Descontar de</label>
        <div className="flex gap-2">
          {(['caja_chica', 'reserva'] as Bolsa[]).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBolsa(b)}
              className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition ${
                bolsa === b
                  ? 'border-accent bg-accent/10 text-ink'
                  : 'border-line text-muted hover:text-ink'
              }`}
            >
              <span className="block">{NOMBRE_BOLSA[b]}</span>
              <span className="block font-mono text-xs text-muted">
                {usd(b === 'caja_chica' ? disponibleCajaChica : disponibleReserva)} disponible
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Monto (USD)</label>
        <input
          type="text"
          inputMode="decimal"
          value={montoTexto}
          onChange={(e) => setMontoTexto(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
        />
        {excede && (
          <p className="mt-1 text-[11px] text-red-500">
            Excede lo disponible en {NOMBRE_BOLSA[bolsa]}.
          </p>
        )}
        {quedaria !== null && !excede && (
          <p className="mt-1 text-[11px] text-muted">
            Después de este gasto quedarían {usd(quedaria)} en {NOMBRE_BOLSA[bolsa]}.
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Concepto</label>
        <input
          type="text"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Ej. Gasolina para la visita técnica"
          className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Categoría (opcional)</label>
        <input
          type="text"
          list="categorias-gasto"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
        />
        <datalist id="categorias-gasto">
          {CATEGORIAS_SUGERIDAS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      {mensaje && (
        <p className={`text-sm ${mensaje.tipo === 'ok' ? 'text-signal' : 'text-red-500'}`}>
          {mensaje.texto}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando || bloqueado || excede}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
      >
        {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Registrar gasto
      </button>
    </form>
  )
}
