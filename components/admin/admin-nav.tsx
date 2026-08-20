'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, PlusCircle } from 'lucide-react'

// -------------------------------------------------------------
// Para agregar una ruta nueva al menú del Mothership, solo hay
// que agregar un objeto aquí. Cuando construyas /admin/equipos,
// /admin/clientes, /admin/pagos, etc., van aquí.
// -------------------------------------------------------------
const ENLACES = [
  { href: '/admin', label: 'Panel general', icon: LayoutDashboard, exact: true },
  { href: '/admin/categorias', label: 'Categorías de socio', icon: Users, exact: false },
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
