import { ListaFases } from '@/components/admin/lista-fases'

export default function FasesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Inversionistas</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Fases de inversión</h1>
      </div>

      <ListaFases />
    </div>
  )
}
