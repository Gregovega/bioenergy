import { FidelidadAdmin } from '@/components/admin/fidelidad-admin'

export default function AdminFidelidadPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Clientes</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Programa de fidelidad</h1>
      </div>

      <FidelidadAdmin />
    </div>
  )
}
