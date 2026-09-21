import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Wallet, TrendingUp, PieChart } from 'lucide-react'
import { DescargaInformeFiscal } from '@/components/inversionista/descarga-informe'
import type { Hoja } from '@/lib/xlsx-simple'

// =============================================================
// PÁGINA: /inversionista/informe  (punto 3 — panel del inversionista)
// Solo lo que le importa al inversionista: cuánto ganó, cuánto le
// corresponde por cada equipo y una descarga en Excel con los datos
// al día para su contador. Todo se lee con RLS (cada inversionista
// solo ve lo suyo). No escribe nada en la base de datos.
// Las fechas y el corte de año se calculan en UTC, igual que
// vista_reporte_fiscal_anual.
// =============================================================

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const ETIQUETAS_TIPO: Record<string, string> = {
  credito_dividendo: 'Dividendo',
  credito_bono_expansion: 'Bono de expansión',
  credito_referido: 'Comisión de referido',
  credito_fondo_operativo: 'Fondo operativo',
  credito_margen_empresa: 'Margen empresa',
  retiro: 'Retiro',
  ajuste: 'Ajuste',
}

const ETIQUETAS_RETIRO: Record<string, string> = {
  usdt: 'USDT',
  zelle: 'Zelle',
  pago_movil: 'Pago móvil',
  transferencia: 'Transferencia',
}

