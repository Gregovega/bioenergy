import { FormFase } from '@/components/admin/form-fase'

export default function NuevaFasePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Inversionistas</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Nueva fase de inversión</h1>
      </div>

      <FormFase />
    </div>
  )
}
