'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, PlusCircle, Cpu, UserPlus, Coins, Layers } from 'lucide-react'

// -------------------------------------------------------------
// Para agregar una ruta nueva al menú del Mothership, solo hay
// que agregar un objeto aquí. Cuando construyas /admin/pagos,
// etc., van aquí.
// -------------------------------------------------------------
const ENLACES = [
  { href: '/admin', label: 'Panel general', icon: LayoutDashboard, exact: true },
  { href: '/admin/fases', label: 'Fases de inversión', icon: Layers, exact: false },
  { href: '/admin/categorias', label: 'Categorías de socio', icon: Users, exact: false },
  { href: '/admin/equipos/nuevo', label: 'Nuevo equipo', icon: Cpu, exact: false },
  { href: '/admin/clientes/nuevo', label: 'Nuevo cliente', icon: UserPlus, exact: false },
  { href: '/admin/fracciones/nueva', label: 'Nueva fracción', icon: Coins, exact: false },
  { href: '/admin/asignaciones/nueva', label: 'Nueva asignación', icon: PlusCircle, exact: false },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {ENLACES.map(({ href, label, icon: Icon, exact }) => {
        const activo = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              activo
                ? 'bg-accent/10 text-accent font-medium'
                : 'text-muted hover:text-ink hover:bg-surface'
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
