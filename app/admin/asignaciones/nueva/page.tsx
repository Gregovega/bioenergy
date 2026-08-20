import { FormAsignacion } from '@/components/admin/form-asignacion'

export default function NuevaAsignacionPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Equipos y asignaciones
        </p>
        <h1 className="mt-1 font-display text-2xl text-ink">Nueva asignación</h1>
      </div>

      <FormAsignacion />
    </div>
  )
}
