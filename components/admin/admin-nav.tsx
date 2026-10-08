'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, PlusCircle, Cpu, UserPlus, Coins, Layers, Landmark, Contact, Wrench, Wallet, Award, Activity, Repeat2, Store, ListChecks, Settings, Bot, MessageSquare } from 'lucide-react'
export type RolStaff = 'super_admin' | 'admin' | 'crm' | 'atencion'

// -------------------------------------------------------------
// Para agregar una ruta nueva al menú del panel de administración,
// solo hay que agregar un objeto aquí.
//
// `roles`: qué roles de staff ven este link. Ajusta esta lista
// a mano cuando cambien las reglas del negocio — no hay lógica
// implícita, lo que ves aquí es exactamente quién lo ve.
//
// Los links se muestran como botones y, si no caben en el ancho
// de la pantalla, bajan a una segunda fila (flex-wrap).
// -------------------------------------------------------------
const TODOS: RolStaff[] = ['super_admin', 'admin', 'crm', 'atencion']

const ENLACES: { href: string; label: string; icon: any; exact: boolean; roles: RolStaff[] }[] = [
  { href: '/admin', label: 'Panel general', icon: LayoutDashboard, exact: true, roles: TODOS },
  { href: '/admin/leads', label: 'Leads (CRM)', icon: Contact, exact: false, roles: ['super_admin', 'admin', 'crm'] },
  { href: '/admin/fases', label: 'Fases de inversión', icon: Layers, exact: false, roles: ['super_admin', 'admin'] },
  { href: '/admin/categorias', label: 'Categorías de socio', icon: Users, exact: false, roles: ['super_admin', 'admin'] },
  { href: '/admin/pagos', label: 'Pagos y referidos', icon: Landmark, exact: false, roles: ['super_admin', 'admin', 'atencion'] },
  { href: '/admin/marketplace', label: 'Marketplace', icon: Store, exact: false, roles: ['super_admin', 'admin'] },
  { href: '/admin/equipos/nuevo', label: 'Nuevo equipo', icon: Cpu, exact: false, roles: ['super_admin', 'admin', 'atencion'] },
  { href: '/admin/instalaciones/nueva', label: 'Asignar instalación', icon: Wrench, exact: false, roles: ['super_admin', 'admin', 'atencion'] },
  { href: '/admin/clientes/nuevo', label: 'Nuevo cliente', icon: UserPlus, exact: false, roles: ['super_admin', 'admin', 'crm', 'atencion'] },
  { href: '/admin/fracciones', label: 'Plazos de participación', icon: ListChecks, exact: true, roles: ['super_admin', 'admin'] },
  { href: '/admin/fracciones/nueva', label: 'Nueva participación', icon: Coins, exact: false, roles: ['super_admin', 'admin', 'crm'] },
  { href: '/admin/asignaciones/nueva', label: 'Nueva asignación', icon: PlusCircle, exact: false, roles: ['super_admin', 'admin', 'atencion'] },
  { href: '/admin/empresa', label: 'Caja y reservas', icon: Wallet, exact: false, roles: ['super_admin', 'admin'] },
  { href: '/admin/reinversion', label: 'Reinversión', icon: Repeat2, exact: false, roles: ['super_admin', 'admin'] },
  { href: '/admin/fidelidad', label: 'Fidelidad', icon: Award, exact: false, roles: ['super_admin', 'admin', 'atencion'] },
  { href: '/admin/salud-negocio', label: 'Salud del negocio', icon: Activity, exact: false, roles: ['super_admin', 'admin'] },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings, exact: false, roles: ['super_admin', 'admin'] },
  { href: '/admin/asistente', label: 'Asistente IA', icon: MessageSquare, exact: false, roles: ['super_admin', 'admin'] },
  { href: '/admin/aprobaciones', label: 'Aprobaciones IA', icon: Bot, exact: false, roles: ['super_admin', 'admin', 'crm', 'atencion'] },
]

export function AdminNav({ rol }: { rol: RolStaff }) {
  const pathname = usePathname()
  const visibles = ENLACES.filter(({ roles }) => roles.includes(rol))

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {visibles.map(({ href, label, icon: Icon, exact }) => {
        const activo = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              activo
                ? 'border-accent/50 bg-accent/10 font-medium text-accent'
                : 'border-line bg-surface/40 text-muted hover:border-accent/30 hover:text-ink'
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
