'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/inversionista', label: 'Resumen' },
  { href: '/inversionista/reporte', label: 'Reporte anual' },
  { href: '/inversionista/informe', label: 'Informe fiscal' },
  { href: '/inversionista/reinversion', label: 'Mi reinversión' },
]

export function InversionistaNavTabs() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b border-line">
      {TABS.map((tab) => {
        const activo = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              activo
                ? 'border-accent text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