function usd(n: number) {
  const signo = n < 0 ? '-' : ''
  return `${signo}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

type Mov = {
  fecha: string
  tipo: string
  monto: number
  estado: string
  metodo: string | null
}

type FilaEquipo = {
  serie: string
  modelo: string
  estado: string
  origen: string
  participaciones: number
  porcentaje: number
  aportado: number
  divAnio: number
  divTotal: number
}

function fechaIso(fecha: string) {
  return new Date(fecha).toISOString().slice(0, 10)
}

type Props = {
  searchParams?: { anio?: string } | Promise<{ anio?: string }>
}

export default async function InformeFiscalInversionistaPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: inversionista } = await supabase
    .from('inversionista')
    .select('id, nombre, email, cedula')
    .eq('user_id', user!.id)
    .single()

  if (!inversionista) {
    return <p className="text-sm text-muted">No se encontró tu perfil de inversionista.</p>
  }

  const sp = await Promise.resolve(searchParams)
  const anioActual = new Date().getUTCFullYear()
  const anioPedido = Number(sp?.anio)
  const anio = Number.isInteger(anioPedido) && anioPedido >= 2020 && anioPedido <= anioActual + 1
    ? anioPedido
    : anioActual

  const [{ data: movs }, { data: aniosData }, { data: dividendos }, { data: fracciones }] =
    await Promise.all([
      supabase
        .from('billetera_movimiento')
        .select('id, monto_usd, tipo, estado, metodo_retiro, fecha')
        .eq('inversionista_id', inversionista.id)
        .gte('fecha', `${anio}-01-01T00:00:00Z`)
        .lt('fecha', `${anio + 1}-01-01T00:00:00Z`)
        .order('fecha', { ascending: true })
        .limit(5000),
      supabase
        .from('vista_reporte_fiscal_anual')
        .select('anio')
        .eq('inversionista_id', inversionista.id),
      supabase
        .from('dividendo')
        .select('fraccion_id, monto_usd, fecha_acreditacion')
        .eq('inversionista_id', inversionista.id)
        .limit(20000),
      supabase
        .from('fraccion')
        .select(
          'id, monto_aportado_usd, porcentaje_propiedad, cantidad_participaciones, estado, origen, fecha_compra, equipo(numero_serie, modelo)'
        )
        .eq('inversionista_id', inversionista.id)
        .order('fecha_compra', { ascending: true }),
    ])

  const aniosDisponibles = Array.from(
    new Set([anioActual, anio, ...(aniosData ?? []).map((r: any) => Number(r.anio))])
  ).sort((a, b) => b - a)

  // ---------- Movimientos del año (solo los confirmados suman) ----------
  const movimientos: Mov[] = (movs ?? []).map((m: any) => ({
    fecha: m.fecha as string,
    tipo: m.tipo as string,
    monto: Number(m.monto_usd),
    estado: (m.estado as string) ?? 'confirmado',
    metodo: (m.metodo_retiro as string | null) ?? null,
  }))
  const confirmados = movimientos.filter((m) => m.estado === 'confirmado')

  const suma = (tipo: string, lista = confirmados) =>
    lista.filter((m) => m.tipo === tipo).reduce((acc, m) => acc + m.monto, 0)

  const totalDividendos = suma('credito_dividendo')
  const totalBono = suma('credito_bono_expansion')
  const totalReferidos = suma('credito_referido')
  const totalGanado = totalDividendos + totalBono + totalReferidos
  const totalRetiros = suma('retiro')
  const totalAjustes = suma('ajuste')

  // ---------- Mes a mes ----------
  const meses = MESES.map((nombre, i) => {
    const delMes = confirmados.filter((m) => new Date(m.fecha).getUTCMonth() === i)
    const dividendo = suma('credito_dividendo', delMes)
    const bono = suma('credito_bono_expansion', delMes)
    const referido = suma('credito_referido', delMes)
    return {
      nombre,
      dividendo,
      bono,
      referido,
      ganado: dividendo + bono + referido,
      retiro: suma('retiro', delMes),
    }
  })

  // ---------- Lo que le corresponde por equipo ----------
  const dividendosPorFraccion = new Map<string, { anio: number; total: number }>()
  for (const d of dividendos ?? []) {
    const id = (d as any).fraccion_id as string
    const acc = dividendosPorFraccion.get(id) ?? { anio: 0, total: 0 }
    const monto = Number((d as any).monto_usd)
    acc.total += monto
    if (new Date((d as any).fecha_acreditacion).getUTCFullYear() === anio) acc.anio += monto
    dividendosPorFraccion.set(id, acc)
  }

  const equipos: FilaEquipo[] = (fracciones ?? []).map((f: any) => {
    const equipo = Array.isArray(f.equipo) ? f.equipo[0] ?? null : f.equipo ?? null
    const divs = dividendosPorFraccion.get(f.id) ?? { anio: 0, total: 0 }
    return {
      serie: (equipo?.numero_serie as string) ?? '—',
      modelo: (equipo?.modelo as string) ?? '—',
      estado: f.estado as string,
      origen: f.origen as string,
      participaciones: Number(f.cantidad_participaciones ?? 0),
      porcentaje: Number(f.porcentaje_propiedad ?? 0),
      aportado: Number(f.monto_aportado_usd ?? 0),
      divAnio: divs.anio,
      divTotal: divs.total,
    }
  })

  // ---------- Hojas del Excel ----------
  const hojas: Hoja[] = [
    {
      nombre: 'Resumen',
      anchos: [34, 34],
      filas: [
        ['Concepto', 'Valor'],
        ['Inversionista', inversionista.nombre ?? ''],
        ['Cédula / identificación', inversionista.cedula ?? ''],
        ['Correo', inversionista.email ?? ''],
        ['Año del informe', anio],
        ['Generado el (UTC)', { fecha: new Date().toISOString().slice(0, 10) }],
        ['', ''],
        ['Dividendos', { usd: totalDividendos }],
        ['Bono de expansión', { usd: totalBono }],
        ['Comisiones de referido', { usd: totalReferidos }],
        ['TOTAL GANADO EN EL AÑO', { usd: totalGanado }],
        ['Retiros confirmados', { usd: totalRetiros }],
        ['Ajustes', { usd: totalAjustes }],
        ['', ''],
        ['Notas', 'Solo suman movimientos con estado "confirmado". Fechas y corte de año en UTC.'],
        ['', 'Informe generado por la plataforma con fines informativos; no constituye asesoría fiscal.'],
      ],
    },
    {
      nombre: 'Mensual',
      anchos: [14, 16, 20, 20, 16, 16],
      filas: [
        ['Mes', 'Dividendos', 'Bono de expansión', 'Comisiones de referido', 'Total ganado', 'Retiros'],
        ...meses.map((m) => [
          m.nombre,
          { usd: m.dividendo },
          { usd: m.bono },
          { usd: m.referido },
          { usd: m.ganado },
          { usd: m.retiro },
        ]),
        [
          'TOTAL',
          { usd: totalDividendos },
          { usd: totalBono },
          { usd: totalReferidos },
          { usd: totalGanado },
          { usd: totalRetiros },
        ],
      ],
    },
    {
      nombre: 'Por equipo',
      anchos: [18, 30, 14, 18, 16, 14, 16, 20, 22],
      filas: [
        [
          'Equipo', 'Modelo', 'Estado', 'Origen', 'Participaciones', '% propiedad',
          'Aportado (USD)', `Dividendos ${anio}`, 'Dividendos acumulados',
        ],
        ...equipos.map((e) => [
          e.serie,
          e.modelo,
          e.estado,
          e.origen,
          e.participaciones,
          { pct: e.porcentaje },
          { usd: e.aportado },
          { usd: e.divAnio },
          { usd: e.divTotal },
        ]),
      ],
    },
    {
      nombre: 'Movimientos',
      anchos: [14, 24, 16, 14, 18],
      filas: [
        ['Fecha', 'Tipo', 'Monto (USD)', 'Estado', 'Método de retiro'],
        ...movimientos.map((m) => [
          { fecha: fechaIso(m.fecha) },
          ETIQUETAS_TIPO[m.tipo] ?? m.tipo,
          { usd: m.monto },
          m.estado,
          m.metodo ? ETIQUETAS_RETIRO[m.metodo] ?? m.metodo : '',
        ]),
      ],
    },
  ]

  const stats = [
    { label: `Ganado en ${anio}`, value: totalGanado, icon: TrendingUp },
    { label: `Retirado en ${anio}`, value: totalRetiros, icon: Wallet },
    {
      label: 'Dividendos acumulados (todos los años)',
      value: equipos.reduce((acc, e) => acc + e.divTotal, 0),
      icon: PieChart,
    },
  ]

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-xl text-ink">Informe fiscal</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Cuánto has ganado y cuánto te corresponde por cada equipo, con los datos al día. Descarga
            el Excel y pásaselo a tu contador.
          </p>
        </div>
        <DescargaInformeFiscal hojas={hojas} nombreArchivo={`informe-fiscal-${anio}.xlsx`} />
      </div>

      {/* Selector de año */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-muted">Año</span>
        {aniosDisponibles.map((a) => (
          <Link
            key={a}
            href={`/inversionista/informe?anio=${a}`}
            className={`rounded-full border px-3 py-1 font-mono text-sm transition ${
              a === anio
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-muted hover:text-ink'
            }`}
          >
            {a}
          </Link>
        ))}
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-line bg-surface p-5">
            <Icon className="h-4 w-4 text-accent" strokeWidth={2} />
            <p className="mt-4 font-mono text-2xl text-ink">{usd(value)}</p>
            <p className="mt-1 text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Desglose del año */}
      <section>
        <h2 className="mb-4 font-display text-lg text-ink">Lo que ganaste en {anio}</h2>
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <tbody>
              {[
                ['Dividendos', totalDividendos],
                ['Bono de expansión', totalBono],
                ['Comisiones de referido', totalReferidos],
              ].map(([label, valor]) => (
                <tr key={label as string} className="border-b border-line">
                  <td className="px-4 py-3 text-ink">{label}</td>
                  <td className="px-4 py-3 text-right font-mono text-ink">{usd(valor as number)}</td>
                </tr>
              ))}
              <tr className="border-b border-line">
                <td className="px-4 py-3 font-medium text-ink">Total ganado</td>
                <td className="px-4 py-3 text-right font-mono text-accent">{usd(totalGanado)}</td>
              </tr>
              <tr className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-muted">Retiros confirmados</td>
                <td className="px-4 py-3 text-right font-mono text-muted">{usd(totalRetiros)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Mes a mes */}
      <section>
        <h2 className="mb-4 font-display text-lg text-ink">Mes a mes</h2>
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Mes</th>
                <th className="px-4 py-3 text-right font-medium">Dividendos</th>
                <th className="px-4 py-3 text-right font-medium">Bono de expansión</th>
                <th className="px-4 py-3 text-right font-medium">Referidos</th>
                <th className="px-4 py-3 text-right font-medium">Total ganado</th>
                <th className="px-4 py-3 text-right font-medium">Retiros</th>
              </tr>
            </thead>
            <tbody>
              {meses.map((m) => (
                <tr key={m.nombre} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink">{m.nombre}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted">{m.dividendo ? usd(m.dividendo) : '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted">{m.bono ? usd(m.bono) : '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted">{m.referido ? usd(m.referido) : '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-accent">{m.ganado ? usd(m.ganado) : '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted">{m.retiro ? usd(m.retiro) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Por equipo */}
      <section>
        <h2 className="mb-1 font-display text-lg text-ink">Lo que te corresponde por equipo</h2>
        <p className="mb-4 text-xs text-muted">
          Cada participación reparte lo mismo; tu porcentaje depende de cuántas participaciones tienes
          sobre el total del equipo.
        </p>
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Equipo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Participaciones</th>
                <th className="px-4 py-3 text-right font-medium">% del equipo</th>
                <th className="px-4 py-3 text-right font-medium">Aportado</th>
                <th className="px-4 py-3 text-right font-medium">Dividendos {anio}</th>
                <th className="px-4 py-3 text-right font-medium">Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {equipos.map((e, i) => (
                <tr key={`${e.serie}-${i}`} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono text-ink">{e.serie}</td>
                  <td className="px-4 py-3 text-muted">{e.estado}</td>
                  <td className="px-4 py-3 text-right font-mono text-ink">{e.participaciones.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-ink">{(e.porcentaje * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono text-muted">{usd(e.aportado)}</td>
                  <td className="px-4 py-3 text-right font-mono text-accent">{usd(e.divAnio)}</td>
                  <td className="px-4 py-3 text-right font-mono text-ink">{usd(e.divTotal)}</td>
                </tr>
              ))}
              {equipos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    Todavía no tienes participaciones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-muted">
        Este informe es informativo y no constituye asesoría fiscal; tu contador determina cómo
        declarar estos ingresos. Solo suman los movimientos confirmados.
      </p>
    </div>
  )
}
