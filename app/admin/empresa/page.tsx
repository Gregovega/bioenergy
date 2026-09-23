import { createClient } from '@/lib/supabase/server'
import { FormGastoEmpresa } from '@/components/admin/form-gasto-empresa'
import { FormPorcentajesEmpresa } from '@/components/admin/form-porcentajes-empresa'
import { TablaGastosEmpresa } from '@/components/admin/tabla-gastos-empresa'
import { Wallet, PiggyBank, TrendingUp, AlertTriangle } from 'lucide-react'

function usd(n: number) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function EmpresaPage() {
  const supabase = await createClient()

  const [{ data: panel, error: errorPanel }, { data: gastos }] = await Promise.all([
    supabase.rpc('fn_panel_empresa'),
    supabase
      .from('empresa_gasto')
      .select('id, bolsa, monto_usd, concepto, categoria, fecha, estado, motivo_anulacion')
      .order('fecha', { ascending: false })
      .limit(100),
  ])

  // fn_panel_empresa ya rechaza el acceso si el staff no es admin financiero
  // (is_admin_financiero: rol super_admin o admin), así que si viene error
  // asumimos que es un tema de permisos y lo mostramos en vez de romper la página.
  if (errorPanel || !panel) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            Finanzas
          </p>
          <h1 className="mt-1 font-display text-2xl text-ink">Caja y reservas</h1>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            No se pudo cargar el panel de empresa. Este panel solo está disponible para staff con
            rol super_admin o admin.
          </span>
        </div>
      </div>
    )
  }

  const p = panel as {
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
    caja_chica: { asignado: number; gastado: number; disponible: number; gastado_hoy: number; gastado_mes: number; tope_diario: number; disponible_hoy: number }
    reserva: { asignado: number; gastado: number; disponible: number; gastado_hoy: number; gastado_mes: number }
  }

  const stats = [
    { label: 'Fondo operativo acumulado', value: p.ingreso_fondo_operativo, icon: Wallet },
    { label: 'Margen de empresa acumulado', value: p.ingreso_margen_empresa, icon: TrendingUp },
    { label: 'Comisiones de referido pagadas', value: p.comisiones_referido_pagadas, icon: Wallet },
    { label: 'Ganancia neta de la empresa', value: p.ganancia_neta_empresa, icon: PiggyBank },
  ]

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Finanzas</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Caja y reservas</h1>
        <p className="mt-1 text-sm text-muted">
          Origen del dinero de la empresa y cuánto hay disponible para gastar en caja chica y
          reserva, sin tocar el capital de los inversionistas.
        </p>
      </div>

      {/* Franja de métricas de origen */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-line bg-surface p-5">
            <Icon className="h-4 w-4 text-accent" strokeWidth={2} />
            <p className="mt-4 font-mono text-2xl text-ink">{usd(value)}</p>
            <p className="mt-1 text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted">
        Base distribuible este período: <span className="font-mono text-ink">{usd(p.base_distribuible)}</span>
        {' · '}Ingreso del mes: <span className="font-mono text-ink">{usd(p.ingreso_del_mes)}</span>
      </p>

      {!p.pct_suma_valida && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Los porcentajes de caja chica y reserva suman más de 100%. Corrígelos abajo.</span>
        </div>
      )}

      {/* Caja chica y reserva, lado a lado */}
      <section>
        <h2 className="mb-4 font-display text-lg text-ink">Bolsas disponibles</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Caja chica</p>
            <p className="mt-2 font-mono text-2xl text-ink">{usd(p.caja_chica.disponible)}</p>
            <p className="mt-1 text-xs text-muted">disponible para usar</p>
            <div className="mt-4 space-y-1 text-xs text-muted">
              <p>Asignado: <span className="font-mono text-ink">{usd(p.caja_chica.asignado)}</span></p>
              <p>Gastado hoy: <span className="font-mono text-ink">{usd(p.caja_chica.gastado_hoy)}</span> de <span className="font-mono text-ink">{usd(p.caja_chica.tope_diario)}</span> tope diario</p>
              <p>Gastado este mes: <span className="font-mono text-ink">{usd(p.caja_chica.gastado_mes)}</span></p>
              <p>Disponible hoy: <span className="font-mono text-ink">{usd(p.caja_chica.disponible_hoy)}</span></p>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Reserva</p>
            <p className="mt-2 font-mono text-2xl text-ink">{usd(p.reserva.disponible)}</p>
            <p className="mt-1 text-xs text-muted">para compra de equipos u otros fines</p>
            <div className="mt-4 space-y-1 text-xs text-muted">
              <p>Asignado: <span className="font-mono text-ink">{usd(p.reserva.asignado)}</span></p>
              <p>Gastado hoy: <span className="font-mono text-ink">{usd(p.reserva.gastado_hoy)}</span></p>
              <p>Gastado este mes: <span className="font-mono text-ink">{usd(p.reserva.gastado_mes)}</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Registrar gasto y ajustar porcentajes */}
      <section>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h2 className="mb-4 font-display text-lg text-ink">Registrar gasto</h2>
            <FormGastoEmpresa
              disponibleCajaChica={p.caja_chica.disponible_hoy}
              disponibleReserva={p.reserva.disponible}
              bloqueado={!p.pct_suma_valida}
            />
          </div>
          <div>
            <h2 className="mb-4 font-display text-lg text-ink">Porcentajes de asignación</h2>
            <FormPorcentajesEmpresa
              pctCajaChica={p.pct_caja_chica}
              pctReserva={p.pct_reserva}
              baseDistribuible={p.base_distribuible}
            />
          </div>
        </div>
      </section>

      {/* Historial de gastos */}
      <section>
        <h2 className="mb-4 font-display text-lg text-ink">Historial de gastos</h2>
        <TablaGastosEmpresa gastos={gastos ?? []} />
      </section>
    </div>
  )
}
