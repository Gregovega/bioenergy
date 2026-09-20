import { createClient } from '@/lib/supabase/server'
import { TarjetaInstalacion } from '@/components/tecnico/tarjeta-instalacion'

export default async function TecnicoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: instalaciones } = await supabase
    .from('instalacion')
    .select(
      'id, estado, fecha_programada, fecha_completada, numero_serie_confirmado, notas, equipo(numero_serie, modelo), cliente:cliente_id(nombre, direccion_fisica)'
    )
    .order('estado', { ascending: true })
    .order('fecha_programada', { ascending: true })

  const lista = (instalaciones ?? []) as any[]
  const pendientes = lista.filter((i) => i.estado === 'pendiente')
  const completadas = lista.filter((i) => i.estado !== 'pendiente')

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Tu día</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Instalaciones asignadas</h1>
      </div>

      {lista.length === 0 && (
        <p className="text-sm text-muted">No tienes instalaciones asignadas todavía.</p>
      )}

      {pendientes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted">Pendientes ({pendientes.length})</h2>
          {pendientes.map((i) => (
            <TarjetaInstalacion key={i.id} instalacion={i} userId={user!.id} />
          ))}
        </section>
      )}

      {completadas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted">Historial</h2>
          {completadas.map((i) => (
            <TarjetaInstalacion key={i.id} instalacion={i} userId={user!.id} />
          ))}
        </section>
      )}
    </div>
  )
}
