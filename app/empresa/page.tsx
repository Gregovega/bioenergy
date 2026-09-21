import { createClient } from '@/lib/supabase/server'
import { Wallet, TrendingUp, Landmark, Layers } from 'lucide-react'
import { FormGastoEmpresa } from '@/components/admin/form-gasto-empresa'
import { FormPorcentajesEmpresa } from '@/components/admin/form-porcentajes-empresa'
import { TablaGastosEmpresa } from '@/components/admin/tabla-gastos-empresa'

// =============================================================
// PÁGINA: /admin/empresa  (punto 3 — panel de la empresa)
// Muestra de dónde sale el dinero de la empresa (fondo operativo +
// margen − comisiones de referido), cómo se reparte entre CAJA CHICA
// y RESERVA (porcentajes editables), cuánto hay disponible en cada
// una y permite registrar gastos que se descuentan de ESA bolsa,
// no del total. Todo el cálculo vive en la base de datos
// (fn_panel_empresa); aquí solo se muestra.
// Solo rol super_admin / admin (lo valida la propia base de datos).
// =============================================================

type Bolsa = {
  asignado: number
  gastado: number
  disponible: number
  gastado_hoy: number
  gastado_mes: number
}

type PanelEmpresa = {
  ingreso_fondo_operativo: number
  ingreso_margen_empresa: number
  comisiones_referido_pagadas: number
  ganancia_neta_empresa: number
  base_distribuible: number
  ingreso_del_mes: number
  pct_caja_chica: number
  pct_reserva: number
  pct_suma_valida: boolean
  sin_asignar: number
  caja_chica: Bolsa
  reserva: Bolsa
}

function usd(n: number) {
  const signo = n < 0 ? '-' : ''
  return `${signo}$${Math.abs(Number(n)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function pct(n: number) {
  return `${Number((Number(n) * 100).toFixed(2))}%`
}

function TarjetaBolsa({
  titulo,
  descripcion,
  porcentaje,
  bolsa,
}: {
  titulo: string
  descripcion: string
  porcentaje: number
  bolsa: Bolsa
}) {
  const usado = bolsa.asignado > 0 ? Math.min(100, (bolsa.gastado / bolsa.asignado) * 100) : 0
  return (
    <div className="rounded-lg border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base text-ink">{titulo}</h3>
          <p className="mt-0.5 text-xs text-muted">{descripcion}</p>
        </div>
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
          {pct(porcentaje)} de la base
        </span>
      </div>

      <p className="mt-5 text-xs text-muted">Disponible para gastar</p>
      <p className="font-mono text-3xl text-ink">{usd(bolsa.disponible)}</p>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-accent" style={{ width: `${usado}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-muted">
        {usd(bolsa.gastado)} gastado de {usd(bolsa.asignado)} asignado
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
        <div>
          <p className="text-xs text-muted">Gastado hoy</p>
          <p className="font-mono text-lg text-ink">{usd(bolsa.gastado_hoy)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Gastado este mes</p>
          <p className="font-mono text-lg text-ink">{usd(bolsa.gastado_mes)}</p>
        </div>
      </div>
    </div>
  )
}

export default async function AdminEmpresaPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('fn_panel_empresa')

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-ink">Caja y reservas</h1>
        <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          Esta sección es solo para administradores financieros (rol admin o super_admin).
          {error ? ` Detalle: ${error.message}` : ''}
        </div>
      </div>
    )
  }

  const panel = data as PanelEmpresa

  const { data: gastos } = await supabase
    .from('empresa_gasto')
    .select('id, bolsa, monto_usd, concepto, categoria, fecha, estado, motivo_anulacion')
    .order('fecha', { ascending: false })
    .limit(100)

  const origen = [
    { label: 'Fondo operativo acumulado', value: panel.ingreso_fondo_operativo, icon: Wallet },
    { label: 'Margen de la empresa', value: panel.ingreso_margen_empresa, icon: TrendingUp },
    { label: 'Comisiones de referido pagadas (−)', value: panel.comisiones_referido_pagadas, icon: Landmark },
    { label: 'Base a distribuir', value: panel.base_distribuible, icon: Layers },
  ]

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Empresa</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Caja y reservas</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Lo que entra a la empresa se reparte en dos bolsas: caja chica (gastos del día a día) y
          reserva (equipos y otros fines). Cada gasto se descuenta de su bolsa, no del total.
        </p>
      </div>

      {!panel.pct_suma_valida && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          Los porcentajes de caja chica y reserva suman más de 100%. Corrígelos abajo; mientras tanto
          no se pueden registrar gastos.
        </div>
      )}

      {/* De dónde sale */}
      <section className="space-y-3">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {origen.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-lg border border-line bg-surface p-5">
              <Icon className="h-4 w-4 text-accent" strokeWidth={2} />
              <p className="mt-4 font-mono text-2xl text-ink">{usd(value)}</p>
              <p className="mt-1 text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">
          Ganancia neta de la empresa (margen − comisiones de referido):{' '}
          <span className="font-mono text-ink">{usd(panel.ganancia_neta_empresa)}</span> · Ingresado
          este mes: <span className="font-mono text-ink">{usd(panel.ingreso_del_mes)}</span>
          {panel.sin_asignar > 0 && (
            <>
              {' '}· Sin asignar a ninguna bolsa:{' '}
              <span className="font-mono text-ink">{usd(panel.sin_asignar)}</span>
            </>
          )}
        </p>
      </section>

      {/* Las dos bolsas */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TarjetaBolsa
          titulo="Caja chica"
          descripcion="Gastos operativos del día a día."
          porcentaje={panel.pct_caja_chica}
          bolsa={panel.caja_chica}
        />
        <TarjetaBolsa
          titulo="Reserva"
          descripcion="Compra de equipos y otros fines."
          porcentaje={panel.pct_reserva}
          bolsa={panel.reserva}
        />
      </section>

      {/* Acciones */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-display text-lg text-ink">Registrar un gasto</h2>
          <FormGastoEmpresa
            disponibleCajaChica={panel.caja_chica.disponible}
            disponibleReserva={panel.reserva.disponible}
            bloqueado={!panel.pct_suma_valida}
          />
        </div>
        <div className="space-y-3">
          <h2 className="font-display text-lg text-ink">Porcentajes de reparto</h2>
          <FormPorcentajesEmpresa
            pctCajaChica={panel.pct_caja_chica}
            pctReserva={panel.pct_reserva}
            baseDistribuible={panel.base_distribuible}
          />
        </div>
      </section>

      {/* Historial */}
      <section className="space-y-3">
        <h2 className="font-display text-lg text-ink">Historial de gastos</h2>
        <TablaGastosEmpresa gastos={(gastos ?? []) as any} />
      </section>
    </div>
  )
}
