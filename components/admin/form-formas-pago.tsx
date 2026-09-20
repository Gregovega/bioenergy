'use client'

// =============================================================
// COMPONENTE: form-formas-pago.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE: CRUD de las formas de pago que ve el cliente en su
// portal (banco, pago móvil, Zelle, cripto, etc). Nada de esto
// queda codificado — todo vive en la tabla forma_pago y se edita
// aquí mismo.
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Pencil, X, Check, Loader2 } from 'lucide-react'

type FormaPago = {
  id: string
  nombre: string
  titular: string | null
  identificador: string | null
  detalle_1: string | null
  detalle_1_etiqueta: string | null
  detalle_2: string | null
  detalle_2_etiqueta: string | null
  notas: string | null
  activo: boolean
  orden: number
}

const VACIO: Omit<FormaPago, 'id' | 'activo' | 'orden'> = {
  nombre: '',
  titular: '',
  identificador: '',
  detalle_1: '',
  detalle_1_etiqueta: 'Número de cuenta',
  detalle_2: '',
  detalle_2_etiqueta: '',
  notas: '',
}

export function FormFormasPago({ formasPago }: { formasPago: FormaPago[] }) {
  const supabase = createClient()
  const router = useRouter()

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [form, setForm] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function empezarEdicion(fp: FormaPago) {
    setEditandoId(fp.id)
    setCreando(false)
    setForm({
      nombre: fp.nombre,
      titular: fp.titular ?? '',
      identificador: fp.identificador ?? '',
      detalle_1: fp.detalle_1 ?? '',
      detalle_1_etiqueta: fp.detalle_1_etiqueta ?? 'Número de cuenta',
      detalle_2: fp.detalle_2 ?? '',
      detalle_2_etiqueta: fp.detalle_2_etiqueta ?? '',
      notas: fp.notas ?? '',
    })
  }

  function cancelar() {
    setEditandoId(null)
    setCreando(false)
    setForm(VACIO)
    setError(null)
  }

  async function guardar(idExistente: string | null) {
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio (ej. "Banco Mercantil", "Zelle").')
      return
    }
    setGuardando(true)
    setError(null)

    const payload = {
      nombre: form.nombre.trim(),
      titular: form.titular?.trim() || null,
      identificador: form.identificador?.trim() || null,
      detalle_1: form.detalle_1?.trim() || null,
      detalle_1_etiqueta: form.detalle_1_etiqueta?.trim() || null,
      detalle_2: form.detalle_2?.trim() || null,
      detalle_2_etiqueta: form.detalle_2_etiqueta?.trim() || null,
      notas: form.notas?.trim() || null,
    }

    const { error: err } = idExistente
      ? await supabase.from('forma_pago').update(payload).eq('id', idExistente)
      : await supabase.from('forma_pago').insert({ ...payload, orden: formasPago.length })

    setGuardando(false)

    if (err) {
      setError('No se pudo guardar: ' + err.message)
      return
    }

    cancelar()
    router.refresh()
  }

  async function alternarActivo(fp: FormaPago) {
    await supabase.from('forma_pago').update({ activo: !fp.activo }).eq('id', fp.id)
    router.refresh()
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta forma de pago? Los clientes ya no la verán.')) return
    await supabase.from('forma_pago').delete().eq('id', id)
    router.refresh()
  }

  function Campos() {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">
            Nombre (ej. Banco Mercantil, Pago Móvil, Zelle, USDT)
          </label>
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Titular</label>
          <input
            value={form.titular ?? ''}
            onChange={(e) => setForm({ ...form, titular: e.target.value })}
            className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">RIF / Cédula del titular</label>
          <input
            value={form.identificador ?? ''}
            onChange={(e) => setForm({ ...form, identificador: e.target.value })}
            className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Etiqueta del dato 1</label>
          <input
            value={form.detalle_1_etiqueta ?? ''}
            onChange={(e) => setForm({ ...form, detalle_1_etiqueta: e.target.value })}
            placeholder="Número de cuenta / Teléfono / Email / Wallet"
            className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Dato 1</label>
          <input
            value={form.detalle_1 ?? ''}
            onChange={(e) => setForm({ ...form, detalle_1: e.target.value })}
            className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Etiqueta del dato 2 (opcional)</label>
          <input
            value={form.detalle_2_etiqueta ?? ''}
            onChange={(e) => setForm({ ...form, detalle_2_etiqueta: e.target.value })}
            placeholder="Ej. Red / Tipo de cuenta"
            className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Dato 2 (opcional)</label>
          <input
            value={form.detalle_2 ?? ''}
            onChange={(e) => setForm({ ...form, detalle_2: e.target.value })}
            className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">Notas para el cliente (opcional)</label>
          <textarea
            value={form.notas ?? ''}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            rows={2}
            className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {formasPago.map((fp) => (
        <div key={fp.id} className="rounded-lg border border-line bg-surface p-4">
          {editandoId === fp.id ? (
            <div className="space-y-3">
              <Campos />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => guardar(fp.id)}
                  disabled={guardando}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-base disabled:opacity-50"
                >
                  {guardando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Guardar
                </button>
                <button
                  onClick={cancelar}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{fp.nombre}</p>
                  {!fp.activo && (
                    <span className="rounded-full bg-muted/10 px-2 py-0.5 text-[11px] text-muted">
                      Oculta a clientes
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-0.5 text-xs text-muted">
                  {fp.titular && <p>Titular: {fp.titular}</p>}
                  {fp.identificador && <p>RIF/CI: {fp.identificador}</p>}
                  {fp.detalle_1 && (
                    <p>
                      {fp.detalle_1_etiqueta ?? 'Dato'}: <span className="font-mono text-ink">{fp.detalle_1}</span>
                    </p>
                  )}
                  {fp.detalle_2 && (
                    <p>
                      {fp.detalle_2_etiqueta ?? 'Dato'}: <span className="font-mono text-ink">{fp.detalle_2}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => alternarActivo(fp)}
                  className="rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:text-ink"
                >
                  {fp.activo ? 'Ocultar' : 'Activar'}
                </button>
                <button
                  onClick={() => empezarEdicion(fp)}
                  className="rounded-md border border-line p-1.5 text-muted hover:text-ink"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => eliminar(fp.id)}
                  className="rounded-md border border-line p-1.5 text-muted hover:text-alert"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {creando ? (
        <div className="rounded-lg border border-dashed border-line p-4">
          <div className="space-y-3">
            <Campos />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => guardar(null)}
                disabled={guardando}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-base disabled:opacity-50"
              >
                {guardando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Guardar
              </button>
              <button
                onClick={cancelar}
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted"
              >
                <X className="h-3.5 w-3.5" />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setCreando(true)
            setEditandoId(null)
            setForm(VACIO)
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-line px-3 py-2 text-xs font-medium text-muted hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar forma de pago
        </button>
      )}
    </div>
  )
}
