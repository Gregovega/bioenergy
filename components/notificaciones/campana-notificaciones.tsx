'use client'

// =============================================================
// COMPONENTE: campana-notificaciones.tsx
// Reusable en los 3 portales (inversionista, cliente, staff).
// No necesita props: RLS de la tabla `notificacion` ya filtra
// automáticamente qué ve cada quien según su sesión.
// =============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Loader2 } from 'lucide-react'

type Notificacion = {
  id: string
  titulo: string
  mensaje: string
  leida: boolean
  created_at: string
}

export function CampanaNotificaciones() {
  const supabase = createClient()
  const [items, setItems] = useState<Notificacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [abierta, setAbierta] = useState(false)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setCargando(true)
    const { data } = await supabase
      .from('notificacion')
      .select('id, titulo, mensaje, leida, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    setItems(data ?? [])
    setCargando(false)
  }

  async function marcarLeida(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
    await supabase.from('notificacion').update({ leida: true }).eq('id', id)
  }

  async function marcarTodasLeidas() {
    const idsNoLeidas = items.filter((n) => !n.leida).map((n) => n.id)
    if (idsNoLeidas.length === 0) return
    setItems((prev) => prev.map((n) => ({ ...n, leida: true })))
    await supabase.from('notificacion').update({ leida: true }).in('id', idsNoLeidas)
  }

  const noLeidas = items.filter((n) => !n.leida).length

  return (
    <div className="relative">
      <button
        onClick={() => setAbierta((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" strokeWidth={2} />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-base">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierta && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierta(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-line bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-medium text-ink">Notificaciones</span>
              {noLeidas > 0 && (
                <button
                  onClick={marcarTodasLeidas}
                  className="text-xs text-accent hover:underline"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {cargando && (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando...
                </div>
              )}
              {!cargando && items.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-muted">
                  No tienes notificaciones todavía.
                </p>
              )}
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => marcarLeida(n.id)}
                  className={`block w-full border-b border-line px-4 py-3 text-left last:border-0 hover:bg-base ${
                    n.leida ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.leida && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                    <div className={n.leida ? 'pl-3.5' : ''}>
                      <p className="text-sm text-ink">{n.titulo}</p>
                      <p className="mt-0.5 text-xs text-muted">{n.mensaje}</p>
                      <p className="mt-1 text-[11px] text-muted">
                        {new Date(n.created_at).toLocaleString('es-VE')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
