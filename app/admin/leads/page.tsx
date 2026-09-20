import { createClient } from '@/lib/supabase/server'
import { TablaLeads } from '@/components/admin/tabla-leads'

export default async function AdminLeadsPage() {
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('lead')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">CRM</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Leads</h1>
        <p className="mt-2 text-sm text-muted">
          Personas que dejaron sus datos desde la landing. Contáctalas y ve moviéndolas de estado;
          cuando estén listas, créales la cuenta desde "Nuevo cliente" o "Nueva participación" como
          siempre.
        </p>
      </div>

      <TablaLeads leads={leads ?? []} />
    </div>
  )
}
