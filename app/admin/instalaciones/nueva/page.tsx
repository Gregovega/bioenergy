import { FormInstalacion } from '@/components/admin/form-instalacion'

export default function AdminNuevaInstalacionPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Técnicos</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Asignar instalación</h1>
      </div>
      <FormInstalacion />
    </div>
  )
}
