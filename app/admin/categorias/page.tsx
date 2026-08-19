import { ListaInversionistasCategoria } from '@/components/admin/admin-categoria-socio'

export default function AdminCategoriasPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Inversionistas
        </p>
        <h1 className="mt-1 font-display text-2xl text-ink">Categorías de socio</h1>
      </div>

      <ListaInversionistasCategoria />
    </div>
  )
}
