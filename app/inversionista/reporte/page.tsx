import { createClient } from '@/lib/supabase/server'
import { Leaf, Zap as ZapIcon, Gift, Award, Download } from 'lucide-react'

// =============================================================
// PÁGINA: Reporte anual del inversionista ("dashboard estilo Excel")
// Resume, en una sola vista, todo lo que hoy vive repartido en
// billetera_movimiento: historial mes a mes, totales por año
// (listos para declaración de impuestos), impacto ambiental
// atribuible a sus participaciones, programa de referidos e
// insignias otorgadas.
// =============================================================

const ETIQUETAS_TIPO: Record<string, string> = {
  credito_dividendo: 'Dividendo',
  credito_bono_expansion: 'Bono de expansión',
  credito_referido: 'Bono de referido',
  credito_fondo_operativo: 'Fondo operativo',
  credito_margen_empresa: 'Margen empresa',
  retiro: 'Retiro',
  ajuste: 'Ajuste',
}

const MESES_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

function formatoUsd(n: number) {
  const signo = n < 0 ? '-' : ''
  return `${signo}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export default async function ReporteInversionistaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: inversionista } = await supabase
    .from('inversionista')
    .select('id, nombre, codigo_referido, categoria_socio, fase_inversion(nombre)')
    .eq('user_id', user!.id)
    .single()

  const fase = inversionista?.fase_inversion as { nombre: string } | { nombre: string }[] | null
  const nombreFase = Array.isArray(fase) ? fase[0]?.nombre ?? null : fase?.nombre ?? null

  const [{ data: movimientos }, { data: fracciones }, { data: reporteFiscal }, { data: insignias }] =
    await Promise.all([
      supabase
        .from('billetera_movimiento')
        .select('id, monto_usd, tipo, fecha')
        .order('fecha', { ascending: true })
        .limit(1000),
      supabase
        .from('fraccion')
        .select('porcentaje_propiedad, equipo(kwh_generados_total, co2_evitado_kg_total)')
        .eq('estado', 'activa'),
      supabase
        .from('vista_reporte_fiscal_anual')
        .select('anio, tipo, total_usd')
        .order('anio', { ascending: false }),
      supabase
        .from('inversionista_insignia')
        .select('fecha_otorgada, insignia(codigo, nombre, descripcion, icono)')
        .eq('inversionista_id', inversionista?.id ?? '')
        .order('fecha_otorgada', { ascending: false }),
    ])

  // --- Impacto ambiental atribuible (participación proporcional por equipo) ---
  const fraccionesNormalizadas = (fracciones ?? []).map((f: any) => ({
    porcentaje_propiedad: Number(f.porcentaje_propiedad ?? 0),
    equipo: Array.isArray(f.equipo) ? f.equipo[0] ?? null : f.equipo ?? null,
  }))
  const kwhAtribuibles = fraccionesNormalizadas.reduce(
    (acc, f) => acc + Number(f.equipo?.kwh_generados_total ?? 0) * f.porcentaje_propiedad,
    0
  )
  const co2Atribuible = fraccionesNormalizadas.reduce(
    (acc, f) => acc + Number(f.equipo?.co2_evitado_kg_total ?? 0) * f.porcentaje_propiedad,
    0
  )

  // --- Historial mensual (fila por mes, columna por tipo de movimiento) ---
  type FilaMensual = { clave: string; label: string; neto: number; montos: Record<string, number> }
  const mesesMap = new Map<string, FilaMensual>()

  for (const m of movimientos ?? []) {
    const fecha = new Date(m.fecha)
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    const label = `${MESES_ES[fecha.getMonth()]} ${fecha.getFullYear()}`

    if (!mesesMap.has(clave)) {
      mesesMap.set(clave, { clave, label, neto: 0, montos: {} })
    }
    const fila = mesesMap.get(clave)!
    const monto = Number(m.monto_usd)
    const esSalida = m.tipo === 'retiro'
    fila.montos[m.tipo] = (fila.montos[m.tipo] ?? 0) + monto
    fila.neto += esSalida ? -monto : monto
  }

  const filasMensuales = Array.from(mesesMap.values()).sort((a, b) => (a.clave < b.clave ? 1 : -1))

  let acumulado = 0
  const acumuladoPorClave = new Map<string, number>()
  for (const fila of [...filasMensuales].reverse()) {
    acumulado += fila.neto
    acumuladoPorClave.set(fila.clave, acumulado)
  }

  const columnasMovimiento = ['credito_dividendo', 'credito_bono_expansion', 'credito_referido', 'retiro']

  // --- Reporte fiscal anual (pivote año x tipo) ---
  type FilaAnual = { anio: number } & Record<string, number>
  const aniosMap = new Map<number, FilaAnual>()
  for (const r of reporteFiscal ?? []) {
    const anio = Number(r.anio)
    if (!aniosMap.has(anio)) aniosMap.set(anio, { anio } as FilaAnual)
    aniosMap.get(anio)![r.tipo] = Number(r.total_usd)
  }
  const filasAnuales = Array.from(aniosMap.values()).sort((a, b) => b.anio - a.anio)

  const totalGanadoReferidos = (movimientos ?? [])
    .filter((m) => m.tipo === 'credito_referido')
    .reduce((acc, m) => acc + Number(m.monto_usd), 0)

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl text-ink">Reporte anual</h1>
          <p className="mt-1 text-sm text-muted">
            Historial completo de tu billetera, impacto ambiental y programa de referidos —
            todo en una vista, lista para tus registros o declaración de impuestos.
          </p>
        </div>
        <div className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
          <Download className="h-3.5 w-3.5" />
          Puedes copiar cualquier tabla directo a Excel
        </div>
      </div>

      {/* Impacto ambiental */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-5">
          <ZapIcon className="h-4 w-4 text-accent" strokeWidth={2} />
          <p className="mt-4 font-mono text-2xl text-ink">
            {kwhAtribuibles.toLocaleString('en-US', { maximumFractionDigits: 0 })} kWh
          </p>
          <p className="mt-1 text-xs text-muted">
            Energía generada atribuible a tus participaciones
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5">
          <Leaf className="h-4 w-4 text-signal" strokeWidth={2} />
          <p className="mt-4 font-mono text-2xl text-ink">
            {co2Atribuible.toLocaleString('en-US', { maximumFractionDigits: 0 })} kg
          </p>
          <p className="mt-1 text-xs text-muted">CO₂ evitado atribuible a tus participaciones</p>
        </div>
      </section>

      {/* Reporte fiscal anual */}
      <section>
        <h2 className="mb-4 font-display text-lg text-ink">Totales por año (para impuestos)</h2>
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Año</th>
                <th className="px-4 py-3 font-medium text-right">Dividendos</th>
                <th className="px-4 py-3 font-medium text-right">Bono de expansión</th>
                <th className="px-4 py-3 font-medium text-right">Bono de referido</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filasAnuales.map((fila) => {
                const total =
                  (fila.credito_dividendo ?? 0) +
                  (fila.credito_bono_expansion ?? 0) +
                  (fila.credito_referido ?? 0)
                return (
                  <tr key={fila.anio} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-mono text-ink">{fila.anio}</td>
                    <td className="px-4 py-3 text-right font-mono text-ink">
                      {formatoUsd(fila.credito_dividendo ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-ink">
                      {formatoUsd(fila.credito_bono_expansion ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-ink">
                      {formatoUsd(fila.credito_referido ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-accent">
                      {formatoUsd(total)}
                    </td>
                  </tr>
                )
              })}
              {filasAnuales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Todavía no hay ingresos registrados en ningún año.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Historial mensual detallado */}
      <section>
        <h2 className="mb-4 font-display text-lg text-ink">Historial mes a mes</h2>
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Mes</th>
                {columnasMovimiento.map((col) => (
                  <th key={col} className="px-4 py-3 font-medium text-right">
                    {ETIQUETAS_TIPO[col]}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium text-right">Neto del mes</th>
                <th className="px-4 py-3 font-medium text-right">Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {filasMensuales.map((fila) => (
                <tr key={fila.clave} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono text-ink">{fila.label}</td>
                  {columnasMovimiento.map((col) => (
                    <td key={col} className="px-4 py-3 text-right font-mono text-muted">
                      {fila.montos[col] ? formatoUsd(fila.montos[col]) : '—'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-mono text-ink">
                    {formatoUsd(fila.neto)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-accent">
                    {formatoUsd(acumuladoPorClave.get(fila.clave) ?? 0)}
                  </td>
                </tr>
              ))}
              {filasMensuales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    Todavía no hay movimientos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Referidos e insignias */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <Gift className="h-4 w-4 text-accent" strokeWidth={2} />
            <h3 className="font-display text-base text-ink">Programa de referidos</h3>
          </div>
          <p className="mb-1 text-xs text-muted">Tu código</p>
          <p className="mb-4 font-mono text-lg tracking-widest text-accent">
            {inversionista?.codigo_referido ?? '—'}
          </p>
          <p className="mb-1 text-xs text-muted">Ganado por referidos hasta hoy</p>
          <p className="font-mono text-lg text-ink">{formatoUsd(totalGanadoReferidos)}</p>
        </div>

        <div className="rounded-lg border border-line bg-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-accent" strokeWidth={2} />
            <h3 className="font-display text-base text-ink">Insignias</h3>
            {nombreFase && (
              <span className="ml-auto rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                {nombreFase}
              </span>
            )}
          </div>
          <ul className="space-y-3">
            {(insignias ?? []).map((i: any, idx: number) => {
              const ins = Array.isArray(i.insignia) ? i.insignia[0] : i.insignia
              return (
                <li key={idx} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-ink">{ins?.nombre ?? '—'}</p>
                    {ins?.descripcion && <p className="text-xs text-muted">{ins.descripcion}</p>}
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(i.fecha_otorgada).toLocaleDateString('es-VE')}
                  </span>
                </li>
              )
            })}
            {(insignias ?? []).length === 0 && (
              <li className="text-sm text-muted">Aún no tienes insignias otorgadas.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  )
}
