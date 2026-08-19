import { ListaInversionistasCategoria } from '@/components/admin/AdminCategoriaSocio'

export default function CategoriasSocioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-lg text-ink">Categoría de socio</h1>
        <p className="mt-1 text-sm text-muted">
          Marca qué inversionistas son &quot;Fundador&quot; para que reciban el Bono de Expansión del Ecosistema.
        </p>
      </div>
      <ListaInversionistasCategoria />
    </div>
  )
}
