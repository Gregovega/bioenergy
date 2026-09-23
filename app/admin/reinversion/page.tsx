import { ReinversionCerrarRonda } from '@/components/admin/reinversion-cerrar-ronda'

export default function ReinversionPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Reinversión</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Cerrar ronda de reinversión</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Junta lo acumulado por los inversionistas que tienen la reinversión activa y, si hace
          falta, completa hasta un 30% del costo con capital de la empresa para comprar un equipo
          nuevo del stock.
        </p>
      </div>

      <ReinversionCerrarRonda />
    </div>
  )
}
