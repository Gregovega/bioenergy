import { Zap } from 'lucide-react'

// =============================================================
// COMPONENTE: logo-bioenergy.tsx
// Logo de Bioenergy reutilizable (marca del rayo + nombre).
// Tamaños: sm (menús pequeños), md (cabecera de portales), lg (login/landing).
// Usarlo así:  <LogoBioenergy size="md" />
// =============================================================

const TAMANOS = {
  sm: { caja: 'h-7 w-7 rounded-lg', icono: 'h-4 w-4', texto: 'text-lg', gap: 'gap-2' },
  md: { caja: 'h-10 w-10 rounded-xl', icono: 'h-6 w-6', texto: 'text-2xl', gap: 'gap-3' },
  lg: { caja: 'h-14 w-14 rounded-2xl', icono: 'h-8 w-8', texto: 'text-4xl', gap: 'gap-3.5' },
} as const

export function LogoBioenergy({
  size = 'md',
  className = '',
}: {
  size?: keyof typeof TAMANOS
  className?: string
}) {
  const t = TAMANOS[size]

  return (
    <span className={`inline-flex items-center ${t.gap} ${className}`}>
      <span
        className={`flex shrink-0 items-center justify-center bg-accent ${t.caja}`}
        style={{ boxShadow: '0 0 24px rgba(242,183,5,0.35)' }}
      >
        <Zap
          className={t.icono}
          strokeWidth={2.5}
          fill="currentColor"
          style={{ color: '#111418' }}
        />
      </span>
      <span className={`font-display font-semibold leading-none tracking-tight ${t.texto}`}>
        <span className="text-ink">Bio</span>
        <span className="text-accent">energy</span>
      </span>
    </span>
  )
}
