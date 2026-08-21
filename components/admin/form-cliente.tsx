// =============================================================
// COMPONENTE: form-cliente.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: registra un cliente final nuevo (sin necesitar que
// ya tenga cuenta de usuario — user_id se vincula después, cuando
// el cliente cree su cuenta de acceso al portal).
// =============================================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function FormCliente() {
  const supabase = createClient()
  const router = useRouter()

  const [nombre, setNombre] = useState('')
  const [cedula, setCedula] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    setGuardando(true)
    const { error: errInsert } = await supabase.from('cliente_final').insert({
      nombre: nombre.trim(),
      cedula: cedula.trim() || null,
      telefono: telefono.trim() || null,
      direccion_fisica: direccion.trim() || null,
      estado_kyc: 'pendiente',
      estado_servicio: 'activo',
    })

    if (errInsert) {
      setError('No se pudo registrar el cliente: ' + errInsert.message)
      setGuardando(false)
      return
    }

    router.push('/admin/asignaciones/nueva')
    router.refresh()
  }

  return (
    <form onSubmit={guardar} className="space-y-6 rounded-lg border border-line bg-surface p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Nombre completo</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="María Pérez"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Cédula / RIF</label>
          <input
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="V-12345678"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Teléfono</label>
          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="0414-1234567"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">Dirección física</label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Av. Bolívar, Maracay, Aragua"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
      </div>

      <p className="text-[11px] text-muted">
        El cliente queda registrado con verificación KYC &quot;pendiente&quot; y servicio
        &quot;activo&quot;. Cuando cree su cuenta para entrar al portal, se vincula su usuario a
        este registro.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : 'Registrar cliente'}
      </button>
    </form>
  )
}
