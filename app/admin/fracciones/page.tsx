import { createClient } from '@/lib/supabase/server'
import { EditorPlazoFraccion } from '@/components/admin/editor-plazo-fraccion'

// =============================================================
// PÁGINA: /admin/fracciones
// Lista todas las participaciones activas y permite editar el
// plazo de pago (plazo_meses) de cada una por separado. Sirve para
// negociar con inversionistas grandes más años de dividendo.
// Pasado el plazo, el dividendo de esa participación pasa a la empresa.
// =============================================================

function sumarMeses(fechaISO: string, meses: number) {
  const d = new Date(fechaISO)
  d.setMonth(d.getMonth() + meses)
  return d
}

export default async function AdminFraccionesPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('fraccion')
    .select(
      'id, cantidad_participaciones, monto_aportado_usd, fecha_compra, plazo_meses, estado, inversionista(nombre), equipo(numero_serie, modelo)'
    )
    .eq('estado', 'activa')
    .order('fecha_compra', { ascending: false })

  const fracciones = (data ?? []).map((f: any) => ({
    ...f,
    inversionista: Array.isArray(f.inversionista) ? f.inversionista[0] ?? null : f.inversionista ?? null,
    equipo: Array.isArray(f.equipo) ? f.equipo[0] ?? null : f.equipo ?? null,
  }))

  const ahora = new Date()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Participaciones</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Plazo de pago por participación</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Cada participación paga dividendo al inversionista hasta que se cumple su plazo, contado
          desde la fecha de compra. Después, ese ingreso pasa a la empresa. Cambia el plazo solo en
          las participaciones que negociaste distinto al estándar.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Inversionista</th>
              <th className="px-4 py-3 font-medium">Equipo</th>
              <th className="px-4 py-3 font-medium">Participaciones</th>
              <th className="px-4 py-3 font-medium">Compra</th>
              <th className="px-4 py-3 font-medium">Plazo y vencimiento</th>
            </tr>
          </thead>
          <tbody>
            {fracciones.map((f: any) => {
              const vence = sumarMeses(f.fecha_compra, Number(f.plazo_meses))
              const vencida = vence <= ahora
              return (
                <tr key={f.id} className="border-b border-line last:border-0 align-top">
                  <td className="px-4 py-3 text-ink">{f.inversionista?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-muted">
                    {f.equipo?.numero_serie ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">
                    {Number(f.cantidad_participaciones ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(f.fecha_compra).toLocaleDateString('es-VE')}
                  </td>
                  <td className="px-4 py-3">
                    <EditorPlazoFraccion
                      fraccionId={f.id}
                      plazoInicial={Number(f.plazo_meses)}
                      fechaCompra={f.fecha_compra}
                    />
                    {vencida && (
                      <p className="mt-1 text-[11px] text-muted">
                        Plazo cumplido: el dividendo ya va a la empresa.
                      </p>
                    )}
                  </td>
                </tr>
              )
            })}
            {fracciones.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No hay participaciones activas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
