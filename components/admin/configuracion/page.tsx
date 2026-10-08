import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditorConfiguracion, type ItemConfig } from '@/components/admin/editor-configuracion'
import { EditorNivelesReferido, EditorHitosFidelidad } from '@/components/admin/editor-referidos-fidelidad'

// =============================================================
// PÁGINA: /admin/configuracion
// Valores del negocio que antes solo se cambiaban por SQL.
// Solo super_admin y admin. Las reglas de referidos siguen en su
// propia pantalla (Pagos y referidos).
// =============================================================

type Def = Omit<ItemConfig, 'valor'>

const MARKETPLACE: Def[] = [
  {
    clave: 'marketplace_comision_pct',
    etiqueta: 'Comisión del marketplace',
    ayuda:
      'Porcentaje que se cobra por cada venta entre inversionistas (se reparte mitad vendedor y mitad comprador).',
    tipo: 'porcentaje',
    min: 0,
    max: 20,
  },
  {
    clave: 'marketplace_banda_precio_pct',
    etiqueta: 'Banda de precio permitida',
    ayuda:
      'Cuánto puede alejarse el precio de venta del valor de referencia, hacia arriba o hacia abajo.',
    tipo: 'porcentaje',
    min: 0,
    max: 100,
  },
  {
    clave: 'marketplace_tenencia_minima_meses',
    etiqueta: 'Tenencia mínima para poder vender',
    ayuda: 'Meses que debe tener una participación antes de poder ponerla a la venta.',
    tipo: 'entero',
    unidad: 'meses',
    min: 0,
    max: 120,
  },
]

const PARTICIPACIONES: Def[] = [
  {
    clave: 'plazo_meses_default_fraccion',
    etiqueta: 'Plazo de dividendo por defecto',
    ayuda:
      'Meses que una participación NUEVA paga dividendo al inversionista, contados desde la compra. No cambia las que ya existen; esas se editan una por una en Plazos de participación.',
    tipo: 'entero',
    unidad: 'meses',
    min: 1,
    max: 240,
  },
  {
    clave: 'participacion_minimo_compra_usd',
    etiqueta: 'Compra mínima de participaciones',
    ayuda: 'Monto mínimo en dólares que un inversionista puede aportar en una compra.',
    tipo: 'usd',
    min: 1,
    max: 100000,
  },
]

const FIDELIDAD: Def[] = [
  {
    clave: 'fidelidad_puntos_por_pago_puntual',
    etiqueta: 'Puntos por pago puntual',
    ayuda: 'Puntos que gana un cliente cada vez que paga a tiempo.',
    tipo: 'entero',
    unidad: 'puntos',
    min: 0,
    max: 10000,
  },
  {
    clave: 'fidelidad_bono_racha_cada',
    etiqueta: 'Racha para ganar bono',
    ayuda: 'Cada cuántos pagos puntuales seguidos se entrega el bono de racha.',
    tipo: 'entero',
    unidad: 'pagos',
    min: 1,
    max: 120,
  },
  {
    clave: 'fidelidad_bono_racha_puntos',
    etiqueta: 'Puntos del bono de racha',
    ayuda: 'Puntos extra que se entregan al completar la racha.',
    tipo: 'entero',
    unidad: 'puntos',
    min: 0,
    max: 10000,
  },
  {
    clave: 'fidelidad_tolerancia_saldo_usd',
    etiqueta: 'Tolerancia de saldo para pago puntual',
    ayuda: 'Diferencia en dólares que se perdona al considerar que un pago está completo.',
    tipo: 'usd',
    min: 0,
    max: 1000,
  },
]

export default async function AdminConfiguracionPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: staff } = await supabase
    .from('staff')
    .select('rol')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!staff || !['super_admin', 'admin'].includes(staff.rol)) redirect('/admin')

  const todas = [...MARKETPLACE, ...PARTICIPACIONES, ...FIDELIDAD]
  const { data: filas } = await supabase
    .from('configuracion_global')
    .select('clave, valor')
    .in('clave', todas.map((d) => d.clave))

  const { data: nivelesData } = await supabase
    .from('configuracion_referido_nivel')
    .select('nivel, porcentaje')
    .order('nivel')
  const niveles = (nivelesData ?? []).map((n: any) => ({
    nivel: Number(n.nivel),
    porcentaje: Number(n.porcentaje),
  }))

  const { data: hitosFila } = await supabase
    .from('configuracion_global')
    .select('valor')
    .eq('clave', 'fidelidad_hitos_antiguedad_meses')
    .maybeSingle()
  let hitos: { meses: number; puntos: number }[] = []
  try {
    const crudo = JSON.parse(hitosFila?.valor ?? '{}')
    hitos = Object.entries(crudo)
      .map(([m, p]) => ({ meses: Number(m), puntos: Number(p) }))
      .filter((h) => Number.isFinite(h.meses) && Number.isFinite(h.puntos))
      .sort((x, y) => x.meses - y.meses)
  } catch {
    hitos = []
  }

  const valores = new Map(
    (filas ?? []).map((f: any) => [f.clave as string, f.valor as string | null] as [string, string | null])
  )
  const conValor = (defs: Def[]): ItemConfig[] =>
    defs.map((d) => ({ ...d, valor: valores.get(d.clave) ?? null }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Configuración</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Reglas del negocio</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Cambia aquí los valores que gobiernan el marketplace, las participaciones y la
          fidelidad. Cada cambio se aplica desde el momento en que lo guardas. Las reglas del
          programa de referidos están en Pagos y referidos.
        </p>
      </div>

      <EditorConfiguracion
        titulo="Marketplace"
        descripcion="Compra y venta de participaciones entre inversionistas."
        items={conValor(MARKETPLACE)}
      />
      <EditorConfiguracion
        titulo="Participaciones"
        descripcion="Reglas para las participaciones nuevas."
        items={conValor(PARTICIPACIONES)}
      />
      <EditorConfiguracion
        titulo="Fidelidad de clientes"
        descripcion="Puntos y bonos por pagar a tiempo."
        items={conValor(FIDELIDAD)}
      />
      <EditorHitosFidelidad hitos={hitos} />
      <EditorNivelesReferido niveles={niveles} />
    </div>
  )
}
