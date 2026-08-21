import { FormCliente } from '@/components/admin/form-cliente'

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Clientes</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Nuevo cliente</h1>
      </div>

      <FormCliente />
    </div>
  )
}
