import { FormEquipo } from '@/components/admin/form-equipo'

export default function NuevoEquipoPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Equipos</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Nuevo equipo</h1>
      </div>

      <FormEquipo />
    </div>
  )
}
