import { FormFraccion } from '@/components/admin/form-fraccion'

export default function NuevaFraccionPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Inversiones</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Nueva fracción / inversión</h1>
      </div>

      <FormFraccion />
    </div>
  )
}
