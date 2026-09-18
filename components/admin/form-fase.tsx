// =============================================================
// COMPONENTE: form-fase.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: crea una nueva fase de inversión (nombre, tope,
// % de bono, vigencia). El admin define todos los valores
// manualmente — nada viene fijo en el código.
// =============================================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function FormFase() {
  const supabase = createClient()
  const router = useRouter()

  // Todos los numéricos se guardan como TEXTO para que el campo pueda quedar
  // vacío: si se guardan como número, arrancan en 0 y al escribir encima
  // queda "050000".
  const [nombre, setNombre] = useState('')
  const [montoTopeTexto, setMontoTopeTexto] = useState('')
  const [porcentajeBonoTexto, setPorcentajeBonoTexto] = useState('')
  const [vigenciaMesesTexto, setVigenciaMesesTexto] = useState('')
  // Tramos de precio de participación para ESTA fase (editables por el admin)
  const [precioTramo1, setPrecioTramo1] = useState('30')
  const [precioTramo2, setPrecioTramo2] = useState('25')
  const [precioTramo3, setPrecioTramo3] = useState('20')
  const [umbralTramo1, setUmbralTramo1] = useState('900')
  const [umbralTramo2, setUmbralTramo2] = useState('2000')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const montoTope = Number(montoTopeTexto) || 0
  const porcentajeBono = Number(porcentajeBonoTexto) || 0

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError('El nombre de la fase es obligatorio.')
      return
    }
    if (montoTope <= 0) {
      setError('El tope debe ser mayor a 0.')
      return
    }
    if (porcentajeBono < 0 || porcentajeBono > 100) {
      setError('El porcentaje debe estar entre 0 y 100.')
      return
    }

    setGuardando(true)

    // Averigua cuál es el siguiente número de orden (fase 1, 2, 3...)
    const { data: ultimaFase } = await supabase
      .from('fase_inversion')
      .select('orden')
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()

    const siguienteOrden = (ultimaFase?.orden ?? 0) + 1

    const { error: errInsert } = await supabase.from('fase_inversion').insert({
      orden: siguienteOrden,
      nombre: nombre.trim(),
      monto_tope_usd: montoTope,
      porcentaje_bono: porcentajeBono / 100,
      vigencia_meses: vigenciaMesesTexto === '' ? null : Number(vigenciaMesesTexto),
      estado: 'abierta',
      precio_tramo1_usd: Number(precioTramo1) || 30,
      precio_tramo2_usd: Number(precioTramo2) || 25,
      precio_tramo3_usd: Number(precioTramo3) || 20,
      umbral_tramo1_usd: Number(umbralTramo1) || 900,
      umbral_tramo2_usd: Number(umbralTramo2) || 2000,
    })

    if (errInsert) {
      setError('No se pudo crear la fase: ' + errInsert.message)
      setGuardando(false)
      return
    }

    router.push('/admin/fases')
    router.refresh()
  }

  return (
    <form onSubmit={guardar} className="space-y-6 rounded-lg border border-line bg-surface p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Nombre de la fase</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Fundadores"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Tope de captación (USD)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={montoTopeTexto}
            onChange={(e) => setMontoTopeTexto(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            % de bono de expansión
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={porcentajeBonoTexto}
            onChange={(e) => setPorcentajeBonoTexto(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
          <p className="mt-1 text-[11px] text-muted">
            % sobre el ingreso de los equipos propios de la empresa que se destina a esta fase.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Vigencia del bono (meses, opcional)
          </label>
          <input
            type="number"
            min={0}
            value={vigenciaMesesTexto}
            onChange={(e) => setVigenciaMesesTexto(e.target.value)}
            placeholder="Ej. 36 (déjalo vacío para sin límite)"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
      </div>

      {/* Tramos de precio de participación para esta fase */}
      <div className="rounded-lg border border-line bg-base p-4">
        <h3 className="mb-1 font-display text-sm text-ink">Precios de participación de esta fase</h3>
        <p className="mb-4 text-[11px] text-muted">
          El precio que paga el inversionista por cada participación según cuánto lleve invertido
          en total. Al repartir ganancias, toda participación vale lo mismo sin importar lo que se
          pagó por ella — quien entra en el tramo alto simplemente compra menos participaciones con
          el mismo dinero.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Precio tramo 1 (USD)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={precioTramo1}
              onChange={(e) => setPrecioTramo1(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Precio tramo 2 (USD)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={precioTramo2}
              onChange={(e) => setPrecioTramo2(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Precio tramo 3 (USD)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={precioTramo3}
              onChange={(e) => setPrecioTramo3(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Hasta cuánto acumulado aplica el tramo 1 (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={umbralTramo1}
              onChange={(e) => setUmbralTramo1(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Hasta cuánto acumulado aplica el tramo 2 (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={umbralTramo2}
              onChange={(e) => setUmbralTramo2(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted">
          Resumen: hasta ${umbralTramo1 || 0} acumulados paga ${precioTramo1 || 0} por participación
          · de ${umbralTramo1 || 0} a ${umbralTramo2 || 0} paga ${precioTramo2 || 0} · por encima de
          ${umbralTramo2 || 0} paga ${precioTramo3 || 0}. El monto mínimo de compra es siempre el
          precio de 1 participación del tramo que le toque.
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : 'Crear fase'}
      </button>
    </form>
  )
}
